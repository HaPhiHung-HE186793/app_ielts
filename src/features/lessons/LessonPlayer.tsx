import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowRight, Check, ChevronLeft, CircleHelp, PartyPopper, Volume2 } from 'lucide-react'
import type { Draft } from '../../data/schema'
import { updateState } from '../../data/store'
import { completeLesson, submitAnswer } from '../../domain/session'
import type { Exercise, Lesson } from '../../domain/types'
import { LessonArt } from '../../components/LessonCard'

export function ListenButton({ phrase }: { phrase: string }) {
  const [message, setMessage] = useState('')
  useEffect(() => () => window.speechSynthesis?.cancel(), [])
  return (
    <>
      <button
        className="button secondary small-button"
        onClick={() => {
          if (!('speechSynthesis' in window)) {
            setMessage('Trình duyệt này chưa hỗ trợ đọc câu. Bạn vẫn có thể học với văn bản.')
            return
          }
          const voice = new SpeechSynthesisUtterance(phrase)
          voice.lang = 'en-US'
          voice.rate = 0.85
          voice.onerror = () =>
            setMessage('Chưa phát được giọng đọc. Bạn vẫn có thể đọc câu mẫu và tiếp tục.')
          window.speechSynthesis.cancel()
          window.speechSynthesis.speak(voice)
          setMessage('Giọng đọc tổng hợp của thiết bị; không phải bản thu của giáo viên.')
        }}
      >
        <Volume2 size={18} /> Nghe câu mẫu
      </button>
      <p className="muted small" role="status">
        {message}
      </p>
    </>
  )
}

function ExerciseStep({
  exercise,
  draft,
  onAdvance,
}: {
  exercise: Exercise
  draft: Draft
  onAdvance: () => void
}) {
  const response = draft.responses[exercise.id]
  const [answer, setAnswer] = useState(draft.pendingAnswer)
  const [showFeedback, setShowFeedback] = useState(!!response?.submissions.length)
  const input = useRef<HTMLInputElement>(null)
  const nextButton = useRef<HTMLButtonElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    heading.current?.focus()
  }, [])
  const passed = response?.passed ?? false
  const lastWrong = showFeedback && !passed && !!response?.submissions.length

  function rememberAnswer(value: string) {
    setAnswer(value)
    updateState((state) =>
      state.draft ? { ...state, draft: { ...state.draft, pendingAnswer: value } } : state,
    )
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!answer.trim() || showFeedback) return
    updateState((state) => submitAnswer(state, answer))
    setShowFeedback(true)
    requestAnimationFrame(() => nextButton.current?.focus())
  }

  return (
    <form className="exercise-step" onSubmit={submit}>
      <p className="eyebrow">
        {exercise.kind === 'input'
          ? 'TỰ NHỚ LẠI'
          : draft.index === 2
            ? 'THỬ MỘT TÌNH HUỐNG MỚI'
            : 'HIỂU CÂU MẪU'}
      </p>
      <h2 ref={heading} tabIndex={-1}>
        {exercise.prompt}
      </h2>
      {exercise.kind === 'choice' ? (
        <fieldset className="answer-options">
          <legend className="sr-only">Chọn một câu trả lời</legend>
          {exercise.options?.map((option, index) => (
            <label key={option} className={`answer-option ${answer === option ? 'chosen' : ''}`}>
              <input
                type="radio"
                name="answer"
                value={option}
                checked={answer === option}
                disabled={showFeedback}
                onChange={() => rememberAnswer(option)}
              />
              <span className="option-letter">{String.fromCharCode(65 + index)}</span>
              <span>{option}</span>
            </label>
          ))}
        </fieldset>
      ) : (
        <label className="field answer-field">
          Câu trả lời của bạn
          <input
            ref={input}
            value={answer}
            onChange={(event) => rememberAnswer(event.target.value)}
            disabled={showFeedback}
            maxLength={500}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="Nhập phần còn thiếu bằng tiếng Anh…"
          />
        </label>
      )}
      {!showFeedback && (
        <>
          <button
            className="text-button hint-button"
            type="button"
            onClick={() =>
              updateState((state) => {
                if (!state.draft) return state
                const current = state.draft.responses[exercise.id] ?? {
                  submissions: [],
                  hintUsed: false,
                  passed: false,
                }
                return {
                  ...state,
                  draft: {
                    ...state.draft,
                    responses: {
                      ...state.draft.responses,
                      [exercise.id]: { ...current, hintUsed: true },
                    },
                  },
                }
              })
            }
          >
            <CircleHelp size={16} /> Mình cần một gợi ý
          </button>
          {response?.hintUsed && <p className="hint-box">{exercise.hint}</p>}
          <button className="button primary full-width" type="submit" disabled={!answer.trim()}>
            Kiểm tra câu trả lời <ArrowRight size={18} />
          </button>
        </>
      )}
      {showFeedback && (
        <div className={`feedback ${passed ? 'correct' : 'retry'}`} role="status">
          <strong>
            {passed
              ? response?.hintUsed || response?.submissions.length > 1
                ? 'Bạn đã sửa được câu này.'
                : 'Đúng rồi, bạn tự nhớ được!'
              : 'Mình cùng xem lại một chút.'}
          </strong>
          <p>{exercise.explanation}</p>
          {lastWrong && (
            <p className="small">Câu bạn vừa trả lời: {response?.submissions.at(-1)}</p>
          )}
          <button
            ref={nextButton}
            type="button"
            className="button primary"
            onClick={
              passed
                ? onAdvance
                : () => {
                    setShowFeedback(false)
                    rememberAnswer('')
                    requestAnimationFrame(() => input.current?.focus())
                  }
            }
          >
            {passed ? 'Tiếp tục' : 'Thử lại'} <ArrowRight size={18} />
          </button>
        </div>
      )}
    </form>
  )
}

