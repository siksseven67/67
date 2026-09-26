
import { useEffect, useState } from 'react'
import './App.css'

type Lesson = {
  id: string
  subject: string
  time: string
}

type Homework = {
  id: string
  subject: string
  text: string
  deadline: string
  done: boolean
}

type Schedule = Record<string, Lesson[]>

const days = [
  'Понедельник',
  'Вторник',
  'Среда',
  'Четверг',
  'Пятница',
  'Суббота',
  'Воскресенье'
]

const shortDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

const months = [
  'января', 'февраля', 'марта', 'апреля',
  'мая', 'июня', 'июля', 'августа',
  'сентября', 'октября', 'ноября', 'декабря'
]

function dateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function addDays(date: Date, amount: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + amount)
  return result
}

function monday(date: Date) {
  const result = new Date(date)
  result.setHours(12, 0, 0, 0)
  result.setDate(result.getDate() - ((result.getDay() + 6) % 7))
  return result
}

function makeId() {
  return crypto.randomUUID()
}

function subjectKey(value: string) {
  return value.trim().toLocaleLowerCase('ru-RU')
}

function formatDate(value: string) {
  if (!value) return ''

  const [year, month, day] = value.split('-')

  return `${day}.${month}.${year}`
}

function loadSchedule(): Schedule {
  try {
    const saved = localStorage.getItem('studyflow-v11-schedule')

    if (saved !== null) return JSON.parse(saved)

    const old = localStorage.getItem('studyflow-schedule')
    if (!old) return {}

    const parsed = JSON.parse(old) as Record<
      string,
      { subject: string; time: string }[]
    >

    const result: Schedule = {}
    const start = monday(new Date())

    days.forEach((name, index) => {
      result[dateKey(addDays(start, index))] =
        (parsed[name] || []).map(item => ({
          id: makeId(),
          subject: item.subject,
          time: item.time
        }))
    })

    return result
  } catch {
    return {}
  }
}

