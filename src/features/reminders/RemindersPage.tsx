import { useEffect, useState, useSyncExternalStore } from 'react'
import { ArrowLeft, Bell, BellOff, Clock3 } from 'lucide-react'
import { getAuthSnapshot, subscribeAuth } from '../../app/auth'
import { useClock } from '../../app/clock'
import { defaultReminderSettings, type ReminderSettings } from './schema'
import {
  changeReminder,
  getReminderSnapshot,
  refreshReminders,
  reminderSupport,
  subscribeReminders,
} from './service'
import '../../styles/account.css'
import '../../styles/reminders.css'

const weekdays = ['Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy', 'Chủ nhật']
function ReminderForm({ initial }: { initial: ReminderSettings }) {
  const [settings, setSettings] = useState(initial)
  const state = useSyncExternalStore(subscribeReminders, getReminderSnapshot)
  const support = reminderSupport()
  const update = (patch: Partial<ReminderSettings>) =>
    setSettings((value) => ({ ...value, ...patch }))
  return (
    <section className="panel account-panel">
      <h2>Lịch riêng trên thiết bị này</h2>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          void changeReminder('save', settings)
        }}
      >
        <fieldset disabled={state.busy} className="reminder-fields">
          <div className="reminder-clocks">
            <label className="field">
              Giờ nhắc
              <input
                type="time"
                required
                value={settings.time}
                onChange={(e) => update({ time: e.target.value })}
              />
            </label>
            <label className="field">
              Múi giờ
              <input
                required
                list="reminder-timezones"
                value={settings.timezone}
                onChange={(e) => update({ timezone: e.target.value })}
                autoCapitalize="none"
                spellCheck={false}
              />
            </label>
          </div>
          <datalist id="reminder-timezones">
            {[
              'Asia/Ho_Chi_Minh',
              'Asia/Bangkok',
              'Asia/Tokyo',
              'Europe/London',
              'America/New_York',
              'Australia/Sydney',
              'UTC',
            ].map((zone) => (
              <option key={zone} value={zone} />
            ))}
          </datalist>
          <p className="muted small">
            Giữ múi giờ đã chọn khi đi xa. Bạn có thể sửa lại bất cứ lúc nào.
          </p>
          <fieldset className="reminder-days">
            <legend>Ngày muốn được nhắc</legend>
            {weekdays.map((label, index) => (
              <label key={label}>
                <input
                  type="checkbox"
                  checked={settings.days.includes(index + 1)}
                  onChange={(e) =>
                    update({
                      days: e.target.checked
                        ? [...settings.days, index + 1].sort()
                        : settings.days.filter((day) => day !== index + 1),
                    })
                  }
                />
                {label}
              </label>
            ))}
          </fieldset>
          <label className="reminder-toggle">
            <input
              type="checkbox"
              checked={settings.quietEnabled}
              onChange={(e) => update({ quietEnabled: e.target.checked })}
            />
            Dùng giờ yên lặng
          </label>
          {settings.quietEnabled && (
            <div className="reminder-clocks">
              <label className="field">
                Yên lặng từ
                <input
                  type="time"
                  required
                  value={settings.quietStart}
                  onChange={(e) => update({ quietStart: e.target.value })}
                />
              </label>
              <label className="field">
                Đến giờ
                <input
                  type="time"
                  required
                  value={settings.quietEnd}
                  onChange={(e) => update({ quietEnd: e.target.value })}
                />
              </label>
            </div>
          )}
          <div className="button-row reminder-actions">
            <button type="submit" className="button secondary">
              Lưu lịch nhắc
            </button>
            {!state.localActive && (
              <button
                type="button"
                className="button primary"
                disabled={!!support || !state.publicKey}
                onClick={() => {
                  void changeReminder('enable', settings)
                }}
              >
                <Bell size={17} />
                Bật nhắc trên thiết bị này
              </button>
            )}
          </div>
        </fieldset>
      </form>
      {state.device?.enabled && (
        <div className="button-row reminder-actions">
          <button
            className="button secondary"
            disabled={state.busy || !state.localActive}
            onClick={() => {
              void changeReminder('snooze', settings)
            }}
          >
            <Clock3 size={17} />
            Dời lượt tới 30 phút
          </button>
          <button
            className="button secondary"
            disabled={state.busy}
            onClick={() => {
              void changeReminder('disable', settings)
            }}
          >
            <BellOff size={17} />
            Tắt nhắc
          </button>
        </div>
      )}
    </section>
  )
}
export function RemindersPage() {
  const now = useClock()
  const auth = useSyncExternalStore(subscribeAuth, getAuthSnapshot)
  const state = useSyncExternalStore(subscribeReminders, getReminderSnapshot)
  const support = reminderSupport()
  useEffect(() => {
    void refreshReminders()
  }, [auth.user?.id, auth.status])
  const healthy = state.heartbeat && now - Date.parse(state.heartbeat) < 90_000
  return (
    <div className="account-page reminders-page">
      <a className="text-button install-back" href="#/today">
        <ArrowLeft size={16} />
        Về Hôm nay
      </a>
      <header className="page-heading">
        <p className="eyebrow">MỘT LỜI MỜI, KHI BẠN MUỐN</p>
        <h1>Nhắc học theo nhịp của bạn</h1>
        <p>
          Chọn lúc thuận tiện để quay lại. Tối đa một lời nhắc mỗi ngày trên thiết bị này; bỏ một
          buổi cũng không sao.
        </p>
      </header>
      <section className="account-banner" aria-label="Trạng thái nhắc học">
        <Bell size={27} />
        <div>
          <h2>{state.localActive ? 'Đã bật nhắc' : 'Nhắc đang tắt trên máy này'}</h2>
          <p>Quyền chỉ được hỏi khi bạn chọn bật. Bạn luôn có thể mở bài mà không cần thông báo.</p>
        </div>
      </section>
      {support && (
        <p role="status">
          {support} <a href="#/install">Xem cách cài app</a>
        </p>
      )}
      {!auth.user ? (
        <section className="panel account-panel">
          <h2>Đăng nhập để lưu lịch riêng</h2>
          <p>Lịch nhắc thuộc tài khoản và trình duyệt hiện tại, mặc định tắt trên thiết bị mới.</p>
          <a className="button primary" href="#/account">
            Mở tài khoản
          </a>
        </section>
      ) : auth.status === 'offline' ? (
        <p role="status">
          Cần kết nối và xác nhận phiên để sửa lịch nhắc. Phần học đã tải vẫn mở được.
        </p>
      ) : (
        <>
          {state.ready && (
            <ReminderForm
              key={`${auth.user.id}:${state.device?.revision ?? 0}`}
              initial={state.device?.settings ?? defaultReminderSettings()}
            />
          )}
          <p role="status" className="account-feedback">
            {state.busy ? 'Đang kiểm tra lịch nhắc…' : state.message}
          </p>
          <button
            className="text-button"
            disabled={state.busy}
            onClick={() => {
              void refreshReminders()
            }}
          >
            Tải lại lịch và trạng thái
          </button>
          {state.ready && (
            <section className="panel account-panel">
              <h2>Lượt nhắc tiếp theo</h2>
              <p>
                {state.device?.enabled && state.device.next_at
                  ? new Intl.DateTimeFormat('vi-VN', {
                      dateStyle: 'full',
                      timeStyle: 'short',
                      timeZone: state.device.settings.timezone,
                    }).format(new Date(state.device.next_at))
                  : 'Chưa có lịch đang bật.'}
              </p>
              {!healthy && (
                <p>
                  Máy nhắc chưa hoạt động hoặc chưa xác nhận gần đây. Lịch đã lưu sẽ chỉ gửi khi máy
                  nhắc chạy và có mạng; lượt quá giờ được bỏ qua.
                </p>
              )}
              {state.device?.enabled && !state.localActive && (
                <p>
                  Đăng ký thông báo trên máy chưa khớp lịch đã lưu. Chọn bật để đăng ký lại hoặc tắt
                  nhắc để hủy lịch.
                </p>
              )}
              {state.device?.last_status === 'accepted' && (
                <p>
                  Dịch vụ đẩy đã nhận lượt gần nhất. Điều này chưa xác nhận thông báo đã hiện trên
                  màn hình.
                </p>
              )}
              {['failed', 'expired'].includes(state.device?.last_status ?? '') && (
                <p>
                  Lượt gửi gần nhất không thành công. Kiểm tra quyền và bật lại nếu bạn vẫn muốn
                  được nhắc.
                </p>
              )}
            </section>
          )}
        </>
      )}
      <section className="panel account-panel">
        <h2>Bạn giữ quyền chủ động</h2>
        <p>
          Dời lịch áp dụng cho lượt tiếp theo; những ngày sau vẫn dùng giờ đã chọn. Nếu lượt dời rơi
          vào giờ yên lặng, app chuyển đến lúc hết yên lặng.
        </p>
        <p className="muted small">
          App lưu giờ, múi giờ và địa chỉ nhận thông báo cho thiết bị. Thông báo chỉ là lời mời học,
          không chứa câu trả lời hoặc điểm. Đăng xuất sẽ hủy đăng ký ở đây; thay đổi có thể không
          thu hồi được thông báo đang tới. Chế độ tập trung, hệ điều hành hoặc mất mạng có thể làm
          thông báo không hiện đúng giờ.
        </p>
        <p className="muted small">
          Bản thử hiện cần máy gửi local đang chạy; chưa xác minh thông báo trên iPhone/Android
          thật.
        </p>
        <a className="text-button" href="#/today">
          Chọn một phiên học
        </a>
      </section>
    </div>
  )
}
