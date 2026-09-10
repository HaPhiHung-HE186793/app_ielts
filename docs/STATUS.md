# Trạng thái bàn giao hiện tại

Cập nhật 2026-09-10, Asia/Saigon.

## Đang ở đâu

**DATA-003 DONE phần code/local. DEPLOY-002 IN_PROGRESS (Frontend Vercel đã LIVE tại `https://app-ielts-two.vercel.app`, Neon Auth Trusted Domains đã cấu hình):** Tiếp tục kiểm tra kết nối Render backend + Neon PostgreSQL/Managed Auth và đồng bộ cloud thật.

- Frontend đã triển khai thành công trên Vercel: `https://app-ielts-two.vercel.app`, giao diện tiếng Việt, tải bài học "Bắt đầu bằng một lời chào" mượt mà.
- Neon Auth: Đã bật Auth, lưu **Trusted Domains** `https://app-ielts-two.vercel.app`.
- Render backend (`moi-ngay-api`): Cập nhật `APP_ORIGINS=https://app-ielts-two.vercel.app`, kiểm tra `/healthz` và `/readyz`.


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