function loadHomework(): Homework[] {
  try {
    const saved = localStorage.getItem('studyflow-v11-homework')
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

function App() {
  const [selectedDate, setSelectedDate] = useState(() => new Date())

  const [schedule, setSchedule] = useState<Schedule>(loadSchedule)
  const [homework, setHomework] = useState<Homework[]>(loadHomework)

  const [subject, setSubject] = useState('')
  const [time, setTime] = useState('09:00')

  const [editingLesson, setEditingLesson] = useState<string | null>(null)
  const [task, setTask] = useState('')
  const [deadline, setDeadline] = useState(dateKey(new Date()))

  const weekStart = monday(selectedDate)
  const weekEnd = addDays(weekStart, 6)
  const selectedKey = dateKey(selectedDate)

  const lessons = [...(schedule[selectedKey] || [])].sort(
    (a, b) => a.time.localeCompare(b.time)
  )

  useEffect(() => {
    localStorage.setItem(
      'studyflow-v11-schedule',
      JSON.stringify(schedule)
    )
  }, [schedule])

  useEffect(() => {
    localStorage.setItem(
      'studyflow-v11-homework',
      JSON.stringify(homework)
    )
  }, [homework])

  function addLesson() {
    if (!subject.trim() || !time) return

    const lesson: Lesson = {
      id: makeId(),
      subject: subject.trim(),
      time
    }

    setSchedule(prev => ({
      ...prev,
      [selectedKey]: [...(prev[selectedKey] || []), lesson]
    }))

    setSubject('')
  }

  function deleteLesson(id: string) {
    if (!window.confirm('Удалить занятие?')) return

    setSchedule(prev => ({
      ...prev,
      [selectedKey]: (prev[selectedKey] || []).filter(
        item => item.id !== id
      )
    }))

    if (editingLesson === id) setEditingLesson(null)
  }

  function changeWeek(amount: number) {
    setSelectedDate(prev => addDays(prev, amount * 7))
    setEditingLesson(null)
  }

  function selectDay(date: Date) {
    setSelectedDate(date)
    setEditingLesson(null)
  }

  function copyPreviousWeek() {
    const previousStart = addDays(weekStart, -7)

    const hasLessons = Array.from({ length: 7 }, (_, index) =>
      schedule[dateKey(addDays(weekStart, index))] || []
    ).some(items => items.length > 0)

    if (
      hasLessons &&
      !window.confirm('Заменить занятия выбранной недели?')
    ) return

    const updated = { ...schedule }

    for (let index = 0; index < 7; index++) {
      const source = dateKey(addDays(previousStart, index))
      const target = dateKey(addDays(weekStart, index))

      updated[target] = (schedule[source] || []).map(item => ({
        ...item,
        id: makeId()
      }))
    }

    setSchedule(updated)
    setEditingLesson(null)
  }

  function openHomeworkForm(id: string) {
    setEditingLesson(id)
    setTask('')
    setDeadline(dateKey(new Date()))
  }

  function saveHomework(lesson: Lesson) {
    if (!task.trim() || !deadline) return

    const item: Homework = {
      id: makeId(),
      subject: lesson.subject,
      text: task.trim(),
      deadline,
      done: false
    }

    setHomework(prev => [...prev, item])

    setTask('')
    setEditingLesson(null)
  }

  function toggleHomework(id: string) {
    setHomework(prev => prev.map(item =>
      item.id === id
        ? { ...item, done: !item.done }
        : item
    ))
  }

  function deleteHomework(id: string) {
    if (!window.confirm('Удалить домашнее задание?')) return

    setHomework(prev => prev.filter(item => item.id !== id))
  }

  function tasksForSubject(name: string) {
    return homework
      .filter(item => subjectKey(item.subject) === subjectKey(name))
      .sort((a, b) => a.deadline.localeCompare(b.deadline))
  }

  return (
    <div className="app">
      <div className="orb orb-one" />
      <div className="orb orb-two" />
      <div className="orb orb-three" />

      <main className="diary">
        <header className="header">
          <div>
            <span className="version">STUDYFLOW v1.1</span>
            <h1>📚 StudyFlow</h1>
            <p>Мой электронный дневник</p>
          </div>

          <div className="header-icon">✦</div>
        </header>

        <section className="glass calendar">
          <div className="section-title">
            <h2>Расписание</h2>
            <span className="pill">Моя неделя</span>
          </div>

          <div className="week-navigation">
            <button onClick={() => changeWeek(-1)}>‹</button>

            <div>
              <strong>
                {weekStart.getDate()} {months[weekStart.getMonth()]}
                {' — '}
                {weekEnd.getDate()} {months[weekEnd.getMonth()]}
              </strong>
              <small>{weekStart.getFullYear()}</small>
            </div>

            <button onClick={() => changeWeek(1)}>›</button>
          </div>

          <div className="days">
            {shortDays.map((name, index) => {
              const date = addDays(weekStart, index)
              const active = dateKey(date) === selectedKey
              const today = dateKey(date) === dateKey(new Date())

              return (
                <button
                  key={name}
                  className={`day ${active ? 'active' : ''}`}
                  onClick={() => selectDay(date)}
                >
                  <span>{name}</span>
                  <strong>{date.getDate()}</strong>
                  {today && <i />}
                </button>
              )
            })}
          </div>

          <div className="calendar-actions">
            <button onClick={() => selectDay(new Date())}>
              Сегодня
            </button>

            <label className="date-picker">
              Выбрать дату

              <input
                type="date"
                value={selectedKey}
                onChange={e => {
                  if (e.target.value) {
                    selectDay(
                      new Date(`${e.target.value}T12:00:00`)
                    )
                  }
                }}
              />
            </label>
          </div>
        </section>

        <div className="section-title day-heading">
          <h2>{days[(selectedDate.getDay() + 6) % 7]}</h2>
          <span className="pill">{lessons.length} занятий</span>
        </div>

        {lessons.length === 0 && (
          <div className="glass empty">
            <span>🗓️</span>
            <h3>Занятий пока нет</h3>
            <p>Добавь первую пару на выбранный день.</p>
          </div>
        )}

        {lessons.map((lesson, index) => {
          const tasks = tasksForSubject(lesson.subject)
          const isEditing = editingLesson === lesson.id

          return (
            <section className="glass lesson" key={lesson.id}>
              <div className="lesson-top">
                <span className="pill">{index + 1} пара</span>
                <span className="lesson-time">◷ {lesson.time}</span>
              </div>

              <h3>{lesson.subject}</h3>

              {tasks.length > 0 && (
                <div className="lesson-homework">
                  <h4>📚 Домашнее задание</h4>

                  {tasks.map(item => (
                    <div className="homework-item" key={item.id}>
                      <label className="homework-check">
                        <input
                          type="checkbox"
                          checked={item.done}
                          onChange={() => toggleHomework(item.id)}
                        />

                        <span className={item.done ? 'done' : ''}>
                          {item.text}
                        </span>
                      </label>

                      <div className="homework-bottom">
                        <small>
                          📅 Сдать до {formatDate(item.deadline)}
                        </small>

                        <button
                          className="delete-small"
                          onClick={() => deleteHomework(item.id)}
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {isEditing ? (
                <div className="inline-homework-form">
                  <h4>Новое домашнее задание</h4>

                  <label>Что задано?</label>
                  <textarea
                    placeholder="Например, подготовить презентацию..."
                    value={task}
                    onChange={e => setTask(e.target.value)}
                    rows={3}
                  />

                  <label>Срок выполнения</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={e => setDeadline(e.target.value)}
                  />

                  <div className="form-actions">
                    <button
                      className="primary"
                      disabled={!task.trim() || !deadline}
                      onClick={() => saveHomework(lesson)}
                    >
                      Сохранить ДЗ
                    </button>

                    <button
                      className="cancel-button"
                      onClick={() => setEditingLesson(null)}
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  className="add-homework-button"
                  onClick={() => openHomeworkForm(lesson.id)}
                >
                  ＋ Добавить ДЗ
                </button>
              )}

              <button
                className="delete-lesson"
                onClick={() => deleteLesson(lesson.id)}
              >
                Удалить пару
              </button>
            </section>
          )
        })}

        <section className="glass form">
          <h2>＋ Добавить занятие</h2>

          <label>Название предмета</label>
          <input
            placeholder="Например, Правоведение"
            value={subject}
            onChange={e => setSubject(e.target.value)}
          />

          <label>Время начала</label>
          <input
            type="time"
            value={time}
            onChange={e => setTime(e.target.value)}
          />

          <button className="primary" onClick={addLesson}>
            Добавить пару
          </button>
        </section>

        <button className="copy-button" onClick={copyPreviousWeek}>
          ⧉ Скопировать прошлую неделю
        </button>

        <footer>StudyFlow v1.1 · Сделано для учёбы ✨</footer>
      </main>
    </div>
  )
}

export default App
