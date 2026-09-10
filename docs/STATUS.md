# Trạng thái bàn giao hiện tại

Cập nhật 2026-09-10, Asia/Saigon.

## Đang ở đâu

**DATA-003 DONE phần code/local. Tiếp theo DEPLOY-002 IN_PROGRESS: deploy Vercel frontend + Render backend + Neon PostgreSQL/Managed Auth và kiểm tra cloud thật.** Không còn cần chuyển code từ đầu hoặc lặp hướng dẫn “chưa có adapter Neon”.

- Neon production/default, neondb, AWS Singapore, pooling bật. Ảnh mới đã chọn **moi_ngay_runtime** ở endpoint ep-dawn-dream. Render service `app_ielts` build commit **e592f9f**/Node 22.18.0/npm ci đạt, qua validator cấu hình nhưng dừng ở kiểm tra DB/role/schema với thông báo chung. Chưa xác định lỗi mật khẩu, mạng, thiếu migration hay quyền; không còn là lỗi chọn tên role owner trước đó. Chưa có service Live.
- Auth Base URL công khai đã thấy trong cấu hình Render: `https://ep-long-cell-aztbwvj6.neonauth.c-3.ap-southeast-1.aws.neon.tech/neondb/auth`. Chưa kiểm tra Auth/JWKS/email thật. Ảnh Environment trước đó hiển thị mật khẩu owner: đã hướng dẫn reset trong Neon, không chép/lưu/gọi bằng mật khẩu đó; chưa có xác nhận đã đổi.
- Endpoint ep-dawn-dream khác ep-long-cell trong Auth URL đã nhận trước đó; cần đối chiếu project/branch trước khi thử đăng nhập. Mật khẩu trong ảnh mới được che. Chưa có kết quả chạy migration hoặc query kiểm tra từ người dùng; đã hỏi async tình trạng chạy toàn bộ 001_initial.sql, chưa nhận trả lời.
- Đã sửa startup để log mã `NEON_DB_*` và hướng xử lý cố định theo SQLSTATE/Node errors, không chép message/detail/stack/credential gốc. Có `db/neon/check_setup.sql` chỉ đọc, trả một dòng catalog role/schema/grants. Không nới quyền, đổi kết nối hay tắt TLS; đây là cải thiện chẩn đoán, chưa phải kết nối cloud đã được sửa.
- Đã có migration `db/neon/001_initial.sql`, adapter Auth REST/JWT, API profile/sync/nhắc, role/RLS/CAS và startup Render. PostgreSQL local thật và browser với Auth fixture đã kiểm tra; chưa gọi Neon Auth/SQL/email cloud.
- `start:backend` chạy Neon; `build:vercel` dùng VITE_NEON_AUTH_URL + RENDER_API_URL và proxy Auth/data/AI/health. DATABASE_URL chỉ Render, role moi_ngay_runtime. APP_ORIGINS và Neon Trusted Domains điền sau URL Vercel.
- Giữ 28 bài + bốn kiểm tra, 57 WAV, kho khách/tài khoản, StudyState v3 đọc 1/2/3, ID/backup/outbox. Không ghép tài khoản bằng email. Supabase local/SQL/SDK giữ cho regression và dữ liệu cũ; đường startup cũ là start:backend:supabase.
- AI-001 vẫn IN_PROGRESS, Neon luôn AI tắt/ngân sách 0. Port SQL nhắc/budget không đồng nghĩa đã có worker/provider production. Chưa có beta hoàn chỉnh, điện thoại thật hoặc học liệu giáo viên duyệt.

## Bước người dùng làm ngay

1. Neon SQL Editor đúng project endpoint ep-dawn-dream → production/neondb, role quản trị neondb_owner → chạy [check_setup.sql](../db/neon/check_setup.sql), gửi dòng kết quả không có bí mật. Nếu thiếu role/schema, đối chiếu trước khi áp migration; không tự chạy lại/xóa dữ liệu khi chưa rõ trạng thái. Mật khẩu owner từng lộ vẫn cần xác nhận đã reset, không yêu cầu gửi mật khẩu.
2. Render → Manual Deploy → Deploy latest commit để lấy log có mã NEON_DB_*; dùng mã và query để sửa đúng lỗi. Build/start/env role đã qua validator, không tiếp tục yêu cầu chọn lại role chỉ từ log cũ. Khi Live kiểm tra healthz/readyz; nếu AUTH_FAILED mới lấy lại đầy đủ kết nối runtime/mật khẩu.
3. Vercel chọn **Other**, build `npm run build:vercel`, hai env công khai; bỏ biến/integration Supabase cũ. Khi có domain, cập nhật APP_ORIGINS/Trusted Domains rồi thử OTP/sync thật.
4. Chưa có quyền truy cập Dashboard để đổi mật khẩu hoặc env thay người dùng. Chỉ gửi URL công khai/log đã che bí mật để tiếp tục; không gửi lại mật khẩu/OTP.

