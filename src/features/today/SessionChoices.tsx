import { useState } from 'react'
import { ArrowRight, Check, Clock3, SlidersHorizontal } from 'lucide-react'
import type { PlanMode, PlanPace, StudyState } from '../../data/schema'
import { findLesson } from '../../content/lessons'
import { paceDescriptions, paceLabels, returningAfterGap } from '../../domain/adaptation'
import { buildPlan, itemResult, modeLabels, replacePlan } from '../../domain/planner'
import { updateState } from '../../data/store'
import { navigate } from '../../app/router'

export function SessionChoices({
  state,
  now,
  onSettings,
}: {
  state: StudyState
  now: number
  onSettings: () => void
}) {
  const activePlan = state.plan && state.plan.cursor < state.plan.items.length ? state.plan : null
  const [mode, setMode] = useState<PlanMode>(activePlan?.mode ?? '5')
  const returning = returningAfterGap(state, now)
  const [pace, setPace] = useState<PlanPace>(
    activePlan?.adaptation?.pace ?? (returning ? 'returning' : 'normal'),
  )
  const preview = buildPlan(state, mode, now, 'preview', pace)
  const minutes = preview.items.reduce((sum, item) => sum + item.minutes, 0)
  const lessonCount = preview.items.filter((item) => item.kind === 'lesson').length
  const reviewCount = preview.items.filter((item) => item.kind === 'review').length
  const unfinished = state.plan && state.plan.cursor < state.plan.items.length
  const doneCount = state.plan?.items.filter((item) => itemResult(state, item)).length ?? 0
  return (
    <section className="session-choices panel" aria-labelledby="session-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">CHỌN MỘT NHỊP VỪA SỨC</p>
          <h2 id="session-heading">Lúc này bạn có bao nhiêu thời gian?</h2>
        </div>
        <Clock3 size={22} aria-hidden="true" />
      </div>
      {returning && (
        <p className="returning-note">
          Mừng bạn quay lại. Đã ít nhất bảy ngày từ hoạt động được lưu gần nhất; hôm nay không cần
          học bù.
        </p>
      )}
      <fieldset className="pace-options">
        <legend>Hôm nay bạn muốn học thế nào?</legend>
        <div>
          {(Object.keys(paceLabels) as PlanPace[]).map((value) => (
            <label key={value} className={pace === value ? 'selected' : ''}>
              <input
                type="radio"
                name="session-pace"
                value={value}
                checked={pace === value}
                onChange={() => {
                  setPace(value)
                  if (value === 'hard') setMode('2')
                }}
              />
              {paceLabels[value]}
            </label>
          ))}
        </div>
      </fieldset>
      <p className="small muted" role="status">
        {paceDescriptions[pace]}
      </p>
      <div className="duration-options" role="group" aria-label="Thời gian cho phiên học">
        {(['2', '5', '15', 'full'] as const).map((value) => (
          <button
            key={value}
            className={`duration-option ${mode === value ? 'selected' : ''}`}
            aria-pressed={mode === value}
            onClick={() => setMode(value)}
          >
            <strong>{modeLabels[value]}</strong>
            <span>
              {value === '2'
                ? 'Khởi động'
                : value === '5'
                  ? 'Một bài trọn vẹn'
                  : value === '15'
                    ? 'Học và ôn'
                    : `${state.profile?.dailyMinutes ?? 30} phút dự kiến`}
            </span>
          </button>
        ))}
      </div>
      <div className="session-preview" aria-live="polite" aria-atomic="true">
        <strong>
          {mode === '2'
            ? 'Một câu mẫu → ẩn câu → thử nhớ lại'
            : preview.items.length
              ? `${lessonCount} bài học · ${reviewCount} câu đến hạn ôn`
              : 'Bạn đã đi hết các bài mới hiện có.'}
        </strong>
        <p className="muted small">
          {mode === '2'
            ? 'Một bước khởi động, được lưu riêng với bài học hoàn chỉnh.'
            : `Khoảng ${minutes} phút hoạt động được xếp, trong ${preview.budget} phút bạn chọn.`}{' '}
          Thời lượng là ước tính, bạn có thể dừng bất cứ lúc nào.
        </p>
        {mode !== '2' && minutes < preview.budget && (
          <p className="small muted">
            Số hoạt động được giới hạn theo nhịp đã chọn, tối đa 10. Phần thời gian còn lại chưa
            được xếp và không tính là đã học. Bạn có thể dành thêm thời gian tự nói, viết hoặc nghỉ.
          </p>
        )}
        {!!preview.items.length && (
          <details className="plan-reasons">
            <summary>Xem bài được chọn và lý do</summary>
            <ol>
              {preview.items.map((item) => (
                <li key={item.id}>
                  <strong>
                    {item.kind === 'review'
                      ? 'Ôn lại'
                      : item.kind === 'quick'
                        ? 'Khởi động'
                        : 'Bài học'}{' '}
                    · {findLesson(item.lessonId)!.title}
                  </strong>
                  <span>{item.reason}</span>
                </li>
              ))}
            </ol>
            <p className="small muted">
              Gợi ý từ kết quả bài/truy hồi đã lưu, chưa đánh giá riêng khả năng nói và viết. Bài
              đầy đủ vẫn có các hoạt động nghe, đọc, tự nói và viết. Bạn có thể chọn bài khác ở Khám
              phá.
            </p>
          </details>
        )}
      </div>
      <div className="button-row">
        {preview.items.length ? (
          <button
            className="button primary"
            onClick={() => {
              if (
                unfinished &&
                !window.confirm(
                  'Tạo phiên mới sẽ thay danh sách của phiên đang dở. Bài đang học và mọi kết quả đã lưu vẫn được giữ. Tạo phiên mới?',
                )
              )
                return
              updateState((current) =>
                replacePlan(current, mode, Date.now(), crypto.randomUUID(), pace),
              )
              navigate('/session')
            }}
          >
            Bắt đầu phiên {mode === 'full' ? 'đầy đủ' : `${mode} phút`} <ArrowRight size={17} />
          </button>
        ) : (
          <a className="button secondary" href="#/review">
            Mở sổ ôn
          </a>
        )}
        <button className="text-button" onClick={onSettings}>
          <SlidersHorizontal size={16} /> Chỉnh nhịp học
        </button>
      </div>
      {unfinished && (
        <a className="resume-session" href="#/session">
          <Check size={17} />
          <span>
            Tiếp tục phiên đang dở{' '}
            <small>
              {doneCount}/{state.plan!.items.length} hoạt động đã làm ·{' '}
              {modeLabels[state.plan!.mode]}
            </small>
          </span>
          <ArrowRight size={17} />
        </a>
      )}
      <p className="small muted session-footnote">
        Phiên ngắn giúp giữ nhịp. Kế hoạch luyện IELTS cần thêm buổi tập trung, chữa bài và đánh giá
        bốn kỹ năng.
      </p>
    </section>
  )
}
