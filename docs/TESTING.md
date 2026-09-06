# Chạy và kiểm tra ứng dụng

## Môi trường

Đã dùng Node 22.18.0, npm 10.9.3 trên Windows. `package.json` khai báo Node 22.13+ thuộc nhánh 22, Node 24 hoặc Node 26+ để phù hợp cả build và bộ kiểm tra. Dùng `npm ci` để cài từ lockfile. Trên PowerShell có thể dùng `npm.cmd` thay `npm`.

```sh
npm ci
npm run dev
```

Mở http://127.0.0.1:5173. Cổng cố định; nếu đang được dùng, kiểm tra tiến trình thay vì tự dừng ứng dụng khác. Dữ liệu của localhost và 127.0.0.1 nằm ở hai origin khác nhau; dùng cùng địa chỉ khi muốn tiếp tục tiến độ local.

## Các lệnh kiểm tra

```sh
npm run lint
npm run typecheck
npm test
npm run test:e2e
```

`test:e2e` tự build rồi dùng Vite preview tại cổng 4173, tách với dev server 5173. Playwright mặc định dùng Google Chrome đã cài trên máy; hai cấu hình là desktop 1440×1000 và màn hình điện thoại 360×800. Nếu dùng Chromium do Playwright quản lý, cài bằng `npx playwright install chromium` rồi đặt `PLAYWRIGHT_CHANNEL=chromium` cho lệnh test (trong PowerShell: `$env:PLAYWRIGHT_CHANNEL = 'chromium'`).

`npm run format` định dạng source, tests và cấu hình bằng Prettier. `npm run build` tạo dist; `npm run preview` chỉ xem build local.

## Phạm vi

- Vitest: 76 ca về chấm đáp án, vòng đời bảy bài, lịch ôn, ghép phiên, thời gian và tương thích version 1/2/3. Có kiểm tra kho theo chủ, quota, dữ liệu lỗi và cấu hình công khai. DATA-002 thêm 8 ca gộp ba phía/lượt trùng/lịch ôn/checkpoint/xung đột và 9 ca engine: bật tự nguyện, outbox qua reload, mất phản hồi, thay đổi trong lúc gửi, offline, quota, đổi chủ, reset/import và hoãn khi mở cài đặt.
- Playwright: luồng học thực trên bản build; giữ bài dở sau reload, giữ cả lựa chọn/câu đang nhập, ôn đến hạn khi đổi ngày, ghi lịch ôn một lần, cài đặt và bản sao xuất/nhập, dữ liệu lỗi, quota, bộ lọc và URL không tồn tại.
- Tổng 58 ca trình duyệt chế độ khách (29 kịch bản × hai kích thước), gồm mục tiêu/ngày/loại thi chưa quyết định, phiên 2/5/15/buổi đầy đủ, tiếp tục, bản sao, bộ đo/lịch sử tiến bộ và PWA. Có trang tài khoản chưa cấu hình, đường tiếp tục học/focus/axe. Ca buổi đầy đủ kiểm tra danh sách/ngân sách, không tự coi bảy bài đã hoàn thành.
- `tests/progress.spec.ts`: không cộng thời gian nghỉ, dừng thủ công/cài đặt/rời bài, reload, giữ kết quả khởi động riêng, lịch sử phiên đổi/hoàn tất, và không ghi trở lại sau import/reset. Test đổi tab tắt focus emulation của Playwright qua CDP để dùng sự kiện blur/focus của trình duyệt.
- Chrome headless vẫn có thể báo mọi tab là visible; ca visibility/pagehide/pageshow dùng giá trị/sự kiện được điều khiển rõ trong test để kiểm tra handler. Không xem ca mô phỏng này là xác minh lifecycle native trên iOS/Android hoặc thiết bị bị kill.
- Điều hướng, focus bàn phím, không tràn ngang ở 360px và desktop.
- `tests/install.spec.ts`: đọc manifest/giải mã bốn PNG và `Page.getInstallabilityErrors` bằng hồ sơ Chrome tạm riêng (context ẩn danh mặc định bị Chrome chặn cài). Không bấm cài lên hệ điều hành hoặc dùng profile cá nhân. Kiểm tra start URL mở lại phiên/câu/gợi ý trong cùng kho, điều hướng từ cài đặt và axe cả ba hướng dẫn.
- Luồng deferred prompt/từ chối/lỗi/chấp nhận/appinstalled và hai tín hiệu standalone được điều khiển rõ trong test; xác minh handler và phản hồi, không phải cài thật. Không kết luận standalone chỉ từ `userChoice: accepted` hoặc `appinstalled`.
- Đã thử riêng safe-area qua CDP ở 390×844 với top 47/bottom 34, và 844×390 với left/right 47/bottom 21. Không tràn ngang hoặc lỗi runtime; bản ngang thấp dùng thanh điều hướng dưới để cả năm mục vẫn tới được. Đây là mô phỏng CSS insets, chưa phải Safari/thiết bị thật.
- Axe: quét các trang chính, giới thiệu bài, cài đặt, phiên dài, câu khởi động/phản hồi/kết quả và Tiến bộ có dữ liệu với tập luật WCAG A/AA. Kết quả này chỉ là kiểm tra tự động, không phải chứng nhận khả năng tiếp cận đầy đủ.

Kết quả cuối mỗi mốc nằm trong [STATUS.md](STATUS.md) và [SESSION_LOG.md](SESSION_LOG.md). Không báo test đã đạt chỉ vì file test đã tồn tại.

## Auth và quyền dữ liệu trên backend thật

