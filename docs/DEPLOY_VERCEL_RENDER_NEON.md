# Deploy Mỗi ngày: Neon → Render → Vercel

Cập nhật 2026-09-10. Code đã có adapter Neon, migration, backend Node và cấu hình Vercel. Đã kiểm tra PostgreSQL local và trình duyệt với Auth REST mô phỏng; **chưa xác minh Neon Auth/email/TLS hay deployment cloud thật**. DATA-003 hoàn thành phần code/local; DEPLOY-002 đang thực hiện.

Người dùng đã có Neon `production` / `neondb`, pooling bật, AWS Singapore theo ảnh. Render service `app_ielts` đã build thành công commit `18d4b56`, nhưng startup dừng do DATABASE_URL dùng role owner; xem mục 5. Vercel chưa có deployment được xác minh. Không tạo lại DB/service Render. Dùng repo `HaPhiHung-HE186793/app_ielts`, branch `main` mới nhất.

## 1. Chuẩn bị Neon

### Tạo bảng ứng dụng

1. Mở Neon → **SQL Editor**; chọn branch **production**, database **neondb**, role quản trị **neondb_owner**.
2. Mở [db/neon/001_initial.sql](../db/neon/001_initial.sql), sao chép **toàn bộ nội dung** vào SQL Editor rồi bấm **Run**. File này dành riêng cho Neon, chạy một lần trong transaction, tạo schema `moi_ngay` và các role. Không chạy các file trong `supabase/migrations` trên Neon.
3. Chạy truy vấn kiểm tra:

```sql
SELECT version FROM moi_ngay.schema_version;
```

Kết quả phải có một dòng `1`. Nếu SQL báo lỗi, giữ nguyên thông báo để sửa; không xóa DB hay chạy lệnh DROP. Lặp lại migration sẽ báo schema tồn tại, không là cách cập nhật.

### Lấy kết nối cho backend

Migration tạo role SQL **moi_ngay_runtime**, có quyền ứng dụng riêng, chưa có mật khẩu. Trong branch → **Roles** (có thể nằm dưới Postgres database), tìm role này → menu → **Reset password**. Giữ mật khẩu riêng. Nếu giao diện không hiện role SQL, xác nhận bằng `SELECT rolname FROM pg_roles WHERE rolname = 'moi_ngay_runtime';` rồi kiểm tra lại branch; không tạo role cùng tên qua Console.

Mở **Connect**, chọn:

| Trường | Giá trị |
| --- | --- |
| Branch | `production` |
| Database | `neondb` |
| Role | `moi_ngay_runtime` |
| Connection pooling | Bật |
| Connection string | Sao chép chuỗi bắt đầu `postgresql://`, gồm mật khẩu thật và tham số TLS |

