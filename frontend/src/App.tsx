
import { useState, useEffect } from 'react'
import './App.css'

type Lesson = {
  id: number
  subject: string
  time: string
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

function App() {
  const [day, setDay] = useState(days[0])

  const [schedule, setSchedule] = useState<Schedule>(() => {
    const saved = localStorage.getItem('studyflow-schedule')
    return saved ? JSON.parse(saved) : {}
  })

  const [subject, setSubject] = useState('')
  const [time, setTime] = useState('09:00')

  useEffect(() => {
    localStorage.setItem(
      'studyflow-schedule',
      JSON.stringify(schedule)
    )
  }, [schedule])

  function addLesson() {
    if (!subject.trim()) return

    const lesson: Lesson = {
      id: Date.now(),
      subject: subject.trim(),
      time
    }

    setSchedule(prev => ({
      ...prev,
      [day]: [...(prev[day] || []), lesson]
    }))

    setSubject('')
  }

  function deleteLesson(id: number) {
    setSchedule(prev => ({
      ...prev,
      [day]: (prev[day] || []).filter(
        lesson => lesson.id !== id
      )
    }))
  }

  return (
    <div className="diary">
      <h1>📚 StudyFlow</h1>
      <p>Мой электронный дневник</p>

      <h2>Расписание занятий</h2>

      <div className="days">
        {days.map(item => (
          <button
            key={item}
            className={day === item ? 'active' : ''}
            onClick={() => setDay(item)}
          >
            {item.slice(0, 2)}
          </button>
        ))}
      </div>

      <h3>{day}</h3>

      {(schedule[day] || []).map(lesson => (
        <div className="task" key={lesson.id}>
          <h3>{lesson.subject}</h3>
          <p>🕒 {lesson.time}</p>

          <button
            className="delete"
            onClick={() => deleteLesson(lesson.id)}
          >
            Удалить
          </button>
        </div>
      ))}

      <div className="form">
        <h3>Добавить занятие</h3>

        <input
          placeholder="Название предмета"
          value={subject}
          onChange={e => setSubject(e.target.value)}
        />

        <input
          type="time"
          value={time}
          onChange={e => setTime(e.target.value)}
        />

        <button onClick={addLesson}>
          + Добавить пару
        </button>
      </div>
    </div>
  )
}

export default App
