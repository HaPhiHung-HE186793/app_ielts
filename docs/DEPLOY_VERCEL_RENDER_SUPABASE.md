# Từ đầu: Supabase → Render → Vercel

> Hướng cũ, được thay ngày 2026-09-10: người dùng sửa DB thành **Neon**. Bắt đầu tại [hướng dẫn Neon](DEPLOY_VERCEL_RENDER_NEON.md). Nội dung dưới đây chỉ mô tả cấu hình Supabase đã có; không chạy các migration/lệnh này trên Neon và không tạo Supabase hosted theo hướng này.

Cập nhật 2026-09-08, theo lựa chọn của chủ dự án. Người dùng xác nhận **chưa tạo project** trên ba dịch vụ. Repository đã có cấu hình để bắt đầu; chưa có URL public/SMTP hoặc kết quả kiểm tra cloud thật.

## 1. Ba dịch vụ làm việc gì?

| Dịch vụ | Vai trò trong code hiện tại |
| --- | --- |
| Vercel | Phục vụ React/PWA, âm thanh và học liệu; chuyển `/api/ai/*` tới Render |
| Supabase | Postgres, Auth email OTP và RLS; browser đăng nhập/đồng bộ trực tiếp bằng publishable key |
| Render | Chạy Node API gia sư, xác minh token Supabase và kiểm soát hạn mức; giữ secret key ở máy chủ |

Browser không kết nối trực tiếp tới Render: request API đi cùng origin của Vercel rồi được chuyển tiếp. Cấu hình này giữ luồng dữ liệu hiện có; không cần viết lại mọi thao tác DB qua Render. AI thật ban đầu tắt, ngân sách 0. Học, ôn, lưu, đăng nhập/đồng bộ vẫn có thể dùng khi các phần đó đã cấu hình xong.

## 2. Chuẩn bị máy và GitHub

