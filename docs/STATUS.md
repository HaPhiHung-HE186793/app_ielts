# Trạng thái bàn giao hiện tại

Cập nhật: 2026-09-10, múi giờ Asia/Saigon.

## Đang ở đâu

**Người dùng sửa DB thành Neon; hướng hiện tại là Vercel frontend + Render backend + Neon PostgreSQL.** DOC-002 DONE phần hướng dẫn/bàn giao. **DATA-003 READY là task code tiếp theo**; DEPLOY-002 vẫn IN_PROGRESS và phụ thuộc chuyển backend trước khi kiểm tra cloud.

- Người dùng đã tạo Neon và gửi ảnh Connect: branch production (Default), database neondb, role neondb_owner, compute Primary Active, pooling bật; hostname cho thấy AWS ap-southeast-1 (Singapore). Mật khẩu trong ảnh được che. Chưa có tên/ID project hoặc Auth Base URL, chưa kiểm tra kết nối từ app/SQL. Render và Vercel chưa tạo theo xác nhận mới.
- **Code hiện tại vẫn dùng Supabase** cho Auth email OTP, profile/sync/RLS/RPC, nhắc và budget. render.yaml/start:backend/build:vercel/.env.example vẫn yêu cầu Supabase; điền URL Neon vào biến cũ không dùng được. Chưa cài driver/SDK Neon, chưa có migration hoặc phiên đăng nhập Neon đã kiểm tra.
- DEC-022 ghi hướng đích dữ liệu browser → Vercel → Render → Neon; ưu tiên đánh giá Neon Auth (Managed Better Auth, beta) để giữ OTP. Đây là đề xuất chưa tích hợp, cần kiểm tra SDK/session/token/email/quyền trong DATA-003.
- Giữ bản học hiện có: 28 bài + bốn kiểm tra, 57 WAV, phiên thích ứng, bài dở/lịch ôn/bản sao/sync; StudyState v3 đọc 1/2/3. AI-001 IN_PROGRESS, AI mặc định tắt/ngân sách 0. Chưa có bản beta đầy đủ.

## Dùng hoặc chuẩn bị triển khai

1. Neon đã được tạo theo ảnh; không yêu cầu tạo lại hoặc mặc định tên project là moi-ngay. PostgreSQL version chưa thấy trong ảnh. Người dùng có thể kiểm tra SELECT ở mục 3 và chuẩn bị tài khoản/kết nối repo Render/Vercel theo mục 5a của [hướng dẫn](DEPLOY_VERCEL_RENDER_NEON.md). Chưa bấm Create Web Service/Deploy với code Supabase hiện tại. Connection string/password giữ riêng.
2. Không áp tám migration Supabase nguyên trạng lên Neon. Không tiếp tục hướng Supabase hosted của DEC-021; [tài liệu cũ](DEPLOY_VERCEL_RENDER_SUPABASE.md) được đánh dấu đã thay thế. BACKEND/SYNC/AI/NOTIFICATIONS vẫn mô tả code Supabase local để tham chiếu.
3. Bản khách local vẫn dùng npm run release:build, npm run release:verify, npm run release:preview, địa chỉ http://127.0.0.1:4176/#/today. Auth local vẫn theo [BACKEND.md](BACKEND.md). Session này không khởi động/dừng server; các PID hoặc trạng thái DB từ session trước cần kiểm tra lại nếu dùng.
4. Chưa có URL app public, DB Neon được kết nối, migration hosted, email production hoặc kiểm tra Render/Vercel/iPhone/Android thật. Cấu hình Vercel sinh trong .vercel/output từ kiểm tra trước chứa URL thử; không deploy bản prebuilt đó. Build lại bằng cấu hình thật sau DATA-003.

## File quan trọng

- [DEPLOY_VERCEL_RENDER_NEON.md](DEPLOY_VERCEL_RENDER_NEON.md): bước người dùng làm ngay, phụ thuộc code, cách giữ connection string và thứ tự sau migration.
- [TASKS.md](TASKS.md), [DECISIONS.md](DECISIONS.md), [ARCHITECTURE.md](ARCHITECTURE.md), AGENTS/README: DATA-003 và DEC-022; phân biệt hướng mới với Supabase đang chạy.
- src/app/auth.ts, src/services/supabase.ts, src/services/study-sync.ts, supabase/migrations, server/production.ts, scripts/release/vercel-config.js: các phụ thuộc thực tế đã đối chiếu, chưa sửa runtime.

## Kiểm tra

- Session này chỉ sửa tài liệu: kiểm tra liên kết nội bộ, ID/phụ thuộc task, Unicode và git diff --check đạt; đối chiếu code/config thật và tài liệu chính thức Neon/Render. Không chạy lại unit/E2E/build vì không đổi runtime/dependency. Không gọi SQL cloud hoặc gửi OTP.
- Kết quả mốc code trước: 144 unit, 38 ca release khách, năm API với Supabase local thật/provider fixture đạt; entrypoint Render dùng transport DB fixture và build Vercel dùng URL thử. Đây không phải kiểm tra Neon. Chi tiết ở [SESSION_LOG.md](SESSION_LOG.md).
- Không thay dữ liệu, schema, môi trường bí mật hoặc artifact đang có. Commit/push tài liệu theo ủy quyền; hash/kết quả remote xác minh trong bàn giao cuối.

## Tiếp theo

**Bắt đầu DATA-003: đánh dấu IN_PROGRESS, triển khai adapter Auth/identity và migration PostgreSQL cho Neon**, rồi chuyển API/role/sync/nhắc/budget/build. Các phần local độc lập có thể làm trong khi người dùng tạo project; không chờ URL để chỉ lập lại kế hoạch. Kiểm tra quyền hai tài khoản, giao dịch/chống gửi trùng, đổi chủ/offline và bí mật trước khi nối host thật. Giữ dữ liệu cũ và đường xuất bản sao; không tự ghép tài khoản bằng email.

Sau DATA-003 mới hoàn tất DEPLOY-002 trên Render/Vercel/Neon và ghi URL/revision/kết quả. Giới hạn còn lại: email production, worker nhắc, AI đã đối chiếu, mic, học liệu giáo viên phê duyệt, thiết bị thật và chương trình IELTS sáu tháng.
