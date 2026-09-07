import { ArrowRight, Check, ChevronLeft, Leaf } from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { PlanItem, StudyPlan, StudyState } from '../../data/schema'
import { findLesson } from '../../content/lessons'
import { updateState } from '../../data/store'
import {
  advancePlan,
  beginPlannedLesson,
  itemResult,
  modeLabels,
  submitPlannedPractice,
} from '../../domain/planner'
import { navigate } from '../../app/router'
import { LessonPlayer } from '../lessons/LessonPlayer'
import { ListenButton } from '../../components/ListenButton'
import { ActivityMeter } from '../../components/ActivityMeter'
import { formatDuration, measuredTime } from '../../domain/activity'

function PlannedPractice({
  state,
  plan,
  item,
}: {
  state: StudyState
  plan: StudyPlan
  item: PlanItem
}) {
  const lesson = findLesson(item.lessonId)!
  const quick = item.kind === 'quick'
  const exercise = quick ? lesson.exercises[1] : lesson.review
  const result = itemResult(state, item)
  const correct = result && 'correct' in result ? result.correct : false
  const questionHeading = useRef<HTMLHeadingElement>(null)
  const feedback = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (result) feedback.current?.focus()
    else if (!quick || plan.practice.stage === 'recall') questionHeading.current?.focus()
  }, [result, quick, plan.practice.stage])
  function edit(patch: Partial<StudyPlan['practice']>) {
    updateState((current) =>
      current.plan?.id === plan.id
        ? {
            ...current,
            plan: { ...current.plan, practice: { ...current.plan.practice, ...patch } },
          }
        : current,
    )
  }
  return (
    <section className="panel session-practice" data-study-activity>
      <ActivityMeter
        attemptId={item.id}
        lessonId={item.lessonId}
        kind={quick ? 'quick' : 'review'}
        planId={plan.id}
      />
      <p className="eyebrow">{quick ? 'MỘT CÂU ĐỂ BẮT ĐẦU' : 'GẶP LẠI MỘT CÂU ĐÃ HỌC'}</p>
      <h2>{lesson.title}</h2>
      {quick && plan.practice.stage === 'intro' ? (
        <div className="quick-intro">
          <blockquote lang="en">{lesson.phrase}</blockquote>
          <p>{lesson.translation}</p>
          <ListenButton phrase={lesson.phrase} />
          <p className="note-box">{lesson.note}</p>
          <button className="button primary full-width" onClick={() => edit({ stage: 'recall' })}>
            Ẩn câu và thử nhớ <ArrowRight size={17} />
          </button>
        </div>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault()
            updateState((current) => submitPlannedPractice(current, Date.now()))
          }}
        >
          <h3 ref={questionHeading} tabIndex={-1}>
            {exercise.prompt}
          </h3>
          <label className="field">
            Câu trả lời của bạn
            <input
              maxLength={500}
              value={plan.practice.answer}
              onChange={(event) => edit({ answer: event.target.value })}
              disabled={!!result}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
            />
          </label>
          {!result ? (
            <>
              <button
                type="button"
                className="text-button hint-button"
                onClick={() => edit({ hinted: true })}
              >
                Mình cần gợi ý
              </button>
              {plan.practice.hinted && <p className="hint-box">{exercise.hint}</p>}
              <button className="button primary full-width" disabled={!plan.practice.answer.trim()}>
                Kiểm tra <ArrowRight size={17} />
              </button>
            </>
          ) : (
            <div
              ref={feedback}
              tabIndex={-1}
              className={`feedback ${correct ? 'correct' : 'retry'}`}
              role="status"
            >
              <strong>
                {correct
                  ? plan.practice.hinted
                    ? 'Bạn đã trả lời được với gợi ý.'
                    : 'Bạn tự nhớ được câu này!'
                  : 'Mình cùng nhìn lại câu này nhé.'}
              </strong>
              <p>{exercise.explanation}</p>
              <p className="small">
                {quick
                  ? 'Đã lưu một lượt khởi động. Bài học đầy đủ và lịch ôn được giữ nguyên.'
                  : correct && !plan.practice.hinted
                    ? 'Lịch ôn đã được giãn xa hơn.'
                    : 'Câu này sẽ đến hạn ôn lại sau 10 phút.'}
              </p>
              <button
                type="button"
                className="button primary"
                onClick={() => updateState(advancePlan)}
              >
                {plan.cursor === plan.items.length - 1
                  ? 'Kết thúc phiên'
                  : 'Sang hoạt động tiếp theo'}{' '}
                <ArrowRight size={17} />
              </button>
            </div>
          )}
        </form>
      )}
    </section>
  )
}

