import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import {
  ArrowRight,
  BookOpen,
  ChartNoAxesCombined,
  ChevronRight,
  Compass,
  Headphones,
  House,
  Leaf,
  RotateCcw,
  Settings2,
} from 'lucide-react'
import { findLesson } from '../content/lessons'
import { getSnapshot, subscribe, updateState } from '../data/store'
import { startLesson } from '../domain/session'
import type { Lesson } from '../domain/types'
import { SettingsDialog } from '../components/SettingsDialog'
import { LessonPlayer } from '../features/lessons/LessonPlayer'
import { ReviewPage } from '../features/review/ReviewPage'
import { Today } from '../features/today/Today'
import { Discover, Practice } from '../features/pages/Pages'
import { Progress } from '../features/progress/Progress'
import { navigate, useRoute } from './router'
import { useClock } from './clock'
import { SessionPage } from '../features/today/SessionPage'
import '../styles/sessions.css'
import { ActivityGate } from './activity-context'
import { InstallPage } from '../features/install/InstallPage'

const navigation = [
  { path: '/today', label: 'Hôm nay', icon: House },
  { path: '/discover', label: 'Khám phá', icon: Compass },
  { path: '/practice', label: 'Luyện tập', icon: Headphones },
  { path: '/review', label: 'Ôn lại', icon: RotateCcw },
  { path: '/progress', label: 'Tiến bộ', icon: ChartNoAxesCombined },
]

export function App() {
  const route = useRoute()
  const { state, error } = useSyncExternalStore(subscribe, getSnapshot)
  const [settings, setSettings] = useState(false)
  const now = useClock()
  const main = useRef<HTMLElement>(null)
  const isLesson = route.startsWith('/lesson/')
  const lesson = isLesson ? findLesson(route.slice('/lesson/'.length)) : undefined
  const activePath = isLesson ? '/discover' : route === '/session' ? '/today' : route
  const currentNav = navigation.find((item) => item.path === activePath)
  const pageTitle =
    route === '/install'
      ? 'Thêm vào màn hình chính'
      : (lesson?.title ?? currentNav?.label ?? 'Không tìm thấy')
  const due = Object.values(state.reviews).filter((card) => card.dueAt <= now).length

  useEffect(() => {
    document.title = `${pageTitle} · Mỗi ngày`
    main.current?.focus({ preventScroll: true })
    window.scrollTo({ top: 0, behavior: 'instant' })
    window.speechSynthesis?.cancel()
  }, [route, pageTitle])
  useEffect(() => () => window.speechSynthesis?.cancel(), [])

  function openLesson(item: Lesson) {
    if (
      state.draft &&
      state.draft.lessonId !== item.id &&
      !window.confirm(
        'Bạn đang có một bài học dở. Chuyển bài sẽ thay thế phần đang làm; những bài đã hoàn thành vẫn được giữ. Tiếp tục chuyển bài?',
      )
    )
      return
    updateState((current) => startLesson(current, item.id, crypto.randomUUID()))
    navigate(`/lesson/${item.id}`)
  }

  return (
    <ActivityGate value={!settings}>
      <div className="app-shell">
        <a
          className="skip-link"
          href="#main-content"
          onClick={(event) => {
            event.preventDefault()
            main.current?.focus()
          }}
        >
          Đến nội dung chính
        </a>
        <aside className="sidebar">
          <a href="#/today" className="brand">
            <span className="brand-mark">
              <BookOpen size={24} strokeWidth={1.8} />
            </span>
            <span>
              Mỗi ngày<span>một chút tiếng Anh</span>
            </span>
          </a>
          <span className="nav-label">KHÔNG GIAN HỌC</span>
          <nav aria-label="Điều hướng chính">
            {navigation.map(({ path, icon: Icon, label }) => (
              <a
                key={path}
                href={`#${path}`}
                className={`nav-item ${activePath === path ? 'active' : ''}`}
                aria-current={activePath === path ? 'page' : undefined}
              >
                <Icon size={21} strokeWidth={1.7} />
                <span>{label}</span>
                {path === '/review' && due > 0 && <span className="nav-badge">{due}</span>}
              </a>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <div className="sidebar-note">
              <Leaf size={21} />
              <p>
                Tiến bộ theo nhịp
                <br />
                của riêng bạn.
              </p>
            </div>
            <button
              className="profile-button"
              aria-label="Mở cài đặt cá nhân"
              onClick={() => setSettings(true)}
            >
              <span className="avatar">{state.profile?.name?.charAt(0).toUpperCase() || 'B'}</span>
              <span>
                {state.profile?.name || 'Bạn học mới'}
                <span>Không gian cá nhân</span>
              </span>
              <Settings2 size={17} />
            </button>
          </div>
        </aside>
        <div className="workspace">
          <header className="topbar">
            <div className="breadcrumb">
              <span>Mỗi ngày</span>
              <ChevronRight size={14} />
              <span>
                {route === '/install' ? 'Cài ứng dụng' : (currentNav?.label ?? 'Bài học')}
              </span>
            </div>
            <span className="topbar-date">
              {new Intl.DateTimeFormat('vi-VN', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              }).format(now)}
            </span>
            <button
              className="icon-button mobile-settings"
              aria-label="Mở cài đặt"
              onClick={() => setSettings(true)}
            >
              <Settings2 size={20} />
            </button>
          </header>
          <main
            id="main-content"
            ref={main}
            tabIndex={-1}
            className={`main-content ${isLesson ? 'learning-content' : ''}`}
          >
            {error && (
              <div className="storage-warning" role="alert">
                <p>{error}</p>
                <button className="text-button" onClick={() => setSettings(true)}>
                  Mở cài đặt và bản sao <ArrowRight size={15} />
                </button>
              </div>
            )}
            {route === '/today' ? (
              <Today
                state={state}
                now={now}
                onStart={openLesson}
                onSettings={() => setSettings(true)}
              />
            ) : route === '/discover' ? (
              <Discover state={state} onStart={openLesson} />
            ) : route === '/session' ? (
              <SessionPage state={state} />
            ) : route === '/practice' ? (
              <Practice onStart={openLesson} />
            ) : route === '/review' ? (
              <ReviewPage state={state} now={now} />
            ) : route === '/progress' ? (
              <Progress state={state} now={now} onSettings={() => setSettings(true)} />
            ) : route === '/install' ? (
              <InstallPage onSettings={() => setSettings(true)} />
            ) : lesson ? (
              <LessonPlayer
                key={lesson.id}
                lesson={lesson}
                draft={state.draft}
                onStart={() => openLesson(lesson)}
                onExit={() => navigate('/today')}
              />
            ) : (
              <section className="panel empty-state">
                <Compass size={35} />
                <h1>Mình chưa tìm thấy trang này.</h1>
                <p>Quay lại Hôm nay để tiếp tục hành trình nhé.</p>
                <a className="button primary" href="#/today">
                  Về Hôm nay
                </a>
              </section>
            )}
            <footer className="page-footer">
              <span>
                Mỗi ngày <span>·</span> Học theo nhịp của bạn.
              </span>
              <a href="#/install" className="install-footer-link">
                Thêm vào màn hình chính
              </a>
            </footer>
          </main>
        </div>
        {settings && <SettingsDialog profile={state.profile} onClose={() => setSettings(false)} />}
      </div>
    </ActivityGate>
  )
}
