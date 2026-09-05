import { useState } from 'react'
import { ArrowRight, Check, CircleHelp, Leaf, RotateCcw } from 'lucide-react'
import { findLesson, lessons } from '../../content/lessons'
import type { StudyState } from '../../data/schema'
import { updateState } from '../../data/store'
import { recordReview } from '../../domain/session'
import { isCorrect } from '../../domain/learning'
import { navigate } from '../../app/router'

function ReviewQuestion({ lessonId, onNext }: { lessonId: string; onNext: () => void }) {
  const lesson = findLesson(lessonId)!
  const [answer, setAnswer] = useState('')
  const [hinted, setHinted] = useState(false)
  const [result, setResult] = useState<boolean | null>(null)
  const [id] = useState(() => crypto.randomUUID())
  return (
    <form
      className="review-question"
      onSubmit={(event) => {
        event.preventDefault()
        if (!answer.trim() || result !== null) return
        updateState((state) => recordReview(state, lesson.id, answer, hinted, id, Date.now()))
        setResult(isCorrect(lesson.review, answer))
      }}
    >
      <p className="eyebrow">{lesson.title}</p>
      <h2>{lesson.review.prompt}</h2>
      <label className="field">
        Câu trả lời của bạn
        <input
          value={answer}
          maxLength={500}
          disabled={result !== null}
          onChange={(event) => setAnswer(event.target.value)}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="Thử nhớ lại trước khi xem gợi ý…"
        />
      </label>
      {result === null ? (
        <>
          <button type="button" className="text-button hint-button" onClick={() => setHinted(true)}>
            <CircleHelp size={16} /> Mình cần gợi ý
          </button>
          {hinted && <p className="hint-box">{lesson.review.hint}</p>}
          <button className="button primary full-width" disabled={!answer.trim()}>
            Kiểm tra <ArrowRight size={18} />
          </button>
        </>
      ) : (
        <div className={`feedback ${result ? 'correct' : 'retry'}`} role="status">
          <strong>
            {result ? 'Bạn đã nhớ lại được.' : 'Mình sẽ cho bạn gặp lại câu này sớm hơn.'}
          </strong>
          <p>{lesson.review.explanation}</p>
          <p className="small">
            {result && !hinted
              ? 'Lần ôn tới đã được giãn xa hơn.'
              : 'Câu này sẽ đến hạn ôn lại sau 10 phút.'}
          </p>
          <button className="button primary" type="button" onClick={onNext}>
            Tiếp tục <ArrowRight size={18} />
          </button>
        </div>
      )}
    </form>
  )
}

export function ReviewPage({ state, now }: { state: StudyState; now: number }) {
  const [queue, setQueue] = useState<string[] | null>(null)
  const [index, setIndex] = useState(0)
  const cards = Object.entries(state.reviews).sort((a, b) => a[1].dueAt - b[1].dueAt)
  const due = cards.filter(([, card]) => card.dueAt <= now)
  const done = queue !== null && index >= queue.length
  return (
    <>
      <header className="page-heading">
        <p className="eyebrow">GẶP LẠI ĐỂ NHỚ LÂU HƠN</p>
        <h1>Sổ ôn của bạn</h1>
        <p>Thử tự nhớ lại. Chưa nhớ cũng là một phần của việc học.</p>
      </header>
      {queue && !done ? (
        <section className="panel review-panel">
          <div className="section-heading">
            <span className="eyebrow">
              CÂU {index + 1} / {queue.length}
            </span>
            <button
              className="text-button"
              onClick={() => {
                setQueue(null)
                setIndex(0)
              }}
            >
              Tạm dừng
            </button>
          </div>
          <ReviewQuestion
            key={`${index}-${queue[index]}`}
            lessonId={queue[index]}
            onNext={() => setIndex((value) => value + 1)}
          />
        </section>
      ) : done ? (
        <section className="panel empty-state">
          <span className="round-icon">
            <Check size={28} />
          </span>
          <h2>Một lần gặp lại, một lần nhớ hơn.</h2>
          <p>Bạn vừa ôn {queue.length} câu. Kết quả và lịch ôn đã được cập nhật.</p>
          <button
            className="button primary"
            onClick={() => {
              setQueue(null)
              setIndex(0)
            }}
          >
            Về sổ ôn
          </button>
        </section>
      ) : (
        <>
          <section className="review-summary">
            <span className="round-icon">
              <RotateCcw size={27} />
            </span>
            <div>
              <h2>
                {due.length ? `${due.length} câu đang chờ gặp lại` : 'Hôm nay mình cứ thong thả'}
              </h2>
              <p>
                {cards.length
                  ? due.length
                    ? 'Một lượt tối đa 10 câu. Phần còn lại luôn ở đây.'
                    : 'Chưa có câu đến hạn. Bạn có thể học thêm hoặc ôn sớm.'
                  : 'Hoàn thành bài đầu tiên để có những câu ôn của riêng bạn.'}
              </p>
            </div>
            <button
              className="button primary"
              onClick={() => {
                if (!cards.length) {
                  navigate('/discover')
                  return
                }
                setQueue((due.length ? due : cards).slice(0, 10).map(([id]) => id))
                setIndex(0)
              }}
            >
              {cards.length ? (due.length ? 'Bắt đầu ôn' : 'Ôn sớm') : 'Chọn bài đầu tiên'}{' '}
              <ArrowRight size={17} />
            </button>
          </section>
          {cards.length ? (
            <section className="panel">
              <div className="section-heading">
                <h2>Những câu đã học</h2>
                <span className="muted small">{cards.length} mục</span>
              </div>
              <div className="review-list">
                {cards.map(([id, card]) => {
                  const lesson = findLesson(id)!
                  return (
                    <div key={id} className="review-item">
                      <span className={`small-art ${lesson.color}`}>
                        <Leaf size={20} />
                      </span>
                      <div>
                        <h3>{lesson.title}</h3>
                        <p lang="en">{lesson.phrase}</p>
                      </div>
                      <span className={`status-tag ${card.dueAt <= now ? 'due' : ''}`}>
                        {card.dueAt <= now
                          ? 'Đến hạn'
                          : new Intl.DateTimeFormat('vi-VN', {
                              day: 'numeric',
                              month: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            }).format(card.dueAt)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </section>
          ) : (
            <section className="panel empty-state">
              <Leaf size={36} strokeWidth={1.3} />
              <h2>Sổ ôn sẽ lớn lên cùng bạn.</h2>
              <p>
                Mỗi bài trong {lessons.length} bài nền tảng sẽ thêm một câu để bạn luyện nhớ trong
                ngữ cảnh mới.
              </p>
            </section>
          )}
        </>
      )}
    </>
  )
}