```sh
npm run db:start
npm run db:migrate
npm run test:auth
```

Cần Docker và Supabase local của repo đang chạy; xem [BACKEND.md](BACKEND.md). Runner tự build vào `.local/auth-dist` chỉ với cấu hình công khai, mở preview 4174 và dùng `playwright.auth.config.ts`. Chạy tuần tự một worker, tách khỏi 58 ca khách; không cần `.env`. Khi chạy bộ khách, để hai biến Supabase trống vì ca chưa cấu hình kiểm tra chính trạng thái này.

- 23 ca: ba ca API và mười kịch bản UI ở mỗi kích thước 1440×1000/360×800. Dùng Auth/PostgreSQL thật và thư từ Mailpit, không thay phản hồi đăng nhập thành công bằng mock.
- `tests/auth/rls.spec.ts`: hai người dùng thực có phiên riêng; đọc/tạo/sửa/xóa của mình, chặn đọc/ghi/đổi chủ/xóa của người khác, chặn chưa đăng nhập và sửa thời điểm tạo, giới hạn tên. Xóa hàng của mình được kiểm tra ở API; app chưa có giao diện xóa tài khoản.
- `tests/auth/account.spec.ts`: đăng ký bằng OTP, mã sai, lưu tên và khôi phục phiên sau reload; tách kho khách/A/B qua hai tab; tiến độ của A được giữ và bộ đo không tạo dữ liệu cho B; import đang đọc file không vượt qua lần đăng xuất.
- `tests/auth/sync-api.spec.ts`: quyền đọc theo chủ/chặn chưa đăng nhập, RPC khác chủ và ghi bảng trực tiếp, payload sai, hai commit đồng thời chỉ một được ghi, retry song song không tăng revision, không tái dùng UUID cho payload khác, receipt cũ không làm lùi snapshot. Kiểm tra nhật ký chỉ ghi trường đã đổi và hash payload.
- `tests/auth/sync.spec.ts`: hai context độc lập cùng tài khoản nhận bài/lịch ôn/phiên/câu đang nhập; thiết bị thứ hai có phiên OTP riêng. Một phần dữ liệu lịch sử ban đầu là fixture đã định nghĩa, thao tác tiếp tục/nhập câu thực hiện qua UI.
- Mô phỏng offline bằng context Playwright khi app đã mở; khôi phục mạng và reload giữ outbox. Giữ phản hồi sau khi server thật đã chấp nhận rồi trả 503 để kiểm tra gửi lại đúng UUID. Trường hợp khác giữ response đến sau logout/đăng nhập B, xác minh không ghi vào B. Không coi đây là kiểm thử sóng mạng/OS native.
- Xung đột câu đang nhập hiển thị cả hai phía, giữ qua reload và có lựa chọn; nhập phần khách không tự gửi trước chọn và giữ nguồn. Tab thứ hai chờ Web Lock và tiếp tục khi tab giữ khóa đóng.
- Kịch bản lỗi inject HTTP 503 cho tải/lưu tên, gửi mã và logout; kiểm tra giữ nội dung, thử lại với server thật và trạng thái local khi không có xác nhận logout máy chủ. Đây là kiểm tra xử lý lỗi có điều khiển, chưa phải đo độ ổn định mạng/SMTP production.
- Một số kịch bản chuẩn bị bằng phiên thật được cấp qua đăng nhập mật khẩu của tài khoản thử, rồi nạp vào storage để đi thẳng vào phần cần kiểm tra. Ca đăng ký/đăng nhập OTP được kiểm tra riêng qua UI và email thật ở Mailpit. Không kết luận email đã tới hộp thư bên ngoài.
- Quét axe A/AA ở form mã, tài khoản, đồng bộ thành công và xung đột; kiểm tra tràn ngang ở màn hình đã đồng bộ và xem ảnh desktop/mobile. Trace Auth tắt để không ghi response chứa token; ảnh chỉ dùng dữ liệu thử và nằm trong `.local`.
- Helper chỉ chấp nhận backend/hộp thư loopback đúng cổng repo, tạo email ngẫu nhiên `moi-ngay-<uuid>@example.test`, dùng secret key local trong Node để dựng/dọn đúng tài khoản đó. Không truyền key này cho Vite hoặc đưa vào Git. Không chạy suite lên cloud.
- Chưa kiểm tra SMTP bên ngoài, hosted, mã hết hạn qua thời gian dài, chính sách chống abuse production, thu hồi JWT trước expiry, dữ liệu nhiều tháng hoặc Safari/điện thoại thật. Sync kiểm tra bằng hai browser context, chưa có PWA offline để kiểm tra mở mới khi mất mạng.

## Dữ liệu và giới hạn

- Test dùng browser context tách biệt và dữ liệu giả riêng; không dùng hồ sơ học thật của người dùng.
- Ảnh, trace và báo cáo lỗi nằm trong test-results hoặc .local, được gitignore. Không đưa audio hoặc bản sao cá nhân vào Git.
- Chưa kiểm thử Safari/iPhone hoặc Android thật, cài/khởi chạy từ biểu tượng hệ điều hành, microphone, AI, tài khoản trên cloud hosted, PWA offline/notification. Auth/RLS local đã kiểm tra riêng ở trên. Quy trình kiểm tra thiết bị nằm trong [INSTALLATION.md](INSTALLATION.md).
- Giọng SpeechSynthesis tùy thiết bị; không xác minh chất lượng phát âm bằng test trình duyệt.
- Bộ bảy bài được rà soát nội bộ; test không thay đánh giá của giáo viên hay đo hiệu quả sau thời gian học.
