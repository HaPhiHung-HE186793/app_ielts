# Trạng thái bàn giao hiện tại

Cập nhật 2026-09-10, Asia/Saigon.

## Đang ở đâu

**DATA-003 DONE phần code/local. Tiếp theo DEPLOY-002 IN_PROGRESS: deploy Vercel frontend + Render backend + Neon PostgreSQL/Managed Auth và kiểm tra cloud thật.** Không còn cần chuyển code từ đầu hoặc lặp hướng dẫn “chưa có adapter Neon”.

- Neon production/neondb, project đang hiển thị `moi_ngay_runtime`, endpoint Connect gần nhất ep-dawn-dream. Log Render mới đã dùng formatter từ b7e2f10 nhưng trả **NEON_DB_UNKNOWN**, chưa Live. Kết quả SQL người dùng gửi: schema_table trống, runtime_can_login=t, app_roles={moi_ngay_runtime}, runtime_grants={neon_superuser}. Thiết lập ứng dụng còn thiếu và runtime có quyền quản trị thừa; chưa khẳng định đây là nguyên nhân duy nhất của UNKNOWN hoặc Render đã trỏ đúng endpoint này.
- Auth Base URL công khai đã thấy trong cấu hình Render: `https://ep-long-cell-aztbwvj6.neonauth.c-3.ap-southeast-1.aws.neon.tech/neondb/auth`. Chưa kiểm tra Auth/JWKS/email thật. Ảnh Environment trước đó hiển thị mật khẩu owner: đã hướng dẫn reset trong Neon, không chép/lưu/gọi bằng mật khẩu đó; chưa có xác nhận đã đổi.
- Endpoint ep-dawn-dream khác ep-long-cell trong Auth URL đã nhận trước đó; cần đối chiếu project/branch trước khi thử đăng nhập. Đã nhận kết quả check_setup qua ảnh, không còn chờ query ban đầu. Editor đang có bốn kết quả gồm CREATE/INSERT dữ liệu mẫu; cần mở truy vấn trống để chạy riêng toàn bộ migration. Chưa có kết quả chạy 001_initial.sql thành công trên cloud.
- Đã sửa startup để log mã `NEON_DB_*` và hướng xử lý cố định theo SQLSTATE/Node errors, không chép message/detail/stack/credential gốc. Có `db/neon/check_setup.sql` chỉ đọc, trả một dòng catalog role/schema/grants. Không nới quyền, đổi kết nối hay tắt TLS; đây là cải thiện chẩn đoán, chưa phải kết nối cloud đã được sửa.
- Đã có migration `db/neon/001_initial.sql`, adapter Auth REST/JWT, API profile/sync/nhắc, role/RLS/CAS và startup Render. PostgreSQL local thật và browser với Auth fixture đã kiểm tra; chưa gọi Neon Auth/SQL/email cloud.
- `start:backend` chạy Neon; `build:vercel` dùng VITE_NEON_AUTH_URL + RENDER_API_URL và proxy Auth/data/AI/health. DATABASE_URL chỉ Render, role moi_ngay_runtime. APP_ORIGINS và Neon Trusted Domains điền sau URL Vercel.
- Giữ 28 bài + bốn kiểm tra, 57 WAV, kho khách/tài khoản, StudyState v3 đọc 1/2/3, ID/backup/outbox. Không ghép tài khoản bằng email. Supabase local/SQL/SDK giữ cho regression và dữ liệu cũ; đường startup cũ là start:backend:supabase.
- AI-001 vẫn IN_PROGRESS, Neon luôn AI tắt/ngân sách 0. Port SQL nhắc/budget không đồng nghĩa đã có worker/provider production. Chưa có beta hoàn chỉnh, điện thoại thật hoặc học liệu giáo viên duyệt.

## Bước người dùng làm ngay

