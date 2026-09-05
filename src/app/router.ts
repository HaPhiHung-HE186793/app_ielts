import { useSyncExternalStore } from 'react'

const subscribe = (listener: () => void) => {
  window.addEventListener('hashchange', listener)
  return () => window.removeEventListener('hashchange', listener)
}
const readRoute = () => window.location.hash.slice(1) || '/today'
export const useRoute = () => useSyncExternalStore(subscribe, readRoute)
export const navigate = (path: string) => {
  window.location.hash = path
}
