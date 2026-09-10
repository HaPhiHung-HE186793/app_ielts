# app_ielts

Ứng dụng hỗ trợ người Việt học tiếng Anh từ nền tảng đến luyện thi IELTS, với bài học ngắn, luyện tập chủ động, ôn tập có lịch và gia sư AI. Hướng triển khai ban đầu là web app PWA, dùng trên máy tính, iPhone và Android.

Mục tiêu học tập tham khảo là IELTS 6.5 trong sáu tháng. Đây là mục tiêu cần điều chỉnh theo đầu vào, thời gian học và kết quả đánh giá; không phải cam kết đầu ra của ứng dụng.

## Trạng thái hiện tại

- Có bản học thử tên **Mỗi ngày**, React + TypeScript + Vite, năm khu vực và giao diện cho điện thoại/desktop.
- Bộ bốn tuần thử nghiệm: **28 bài + 4 bài kiểm tra**, chọn tuần/chủ đề trong Khám phá; đọc ngắn, nghe tình huống, tự nói và viết có tiêu chí tự xem lại. Bảy bài cũ giữ nguyên câu hỏi/đáp án.
- Lưu bài dở, cả câu đang nhập; ôn theo lịch, thống kê thật và xuất/khôi phục bản sao JSON.
- Thiết lập mục tiêu/ngày tùy chọn và tự nhận xét nền tảng; chọn phiên 2/5/15 phút hoặc buổi đầy đủ, tạm dừng và tiếp tục phiên.
- Tiến bộ có thời gian hoạt động đo được, biểu đồ bảy ngày, lịch sử phiên hoàn tất/đã đổi và bộ lọc bài học/ôn/khởi động.
- Hoàn thành mốc 1 local, PWA-001/002, DATA-001/002: đăng nhập, kho riêng, đồng bộ có lựa chọn, chống gửi trùng và xử lý xung đột. Đã kiểm tra hai phiên trình duyệt độc lập trên Supabase Docker local.
- Có gói **57 file nghe + JSON học liệu**, khoảng **8,92 MB**, tải trước để mở lại và học offline; quản lý dung lượng, thử lại và xóa tải xuống riêng với tiến độ.
- NOTIFY-001: nhắc học tự nguyện theo thiết bị, múi giờ/ngày/giờ yên lặng, dời và tắt; Web Push thật đã nhận trong Chrome thử nghiệm khi đóng các trang app. Chưa xác minh điện thoại thật hoặc màn hình OS.
- **AI-001 đang thực hiện**: API có xác thực/hạn mức/chống gọi lặp và gợi ý tùy chọn ở câu tự viết cuối bài. AI thật mặc định tắt, chưa có khóa/ngân sách và kết quả đối chiếu; chưa đóng task. Chưa có backend hosted hoặc triển khai công khai.
- Hôm nay có nhịp **bình thường/mệt/khó quá/quay lại sau nghỉ**, chọn bài theo kiến thức cần trước, kết quả còn cần hỗ trợ và sở thích. Có lý do từng bài; nhịp nhẹ giới hạn bài ôn, giữ bài dở và đồng bộ lựa chọn của phiên. Xem [cách chọn phiên](docs/ADAPTATION.md).
- **Hướng deploy đã đổi thành Vercel + Render + Neon ngày 2026-09-10.** Người dùng đã tạo Neon (`production`/`neondb`, Singapore, pooling bật theo ảnh), chưa tạo Render/Vercel. Có [hướng dẫn chuẩn bị hosting và kế hoạch chuyển đổi](docs/DEPLOY_VERCEL_RENDER_NEON.md). Code/build hiện vẫn phụ thuộc Supabase; **DATA-003 là task tiếp theo** để chuyển Auth/DB/API, rồi hoàn tất DEPLOY-002 trên host thật. Chưa kiểm tra kết nối Neon từ app hoặc có URL public. Bản khách độc lập DEPLOY-001 vẫn dùng được.
- Trạng thái chi tiết và bước tiếp theo luôn được cập nhật tại [docs/STATUS.md](docs/STATUS.md).

