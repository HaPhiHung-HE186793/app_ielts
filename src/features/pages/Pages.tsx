import { useState } from 'react'
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  Compass,
  Headphones,
  Leaf,
  PenLine,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import { lessons, findLesson } from '../../content/lessons'
import type { StudyState } from '../../data/schema'
import type { Lesson } from '../../domain/types'
import { LessonCard } from '../../components/LessonCard'

export function Discover({
  state,
  onStart,
}: {
  state: StudyState
  onStart: (lesson: Lesson) => void
}) {
  const [topic, setTopic] = useState('Tất cả')
  const completed = new Set(state.completions.map((item) => item.lessonId))
  const filtered = lessons.filter((lesson) => topic === 'Tất cả' || lesson.topic === topic)
  return (
    <>
      <header className="page-heading">
        <p className="eyebrow">BẮT ĐẦU TỪ ĐIỀU BẠN THÍCH</p>
        <h1>Một chút tò mò mỗi ngày.</h1>
        <p>Bảy câu chuyện nhỏ để làm quen với tiếng Anh trong cuộc sống.</p>
      </header>
      <div className="discovery-banner">
        <span className="small-art mint">
          <Compass size={27} />
        </span>
        <div>
          <strong>Bộ làm quen · Tuần đầu tiên</strong>
          <p>Đọc câu mẫu, tự nhớ lại và thử trong một tình huống mới.</p>
        </div>
        <span className="outline-tag">Nền tảng</span>
      </div>
      <div className="chips topic-chips" aria-label="Lọc theo chủ đề">
        {['Tất cả', 'Đời sống', 'Giải trí', 'Ăn uống', 'Học tập'].map((item) => (
          <button
            key={item}
            className={`chip ${item === topic ? 'selected' : ''}`}
            onClick={() => setTopic(item)}
            aria-pressed={item === topic}
          >
            {item}
          </button>
        ))}
      </div>
      <p className="muted small" role="status">
        {filtered.length} bài học · Khoảng 5 phút mỗi bài
      </p>
      <div className="lesson-grid discovery-grid">
        {filtered.map((lesson) => (
          <LessonCard
            key={lesson.id}
            lesson={lesson}
            completed={completed.has(lesson.id)}
            onStart={onStart}
          />
        ))}
      </div>
      <div className="end-note">
        <Leaf size={20} />
        <p>Đã hết bộ bài này. Bạn có thể nghỉ hoặc quay lại câu chuyện mình thích.</p>
        <span className="small muted">
          Học liệu thử nghiệm do dự án biên soạn và rà soát nội bộ, chưa có giáo viên độc lập xác
          nhận.
        </span>
      </div>
    </>
  )
}

export function Practice({ onStart }: { onStart: (lesson: Lesson) => void }) {
  return (
    <>
      <header className="page-heading">
        <p className="eyebrow">THỬ MỘT CHÚT, TỰ TIN MỘT CHÚT</p>
        <h1>Đến lượt bạn sử dụng tiếng Anh.</h1>
        <p>Chọn một cách luyện vừa sức với mình hôm nay.</p>
      </header>
      <div className="practice-grid">
        <section className="panel practice-card">
          <span className="small-art peach">
            <BookOpen size={28} />
          </span>
          <span className="eyebrow">ĐỌC & NHỚ LẠI</span>
          <h2>Một câu, nhiều tình huống</h2>
          <p>
            Hiểu câu mẫu, điền từ và chọn cách diễn đạt phù hợp. Mỗi câu đều có giải thích và cơ hội
            thử lại.
          </p>
          <button className="button primary" onClick={() => onStart(lessons[0])}>
            Luyện từ bài đầu <ArrowRight size={18} />
          </button>
        </section>
        <section className="panel practice-card">
          <span className="small-art mint">
            <Headphones size={28} />
          </span>
          <span className="eyebrow">NGHE & TỰ NÓI</span>
          <h2>Nghe rồi nói theo nhịp mình</h2>
          <p>
            Nghe câu mẫu bằng giọng tổng hợp của thiết bị và tự nói một câu về bản thân. Hiện chưa
            thu âm hay chấm phát âm.
          </p>
          <button className="button secondary" onClick={() => onStart(lessons[1])}>
            Thử câu về sở thích <ArrowRight size={18} />
          </button>
        </section>
        <section className="panel practice-card">
          <span className="small-art lavender">
            <PenLine size={28} />
          </span>
          <span className="eyebrow">TỰ VIẾT MỘT CÂU</span>
          <h2>Kể một chuyện của bạn</h2>
          <p>
            Cuối mỗi bài, ghi lại một câu của riêng bạn. Xem lại các câu đã viết trong Tiến bộ; phần
            này chưa được chấm.
          </p>
          <button className="button secondary" onClick={() => onStart(lessons[5])}>
            Kể chuyện hôm qua <ArrowRight size={18} />
          </button>
        </section>
        <section className="panel practice-card gentle-card">
          <Sparkles size={28} strokeWidth={1.5} />
          <span className="eyebrow">SẼ ĐƯỢC BỔ SUNG</span>
          <h2>Gia sư AI & luyện IELTS</h2>
          <p>
            Hội thoại, chữa bài mở và thi thử nằm ở các giai đoạn tiếp theo. Bản hiện tại dùng đáp
            án và giải thích đã biên soạn.
          </p>
          <a href="#/discover" className="text-link">
            Học nền tảng trước <ArrowRight size={16} />
          </a>
        </section>
      </div>
    </>
  )
}

