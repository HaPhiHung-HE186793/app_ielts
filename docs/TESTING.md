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

- Vitest: 47 ca về chấm đáp án, vòng đời bảy bài, kết quả có gợi ý/thử lại, lịch ôn, ghép phiên, tiếp tục đúng lượt và đọc dữ liệu version 1/2 sang 3. Có kiểm tra đồng hồ qua ngưỡng bất động, gián đoạn callback/đổi giờ hệ thống, nửa đêm, checkpoint cộng dồn, lưu phiên một lần và giữ giờ cũ là chưa biết.
- Playwright: luồng học thực trên bản build; giữ bài dở sau reload, giữ cả lựa chọn/câu đang nhập, ôn đến hạn khi đổi ngày, ghi lịch ôn một lần, cài đặt và bản sao xuất/nhập, dữ liệu lỗi, quota, bộ lọc và URL không tồn tại.
- Tổng 40 ca trình duyệt (20 kịch bản × hai kích thước), gồm mục tiêu/ngày/loại thi chưa quyết định, phiên 2/5/15/buổi đầy đủ, tiếp tục, bản sao và bộ đo/lịch sử tiến bộ. Ca buổi đầy đủ kiểm tra danh sách/ngân sách, không tự coi bảy bài đã hoàn thành.
- `tests/progress.spec.ts`: không cộng thời gian nghỉ, dừng thủ công/cài đặt/rời bài, reload, giữ kết quả khởi động riêng, lịch sử phiên đổi/hoàn tất, và không ghi trở lại sau import/reset. Test đổi tab tắt focus emulation của Playwright qua CDP để dùng sự kiện blur/focus của trình duyệt.
- Chrome headless vẫn có thể báo mọi tab là visible; ca visibility/pagehide/pageshow dùng giá trị/sự kiện được điều khiển rõ trong test để kiểm tra handler. Không xem ca mô phỏng này là xác minh lifecycle native trên iOS/Android hoặc thiết bị bị kill.
- Điều hướng, focus bàn phím, không tràn ngang ở 360px và desktop.
- Axe: quét các trang chính, giới thiệu bài, cài đặt, phiên dài, câu khởi động/phản hồi/kết quả và Tiến bộ có dữ liệu với tập luật WCAG A/AA. Kết quả này chỉ là kiểm tra tự động, không phải chứng nhận khả năng tiếp cận đầy đủ.

Kết quả cuối mỗi mốc nằm trong [STATUS.md](STATUS.md) và [SESSION_LOG.md](SESSION_LOG.md). Không báo test đã đạt chỉ vì file test đã tồn tại.

## Dữ liệu và giới hạn

- Test dùng browser context tách biệt và dữ liệu giả riêng; không dùng hồ sơ học thật của người dùng.
- Ảnh, trace và báo cáo lỗi nằm trong test-results hoặc .local, được gitignore. Không đưa audio hoặc bản sao cá nhân vào Git.
- Chưa kiểm thử Safari/iPhone hoặc Android thật, microphone, dịch vụ AI, tài khoản, đồng bộ cloud, PWA install/offline/notification.
- Giọng SpeechSynthesis tùy thiết bị; không xác minh chất lượng phát âm bằng test trình duyệt.
- Bộ bảy bài được rà soát nội bộ; test không thay đánh giá của giáo viên hay đo hiệu quả sau thời gian học.
