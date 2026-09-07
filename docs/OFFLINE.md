# Gói học không cần mạng

Cập nhật: 2026-09-07. PWA-002 triển khai trên bản build. Kết quả kiểm tra thực tế và giới hạn thiết bị ở [STATUS.md](STATUS.md).

## Dùng thử

1. Với tài khoản local: mở Docker, chạy `npm run db:start`, `npm run db:migrate`, rồi `npm run preview:local`. Mở http://127.0.0.1:4175/#/install. Với chế độ khách: `npm run build`, `npm run preview`, mở http://127.0.0.1:4173/#/install. Dev ở cổng 5173 không đăng ký service worker.
2. Chọn **Tải gói để học offline**. Gói “Bảy ngày khởi đầu” chứa bảy câu nghe WAV và bản văn bản/câu hỏi của bảy bài. Chờ **Sẵn sàng học offline**; có số file/dung lượng và nút kiểm tra.
3. Đóng cửa sổ rồi mở lại đúng địa chỉ/biểu tượng khi mất mạng. Có thể đọc, nghe câu mẫu, trả lời, xem giải thích, tự viết, ôn và lưu tiến độ. Âm thanh có nút dừng, dừng khi rời bài/ẩn trang và không tự phát.
4. Tài khoản đã mở trên trình duyệt được nhận từ bản lưu local, kể cả khi SDK cần làm mới phiên. Đây chỉ là lựa chọn kho local; Auth/RLS vẫn xác thực mọi request máy chủ. Đăng nhập mới cần mạng. Nếu đã đăng xuất/xóa phiên, không tự mở lại tài khoản từ các key tiến độ còn trên máy.
5. Mở app có mạng để đồng bộ nếu đã bật. Chờ xác nhận trước đổi máy. Không chạy đồng bộ khi app bị OS đóng; không có AI offline hoặc ghi âm/chấm phát âm.
6. **Xóa gói tải xuống** xóa file học/audio đã tải, giữ phần mở app, bài dở, lịch ôn và outbox. Nội dung bảy bài cũng nằm trong mã app nên phần đọc vẫn có thể mở; phần nghe cần mạng hoặc tải lại. Đây không phải nút xóa tiến độ/tài khoản.

Cổng 4175 và 5173 là hai origin/kho trình duyệt khác nhau. Đồng bộ hoặc xuất/nhập JSON để chuyển phần học; thêm biểu tượng không tự sao lưu. Preview vẫn là server thử trên máy, chưa phải link HTTPS cho điện thoại.

## Nguồn âm thanh và quyền lưu