## Bắt đầu hoặc tiếp tục phát triển

Đọc [AGENTS.md](AGENTS.md), sau đó đọc tài liệu theo thứ tự:

1. [Trạng thái bàn giao](docs/STATUS.md): đã làm gì, đang làm gì, còn vướng gì.
2. [Danh sách task](docs/TASKS.md): ưu tiên, phụ thuộc và tiêu chí hoàn thành.
3. [Định hướng sản phẩm](docs/PRODUCT.md): người dùng, trải nghiệm học và phạm vi.
4. [Kiến trúc dự kiến](docs/ARCHITECTURE.md): cấu trúc ứng dụng, dữ liệu, AI và PWA.
5. [Các quyết định](docs/DECISIONS.md): lý do chọn hướng triển khai và các giả định chưa xác nhận.
6. [Nhật ký bàn giao](docs/SESSION_LOG.md): những thay đổi quan trọng qua từng session.

Tài liệu bổ sung: [tài khoản và backend](docs/BACKEND.md), [đồng bộ và xung đột](docs/SYNC.md), [kiểm tra ứng dụng](docs/TESTING.md), [cài lên màn hình chính](docs/INSTALLATION.md), [tải gói offline](docs/OFFLINE.md), [nhắc học](docs/NOTIFICATIONS.md), [gia sư AI](docs/AI.md), [đối chiếu AI](docs/AI_EVALUATION.md), [chương trình bốn tuần](docs/CURRICULUM.md), [nguồn và rà soát học liệu](docs/CONTENT_REVIEW.md).

Trước khi sửa, kiểm tra `git status --short --branch` và `git log -5 --oneline`. Đối chiếu tài liệu với code thực tế; không coi tính năng trong kế hoạch là tính năng đã tồn tại.

## Cách chạy

Yêu cầu Node 22.13+ thuộc nhánh 22; đã dùng Node 22.18.0 và npm 10.9.3. Phiên bản dependency được lưu trong `package-lock.json`.

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

`test:e2e` tự build, dùng Chrome đã cài và chạy preview riêng ở cổng 4173. Xem [TESTING.md](docs/TESTING.md) để chọn Chromium hoặc xem phạm vi kiểm tra. Bộ kiểm tra có 144 unit test, 80 ca trình duyệt khách và 50 ca Auth/RLS/đồng bộ/offline/nhắc học/API AI trên Supabase local; `test:release` chọn 38 ca để kiểm tra artifact phát hành. Provider AI trong test là fixture có nhãn. Kết quả thực tế ở STATUS/SESSION_LOG.

Để tạo bản khách sẵn sàng tải lên hosting:

```sh
npm run release:build
npm run release:verify
npm run release:preview
```

Mở http://127.0.0.1:4176/#/today. Artifact trong `.local/releases`, chỉ tải thư mục `site/` lên hosting. Build này không kế thừa `.env`/cấu hình local; mặc định không tài khoản và AI tắt. Lệnh không tự public web. Cấu hình tài khoản, Pages, HTTPS/404/cache, giữ tiến độ và rollback ở [DEPLOYMENT.md](docs/DEPLOYMENT.md).

Để thử tài khoản, mở Docker rồi chạy:

```sh
npm run db:start
npm run db:migrate
npm run dev:local
```

Dừng dev server cũ của dự án nếu đang chiếm cổng 5173. Mở http://127.0.0.1:5173/#/account, nhập email thử và lấy mã tại [hộp thư thử trên máy](http://127.0.0.1:54324). Không gửi email ra ngoài. `dev:local` tự lấy cấu hình công khai từ CLI, không cần tạo `.env`. `npm run test:auth` kiểm tra backend thật; `npm run db:stop` dừng stack và giữ database. Hướng dẫn cấu hình cloud và các giới hạn ở [BACKEND.md](docs/BACKEND.md).

Để thử cả offline và tài khoản, sau khi backend chạy hãy dùng `npm run preview:local`, mở http://127.0.0.1:4175/#/install rồi chọn **Tải gói để học offline**. Cổng 4175 có kho khác 5173: chuyển tiến độ bằng đồng bộ hoặc JSON. Dev không bật service worker. Xem [OFFLINE.md](docs/OFFLINE.md).

