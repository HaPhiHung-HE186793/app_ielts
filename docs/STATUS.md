# Trạng thái bàn giao hiện tại

Cập nhật: 2026-09-06, múi giờ Asia/Saigon.

## Đang ở đâu

**Đã có bản học thử local “Mỗi ngày”. Task tiếp theo là PLAN-001.**

- Branch: `main`; remote `origin`: `https://github.com/HaPhiHung-HE186793/app_ielts.git`.
- Hoàn thành DOC-001, APP-001, APP-002, CONTENT-001, LEARN-001, LEARN-002, REVIEW-001.
- PLAN-001 ở trạng thái READY. Không có task đang làm dở hoặc blocker cho phần local này.
- Mốc 1 chưa đóng hoàn toàn: còn kế hoạch/onboarding theo thời gian và PROGRESS-001 đầy đủ.
- Chưa có backend, AI, dịch vụ cloud, deployment công khai hoặc PWA install/offline.

## Dùng được ngay

- Chạy `npm ci` rồi `npm run dev`, mở http://127.0.0.1:5173.
- Năm khu vực: Hôm nay, Khám phá, Luyện tập, Ôn lại, Tiến bộ; desktop có sidebar, điện thoại có thanh dưới.
- Bảy bài thử nghiệm, mỗi bài có câu mẫu, ba hoạt động, gợi ý/giải thích/thử lại và câu tự viết tùy chọn.
- Lưu bài dở kể cả lựa chọn/câu đang nhập, phân biệt đáp án đúng độc lập với đúng sau gợi ý/sửa lỗi.
- Lịch ôn 1/3/7/14/30 ngày; sai hoặc dùng gợi ý quay lại sau 10 phút; có ôn sớm và trạng thái đến hạn cập nhật khi chuyển trang.
- Cài đặt tên/sở thích/phút dự kiến/loại thi, tải và khôi phục bản sao JSON, xử lý lỗi dữ liệu và lỗi ghi.
- Trang Tiến bộ dùng lượt làm thật và hiển thị câu tự viết, chưa đo phút học chủ động hoặc suy band IELTS.

## File cần biết

- `src/content/lessons.ts`, [CONTENT_REVIEW.md](CONTENT_REVIEW.md): học liệu và nguồn/rà soát.
- `src/domain/learning.ts`, `session.ts`: chấm đáp án, lượt làm, lịch ôn; có unit test.
- `src/data/schema.ts`, `store.ts`: schema version 1 và localStorage key `moi-ngay.study.v1`.
- `src/app`, `src/features`, `src/components`, `src/styles`: điều hướng và giao diện.
- `tests/learning.spec.ts`, `playwright.config.ts`, [TESTING.md](TESTING.md): luồng kiểm tra trình duyệt và cách chạy.
- [DECISIONS.md](DECISIONS.md): tên làm việc, stack, lưu local, lịch ôn và các chọn lựa còn mở.

## Kiểm tra đã đạt

- Cài dependency thành công, có lockfile; Node 22.18.0 và npm 10.9.3.
- Lint, typecheck và build thành công.
- Vitest: 26 test đạt, gồm vòng đời cả bảy bài, chấm đáp án, lịch ôn, chống nộp trùng và kiểm tra bản sao.
- Playwright: 18 test đạt trên Chrome desktop 1440×1000 và màn hình điện thoại 360×800; chạy trên bản build qua preview.
- Đã kiểm tra ảnh giao diện, không có lỗi runtime/tràn ngang ở hai kích thước trên.
- Axe không phát hiện vi phạm trong tập luật WCAG A/AA trên các trang đã quét và hộp cài đặt; đây chỉ là kiểm tra tự động.
- Chi tiết phạm vi và các môi trường chưa kiểm tra nằm trong TESTING.

## Task tiếp theo chính xác

**PLAN-001 — Onboarding và phiên học theo thời gian.**

Đã có form cài đặt cơ bản, không cần xây lại. Cần thu thập mục tiêu/ngày thi tùy chọn, bổ sung lựa chọn 2/5/15 phút hoặc buổi đầy đủ có hành vi học thực sự khác nhau, giữ bài dở và tương thích dữ liệu version 1. Không tạo band từ đánh giá ngắn hoặc báo phiên hai phút là đủ khối lượng IELTS. Xem phần chi tiết PLAN-001 trong [TASKS.md](TASKS.md).

Sau đó hoàn thiện PROGRESS-001 với kế hoạch và thời gian hoạt động thực; hiện trang thống kê mới là phần nền.

## Giới hạn cần giữ rõ

- Tiến độ chỉ nằm ở trình duyệt/origin hiện tại; localhost và 127.0.0.1 là hai kho khác nhau. Có bản sao thủ công, chưa đồng bộ cloud.
- Chỉ giữ một bài dở. Chuyển bài khác cần xác nhận trong app. Chưa giải quyết ghi đồng thời an toàn từ nhiều tab.
- Không ghi âm, không chấm phát âm/Writing bằng AI. Giọng câu mẫu là SpeechSynthesis tùy thiết bị.
- Học liệu do trợ lý biên soạn và rà soát nội bộ, chưa có giáo viên độc lập xác nhận; không phải kho đề IELTS.
- Chưa có đánh giá đầu vào, lịch học sáu tháng cá nhân, đo phút chủ động hoặc chương trình bốn tuần đầy đủ.
- Chưa kiểm thử Safari/iPhone và Android thật, PWA offline/push, Supabase hoặc nhà cung cấp AI.
- Ảnh và script kiểm tra tạm ở `.local`, báo cáo Playwright ở `test-results`, đều được gitignore.
- Dev server là tiến trình local, có thể cần chạy lại trong session mới. Dùng Git để xác minh commit và trạng thái remote hiện tại.
