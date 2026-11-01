import { useState, type FormEvent } from 'react'
import './App.css'

type Todo = {
  id: string
  title: string
  completed: boolean
}

type Filter = 'all' | 'active' | 'completed'

const STORAGE_KEY = 'simple-todo-list'

const filters: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'active', label: 'Активные' },
  { value: 'completed', label: 'Выполненные' },
]

function isTodo(value: unknown): value is Todo {
  if (typeof value !== 'object' || value === null) return false

  const todo = value as Record<string, unknown>
  return (
    typeof todo.id === 'string' &&
    typeof todo.title === 'string' &&
    typeof todo.completed === 'boolean'
  )
}

function loadTodos(): Todo[] {
  try {
    const savedTodos = window.localStorage.getItem(STORAGE_KEY)
    if (!savedTodos) return []

    const parsedTodos: unknown = JSON.parse(savedTodos)
    return Array.isArray(parsedTodos) ? parsedTodos.filter(isTodo) : []
  } catch (error) {
    console.error('Не удалось загрузить задачи из localStorage.', error)
    return []
  }
}

function getRemainingLabel(count: number) {
  const lastTwoDigits = count % 100
  const lastDigit = count % 10

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return `${count} задач осталось`
  }
  if (lastDigit === 1) return `${count} задача осталась`
  if (lastDigit >= 2 && lastDigit <= 4) return `${count} задачи осталось`
  return `${count} задач осталось`
}

function App() {
  const [todos, setTodos] = useState<Todo[]>(loadTodos)
  const [input, setInput] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [storageError, setStorageError] = useState(false)

  function saveTodos(nextTodos: Todo[]) {
    setTodos(nextTodos)
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextTodos))
      setStorageError(false)
    } catch (error) {
      console.error('Не удалось сохранить задачи в localStorage.', error)
      setStorageError(true)
    }
  }

  const activeCount = todos.filter((todo) => !todo.completed).length
  const visibleTodos = todos.filter((todo) => {
    if (filter === 'active') return !todo.completed
    if (filter === 'completed') return todo.completed
    return true
  })

  function addTodo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const title = input.trim()
    if (!title) return

    saveTodos([{ id: crypto.randomUUID(), title, completed: false }, ...todos])
    setInput('')
  }

  function toggleTodo(id: string) {
    saveTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo,
      ),
    )
  }

  function deleteTodo(id: string) {
    saveTodos(todos.filter((todo) => todo.id !== id))
  }

  return (
    <main className="page">
      <section className="todo-card" aria-labelledby="page-title">
        <header className="header">
          <div className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="m5 12.5 4.2 4.2L19 7"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className="eyebrow">Маленькие шаги каждый день</p>
          <h1 id="page-title">Мои задачи</h1>
          <p className="subtitle">Освободите голову — запишите планы</p>
        </header>

        <form className="add-form" onSubmit={addTodo}>
          <label className="visually-hidden" htmlFor="new-todo">
            Новая задача
          </label>
          <input
            id="new-todo"
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Например, выпить стакан воды"
            maxLength={200}
          />
          <button className="add-button" type="submit" disabled={!input.trim()}>
            <span aria-hidden="true">+</span>
            Добавить
          </button>
        </form>

        <nav className="filters" aria-label="Фильтр задач">
          {filters.map((item) => (
            <button
              className={`filter-button${filter === item.value ? ' is-selected' : ''}`}
              key={item.value}
              type="button"
              aria-pressed={filter === item.value}
              onClick={() => setFilter(item.value)}
            >
              {item.label}
              {item.value === 'all' && (
                <span className="filter-count">{todos.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="todo-list" aria-live="polite">
          {visibleTodos.length > 0 ? (
            visibleTodos.map((todo) => (
              <div className={`todo-item${todo.completed ? ' is-completed' : ''}`} key={todo.id}>
                <label className="todo-label">
                  <input
                    className="todo-checkbox"
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodo(todo.id)}
                  />
                  <span className="custom-checkbox" aria-hidden="true">
                    <svg viewBox="0 0 16 16" fill="none">
                      <path
                        d="m3.5 8 3 3 6-6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span className="todo-title">{todo.title}</span>
                </label>
                <button
                  className="delete-button"
                  type="button"
                  aria-label={`Удалить задачу: ${todo.title}`}
                  onClick={() => deleteTodo(todo.id)}
                >
                  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path
                      d="M4.5 6h11m-9.5 0 .6 10h5.8l.6-10M8 6V4.5h4V6m-3 3v4m2-4v4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <span className="empty-icon" aria-hidden="true">
                {filter === 'completed' ? '✓' : '✦'}
              </span>
              <p>
                {filter === 'active'
                  ? 'Все задачи выполнены — отличная работа!'
                  : filter === 'completed'
                    ? 'Выполненные задачи появятся здесь'
                    : 'Пока нет задач — добавьте первую'}
              </p>
            </div>
          )}
        </div>

        <footer className="list-footer">
          <span>{getRemainingLabel(activeCount)}</span>
          <span className="footer-dot" aria-hidden="true">
            ·
          </span>
          <span>Ваш список хранится в этом браузере</span>
        </footer>
        {storageError && (
          <p className="storage-warning" role="status">
            Не удалось сохранить задачи в этом браузере.
          </p>
        )}
      </section>
      <p className="page-note">Один шаг за раз — и всё получится.</p>
    </main>
  )
}

export default App
