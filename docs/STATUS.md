# Trạng thái bàn giao hiện tại

Cập nhật: 2026-09-06, múi giờ Asia/Saigon.

## Đang ở đâu

**Đã hoàn thành mốc 1 local, gồm PROGRESS-001: lịch sử phiên và thời gian hoạt động. Task tiếp theo là PWA-001.**

- Branch: `main`; remote `origin`: `https://github.com/HaPhiHung-HE186793/app_ielts.git`.
- Hoàn thành DOC-001, APP-001, APP-002, CONTENT-001, LEARN-001, LEARN-002, REVIEW-001, PLAN-001, PROGRESS-001.
- PWA-001 ở trạng thái READY, đủ phụ thuộc. Không có task đang làm dở; chọn PWA trước phần Supabase cần cấu hình dịch vụ.
- Mốc 1 đã đóng theo tiêu chí luồng local. Chưa coi đây là chương trình IELTS hoặc bản dùng đa thiết bị hoàn chỉnh.
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
- Tải và khôi phục bản sao JSON, đọc version 1/2/3 và lưu version 3; xử lý dữ liệu lỗi/phiên bản không hỗ trợ và lỗi ghi.
- Bộ đo trong hoạt động học: cửa sổ có focus/hiển thị, tự dừng khi nghỉ 60 giây, đổi tab, mở cài đặt hoặc rời bài; có nút tạm dừng đo. Lưu checkpoint mỗi 5 giây, tách khoảng qua nửa đêm.
- Tiến bộ có biểu đồ 7 ngày, tổng đo, lịch sử phiên hoàn tất/đã thay và bộ lọc bài/ôn/khởi động. Khởi động không tăng số bài; dữ liệu cũ giữ giờ là chưa biết. Phút kế hoạch và số đo là hai loại dữ liệu khác nhau.

## File cần biết

- `src/content/lessons.ts`, [CONTENT_REVIEW.md](CONTENT_REVIEW.md): học liệu và nguồn/rà soát.
- `src/domain/learning.ts`, `session.ts`: chấm đáp án, lượt làm, lịch ôn; có unit test.
- `src/domain/planner.ts`, `planner.test.ts`: ghép phiên và chuyển hoạt động theo kết quả thật.
- `src/data/schema.ts`, `store.ts`: schema version 3, đường đọc version 1/2; key vẫn là `moi-ngay.study.v1`, epoch bảo vệ import/reset.
- `src/domain/activity.ts`, `activity.test.ts`: đồng hồ, phân ngày, lưu checkpoint không trùng; `progress.ts`: dữ liệu hiển thị tiến bộ.
- `src/components/ActivityMeter.tsx`, `src/app/activity-context.ts`, `src/features/progress/Progress.tsx`: gắn bộ đo và giao diện. Progress đã tách khỏi `features/pages/Pages.tsx`.
- `src/features/today/SessionChoices.tsx`, `SessionPage.tsx`, `src/components/SettingsDialog.tsx`: chọn nhịp, tiếp tục phiên và thiết lập mục tiêu.
- `src/app`, `src/features`, `src/components`, `src/styles`: điều hướng và giao diện.
- `tests/learning.spec.ts`, `planning.spec.ts`, `progress.spec.ts`, `playwright.config.ts`, [TESTING.md](TESTING.md): luồng kiểm tra trình duyệt và cách chạy.
- [DECISIONS.md](DECISIONS.md): tên làm việc, stack, lưu local, lịch ôn và các chọn lựa còn mở.

## Kiểm tra đã đạt

- Cài dependency thành công, có lockfile; Node 22.18.0 và npm 10.9.3.
- Lint, typecheck và build thành công.
- Vitest: 47 test đạt, gồm bộ đo/ngắt quãng/đổi giờ/nửa đêm, checkpoint, lịch sử và các luồng học cũ.
- Playwright: 40 ca đã được kiểm tra thành công ở Chrome desktop 1440×1000 và mobile viewport 360×800. Lượt đầu 38 ca có 36 đạt, hai ca cần tắt focus emulation trong test; đã chạy lại đạt. Sau bổ sung ca visibility/lifecycle có điều khiển và chỉnh CSS thống kê mobile, chạy lại 12 ca liên quan (10 tiến bộ + 2 axe trang chính), đều đạt.
- Đã kiểm tra ảnh giao diện, không có lỗi runtime/tràn ngang ở hai kích thước trên.
- Axe không phát hiện vi phạm trong tập luật WCAG A/AA trên các trang đã quét, hộp cài đặt, phiên khởi động/phản hồi/kết quả và buổi đầy đủ; đây chỉ là kiểm tra tự động.
- Chi tiết phạm vi và các môi trường chưa kiểm tra nằm trong TESTING.

## Task tiếp theo chính xác

**PWA-001 — Manifest, biểu tượng và thêm vào màn hình chính.**

Giữ web app hiện tại, thêm manifest/icon/standalone và hướng dẫn cài phù hợp nền tảng. Kiểm tra tiêu chí cài đặt từ tài liệu chính thức lúc triển khai; chưa có iPhone/Android thật để xác nhận. Không đồng nhất cài PWA với offline, cloud hoặc App Store. Xem chi tiết trong [TASKS.md](TASKS.md).

Không thay origin mà làm người học tưởng mất dữ liệu: kho phụ thuộc địa chỉ, có bản sao thủ công. PWA-002 offline vẫn phụ thuộc DATA-002; chưa cấu hình Supabase, hosting hay tên miền công khai.

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
