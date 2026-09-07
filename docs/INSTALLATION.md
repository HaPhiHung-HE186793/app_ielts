# Mở Mỗi ngày từ màn hình chính

Cập nhật: 2026-09-07. PWA-001 thêm cấu hình cài từ web và hướng dẫn; PWA-002 bổ sung gói offline ở bản build; NOTIFY-001 thêm [nhắc học tự nguyện](NOTIFICATIONS.md) với bộ gửi local. Chưa có bản HTTPS công khai hoặc phát hành qua cửa hàng. Kết quả kiểm tra thực tế ở [TESTING.md](TESTING.md) và [STATUS.md](STATUS.md).

## Mở hướng dẫn trong app

Chọn **Thêm vào màn hình chính** trong cài đặt hoặc cuối trang. Khi chạy dev trên máy, có thể mở http://127.0.0.1:5173/#/install.

Nếu trình duyệt gửi sự kiện hỗ trợ cài, trang hiện **Cài Mỗi ngày**. Nhấn nút mới mở hộp cài của trình duyệt; hủy hoặc lỗi thì vẫn học trên web và xem hướng dẫn thủ công được. App không tự hỏi quyền thông báo.

## Trên điện thoại và máy tính

| Thiết bị | Thao tác tham khảo |
| --- | --- |
| iPhone/iPad | Mở bằng Safari → Chia sẻ → Thêm vào Màn hình chính. Bật Open as Web App nếu có rồi chọn Thêm. Nếu thiếu mục thêm, tìm trong Sửa tác vụ. |
| Android | Mở bằng Chrome → menu ba chấm → Cài đặt và tạo lối tắt → Cài đặt. Tên mục có thể là Cài đặt ứng dụng hoặc Thêm vào màn hình chính ở phiên bản khác. |
| Chrome máy tính | Biểu tượng cài trên thanh địa chỉ, hoặc menu → Truyền, lưu và chia sẻ → Cài đặt trang dưới dạng ứng dụng. |
| Edge máy tính | Biểu tượng cài hoặc tìm Ứng dụng trong menu, có thể nằm trong Công cụ khác → cài trang làm ứng dụng. |

