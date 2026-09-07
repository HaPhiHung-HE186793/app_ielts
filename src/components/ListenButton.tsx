import { useEffect, useRef, useState } from 'react'
import { Square, Volume2 } from 'lucide-react'
import pack from '../content/offline-pack.json'

export function ListenButton({ phrase }: { phrase: string }) {
  const source = pack.resources.find((asset) => asset.phrase === phrase)?.path
  const audio = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [message, setMessage] = useState('')
  useEffect(() => {
    const element = audio.current
    const pause = () => {
      if (document.hidden) element?.pause()
    }
    document.addEventListener('visibilitychange', pause)
    return () => {
      element?.pause()
      document.removeEventListener('visibilitychange', pause)
    }
  }, [phrase])
  return (
    <>
      <audio
        ref={audio}
        src={source}
        preload="none"
        onPlaying={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onError={() => {
          setPlaying(false)
          setMessage(
            'Chưa phát được file nghe. Nếu mất mạng, hãy tải gói trước ở phần Thêm vào màn hình chính. Bạn vẫn có thể đọc câu mẫu.',
          )
        }}
      />
      <button
        className="button secondary small-button"
        onClick={() => {
          if (playing) {
            audio.current?.pause()
            return
          }
          const element = audio.current
          if (!element || !source) {
            setMessage('Chưa có file cho câu này. Bạn vẫn có thể đọc câu mẫu.')
            return
          }
          if (element.error) element.load()
          element.currentTime = 0
          void element
            .play()
            .then(() => setMessage('Giọng tổng hợp eSpeak NG; không phải bản thu của giáo viên.'))
            .catch(() =>
              setMessage(
                'Chưa phát được file nghe. Kiểm tra kết nối hoặc gói đã tải; bạn vẫn có thể đọc câu mẫu.',
              ),
            )
        }}
      >
        {playing ? <Square size={18} /> : <Volume2 size={18} />}
        {playing ? 'Dừng nghe' : 'Nghe câu mẫu'}
      </button>
      <p className="muted small" role="status">
        {message}
      </p>
    </>
  )
}
