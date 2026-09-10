# Trạng thái bàn giao hiện tại

Cập nhật 2026-09-10, Asia/Saigon.

## Đang ở đâu

**DATA-003 DONE phần code/local. Tiếp theo DEPLOY-002 IN_PROGRESS: deploy Vercel frontend + Render backend + Neon PostgreSQL/Managed Auth và kiểm tra cloud thật.** Không còn cần chuyển code từ đầu hoặc lặp hướng dẫn “chưa có adapter Neon”.

- Neon production/default, neondb, AWS Singapore, pooling bật. Render service `app_ielts` đã được tạo: log 16:39–16:42 ngày 10/09 cho thấy build commit `18d4b56`/Node 22.18.0/npm ci thành công, startup bị chặn vì DATABASE_URL dùng `neondb_owner` thay vì `moi_ngay_runtime`. Chưa kết nối DB hoặc có service Live/domain production được xác minh.
- Auth Base URL công khai đã thấy trong cấu hình Render: `https://ep-long-cell-aztbwvj6.neonauth.c-3.ap-southeast-1.aws.neon.tech/neondb/auth`. Chưa kiểm tra Auth/JWKS/email thật. Ảnh mới hiển thị mật khẩu owner: đã hướng dẫn reset trong Neon, không chép/lưu/gọi bằng mật khẩu đó; chưa có xác nhận đã đổi.
- Đã có migration `db/neon/001_initial.sql`, adapter Auth REST/JWT, API profile/sync/nhắc, role/RLS/CAS và startup Render. PostgreSQL local thật và browser với Auth fixture đã kiểm tra; chưa gọi Neon Auth/SQL/email cloud.
- `start:backend` chạy Neon; `build:vercel` dùng VITE_NEON_AUTH_URL + RENDER_API_URL và proxy Auth/data/AI/health. DATABASE_URL chỉ Render, role moi_ngay_runtime. APP_ORIGINS và Neon Trusted Domains điền sau URL Vercel.
- Giữ 28 bài + bốn kiểm tra, 57 WAV, kho khách/tài khoản, StudyState v3 đọc 1/2/3, ID/backup/outbox. Không ghép tài khoản bằng email. Supabase local/SQL/SDK giữ cho regression và dữ liệu cũ; đường startup cũ là start:backend:supabase.
- AI-001 vẫn IN_PROGRESS, Neon luôn AI tắt/ngân sách 0. Port SQL nhắc/budget không đồng nghĩa đã có worker/provider production. Chưa có beta hoàn chỉnh, điện thoại thật hoặc học liệu giáo viên duyệt.

## Bước người dùng làm ngay

1. Neon → branch production → Postgres database → Roles → reset mật khẩu `neondb_owner` vì ảnh đã hiển thị. Kiểm tra role `moi_ngay_runtime`/migration; đặt mật khẩu runtime riêng rồi Connect bằng đúng role này. Nếu chưa áp migration, dùng [hướng dẫn SQL](DEPLOY_VERCEL_RENDER_NEON.md); không đổi riêng username trong chuỗi owner.
2. Render service hiện có → Environment → Edit → thay toàn bộ DATABASE_URL bằng connection string runtime pooled/TLS → Save and deploy. Build/start đã đúng; chưa cần sửa code. Chờ Live và thử healthz/readyz.
3. Vercel chọn **Other**, build `npm run build:vercel`, hai env công khai; bỏ biến/integration Supabase cũ. Khi có domain, cập nhật APP_ORIGINS/Trusted Domains rồi thử OTP/sync thật.
4. Chưa có quyền truy cập Dashboard để đổi mật khẩu hoặc env thay người dùng. Chỉ gửi URL công khai/log đã che bí mật để tiếp tục; không gửi lại mật khẩu/OTP.

## File quan trọng

- [NEON_BACKEND.md](NEON_BACKEND.md): ranh giới Auth/SQL, kiểm tra và giới hạn; [DECISIONS.md](DECISIONS.md) DEC-023.
- `server/neon/`, `db/neon/001_initial.sql`: triển khai mới, không áp SQL Supabase lên Neon.
- `src/services/backend.ts`, `neon-auth.ts`, `neon-request.ts`, `study-sync.ts`: chọn provider, cookie/token, chủ tài khoản và sync.
- `scripts/test-neon.js`, `server/neon/security.test.ts`, `src/services/neon-auth.test.ts`: kiểm tra migration/HTTP/browser/đổi phiên.
- `render.yaml`, `vercel.json`, `.env.example`, `scripts/release/vercel*.js`: cấu hình triển khai đúng hướng mới.

## Kiểm tra và môi trường

Lượt xử lý log Render này chỉ đối chiếu validator/code và cập nhật tài liệu; không chạy lại test code, không dùng thông tin xác thực trong ảnh, không đổi env/mật khẩu cloud. Các kết quả local dưới đây thuộc mốc DATA-003 trước đó.

- `npm test`: 151 ca/18 file đạt; lint, typecheck, build/verify release, kiểm tra định dạng/liên kết tài liệu và diff đạt.
- `npm run test:neon` đạt PostgreSQL thật, JWT ký thật và browser Auth fixture: hai chủ/RLS/rollback/CAS/replay/đồng thời/nhắc/budget, offline/mất response/reload/đổi tài khoản/cookie HttpOnly/không lưu JWT. Không phải phép thử Neon hosted.
- Vercel Build Output bằng URL fixture đạt; marker env bí mật không vào JS. `.vercel/output` đang chứa URL thử, **không deploy prebuilt này**; cloud phải build từ main với env thật.
- Regression legacy account/sync: 19/20 đạt lượt đầu, một ca mobile chờ logout quá 5 giây khi chạy nặng đồng thời; ca đó chạy riêng hai lần đều đạt. Release khách **38/38 đạt** lượt chạy lại tuần tự; lượt đầu có một timeout và một lỗi con trỏ latest do build Vercel đồng thời. Không thay assertion hoặc nới timeout để chạy qua.
- Docker Desktop đã được khởi động, các container Supabase local đang chạy. Test Neon tạo/dọn database/login thử riêng; không reset dữ liệu Supabase. Không có server test Neon còn chạy. Bản preview release 4176 chỉ chạy trong test; kiểm tra tiến trình nếu muốn dùng local tiếp.
- Thay đổi IDE có sẵn của người dùng: `.idea/misc.xml`, `.idea/inspectionProfiles/`, `.idea/prettier.xml`, giữ nguyên ngoài commit task. Không stage `.local`, artifact, secret hoặc dữ liệu học viên.

## Tiếp theo cụ thể

**DEPLOY-002:** sửa DATABASE_URL Render sang runtime role, xác nhận mật khẩu owner đã đổi, redeploy và kiểm tra readyz. Sau khi Render Live mới tiếp tục Vercel/origin/OTP/sync và ghi URL/revision. Không cần yêu cầu tạo lại service hoặc hỏi lại Auth Base URL đã có. Migration/TLS/Auth/SMTP/proxy cloud và điện thoại thật còn chưa kiểm tra.