export function SessionPage({ state }: { state: StudyState }) {
  const plan = state.plan
  const heading = useRef<HTMLHeadingElement>(null)
  const active = plan?.items[plan.cursor]
  const finishedLesson = active?.kind === 'lesson' && !!itemResult(state, active)
  useEffect(() => {
    heading.current?.focus()
  }, [plan?.id, plan?.cursor, finishedLesson])
  if (!plan || !plan.items.length)
    return (
      <section className="panel empty-state">
        <Leaf size={32} />
        <h1 ref={heading} tabIndex={-1}>
          Chọn một phiên vừa sức.
        </h1>
        <p>Về Hôm nay để chọn thời gian học lúc này.</p>
        <a className="button primary" href="#/today">
          Về Hôm nay
        </a>
      </section>
    )
  const item = plan.items[plan.cursor]
  const totalMinutes = plan.items.reduce((sum, entry) => sum + entry.minutes, 0)
  const done = plan.items.filter((entry) => itemResult(state, entry)).length
  if (!item)
    return (
      <section className="panel empty-state session-receipt">
        <span className="round-icon">
          <Check size={30} />
        </span>
        <p className="eyebrow">MỘT NHỊP HỌC ĐÃ KHÉP LẠI</p>
        <h1 ref={heading} tabIndex={-1}>
          Bạn đã dành một khoảng cho mình.
        </h1>
        <p>
          {done}/{plan.items.length} hoạt động đã làm, với phản hồi được lưu lại.
        </p>
        <div className="session-counts">
          {(['quick', 'lesson', 'review'] as const).map((kind) => {
            const count = plan.items.filter(
              (entry) => entry.kind === kind && itemResult(state, entry),
            ).length
            return count ? (
              <span key={kind}>
                <strong>{count}</strong>
                {kind === 'quick'
                  ? 'lượt khởi động'
                  : kind === 'lesson'
                    ? 'bài hoàn thành'
                    : 'câu đã ôn'}
              </span>
            ) : null
          })}
        </div>
        <p className="muted small">
          Đã đo: {formatDuration(measuredTime(state, plan.id))}. Kế hoạch ban đầu khoảng{' '}
          {totalMinutes} phút. Số đo phản ánh hoạt động trên app, chưa xác nhận mức chú ý hoặc band
          IELTS.
        </p>
        <a className="button primary" href="#/today">
          Về Hôm nay <ArrowRight size={17} />
        </a>
        <p className="small muted">Bạn có thể nghỉ ở đây và quay lại khi sẵn sàng.</p>
      </section>
    )
  const lesson = findLesson(item.lessonId)!
  const result = itemResult(state, item)
  return (
    <div className="session-page">
      <header className="page-heading">
        <button className="text-button" onClick={() => navigate('/today')}>
          <ChevronLeft size={16} /> Tạm dừng phiên
        </button>
        <p className="eyebrow">{modeLabels[plan.mode].toUpperCase()} · THEO NHỊP CỦA BẠN</p>
        <h1 ref={!finishedLesson ? heading : undefined} tabIndex={-1}>
          Từng việc nhỏ, một bước rõ ràng.
        </h1>
        <p>
          Hoạt động {plan.cursor + 1}/{plan.items.length} · Tổng khoảng {totalMinutes} phút dự kiến,
          trong {plan.budget} phút đã chọn.
        </p>
      </header>
      <ol className="session-itinerary" aria-label="Các hoạt động của phiên">
        {plan.items.map((entry, index) => (
          <li
            key={`${index}-${entry.id}`}
            className={index === plan.cursor ? 'current' : ''}
            aria-current={index === plan.cursor ? 'step' : undefined}
          >
            <span className="itinerary-number">
              {itemResult(state, entry) ? <Check size={15} aria-label="Đã làm" /> : index + 1}
            </span>
            <span>
              <strong>
                {entry.kind === 'quick'
                  ? 'Khởi động'
                  : entry.kind === 'review'
                    ? 'Ôn lại'
                    : 'Bài học'}{' '}
                · {findLesson(entry.lessonId)!.title}
              </strong>
              <small>Khoảng {entry.minutes} phút</small>
            </span>
          </li>
        ))}
      </ol>
      {item.kind !== 'lesson' ? (
        <PlannedPractice key={item.id} state={state} plan={plan} item={item} />
      ) : result ? (
        <section className="panel empty-state" aria-live="polite">
          <span className="round-icon">
            <Check size={28} />
          </span>
          <h2 ref={heading} tabIndex={-1}>
            Bài học này đã hoàn thành.
          </h2>
          <p>
            {'independent' in result ? result.independent : 0}/3 câu đúng ngay lần đầu, không cần
            gợi ý.
          </p>
          <p className="muted small">
            Kết quả và câu tự viết đã lưu. Nếu đây là bài mới, lịch ôn bắt đầu sau một ngày.
          </p>
          <button className="button primary" onClick={() => updateState(advancePlan)}>
            {plan.cursor === plan.items.length - 1 ? 'Kết thúc phiên' : 'Sang hoạt động tiếp theo'}{' '}
            <ArrowRight size={17} />
          </button>
        </section>
      ) : (
        <LessonPlayer
          key={item.id}
          lesson={lesson}
          planId={plan.id}
          draft={state.draft?.id === item.id ? state.draft : null}
          onExit={() => navigate('/today')}
          onStart={() => {
            if (
              state.draft &&
              state.draft.lessonId !== item.lessonId &&
              !window.confirm(
                'Bạn có một bài dở khác. Học bước này sẽ thay phần đang làm của bài đó. Các kết quả đã hoàn thành vẫn được giữ. Tiếp tục?',
              )
            )
              return
            updateState((current) => {
              const next = beginPlannedLesson(current)
              return next.draft?.stage === 'intro'
                ? { ...next, draft: { ...next.draft, stage: 'exercise' } }
                : next
            })
          }}
        />
      )}
    </div>
  )
}
