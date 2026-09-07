# Trạng thái bàn giao hiện tại

Cập nhật: 2026-09-07, múi giờ Asia/Saigon.

## Đang ở đâu

**DEPLOY-001 DONE: đã có bản đóng gói để triển khai web. Chưa public HTTPS.** DEPLOY-002 cần tài khoản/project hosting có quyền triển khai và origin được chọn. AI-001 vẫn IN_PROGRESS chờ key/ngân sách và đối chiếu thật; BETA-001 chưa hoàn chỉnh.

- Release mặc định khách, có lựa chọn account bằng JSON public đã kiểm tra; không kế thừa .env/biến VITE hoặc proxy local. Ép production và tắt AI rõ ràng trong UI. Mỗi lượt tạo thư mục mới, bản kê Git/dirty/hash/schema riêng, verify trước preview/upload.
- site chứa 99 file, 10.124.043 bytes ở bản khách hiện tại: học liệu 28 bài + bốn kiểm tra, 57 WAV, app/worker/icon/header/404. Có CSP, cache phân biệt file có hash/đường dẫn cố định; preview 4176 áp cùng quy tắc và không proxy API. Chưa kiểm tra CDN/HTTPS thật.
- Giữ phiên học thích ứng, lịch ôn, bản sao JSON, StudyState 3/đọc 1/2/3 và quy tắc offline cũ. Không migration/dependency mới, không đổi ngân sách AI hoặc thu dữ liệu học viên.

## Dùng ngay

1. Bản khách phát hành: npm run release:build → npm run release:verify → npm run release:preview. Mở http://127.0.0.1:4176/#/today. Preview đã để chạy Node ẩn sau kiểm tra; xem cổng trước khi mở thêm. File .local/releases/latest.json chỉ tới artifact gần nhất; chỉ site được upload, giữ release.json ngoài web root.
2. Bản tài khoản local cũ vẫn tại http://127.0.0.1:4175/#/today; Docker → npm run db:start → npm run db:migrate → npm run preview:local nếu cần khởi động lại. OTP ở 54324 chỉ là hộp thư thử. Máy AI/nhắc giữ nguyên, AI thật tắt.
3. Vào #/install tải gói trước khi học offline. Mỗi origin có kho riêng; dùng bản sao JSON/sync rõ ràng khi chuyển 4175/4176 hoặc lên tên miền. Cache offline không là bản sao tiến độ.

## File quan trọng

- [DEPLOYMENT.md](DEPLOYMENT.md): lệnh build/verify/preview, cấu hình khách/account/API, hướng dẫn Pages/HTTPS/cache/cập nhật/quay lui, checklist thiết bị và thông tin hosting còn thiếu.
- scripts/release/config.js, build.js, artifact.js, preview.js, verify.js: ranh giới cấu hình công khai, tạo release mới, danh sách file/hash/header và preview từ artifact. deploy/account.example.json chỉ placeholder.
- src/features/ai/AiHint.tsx: nhãn AI chưa bật cho bản phát hành; chế độ dev/Auth giữ luồng cũ.
- scripts/release/config.test.ts, playwright.release.config.ts, tests/release/artifact.spec.ts và tests/offline-update-server.ts: test cấu hình/artifact và tái dùng luồng thật từ chính release.
- [TASKS.md](TASKS.md), README, ARCHITECTURE/DECISIONS/TESTING đã cập nhật; chi tiết quy tắc học vẫn ở ADAPTATION/CURRICULUM.

## Kiểm tra

- Lint/typecheck/build và **135/135 unit** đạt. **38/38 ca release** đạt trên Chrome desktop/viewport 360px: học/ôn/draft/backup/restore, thích ứng, WAV/offline, lỗi tải/quota, update giữ draft/outbox, header/CSP/404 và không gọi API từ bản khách. Ca update dùng origin thử riêng với chính file release.
- **6/6 ca Auth–AI liên quan** đạt trên hai kích thước, Supabase local thật/provider fixture: AI chưa cấu hình, consent/gửi lại và đổi câu/chủ khi chờ. Không chạy lại toàn bộ 80 khách/50 Auth trong task này; kết quả hồi quy trước ở SESSION_LOG.
- Thực thi build khách/account với giá trị thử: biến URL local/public key/khóa riêng không kế thừa, NODE_ENV development không đổi release thành dev. Artifact sửa file bị từ chối; giữ bản gốc. Tài khoản hosted trong build chỉ cấu hình thử, chưa gọi dịch vụ thật.
- Prettier/diff, liên kết/task và quét secret thực trong artifact/build/staged được kiểm tra trước commit. Bundle khách khoảng 707 kB minified/205 kB gzip, vẫn cảnh báo chưa chia route. Ảnh/trace/log trong thư mục bỏ qua Git; kiểm tra trình duyệt không thay điện thoại thật.

## Tiếp theo và giới hạn

**DEPLOY-002**: chọn tài khoản/project hosting có quyền triển khai, public bản khách từ commit sạch và kiểm tra URL HTTPS thực tế theo DEPLOYMENT. Chưa có hosting được kết nối, Supabase hosted/SMTP, domain hoặc thiết bị iOS/Android thật; không suy ra từ preview 4176 là đã phát hành.

AI-001 cần key/ngân sách máy chủ và người duyệt rubric để đối chiếu; chưa tự bật gọi trả phí, mic hoặc band. Học liệu/rule còn thử nghiệm, chưa giáo viên độc lập duyệt hoặc chương trình IELTS sáu tháng. Giới hạn dữ liệu/offline/nhắc/AI ở BACKEND/SYNC/OFFLINE/NOTIFICATIONS/AI vẫn áp dụng.
