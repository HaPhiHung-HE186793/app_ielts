import { useSyncExternalStore } from 'react'

const readClock = () => Math.floor(Date.now() / 1000) * 1000
const subscribeClock = (listener: () => void) => {
  const timer = window.setInterval(listener, 30_000)
  window.addEventListener('focus', listener)
  document.addEventListener('visibilitychange', listener)
  return () => {
    window.clearInterval(timer)
    window.removeEventListener('focus', listener)
    document.removeEventListener('visibilitychange', listener)
  }
}

export const useClock = () => useSyncExternalStore(subscribeClock, readClock)
