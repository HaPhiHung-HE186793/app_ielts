# Backend Neon

DATA-003, 2026-09-10. `npm run start:backend` chạy `server/neon/production.ts`. Hướng Vercel → Render → Neon thay Supabase hosted; backend Supabase local và migration cũ giữ nguyên để regression. Thiết lập cloud theo [hướng dẫn deploy](DEPLOY_VERCEL_RENDER_NEON.md).

## Ranh giới dữ liệu và Auth

- `src/services/backend.ts` chọn Neon khi có `VITE_NEON_AUTH_URL`; còn lại giữ đường Supabase local hoặc khách. Release guest/legacy đặt biến Neon rỗng, không kế thừa env vô tình.
- `neon-auth.ts` gọi allowlist REST của Neon Managed Better Auth qua `/api/auth`: gửi/kiểm tra email OTP, get-session, token và sign-out. Không tự tạo mật khẩu, kiểm tra OTP hoặc ký session cho người dùng. Adapter lưu `{user}` làm gợi ý chủ offline, không lưu JWT. Các lần đổi phiên vô hiệu hóa callback cũ; getSession không chạy trong lúc thay đổi phiên. Lỗi mạng giữ bản học local.
- Render chỉ proxy năm đường Auth cố định. Chỉ chuyển cookie `neonauth.*` / `__Secure-neonauth.*`; bỏ Domain upstream, đặt Path `/api/auth` và SameSite Lax, giữ Secure/HttpOnly. Các POST cookie cần Origin có trong allowlist. Không proxy URL, method hay header tùy ý. Cookie ở cùng origin frontend để không phụ thuộc third-party cookies trên Safari; hành vi Safari thật còn cần xác minh.
- `/api/data` chỉ nhận POST với Bearer JWT. `identity.ts` xác minh Ed25519 qua JWKS Neon; issuer/audience là **origin** của Auth Base URL, kiểm tra hết hạn/iat, UUID, email đã xác minh và banned. Body owner phải khớp JWT; role/SQL action do code quyết định. ID không lấy từ email, localStorage hoặc cookie hint để cấp quyền.
- `/api/ai/status` xác thực và báo unavailable; `/api/ai/feedback` không gọi provider. Cấu hình Neon từ chối bật AI/ngân sách khác 0 ở mốc này.

## PostgreSQL

`db/neon/001_initial.sql` là migration độc lập, port tám migration ứng dụng cũ vào schema `moi_ngay`; transaction không xóa/ghi lại dữ liệu Supabase. Không định nghĩa `auth.uid()` hoặc giả lập schema Auth của nhà cung cấp. `accounts` chỉ lưu UUID đã được Render xác minh, không lưu OTP/email/password. `ensure_account` tạo hàng ứng dụng khi cần; đây không phải bảng đăng nhập.

Role SQL `moi_ngay_runtime` đăng nhập từ backend, được phép SET ROLE api/worker; không là chủ bảng hoặc thành viên neon_superuser. Role chủ thực hiện migration riêng. Mỗi request lấy connection trong pool tối đa 5, BEGIN → SET LOCAL ROLE `moi_ngay_api` → set_config actor UUID trong transaction → truy vấn có tham số → COMMIT/ROLLBACK → release. Context không còn sau transaction; không dùng session SET với Neon pooler. Role worker chỉ dùng trong phần quản trị/worker đã được code cho phép, không lấy từ client.

RLS vẫn kiểm tra chủ trên profile/snapshot/receipt/lịch nhắc. Snapshot không cho app ghi trực tiếp; `commit_study` kiểm tra owner/revision, khóa hàng và lưu receipt/hash trong cùng transaction. Gửi lại cùng mutation được trả kết quả đã có; dùng lại mutation với payload khác bị từ chối. State v3 và cơ chế gộp/outbox không đổi.

Budget/nhắc port SQL giữ lock/CAS/quyền và có kiểm tra local. Chưa có tiến trình gửi nhắc hoặc provider AI production trên Neon. UI báo máy nhắc chưa sẵn sàng khi chưa có heartbeat; không đánh dấu notification đã gửi.

Pool bỏ tham số TLS URI trước khi cấu hình `ssl.rejectUnauthorized=true` và SCRAM channel binding; timeout kết nối/truy vấn 10 giây. URL chỉ chấp nhận Neon, TLS và runtime role, không ghi chuỗi bí mật trong lỗi. Startup thử schema_version trước listen. `/healthz` là liveness, `/readyz` thử DB lúc gọi; không chứa dữ liệu cá nhân.

## Giới hạn và kiểm tra

HTTP có giới hạn body, timeout, allowlist origin/route, 240 request/phút/tài khoản, 1.000 tổng/phút và ba lần gửi OTP/phút/email trên một tiến trình. Đây không phải rate limiter chia sẻ giữa nhiều replica; Neon còn có hạn mức Auth riêng. JWT đã cấp có thể còn dùng đến hết hạn, không có kiểm tra revoke từ xa mỗi data request.

`npm run test:neon` cần Docker local, tự tạo database/login thử và dọn đúng phần đã tạo, không reset DB Supabase. Kiểm tra PostgreSQL thật: hai chủ, RLS, rollback/pool reuse, CAS/replay/đồng thời, nhắc và budget trần. HTTP dùng JWT ký Ed25519 thật với JWKS thử. Browser kiểm tra OTP/profile/hai thiết bị/offline/mất phản hồi/reload/đổi tài khoản, cookie HttpOnly và không lưu JWT. **Auth REST ở test là fixture**, không phải Neon hosted hoặc email gửi thật. Không bật trace chứa token.

Vitest thêm ca token issuer/audience/chữ ký/hết hạn/email, cookie proxy và callback Auth muộn sau logout/tab khác. Giữ bộ regression account/sync Supabase và release khách. Chưa kiểm tra Neon TLS/pooler/Auth live, SMTP, Vercel proxy, Render Free khởi động lại, iPhone/Android thật; hoàn tất ở DEPLOY-002 trước khi mở cho học viên.

Thử cài Neon Auth SDK beta gặp xung đột peer dependency/npm edgesOut; không dùng force/legacy-peer-deps. Chọn REST managed API đã có tài liệu thay vì thêm bộ UI Auth không dùng. `pg` 8.23.0 và `jose` 6.2.12 được khóa trong lockfile. Nguồn đối chiếu: [Neon JWT](https://neon.com/docs/auth/guides/plugins/jwt), [OTP](https://neon.com/docs/auth/guides/plugins/email-otp), [Auth flow](https://neon.com/docs/auth/authentication-flow), [SQL roles](https://neon.com/docs/manage/roles), [node-postgres pooling](https://node-postgres.com/features/pooling).
