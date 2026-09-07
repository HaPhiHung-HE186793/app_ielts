import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  ChevronRight,
  Clock3,
  Leaf,
  RotateCcw,
  Settings2,
  Sparkles,
  Sun,
  Target,
} from 'lucide-react'
import { lessons, findLesson, curriculum } from '../../content/lessons'
import type { StudyState } from '../../data/schema'
import type { Lesson } from '../../domain/types'
import { BookScene } from '../../components/BookScene'
import { LessonCard } from '../../components/LessonCard'
import { navigate } from '../../app/router'
import { SessionChoices } from './SessionChoices'

export function Today({
  state,
  now,
  onStart,
  onSettings,
}: {
  state: StudyState
  now: number
  onStart: (lesson: Lesson) => void
  onSettings: () => void
}) {
  const completed = new Set(state.completions.map((item) => item.lessonId))
  const next =
    (state.draft && findLesson(state.draft.lessonId)) ||
    lessons.find((lesson) => !completed.has(lesson.id)) ||
    lessons[0]
  const due = Object.values(state.reviews).filter((card) => card.dueAt <= now).length
  const localDate = new Date(now)
  const todayKey = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-${String(localDate.getDate()).padStart(2, '0')}`
  const picks = [...lessons]
    .sort(
      (a, b) =>
        Number(!!state.profile?.interests.includes(b.topic)) -
        Number(!!state.profile?.interests.includes(a.topic)),
    )
    .slice(0, 3)
  return (
    <>
      <header className="page-heading">
        <div className="greeting">
          <Sun size={18} />
          <span>MỘT NGÀY MỚI, MỘT CƠ HỘI NHỎ</span>
        </div>
        <h1>Chào {state.profile?.name || 'bạn'}, mình học một chút nhé.</h1>
        <p>Không cần hoàn hảo. Chỉ cần bắt đầu từ điều vừa sức.</p>
      </header>
      {!state.profile && (
        <section className="welcome-strip">
          <div>
            <strong>Để hành trình hợp với bạn hơn</strong>
            <p>Chọn mục tiêu, sở thích và thời gian thực sự có thể dành cho việc học.</p>
          </div>
          <button className="button secondary small-button" onClick={onSettings}>
            Thiết lập nhịp học <ArrowRight size={16} />
          </button>
        </section>
      )}
      <div className="dashboard-grid">
        <div className="dashboard-main">
          <section className="hero">
            <div className="hero-copy">
              <span className="hero-badge">
                <span /> CHẶNG 01 · XÂY NỀN TẢNG
              </span>
              <h2>
                Một chút hôm nay.
                <br />
                Tự tin hơn ngày mai.
              </h2>
              <p>
                Bắt đầu bằng một câu đơn giản.
                <br />
                Rồi biến nó thành câu chuyện của bạn.
              </p>
              <button className="button primary" onClick={() => onStart(next)}>
                {state.draft ? 'Tiếp tục bài đang học' : 'Bắt đầu học'} <ArrowRight size={18} />
              </button>
              <span className="hero-footnote">
                <Clock3 size={14} /> Khoảng {next.minutes} phút · Có thể tạm dừng
              </span>
            </div>
            <BookScene />
          </section>
          <SessionChoices state={state} now={now} onSettings={onSettings} />
          <section className="daily-section">
            <div className="section-heading">
              <h2>Một nhịp học cho hôm nay</h2>
              <span className="muted small">Từng bước, theo nhịp bạn</span>
            </div>
            <div className="daily-actions">
              <button className="daily-action" onClick={() => onStart(next)}>
                <span className="small-art mint">
                  <BookOpen size={23} />
                </span>
                <span>
                  <strong>{state.draft ? 'Tiếp tục câu chuyện' : 'Học một điều mới'}</strong>
                  <span>{next.title}</span>
                </span>
                <ChevronRight size={18} />
              </button>
              <button className="daily-action" onClick={() => navigate('/review')}>
                <span className="small-art sand">
                  <RotateCcw size={23} />
                </span>
                <span>
                  <strong>Gặp lại để nhớ lâu</strong>
                  <span>{due ? `${due} câu đến hạn ôn` : 'Sổ ôn của riêng bạn'}</span>
                </span>
                <ChevronRight size={18} />
              </button>
            </div>
          </section>
          <section>
            <div className="section-heading">
              <div>
                <h2>Một chút tò mò, một câu mới</h2>
                <p className="muted small">Tiếng Anh từ những điều gần gũi.</p>
              </div>
              <a className="text-link" href="#/discover">
                Xem tất cả <ArrowUpRight size={15} />
              </a>
            </div>
            <div className="lesson-grid">
              {picks.map((lesson) => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  completed={completed.has(lesson.id)}
                  onStart={onStart}
                />
              ))}
            </div>
          </section>
        </div>
        <aside className="dashboard-aside">
          <section className="panel journey-panel">
            <div className="section-heading">
              <span className="eyebrow">HÀNH TRÌNH CỦA BẠN</span>
              <span className="small-art mini mint">
                <Leaf size={17} />
              </span>
            </div>
            <h2>
              Từng bước nhỏ, <br />
              một nền tảng vững.
            </h2>
            <p className="muted small">Bốn tuần gợi ý · 28 bài và 4 lần kiểm tra</p>
            <div className="journey-progress">
              <strong>
                {completed.size}
                <span> / {lessons.length} bài</span>
              </strong>
              <span>{Math.round((completed.size / lessons.length) * 100)}%</span>
            </div>
            <progress
              max={lessons.length}
              value={completed.size}
              aria-label="Số bài nền tảng đã hoàn thành"
            />
            <div className="curriculum-mini" aria-label="Tiến độ bốn tuần">
              {curriculum.map((week) => (
                <p key={week.week}>
                  <span>Tuần {week.week}</span>
                  <strong>
                    {week.lessons.filter((lesson) => completed.has(lesson.id)).length}/
                    {week.lessons.length}
                  </strong>
                </p>
              ))}
            </div>
            <a className="text-link" href="#/progress">
              Nhìn lại tiến bộ <ArrowRight size={15} />
            </a>
          </section>
          <section className="note-panel">
            <span className="eyebrow">
              <Sparkles size={14} /> MỘT LỜI NHẮN NHỎ
            </span>
            <blockquote>
              “Bạn không cần giỏi
              <br />
              để bắt đầu.”
            </blockquote>
            <p>
              Một câu hiểu được hôm nay cũng là một bước tiến. Nghỉ một ngày? Khi trở lại, mình học
              tiếp.
            </p>
            <span className="note-signature">Cứ từ từ, cùng Mỗi ngày.</span>
          </section>
          <button className="goal-panel" onClick={onSettings}>
            <span className="small-art lavender">
              <Target size={21} />
            </span>
            <span>
              <strong>Nhịp học của bạn</strong>
              <span>
                {state.profile
                  ? `${state.profile.dailyMinutes} phút mỗi ngày · Dự kiến`
                  : 'Chọn sở thích và thời gian'}
              </span>
            </span>
            <Settings2 size={17} />
          </button>
          {state.profile && (
            <div className="goal-detail small">
              <strong>
                {state.profile.goal === 'ielts65'
                  ? 'Mục tiêu: IELTS 6.5'
                  : state.profile.goal === 'foundation'
                    ? 'Mục tiêu: xây lại nền tảng'
                    : 'Khám phá nhịp học phù hợp'}
              </strong>
              {state.profile.targetDate && (
                <p>
                  Ngày bạn chọn:{' '}
                  {new Intl.DateTimeFormat('vi-VN').format(
                    new Date(`${state.profile.targetDate}T12:00:00`),
                  )}
                  .
                </p>
              )}
              {state.profile.targetDate && state.profile.targetDate < todayKey && (
                <p>Ngày mục tiêu đã qua. Bạn có thể chọn lại nhịp và ngày phù hợp.</p>
              )}
              <p className="muted">
                Nền tảng do bạn tự nhận xét. Chưa có đánh giá đầu vào hoặc dự báo band.
              </p>
            </div>
          )}
          <p className="local-note">
            <span className="local-dot" /> Bản học thử · Tiến độ lưu trên thiết bị
          </p>
        </aside>
      </div>
    </>
  )
}
