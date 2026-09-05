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
