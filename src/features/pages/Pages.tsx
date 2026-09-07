import { useState } from 'react'
import { ArrowRight, BookOpen, Compass, Headphones, Leaf, PenLine, Sparkles } from 'lucide-react'
import { curriculum, lessons } from '../../content/lessons'
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
  const [week, setWeek] = useState(1)
  const completed = new Set(state.completions.map((item) => item.lessonId))
  const selectedWeek = curriculum.find((item) => item.week === week)!
  const filtered = selectedWeek.lessons.filter(
    (lesson) => topic === 'Tất cả' || lesson.topic === topic,
  )
  return (
    <>
      <header className="page-heading">
        <p className="eyebrow">BẮT ĐẦU TỪ ĐIỀU BẠN THÍCH</p>
        <h1>Một chút tò mò mỗi ngày.</h1>
        <p>
          Bốn tuần gợi ý · 28 bài học và 4 bài kiểm tra để nhìn lại. Học theo nhịp mình, có thể dành
          nhiều ngày cho một bài.
        </p>
      </header>
      <div className="discovery-banner">
        <span className="small-art mint">
          <Compass size={27} />
        </span>
        <div>
          <strong>
            Tuần {week} · {selectedWeek.title}
          </strong>
          <p>{selectedWeek.goal}</p>
          <p className="small">
            Nghe · Đọc · Tự nói · Viết — hoàn thành bài không thay đánh giá trình độ.
          </p>
        </div>
        <span className="outline-tag">Nền tảng</span>
      </div>
      <div className="curriculum-tabs" role="group" aria-label="Chọn tuần học">
        {curriculum.map((item) => (
          <button
            key={item.week}
            className={`week-choice ${week === item.week ? 'selected' : ''}`}
            aria-pressed={week === item.week}
            onClick={() => {
              setWeek(item.week)
              setTopic('Tất cả')
            }}
          >
            <strong>Tuần {item.week}</strong>
            <span>
              {item.lessons.filter((lesson) => completed.has(lesson.id)).length}/
              {item.lessons.length} đã học
            </span>
          </button>
        ))}
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
        {filtered.length} bài học/kiểm tra · Khoảng 5 phút mỗi bài, có thể lâu hơn khi luyện nói và
        viết
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
            Nghe file giọng tổng hợp eSpeak NG và tự nói một câu về bản thân. Hiện chưa thu âm hay
            chấm phát âm.
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
