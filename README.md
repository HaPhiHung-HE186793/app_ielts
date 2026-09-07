# app_ielts

Ứng dụng hỗ trợ người Việt học tiếng Anh từ nền tảng đến luyện thi IELTS, với bài học ngắn, luyện tập chủ động, ôn tập có lịch và gia sư AI. Hướng triển khai ban đầu là web app PWA, dùng trên máy tính, iPhone và Android.

Mục tiêu học tập tham khảo là IELTS 6.5 trong sáu tháng. Đây là mục tiêu cần điều chỉnh theo đầu vào, thời gian học và kết quả đánh giá; không phải cam kết đầu ra của ứng dụng.

## Trạng thái hiện tại

- Có bản học thử tên **Mỗi ngày**, React + TypeScript + Vite, năm khu vực và giao diện cho điện thoại/desktop.
- Bảy bài nền tảng: đọc/nghe câu mẫu, trả lời, nhận giải thích, thử lại và tự viết câu của mình.
- Lưu bài dở, cả câu đang nhập; ôn theo lịch, thống kê thật và xuất/khôi phục bản sao JSON.
- Thiết lập mục tiêu/ngày tùy chọn và tự nhận xét nền tảng; chọn phiên 2/5/15 phút hoặc buổi đầy đủ, tạm dừng và tiếp tục phiên.
- Tiến bộ có thời gian hoạt động đo được, biểu đồ bảy ngày, lịch sử phiên hoàn tất/đã đổi và bộ lọc bài học/ôn/khởi động.
- Hoàn thành mốc 1 local, PWA-001/002, DATA-001/002: đăng nhập, kho riêng, đồng bộ có lựa chọn, chống gửi trùng và xử lý xung đột. Đã kiểm tra hai phiên trình duyệt độc lập trên Supabase Docker local.
- Có gói bảy bài/bảy file nghe tải trước để mở lại và học offline; quản lý dung lượng, thử lại và xóa tải xuống riêng với tiến độ. Task tiếp theo: **NOTIFY-001 — nhắc học tự nguyện**. Chưa có Supabase hosted, AI, thông báo hoặc bản triển khai công khai.
- Trạng thái chi tiết và bước tiếp theo luôn được cập nhật tại [docs/STATUS.md](docs/STATUS.md).

## Bắt đầu hoặc tiếp tục phát triển

Đọc [AGENTS.md](AGENTS.md), sau đó đọc tài liệu theo thứ tự:

1. [Trạng thái bàn giao](docs/STATUS.md): đã làm gì, đang làm gì, còn vướng gì.
2. [Danh sách task](docs/TASKS.md): ưu tiên, phụ thuộc và tiêu chí hoàn thành.
3. [Định hướng sản phẩm](docs/PRODUCT.md): người dùng, trải nghiệm học và phạm vi.
4. [Kiến trúc dự kiến](docs/ARCHITECTURE.md): cấu trúc ứng dụng, dữ liệu, AI và PWA.
5. [Các quyết định](docs/DECISIONS.md): lý do chọn hướng triển khai và các giả định chưa xác nhận.
6. [Nhật ký bàn giao](docs/SESSION_LOG.md): những thay đổi quan trọng qua từng session.

Tài liệu bổ sung: [tài khoản và backend](docs/BACKEND.md), [đồng bộ và xung đột](docs/SYNC.md), [kiểm tra ứng dụng](docs/TESTING.md), [cài lên màn hình chính](docs/INSTALLATION.md), [tải gói offline](docs/OFFLINE.md), [nguồn và rà soát học liệu](docs/CONTENT_REVIEW.md).

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

`test:e2e` tự build, dùng Chrome đã cài và chạy preview riêng ở cổng 4173. Xem [TESTING.md](docs/TESTING.md) để chọn Chromium hoặc xem phạm vi kiểm tra. Bộ kiểm tra có 78 unit test, 68 ca trình duyệt khách và 27 ca Auth/RLS/đồng bộ/offline trên Supabase local. Kết quả thực tế ở STATUS/SESSION_LOG.

Để thử tài khoản, mở Docker rồi chạy:

```sh
npm run db:start
npm run db:migrate
npm run dev:local
```

Dừng dev server cũ của dự án nếu đang chiếm cổng 5173. Mở http://127.0.0.1:5173/#/account, nhập email thử và lấy mã tại [hộp thư thử trên máy](http://127.0.0.1:54324). Không gửi email ra ngoài. `dev:local` tự lấy cấu hình công khai từ CLI, không cần tạo `.env`. `npm run test:auth` kiểm tra backend thật; `npm run db:stop` dừng stack và giữ database. Hướng dẫn cấu hình cloud và các giới hạn ở [BACKEND.md](docs/BACKEND.md).

Để thử cả offline và tài khoản, sau khi backend chạy hãy dùng `npm run preview:local`, mở http://127.0.0.1:4175/#/install rồi chọn **Tải gói để học offline**. Cổng 4175 có kho khác 5173: chuyển tiến độ bằng đồng bộ hoặc JSON. Dev không bật service worker. Xem [OFFLINE.md](docs/OFFLINE.md).

## Dùng thử

