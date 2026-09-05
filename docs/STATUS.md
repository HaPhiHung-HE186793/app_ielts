# Trạng thái bàn giao hiện tại

Cập nhật: 2026-09-06, múi giờ Asia/Saigon.

## Đang ở đâu

**Mốc 0: tài liệu khởi đầu đã hoàn thành. Task tiếp theo là APP-001.**

- Repository: `app_ielts`.
- Branch khi lập bàn giao: `main`.
- Remote đã cấu hình: `origin` trỏ tới `https://github.com/HaPhiHung-HE186793/app_ielts.git`.
- Có bộ tài liệu sản phẩm/kiến trúc/task/bàn giao và `.gitignore` cơ bản.
- Chưa có ứng dụng chạy được, `package.json`, dependency, backend, AI, service worker hoặc deployment.
- Không có task triển khai đang thực hiện. Không có blocker cho APP-001.

## Đã hoàn thành

- DOC-001: ghi định hướng sản phẩm, phạm vi theo giai đoạn, giả định, kiến trúc dự kiến và tiêu chí cho các task.
- Thêm `AGENTS.md` để session mới đọc trạng thái trước khi sửa code.
- Lưu nguyên tắc cập nhật tài liệu và phân biệt kế hoạch với tính năng đã có.

## Bước tiếp theo chính xác

**APP-001 — Khởi tạo React + TypeScript + Vite.**

Đọc phần chi tiết APP-001 trong [TASKS.md](TASKS.md), kiểm tra Git và Node/npm, rồi tạo scaffold trong repository hiện tại. Giữ nguyên tài liệu, chọn dependency tương thích, bổ sung lockfile và hướng dẫn chạy. Lệnh lint/typecheck/build cùng kiểm tra mở trang là bằng chứng hoàn thành.

## Quyết định cần giữ

- Ưu tiên trải nghiệm cá nhân trên điện thoại, PWA trước.
- Một luồng học hoàn chỉnh trước, đồng bộ và AI sau.
- Học ngắn luôn có hoạt động chủ động và lịch ôn; giữ buổi tập trung trong kế hoạch.
- IELTS sáu tháng là mục tiêu có điều chỉnh; AI không cấp điểm chính thức.
- Xem [DECISIONS.md](DECISIONS.md) để biết giả định chưa chốt. Không tự coi lựa chọn cá nhân, loại bài thi, ngân sách AI hoặc cấu hình cloud là đã được xác nhận.

## Kiểm tra của mốc này

- Đã kiểm tra repository sạch trước khi sửa và local đồng bộ `origin/main` sau fetch.
- Đã kiểm tra 8 file Markdown, 13 liên kết nội bộ và 24 task: không có liên kết hỏng/ID trùng, phụ thuộc xuất hiện trước task và APP-001 là task READY duy nhất với phụ thuộc đã DONE.
- Đã đối chiếu trạng thái README/TASKS/STATUS/nhật ký và chạy `git diff --check` thành công; kiểm tra phần staged được thực hiện trước commit.
- Chưa có code để chạy build, test hoặc kiểm tra trình duyệt.
- Kết quả kiểm tra và lưu Git cuối mốc được ghi ở nhật ký/đầu ra bàn giao. Session mới vẫn cần kiểm tra lại Git để biết trạng thái remote hiện tại.

## Điều chưa thực hiện và lưu ý tiếp tục

- Chưa kiểm tra Node/npm hoặc thiết bị iOS/Android; thực hiện khi làm task liên quan.
- Chưa tạo tài khoản/dự án Supabase, cấu hình AI hoặc tên miền.
- Chưa có học liệu chính thức, người kiểm duyệt hoặc tập bài đánh giá AI.
- Chưa có dữ liệu học viên thật trong repository.
- Không cần đọc lại lịch sử chat để bắt đầu APP-001; tài liệu này và TASKS là đầu vào bàn giao.
