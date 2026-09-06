import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Download, Upload, X } from 'lucide-react'
import { backupText, importBackup, resetState, updateState } from '../data/store'
import { profileSchema, type Profile } from '../data/schema'
import { navigate } from '../app/router'

export function SettingsDialog({
  profile,
  onClose,
}: {
  profile: Profile | null
  onClose: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState('')
  const [name, setName] = useState(profile?.name ?? '')
  const [minutes, setMinutes] = useState(profile?.dailyMinutes ?? 30)
  const [exam, setExam] = useState(profile?.exam ?? 'undecided')
  const [interests, setInterests] = useState<Profile['interests']>(profile?.interests ?? [])
  const [goal, setGoal] = useState<Profile['goal']>(profile?.goal ?? 'explore')
  const [foundation, setFoundation] = useState<Profile['foundation']>(
    profile?.foundation ?? 'unsure',
  )
  const [targetDate, setTargetDate] = useState(profile?.targetDate ?? '')
  useEffect(() => {
    const element = dialog.current!
    element.showModal()
    return () => element.close()
  }, [])

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const result = profileSchema.safeParse({
      name: form.get('name'),
      dailyMinutes: Number(form.get('minutes')),
      exam: form.get('exam'),
      interests,
      goal,
      foundation,
      targetDate: targetDate || null,
    })
    if (!result.success) {
      setMessage('Hãy kiểm tra lại tên, thời gian và ngày mục tiêu (nếu có).')
      return
    }
    updateState((state) => ({ ...state, profile: result.data }))
    onClose()
  }

  function download() {
    const url = URL.createObjectURL(new Blob([backupText()], { type: 'application/json' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `moi-ngay-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <dialog
      ref={dialog}
      className="settings-dialog"
      aria-labelledby="settings-title"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="dialog-heading">
        <div>
          <p className="eyebrow">KHÔNG GIAN CỦA BẠN</p>
          <h2 id="settings-title">Học theo nhịp của mình</h2>
        </div>
        <button className="icon-button" aria-label="Đóng cài đặt" onClick={onClose}>
          <X size={21} />
        </button>
      </div>
      <a className="settings-install-link" href="#/install" onClick={onClose}>
        <Download size={17} /> Thêm vào màn hình chính
      </a>
      <form onSubmit={save}>
        {!profile && (
          <p className="onboarding-intro">
            Một phút để chọn điểm bắt đầu. Bạn có thể đóng phần này để học thử ngay, rồi quay lại
            thay đổi bất cứ lúc nào.
          </p>
        )}
        <label className="field">
          Mình gọi bạn là gì?
          <input
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={40}
            placeholder="Tên của bạn (không bắt buộc)"
            autoComplete="given-name"
          />
        </label>
        <div className="field-grid">
          <label className="field">
            Thời gian có thể học mỗi ngày
            <select
              name="minutes"
              value={minutes}
              onChange={(event) =>
                setMinutes(Number(event.target.value) as Profile['dailyMinutes'])
              }
            >
              <option value="15">15 phút</option>
              <option value="30">30 phút</option>
              <option value="60">60 phút</option>
              <option value="120">120 phút</option>
              <option value="180">180 phút</option>
            </select>
          </label>
          <label className="field">
            Loại bài thi dự định
            <select
              name="exam"
              value={exam}
              onChange={(event) => setExam(event.target.value as Profile['exam'])}
            >
              <option value="undecided">Mình chưa quyết định</option>
              <option value="academic">IELTS Academic</option>
              <option value="general">IELTS General Training</option>
            </select>
          </label>
        </div>
        <div className="field-grid">
          <label className="field">
            Mục tiêu của bạn
            <select
              value={goal}
              onChange={(event) => setGoal(event.target.value as Profile['goal'])}
            >
              <option value="explore">Mình đang khám phá</option>
              <option value="foundation">Xây lại nền tảng tiếng Anh</option>
              <option value="ielts65">Hướng đến IELTS 6.5</option>
            </select>
          </label>
          <label className="field">
            Ngày mục tiêu (không bắt buộc)
            <input
              type="date"
              value={targetDate}
              max="9999-12-31"
              onChange={(event) => setTargetDate(event.target.value)}
            />
          </label>
        </div>
        <label className="field">
          Bạn thấy nền tảng hiện tại thế nào?
          <select
            value={foundation}
            onChange={(event) => setFoundation(event.target.value as Profile['foundation'])}
          >
            <option value="unsure">Mình chưa biết rõ</option>
            <option value="starting">Mình cần học lại từ đầu</option>
            <option value="some">Mình hiểu được một số câu đơn giản</option>
          </select>
        </label>
        <p className="muted small">
          Đây là tự nhận xét để ghi lại điểm bắt đầu, chưa phải bài đánh giá trình độ.
        </p>
        <fieldset className="interest-field">
          <legend>Bạn thích tìm hiểu điều gì?</legend>
          <div className="chips">
            {(['Đời sống', 'Giải trí', 'Ăn uống', 'Học tập'] as const).map((topic) => (
              <button
                key={topic}
                type="button"
                className={`chip ${interests.includes(topic) ? 'selected' : ''}`}
                aria-pressed={interests.includes(topic)}
                onClick={() =>
                  setInterests((current) =>
                    current.includes(topic)
                      ? current.filter((item) => item !== topic)
                      : [...current, topic],
                  )
                }
              >
                {topic}
              </button>
            ))}
          </div>
        </fieldset>
        <p className="muted small">
          Thời gian bạn chọn dùng để ghép buổi học từ bài hiện có. Mục tiêu và ngày dự kiến không
          phải dự báo kết quả; vài phút duy trì chưa đủ khối lượng luyện IELTS. App chưa có đánh giá
          đầu vào.
        </p>
        <button className="button primary full-width" type="submit">
          Lưu lựa chọn
        </button>
      </form>
      <section className="backup-section">
        <h3>Giữ lại hành trình của bạn</h3>
        <p className="muted small">
          Tiến độ hiện lưu trên trình duyệt này, chưa đồng bộ tài khoản. Tải bản sao để giữ lại
          trước khi đổi máy hoặc xóa dữ liệu trình duyệt. Bản sao có thể chứa tên và câu bạn đã
          viết.
        </p>
        <div className="button-row">
          <button className="button secondary small-button" onClick={download}>
            <Download size={16} /> Tải bản sao
          </button>
          <button
            className="button secondary small-button"
            onClick={() => fileInput.current?.click()}
          >
            <Upload size={16} /> Khôi phục
          </button>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={async (event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (!file) return
            if (file.size > 5_000_000) {
              setMessage('Bản sao vượt quá 5 MB.')
              return
            }
            try {
              const raw = await file.text()
              if (
                !window.confirm(
                  'Khôi phục sẽ thay thế tiến độ hiện tại trên trình duyệt này. Bạn đã giữ bản sao cần thiết chưa?',
                )
              )
                return
              const restored = importBackup(raw)
              setName(restored.profile?.name ?? '')
              setMinutes(restored.profile?.dailyMinutes ?? 30)
              setExam(restored.profile?.exam ?? 'undecided')
              setInterests(restored.profile?.interests ?? [])
              setGoal(restored.profile?.goal ?? 'explore')
              setFoundation(restored.profile?.foundation ?? 'unsure')
              setTargetDate(restored.profile?.targetDate ?? '')
              navigate('/today')
              setMessage('Đã khôi phục tiến độ từ bản sao.')
            } catch {
              setMessage(
                'Không khôi phục được: file không hợp lệ, khác phiên bản hoặc trình duyệt không cho lưu. Dữ liệu hiện tại được giữ nguyên.',
              )
            }
          }}
        />
        <button
          className="text-button danger"
          onClick={() => {
            if (
              !window.confirm(
                'Xóa toàn bộ tiến độ trên trình duyệt này? Hãy tải bản sao trước nếu bạn muốn giữ lại.',
              )
            )
              return
            try {
              resetState()
              onClose()
              navigate('/today')
            } catch {
              setMessage('Trình duyệt chưa cho phép xóa dữ liệu. Vui lòng thử lại.')
            }
          }}
        >
          Xóa dữ liệu trên thiết bị
        </button>
      </section>
      <p role="status" className="small">
        {message}
      </p>
    </dialog>
  )
}