Để thử nhắc học, giữ preview 4175 và chạy `npm run reminders:local` ở terminal khác. Mở http://127.0.0.1:4175/#/reminders, đăng nhập, tải lại trạng thái, chọn lịch và bật quyền. Máy gửi/Docker cần tiếp tục chạy; chưa có máy gửi hosted. Hướng dẫn, khóa local và lệnh kiểm tra push thật `npm run reminders:verify` ở [NOTIFICATIONS.md](docs/NOTIFICATIONS.md).

## Dùng thử

Để kiểm tra phần AI, giữ backend/preview và chạy thêm `npm run ai:local`. Máy chủ mặc định không gọi AI thật; thông báo trong câu tự viết cuối bài cho biết trạng thái. `npm run ai:evaluate` kiểm tra 10 mẫu không tốn phí. Cách cấu hình khóa **chỉ ở máy chủ**, ngân sách và thử thật nằm trong [AI.md](docs/AI.md) / [AI_EVALUATION.md](docs/AI_EVALUATION.md).

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

Phút trong kế hoạch là ước tính, tách với thời gian hoạt động được đo. Mỗi phiên tối đa 10 hoạt động; buổi 60 phút khi bắt đầu xếp khoảng 50 phút, phần còn lại được ghi là chưa xếp. Tự nói/viết kỹ có thể lâu hơn. Phiên mới lưu lịch sử kế hoạch cũ và giữ bài dở; dữ liệu cũ chưa đo giờ giữ trạng thái chưa có số đo. Khung bốn tuần không phải lộ trình sáu tháng cá nhân; xem [CURRICULUM.md](docs/CURRICULUM.md).

Bộ đo phản ánh tương tác trên app, không khẳng định mức chú ý; đọc/nói yên lặng lâu có thể bị tính thiếu. App lưu mốc mỗi năm giây và khi rời hoạt động; đóng đột ngột có thể mất phần chưa lưu. Không quy đổi thời gian thành band IELTS.

Giọng đọc là WAV tổng hợp eSpeak NG, có thể tải trước; câu tự viết không được chấm điểm, gợi ý AI là tùy chọn khi máy chủ đã bật. Học liệu được biên soạn mới và rà soát nội bộ, chưa có giáo viên độc lập xác nhận. Chưa có đánh giá đầu vào hoặc kiểm chứng chất lượng AI thật; file nghe chưa được giáo viên kiểm duyệt. Chưa kiểm thử cài/khởi chạy trên iPhone/Safari và Android thật.

Để dùng trên điện thoại cần địa chỉ HTTPS đã triển khai; link localhost trên máy tính chưa đáp ứng điều đó. Sau khi tải đủ gói ở bản build, có thể mở lại đúng địa chỉ khi mất mạng; thêm biểu tượng không tự bật đồng bộ. Xem [hướng dẫn cài và giữ tiến độ](docs/INSTALLATION.md). `npm run icons` tái tạo PNG từ SVG trong repo bằng Chrome/Playwright đã có; không cần chạy lại mỗi lần build.

## Phạm vi khởi đầu

- Ưu tiên một người tự học; chuẩn bị cấu trúc dữ liệu để có thể mở rộng sau.
- Năm khu vực: Hôm nay, Khám phá, Luyện tập, Ôn lại, Tiến bộ.
- Làm một luồng học hoàn chỉnh trước: mở bài → trả lời → nhận phản hồi → lưu tiến độ → ôn lại.
- Xây học liệu nền tảng có kiểm duyệt trước khi mở rộng luyện thi và AI.
- PWA trước; phát hành qua App Store/Google Play là giai đoạn sau.

## Lưu tiến độ

Cuối mỗi mốc công việc, cập nhật task, trạng thái và nhật ký. Ghi rõ các kiểm tra thực sự đã chạy, phần chưa làm và task tiếp theo. Tài liệu cần thiết để tiếp tục dự án phải nằm trong Git, không chỉ nằm trong lịch sử chat.
