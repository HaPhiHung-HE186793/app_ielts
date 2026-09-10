# Trạng thái bàn giao hiện tại

Cập nhật 2026-09-10, Asia/Saigon.

## Đang ở đâu

**DATA-003 DONE phần code/local. Tiếp theo DEPLOY-002 IN_PROGRESS: deploy Vercel frontend + Render backend + Neon PostgreSQL/Managed Auth và kiểm tra cloud thật.** Không còn cần chuyển code từ đầu hoặc lặp hướng dẫn “chưa có adapter Neon”.

- Người dùng đã có Neon theo ảnh: production/default, neondb, AWS Singapore, pooling bật. Mật khẩu che; chưa nhận connection string hoặc Auth Base URL. Ảnh mới là form Render New Web Service và Vercel import repo; chưa có service Live/domain production được xác minh.
- Đã có migration `db/neon/001_initial.sql`, adapter Auth REST/JWT, API profile/sync/nhắc, role/RLS/CAS và startup Render. PostgreSQL local thật và browser với Auth fixture đã kiểm tra; chưa gọi Neon Auth/SQL/email cloud.
- `start:backend` chạy Neon; `build:vercel` dùng VITE_NEON_AUTH_URL + RENDER_API_URL và proxy Auth/data/AI/health. DATABASE_URL chỉ Render, role moi_ngay_runtime. APP_ORIGINS và Neon Trusted Domains điền sau URL Vercel.
- Giữ 28 bài + bốn kiểm tra, 57 WAV, kho khách/tài khoản, StudyState v3 đọc 1/2/3, ID/backup/outbox. Không ghép tài khoản bằng email. Supabase local/SQL/SDK giữ cho regression và dữ liệu cũ; đường startup cũ là start:backend:supabase.
- AI-001 vẫn IN_PROGRESS, Neon luôn AI tắt/ngân sách 0. Port SQL nhắc/budget không đồng nghĩa đã có worker/provider production. Chưa có beta hoàn chỉnh, điện thoại thật hoặc học liệu giáo viên duyệt.

## Bước người dùng làm ngay

1. [Hướng dẫn từng trường](DEPLOY_VERCEL_RENDER_NEON.md): Neon SQL Editor → chạy migration một lần → role runtime/mật khẩu → Auth Base URL.
2. Render form: Build `npm ci`, Start `npm run start:backend`, Singapore/Free, env theo hướng dẫn. Chờ Live và thử healthz/readyz.
3. Vercel chọn **Other**, build `npm run build:vercel`, hai env công khai; bỏ biến/integration Supabase cũ. Khi có domain, cập nhật APP_ORIGINS/Trusted Domains rồi thử OTP/sync thật.
4. Chưa có quyền truy cập Dashboard hoặc secret trong workspace để tự điền cloud. Chỉ cần URL công khai để tiếp tục kiểm tra; không yêu cầu gửi mật khẩu/OTP vào chat.

## File quan trọng

- [NEON_BACKEND.md](NEON_BACKEND.md): ranh giới Auth/SQL, kiểm tra và giới hạn; [DECISIONS.md](DECISIONS.md) DEC-023.
- `server/neon/`, `db/neon/001_initial.sql`: triển khai mới, không áp SQL Supabase lên Neon.
- `src/services/backend.ts`, `neon-auth.ts`, `neon-request.ts`, `study-sync.ts`: chọn provider, cookie/token, chủ tài khoản và sync.
- `scripts/test-neon.js`, `server/neon/security.test.ts`, `src/services/neon-auth.test.ts`: kiểm tra migration/HTTP/browser/đổi phiên.
- `render.yaml`, `vercel.json`, `.env.example`, `scripts/release/vercel*.js`: cấu hình triển khai đúng hướng mới.

## Kiểm tra và môi trường

- `npm test`: 151 ca/18 file đạt; lint, typecheck, build/verify release, kiểm tra định dạng/liên kết tài liệu và diff đạt.
- `npm run test:neon` đạt PostgreSQL thật, JWT ký thật và browser Auth fixture: hai chủ/RLS/rollback/CAS/replay/đồng thời/nhắc/budget, offline/mất response/reload/đổi tài khoản/cookie HttpOnly/không lưu JWT. Không phải phép thử Neon hosted.
- Vercel Build Output bằng URL fixture đạt; marker env bí mật không vào JS. `.vercel/output` đang chứa URL thử, **không deploy prebuilt này**; cloud phải build từ main với env thật.
- Regression legacy account/sync: 19/20 đạt lượt đầu, một ca mobile chờ logout quá 5 giây khi chạy nặng đồng thời; ca đó chạy riêng hai lần đều đạt. Release khách **38/38 đạt** lượt chạy lại tuần tự; lượt đầu có một timeout và một lỗi con trỏ latest do build Vercel đồng thời. Không thay assertion hoặc nới timeout để chạy qua.
- Docker Desktop đã được khởi động, các container Supabase local đang chạy. Test Neon tạo/dọn database/login thử riêng; không reset dữ liệu Supabase. Không có server test Neon còn chạy. Bản preview release 4176 chỉ chạy trong test; kiểm tra tiến trình nếu muốn dùng local tiếp.
- Thay đổi IDE có sẵn của người dùng: `.idea/misc.xml`, `.idea/inspectionProfiles/`, `.idea/prettier.xml`, giữ nguyên ngoài commit task. Không stage `.local`, artifact, secret hoặc dữ liệu học viên.

## Tiếp theo cụ thể

**DEPLOY-002:** người dùng chạy SQL/Bật Auth trên Neon rồi điền Render/Vercel theo hướng dẫn; xác minh migration/TLS/OTP/session/domain/origin/sync bằng URL thật, ghi revision và kết quả. Auth REST beta, SMTP, proxy cloud, Free cold start, Safari/iPhone/Android còn chưa kiểm tra. Không khẳng định app đã online hoặc gửi OTP thật trong session này.
