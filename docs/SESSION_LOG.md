# Nhật ký bàn giao

Thêm một mục sau mỗi mốc công việc. Ghi ngày, task, thay đổi, kiểm tra, giới hạn và bước tiếp theo; tránh chép nguyên lịch sử chat. Trạng thái hiện tại nằm trong [STATUS.md](STATUS.md).

## 2026-09-06 — DOC-001: thiết lập tài liệu dự án

### Yêu cầu

Người dùng muốn bắt đầu quản lý task, có tài liệu để session mới tiếp tục đúng hướng, đồng thời commit và push để lưu công việc trên remote.

### Thực hiện

- Đối chiếu đề xuất sản phẩm với repository hiện chỉ có README và initial commit.
- Viết lại README thành điểm bắt đầu đọc tài liệu.
- Tạo AGENTS với quy trình đọc, làm task, kiểm tra và cập nhật bàn giao.
- Tạo PRODUCT, ARCHITECTURE và DECISIONS, ghi rõ lựa chọn mặc định và thông tin chưa xác nhận.
- Tạo TASKS theo các mốc từ scaffold đến học local, đồng bộ/PWA, AI/beta và IELTS.
- Tạo STATUS với bước tiếp theo APP-001; thêm gitignore cho dependency, output và cấu hình bí mật local.

### Kiểm tra

- Trước thay đổi: Git sạch trên `main`; sau fetch, local và `origin/main` không lệch commit.
- Đã kiểm tra 8 file Markdown, 13 liên kết nội bộ và 24 task; không có liên kết hỏng, ID trùng hoặc phụ thuộc sai thứ tự. APP-001 là task READY duy nhất và đủ phụ thuộc.
- Đã đối chiếu trạng thái bàn giao giữa các tài liệu và chạy `git diff --check` thành công; phần staged được kiểm tra lại trước commit.
- Không chạy build/test ứng dụng vì chưa có code hoặc cấu hình tương ứng.

### Giới hạn và lưu Git

- Mốc này chỉ tạo nền tài liệu, chưa khởi tạo ứng dụng.
- Commit/push được thực hiện sau kiểm tra. Lấy hash và trạng thái đồng bộ cuối cùng bằng Git; không chèn hash của chính commit vào tài liệu đang được commit.
- Người dùng đã cho phép commit/push mốc này. Kết quả thực tế và lỗi nếu có cần được báo trong bàn giao cuối session.

### Tiếp theo

APP-001: kiểm tra môi trường Node/npm, khởi tạo React + TypeScript + Vite, bổ sung lệnh chạy và xác minh lint/typecheck/build cùng mở trang.

## 2026-09-06 — Bản học thử local: APP-001/002, CONTENT-001, LEARN-001/002, REVIEW-001

### Yêu cầu và phạm vi

Người dùng yêu cầu bắt đầu làm app. Sau scaffold, tiếp tục đến một phiên học có thể dùng thử và lưu tiến độ; cập nhật tài liệu và commit/push theo yêu cầu lưu công việc trong cuộc trao đổi. Chưa triển khai cloud, AI hoặc cửa hàng ứng dụng.

### Đã thực hiện

- Khởi tạo React 19, TypeScript 5.9, Vite 8, npm/lockfile và các lệnh chạy/lint/typecheck/build/test.
- Tên làm việc “Mỗi ngày”, giao diện tiếng Việt với năm khu vực, điều hướng hash, sidebar desktop/thanh dưới điện thoại, SVG gốc và font đóng gói local.
- Biên soạn bảy bài nền tảng có bản dịch, giải thích và hoạt động nhớ lại/áp dụng. Hồ sơ nguồn và giới hạn rà soát ở CONTENT_REVIEW.
- Luồng giới thiệu → ba hoạt động → tự viết → hoàn thành; ghi riêng đúng độc lập, gợi ý và thử lại.
- Store local có schema version 1, lưu câu đang nhập và bài dở, ngăn nộp trùng, xuất/nhập bản sao và cảnh báo khi không ghi được dữ liệu. Dữ liệu lỗi cũ được giữ nguyên.
- Lịch ôn khởi đầu DEC-009; danh sách đến hạn, ôn sớm và thống kê từ lượt thực tế.
- Form sở thích/tên/thời gian dự kiến/loại thi và lịch sử câu tự viết. PLAN-001 và PROGRESS-001 còn phần cần phát triển.

### Kiểm tra và sửa lỗi

- Dependency cài thành công trên Node 22.18.0/npm 10.9.3; npm báo không có lỗ hổng ở lần kiểm tra dependency của mốc này.
- Lint, typecheck, build đạt; Vitest đạt 26 test, Playwright đạt 18 test trên bản build ở 1440px và 360px.
- Đã sửa lỗi thời gian đến hạn không cập nhật ngay khi đổi route sau khi đồng hồ thay đổi; có test hồi quy mô phỏng qua một ngày.
- Đã bổ sung lưu cả câu/chọn lựa chưa nộp và khôi phục đúng các trường hồ sơ trong form sau khi nhập bản sao.
- Đã chỉnh font serif có tiếng Việt, tăng tương phản chữ phụ và thêm semantics cho thanh tiến độ. Axe không phát hiện vi phạm A/AA trong phạm vi quét các trang chính/cài đặt.
- Đã xem ảnh desktop/điện thoại và kiểm tra không tràn ngang, không có lỗi runtime. Ảnh/trace không đưa vào Git.

### Bàn giao

- DONE: APP-001, APP-002, CONTENT-001, LEARN-001, LEARN-002, REVIEW-001; cộng DOC-001 từ mốc trước.
- READY tiếp theo: PLAN-001 — onboarding, mục tiêu và phiên học 2/5/15 phút/buổi đầy đủ.
- PROGRESS-001 có phần giao diện/thống kê nhưng vẫn TODO cho phần kế hoạch và phút học chủ động.
- Chưa xác minh iPhone/Safari hay Android thật; chưa có PWA offline/install, API AI, ghi âm hoặc tài khoản.
- Chỉ một bài dở, dữ liệu local không phải đồng bộ; bộ bài chỉ rà soát nội bộ. Giữ các giới hạn này rõ trong session sau.
- Các lệnh kiểm tra và đường tiếp tục đã ghi ở TESTING/STATUS/TASKS. Hash commit và trạng thái push cuối mốc được xác minh bằng Git và báo trong kết quả session.
