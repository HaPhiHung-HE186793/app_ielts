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

- Vitest: 36 ca về chấm đáp án, vòng đời cả bảy bài, tách đúng độc lập với có gợi ý/thử lại, chống hoàn thành/nộp ôn trùng, giữ lịch cũ, khoảng ôn qua nửa đêm/gián đoạn, ghép phiên hữu hạn, tiếp tục đúng lượt và chuyển dữ liệu version 1 sang 2.
- Playwright: luồng học thực trên bản build; giữ bài dở sau reload, giữ cả lựa chọn/câu đang nhập, ôn đến hạn khi đổi ngày, ghi lịch ôn một lần, cài đặt và bản sao xuất/nhập, dữ liệu lỗi, quota, bộ lọc và URL không tồn tại.
- Tổng 30 ca trình duyệt (15 kịch bản × hai kích thước), gồm mục tiêu/ngày/loại thi chưa quyết định, phiên 2/5/15/buổi đầy đủ, thay phiên có lựa chọn, tiếp tục ôn, nâng kho cũ và nhập bản sao version 1. Ca buổi đầy đủ kiểm tra danh sách/ngân sách, không tự coi bảy bài đã hoàn thành.
- Điều hướng, focus bàn phím, không tràn ngang ở 360px và desktop.
- Axe: quét các trang chính, trang giới thiệu bài, hộp cài đặt, phiên dài, khởi động/câu hỏi/phản hồi/kết quả với tập luật WCAG A/AA. Kết quả này chỉ là kiểm tra tự động, không phải chứng nhận khả năng tiếp cận đầy đủ.

Kết quả cuối mỗi mốc nằm trong [STATUS.md](STATUS.md) và [SESSION_LOG.md](SESSION_LOG.md). Không báo test đã đạt chỉ vì file test đã tồn tại.

## Dữ liệu và giới hạn

- Test dùng browser context tách biệt và dữ liệu giả riêng; không dùng hồ sơ học thật của người dùng.
- Ảnh, trace và báo cáo lỗi nằm trong test-results hoặc .local, được gitignore. Không đưa audio hoặc bản sao cá nhân vào Git.
- Chưa kiểm thử Safari/iPhone hoặc Android thật, microphone, dịch vụ AI, tài khoản, đồng bộ cloud, PWA install/offline/notification.
- Giọng SpeechSynthesis tùy thiết bị; không xác minh chất lượng phát âm bằng test trình duyệt.
- Bộ bảy bài được rà soát nội bộ; test không thay đánh giá của giáo viên hay đo hiệu quả sau thời gian học.