export function LessonPlayer({
  lesson,
  draft,
  onStart,
  onExit,
}: {
  lesson: Lesson
  draft: Draft | null
  onStart: () => void
  onExit: () => void
}) {
  const [receipt, setReceipt] = useState<{ independent: number } | null>(null)
  const current = draft?.lessonId === lesson.id ? draft : null

  if (receipt)
    return (
      <section className="lesson-player completion">
        <span className="completion-icon">
          <PartyPopper size={38} strokeWidth={1.4} />
        </span>
        <p className="eyebrow">MỘT BƯỚC NHỎ ĐÃ HOÀN THÀNH</p>
        <h1>Bạn vừa làm được rồi.</h1>
        <p>Bạn đã học cách {lesson.subtitle.charAt(0).toLowerCase() + lesson.subtitle.slice(1)}</p>
        <div className="result-stat">
          <strong>
            {receipt.independent}
            <span>/3</span>
          </strong>
          <span>câu đúng ngay lần đầu, không cần gợi ý</span>
        </div>
        <p className="muted">
          Cụm từ này đã vào sổ ôn. Nếu đây là lần đầu học, bạn sẽ gặp lại sau một ngày. Kết quả này
          chưa đo khả năng nhớ lâu hay band IELTS.
        </p>
        <button className="button primary" onClick={onExit}>
          Về Hôm nay <ArrowRight size={18} />
        </button>
        <p className="small muted">Bạn có thể nghỉ ở đây. Một bước hôm nay là đáng ghi nhận.</p>
      </section>
    )

  function begin() {
    if (!current) {
      onStart()
      return
    }
    updateState((state) =>
      state.draft ? { ...state, draft: { ...state.draft, stage: 'exercise' } } : state,
    )
  }

  return (
    <section className="lesson-player">
      <div className="player-top">
        <button className="text-button" onClick={onExit}>
          <ChevronLeft size={17} /> Tạm dừng
        </button>
        <span>Bài {String(lesson.day).padStart(2, '0')} · Nền tảng</span>
        <span>{lesson.minutes} phút</span>
      </div>
      <div
        className="step-track"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={5}
        aria-valuenow={
          !current || current.stage === 'intro'
            ? 1
            : current.stage === 'reflection'
              ? 5
              : current.index + 2
        }
        aria-label={`Bước ${!current || current.stage === 'intro' ? 1 : current.stage === 'reflection' ? 5 : current.index + 2} trên 5`}
      >
        {[0, 1, 2, 3, 4].map((step) => (
          <span
            key={step}
            className={
              step <=
              (!current || current.stage === 'intro'
                ? 0
                : current.stage === 'reflection'
                  ? 4
                  : current.index + 1)
                ? 'filled'
                : ''
            }
          />
        ))}
      </div>
      <h1 className="player-title">{lesson.title}</h1>
      {!current || current.stage === 'intro' ? (
        <div className="lesson-intro">
          <LessonArt lesson={lesson} />
          <p className="eyebrow">MỘT CÂU CHO HÔM NAY</p>
          <blockquote lang="en">{lesson.phrase}</blockquote>
          <p>{lesson.translation}</p>
          <ListenButton phrase={lesson.phrase} />
          <div className="note-box">
            <BookNote />
            <p>{lesson.note}</p>
          </div>
          <p className="muted small">Tiếp theo, câu mẫu sẽ được ẩn để bạn thử tự nhớ lại.</p>
          <button className="button primary full-width" onClick={begin}>
            {current ? 'Mình sẵn sàng thử' : 'Bắt đầu bài này'} <ArrowRight size={18} />
          </button>
        </div>
      ) : current.stage === 'exercise' ? (
        <ExerciseStep
          key={`${current.id}-${current.index}`}
          exercise={lesson.exercises[current.index]}
          draft={current}
          onAdvance={() =>
            updateState((state) => {
              if (!state.draft) return state
              const exercise = lesson.exercises[state.draft.index]
              if (!state.draft.responses[exercise.id]?.passed) return state
              return {
                ...state,
                draft: {
                  ...state.draft,
                  index: Math.min(state.draft.index + 1, 2),
                  pendingAnswer: '',
                  stage: state.draft.index === 2 ? 'reflection' : 'exercise',
                },
              }
            })
          }
        />
      ) : (
        <div className="reflection">
          <p className="eyebrow">BIẾN CÂU MẪU THÀNH CÂU CỦA BẠN</p>
          <h2>Đến lượt câu chuyện của bạn.</h2>
          <p>{lesson.reflection}</p>
          <label className="field">
            Ghi lại câu của bạn (không bắt buộc)
            <textarea
              rows={3}
              maxLength={2000}
              value={current.reflection}
              placeholder="Bạn có thể viết hoặc tự nói thành tiếng…"
              onChange={(event) => {
                const value = event.target.value
                updateState((state) =>
                  state.draft ? { ...state, draft: { ...state.draft, reflection: value } } : state,
                )
              }}
            />
          </label>
          <p className="muted small">
            Câu này được lưu để bạn xem lại, chưa được AI hay giáo viên chấm.
          </p>
          <button
            className="button primary full-width"
            onClick={() => {
              updateState((state) => {
                const next = completeLesson(state, Date.now())
                const completion = next.completions.find((item) => item.id === current.id)
                if (completion) setReceipt({ independent: completion.independent })
                return next
              })
            }}
          >
            Hoàn thành bài học <Check size={18} />
          </button>
        </div>
      )}
    </section>
  )
}

function BookNote() {
  return (
    <span className="note-mark" aria-hidden="true">
      Aa
    </span>
  )
}
