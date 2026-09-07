import { useSyncExternalStore } from 'react'
import { Download, HardDrive, Trash2 } from 'lucide-react'
import { lessons } from '../../content/lessons'
import {
  getOfflineSnapshot,
  subscribeOffline,
  manageOffline,
  refreshOffline,
  offlinePack,
} from '../../app/offline'

const size = (bytes: number) =>
  `${(bytes / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} MB`

export function OfflinePanel() {
  const { phase, pack, message, update, online } = useSyncExternalStore(
    subscribeOffline,
    getOfflineSnapshot,
  )
  const busy = phase === 'busy'
  const supported = phase !== 'unsupported' && phase !== 'starting'
  const total = offlinePack.resources.reduce((sum, asset) => sum + asset.bytes, 0)
  return (
    <section className="panel offline-panel" aria-labelledby="offline-title">
      <div className="install-guide-heading">
        <HardDrive size={21} />
        <h2 id="offline-title">Mang bài học đi cùng bạn</h2>
      </div>
      <p>Tải trước để mở app, đọc, nghe và làm bài khi mất mạng.</p>
      <div className="offline-pack">
        <div>
          <p className="eyebrow">GÓI NỀN TẢNG · V1</p>
          <h3>{offlinePack.title}</h3>
          <p>
            {lessons.length} bài học/kiểm tra ·{' '}
            {offlinePack.resources.filter((asset) => asset.phrase !== null).length} file nghe ·
            khoảng {size(total)}
          </p>
          <p className="muted small">
            Giọng tổng hợp eSpeak NG, chưa được giáo viên kiểm duyệt. Có câu mẫu bằng chữ đi kèm.
          </p>
        </div>
        <strong className={`offline-badge ${pack?.ready ? 'ready' : ''}`}>
          {pack?.ready
            ? 'Sẵn sàng học offline'
            : pack?.count
              ? 'Gói còn thiếu file'
              : 'Chưa tải gói'}
        </strong>
      </div>
      {pack && (
        <p className="small">
          Đã lưu {pack.count}/{pack.total} file · {size(pack.bytes)}. Phần mở app dùng thêm khoảng{' '}
          {size(pack.shellBytes)}; trình duyệt có thể tính dung lượng lớn hơn.
        </p>
      )}
      {busy && pack && (
        <progress aria-label="Tiến độ tải gói" value={pack.count} max={pack.total} />
      )}
      <div className="offline-actions">
        <button
          className="button primary"
          disabled={!supported || busy || !online}
          onClick={() => {
            void manageOffline('DOWNLOAD')
          }}
        >
          <Download size={17} />
          {pack?.ready ? 'Tải lại gói' : pack?.count ? 'Thử tải lại' : 'Tải gói để học offline'}
        </button>
        {supported && (
          <button
            className="button secondary"
            disabled={busy}
            onClick={() => {
              void refreshOffline()
            }}
          >
            Kiểm tra file đã lưu
          </button>
        )}
        {!!pack?.count && (
          <button
            className="text-button"
            disabled={busy}
            onClick={() => {
              if (
                window.confirm(
                  'Xóa các file bài/audio đã tải? Tiến độ, bài dở và phần chờ đồng bộ vẫn giữ nguyên. Bạn cần mạng để tải lại phần nghe.',
                )
              )
                void manageOffline('DELETE')
            }}
          >
            <Trash2 size={16} />
            Xóa gói tải xuống
          </button>
        )}
      </div>
      <p role="status" className={phase === 'error' ? 'offline-error' : 'muted small'}>
        {phase === 'starting' ? 'Đang chuẩn bị phần mở app…' : message}
      </p>
      {!online && (
        <p className="note-box">
          Đang mất mạng. Bài đã lưu vẫn dùng được; đăng nhập mới và đồng bộ cần kết nối.
        </p>
      )}
      {update && (
        <p className="note-box">
          Có bản cập nhật đã sẵn sàng. Đóng tất cả cửa sổ Mỗi ngày rồi mở lại để dùng bản mới. Bài
          dở và phần chờ đồng bộ được giữ; gói thay đổi phiên bản sẽ cần tải lại.
        </p>
      )}
      <p className="muted small">
        File bài học dùng chung trên trình duyệt này; câu trả lời và tài khoản không nằm trong gói.
        Xóa gói giữ phần mở app và tiến độ. Trình duyệt có thể thu hồi dữ liệu khi thiếu chỗ: hãy
        kiểm tra gói trước chuyến đi và giữ bản sao tiến độ. Đồng bộ chạy khi mở app có mạng và bạn
        đã bật đồng bộ tài khoản.
      </p>
    </section>
  )
}