- Văn bản, câu hỏi và bản dịch được dự án biên soạn mới; hồ sơ ở [CONTENT_REVIEW.md](CONTENT_REVIEW.md). Không dùng đề thi thương mại hay video của người khác.
- Bảy file ở `public/packs/foundation-v1/` được tạo từ đúng `lesson.phrase` bằng **eSpeak NG 1.51**, giọng formant `en-us`, tốc độ 145 từ/phút. Chỉ phân phối đầu ra câu nói, không đưa chương trình hay bộ dữ liệu giọng vào app. Không có bản thu người học/giáo viên hoặc giọng người được mô phỏng.
- eSpeak dùng tổng hợp formant và xuất WAV; [tài liệu lệnh](https://espeak.sourceforge.net/commands.html), [mô tả dự án](https://espeak.sourceforge.net/). [Giấy phép eSpeak, GPLv3 mục 2](https://espeak.sourceforge.net/license.html) phân biệt chương trình với đầu ra. Cơ sở lựa chọn của dự án: đầu ra formant từ câu tự soạn không chép mã nguồn/bản thu của công cụ, dùng để lưu/phân phối trong gói học; đây không phải giấy phép cho các giọng ngoài hoặc học liệu bên thứ ba về sau.
- Audio là giọng tổng hợp thử nghiệm, có thể cứng và đọc tên Việt chưa tự nhiên. Chưa có giáo viên nghe duyệt chất lượng phát âm/ngữ điệu; không quảng bá làm mẫu chuẩn để luyện accent. Test xác nhận WAV giải mã/phát được, không xác nhận chất lượng sư phạm.
- `npm run audio` dùng Docker Debian bookworm-slim và eSpeak NG để tái tạo WAV, JSON học liệu và `src/content/offline-pack.json`. Lần tạo ban đầu dùng image `debian@sha256:96e378d7e6531ac9a15ad505478fcc2e69f371b10f5cdf87857c4b8188404716`; script tải gói Debian lúc chạy nên kết quả lần sau có thể đổi. Metadata ghi byte và SHA-256 cho mỗi file, phiên bản gói suy từ danh sách đó. Rà soát thay đổi âm thanh/hash khi chạy lại; không chạy audio ở mỗi build.

## Cache, phiên bản và cập nhật

- `scripts/offline-build.js` chạy sau Vite build, kiểm tra học liệu/asset trùng manifest rồi tạo `sw.js` và `offline-manifest.json`. Nếu sửa bài hoặc WAV mà chưa tạo lại gói thì build dừng. Không thêm thư viện runtime.
- Service worker chỉ dùng allowlist chính xác cho HTML gốc, JS/CSS/font/icon/manifest, JSON bài và WAV công khai cùng origin. Không lưu API, Auth, request có Authorization, query hoặc origin ngoài; response cache chỉ giữ body/Content-Type/Content-Length. Không có token hoặc nội dung học cá nhân trong Cache Storage.
- Phần mở app có cache `moi-ngay.shell.<hash-build>`, tự tải lúc worker cài lần đầu; khoảng 1,07 MB chưa nén. Gói 740.035 byte, khoảng 0,74 MB, tên `moi-ngay.pack.<version-hash>`, chỉ tải khi người học chọn. UI báo kích thước byte của tài nguyên (MB = 1.000.000 byte), không coi đó là quota còn trống; trình duyệt có overhead và nén khác nhau.
- Tải có kiểm tra SHA-256/kích thước/trạng thái 200, timeout từng file. Marker hoàn tất chỉ ghi sau tất cả file. Thiếu mạng/quota giữ gói chưa đầy đủ và cho thử lại. Kiểm tra trạng thái đòi đủ file gói/marker và phần mở app; retry sửa file shell bị thu hồi. Các lệnh tải/xóa trong worker được xếp hàng; không tải URL do người dùng tùy ý cung cấp.
- WAV được lưu nguyên file; worker trả byte range 206 hoặc 416 để phát/tua offline. Không lưu response 206 vào cache. File nghe online không tự biến thành gói tải xuống.
- Không gọi `skipWaiting`, không tự reload. Bản mới cache xong sẽ chờ tất cả cửa sổ cũ đóng, giữ bài đang nhập. Trang cũ tiếp tục nhận HTML/tài nguyên đúng build đang chạy. Khi kích hoạt, worker chỉ dọn cache shell/gói cũ của dự án; không chạm localStorage/outbox/Auth hoặc cache khác. Gói cùng phiên bản giữ lại, gói đổi phiên bản cần chủ động tải lại.
- Giữ StudyState version 3 và kho tiến độ hiện có. Cache Storage phù hợp file HTTP công khai; chưa cần chuyển tiến độ sang IndexedDB. Lỗi quota tiến độ và bảo vệ bản lỗi của DATA-002 vẫn áp dụng.

Tham khảo: [MDN service worker lifecycle](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers), [cache](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Caching), [CacheStorage](https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage). Cache có thể bị trình duyệt thu hồi; không coi offline là sao lưu.

## Điều kiện trước khi phát hành

- Phục vụ gốc origin qua HTTPS, MIME đúng; `sw.js`, HTML và manifest phiên bản nên revalidate (`Cache-Control: no-cache`), các tài nguyên có tên hash có thể immutable. Deploy toàn bộ build cùng lúc và giữ asset của build trước trong thời gian nâng cấp. Không dùng SPA fallback trả HTML cho file thiếu. Thay URL backend/key cần build và đóng cửa sổ cũ để cập nhật; xóa phiên khi đổi dự án có quy trình riêng.
- Cần kiểm tra thật Safari/iPhone, Chrome/Android, cửa sổ standalone, chế độ tiết kiệm pin/bộ nhớ, dung lượng và âm thanh trên loa/tai nghe. Chrome tự động/viewport không thay kiểm thử đó.
- Không dùng chế độ riêng tư để kỳ vọng dữ liệu lâu dài. Giữ bản sao tiến độ; mất toàn bộ storage cần tải lại shell/gói và khôi phục tiến độ riêng.
- Nút cập nhật chỉ xuất hiện ở phần cài/offline; đóng hết cửa sổ để áp dụng. Chưa tự tải gói mới/chạy nền, chưa xin persistent storage hoặc cung cấp quản lý nhiều gói.
