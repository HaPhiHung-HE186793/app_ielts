import { useState, useSyncExternalStore } from 'react'
import { Cloud, Download, RefreshCw } from 'lucide-react'
import {
  enableSync,
  getSyncSnapshot,
  pauseSync,
  resolveSync,
  retrySync,
  subscribeSync,
  syncLabels,
} from '../../app/sync'
import { getSnapshot, readGuest, studyStore, subscribe } from '../../data/store'
import { emptyState, type StudyState } from '../../data/schema'
import { mergeStudy } from '../../domain/sync'
import { findLesson } from '../../content/lessons'
import { modeLabels } from '../../domain/planner'

function download(state: StudyState, filename: string) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }),
  )
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
function Summary({ state }: { state: StudyState }) {
  return (
    <div className="sync-summary">
      <p>
        {state.completions.length} lượt học · {state.reviewLog.length} lượt ôn ·{' '}
        {state.quickLog.length} khởi động
      </p>
      <p>
        Tên gọi: {state.profile?.name || 'Chưa đặt'} · {state.profile?.dailyMinutes ?? 30} phút dự
        kiến/ngày
      </p>
      <p>
        Bài dở: {state.draft ? findLesson(state.draft.lessonId)?.title : 'Chưa có'}
        {state.draft?.pendingAnswer ? ` · Câu đang nhập: ${state.draft.pendingAnswer}` : ''}
      </p>
      <p>
        Phiên: {state.plan ? modeLabels[state.plan.mode] : 'Chưa có'}
        {state.plan?.practice.answer ? ` · Câu đang nhập: ${state.plan.practice.answer}` : ''}
      </p>
    </div>
  )
}