1. Neon SQL Editor production/neondb, neondb_owner → mở truy vấn trống, chạy toàn bộ [001_initial.sql](../db/neon/001_initial.sql) từ BEGIN tới COMMIT. Role runtime đã có được giữ, không thay mật khẩu. Sau thành công, thu hồi membership neon_superuser chỉ của runtime và kiểm tra version/grants theo [hướng dẫn](DEPLOY_VERCEL_RENDER_NEON.md#5-giới-hạn-và-xử-lý-lỗi). Nếu SQL lỗi, gửi lỗi để sửa, không DROP/CASCADE hay chạy lặp mù. Mật khẩu owner từng lộ chưa có xác nhận reset.
2. Khi schema_version=1 và runtime_grants có api/worker, không còn neon_superuser: đối chiếu DATABASE_URL Render với Connect của đúng project/branch rồi Manual Deploy → Deploy latest commit. Khi Live kiểm tra healthz/readyz. Nếu UNKNOWN còn lặp sau khi thiết lập đúng, cần chẩn đoán riêng lỗi driver/kết nối; không kết luận đã sửa từ SQL screenshot.
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

Lượt hiện tại chỉ cập nhật hướng dẫn theo kết quả SQL thật người dùng gửi; kiểm tra liên kết/định dạng/diff trước commit, không đổi code hoặc chạy lại tests. Chưa áp migration/REVOKE trên Neon thay người dùng. Lượt b7e2f10 trước đó đạt **176 unit/19 file**, lint, typecheck, test:neon (gồm build) và ba process smoke với transport fixture. PostgreSQL thật thử thiếu bảng, thiếu grant và sai schema version; query check_setup chạy được. Không dùng credential trong ảnh, không đổi env/mật khẩu cloud. Các ca release/legacy bên dưới thuộc mốc DATA-003 trước đó.

- Mốc DATA-003 trước: 151 unit và các kiểm tra build/release đã đạt; b7e2f10 tăng lên 176 unit với ranh giới log/chẩn đoán. Lượt hiện tại chỉ đổi tài liệu, kiểm tra định dạng/liên kết/diff trước commit.
- `npm run test:neon` đạt PostgreSQL thật, JWT ký thật và browser Auth fixture: hai chủ/RLS/rollback/CAS/replay/đồng thời/nhắc/budget, offline/mất response/reload/đổi tài khoản/cookie HttpOnly/không lưu JWT. Không phải phép thử Neon hosted.
- Vercel Build Output bằng URL fixture đạt; marker env bí mật không vào JS. `.vercel/output` đang chứa URL thử, **không deploy prebuilt này**; cloud phải build từ main với env thật.
- Regression legacy account/sync: 19/20 đạt lượt đầu, một ca mobile chờ logout quá 5 giây khi chạy nặng đồng thời; ca đó chạy riêng hai lần đều đạt. Release khách **38/38 đạt** lượt chạy lại tuần tự; lượt đầu có một timeout và một lỗi con trỏ latest do build Vercel đồng thời. Không thay assertion hoặc nới timeout để chạy qua.
- Docker Desktop đã được khởi động, các container Supabase local đang chạy. Test Neon tạo/dọn database/login thử riêng; không reset dữ liệu Supabase. Không có server test Neon còn chạy. Bản preview release 4176 chỉ chạy trong test; kiểm tra tiến trình nếu muốn dùng local tiếp.
- Thay đổi IDE có sẵn của người dùng: `.idea/misc.xml`, `.idea/inspectionProfiles/`, `.idea/prettier.xml`, giữ nguyên ngoài commit task. Không stage `.local`, artifact, secret hoặc dữ liệu học viên.

## Tiếp theo cụ thể

**DEPLOY-002:** nhận kết quả áp 001_initial.sql/version=1 và grants runtime đã chỉnh, sau đó Render redeploy/readyz. Nếu vẫn UNKNOWN dù SQL đúng, xử lý lỗi kết nối riêng. Sau Render Live tiếp tục Vercel/origin/OTP/sync; đối chiếu Auth đúng project/branch. Không tạo lại service/role đã có. Migration/TLS/Auth/SMTP/proxy cloud và điện thoại thật còn chưa xác minh hoàn chỉnh.