## File quan trọng

- [NEON_BACKEND.md](NEON_BACKEND.md): ranh giới Auth/SQL, kiểm tra và giới hạn; [DECISIONS.md](DECISIONS.md) DEC-023.
- `server/neon/`, `db/neon/001_initial.sql`: triển khai mới, không áp SQL Supabase lên Neon.
- `server/neon/startup-error.ts`, `startup-error.test.ts`, `db/neon/check_setup.sql`: phân loại lỗi khởi động, kiểm tra không lộ bí mật và query chẩn đoán cho người dùng.
- `src/services/backend.ts`, `neon-auth.ts`, `neon-request.ts`, `study-sync.ts`: chọn provider, cookie/token, chủ tài khoản và sync.
- `scripts/test-neon.js`, `server/neon/security.test.ts`, `src/services/neon-auth.test.ts`: kiểm tra migration/HTTP/browser/đổi phiên.
- `render.yaml`, `vercel.json`, `.env.example`, `scripts/release/vercel*.js`: cấu hình triển khai đúng hướng mới.

## Kiểm tra và môi trường

Lượt này sửa chẩn đoán startup: **176 unit/19 file**, lint, typecheck, test:neon (gồm build) và ba process smoke với transport fixture đạt. PostgreSQL thật thử thiếu bảng, thiếu grant và sai schema version; query check_setup chạy được. Không dùng credential trong ảnh, không đổi env/mật khẩu cloud. Các ca release/legacy bên dưới thuộc mốc DATA-003 trước đó, không chạy lại vì frontend/quyền/giao dịch không đổi.

- Mốc DATA-003 trước: 151 unit và các kiểm tra build/release đã đạt; lượt này tăng lên 176 unit với ranh giới log/chẩn đoán, kiểm tra định dạng/liên kết/diff trước commit.
- `npm run test:neon` đạt PostgreSQL thật, JWT ký thật và browser Auth fixture: hai chủ/RLS/rollback/CAS/replay/đồng thời/nhắc/budget, offline/mất response/reload/đổi tài khoản/cookie HttpOnly/không lưu JWT. Không phải phép thử Neon hosted.
- Vercel Build Output bằng URL fixture đạt; marker env bí mật không vào JS. `.vercel/output` đang chứa URL thử, **không deploy prebuilt này**; cloud phải build từ main với env thật.
- Regression legacy account/sync: 19/20 đạt lượt đầu, một ca mobile chờ logout quá 5 giây khi chạy nặng đồng thời; ca đó chạy riêng hai lần đều đạt. Release khách **38/38 đạt** lượt chạy lại tuần tự; lượt đầu có một timeout và một lỗi con trỏ latest do build Vercel đồng thời. Không thay assertion hoặc nới timeout để chạy qua.
- Docker Desktop đã được khởi động, các container Supabase local đang chạy. Test Neon tạo/dọn database/login thử riêng; không reset dữ liệu Supabase. Không có server test Neon còn chạy. Bản preview release 4176 chỉ chạy trong test; kiểm tra tiến trình nếu muốn dùng local tiếp.
- Thay đổi IDE có sẵn của người dùng: `.idea/misc.xml`, `.idea/inspectionProfiles/`, `.idea/prettier.xml`, giữ nguyên ngoài commit task. Không stage `.local`, artifact, secret hoặc dữ liệu học viên.

## Tiếp theo cụ thể

**DEPLOY-002:** nhận mã lỗi NEON_DB_* sau deploy bản mới và kết quả check_setup, sửa đúng nguyên nhân rồi kiểm tra readyz. Sau khi Render Live mới tiếp tục Vercel/origin/OTP/sync và ghi URL/revision; đối chiếu Auth của branch/project đang dùng. Không yêu cầu tạo lại service/role đã có. Migration/TLS/Auth/SMTP/proxy cloud và điện thoại thật còn chưa kiểm tra.
