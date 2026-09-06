import type { ActivityEntry, StudyState } from '../data/schema'

export const IDLE_MS = 60_000
export const MAX_TICK_GAP_MS = 10_000
export type TimeSlice = { start: number; end: number }

// Monotonic duration; wall clock is only for attribution to a calendar date.
export class ActivityClock {
  private previous: number
  private wall: number
  private lastInteraction: number
  private enabled: boolean
  private stalled = false

  constructor(mono: number, wall: number, enabled: boolean) {
    this.previous = mono
    this.wall = wall
    this.lastInteraction = mono
    this.enabled = enabled
  }

  tick(mono: number, wall: number): TimeSlice | null {
    const gap = mono - this.previous
    const clockChanged = Math.abs(wall - this.wall - gap) > 2000
    const discontinuity = gap < 0 || gap > MAX_TICK_GAP_MS || clockChanged
    if (discontinuity) this.stalled = true
    const credit =
      this.enabled && !this.stalled
        ? Math.max(0, Math.min(gap, this.lastInteraction + IDLE_MS - this.previous))
        : 0
    const slice = credit >= 1 ? { start: this.wall, end: this.wall + Math.floor(credit) } : null
    this.previous = mono
    this.wall = wall
    return slice
  }

  setEnabled(enabled: boolean, mono: number, wall: number) {
    const slice = this.tick(mono, wall)
    if (enabled && !this.enabled) {
      this.lastInteraction = mono
      this.stalled = false
    }
    this.enabled = enabled
    return slice
  }

  interact(mono: number, wall: number) {
    const slice = this.tick(mono, wall)
    this.lastInteraction = mono
    this.stalled = false
    return slice
  }

  isRunning(mono: number) {
    return this.enabled && !this.stalled && mono < this.lastInteraction + IDLE_MS
  }
}

export function localDay(timestamp: number) {
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function splitAtMidnight(slice: TimeSlice) {
  const parts: (TimeSlice & { day: string })[] = []
  let start = slice.start
  while (start < slice.end) {
    const date = new Date(start)
    const midnight = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).getTime()
    const end = Math.min(midnight, slice.end)
    parts.push({ start, end, day: localDay(start) })
    start = end
  }
  return parts
}

// Each mount/day sends a cumulative checkpoint. Repeated or older writes add no time.
export function recordActivity(state: StudyState, entry: ActivityEntry): StudyState {
  const index = state.activityLog.findIndex((item) => item.id === entry.id)
  const previous = state.activityLog[index]
  if (
    previous &&
    (entry.elapsedMs <= previous.elapsedMs ||
      entry.attemptId !== previous.attemptId ||
      entry.kind !== previous.kind ||
      entry.lessonId !== previous.lessonId ||
      entry.planId !== previous.planId ||
      entry.day !== previous.day ||
      entry.startedAt !== previous.startedAt)
  )
    return state
  const activityLog = [...state.activityLog]
  if (index < 0) activityLog.push(entry)
  else activityLog[index] = entry
  return { ...state, activityLog }
}

export function measuredTime(state: StudyState, planId?: string) {
  const entries =
    planId === undefined
      ? state.activityLog
      : state.activityLog.filter((item) => item.planId === planId)
  return entries.length ? entries.reduce((sum, item) => sum + item.elapsedMs, 0) : null
}

export function formatDuration(ms: number | null) {
  if (ms === null) return 'Chưa có dữ liệu đo'
  if (ms < 1000) return 'Dưới 1 giây'
  const seconds = Math.floor(ms / 1000)
  return seconds < 60 ? `${seconds} giây` : `${Math.floor(seconds / 60)} phút ${seconds % 60} giây`
}
