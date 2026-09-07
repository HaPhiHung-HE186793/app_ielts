# Trạng thái bàn giao hiện tại

Cập nhật: 2026-09-07, múi giờ Asia/Saigon.

## Đang ở đâu

**CONTENT-002 DONE trong phạm vi học liệu thử nghiệm; ADAPT-001 READY để tiếp tục.** Có 28 bài nền tảng + bốn kiểm tra, chia bốn tuần gợi ý. AI-001 giữ IN_PROGRESS: API/UI/hạn mức đã có, chưa có key/ngân sách được xác nhận hoặc đối chiếu provider thật; gọi thật vẫn false/0 USD. Chưa có beta đầy đủ hoặc chương trình luyện IELTS sáu tháng.

- Branch main, origin https://github.com/HaPhiHung-HE186793/app_ielts.git; xác minh commit/remote bằng Git.
- Khám phá chọn tuần/chủ đề, tám mục/tuần; Hôm nay có tiến độ từng tuần. Bài mới có đọc ngắn, điền tự nhớ, nghe tình huống với lời thoại là gợi ý, tự nói và viết có tiêu chí tự xem lại.
- Kết quả n/3 chỉ là câu đóng đúng lần đầu không gợi ý. Nói/viết có thể bỏ qua, chưa thu âm/chấm điểm; “đã học” không chứng minh đủ bốn kỹ năng hoặc mức thành thạo. Có mục tiêu tăng dần và hồ sơ rà soát nội bộ, chưa có giáo viên độc lập/hiệu chỉnh độ khó trên người học.
- Giữ nguyên bảy bài/bảy WAV cũ, StudyState/bản sao version 3 và đường đọc 1/2/3. Phiên tối đa 10 hoạt động phù hợp schema. Auth/OTP, sync tự nguyện/outbox/CAS/xung đột, nhắc học và AI tùy chọn vẫn có trong phạm vi mốc trước.

## Chạy và dùng ngay

1. Docker → npm run db:start → npm run db:migrate → npm run preview:local. Mở http://127.0.0.1:4175/#/discover để chọn tuần. Email thử tại http://127.0.0.1:54324, không gửi ra ngoài.
2. Offline: vào #/install, chủ động tải gói **57 WAV + JSON, 8.921.491 byte (~8,92 MB)** và chờ sẵn sàng. Cập nhật app trên các máy trước khi đồng bộ/nhập bản sao có ID bài mới; xem [OFFLINE.md](OFFLINE.md).
3. Nhắc học: npm run reminders:local, trang #/reminders, tự chọn lịch/quyền. AI: npm run ai:local; khi chưa cấu hình chỉ báo chưa bật. npm run ai:evaluate kiểm tra 10 mẫu không gọi provider; hướng dẫn ở [AI.md](AI.md).
4. npm run dev cho khách hoặc npm run dev:local cho Auth tại 5173; dev không đăng ký worker. Các origin có kho riêng, chuyển bằng sync/JSON và giữ dữ liệu cũ.

Preview 4175 đã build lại bộ bốn tuần và đang chạy Node ẩn; máy nhắc được giữ nguyên. Máy AI 8787 vẫn là tiến trình mốc trước, gọi thật tắt: lệnh khởi động lại bị cơ chế duyệt tự động chặn, không có lý do chi tiết ngoài “blocked by policy”. Trước đối chiếu AI thật cần khởi động lại để nạp danh mục mới. Log trong .local (không commit); kiểm tra cổng/tiến trình trước mở thêm vì có thể dừng giữa session.

## File quan trọng

- [CURRICULUM.md](CURRICULUM.md), [CONTENT_REVIEW.md](CONTENT_REVIEW.md): mục tiêu bốn tuần, kỹ năng, giới hạn, nguồn và hồ sơ biên soạn.
- src/content/foundation.ts và lessons.ts: 21 bài mới/bốn kiểm tra, giữ định nghĩa bảy bài gốc. domain/types.ts thêm trường học liệu tùy chọn; domain/planner.ts chặn quá 10 hoạt động.
- features/lessons/LessonPlayer.tsx, components/ListenButton.tsx: nghe độc lập, lời thoại/gợi ý lưu qua reload, tự nói và tự xem bài viết. features/pages/Pages.tsx, features/today/Today.tsx và styles/curriculum.css: tuần/bộ lọc/tiến độ.
- scripts/generate-audio.js, public/packs/foundation-v1, content/offline-pack.json: audio công khai có hash, chỉ tạo mới/đổi. offline/worker.js báo tiến độ mỗi tám file, vẫn xác minh toàn bộ trước sẵn sàng.
- tests/curriculum.spec.ts, domain/planner.test.ts, tests/offline.spec.ts và tests/auth/offline.spec.ts; phạm vi ở [TESTING.md](TESTING.md). Không thêm dependency hoặc migration backend.

## Kiểm tra đã đạt

- Node 22.18.0/npm 10.9.3, Supabase Docker/CLI 2.116.0; lint/typecheck/build đạt. **114/114 unit, 74/74 khách, 50/50 Auth/API/sync/offline/nhắc/AI fixture** đạt sau sửa liên quan. Chrome desktop 1440×1000 và viewport 360×800, không thay thiết bị thật.
- Kiểm tra mới: chọn bốn tuần, bộ lọc, bài nghe/đọc shopping, lời thoại không tính độc lập và giữ qua reload, nút nghe không nộp form; hoàn thành cả bốn kiểm tra tuần trong trang mở mới offline, phát WAV thật và giữ kết quả/câu viết/lịch ôn.
- So toàn bộ định nghĩa bảy bài cũ với commit 7552260 không đổi; 32 ID/cấu trúc câu hợp lệ, 57 WAV đúng byte/hash/header. Lệnh audio chạy lại tạo 0 file. Kiểm tra này không chứng minh chất lượng sư phạm/phát âm.
- Preview 4175 đã chạy thêm luồng nghe/tự viết ở hai kích thước, WAV phát thật, không lỗi runtime/tràn ngang; axe A/AA không báo vi phạm vùng quét. Đã xem ảnh Khám phá desktop/mobile; ảnh/trace thử trong .local, không commit.
- ai:evaluate dry kiểm tra 10 mẫu đạt, không gọi provider. Preview/Auth thật xác nhận AI unavailable/503, không lượt trả phí; dữ liệu thử đã dọn. Prettier/diff, 18 Markdown/94 liên kết/24 task và quét secret build/84 file staged đạt. Bundle khách khoảng 709 kB minified/206 kB gzip, vẫn cảnh báo chưa chia route. Kết quả Git xác minh ở bàn giao cuối.

## Giới hạn và task tiếp theo

**Bắt đầu ADAPT-001**: ghép phiên theo kiến thức tiên quyết, ôn đến hạn, điểm yếu và sở thích; lựa chọn khó quá/hôm nay mệt/quay lại sau nghỉ; giới hạn tải và giải thích ngắn bài được chọn. Chi tiết [TASKS.md](TASKS.md). Không đổi câu/ID cũ hoặc quy kết band từ tiến độ.

AI-001 chỉ tiếp tục đối chiếu thật khi có cấu hình máy chủ/ngân sách và người duyệt rubric. Chưa có hosted/SMTP/HTTPS, chống abuse production, Safari/iPhone/Android thật, giáo viên duyệt học liệu/audio, mic hoặc AI nói/viết đầy đủ. Offline phụ thuộc cache còn tồn tại và không đồng nghĩa sao lưu; sync không chạy khi OS đóng app, chưa benchmark nhiều tháng. Giữ các giới hạn riêng trong BACKEND/SYNC/OFFLINE/NOTIFICATIONS/AI.