Nếu đang mở trong Zalo/Facebook hoặc trình duyệt nhúng, dùng Safari/Chrome bên ngoài. Nếu không có mục cài, đánh dấu trang để quay lại. Hướng dẫn có thể khác theo phiên bản; được đối chiếu với [Apple iPhone](https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios), [Apple iPad](https://support.apple.com/guide/ipad/open-as-web-app-ipad8f1f7a29/ipados), [Google Android](https://support.google.com/chrome/answer/9658361?co=GENIE.Platform%3DAndroid&hl=en), [Google máy tính](https://support.google.com/chrome/answer/9658361?co=genie.platform%3DDesktop&hl=en) và [Microsoft Edge](https://support.microsoft.com/en-us/edge/install-manage-or-uninstall-apps-in-microsoft-edge).

## Địa chỉ và tiến độ

- Cần một địa chỉ HTTPS đã triển khai, truy cập được trên điện thoại để dùng ngoài máy phát triển. `127.0.0.1`/`localhost` luôn trỏ về thiết bị đang mở; link local máy tính không đưa app sang điện thoại. Chạy Vite qua IP LAN bằng HTTP không tương đương bản PWA trên HTTPS.
- Lần đầu và lúc tải gói cần server local chạy; sau khi tải đủ bản build, có thể mở lại offline cùng origin khi cache còn đủ. Dev không hỗ trợ mở lại offline. `npm run dev` và `npm run preview` không phải hosting production. Chưa có URL công khai để gửi người học.
- Tải bản sao JSON trong cài đặt trước khi đổi origin, trình duyệt hoặc dùng cửa sổ cài lần đầu. Nếu cửa sổ mới chưa có tiến độ, dùng Khôi phục. Bản sao chứa dữ liệu học cá nhân; không đưa vào repository.
- App có đồng bộ tài khoản tự nguyện, đã kiểm tra trên backend local; chưa có cloud hosted. Gói offline có hướng dẫn tại [OFFLINE.md](OFFLINE.md). Thêm biểu tượng không tự bật đồng bộ; kiểm tra trạng thái hoặc giữ bản sao trước khi đổi nơi mở. Xem [SYNC.md](SYNC.md).

Điều kiện manifest và HTTPS/localhost được tham khảo từ [MDN: Making PWAs installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable). Quy tắc local của dự án ở DEC-008/012 trong [DECISIONS.md](DECISIONS.md).

## Tài nguyên và chuẩn bị hosting

- `public/manifest.webmanifest`: ID ở gốc origin, scope `./`, start URL `./#/today`, standalone, tiếng Việt và màu nền.
- `public/icons/`: SVG nguồn thuộc dự án, PNG 192/512 và maskable 512, apple-touch-icon 180. `npm run icons` tạo lại bốn PNG bằng Chrome đã cài; dùng `PLAYWRIGHT_CHANNEL` như bộ test nếu chọn Chromium. Không cần chạy lại mỗi lần build.
- `index.html`: liên kết manifest, apple-touch-icon, tên ứng dụng và viewport-fit. CSS giữ khoảng an toàn cho thanh dưới và vùng màn hình điện thoại.
- `src/app/installation.ts`: trạng thái sự kiện cài trong bộ nhớ, không sửa schema học; `src/features/install/InstallPage.tsx`: hướng dẫn và phản hồi.
- Khi chọn hosting: build `dist/`, phục vụ ở gốc tên miền qua HTTPS. Manifest phải trả JSON đúng với MIME `application/manifest+json`, không bị fallback thành HTML; icon/font/JS/CSS phải tải được. Hash routing không cần rewrite từng đường bài học.
- Nếu muốn đặt app dưới thư mục con, cần điều chỉnh và kiểm tra lại base/ID/scope/đường tài nguyên trước. Giữ origin ổn định để tránh chia kho dữ liệu; không thay ID sau khi phát hành mà không xem tác động tới bản đã cài.

## Kiểm tra trên thiết bị thật khi có môi trường

1. Ghi thiết bị, hệ điều hành, phiên bản trình duyệt, URL/commit build. Dùng dữ liệu thử và xuất bản sao trước.
2. Mở web, tạo một phiên dở có câu đang nhập và gợi ý. Cài theo menu/nút, kiểm tra tên và biểu tượng sau khi hoàn tất.
3. Mở biểu tượng: xác nhận cửa sổ riêng, hướng dẫn báo chế độ ứng dụng và Hôm nay có phiên dở nếu dùng cùng kho. Nếu kho tách, nhập bản sao rồi tiếp tục.
4. Đóng và mở app, kiểm tra nháp và lịch ôn; thử chuyển nền/quay lại, bàn phím, xoay ngang và khoảng an toàn quanh tai thỏ/thanh home.
5. Hủy cài, thử trình duyệt nhúng hoặc không có nút cài. Người học vẫn có thể mở hướng dẫn và dùng web.
6. Trên bản build, tải đủ gói rồi đóng cửa sổ, tắt mạng, mở lại từ biểu tượng; phát câu nghe, làm bài và lưu nháp. Khôi phục mạng để kiểm tra đồng bộ/không trùng, xóa gói không xóa tiến độ. Thử phiên hết hạn và bản cập nhật, kiểm tra quota/thu hồi dữ liệu theo [OFFLINE.md](OFFLINE.md).

Hiện chưa có kiểm tra cài/khởi chạy từ màn hình chính trên iPhone/iPad/Android thật hoặc cửa sổ app của hệ điều hành. Kiểm thử Chrome tự động và tín hiệu standalone có điều khiển không thay thế các bước trên.
