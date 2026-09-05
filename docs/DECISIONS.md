# Quyết định và giả định

Ngày lập: 2026-09-06. Các lựa chọn kỹ thuật là hướng khởi đầu từ đề xuất sản phẩm, có thể được cập nhật khi có bằng chứng hoặc chỉ dẫn mới. Không ghi một giả định thành yêu cầu đã được người dùng xác nhận.

## DEC-001 — Lưu ngữ cảnh phát triển trong Git

- Trạng thái: yêu cầu rõ ràng của người dùng.
- Quyết định: có `AGENTS.md`, tài liệu định hướng, task, trạng thái hiện tại và nhật ký session; commit và push mốc tài liệu khởi đầu.
- Lý do: session mới cần biết mục tiêu, việc đã làm và bước tiếp theo mà không phụ thuộc lịch sử chat.
- Hệ quả: cập nhật tài liệu bàn giao cùng các mốc phát triển; chỉ ghi tính năng hoàn thành khi có bằng chứng.

## DEC-002 — PWA trước, ứng dụng qua cửa hàng sau

- Trạng thái: hướng triển khai ban đầu.
- Quyết định: web app ưu tiên điện thoại, có thể cài lên màn hình chính; cân nhắc Capacitor khi đến giai đoạn cửa hàng ứng dụng.
- Lý do: đáp ứng việc mở web và dùng trên iPhone/Android với một nền giao diện chung.
- Hệ quả: kiểm thử khác biệt trình duyệt; không hứa khả năng offline, thông báo hoặc chạy nền trước khi đã triển khai và kiểm tra.

## DEC-003 — React, TypeScript, Vite; backend Supabase theo giai đoạn

- Trạng thái: lựa chọn mặc định để khởi tạo, chưa có code.
- Quyết định: React + TypeScript + Vite, npm/lockfile; luồng học local trước, tài khoản và đồng bộ sau.
- Lý do: có thể kiểm tra một phiên học hoàn chỉnh trước khi cần cấu hình dịch vụ ngoài.
- Hệ quả: tách lớp dữ liệu, ghi rõ local chưa phải sao lưu; chọn phiên bản thực tế ở APP-001. Nhà cung cấp AI và hosting chưa chốt.

## DEC-004 — Tiến bộ học tập là mục tiêu chính

- Trạng thái: nguyên tắc sản phẩm khởi đầu.
- Quyết định: dùng bài ngắn, chủ đề sở thích, phản hồi và ôn; có điểm dừng và cơ chế quay lại sau nghỉ.
- Lý do: mục tiêu của việc giữ hứng thú là hỗ trợ nhớ và sử dụng được tiếng Anh.
- Hệ quả: không xây cuộn vô hạn, hình phạt mất streak hoặc quy đổi điểm thưởng thành band IELTS.

## DEC-005 — Điểm AI có giới hạn và nguồn rõ ràng

- Trạng thái: nguyên tắc sản phẩm khởi đầu.
- Quyết định: phân biệt đánh giá AI, giáo viên và bài có đáp án; AI đưa ước lượng với căn cứ và hạn chế.
- Hệ quả: transcript không đủ để chấm phát âm; cần thử nghiệm đánh giá trên tập mẫu trước khi dựa vào điểm AI để đổi lộ trình.

## DEC-006 — Kiểm duyệt học liệu và làm một luồng hoàn chỉnh trước

- Trạng thái: hướng triển khai ban đầu.
- Quyết định: bắt đầu bằng bộ bài nhỏ có kiểm duyệt cho tuần đầu, sau đó mở rộng thành bốn tuần nền tảng trước beta.
- Lý do: cần kiểm tra được trải nghiệm học và độ phù hợp trước khi tăng số lượng nội dung.
- Hệ quả: các bài cần mục tiêu, giải thích, nguồn và quyền sử dụng; nội dung mẫu không được trình bày thành kho học liệu hoàn chỉnh.

## Các giả định/chọn lựa còn mở

| Mã | Vấn đề | Mặc định hiện tại | Thời điểm cần làm rõ |
| --- | --- | --- | --- |
| OPEN-001 | Cá nhân hay nhiều học viên | Ưu tiên cá nhân, chưa được xác nhận riêng | Trước tính năng quản lý học viên/kinh doanh |
| OPEN-002 | Academic hay General Training | Không tự điền loại thi; nền tảng dùng chung | Onboarding và trước xây học liệu luyện thi |
| OPEN-003 | Đầu vào, thời gian, ngày thi, điểm tối thiểu từng kỹ năng | Chưa biết; mục tiêu sáu tháng cần đánh giá lại | Khi tạo kế hoạch học cá nhân |
| OPEN-004 | Nhà cung cấp và ngân sách AI | Chưa chọn, không giả định có API key | AI-001 |
| OPEN-005 | Hosting, dự án Supabase, tên miền | Chưa cấp cấu hình; local trước | DATA-001 và bản triển khai beta |
| OPEN-006 | Thuật toán lịch ôn và tham số | Chưa chọn | REVIEW-001 |
| OPEN-007 | Thời gian lưu audio và bài cá nhân trên cloud | Chưa chốt, chưa thu thập dữ liệu thật | Trước upload dữ liệu thật và AI-002 |
| OPEN-008 | Người kiểm duyệt/giáo viên đối chiếu bài | Chưa bố trí | Trước phê duyệt học liệu beta và đánh giá AI |

Khi quyết định thay đổi, thêm hoặc cập nhật mục có ngày, lý do và task chịu ảnh hưởng. Không xóa lịch sử thay đổi quan trọng khỏi nhật ký session.
