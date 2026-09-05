# app_ielts

Ứng dụng hỗ trợ người Việt học tiếng Anh từ nền tảng đến luyện thi IELTS, với bài học ngắn, luyện tập chủ động, ôn tập có lịch và gia sư AI. Hướng triển khai ban đầu là web app PWA, dùng trên máy tính, iPhone và Android.

Mục tiêu học tập tham khảo là IELTS 6.5 trong sáu tháng. Đây là mục tiêu cần điều chỉnh theo đầu vào, thời gian học và kết quả đánh giá; không phải cam kết đầu ra của ứng dụng.

## Trạng thái hiện tại

- Đã lập tài liệu sản phẩm, kiến trúc dự kiến, danh sách task và quy trình bàn giao session.
- Chưa có mã nguồn ứng dụng, cấu hình build, cơ sở dữ liệu hoặc bản triển khai.
- Task triển khai tiếp theo: **APP-001 — Khởi tạo ứng dụng React + TypeScript + Vite**.
- Trạng thái chi tiết và bước tiếp theo luôn được cập nhật tại [docs/STATUS.md](docs/STATUS.md).

## Bắt đầu hoặc tiếp tục phát triển

Đọc [AGENTS.md](AGENTS.md), sau đó đọc tài liệu theo thứ tự:

1. [Trạng thái bàn giao](docs/STATUS.md): đã làm gì, đang làm gì, còn vướng gì.
2. [Danh sách task](docs/TASKS.md): ưu tiên, phụ thuộc và tiêu chí hoàn thành.
3. [Định hướng sản phẩm](docs/PRODUCT.md): người dùng, trải nghiệm học và phạm vi.
4. [Kiến trúc dự kiến](docs/ARCHITECTURE.md): cấu trúc ứng dụng, dữ liệu, AI và PWA.
5. [Các quyết định](docs/DECISIONS.md): lý do chọn hướng triển khai và các giả định chưa xác nhận.
6. [Nhật ký bàn giao](docs/SESSION_LOG.md): những thay đổi quan trọng qua từng session.

Trước khi sửa, kiểm tra `git status --short --branch` và `git log -5 --oneline`. Đối chiếu tài liệu với code thực tế; không coi tính năng trong kế hoạch là tính năng đã tồn tại.

## Cách chạy

Chưa có ứng dụng để chạy. Task APP-001 sẽ bổ sung `package.json`, lockfile, mã nguồn và hướng dẫn cài đặt/chạy/build đã được kiểm tra. Không có lệnh `npm run dev` khả dụng ở thời điểm này.

## Phạm vi khởi đầu

- Ưu tiên một người tự học; chuẩn bị cấu trúc dữ liệu để có thể mở rộng sau.
- Năm khu vực: Hôm nay, Khám phá, Luyện tập, Ôn lại, Tiến bộ.
- Làm một luồng học hoàn chỉnh trước: mở bài → trả lời → nhận phản hồi → lưu tiến độ → ôn lại.
- Xây học liệu nền tảng có kiểm duyệt trước khi mở rộng luyện thi và AI.
- PWA trước; phát hành qua App Store/Google Play là giai đoạn sau.

## Lưu tiến độ

Cuối mỗi mốc công việc, cập nhật task, trạng thái và nhật ký. Ghi rõ các kiểm tra thực sự đã chạy, phần chưa làm và task tiếp theo. Tài liệu cần thiết để tiếp tục dự án phải nằm trong Git, không chỉ nằm trong lịch sử chat.