Repo: [HaPhiHung-HE186793/app_ielts](https://github.com/HaPhiHung-HE186793/app_ielts), branch `main`. Render/Vercel đều kết nối cùng repo này, root directory để mặc định gốc repository. Chỉ cần cấp quyền GitHub cho repo dùng triển khai.

PowerShell tại `D:\myProject\app_ielts`:

```powershell
git status --short --branch
git pull --ff-only
node --version
npm.cmd ci
```

Nếu có sửa local hoặc Git báo xung đột, giữ lại thay đổi và xử lý trước; không dùng reset/force pull. Dự án chọn Node 22.13+ trong nhánh 22, đã kiểm tra 22.18.0; metadata engines trong lockfile cùng nhánh. Không cần Docker để chạy Render hoặc build Vercel. Docker chỉ dùng khi thử Supabase local.

## 3. Tạo Supabase và đưa schema lên

1. Vào [Supabase Dashboard](https://supabase.com/dashboard), đăng nhập, tạo organization nếu chưa có, chọn **New project**. Đặt tên gợi ý `moi-ngay-ielts`; plan thử theo nhu cầu. Chọn region gần người dùng, ví dụ Singapore nếu có trong danh sách. Đặt mật khẩu database mạnh và lưu ở trình quản lý mật khẩu. [Danh sách region](https://supabase.com/docs/guides/platform/regions).
2. Chờ project sẵn sàng. Mở **Connect** để lấy Project URL, hoặc **Settings → API Keys** để lấy/tạo key. Giữ ba giá trị riêng:

| Giá trị | Hình dạng | Sẽ đặt ở đâu |
| --- | --- | --- |
| Project URL | `https://<project-ref>.supabase.co` | Render và Vercel |
| Publishable key | `sb_publishable_…` | Vercel, công khai trong browser |
| Secret key | `sb_secret_…` | Chỉ Render Environment |

Không dùng legacy `anon`/`service_role` JWT cho cấu hình mới này. Mật khẩu database dùng cho bước CLI, không thay thế API key. Không gửi secret key/mật khẩu/token vào chat, source code hoặc biến `VITE_*`. [Cách lấy và phân biệt key](https://supabase.com/docs/guides/getting-started/api-keys).

3. Project vừa tạo cần tám migration của repo. Trong PowerShell chạy:

```powershell
npx.cmd supabase login
npx.cmd supabase link --project-ref YOUR_PROJECT_REF
npx.cmd supabase db push --linked --dry-run --skip-vault
```

Thay `YOUR_PROJECT_REF` bằng phần ID trong URL Supabase. Đăng nhập theo CLI và nhập mật khẩu DB tại prompt khi được yêu cầu; không đặt password/token trong dòng lệnh hoặc gửi vào chat. Kiểm tra CLI đang trỏ đúng **project mới**; dry-run phải liệt kê tám file của `supabase/migrations/`, không báo đã có schema khác.

Sau khi đối chiếu đúng project và danh sách:

```powershell
npx.cmd supabase db push --linked --skip-vault
npx.cmd supabase migration list --linked
```

Không dùng `db reset`, không thêm `--include-seed`, không chạy `test:auth` lên cloud. Nếu project đã có dữ liệu/schema khác, dừng để đối chiếu/sao lưu thay vì ép migration repair. CLI theo dõi migration đã áp dụng. File `supabase/config.toml` cấu hình local không tự thay đổi Auth/SMTP hosted qua `db push`. [Migration trên Supabase](https://supabase.com/docs/guides/deployment/database-migrations).

Kết quả mong đợi: tám migration local/remote khớp; Table Editor có account_profiles, study_snapshots, study_commits, các bảng reminder và ai_budgets/ai_requests. Migration đã bật RLS/quyền; không tắt RLS để chữa lỗi đăng nhập. Backend tạo một hàng ngân sách riêng khi khởi động, không cần chèn hàng mẫu.

## 4. Email OTP trong Supabase

App nhập mã trong web, không xử lý callback magic link. Vào **Authentication → Email Templates**, đổi phần nội dung của **Magic Link** và **Confirm signup** để hiển thị mã. Có thể dùng:

```html
<h2>Mã đăng nhập Mỗi ngày</h2>
<p>Nhập mã này trong ứng dụng: <strong>{{ .Token }}</strong></p>
<p>Nếu bạn không yêu cầu đăng nhập, hãy bỏ qua email này.</p>
```

Giữ Email provider và đăng ký người mới bật. Nếu đặt thời hạn, 600 giây khớp bản local; app nhận mã số từ 6 đến 10 chữ số. Không tắt xác minh email để bỏ qua lỗi OTP. Sau khi có URL Vercel, quay lại **Authentication → URL Configuration → Site URL** và đặt origin production. [OTP và template](https://supabase.com/docs/guides/auth/auth-email-passwordless).

SMTP mặc định của Supabase chỉ phù hợp thử với email được cho phép thuộc nhóm dự án, hạn mức thấp; không bảo đảm gửi tới email học viên bất kỳ. Trước khi mời người khác dùng, cấu hình **Custom SMTP**: nhà cung cấp gửi mail, host/port/user/password và sender đã xác minh. Nhập thông tin này trực tiếp trong Supabase. Chưa chọn nhà cung cấp mail hoặc có domain thì thử bằng email thuộc team trước và ghi rõ giới hạn; không liên tục bấm gửi lại. [Giới hạn SMTP mặc định](https://supabase.com/docs/guides/auth/auth-smtp).

## 5. Tạo backend trên Render

1. Vào [Render Dashboard](https://dashboard.render.com/), đăng nhập qua GitHub. Chọn **New → Web Service**, kết nối repo `app_ielts`.
2. Điền các thiết lập:

| Trường | Giá trị |
| --- | --- |
| Name | Ví dụ `moi-ngay-api` — tên thực tế có thể có hậu tố |
| Branch | `main` |
| Root Directory | Để trống |
| Runtime | Node |
| Build Command | `npm ci` |
| Start Command | `npm run start:backend` |
| Health Check Path | `/healthz` |
| Instance | Free để thử nếu tài khoản hỗ trợ; lựa chọn trả phí do bạn quyết định |

3. Thêm **Environment Variables** sau; giá trị không bao gồm dấu nháy:

| Biến trên Render | Giá trị |
| --- | --- |
| `NODE_VERSION` | `22.18.0` |
| `SUPABASE_URL` | URL project ở bước 3, không `/` cuối |
| `SUPABASE_SECRET_KEY` | Key `sb_secret_…`, đặt tại ô secret/environment của Render |
| `AI_ENABLED` | `false` |
| `AI_TOTAL_BUDGET_USD` | `0` |
| `APP_ORIGINS` | Tạm bỏ trống; điền URL Vercel production ở bước 7 |

Không cần OPENAI_API_KEY khi AI tắt. Không tạo Render PostgreSQL; DB đã ở Supabase. Không nhập PORT thủ công: server dùng PORT do Render cấp và bind `0.0.0.0`. `render.yaml` đã có cấu hình tương đương nếu muốn dùng New Blueprint, nhưng chỉ chọn một cách để không tạo hai dịch vụ. [Web service/PORT](https://render.com/docs/web-services), [Node version](https://render.com/docs/node-version).

4. Nhấn **Deploy Web Service**, theo dõi logs. Khi thành công, mở `https://<tên-thực-tế>.onrender.com/healthz`; phải thấy `{"status":"ok"}`. Health kiểm tra tiến trình HTTP; khởi động đã thử configure RPC nhưng endpoint này không probe DB mỗi request. Nếu log báo DB/RPC, kiểm tra tám migration và đúng loại key, không đăng key vào log.
5. Lưu URL Render không có `/healthz` và không `/` cuối. URL đó dùng làm `RENDER_API_URL` trên Vercel.

Render Free có thể ngủ sau 15 phút không có traffic, lần gọi sau mất thời gian khởi động lại. Client có timeout nên lần gọi API đầu có thể cần thử lại sau khi backend thức. Học liệu static không phụ thuộc lượt gọi này. Nhắc học nền chưa được triển khai bằng Web Service này; không chạy timer nhắc rồi hứa đúng giờ trên dịch vụ hay ngủ. [Giới hạn Render Free](https://render.com/docs/free).

## 6. Tạo frontend trên Vercel

1. Vào [Vercel Dashboard](https://vercel.com/dashboard), đăng nhập bằng GitHub, chọn **Add New → Project → Import** repo `app_ielts`.
2. Đặt project name, ví dụ `moi-ngay-ielts`; chọn branch production `main`. Root directory để gốc repo.
3. **Framework Preset: Other**. Đây là chủ ý: repo tự tạo Vercel Build Output API, không dùng preset Vite có output mặc định `dist`.

| Thiết lập | Giá trị |
| --- | --- |
| Install Command | `npm ci` (đã có trong vercel.json) |
| Build Command | `npm run build:vercel` (đã có trong vercel.json) |
| Output Directory | **Không bật Override, không nhập dist** |
| Node.js Version | Nhánh `22.x`; engines trong package.json cũng giới hạn nhánh này |

4. Thêm ba Environment Variables cho **Production**:

| Biến trên Vercel | Giá trị |
| --- | --- |
| `VITE_SUPABASE_URL` | Cùng Project URL đã nhập trên Render |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Key `sb_publishable_…` |
| `RENDER_API_URL` | `https://<tên-thực-tế>.onrender.com` |

Không thêm SUPABASE_SECRET_KEY, password DB, key SMTP hoặc OPENAI_API_KEY vào Vercel. Build chỉ đọc ba giá trị công khai trên, không tải `.env` và không tự đưa mọi biến `VITE_*` vào bundle. Hiện config chỉ hỗ trợ hostname chuẩn `supabase.co`/`onrender.com`.

Nếu bật deploy preview, preview cần cấu hình riêng tương ứng; không chia sẻ DB production cho preview một cách mặc định. Hướng dẫn lượt đầu tập trung vào URL production; preview thiếu biến sẽ không build thành công.

5. Nhấn **Deploy**. Lệnh tạo `.vercel/output/static` với 98 file công khai và `.vercel/output/config.json` chứa header/cache/404/proxy. `_headers` kiểu Pages và `release.json` không được publish. Không cần chỉnh source khi tên Render thay đổi: đổi env và **Redeploy**. [Build Output API](https://vercel.com/docs/build-output-api), [routing/header](https://vercel.com/docs/build-output-api/configuration), [Node version](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).

Sau thành công, lưu **URL production ổn định** ở mục Domains, ví dụ `https://moi-ngay-ielts.vercel.app`. Không lấy URL preview chứa hash commit làm địa chỉ học hằng ngày.

## 7. Nối URL và kiểm tra

1. Render → Environment: đặt `APP_ORIGINS` bằng **origin Vercel production thật**, ví dụ `https://moi-ngay-ielts.vercel.app`, không `/`, không `/#/today`; Save/redeploy. Chưa biết URL thì để trống ở lượt boot đầu; bước này phải hoàn thành trước thử browser API. Khi có thêm domain chính thức, thêm origin chính xác, phân cách bằng dấu phẩy. Không dùng `*` hoặc toàn bộ `*.vercel.app`.
2. Supabase → Authentication → URL Configuration: đặt Site URL bằng cùng URL Vercel. Nếu thêm redirect URLs, chỉ thêm URL dùng thật; app hiện nhập OTP, không cần wildcard callback.
3. Mở lần lượt bằng URL thật:

| Đường dẫn | Kết quả mong đợi |
| --- | --- |
| Render `/healthz` | 200, `{"status":"ok"}` |
| Vercel `/api/healthz` | Cùng kết quả, chứng minh route tới Render |
| Vercel `/api/ai/status` mở không token | 401, `unauthorized` — đúng thiết kế |
| Vercel `/#/today` và `/#/lesson/hello` | Mở trực tiếp/reload được, nghe WAV thật |
| Vercel `/#/account` | Gửi/nhập OTP qua email, đăng nhập đúng người |
| Vercel `/duong-dan-khong-co` | 404, không trang app giả thành công |

4. Học một bài, reload, kiểm tra tiến độ. Vào tài khoản bật đồng bộ chủ động; đăng nhập cùng tài khoản trên thiết bị thứ hai để kiểm tra tiếp tục. Với tài khoản khác, kiểm tra không thấy dữ liệu người trước. Không tự chạy bộ test tạo/xóa local vào DB thật.
5. Vào `/#/install` tải đủ pack, đóng/mở lại khi offline, nghe và tiếp tục bài. Kiểm tra trên Safari iPhone/Chrome Android thật rồi mới ghi thiết bị đã đạt. Thêm app lên màn hình chính theo [INSTALLATION.md](INSTALLATION.md).
6. Câu tự viết cuối bài vẫn lưu/hoàn thành được khi AI báo chưa sẵn sàng. Backend đã triển khai không đồng nghĩa AI đã bật. Ngân sách/đối chiếu và task AI-001 còn riêng; mic và phản hồi nói/viết đầy đủ chưa có.

## 8. Lỗi thường gặp

| Hiện tượng | Kiểm tra trước |
| --- | --- |
| Vercel thiếu biến cấu hình | Điền đủ ba biến ở đúng môi trường Production, redeploy; không dùng `npm run build` thay build:vercel |
| Vercel báo không tìm thấy dist | Chọn Other, tắt Output Directory Override; build tạo `.vercel/output` |
| Build báo không xác định revision | Git deployment cần System Environment Variables để lấy VERCEL_GIT_COMMIT_SHA nếu không có checkout Git; không tự điền SHA giả |
| Render không mở cổng | Start `npm run start:backend`, không `ai:local`; đúng Node/env/health path |
| Render báo DB/RPC | Migration đã áp đúng project chưa, key có phải sb_secret_… không |
| `/api/healthz` lỗi nhưng Render health tốt | RENDER_API_URL có đúng origin không, Vercel đã redeploy sau đổi biến chưa |
| API 403 sau đăng nhập | APP_ORIGINS có đúng origin đang mở và Render đã nạp cấu hình mới chưa |
| Không nhận mã/email không được phép | Email template có Token, email thuộc team khi SMTP mặc định; kiểm tra sender/SMTP/hạn mức |
| Mở tên miền mới thấy tiến độ trống | Mỗi origin có kho riêng; dùng sync hoặc xuất/nhập bản sao JSON, giữ bản gốc |
| Sau deploy vẫn bản cũ | Đóng tất cả tab/cửa sổ app rồi mở lại để worker kích hoạt; không xóa storage |

## 9. Cập nhật và trạng thái bàn giao

Sau mỗi lần thay đổi, chạy kiểm tra, commit/push; nếu bật auto deploy theo Git thì theo dõi cả hai deployment. Schema mới cần kế hoạch tương thích/migration trước code phụ thuộc. Đổi biến FE cần build lại; đổi Render env cần nạp lại dịch vụ. Giữ URL production, bản JSON của người học và release tương thích trước rollback; cache offline không sao lưu tiến độ. Xem [DEPLOYMENT.md](DEPLOYMENT.md) cho quy tắc dữ liệu/worker.

Các giá trị cần ghi vào STATUS sau khi bạn tạo xong: Supabase project ref/URL, Render service URL, Vercel production URL, trạng thái tám migration, SMTP, revision/deployment và kết quả bảng kiểm. **Chỉ ghi tên/URL công khai và trạng thái, không ghi key hoặc mật khẩu.** DEPLOY-002 giữ IN_PROGRESS đến khi đã triển khai và kiểm tra URL thật. Metadata SHA trong build dùng Git checkout hoặc [biến hệ thống Vercel](https://vercel.com/docs/environment-variables/system-environment-variables); nguồn từ provider không được đánh dấu là checkout sạch.