Chuỗi này chỉ dán vào **DATABASE_URL trên Render**. Không bao gồm `psql`, dấu nháy của lệnh shell hoặc dấu `***` che mật khẩu. Không đưa vào chat, Git hay Vercel. Backend yêu cầu đúng role `moi_ngay_runtime` và TLS. Role chủ dành cho migration. Neon phân biệt quyền role tạo bằng SQL và role tạo qua Console; xem [quản lý role](https://neon.com/docs/manage/roles).

### Bật đăng nhập email

1. Neon → **Auth → Enable Auth**, dùng branch `production` và database đã chọn.
2. Trong **Configuration**, sao chép **Auth Base URL**. Đây là URL HTTPS công khai, ví dụ cấu trúc `https://<endpoint>.neon.build/neondb/auth`, khác chuỗi PostgreSQL.
3. App dùng **Email OTP**. Mã thử có thể gửi bằng SMTP dùng chung của Neon, chịu hạn mức; dùng **Custom SMTP provider** trước khi mở cho học viên. Cấu hình SMTP trong Neon, không đưa mật khẩu SMTP vào frontend. Xem [Email OTP](https://neon.com/docs/auth/guides/plugins/email-otp), [SMTP và production](https://neon.com/docs/auth/production-checklist).
4. Trusted Domains sẽ điền URL Vercel sau bước 3 bên dưới. Không cần Data API hoặc tạo Supabase integration. Neon Auth hiện beta; cần thử OTP thật và session trên điện thoại trước khi coi đăng nhập đã đạt.

## 2. Điền form Render đang mở

Ảnh báo đỏ vì **Start Command trống**; `yarn start` màu xám là placeholder. Điền:

| Trường | Giá trị |
| --- | --- |
| Name | `moi-ngay-api` hoặc tên service bạn muốn dùng |
| Language | `Node` |
| Branch | `main` |
| Region | `Singapore` |
| Root Directory | Để trống |
| Build Command | `npm ci` |
| Start Command | `npm run start:backend` |
| Compute | `Free` cho lần thử này |
| Advanced → Health Check Path | `/healthz` |

Ở **Environment Variables**, thêm từng dòng:

| Name | Value |
| --- | --- |
| `NODE_VERSION` | `22.18.0` |
| `DATABASE_URL` | Connection string Neon của role `moi_ngay_runtime` ở bước 1 |
| `NEON_AUTH_BASE_URL` | Auth Base URL HTTPS ở bước 1 |
| `AI_ENABLED` | `false` |
| `AI_TOTAL_BUDGET_USD` | `0` |

Chưa cần thêm `APP_ORIGINS` khi chưa có URL frontend. Xóa dòng env rỗng còn thừa rồi bấm **Deploy web service**. Form tạo thủ công không tự đọc hết `render.yaml`; cần nhập các trường trên. Backend tự dùng `PORT` Render cấp và bind `0.0.0.0`. [Render Web Services](https://render.com/docs/web-services).

Chờ trạng thái **Live**. Log thành công có `Neon backend ready; AI disabled.` Sao chép URL HTTPS `https://<tên-thực>.onrender.com` và thử:

- `<URL Render>/healthz` → `{"status":"ok"}`: tiến trình HTTP chạy.
- `<URL Render>/readyz` → `{"status":"ready"}`: truy vấn DB/schema thành công tại thời điểm gọi.

Trang gốc `/` trả 404 là bình thường vì đây là API. Render Free có thể ngủ khi không hoạt động; lần mở lại cần chờ khởi động. Không dùng vòng ping để giữ máy thức. Nếu boot thất bại: kiểm tra role, mật khẩu, branch/database, TLS và kết quả migration trước. Không gửi log chứa connection string.

## 3. Điền form Vercel đang mở

| Trường | Giá trị |
| --- | --- |
| Project Name | `app-ielts` hoặc tên bạn đã chọn |
| Application / Framework Preset | **Other** |
| Root Directory | `./` |
| Install Command | `npm ci` |
| Build Command | `npm run build:vercel` |
| Output Directory | Không bật override; không điền `dist` |
| Node.js | `22.x` theo `package.json` |

`vercel.json` đã cấu hình lệnh build và framework. Mặc dù frontend viết bằng Vite, dự án xuất **Build Output API v3** trong `.vercel/output`, gồm static files, header và proxy riêng. Chọn Other để dùng cấu hình này. [Vercel Build Output API](https://vercel.com/docs/build-output-api).

Mở **Environment Variables**, bỏ hai biến Supabase cũ nếu form còn tự điền, thêm đúng hai biến:

| Name | Value |
| --- | --- |
| `VITE_NEON_AUTH_URL` | Cùng Auth Base URL đã nhập trên Render |
| `RENDER_API_URL` | URL Render đã Live, dạng `https://<tên-thực>.onrender.com`, không `/` cuối |

Không thêm Optional Integration Supabase. Bấm **Create Project / Deploy** theo nút hiện trên form. Khi Ready, lấy **production domain** ổn định trong Settings → Domains, không dùng URL riêng của từng commit. Không deploy `.vercel/output` sẵn trên máy phát triển: artifact kiểm tra chứa URL fixture.

## 4. Nối đúng domain và thử thật

Giả sử production domain thực tế là `https://<domain-thực>.vercel.app`:

1. Render → service → **Environment** → thêm `APP_ORIGINS` bằng **chính xác** URL này, không `/` cuối → **Save, rebuild, and deploy** hoặc nút lưu/redeploy tương ứng.
2. Neon → Auth → **Trusted Domains** → thêm cùng origin HTTPS. Không thêm wildcard toàn bộ `vercel.app`. Nếu đổi domain, cập nhật cả hai nơi. Xem [Neon domains](https://neon.com/docs/auth/guides/configure-domains).
3. Mở `<URL Vercel>/api/healthz` và `/api/readyz`, kiểm tra kết quả như Render.
4. Mở app → Tài khoản → email → Nhận mã → nhập OTP thật → lưu tên. Bật đồng bộ có lựa chọn, học một bài hoặc nhập câu dở; chờ **Đã đồng bộ**. Đăng nhập cùng email trên trình duyệt/điện thoại thứ hai để tiếp tục.
5. Đăng xuất, đăng nhập email khác để xác nhận không hiện bài của tài khoản trước. Tải gói offline, thử mất mạng/mở lại và nối mạng gửi tiếp. Việc học local không tự đồng nghĩa đã sao lưu.

Ghi URL, commit/revision và kết quả thực tế vào STATUS/SESSION_LOG khi đã xác minh. Chưa đánh dấu DEPLOY-002 DONE chỉ vì form tạo project thành công. Với iPhone dùng Safari → Chia sẻ → Thêm vào Màn hình chính; Android dùng chức năng cài app của trình duyệt, xem [INSTALLATION.md](INSTALLATION.md).

## 5. Giới hạn và xử lý lỗi

- `DATABASE_URL...role moi_ngay_runtime`: log này là lỗi kiểm tra cấu hình trước khi kết nối PostgreSQL, không phải lỗi mật khẩu hay schema đã được kiểm tra. Ảnh Render ngày 10/09 dùng `neondb_owner`; sửa bằng Neon Connect → Role `moi_ngay_runtime` → copy **toàn bộ chuỗi mới**, gồm mật khẩu của runtime → Render Environment → Edit → DATABASE_URL → **Save and deploy**. Không chỉ sửa tên role trong chuỗi owner vì mỗi role có mật khẩu riêng. Không cần đổi Build/Start Command đang đúng. [Lưu env và redeploy Render](https://render.com/docs/configure-environment-variables).
- Nếu chưa thấy runtime role, kiểm tra bằng SQL chỉ đọc: `SELECT to_regclass('moi_ngay.schema_version') AS schema_table, EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'moi_ngay_runtime') AS runtime_role_exists;`. Nếu chưa tạo schema/role, áp migration ở mục 1; nếu đã có schema thì không chạy lại migration mù, đối chiếu kết quả trước. Role tạo từ migration cần đặt/reset mật khẩu rồi mới dùng Connect.
- Nếu ảnh/log đã hiển thị mật khẩu, đổi mật khẩu đúng role đó: Neon → branch → Postgres database → Roles → menu role → Reset password. Đổi kết nối ở dịch vụ khác đang dùng role đó nếu có. Không gửi lại connection string hoặc mật khẩu để kiểm tra; chỉ gửi log đã che và kết quả query không có bí mật. [Reset mật khẩu Neon](https://neon.com/docs/manage/roles#reset-a-password).
- Schema/DB chưa sẵn sàng: kiểm tra `SELECT version FROM moi_ngay.schema_version` đúng branch/database. Không reset dữ liệu.
- OTP báo 403: kiểm tra `APP_ORIGINS` và Neon Trusted Domains có đúng production origin không. OTP không tới: kiểm tra spam/hạn mức và SMTP Neon; không cần sửa DATABASE_URL ở frontend.
- Vercel báo thiếu env: điền hai biến ở bước 3 rồi redeploy. Đổi biến VITE cần build lại.
- Neon adapter chỉ lưu gợi ý chủ tài khoản trên máy; JWT trong bộ nhớ, session cookie HttpOnly qua proxy cùng origin. Token có thể còn hiệu lực đến khi hết hạn dù đã logout; Neon JWT hiện có hạn 15 phút. [JWT](https://neon.com/docs/auth/guides/plugins/jwt).
- Supabase local được giữ cho regression, không tự ghép tài khoản cũ bằng email. Dùng xuất/nhập bản sao có lựa chọn nếu muốn chuyển phần học cũ; giữ bản gốc.
- AI vẫn tắt/ngân sách 0. Schema có hàm budget/receipt đã kiểm tra, nhưng chưa nối provider AI hoặc worker nhắc production cho Neon. Không có API key trả phí cần nhập ở mốc này.
- Kiểm tra local tái chạy bằng `npm run test:neon` khi Docker local đang chạy. Script dùng database thử riêng, JWT ký thật và Auth REST mô phỏng, không gửi email/SQL cloud. Chi tiết kiến trúc tại [NEON_BACKEND.md](NEON_BACKEND.md).
