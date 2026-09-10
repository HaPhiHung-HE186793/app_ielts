# Hướng dẫn làm việc trong app_ielts

## Mục đích

Giữ các session phát triển đi đúng sản phẩm và tiếp tục từ trạng thái thực tế. Tài liệu này áp dụng cho toàn repository. Chỉ dẫn mới của người dùng có ưu tiên cao hơn tài liệu dự án; cập nhật tài liệu nếu hướng đi thay đổi.

## Bắt đầu mỗi session

1. Đọc `docs/STATUS.md` và `docs/TASKS.md`.
2. Đọc `docs/PRODUCT.md`, `docs/ARCHITECTURE.md` và `docs/DECISIONS.md` trước khi thay đổi phạm vi hoặc kiến trúc.
3. Xem mục gần nhất trong `docs/SESSION_LOG.md` nếu cần ngữ cảnh.
4. Kiểm tra `git status --short --branch`, branch hiện tại và lịch sử commit gần nhất.
5. Kiểm tra code có thật trước khi mô tả tính năng đã hoàn thành. Trạng thái tài liệu cũ không thay thế bằng chứng trong repository.
6. Chọn task sẵn sàng ưu tiên cao nhất, hoặc task người dùng chỉ định. Đánh dấu `IN_PROGRESS` trước khi triển khai.

Nếu thiếu thông tin không cản trở công việc, ghi giả định trong `docs/DECISIONS.md` và tiếp tục phần độc lập. Không tạo bước xin phép mới chỉ vì tài liệu có mục chưa chốt. Việc commit, push hoặc triển khai tuân theo phạm vi người dùng đã cho phép trong session.

## Ràng buộc sản phẩm

- Giao diện và giải thích mặc định bằng tiếng Việt; nội dung luyện tập bằng tiếng Anh phù hợp trình độ.
- Ưu tiên trải nghiệm trên điện thoại và một luồng học hoàn chỉnh.
- Giữ vòng học: tiếp nhận → tự nhớ lại → sử dụng → phản hồi → ôn lại.
- Phiên ngắn hỗ trợ bắt đầu và duy trì; không mô tả vài phút học là đủ cho mục tiêu IELTS sáu tháng.
- Không hứa điểm IELTS, dùng lời khẳng định thần kinh học thiếu căn cứ hoặc tối ưu cuộn vô hạn gây lệ thuộc.
- Điểm AI phải được phân biệt với kết quả thi/đánh giá của giáo viên. Không quy đổi XP, lượt xem hoặc streak thành band IELTS.
- Ghi rõ dữ liệu mẫu và chức năng mô phỏng. Không trình bày phản hồi lập sẵn như đánh giá AI thật.
- Không tự mở rộng sang mạng xã hội, thanh toán, bảng xếp hạng công khai hoặc app native trước task tương ứng.

## Ràng buộc kỹ thuật

- Hướng hiện tại theo người dùng (2026-09-10): React + TypeScript + Vite, PWA; Vercel frontend, Render backend, Neon PostgreSQL + Neon Managed Auth qua REST. DATA-003 có adapter/migration và kiểm tra local; DEPLOY-002 xác minh cloud thật. Supabase local giữ cho regression, không dùng hướng hosted cũ. Xem DEC-023 và docs/NEON_BACKEND.md.
- Chọn phiên bản thư viện lúc thực hiện task, kiểm tra tương thích và commit lockfile. Không suy đoán rằng công cụ đã được cài.
- API key bí mật và khóa dịch vụ chỉ ở máy chủ. Biến `VITE_*` nằm trong mã phía trình duyệt và không được dùng để giữ bí mật.
- Không commit `.env`, token, bản ghi âm cá nhân hoặc dữ liệu học viên thực. `.env.example` chỉ chứa placeholder và cấu hình công khai phù hợp.
- Tách học liệu, logic học/ôn và giao diện để kiểm tra hành vi độc lập.
- Dữ liệu offline không đồng nghĩa đã được sao lưu. Khi làm đồng bộ, hiển thị trạng thái và xử lý gửi lặp/mất mạng.
- Không xóa hoặc ghi đè thay đổi sẵn có của người dùng để làm sạch Git. Không force-push hoặc sửa lịch sử dùng chung nếu chưa có yêu cầu rõ ràng.

## Hoàn thành một task

- Đáp ứng tiêu chí trong `docs/TASKS.md`.
- Chạy kiểm tra phù hợp với thay đổi. Với code: các lệnh lint/typecheck/build/test đã được cấu hình và kiểm tra luồng liên quan. Với tài liệu: kiểm tra liên kết, tính nhất quán và `git diff --check`.
- Viết test cho logic có rủi ro như lịch ôn, chấm đáp án, đồng bộ và quyền truy cập; không thêm test chỉ để lặp lại nội dung tĩnh.
- Không ghi kiểm tra đã đạt nếu chưa chạy. Ghi rõ kiểm tra thiết bị/dịch vụ nào còn thiếu.
- Cập nhật `docs/TASKS.md`, `docs/STATUS.md`, thêm mục vào `docs/SESSION_LOG.md`.
- Cập nhật README khi mốc phát triển, task tiếp theo hoặc hướng dẫn chạy thay đổi, tránh để phần tóm tắt mâu thuẫn với STATUS.
- Nếu có thay đổi định hướng, cập nhật `docs/DECISIONS.md` và tài liệu liên quan trong cùng mốc.
- Khi commit/push đã được cho phép, kiểm tra diff, stage đúng file, commit mô tả rõ và xác minh kết quả push. Nếu push thất bại, báo nguyên nhân và commit còn ở local.

## Quy tắc bàn giao

`docs/STATUS.md` là ảnh chụp trạng thái hiện tại, giữ ngắn và thay nội dung cũ khi cần. `docs/SESSION_LOG.md` là lịch sử, thêm mục mới thay vì ghi đè lịch sử.

Mỗi bàn giao cần nêu: task hoàn thành, file quan trọng, kiểm tra đã chạy, giới hạn còn lại và một task tiếp theo cụ thể. Không cần ghi hash của chính commit đang tạo vào file; lấy hash bằng Git và báo trong kết quả bàn giao.
