# Trạng thái bàn giao hiện tại

Cập nhật: 2026-09-06, múi giờ Asia/Saigon.

## Đang ở đâu

**Đã hoàn thành PLAN-001: thiết lập mục tiêu và phiên học theo thời gian. Task tiếp theo là PROGRESS-001.**

- Branch: `main`; remote `origin`: `https://github.com/HaPhiHung-HE186793/app_ielts.git`.
- Hoàn thành DOC-001, APP-001, APP-002, CONTENT-001, LEARN-001, LEARN-002, REVIEW-001, PLAN-001.
- PROGRESS-001 ở trạng thái READY. Không có task đang làm dở hoặc blocker cho phần local này.
- Mốc 1 chưa đóng hoàn toàn: còn PROGRESS-001 với lịch sử phiên và phút hoạt động thực.
- Chưa có backend, AI, dịch vụ cloud, deployment công khai hoặc PWA install/offline.

## Dùng được ngay

- Chạy `npm ci` rồi `npm run dev`, mở http://127.0.0.1:5173.
- Năm khu vực: Hôm nay, Khám phá, Luyện tập, Ôn lại, Tiến bộ; desktop có sidebar, điện thoại có thanh dưới.
- Bảy bài thử nghiệm, mỗi bài có câu mẫu, ba hoạt động, gợi ý/giải thích/thử lại và câu tự viết tùy chọn.
- Lưu bài dở kể cả lựa chọn/câu đang nhập, phân biệt đáp án đúng độc lập với đúng sau gợi ý/sửa lỗi.
- Lịch ôn 1/3/7/14/30 ngày; sai hoặc dùng gợi ý quay lại sau 10 phút; có ôn sớm và trạng thái đến hạn cập nhật khi chuyển trang.
- Thiết lập tùy chọn tên/sở thích/phút dự kiến/loại thi, mục tiêu, ngày mục tiêu và tự nhận xét nền tảng. Không tự gán band hoặc ngày thi.
- Hôm nay chọn 2/5/15 phút/buổi đầy đủ: khởi động một câu; một bài trọn vẹn; hoặc ghép bài với tối đa ba câu đến hạn. Hiện rõ thời gian dự kiến và phần chưa có học liệu.
- Lưu phiên hiện tại, câu chưa nộp/gợi ý và kết quả qua reload; tiếp tục từ Hôm nay. Lượt khởi động không tính là bài hoàn thành và không đổi lịch ôn. Tạo phiên mới giữ bài dở.
- Tải và khôi phục bản sao JSON, đọc bản version 1 và lưu version 2; xử lý dữ liệu lỗi/phiên bản không hỗ trợ và lỗi ghi.
- Trang Tiến bộ dùng lượt làm thật và hiển thị câu tự viết, chưa đo phút học chủ động hoặc suy band IELTS.

## File cần biết

- `src/content/lessons.ts`, [CONTENT_REVIEW.md](CONTENT_REVIEW.md): học liệu và nguồn/rà soát.
- `src/domain/learning.ts`, `session.ts`: chấm đáp án, lượt làm, lịch ôn; có unit test.
- `src/domain/planner.ts`, `planner.test.ts`: ghép phiên và chuyển hoạt động theo kết quả thật.
- `src/data/schema.ts`, `store.ts`: schema version 2, đường đọc version 1; localStorage key vẫn là `moi-ngay.study.v1`.
- `src/features/today/SessionChoices.tsx`, `SessionPage.tsx`, `src/components/SettingsDialog.tsx`: chọn nhịp, tiếp tục phiên và thiết lập mục tiêu.
- `src/app`, `src/features`, `src/components`, `src/styles`: điều hướng và giao diện.
- `tests/learning.spec.ts`, `tests/planning.spec.ts`, `playwright.config.ts`, [TESTING.md](TESTING.md): luồng kiểm tra trình duyệt và cách chạy.
- [DECISIONS.md](DECISIONS.md): tên làm việc, stack, lưu local, lịch ôn và các chọn lựa còn mở.

## Kiểm tra đã đạt

- Cài dependency thành công, có lockfile; Node 22.18.0 và npm 10.9.3.
- Lint, typecheck và build thành công.
- Vitest: 36 test đạt, gồm vòng đời bảy bài, chấm đáp án, lịch ôn, ghép phiên hữu hạn, chống nộp trùng, tiếp tục và nâng dữ liệu cũ.
- Playwright: 30 ca đã đạt trên Chrome desktop 1440×1000 và màn hình điện thoại 360×800, qua preview bản build. Lượt toàn bộ có 26 ca đạt và 4 ca lỗi bộ chọn trường trong test; sau sửa selector theo role, chạy lại 4 ca liên quan và đều đạt.
- Đã kiểm tra ảnh giao diện, không có lỗi runtime/tràn ngang ở hai kích thước trên.
- Axe không phát hiện vi phạm trong tập luật WCAG A/AA trên các trang đã quét, hộp cài đặt, phiên khởi động/phản hồi/kết quả và buổi đầy đủ; đây chỉ là kiểm tra tự động.
- Chi tiết phạm vi và các môi trường chưa kiểm tra nằm trong TESTING.

## Task tiếp theo chính xác

**PROGRESS-001 — Tiến bộ gắn với phiên và thời gian học chủ động.**

Đã có thống kê bài/lượt ôn và phiên theo thời gian. Cần đưa lượt khởi động/kết quả phiên vào Tiến bộ, lưu lịch sử phiên khi thay kế hoạch, và đo phút hoạt động với quy tắc rõ cho tab ẩn, bất động, tạm dừng, reload. Tách phút đo được khỏi ngân sách/thời lượng ước tính. Không điền giờ giả cho dữ liệu cũ. Xem phần chi tiết trong [TASKS.md](TASKS.md).

Chốt và kiểm tra cách đo trước khi đổi schema; giữ đường đọc bản sao version 1 và 2. Sau PROGRESS-001, chọn task mốc 2 đủ điều kiện theo cấu hình thực tế; không tự coi cloud/PWA là đã có.

## Giới hạn cần giữ rõ

- Tiến độ chỉ nằm ở trình duyệt/origin hiện tại; localhost và 127.0.0.1 là hai kho khác nhau. Có bản sao thủ công, chưa đồng bộ cloud.
- Chỉ giữ một bài dở. Chuyển bài khác cần xác nhận trong app. Chưa giải quyết ghi đồng thời an toàn từ nhiều tab.
- Chỉ lưu kế hoạch hiện tại; tạo phiên mới thay danh sách cũ nhưng giữ các lượt làm. Chưa có lịch sử mọi phiên. Phiên dở giữ danh sách lúc tạo, không tự xếp lại theo ngày.
- Không ghi âm, không chấm phát âm/Writing bằng AI. Giọng câu mẫu là SpeechSynthesis tùy thiết bị.
- Học liệu do trợ lý biên soạn và rà soát nội bộ, chưa có giáo viên độc lập xác nhận; không phải kho đề IELTS.
- Chưa có đánh giá đầu vào, lịch học sáu tháng cá nhân, đo phút chủ động hoặc chương trình bốn tuần đầy đủ.
- Chưa kiểm thử Safari/iPhone và Android thật, PWA offline/push, Supabase hoặc nhà cung cấp AI.
- Ảnh và script kiểm tra tạm ở `.local`, báo cáo Playwright ở `test-results`, đều được gitignore.
- Dev server là tiến trình local, có thể cần chạy lại trong session mới. Dùng Git để xác minh commit và trạng thái remote hiện tại.
