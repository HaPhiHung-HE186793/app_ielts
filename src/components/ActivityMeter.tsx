import { useContext, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Clock3, Pause, Play } from 'lucide-react'
import { ActivityGate } from '../app/activity-context'
import type { ActivityEntry, ActivityTarget } from '../data/schema'
import { getDataEpoch, getSnapshot, subscribe, updateState } from '../data/store'
import {
  ActivityClock,
  formatDuration,
  recordActivity,
  splitAtMidnight,
  type TimeSlice,
} from '../domain/activity'

export function ActivityMeter({ attemptId, lessonId, kind, planId }: ActivityTarget) {
  const allowed = useContext(ActivityGate)
  const [paused, setPaused] = useState(false)
  const [running, setRunning] = useState(true)
  const element = useRef<HTMLDivElement>(null)
  const { state } = useSyncExternalStore(subscribe, getSnapshot)
  const epoch = getDataEpoch()
  const total = state.activityLog
    .filter(
      (entry) => entry.attemptId === attemptId && entry.kind === kind && entry.planId === planId,
    )
    .reduce((sum, entry) => sum + entry.elapsedMs, 0)

  useEffect(() => {
    if (!allowed || paused) return
    const root = element.current?.closest('[data-study-activity]')
    if (!root) return
    let pageActive = true
    const eligible = () =>
      pageActive && document.visibilityState === 'visible' && document.hasFocus()
    const clock = new ActivityClock(performance.now(), Date.now(), eligible())
    const visitId = crypto.randomUUID()
    const checkpoints = new Map<string, ActivityEntry>()
    let lastSave = performance.now()

    function collect(slice: TimeSlice | null) {
      if (!slice) return
      for (const part of splitAtMidnight(slice)) {
        const previous = checkpoints.get(part.day)
        checkpoints.set(part.day, {
          id: `${visitId}/${part.day}`,
          attemptId,
          lessonId,
          kind,
          planId,
          day: part.day,
          startedAt: previous?.startedAt ?? part.start,
          recordedAt: part.end,
          elapsedMs: (previous?.elapsedMs ?? 0) + part.end - part.start,
        })
      }
    }
    function save() {
      if (getDataEpoch() !== epoch || !checkpoints.size) return
      updateState((current) => [...checkpoints.values()].reduce(recordActivity, current))
      lastSave = performance.now()
    }
    function tick() {
      collect(clock.setEnabled(eligible(), performance.now(), Date.now()))
      setRunning(clock.isRunning(performance.now()))
      if (performance.now() - lastSave >= 5000) save()
    }
    function visibility() {
      tick()
      save()
    }
    function interact(event: Event) {
      if (!event.isTrusted || !eligible()) return
      collect(clock.interact(performance.now(), Date.now()))
      setRunning(true)
    }
    function pageHide() {
      pageActive = false
      visibility()
    }
    function pageShow() {
      pageActive = true
      visibility()
    }
    const interval = window.setInterval(tick, 1000)
    for (const name of ['pointerdown', 'keydown', 'input'])
      root.addEventListener(name, interact, true)
    // Scrolling the page while reading also counts as interaction, only in this active view.
    window.addEventListener('scroll', interact, true)
    document.addEventListener('visibilitychange', visibility)
    window.addEventListener('focus', visibility)
    window.addEventListener('blur', visibility)
    window.addEventListener('pagehide', pageHide)
    window.addEventListener('pageshow', pageShow)
    return () => {
      window.clearInterval(interval)
      collect(clock.setEnabled(false, performance.now(), Date.now()))
      save()
      for (const name of ['pointerdown', 'keydown', 'input'])
        root.removeEventListener(name, interact, true)
      window.removeEventListener('scroll', interact, true)
      document.removeEventListener('visibilitychange', visibility)
      window.removeEventListener('focus', visibility)
      window.removeEventListener('blur', visibility)
      window.removeEventListener('pagehide', pageHide)
      window.removeEventListener('pageshow', pageShow)
    }
  }, [allowed, paused, epoch, attemptId, lessonId, kind, planId])

  return (
    <div ref={element} className="activity-meter">
      <div>
        <Clock3 size={15} aria-hidden="true" />
        <span>
          {paused || !allowed
            ? 'Đã dừng đo'
            : running
              ? 'Đang đo hoạt động'
              : 'Đang nghỉ · chạm hoặc gõ để tiếp tục'}
          <small>{total ? formatDuration(total) : 'Chưa ghi đủ 1 giây'} trong hoạt động này</small>
        </span>
      </div>
      <button
        type="button"
        className="icon-button"
        aria-label={paused ? 'Tiếp tục đo thời gian' : 'Tạm dừng đo thời gian'}
        aria-pressed={paused}
        onClick={() => setPaused((value) => !value)}
      >
        {paused ? <Play size={16} /> : <Pause size={16} />}
      </button>
      <p>Đo khi cửa sổ có focus; tự dừng sau 60 giây không thao tác. Số đo cập nhật mỗi 5 giây.</p>
    </div>
  )
}
