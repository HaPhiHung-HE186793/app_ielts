# Trạng thái bàn giao hiện tại

Cập nhật: 2026-09-06, múi giờ Asia/Saigon.

## Đang ở đâu

**Đã hoàn thành mốc 1 local và PWA-001: cấu hình, biểu tượng và hướng dẫn cài từ web. Task tiếp theo là DATA-001.**

- Branch: `main`; remote `origin`: `https://github.com/HaPhiHung-HE186793/app_ielts.git`.
- Hoàn thành DOC-001, APP-001, APP-002, CONTENT-001, LEARN-001, LEARN-002, REVIEW-001, PLAN-001, PROGRESS-001, PWA-001.
- DATA-001 ở trạng thái READY, đủ phụ thuộc. Không có code đang làm dở trong PWA-001; kiểm tra cài/khởi chạy trên thiết bị thật vẫn còn thiếu.
- Mốc 1 đã đóng theo tiêu chí luồng local. Chưa coi đây là chương trình IELTS hoặc bản dùng đa thiết bị hoàn chỉnh.
- Chưa có backend, AI, dịch vụ cloud, deployment công khai hoặc PWA offline. Chưa đạt điều kiện mốc 2 đồng bộ nhiều thiết bị.

## Dùng được ngay

- Chạy `npm ci` rồi `npm run dev`, mở http://127.0.0.1:5173.
- Năm khu vực: Hôm nay, Khám phá, Luyện tập, Ôn lại, Tiến bộ; desktop có sidebar, điện thoại có thanh dưới.
- Bảy bài thử nghiệm, mỗi bài có câu mẫu, ba hoạt động, gợi ý/giải thích/thử lại và câu tự viết tùy chọn.
- Lưu bài dở kể cả lựa chọn/câu đang nhập, phân biệt đáp án đúng độc lập với đúng sau gợi ý/sửa lỗi.
- Lịch ôn 1/3/7/14/30 ngày; sai hoặc dùng gợi ý quay lại sau 10 phút; có ôn sớm và trạng thái đến hạn cập nhật khi chuyển trang.
- Thiết lập tùy chọn tên/sở thích/phút dự kiến/loại thi, mục tiêu, ngày mục tiêu và tự nhận xét nền tảng. Không tự gán band hoặc ngày thi.
- Hôm nay chọn 2/5/15 phút/buổi đầy đủ: khởi động một câu; một bài trọn vẹn; hoặc ghép bài với tối đa ba câu đến hạn. Hiện rõ thời gian dự kiến và phần chưa có học liệu.
- Lưu phiên hiện tại, câu chưa nộp/gợi ý và kết quả qua reload; tiếp tục từ Hôm nay. Lượt khởi động không tính là bài hoàn thành và không đổi lịch ôn. Tạo phiên mới giữ bài dở.
- Tải và khôi phục bản sao JSON, đọc version 1/2/3 và lưu version 3; xử lý dữ liệu lỗi/phiên bản không hỗ trợ và lỗi ghi.
- Bộ đo trong hoạt động học: cửa sổ có focus/hiển thị, tự dừng khi nghỉ 60 giây, đổi tab, mở cài đặt hoặc rời bài; có nút tạm dừng đo. Lưu checkpoint mỗi 5 giây, tách khoảng qua nửa đêm.
- Tiến bộ có biểu đồ 7 ngày, tổng đo, lịch sử phiên hoàn tất/đã thay và bộ lọc bài/ôn/khởi động. Khởi động không tăng số bài; dữ liệu cũ giữ giờ là chưa biết. Phút kế hoạch và số đo là hai loại dữ liệu khác nhau.
- Thêm vào màn hình chính từ cài đặt/cuối trang hoặc `#/install`: ba hướng dẫn iPhone/iPad, Android, máy tính. Có nút cài khi trình duyệt cung cấp prompt, đường từ chối/lỗi và nhận biết cửa sổ standalone. Manifest/icon nằm trong repo; bản cài chưa có offline/cloud.

## File cần biết

- `src/content/lessons.ts`, [CONTENT_REVIEW.md](CONTENT_REVIEW.md): học liệu và nguồn/rà soát.
- `src/domain/learning.ts`, `session.ts`: chấm đáp án, lượt làm, lịch ôn; có unit test.
- `src/domain/planner.ts`, `planner.test.ts`: ghép phiên và chuyển hoạt động theo kết quả thật.
- `src/data/schema.ts`, `store.ts`: schema version 3, đường đọc version 1/2; key vẫn là `moi-ngay.study.v1`, epoch bảo vệ import/reset.
- `src/domain/activity.ts`, `activity.test.ts`: đồng hồ, phân ngày, lưu checkpoint không trùng; `progress.ts`: dữ liệu hiển thị tiến bộ.
- `src/components/ActivityMeter.tsx`, `src/app/activity-context.ts`, `src/features/progress/Progress.tsx`: gắn bộ đo và giao diện. Progress đã tách khỏi `features/pages/Pages.tsx`.
- `src/features/today/SessionChoices.tsx`, `SessionPage.tsx`, `src/components/SettingsDialog.tsx`: chọn nhịp, tiếp tục phiên và thiết lập mục tiêu.
- `src/app`, `src/features`, `src/components`, `src/styles`: điều hướng và giao diện.
- `public/manifest.webmanifest`, `public/icons`, `scripts/generate-icons.js`: tài nguyên cài app; `src/app/installation.ts`, `src/features/install/InstallPage.tsx`: trạng thái và hướng dẫn. [INSTALLATION.md](INSTALLATION.md) ghi cách dùng, chuẩn bị hosting và bước kiểm tra thiết bị.
- `tests/learning.spec.ts`, `planning.spec.ts`, `progress.spec.ts`, `install.spec.ts`, `playwright.config.ts`, [TESTING.md](TESTING.md): luồng kiểm tra trình duyệt và cách chạy.
- [DECISIONS.md](DECISIONS.md): tên làm việc, stack, lưu local, lịch ôn và các chọn lựa còn mở.

