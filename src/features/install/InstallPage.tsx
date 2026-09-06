import { useState, useSyncExternalStore } from 'react'
import { ArrowLeft, ArrowRight, Check, Download, Monitor, Smartphone } from 'lucide-react'
import {
  getInstallSnapshot,
  requestInstallation,
  subscribeInstallation,
} from '../../app/installation'
import '../../styles/install.css'

const guides = {
  ios: {
    label: 'iPhone / iPad',
    browser: 'Mở bằng Safari',
    steps: [
      'Mở trang Mỗi ngày trong Safari. Nếu đang xem từ Zalo, Facebook hoặc ứng dụng khác, hãy mở địa chỉ này bằng Safari trước.',
      'Chạm Chia sẻ (Share). Tùy bố cục Safari, bạn có thể cần mở menu Thêm trước.',
      'Chọn Thêm vào Màn hình chính (Add to Home Screen). Nếu chưa thấy, tìm trong Sửa tác vụ (Edit Actions).',
      'Bật Mở dưới dạng ứng dụng web (Open as Web App) nếu có, rồi chạm Thêm (Add). Mở biểu tượng Mỗi ngày để học.',
    ],
  },
  android: {
    label: 'Android',
    browser: 'Mở bằng Chrome',
    steps: [
      'Mở trang Mỗi ngày trong Chrome. Nếu đang xem từ một ứng dụng khác, hãy mở địa chỉ này bằng Chrome trước.',
      'Chạm menu ba chấm bên cạnh thanh địa chỉ.',
      'Tìm Cài đặt và tạo lối tắt → Cài đặt (Install and create shortcut → Install). Một số phiên bản ghi Cài đặt ứng dụng hoặc Thêm vào màn hình chính.',
      'Làm theo xác nhận của Chrome. Khi biểu tượng Mỗi ngày xuất hiện, chạm để mở app.',
    ],
  },
  desktop: {
    label: 'Máy tính',
    browser: 'Mở bằng Chrome hoặc Edge',
    steps: [
      'Mở trang Mỗi ngày trong Chrome hoặc Edge.',
      'Tìm biểu tượng cài ứng dụng trên thanh địa chỉ. Trong Chrome, bạn cũng có thể mở menu ba chấm → Truyền, lưu và chia sẻ → Cài đặt trang dưới dạng ứng dụng.',
      'Trong Edge, tìm mục Ứng dụng trong menu. Xác nhận cài khi trình duyệt hiển thị lựa chọn.',
      'Mở Mỗi ngày từ danh sách ứng dụng. Nếu trình duyệt không có mục cài, bạn vẫn có thể đánh dấu trang để quay lại học.',
    ],
  },
}
type Platform = keyof typeof guides

function suggestedPlatform(): Platform {
  const agent = navigator.userAgent
  if (/iPhone|iPad|iPod/i.test(agent) || (/Macintosh/i.test(agent) && navigator.maxTouchPoints > 1))
    return 'ios'
  return /Android/i.test(agent) ? 'android' : 'desktop'
}

