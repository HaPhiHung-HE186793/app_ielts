import { useState } from 'react'
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  Clock3,
  Leaf,
  RotateCcw,
  Sprout,
} from 'lucide-react'
import type { StudyState } from '../../data/schema'
import { findLesson } from '../../content/lessons'
import { formatDuration, measuredTime } from '../../domain/activity'
import { modeLabels } from '../../domain/planner'
import { activityWeek, practiceHistory, sessionHistory } from '../../domain/progress'
import '../../styles/progress.css'

const kindLabels = { lesson: 'Bài học', review: 'Ôn lại', quick: 'Khởi động' }
const dateLabel = (time: number) =>
  new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(time)

export function Progress({
  state,
  now,
  onSettings,
}: {
  state: StudyState
  now: number
  onSettings: () => void
}) {
  const [filter, setFilter] = useState<'all' | 'lesson' | 'review' | 'quick'>('all')
  const [limit, setLimit] = useState(20)
  const [sessionLimit, setSessionLimit] = useState(10)
  const unique = new Set(state.completions.map((item) => item.lessonId)).size
  const firstTry = state.completions.reduce((sum, item) => sum + item.independent, 0)
  const responses = state.completions.length * 3
  const reviewIndependent = state.reviewLog.filter((item) => item.independent).length
  const quickIndependent = state.quickLog.filter((item) => item.independent).length
  const total = measuredTime(state)
  const week = activityWeek(state, now)
  const maxMs = Math.max(60_000, ...week.map((day) => day.ms))
  const history = practiceHistory(state).filter(
    (entry) => filter === 'all' || entry.kind === filter,
  )
  const sessions = sessionHistory(state)
  return (
    <>
      <header className="page-heading">
        <p className="eyebrow">SO VỚI CHÍNH MÌNH NGÀY HÔM QUA</p>
        <h1>Mỗi bước đều đáng ghi nhận.</h1>
        <p>Những gì bạn đã thực sự luyện, được giữ lại ở đây.</p>
      </header>
      <section className="panel measured-panel" aria-labelledby="measured-title">
        <div className="measured-summary">
          <span className="small-art mint">
            <Clock3 size={23} />
          </span>
          <div>
            <h2 id="measured-title">Thời gian hoạt động đã đo</h2>
            <strong data-testid="measured-total">{formatDuration(total)}</strong>
            <p className="small muted">Tổng đã ghi trên thiết bị, gồm cả phần bài đang dở.</p>
          </div>
        </div>
        <div
          className="week-measurements"
          aria-label="Thời gian hoạt động được ghi trong bảy ngày gần nhất"
        >
          {week.map((day) => (
            <div key={day.day} className="week-measurement">
              <span className="week-bar-space" aria-hidden="true">
                <span style={{ height: `${day.ms ? Math.max(4, (day.ms / maxMs) * 100) : 0}%` }} />
              </span>
              <strong>
                {new Intl.DateTimeFormat('vi-VN', { day: 'numeric', month: 'numeric' }).format(
                  day.date,
                )}
              </strong>
              <span>{day.ms ? formatDuration(day.ms) : 'Chưa ghi'}</span>
            </div>
          ))}
        </div>
        <details className="measurement-rules">
          <summary>Cách tính thời gian</summary>
          <p>
            Chỉ đo trong bài học, câu khởi động hoặc câu ôn khi cửa sổ có focus. Đổi tab, mở cài
            đặt, tạm dừng đo hoặc không thao tác 60 giây thì dừng; chạm, gõ hoặc cuộn để tiếp tục.
            Thời gian mở Hôm nay/Tiến bộ không được tính.
          </p>
          <p>
            Số đo cập nhật mỗi 5 giây và khi rời hoạt động. Đóng app đột ngột có thể mất phần chưa
            lưu. Đây là thời gian có hoạt động trên app, chưa chứng minh bạn luôn chú ý. Dữ liệu cũ
            chưa đo giờ được giữ là “chưa có dữ liệu đo”, không quy đổi số bài thành phút.
          </p>
          <p>
            Biểu đồ dùng ngày địa phương lúc ghi. Phút dự kiến trong kế hoạch là thông tin riêng;
            không dùng số phút để suy band IELTS.
          </p>
        </details>
      </section>
      <div className="stats-grid progress-stats">
        <section className="panel stat">
          <BookOpen size={21} />
          <strong>
            {unique}
            <span> / 7</span>
          </strong>
          <span>bài nền tảng đã hoàn thành</span>
        </section>
        <section className="panel stat">
          <Check size={21} />
          <strong>{responses ? `${Math.round((firstTry / responses) * 100)}%` : '—'}</strong>
          <span>câu đúng lần đầu, không gợi ý</span>
        </section>
        <section className="panel stat">
          <RotateCcw size={21} />
          <strong>{state.reviewLog.length}</strong>
          <span>lượt ôn · {reviewIndependent} đúng độc lập</span>
        </section>
        <section className="panel stat">
          <Sprout size={21} />
          <strong>{state.quickLog.length}</strong>
          <span>lượt khởi động · {quickIndependent} đúng độc lập</span>
        </section>
      </div>
      <p className="small muted">
        Khởi động được ghi riêng với bài học đầy đủ. Các chỉ số phản ánh bài đã luyện, chưa phải mức
        thành thạo hay band IELTS.
      </p>
      <section className="panel session-history" aria-labelledby="sessions-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">KẾ HOẠCH & NHỮNG GÌ ĐÃ LÀM</p>
            <h2 id="sessions-title">Những phiên học của bạn</h2>
          </div>
          <a className="text-link" href="#/today">
            Chọn nhịp học <ArrowRight size={15} />
          </a>
        </div>
        {sessions.length ? (
          <div className="session-history-list">
            {sessions.slice(0, sessionLimit).map((session) => (
              <article className="session-history-card" key={session.id}>
                <div className="section-heading">
                  <h3>{modeLabels[session.mode]}</h3>
                  <span className={`status-tag ${session.status === 'completed' ? 'done' : ''}`}>
                    {session.status === 'completed'
                      ? 'Hoàn tất'
                      : session.status === 'replaced'
                        ? 'Đã đổi kế hoạch'
                        : 'Đang dở'}
                  </span>
                </div>
                <p className="small muted">
                  Bắt đầu {dateLabel(session.createdAt)}
                  {session.endedAt !== null ? ` · Kết thúc ${dateLabel(session.endedAt)}` : ''}
                </p>
                <p>
                  <strong>
                    {session.items.filter((item) => item.completed).length}/{session.items.length}
                  </strong>{' '}
                  hoạt động đã làm ·{' '}
                  <strong>{formatDuration(measuredTime(state, session.id))}</strong>
                </p>
                <p className="small muted">
                  Dự kiến {session.items.reduce((sum, item) => sum + item.minutes, 0)} phút học liệu
                  / {session.budget} phút đã chọn.
                </p>
                <ul className="session-outcomes">
                  {(['lesson', 'review', 'quick'] as const)
                    .filter((kind) => session.items.some((item) => item.kind === kind))
                    .map((kind) => (
                      <li key={kind}>
                        {kindLabels[kind]}:{' '}
                        {
                          session.items.filter((item) => item.kind === kind && item.completed)
                            .length
                        }
                        /{session.items.filter((item) => item.kind === kind).length}
                      </li>
                    ))}
                </ul>
                {session.current && session.status === 'active' && (
                  <a className="text-link" href="#/session">
                    Tiếp tục phiên này <ArrowRight size={15} />
                  </a>
                )}
              </article>
            ))}
            {sessions.length > sessionLimit && (
              <button
                className="button secondary"
                onClick={() => setSessionLimit((value) => value + 10)}
              >
                Xem thêm phiên
              </button>
            )}
          </div>
        ) : (
          <div className="compact-empty">
            <Leaf size={25} />
            <p>
              Chọn một phiên ở Hôm nay để bắt đầu lưu kế hoạch và kết quả cùng nhau. Các lượt học
              riêng vẫn ở bên dưới.
            </p>
            <a className="text-link" href="#/today">
              Chọn phiên đầu tiên <ArrowRight size={15} />
            </a>
          </div>
        )}
        <p className="small muted">
          Phiên đã đổi giữ số hoạt động hoàn thành tại lúc đổi. Những kế hoạch đã bị thay thế trước
          bản cập nhật này chưa có lịch sử để khôi phục.
        </p>
      </section>
      <section className="panel history-panel">
        <div className="section-heading">
          <h2>Dấu chân trên hành trình</h2>
          <button className="text-button" onClick={onSettings}>
            Lưu bản sao <ArrowUpRight size={15} />
          </button>
        </div>
        <div className="chips history-filters" role="group" aria-label="Lọc lịch sử luyện tập">
          {(['all', 'lesson', 'review', 'quick'] as const).map((kind) => (
            <button
              key={kind}
              className={`chip ${filter === kind ? 'selected' : ''}`}
              aria-pressed={filter === kind}
              onClick={() => {
                setFilter(kind)
                setLimit(20)
              }}
            >
              {kind === 'all' ? 'Tất cả' : kindLabels[kind]}
            </button>
          ))}
        </div>
        {history.length ? (
          <div className="history-list">
            {history.slice(0, limit).map((item) => (
              <article key={`${item.kind}/${item.id}`} className="history-item">
                <span className="history-check">
                  {item.kind === 'lesson' ? (
                    <Check size={17} />
                  ) : item.kind === 'quick' ? (
                    <Sprout size={17} />
                  ) : (
                    <RotateCcw size={17} />
                  )}
                </span>
                <div>
                  <span className="eyebrow">{kindLabels[item.kind]}</span>
                  <h3>{findLesson(item.lessonId)!.title}</h3>
                  <p>
                    {dateLabel(item.at)} · {item.result}
                  </p>
                  <p className="small muted">Đã đo: {formatDuration(item.ms)}</p>
                  {item.reflection && (
                    <blockquote lang="en">
                      {item.reflection}
                      <span>Câu bạn tự viết · Chưa chấm</span>
                    </blockquote>
                  )}
                </div>
              </article>
            ))}
            {history.length > limit && (
              <button className="button secondary" onClick={() => setLimit((value) => value + 20)}>
                Xem thêm lượt luyện
              </button>
            )}
          </div>
        ) : (
          <div className="empty-state">
            <span className="round-icon">
              <Leaf size={29} />
            </span>
            <h2>
              {filter === 'all' ? 'Trang đầu tiên đang chờ bạn.' : 'Chưa có lượt luyện ở mục này.'}
            </h2>
            <p>Học một bài hoặc khởi động ngắn để thấy bước tiến đầu tiên ở đây.</p>
            <a className="button primary" href="#/today">
              Chọn nhịp học hôm nay <ArrowRight size={18} />
            </a>
          </div>
        )}
      </section>
    </>
  )
}