## Kiểm tra đã đạt

- Cài dependency thành công, có lockfile; Node 22.18.0 và npm 10.9.3.
- Lint, typecheck và build thành công.
- Vitest: 47 test đạt, gồm bộ đo/ngắt quãng/đổi giờ/nửa đêm, checkpoint, lịch sử và các luồng học cũ.
- Playwright: 56 ca đã kiểm tra thành công ở Chrome desktop 1440×1000/mobile viewport 360×800 qua các lượt chạy. Lượt toàn bộ 52/56 đạt; bốn ca PWA mới cần đổi từ incognito sang hồ sơ thử riêng và sửa locator tiếp tục phiên. Chạy lại sáu ca liên quan đạt. Sau bổ sung safe-area, chạy sáu ca điều hướng/axe/hướng dẫn đạt; chi tiết trong SESSION_LOG.
- Chrome đọc manifest và bốn icon đúng kích thước; `Page.getInstallabilityErrors` trả mảng rỗng trong hồ sơ Chrome tạm riêng. Không cài app lên hệ điều hành. Prompt/standalone có điều khiển, không coi là kiểm tra thiết bị thật.
- Đã xem giao diện desktop/mobile; mô phỏng safe-area tại 390×844 và 844×390 không có lỗi runtime/tràn ngang. Thanh dưới vẫn tiếp cận được khi máy ngang thấp; chưa xác minh Safari hoặc bàn phím thiết bị thật.
- Axe không phát hiện vi phạm trong tập luật WCAG A/AA trên các trang đã quét, hộp cài đặt, phiên khởi động/phản hồi/kết quả và buổi đầy đủ; đây chỉ là kiểm tra tự động.
- Chi tiết phạm vi và các môi trường chưa kiểm tra nằm trong TESTING.

## Task tiếp theo chính xác

**DATA-001 — Supabase, tài khoản và quyền truy cập dữ liệu.**

Kiểm tra môi trường Supabase, chuẩn bị Auth/migration/cấu hình mẫu và chính sách local khi đăng xuất. Có `docker.exe` trong PATH nhưng chưa kiểm tra engine; chưa thấy Supabase CLI trong PATH, chưa có cấu hình cloud. Có thể làm phần code/tài liệu độc lập; chỉ đóng task sau khi kiểm tra quyền bằng hai tài khoản trên Supabase chạy thật. Xem [TASKS.md](TASKS.md).

Giữ luồng khách, kho version 3 và bản sao cũ. Không tự tải dữ liệu local lên cloud; đồng bộ là DATA-002. PWA-002 offline vẫn chờ DATA-002. Chưa có hosting/HTTPS công khai để mở app từ điện thoại; quy trình kiểm tra khi có thiết bị ở INSTALLATION.

## Giới hạn cần giữ rõ

- Tiến độ chỉ nằm ở trình duyệt/origin hiện tại; localhost và 127.0.0.1 là hai kho khác nhau. Có bản sao thủ công, chưa đồng bộ cloud.
- Chỉ giữ một bài dở. Chuyển bài khác cần xác nhận trong app. Chưa giải quyết ghi đồng thời an toàn từ nhiều tab.
- Lịch sử phiên chỉ có từ bản này; không khôi phục được các kế hoạch cũ đã bị thay. Phiên dở giữ danh sách lúc tạo, không tự xếp lại theo ngày.
- Số đo không xác nhận chú ý, có thể thiếu lúc đọc/nói yên lặng hoặc khi thiết bị kill trước checkpoint. Test focus dùng sự kiện trình duyệt; visibility/pagehide/pageshow được mô phỏng có điều khiển, chưa thay kiểm thử thiết bị thật. Nút dừng đo áp dụng cho lượt mở hoạt động hiện tại.
- Không ghi âm, không chấm phát âm/Writing bằng AI. Giọng câu mẫu là SpeechSynthesis tùy thiết bị.
- Học liệu do trợ lý biên soạn và rà soát nội bộ, chưa có giáo viên độc lập xác nhận; không phải kho đề IELTS.
- Chưa có đánh giá đầu vào, lịch học sáu tháng cá nhân hoặc chương trình bốn tuần đầy đủ.
- Chưa kiểm thử Safari/iPhone và Android thật, PWA offline/push, Supabase hoặc nhà cung cấp AI.
- Ảnh và script kiểm tra tạm ở `.local`, báo cáo Playwright ở `test-results`, đều được gitignore.
- Dev server là tiến trình local, có thể cần chạy lại trong session mới. Dùng Git để xác minh commit và trạng thái remote hiện tại.