export function Progress({ state, onSettings }: { state: StudyState; onSettings: () => void }) {
  const unique = new Set(state.completions.map((item) => item.lessonId)).size
  const firstTry = state.completions.reduce((sum, item) => sum + item.independent, 0)
  const responses = state.completions.length * 3
  const reviewIndependent = state.reviewLog.filter((item) => item.independent).length
  return (
    <>
      <header className="page-heading">
        <p className="eyebrow">SO VỚI CHÍNH MÌNH NGÀY HÔM QUA</p>
        <h1>Mỗi bước đều đáng ghi nhận.</h1>
        <p>Những gì bạn đã thực sự luyện, được giữ lại ở đây.</p>
      </header>
      <div className="stats-grid">
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
          <span>lượt tự nhớ lại đã thực hiện</span>
        </section>
      </div>
      <p className="small muted">
        {state.reviewLog.length
          ? `${reviewIndependent}/${state.reviewLog.length} lượt ôn đúng không cần gợi ý. `
          : ''}
        Các chỉ số này phản ánh bài đã luyện, chưa phải mức thành thạo hay band IELTS.
      </p>
      <section className="panel history-panel">
        <div className="section-heading">
          <h2>Dấu chân trên hành trình</h2>
          <button className="text-button" onClick={onSettings}>
            Lưu bản sao <ArrowUpRight size={15} />
          </button>
        </div>
        {state.completions.length ? (
          <div className="history-list">
            {[...state.completions]
              .reverse()
              .slice(0, 30)
              .map((item) => {
                const lesson = findLesson(item.lessonId)!
                return (
                  <article key={item.id} className="history-item">
                    <span className="history-check">
                      <Check size={17} />
                    </span>
                    <div>
                      <h3>{lesson.title}</h3>
                      <p>
                        {new Intl.DateTimeFormat('vi-VN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        }).format(item.completedAt)}{' '}
                        · {item.independent}/3 câu đúng độc lập
                      </p>
                      {item.reflection && (
                        <blockquote lang="en">
                          {item.reflection}
                          <span>Câu bạn tự viết · Chưa chấm</span>
                        </blockquote>
                      )}
                    </div>
                  </article>
                )
              })}
            {state.completions.length > 30 && (
              <p className="small muted">
                Hiển thị 30 lượt gần nhất. Bản sao chứa toàn bộ lịch sử.
              </p>
            )}
          </div>
        ) : (
          <div className="empty-state">
            <span className="round-icon">
              <Leaf size={29} />
            </span>
            <h2>Trang đầu tiên đang chờ bạn.</h2>
            <p>Hoàn thành một bài học để thấy bước tiến đầu tiên ở đây.</p>
            <a className="button primary" href="#/discover">
              Chọn một bài học <ArrowRight size={18} />
            </a>
          </div>
        )}
      </section>
    </>
  )
}
