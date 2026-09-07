import { useEffect, useState, useSyncExternalStore, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, Check, LogOut, Mail, UserRound } from 'lucide-react'
import { getAuthSnapshot, signOutHere, subscribeAuth } from '../../app/auth'
import { publicConfig, supabase } from '../../services/supabase'
import '../../styles/account.css'
import { SyncPanel } from './SyncPanel'

function AccountProfile({ userId }: { userId: string }) {
  const [name, setName] = useState('')
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [retry, setRetry] = useState(0)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  useEffect(() => {
    let active = true
    const controller = new AbortController()
    void supabase!
      .from('account_profiles')
      .select('display_name')
      .retry(false)
      .eq('id', userId)
      .abortSignal(controller.signal)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return
        if (error || (data && typeof data.display_name !== 'string')) {
          setState('error')
        } else {
          setName(data?.display_name ?? '')
          setState('ready')
        }
      })
    return () => {
      active = false
      controller.abort()
    }
  }, [userId, retry])

  async function save(event: FormEvent) {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    setMessage('')
    try {
      const { error } = await supabase!
        .from('account_profiles')
        .upsert({ id: userId, display_name: name.trim() })
      setMessage(
        error
          ? 'Chưa lưu được tên tài khoản. Nội dung bạn nhập vẫn còn; hãy thử lại.'
          : 'Đã lưu tên vào tài khoản.',
      )
    } catch {
      setMessage('Chưa kết nối được. Nội dung bạn nhập vẫn còn; hãy thử lại.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="panel account-panel" aria-labelledby="account-profile-title">
      <h2 id="account-profile-title">Tên trong tài khoản</h2>
      {state === 'loading' ? (
        <p role="status">Đang tải tên tài khoản…</p>
      ) : state === 'error' ? (
        <div>
          <p role="alert">
            Chưa tải được thông tin tài khoản. Bạn vẫn có thể học phần đang lưu trên máy.
          </p>
          <button
            className="button secondary"
            onClick={() => {
              setState('loading')
              setRetry((value) => value + 1)
            }}
          >
            Thử tải lại
          </button>
        </div>
      ) : (
        <form onSubmit={save}>
          <label className="field">
            Tên tài khoản
            <input
              autoComplete="nickname"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={40}
            />
          </label>
          <p className="muted small">
            Tên này được lưu cùng tài khoản. Tên gọi và mục tiêu trong cài đặt thuộc phần học tập,
            chỉ được gửi lên khi bạn bật đồng bộ tiến độ.
          </p>
          <button className="button primary" disabled={saving} type="submit">
            <Check size={17} /> {saving ? 'Đang lưu tên…' : 'Lưu tên tài khoản'}
          </button>
          <p className="account-feedback" role="status">
            {message}
          </p>
        </form>
      )}
    </section>
  )
}

function EmailSignIn() {
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [sentTo, setSentTo] = useState('')
  const [busy, setBusy] = useState(false)
  const [remaining, setRemaining] = useState(0)
  const [message, setMessage] = useState('')
  const cooling = remaining > 0
  useEffect(() => {
    if (!cooling) return
    const timer = window.setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [cooling])

  async function send(event?: FormEvent) {
    event?.preventDefault()
    if (busy || cooling) return
    const address = (sentTo || email).trim()
    setBusy(true)
    setMessage('')
    try {
      const { error } = await supabase!.auth.signInWithOtp({
        email: address,
        options: { shouldCreateUser: true },
      })
      if (error)
        setMessage(
          error.status === 429
            ? 'Bạn đã yêu cầu mã gần đây. Hãy chờ một chút rồi thử lại.'
            : 'Chưa gửi được mã. Kiểm tra email và kết nối rồi thử lại.',
        )
      else {
        setSentTo(address)
        setToken('')
        setRemaining(60)
        setMessage('Đã yêu cầu mã. Kiểm tra hộp thư và thư rác của bạn.')
      }
    } catch {
      setMessage('Chưa kết nối được để gửi mã. Bạn vẫn có thể quay lại học.')
    } finally {
      setBusy(false)
    }
  }
  async function verify(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setMessage('')
    try {
      const { error } = await supabase!.auth.verifyOtp({
        email: sentTo,
        token: token.trim(),
        type: 'email',
      })
      if (error)
        setMessage(
          'Mã chưa hợp lệ, đã hết hạn hoặc chưa kết nối được. Kiểm tra mã mới nhất rồi thử lại.',
        )
    } catch {
      setMessage('Chưa xác nhận được mã. Kiểm tra kết nối rồi thử lại.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="panel account-panel" aria-labelledby="account-signin-title">
      <h2 id="account-signin-title">{sentTo ? 'Nhập mã trong email' : 'Đăng nhập bằng email'}</h2>
      {publicConfig.status === 'ready' && publicConfig.url === 'http://127.0.0.1:54321' && (
        <p className="muted small">
          Bản thử trên máy này không gửi email ra ngoài. Lấy mã tại{' '}
          <a href="http://127.0.0.1:54324" target="_blank" rel="noopener noreferrer">
            hộp thư thử
          </a>{' '}
          rồi quay lại nhập bên dưới. Chỉ dùng email và dữ liệu thử.
        </p>
      )}
      {sentTo ? (
        <>
          <p className="account-email">
            Mã được gửi đến <strong>{sentTo}</strong>.
          </p>
          <form onSubmit={verify}>
            <label className="field">
              Mã đăng nhập
              <input
                name="otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6,10}"
                minLength={6}
                maxLength={10}
                required
                value={token}
                onChange={(event) => setToken(event.target.value.replace(/\D/g, ''))}
              />
            </label>
            <button className="button primary full-width" type="submit" disabled={busy}>
              {busy ? 'Đang xác nhận…' : 'Xác nhận mã'}
            </button>
          </form>
          <div className="button-row account-resend">
            <button
              className="text-button"
              disabled={busy || cooling}
              onClick={() => {
                void send()
              }}
            >
              {cooling ? `Gửi lại sau ${remaining}s` : 'Gửi lại mã'}
            </button>
            <button
              className="text-button"
              disabled={busy}
              onClick={() => {
                setSentTo('')
                setToken('')
                setMessage('')
              }}
            >
              Dùng email khác
            </button>
          </div>
        </>
      ) : (
        <form onSubmit={send}>
          <label className="field">
            Email của bạn
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <p className="muted small">
            Không cần đặt mật khẩu. Email mới sẽ được dùng để tạo tài khoản; nhập mã để xác nhận. Dữ
            liệu đã học khi chưa đăng nhập được giữ riêng, không tự đưa vào tài khoản.
          </p>
          <button className="button primary full-width" type="submit" disabled={busy || cooling}>
            <Mail size={17} />{' '}
            {busy
              ? 'Đang yêu cầu mã…'
              : cooling
                ? `Thử lại sau ${remaining}s`
                : 'Nhận mã đăng nhập'}
          </button>
        </form>
      )}
      <p className="account-feedback" role="status">
        {message}
      </p>
    </section>
  )
}

export function AccountPage({ onSettings }: { onSettings: () => void }) {
  const auth = useSyncExternalStore(subscribeAuth, getAuthSnapshot)
  const [signingOut, setSigningOut] = useState(false)
  const [message, setMessage] = useState('')
  async function leave() {
    if (signingOut) return
    setSigningOut(true)
    try {
      setMessage((await signOutHere()) ?? '')
    } catch {
      setMessage('Chưa đăng xuất được. Kiểm tra kết nối rồi thử lại.')
    } finally {
      setSigningOut(false)
    }
  }
  return (
    <div className="account-page">
      <a className="text-button install-back" href="#/today">
        <ArrowLeft size={16} /> Về Hôm nay
      </a>
      <header className="page-heading">
        <p className="eyebrow">KHÔNG GIAN CỦA RIÊNG BẠN</p>
        <h1>Tài khoản của bạn</h1>
        <p>Học theo nhịp của mình, với phần tiến độ được giữ riêng.</p>
      </header>
      {auth.user ? (
        <>
          <section className="account-banner">
            <UserRound size={27} />
            <div>
              <h2>{auth.status === 'offline' ? 'Đang học từ bản lưu trên máy' : 'Đã đăng nhập'}</h2>
              <p className="account-email">{auth.user.email}</p>
            </div>
          </section>
          {auth.status !== 'offline' && <AccountProfile userId={auth.user.id} />}
          <SyncPanel />
          <a className="text-button" href="#/reminders">
            Chọn lịch nhắc học trên thiết bị này <ArrowRight size={16} />
          </a>
        </>
      ) : publicConfig.status !== 'ready' ? (
        <section className="panel account-panel">
          <h2>Bản này đang dùng chế độ không đăng nhập.</h2>
          <p>
            Tính năng tài khoản chưa được cấu hình. Bạn vẫn có thể học và giữ bản sao tiến độ trên
            trình duyệt này.
          </p>
          <a className="button primary" href="#/today">
            Tiếp tục học <ArrowRight size={17} />
          </a>
        </section>
      ) : (
        <EmailSignIn />
      )}
      {auth.error && <p role="alert">{auth.error}</p>}
      <section className="panel account-panel" aria-labelledby="account-data-title">
        <h2 id="account-data-title">Bài học đang được giữ ở đâu?</h2>
        <p>
          {auth.user
            ? 'Phần học hiện tại được giữ riêng cho tài khoản này. Nếu bật đồng bộ, app lưu thêm vào tài khoản và hiển thị kết quả gửi ở trên. Đăng xuất mở lại phần học không đăng nhập.'
            : 'Bạn đang học không cần tài khoản. Phần này vẫn được giữ riêng khi bạn đăng nhập; đăng xuất để quay lại.'}
        </p>
        <p className="muted small">
          Hãy kiểm tra trạng thái đồng bộ và tải bản sao trước khi đổi máy hoặc xóa dữ liệu trình
          duyệt. Dữ liệu local chưa được mã hóa; nếu dùng máy chung, tải bản sao rồi xóa phần học
          hiện tại trong cài đặt trước khi đăng xuất.
        </p>
        <button className="text-button" onClick={onSettings}>
          Mở cài đặt và bản sao <ArrowRight size={16} />
        </button>
        {auth.user && (
          <div className="account-signout">
            <button
              className="button secondary"
              disabled={signingOut}
              onClick={() => {
                void leave()
              }}
            >
              <LogOut size={17} />{' '}
              {signingOut ? 'Đang đăng xuất…' : 'Đăng xuất trên trình duyệt này'}
            </button>
            <p className="account-feedback" role="status">
              {message}
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
