# app_ielts

Ứng dụng hỗ trợ người Việt học tiếng Anh từ nền tảng đến luyện thi IELTS, với bài học ngắn, luyện tập chủ động, ôn tập có lịch và gia sư AI. Hướng triển khai ban đầu là web app PWA, dùng trên máy tính, iPhone và Android.

Mục tiêu học tập tham khảo là IELTS 6.5 trong sáu tháng. Đây là mục tiêu cần điều chỉnh theo đầu vào, thời gian học và kết quả đánh giá; không phải cam kết đầu ra của ứng dụng.

## Trạng thái hiện tại

- Có bản học thử tên **Mỗi ngày**, React + TypeScript + Vite, năm khu vực và giao diện cho điện thoại/desktop.
- Bảy bài nền tảng: đọc/nghe câu mẫu, trả lời, nhận giải thích, thử lại và tự viết câu của mình.
- Lưu bài dở, cả câu đang nhập; ôn theo lịch, thống kê thật và xuất/khôi phục bản sao JSON.
- Thiết lập mục tiêu/ngày tùy chọn và tự nhận xét nền tảng; chọn phiên 2/5/15 phút hoặc buổi đầy đủ, tạm dừng và tiếp tục phiên.
- Hoàn thành APP-001, APP-002, CONTENT-001, LEARN-001, LEARN-002, REVIEW-001 và PLAN-001. Task tiếp theo: **PROGRESS-001 — Lịch sử phiên và phút học chủ động**.
- Chưa có backend, AI, PWA offline hoặc bản triển khai công khai.
- Trạng thái chi tiết và bước tiếp theo luôn được cập nhật tại [docs/STATUS.md](docs/STATUS.md).

## Bắt đầu hoặc tiếp tục phát triển

Đọc [AGENTS.md](AGENTS.md), sau đó đọc tài liệu theo thứ tự:

1. [Trạng thái bàn giao](docs/STATUS.md): đã làm gì, đang làm gì, còn vướng gì.
2. [Danh sách task](docs/TASKS.md): ưu tiên, phụ thuộc và tiêu chí hoàn thành.
3. [Định hướng sản phẩm](docs/PRODUCT.md): người dùng, trải nghiệm học và phạm vi.
4. [Kiến trúc dự kiến](docs/ARCHITECTURE.md): cấu trúc ứng dụng, dữ liệu, AI và PWA.
5. [Các quyết định](docs/DECISIONS.md): lý do chọn hướng triển khai và các giả định chưa xác nhận.
6. [Nhật ký bàn giao](docs/SESSION_LOG.md): những thay đổi quan trọng qua từng session.

Tài liệu bổ sung: [kiểm tra ứng dụng](docs/TESTING.md), [nguồn và rà soát học liệu](docs/CONTENT_REVIEW.md).

Trước khi sửa, kiểm tra `git status --short --branch` và `git log -5 --oneline`. Đối chiếu tài liệu với code thực tế; không coi tính năng trong kế hoạch là tính năng đã tồn tại.

## Cách chạy

Yêu cầu Node 22.13+ thuộc nhánh 22, Node 24 hoặc Node 26+; đã dùng Node 22.18.0 và npm 10.9.3. Phiên bản dependency được lưu trong `package-lock.json`.

```sh
npm ci
npm run dev
```

Mở http://127.0.0.1:5173. Trên Windows PowerShell, dùng `npm.cmd` nếu execution policy chặn `npm.ps1`.

```sh
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
npm run preview
```

`build` tạo `dist/`; `preview` dùng để kiểm tra bản build local, không phải máy chủ production.

`test:e2e` tự build, dùng Chrome đã cài và chạy preview riêng ở cổng 4173. Xem [TESTING.md](docs/TESTING.md) để chọn Chromium hoặc xem phạm vi kiểm tra. Đã đạt 36 unit test và 30 ca kiểm tra trình duyệt ở 1440px/360px, bao gồm quét axe A/AA tự động. Chi tiết lượt chạy và sửa test ở STATUS/SESSION_LOG.

## Dùng thử

1. Mở Hôm nay, chọn **Thiết lập nhịp học** nếu muốn ghi mục tiêu/sở thích/thời gian. Có thể đóng để học ngay.
2. Chọn 2 phút để khởi động một câu, 5 phút để học một bài, 15 phút hoặc buổi đầy đủ để ghép bài và ôn. **Bắt đầu học** ở thẻ đầu vẫn mở bài trực tiếp.
3. Đọc/nghe mẫu, ẩn câu, tự nhớ và xem phản hồi. Bài đầy đủ có ba hoạt động và câu tự viết tùy chọn; khởi động được lưu riêng, không tính là hoàn thành bài.
4. Có thể tạm dừng; Hôm nay có **Tiếp tục phiên đang dở**. Bài dở và câu đang nhập giữ qua reload.
5. Vào Ôn lại hoặc Tiến bộ để nhìn lại kết quả; lần ôn đầu sau một ngày, hoặc chọn Ôn sớm.
6. Trong cài đặt, tải bản sao hoặc khôi phục tiến độ. App đọc bản sao version 1 và 2.

Tiến độ lưu riêng theo trình duyệt và địa chỉ mở app; dùng nhất quán `127.0.0.1:5173`. Khi cần đổi máy hoặc xóa dữ liệu trình duyệt, tải bản sao trước. Chưa có đồng bộ cloud. Chỉ giữ một bài đang làm; app sẽ hỏi trước khi chuyển sang bài khác.

Thời lượng phiên là ước tính, chưa đo phút hoạt động. Chỉ có bảy bài: buổi 60 phút ban đầu xếp khoảng 35 phút học liệu; phần còn lại chưa được xếp. Phiên mới thay kế hoạch hiện tại nhưng giữ kết quả và bài dở. Chưa có lịch sử mọi kế hoạch hoặc lộ trình sáu tháng cá nhân.

Giọng đọc là SpeechSynthesis tùy thiết bị; câu tự viết chưa được chấm. Học liệu được biên soạn mới và rà soát nội bộ, chưa có giáo viên độc lập xác nhận. Chưa có đánh giá đầu vào, AI hoặc PWA cài đặt/offline. Chưa kiểm thử iPhone/Safari và Android thật.

## Phạm vi khởi đầu

- Ưu tiên một người tự học; chuẩn bị cấu trúc dữ liệu để có thể mở rộng sau.
- Năm khu vực: Hôm nay, Khám phá, Luyện tập, Ôn lại, Tiến bộ.
- Làm một luồng học hoàn chỉnh trước: mở bài → trả lời → nhận phản hồi → lưu tiến độ → ôn lại.
- Xây học liệu nền tảng có kiểm duyệt trước khi mở rộng luyện thi và AI.
- PWA trước; phát hành qua App Store/Google Play là giai đoạn sau.

## Lưu tiến độ

Cuối mỗi mốc công việc, cập nhật task, trạng thái và nhật ký. Ghi rõ các kiểm tra thực sự đã chạy, phần chưa làm và task tiếp theo. Tài liệu cần thiết để tiếp tục dự án phải nằm trong Git, không chỉ nằm trong lịch sử chat.