export function InstallPage({ onSettings }: { onSettings: () => void }) {
  const { standalone, available, busy, message } = useSyncExternalStore(
    subscribeInstallation,
    getInstallSnapshot,
  )
  const [platform, setPlatform] = useState<Platform>(suggestedPlatform)
  const guide = guides[platform]
  const localAddress = /^(localhost|127(?:\.\d{1,3}){3}|\[::1\])$/.test(window.location.hostname)

  return (
    <div className="install-page">
      <a className="text-button install-back" href="#/today">
        <ArrowLeft size={16} /> Về Hôm nay
      </a>
      <header className="page-heading">
        <p className="eyebrow">MỖI NGÀY, GẦN HƠN MỘT CHẠM</p>
        <h1>Thêm vào màn hình chính</h1>
        <p>Một góc nhỏ cho tiếng Anh, ngay cạnh những ứng dụng quen thuộc.</p>
      </header>

      <section className="install-hero" aria-label="Mở Mỗi ngày như ứng dụng">
        <img
          className="install-icon"
          src={`${import.meta.env.BASE_URL}icons/icon-192.png`}
          width="88"
          height="88"
          alt="Biểu tượng Mỗi ngày"
        />
        <div>
          <h2>
            {standalone ? 'Bạn đang mở ở chế độ ứng dụng.' : 'Chạm biểu tượng. Tiếp tục bài học.'}
          </h2>
          <p>
            {standalone
              ? 'Bạn có thể quay lại Hôm nay để tiếp tục phiên đã lưu trong cửa sổ này.'
              : 'Thêm Mỗi ngày để mở trong cửa sổ riêng trên thiết bị hỗ trợ. Bạn vẫn có thể học ngay trên web.'}
          </p>
          {standalone ? (
            <span className="install-mode">
              <Check size={17} /> Chế độ ứng dụng
            </span>
          ) : (
            (available || busy) && (
              <button
                className="button primary"
                disabled={busy}
                onClick={() => {
                  void requestInstallation()
                }}
              >
                <Download size={17} /> {busy ? 'Đang chờ trình duyệt…' : 'Cài Mỗi ngày'}
              </button>
            )
          )}
          <p className="install-status" role="status">
            {message}
          </p>
        </div>
      </section>

      {localAddress ? (
        <aside className="install-address">
          <Monitor size={20} aria-hidden="true" />
          <p>
            <strong>Bạn đang dùng bản trên máy này.</strong> Địa chỉ này chỉ mở trên thiết bị đang
            chạy app. Để dùng trên điện thoại, cần một địa chỉ web HTTPS đã triển khai.
          </p>
        </aside>
      ) : (
        !window.isSecureContext && (
          <aside className="install-address">
            <p>
              <strong>Địa chỉ này đang dùng HTTP.</strong> Hãy mở bản HTTPS để dùng tính năng cài
              ứng dụng trên trình duyệt hỗ trợ.
            </p>
          </aside>
        )
      )}

      {!standalone && (
        <section className="panel install-guide" aria-labelledby="install-guide-title">
          <div className="install-guide-heading">
            <Smartphone size={21} />
            <h2 id="install-guide-title">Cài theo thiết bị của bạn</h2>
          </div>
          <div className="install-platforms" role="group" aria-label="Thiết bị cần hướng dẫn">
            {(Object.keys(guides) as Platform[]).map((item) => (
              <button
                key={item}
                className={`chip ${platform === item ? 'selected' : ''}`}
                aria-pressed={platform === item}
                onClick={() => setPlatform(item)}
              >
                {guides[item].label}
              </button>
            ))}
          </div>
          <h3>{guide.browser}</h3>
          <ol className="install-steps">
            {guide.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p className="muted small">
            Tên menu có thể khác theo phiên bản. Nếu không thấy nút cài trong trang, thử menu trình
            duyệt theo hướng dẫn trên. Một tab web thông thường không luôn biết app đã được cài hay
            chưa.
          </p>
        </section>
      )}

      <section className="panel install-data" aria-labelledby="install-data-title">
        <h2 id="install-data-title">Mang theo cả hành trình của bạn</h2>
        <p>
          Tiến độ đang lưu trong trình duyệt này. Trước khi đổi trình duyệt, địa chỉ web hoặc mở bản
          cài lần đầu, hãy tải bản sao. Nếu nơi mới chưa có tiến độ, dùng Khôi phục để nhập file đã
          lưu.
        </p>
        <button className="text-button" onClick={onSettings}>
          Mở cài đặt và bản sao <ArrowRight size={16} />
        </button>
        <p className="muted small">
          Bản hiện tại cần mạng để mở app, chưa có gói học offline hoặc đồng bộ giữa thiết bị. Thêm
          biểu tượng không tự sao lưu tiến độ.
        </p>
      </section>
    </div>
  )
}
