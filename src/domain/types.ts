export type Exercise = {
  id: string
  kind: 'choice' | 'input'
  prompt: string
  options?: string[]
  answers: string[]
  hint: string
  explanation: string
  passage?: string
  audioText?: string
}

export type Lesson = {
  id: string
  day: number
  title: string
  subtitle: string
  topic: 'Đời sống' | 'Giải trí' | 'Ăn uống' | 'Học tập'
  color: 'peach' | 'mint' | 'lavender' | 'sand'
  icon: 'hello' | 'game' | 'coffee' | 'book' | 'sun' | 'walk' | 'study'
  minutes: number
  phrase: string
  translation: string
  note: string
  exercises: Exercise[]
  review: Exercise
  reflection: string
  goal?: string
  speaking?: string
  selfCheck?: string[]
  checkpoint?: number
}