1. Mở Hôm nay, chọn **Thiết lập nhịp học** nếu muốn ghi mục tiêu/sở thích/thời gian. Có thể đóng để học ngay.
2. Chọn 2 phút để khởi động một câu, 5 phút để học một bài, 15 phút hoặc buổi đầy đủ để ghép bài và ôn. **Bắt đầu học** ở thẻ đầu vẫn mở bài trực tiếp.
3. Đọc/nghe mẫu, ẩn câu, tự nhớ và xem phản hồi. Bài đầy đủ có ba hoạt động và câu tự viết tùy chọn; khởi động được lưu riêng, không tính là hoàn thành bài.
4. Có thể tạm dừng; Hôm nay có **Tiếp tục phiên đang dở**. Bài dở và câu đang nhập giữ qua reload.
5. Vào Ôn lại hoặc Tiến bộ để nhìn lại kết quả, thời gian hoạt động và các phiên. Lần ôn đầu sau một ngày, hoặc chọn Ôn sớm.
6. Bộ đo tự dừng khi đổi cửa sổ/tab, mở cài đặt, rời bài hoặc không thao tác 60 giây. Có nút tạm dừng đo riêng; xem “Cách tính thời gian” trong Tiến bộ.
7. Trong cài đặt, tải bản sao hoặc khôi phục tiến độ. App đọc bản sao version 1/2/3 và lưu version 3.
8. Chọn **Thêm vào màn hình chính** trong cài đặt/cuối trang, hoặc mở http://127.0.0.1:5173/#/install để xem cách cài. Nút **Cài Mỗi ngày** chỉ hiện khi trình duyệt hỗ trợ; có hướng dẫn Safari/Chrome/Edge khi không có nút.
9. Trong **Tài khoản và đăng nhập**, chọn **Bật đồng bộ phần học này** để gửi tiến độ của tài khoản. Trên trình duyệt khác, đăng nhập cùng tài khoản và bật đồng bộ để tiếp tục. Chờ **Đã đồng bộ** trước khi đổi máy; hai nơi cùng sửa sẽ có lựa chọn bản giữ lại.
10. Phần khách không tự nhập. Có màn hình xem/chọn nhập và tải bản sao, giữ nguyên phần khách gốc. Trong cùng trình duyệt, chỉ một tab sửa tiến độ tài khoản; đóng tab đó để tiếp tục ở tab khác. Xem [SYNC.md](docs/SYNC.md).

Dùng nhất quán `127.0.0.1:5173` để giữ kho local. Khi chưa bật đồng bộ, tiến độ chỉ ở trình duyệt; khi bật, xem trạng thái xác nhận server. Khôi phục JSON hoặc xóa trên thiết bị dừng sync ở đó, không xóa bản server; bật lại có thể tải bản cũ xuống. Trên máy chung, tải bản sao, xóa phần hiện tại rồi đăng xuất vì kho chưa mã hóa. Chỉ giữ một bài đang làm; app hỏi trước khi chuyển bài.

Phút trong kế hoạch là ước tính, tách với thời gian hoạt động được đo. Chỉ có bảy bài: buổi 60 phút ban đầu xếp khoảng 35 phút học liệu; phần còn lại chưa được xếp. Phiên mới lưu lịch sử kế hoạch cũ và giữ bài dở. Những kế hoạch đã bị thay trước bản cập nhật này không thể khôi phục; dữ liệu cũ chưa đo giờ giữ trạng thái chưa có số đo. Chưa có lộ trình sáu tháng cá nhân.

Bộ đo phản ánh tương tác trên app, không khẳng định mức chú ý; đọc/nói yên lặng lâu có thể bị tính thiếu. App lưu mốc mỗi năm giây và khi rời hoạt động; đóng đột ngột có thể mất phần chưa lưu. Không quy đổi thời gian thành band IELTS.

Giọng đọc là bảy WAV tổng hợp eSpeak NG, có thể tải trước; câu tự viết chưa được chấm. Học liệu được biên soạn mới và rà soát nội bộ, chưa có giáo viên độc lập xác nhận. Chưa có đánh giá đầu vào hoặc AI; file nghe chưa được giáo viên kiểm duyệt. Chưa kiểm thử cài/khởi chạy trên iPhone/Safari và Android thật.

Để dùng trên điện thoại cần địa chỉ HTTPS đã triển khai; link localhost trên máy tính chưa đáp ứng điều đó. Sau khi tải đủ gói ở bản build, có thể mở lại đúng địa chỉ khi mất mạng; thêm biểu tượng không tự bật đồng bộ. Xem [hướng dẫn cài và giữ tiến độ](docs/INSTALLATION.md). `npm run icons` tái tạo PNG từ SVG trong repo bằng Chrome/Playwright đã có; không cần chạy lại mỗi lần build.

## Phạm vi khởi đầu

- Ưu tiên một người tự học; chuẩn bị cấu trúc dữ liệu để có thể mở rộng sau.
- Năm khu vực: Hôm nay, Khám phá, Luyện tập, Ôn lại, Tiến bộ.
- Làm một luồng học hoàn chỉnh trước: mở bài → trả lời → nhận phản hồi → lưu tiến độ → ôn lại.
- Xây học liệu nền tảng có kiểm duyệt trước khi mở rộng luyện thi và AI.
- PWA trước; phát hành qua App Store/Google Play là giai đoạn sau.

## Lưu tiến độ

Cuối mỗi mốc công việc, cập nhật task, trạng thái và nhật ký. Ghi rõ các kiểm tra thực sự đã chạy, phần chưa làm và task tiếp theo. Tài liệu cần thiết để tiếp tục dự án phải nằm trong Git, không chỉ nằm trong lịch sử chat.
