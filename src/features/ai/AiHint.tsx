import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Sparkles } from 'lucide-react'
import { getAuthSnapshot, subscribeAuth } from '../../app/auth'
import { getDataEpoch, getSnapshot } from '../../data/store'
import { AI_CONSENT_VERSION, aiErrorMessages, type AiResponse } from '../../ai/contracts'
import {
  AiClientError,
  aiRequestIdentity,
  loadAiRequestIdentity,
  loadAiStatus,
  requestAiHint,
} from '../../ai/client'
import '../../styles/ai.css'

export function AiHint({
  lessonId,
  draftId,
  text,
}: {
  lessonId: string
  draftId: string
  text: string
}) {
  const auth = useSyncExternalStore(subscribeAuth, getAuthSnapshot)
  const [available, setAvailable] = useState<boolean | null>(null)
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [retry, setRetry] = useState(0)
  const [attemptedText, setAttemptedText] = useState<string | null>(null)
  const [savedText, setSavedText] = useState<string | null>(null)
  const [result, setResult] = useState<{ text: string; value: AiResponse } | null>(null)
  const alive = useRef(true),
    abort = useRef<AbortController | null>(null),
    currentText = useRef(text)
  useEffect(() => {
    currentText.current = text
    abort.current?.abort()
    let active = true
    void loadAiRequestIdentity(getSnapshot().scopeKey, draftId, lessonId, text)
      .then((id) => {
        if (active) setSavedText(id ? text : null)
      })
      .catch(() => {
        if (active) setSavedText(null)
      })
    return () => {
      active = false
    }
  }, [text, draftId, lessonId])
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
      abort.current?.abort()
    }
  }, [])
  useEffect(() => {
    if (!auth.user || auth.status !== 'signed-in') return
    let active = true
    const request = new AbortController()
    void loadAiStatus(auth.user.id, request.signal)
      .then((status) => {
        if (active) {
          setAvailable(status.available)
          setMessage(status.available ? '' : aiErrorMessages.unavailable)
        }
      })
      .catch(() => {
        if (active) {
          setAvailable(false)
          setMessage(aiErrorMessages.network)
        }
      })
    return () => {
      active = false
      request.abort()
    }
  }, [auth.user, auth.status, retry])
  async function send(fresh = false) {
    if (busy || !consent || !auth.user || !text.trim() || text.trim().length > 600) return
    const owner = auth.user.id,
      epoch = getDataEpoch(),
      sentText = text,
      scope = getSnapshot().scopeKey
    const controller = new AbortController()
    abort.current = controller
    setBusy(true)
    setMessage('')
    setResult(null)
    setAttemptedText(sentText)
    const current = () =>
      alive.current &&
      epoch === getDataEpoch() &&
      getAuthSnapshot().user?.id === owner &&
      currentText.current === sentText
    try {
      const requestId = await aiRequestIdentity(scope, draftId, lessonId, sentText, fresh)
      if (!current()) return
      const value = await requestAiHint(
        {
          requestId,
          ownerId: owner,
          lessonId,
          text: sentText.trim(),
          consentVersion: AI_CONSENT_VERSION,
        },
        controller.signal,
      )
      if (current()) setResult({ text: sentText, value })
    } catch (error) {
      if (current())
        setMessage(
          error instanceof AiClientError && error.code === 'storage'
            ? 'Chưa lưu được mã lượt gửi trên máy nên app chưa gọi AI. Câu đang viết vẫn được giữ; kiểm tra dung lượng trước khi thử lại.'
            : (aiErrorMessages[error instanceof AiClientError ? error.code : 'network'] ??
                aiErrorMessages.network),
        )
    } finally {
      if (alive.current) {
        setBusy(false)
        if (abort.current === controller) abort.current = null
      }
    }
  }
  const shown = result?.text === text ? result.value : null
  const attempted = attemptedText === text || savedText === text
  const canSubmit =
    !!auth.user &&
    auth.status === 'signed-in' &&
    consent &&
    !!text.trim() &&
    text.trim().length <= 600 &&
    !busy
  return (
    <section className="ai-hint" aria-labelledby="ai-hint-title">
      <h3 id="ai-hint-title">
        <Sparkles size={18} />
        Một gợi ý để tự sửa
      </h3>
      <p className="small muted">
        Phản hồi AI thử nghiệm cho một câu, có thể sai; không phải điểm IELTS hoặc nhận xét đã được
        giáo viên kiểm duyệt.
      </p>
      {!auth.user ? (
        <p className="small">
          Bạn có thể <a href="#/account">đăng nhập</a> để xem gia sư AI đã sẵn sàng chưa. Câu đang
          viết vẫn thuộc phần học hiện tại.
        </p>
      ) : auth.status !== 'signed-in' ? (
        <p className="small" role="status">
          Cần có mạng và xác nhận phiên đăng nhập để gửi. Bạn vẫn có thể hoàn thành bài.
        </p>
      ) : (
        <>
          <label className="ai-consent">
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              disabled={busy}
            />
            <span>Tôi đồng ý gửi câu này và ngữ cảnh bài đến OpenAI để nhận gợi ý.</span>
          </label>
          <p className="small muted">
            App không đính kèm email hoặc hồ sơ học; nội dung bạn nhập vẫn được gửi. Máy chủ giữ
            phản hồi để tải lại trong 24 giờ và dọn khi dịch vụ chạy; chính sách lưu dữ liệu của
            OpenAI vẫn áp dụng. Tối đa 10 lượt thử/ngày UTC, cách nhau ít nhất 20 giây; ngân sách
            chung có thể hết trước.
          </p>
          {text.trim().length > 600 && (
            <p role="status" className="small">
              Gợi ý AI chỉ nhận tối đa 600 ký tự. Câu dài hơn vẫn được lưu và hoàn thành bài bình
              thường.
            </p>
          )}
          <div className="button-row">
            <button
              type="button"
              className="button secondary"
              disabled={!canSubmit || (!available && !attempted)}
              onClick={() => {
                void send()
              }}
            >
              {busy ? 'Đang chờ gợi ý…' : attempted ? 'Kiểm tra lại lượt gửi' : 'Nhờ AI gợi ý'}
            </button>
            {busy && (
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  abort.current?.abort()
                }}
              >
                Dừng chờ phản hồi
              </button>
            )}
            {attempted && !busy && !shown && (
              <button
                type="button"
                className="text-button"
                disabled={!canSubmit || !available}
                onClick={() => {
                  void send(true)
                }}
              >
                Gửi một lượt mới
              </button>
            )}
            {available === false && !busy && (
              <button
                type="button"
                className="text-button"
                onClick={() => setRetry((value) => value + 1)}
              >
                Kiểm tra kết nối AI
              </button>
            )}
          </div>
          <p className="small ai-status" role="status">
            {busy
              ? 'Bạn có thể tiếp tục sửa câu hoặc hoàn thành bài trong lúc chờ. Dừng chờ không bảo đảm hủy chi phí của lượt đã gửi.'
              : message}
          </p>
        </>
      )}
      {shown && (
        <div className="ai-result" role="status">
          <p className="eyebrow">
            {shown.source === 'test-fixture'
              ? 'PHẢN HỒI MÔ PHỎNG — CHỈ DÙNG KIỂM THỬ'
              : 'GỢI Ý TỪ AI · THỬ NGHIỆM'}
          </p>
          <p>{shown.feedback.summary}</p>
          {shown.feedback.strength && (
            <p>
              <strong>Điểm làm được: </strong>
              <q lang="en">{shown.feedback.strength.quote}</q> — {shown.feedback.strength.reason}
            </p>
          )}
          {shown.feedback.improvement && (
            <p>
              <strong>Thử xem lại: </strong>
              <q lang="en">{shown.feedback.improvement.quote}</q> —{' '}
              {shown.feedback.improvement.hint}
            </p>
          )}
          <p>
            <strong>Đến lượt bạn: </strong>
            {shown.feedback.nextStep}
          </p>
          <p className="small muted">
            {shown.provider} · {shown.model} ·{' '}
            {new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(
              new Date(shown.reviewedAt),
            )}
            . Sửa trực tiếp câu của bạn ở trên; app không tự thay câu hoặc đổi lịch ôn.
          </p>
        </div>
      )}
    </section>
  )
}