export function SyncPanel() {
  const { state, sync, error } = useSyncExternalStore(subscribe, getSnapshot)
  const { phase, canEdit } = useSyncExternalStore(subscribeSync, getSyncSnapshot)
  const [message, setMessage] = useState('')
  const [guest, setGuest] = useState<StudyState | null>(null)
  const [guestChoice, setGuestChoice] = useState<'local' | 'remote'>('local')
  function act(action: () => void | string) {
    try {
      setMessage(action() ?? '')
    } catch {
      setMessage('Chưa thực hiện được. Hãy giữ bản sao và kiểm tra lỗi lưu trên trình duyệt.')
    }
  }
  return (
    <>
      <section className="panel account-panel" aria-labelledby="sync-title">
        <h2 id="sync-title">
          <Cloud size={21} aria-hidden="true" /> Đồng bộ tiến độ
        </h2>
        <p className="sync-status" role="status">
          {syncLabels[phase]}
        </p>
        {!canEdit ? (
          <p>
            Phần học của tài khoản này đang mở ở tab khác. Đóng tab đó hoặc đăng xuất ở đó để học
            tại đây. Bạn vẫn có thể xem tài khoản và đăng xuất bên dưới.
          </p>
        ) : phase === 'unsupported' ? (
          <p>
            Trình duyệt này thiếu khả năng khóa kho giữa các tab. Bạn vẫn học local và tải bản sao
            được; hãy dùng một tab học tại một thời điểm.
          </p>
        ) : !sync ? (
          <>
            <p>
              Bật để lưu bài đã làm, bài dở, mục tiêu, câu bạn viết và lịch ôn vào tài khoản, rồi
              tiếp tục trên trình duyệt khác. Phần học không đăng nhập được giữ riêng.
            </p>
            <button className="button primary" disabled={!!error} onClick={() => act(enableSync)}>
              <Cloud size={17} /> Bật đồng bộ phần học này
            </button>
          </>
        ) : sync.conflict ? (
          <>
            <p>
              Hai nơi đã cùng sửa: <strong>{sync.conflict.fields.join(', ')}</strong>. Chọn phần giữ
              lại cho các mục trùng. Lịch sử có ID khác nhau được gộp; bạn có thể tải cả hai bản
              trước khi chọn.
            </p>
            <div className="sync-versions">
              <section>
                <h3>Trên trình duyệt này</h3>
                <Summary state={sync.conflict.local} />
                <button
                  className="text-button"
                  onClick={() => download(sync.conflict!.local, 'moi-ngay-local.json')}
                >
                  <Download size={15} /> Tải bản trên máy
                </button>
                <button
                  className="button secondary"
                  onClick={() => act(() => resolveSync('local'))}
                >
                  Giữ phần trên máy
                </button>
              </section>
              <section>
                <h3>Đã lưu trong tài khoản</h3>
                <Summary state={sync.conflict.remote.state} />
                <button
                  className="text-button"
                  onClick={() => download(sync.conflict!.remote.state, 'moi-ngay-account.json')}
                >
                  <Download size={15} /> Tải bản tài khoản
                </button>
                <button
                  className="button secondary"
                  onClick={() => act(() => resolveSync('remote'))}
                >
                  Dùng phần trên tài khoản
                </button>
              </section>
            </div>
          </>
        ) : (
          <>
            <p>
              {phase === 'synced'
                ? 'Phần học hiện tại đã được máy chủ xác nhận. Bật đồng bộ trên trình duyệt khác cùng tài khoản để tiếp tục.'
                : 'Bài học được giữ trên máy trong khi chờ gửi. Để tiếp tục đúng tiến độ trên máy khác, chờ trạng thái đã đồng bộ.'}
            </p>
            {sync.lastSyncedAt && (
              <p className="muted small">
                Lần xác nhận gần nhất: {new Date(sync.lastSyncedAt).toLocaleString('vi-VN')}
              </p>
            )}
            <div className="button-row">
              <button
                className="button secondary"
                disabled={phase === 'syncing'}
                onClick={retrySync}
              >
                <RefreshCw size={16} /> Đồng bộ ngay
              </button>
              <button className="text-button" onClick={() => act(pauseSync)}>
                Dừng đồng bộ trên máy này
              </button>
            </div>
            <p className="muted small">
              Dừng không xóa bản đã lưu trong tài khoản; yêu cầu đã gửi có thể đã được máy chủ nhận.
              Giữ tab và tải bản sao nếu còn thay đổi chưa gửi.
            </p>
          </>
        )}
        <p role="alert" className="account-feedback">
          {message}
        </p>
      </section>
      {canEdit && !sync?.conflict && (
        <section className="panel account-panel" aria-labelledby="guest-import-title">
          <h2 id="guest-import-title">Mang phần học trước đăng nhập vào đây</h2>
          <p>
            Chỉ nhập khi bạn chọn. Phần gốc không đăng nhập vẫn được giữ; nếu đã bật đồng bộ, phần
            vừa nhập cũng sẽ được gửi vào tài khoản.
          </p>
          {!guest ? (
            <button className="button secondary" onClick={() => act(() => setGuest(readGuest()))}>
              Xem phần học không đăng nhập
            </button>
          ) : (
            <>
              <Summary state={guest} />
              <fieldset className="sync-import-options">
                <legend>Khi cả hai phần đều có thiết lập hoặc bài dở</legend>
                <label>
                  <input
                    type="radio"
                    name="guest-choice"
                    checked={guestChoice === 'local'}
                    onChange={() => setGuestChoice('local')}
                  />{' '}
                  Giữ phần hiện tại của tài khoản
                </label>
                <label>
                  <input
                    type="radio"
                    name="guest-choice"
                    checked={guestChoice === 'remote'}
                    onChange={() => setGuestChoice('remote')}
                  />{' '}
                  Dùng phần trước đăng nhập
                </label>
              </fieldset>
              <p className="muted small">
                Lịch sử được hợp nhất theo mã lượt làm, không cộng trùng. Với cùng mã nhưng nội dung
                khác, dùng phía bạn chọn ở trên. Tải bản sao nếu cần giữ cả hai biến thể.
              </p>
              <div className="button-row">
                <button
                  className="text-button"
                  onClick={() => download(guest, 'moi-ngay-guest.json')}
                >
                  <Download size={15} /> Tải bản sao phần khách
                </button>
                <button
                  className="button primary"
                  disabled={!!error}
                  onClick={() =>
                    act(() => {
                      const merged = mergeStudy(emptyState(), state, guest, guestChoice)
                      studyStore.writeSync(merged.state, sync)
                      setGuest(null)
                      return 'Đã nhập phần học đã chọn; phần khách gốc vẫn còn.'
                    })
                  }
                >
                  Nhập phần học đã chọn
                </button>
                <button className="text-button" onClick={() => setGuest(null)}>
                  Để sau
                </button>
              </div>
            </>
          )}
        </section>
      )}
    </>
  )
}
