import {
  ArrowUpRight,
  BookOpen,
  Check,
  Coffee,
  Footprints,
  Gamepad2,
  GraduationCap,
  Hand,
  Sun,
} from 'lucide-react'
import type { Lesson } from '../domain/types'

const icons = {
  hello: Hand,
  game: Gamepad2,
  coffee: Coffee,
  book: BookOpen,
  sun: Sun,
  walk: Footprints,
  study: GraduationCap,
}

export function LessonArt({ lesson }: { lesson: Lesson }) {
  const Icon = icons[lesson.icon]
  return (
    <div className={`lesson-art ${lesson.color}`} aria-hidden="true">
      <span className="art-orbit" />
      <span className="art-dot" />
      <Icon size={44} strokeWidth={1.35} />
      <span className="art-spark">+</span>
    </div>
  )
}

export function LessonCard({
  lesson,
  completed,
  onStart,
}: {
  lesson: Lesson
  completed: boolean
  onStart: (lesson: Lesson) => void
}) {
  return (
    <button className="lesson-card" onClick={() => onStart(lesson)}>
      <LessonArt lesson={lesson} />
      <span className="lesson-card-body">
        <span className="eyebrow">
          {lesson.topic} <span>· {lesson.minutes} phút</span>
        </span>
        <span className="card-title">{lesson.title}</span>
        <span className="card-subtitle">{lesson.subtitle}</span>
        <span className="card-bottom">
          {completed ? (
            <>
              <Check size={15} /> Đã học · Có thể luyện lại
            </>
          ) : (
            <>Bài {String(lesson.day).padStart(2, '0')} · Nền tảng</>
          )}
          <ArrowUpRight size={18} />
        </span>
      </span>
    </button>
  )
}
