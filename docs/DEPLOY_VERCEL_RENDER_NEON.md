# Từ đầu: Neon → Render → Vercel

Cập nhật 2026-09-10. Người dùng sửa lựa chọn DB thành **Neon**, giữ Render backend và Vercel frontend. Chưa nhận thông tin project được tạo. **Có thể tạo Neon theo mục 2–3 ngay; code hiện tại chưa kết nối Neon.** DATA-003 cần hoàn tất trước các bước deploy ứng dụng có tài khoản. Hướng Supabase cũ được thay bởi DEC-022.

## 1. Ba dịch vụ và phần đăng nhập

| Dịch vụ | Vai trò đích |
| --- | --- |
| Vercel | Phục vụ React/PWA, học liệu và âm thanh; chuyển request API ứng dụng tới Render |
| Render | Chạy Node backend; xác thực người học, xử lý hồ sơ/đồng bộ và API gia sư; giữ thông tin kết nối DB |
| Neon | Lưu PostgreSQL: hồ sơ, tiến độ, receipt chống gửi trùng, lịch nhắc và hạn mức AI |

Luồng dữ liệu đích: **trình duyệt → Vercel → Render → Neon**. Trình duyệt không được nhận chuỗi kết nối PostgreSQL có mật khẩu.

Đăng nhập là phần cần chuyển riêng. Ưu tiên đánh giá **Neon Auth / Managed Better Auth** để giữ email OTP và tránh thêm một project Supabase chỉ để đăng nhập. Neon có hướng dẫn React/Vite và Email OTP; dịch vụ Auth hiện ghi **beta**. Đây là đề xuất kỹ thuật cho DATA-003, chưa phải tính năng đã tích hợp. SDK, xác minh phiên trên Render, email production và hành vi khi offline phải được kiểm tra trước khi dùng dữ liệu học viên. Nguồn: [Neon Auth](https://neon.com/docs/auth/overview), [React](https://neon.com/docs/auth/quick-start/react), [Email OTP](https://neon.com/docs/auth/guides/plugins/email-otp).

## 2. Tạo project Neon từ đầu

1. Mở [Neon Console](https://console.neon.tech), đăng ký/đăng nhập bằng tài khoản của bạn.
2. Chọn **New Project**. Điền tên gợi ý `moi-ngay`; tên repository vẫn là `app_ielts`.
3. Nếu có lựa chọn phiên bản, chọn **PostgreSQL 17** để khớp nhánh PostgreSQL đang dùng trong `supabase/config.toml`. Migration Neon vẫn cần kiểm tra riêng; cùng phiên bản không làm các hàm Supabase tự xuất hiện.
4. Chọn **AWS → Singapore**, nếu giao diện cung cấp. Dự kiến chọn Render Singapore ở bước sau để backend gần DB. Region Neon cố định theo project, nên chọn ngay khi tạo. Nguồn: [Neon regions](https://neon.com/docs/introduction/regions), [Render regions](https://render.com/docs/regions).
5. Chọn gói **Free** để bắt đầu thử nếu phù hợp hạn mức hiện trên Dashboard, rồi **Create Project**. Chưa cần mua tên miền hoặc bật dịch vụ AI.
6. Ghi lại **Project name/ID, Region, tên branch và database**. Console hiện tạo branch mặc định `production`, còn CLI/API thường là `main`; dùng tên thực tế hiện trên Dashboard. Database mặc định thường là `neondb`; giữ nguyên cũng được. Nguồn: [Tạo project và tài nguyên mặc định](https://neon.com/docs/manage/projects).

Tên project, region, branch và database có thể dùng để trao đổi cấu hình. Mật khẩu, API key và toàn bộ connection string phải giữ riêng.

## 3. Lấy thông tin kết nối và kiểm tra DB

Trên Project Dashboard, chọn **Connect**, rồi chọn đúng branch, database và role. Giữ nguyên các tham số TLS do Neon cung cấp. [Hướng dẫn kết nối chính thức](https://neon.com/docs/connect/connect-from-any-app) giải thích các trường và nút Connection pooling.

| Lựa chọn trong Connect | Lưu riêng để dùng khi DATA-003 đã hỗ trợ |
| --- | --- |
| **Connection pooling bật**, hostname có `-pooler` | Dự kiến `DATABASE_URL` trên Render, dùng role chạy ứng dụng với quyền giới hạn |
| **Connection pooling tắt**, kết nối trực tiếp | Kết nối quản trị để chạy migration bằng công cụ đã kiểm tra; không cần đưa vào frontend hoặc tiến trình web thường trực |

Lúc mới tạo, role mặc định là role chủ DB. DATA-003 sẽ tạo/kiểm tra quyền cho role ứng dụng trước production; không coi việc kết nối được bằng owner là đã có phân quyền học viên. Chưa có script đọc `DATABASE_URL` trong backend hiện tại. Không dán connection string vào biến `VITE_*`, Git, chat hoặc lệnh có thể bị lưu trong lịch sử terminal.

Để xác nhận project hoạt động, vào **SQL Editor**, chọn đúng branch/database, thay câu SQL mẫu trong ô soạn thảo bằng:

```sql
SELECT current_database() AS database_name,
       current_setting('server_version') AS postgres_version,
       now() AS checked_at;
```

Chọn **Run**. Có một dòng kết quả là DB nhận truy vấn; chưa chứng minh app kết nối được. Không chạy tám file `supabase/migrations` vào Neon: chúng phụ thuộc `auth.users`, `auth.uid()`, các role Supabase và RPC cần chuyển. Cách dùng editor: [Neon SQL Editor](https://neon.com/docs/get-started/query-with-neon-sql-editor).

## 4. Code phải chuyển trước khi deploy

Task **DATA-003** trong [TASKS.md](TASKS.md) chịu trách nhiệm các phần sau. Không thay URL Neon vào biến Supabase để vượt qua bước này.

| Phần hiện có | Việc cần làm |
| --- | --- |
| `src/services/supabase.ts`, `src/app/auth.ts`, giao diện tài khoản | Tích hợp Auth đã chọn, khôi phục/đăng xuất/đổi chủ và kiểm tra token/phiên ở máy chủ |
| `supabase/migrations`, profile, study snapshot/commit | Viết migration PostgreSQL cho Neon với quan hệ người dùng đúng; giữ transaction/revision/receipt và quyền sở hữu dữ liệu |
| `src/services/study-sync.ts`, dịch vụ nhắc và `server/ai` | Đưa truy cập DB ứng dụng qua Render; giữ chống gửi trùng, xử lý xung đột, quyền nhắc và hạn mức AI |
| `server/production.ts`, `server/deployment-config.ts`, `render.yaml` | Driver/connection pool, env Neon, timeout, migration và health; hiện vẫn yêu cầu Supabase |
| `scripts/release/config.js`, `vercel-config.js`, build Vercel | Bỏ yêu cầu public key Supabase cho bản Neon, cập nhật proxy/CSP/Auth và kiểm tra không lộ chuỗi DB |
| Kiểm tra Auth/sync/offline hiện có | Chuyển fixture/kiểm tra backend, xác minh bằng hai tài khoản trên DB thật trước khi nhận dữ liệu học viên |

Giữ StudyState v3 và đường đọc bản sao 1/2/3, ID học liệu/lượt làm, draft/outbox và lựa chọn bật sync. Tài khoản mới trên hệ Auth khác không mặc nhiên có cùng ID; không tự ghép tài khoản chỉ theo email hoặc tự nhập phần khách. Có đường xuất JSON trước đổi backend/origin; mọi chuyển dữ liệu tài khoản cũ phải xác minh chủ sở hữu.

Khi triển khai Neon Auth, vào **Auth → Enable Auth**, lấy Auth Base URL theo [quickstart React](https://neon.com/docs/auth/quick-start/react). URL Auth là cấu hình công khai khác hoàn toàn connection string PostgreSQL; tên biến env cuối cùng sẽ được ghi sau khi adapter/build đã hỗ trợ. Chỉ bật/cấu hình tích hợp theo task; không chạy lệnh tạo một app Vite mới đè repository này. Email production cần cấu hình gửi thư và kiểm tra OTP thực tế theo [Email OTP](https://neon.com/docs/auth/guides/plugins/email-otp).

## 5. Trình tự Render/Vercel sau DATA-003

**Phần này là thứ tự công việc, chưa phải cấu hình Neon chạy được bằng code hiện tại.** Các lệnh/bảng env cuối cùng phải cập nhật cùng implementation. Có thể đăng ký tài khoản [Render](https://dashboard.render.com) và [Vercel](https://vercel.com) trước; chỉ deploy repo sau khi các bước dưới có code và kiểm tra tương ứng.

1. Hoàn tất migration/role/Auth/adapter trên môi trường thử. Áp migration đã kiểm tra lên đúng branch Neon, ghi kết quả mà không đưa secret vào log. Không tự xóa/reset DB cũ.
2. Render: tạo **Web Service**, nối repo [HaPhiHung-HE186793/app_ielts](https://github.com/HaPhiHung-HE186793/app_ielts), branch `main`, root repository, region Singapore. Dùng lệnh build/start và env từ cấu hình đã chuyển Neon; giữ `AI_ENABLED=false`, ngân sách 0. Xác minh health và kết nối DB, lưu URL backend công khai.
3. Vercel: import cùng repo. Dùng build/proxy đã cập nhật cho Neon, đưa URL Render và cấu hình Auth công khai vào đúng env. Không thêm `DATABASE_URL` vì frontend của dự án không chạy truy vấn SQL. Deploy rồi ghi URL production ổn định.
4. Quay lại Render để điền origin Vercel chính xác; cấu hình trusted domain/callback của Auth theo adapter thực tế. Kiểm tra cả API qua Vercel và request có token thiếu/hết hạn. Không dùng wildcard cho toàn bộ preview domain.
5. Kiểm tra đăng nhập OTP, hồ sơ, sync giữa hai phiên, từ chối xem dữ liệu tài khoản khác, offline rồi nối lại, tải WAV và cập nhật worker. Thử cài/mở trên iPhone/Android thật; ghi phần chưa thử. Health 200 không thay thế các kiểm tra này.
6. Ghi URL, region/branch, revision đã deploy và kết quả vào [STATUS.md](STATUS.md). Chỉ đóng DEPLOY-002 sau kiểm tra phạm vi thực tế. Giới hạn worker nhắc, AI và dữ liệu vẫn theo task riêng.

## 6. Điểm dừng hiện tại để tiếp tục đúng hướng

- Hướng dịch vụ và hướng dẫn tạo Neon đã được ghi lại; chưa có DB/project cloud được xác minh, chưa có code Neon hoặc URL app public.
- Người dùng có thể làm mục 2–3, rồi cung cấp **tên project và region**; giữ connection string riêng để cấu hình máy chủ khi cần.
- Công việc code tiếp theo là **DATA-003**, bắt đầu bằng adapter Auth/identity và migration PostgreSQL. Không tiếp tục tạo Supabase hosted theo tài liệu cũ; bản local Supabase vẫn dùng để tham chiếu kiểm tra trong lúc chuyển.
