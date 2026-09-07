# Đóng gói và triển khai web

Cập nhật 2026-09-07, DEPLOY-001. Đã chuẩn bị bản static và kiểm tra local; **chưa có URL HTTPS công khai, tài khoản hosting được kết nối, Supabase hosted/SMTP hoặc phép thử điện thoại thật**. Đây là hướng dẫn vận hành, không là xác nhận đã phát hành beta.

## 1. Tạo bản để tải lên hosting

Chạy ở thư mục repository với Node/npm theo README:

```sh
npm ci
npm run lint
npm test
npm run release:build
npm run release:verify
npm run release:preview
```

Mở http://127.0.0.1:4176/#/today để kiểm tra **artifact vừa tạo**. Lệnh preview chiếm cổng cố định, không dùng lại server khác; dừng bằng Ctrl+C. Cổng 4175 vẫn dành cho bản thử Supabase local. Loopback HTTP được dùng để kiểm tra PWA trên máy phát triển, không là HTTPS cho điện thoại ở mạng ngoài.

Mỗi lần build tạo thư mục mới `.local/releases/<thời-gian>-<revision>-<mã>/`:

- `site/`: chỉ file web công khai, học liệu, âm thanh, worker, `_headers` và `404.html`. Đây là thư mục tải lên hosting; không tải cả repository hoặc `.local`.
- `release.json`: thời điểm, Git revision/trạng thái chưa commit, cấu hình công khai, schema dữ liệu và SHA-256/kích thước từng file. Giữ cùng bản lưu của người vận hành, ngoài web root.
- `.local/releases/latest.json` chỉ đến bản tạo thành công gần nhất. Lệnh verify/preview không có đối số dùng bản này; có thể truyền thư mục release cũ bằng `-- <đường-dẫn>`.

Build không xóa `dist`, bản release trước hoặc tiến độ. Bản kê giúp phát hiện file bị sửa/thiếu, không phải chữ ký xác thực chống người sửa cả file và bản kê. Trước public, dùng working tree đã commit, xác minh `dirty: false`, giữ trọn thư mục release ở nơi sao lưu riêng. `.local` bị Git bỏ qua; mã nguồn/scripts được commit để tạo lại bản. Quét dạng khóa và danh sách file là lớp kiểm tra bổ sung, không bảo đảm phát hiện mọi loại bí mật nhúng tay trong code.

`release:build` tắt đọc `.env*` và tự động công khai biến môi trường của Vite. Chỉ các trường cấu hình hợp lệ được đưa vào bundle. Các lệnh `build`, `dev:local`, `preview:local` cũ vẫn dành cho phát triển; không lấy thư mục có URL 127.0.0.1 từ những lệnh đó để public.

## 2. Chọn môi trường

| Bản | Đầu vào | Dùng được | Chưa cung cấp |
| --- | --- | --- | --- |
| Khách — mặc định | Không cần tài khoản, `.env` hoặc API key | Học bốn tuần, phiên/ôn/tiến bộ, bản sao JSON, tải offline, hướng dẫn cài PWA | Đăng nhập, đồng bộ giữa máy, nhắc từ máy chủ, AI |
| Tài khoản | File JSON công khai theo mẫu bên dưới; Supabase hosted đã chuẩn bị | Thêm OTP và đồng bộ khi hosted/SMTP/RLS đã kiểm tra | Build không tự tạo backend/SMTP, không tự bật AI hoặc máy gửi nhắc |
| API AI / gửi nhắc | Dịch vụ máy chủ riêng | Chỉ sau bước triển khai/kiểm tra tương ứng | Không được đóng gói vào static site; entrypoint hiện tại là local |

Để chuẩn bị bản tài khoản, chép [mẫu công khai](../deploy/account.example.json) vào `.local/release-account.json`, thay **URL hosted và publishable key** rồi chạy:

```sh
npm run release:build -- .local/release-account.json
npm run release:verify
npm run release:preview
```

Chỉ nhận `mode`, `supabaseUrl`, `publishableKey`; bản khách chỉ nhận `mode: "guest"`. Bản tài khoản hiện chỉ hỗ trợ `https://<project>.supabase.co`, không URL local, subpath, query hoặc custom domain. Không nhập service role, JWT cũ, khóa SMTP/VAPID/OpenAI. Mẫu có placeholder, không chạy được trước khi thay. Publishable key nằm trong browser là thiết kế chủ đích; RLS mới bảo vệ dữ liệu.

Theo [BACKEND.md](BACKEND.md), chọn đúng dự án hosted, áp dụng migration bằng quy trình có sao lưu, kiểm tra RLS/RPC hai tài khoản riêng và cấu hình Site URL/OTP/SMTP với tên miền phát hành. Kiểm tra gửi thư thật, hết hạn mã, đăng xuất/đổi chủ, hai máy sync, offline/gửi lại và xung đột. `test:auth` chỉ chạy backend loopback, không chuyển nguyên bộ test local lên database production. Chưa thực hiện các bước hosted này trong DEPLOY-001.

Release cố định AI tắt bằng cấu hình công khai khi biên dịch; không nhận tùy chọn bật trong JSON. UI giải thích và vẫn cho hoàn thành bài. Proxy `/api/ai` trong Vite local không tồn tại trên hosting static. Muốn bật sau này cần entrypoint production cho [AI](AI.md), xác thực/hạn mức/ngân sách và route cùng origin đã kiểm tra. Không đặt API key ở browser. [Máy gửi nhắc](NOTIFICATIONS.md) cần runtime/lịch chạy, khóa riêng và cấu hình backend riêng; `scripts/reminders-local.js` và `server/local.ts` không phải dịch vụ cloud đã triển khai.

## 3. Phương án hosting đã chuẩn bị

Artifact độc lập nhà cung cấp; `_headers` được tạo cho **Cloudflare Pages** làm phương án hướng dẫn mặc định, chưa khẳng định tài khoản/dự án đã được chọn. Với hosting khác phải chuyển quy tắc header/404 tương đương và kiểm tra lại.

1. Vào tài khoản Cloudflare của chủ dự án, tạo Pages bằng Direct Upload và chọn tên project ổn định. Dashboard nhận thư mục hoặc zip; tải nội dung `site/` thành web root. Ghi lại project, URL production, revision và mã deployment. Không tự bật analytics hoặc dịch vụ trả phí. Direct Upload không đổi sang Git integration trong cùng project; nếu muốn Git integration, chọn cách đó trước khi tạo project. [Tài liệu Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/).
2. Mở URL HTTPS production, thực hiện bảng kiểm dưới đây trước khi chia sẻ. Giữ origin ổn định qua các lần phát hành. URL preview, `pages.dev`, custom domain và localhost có kho lưu khác nhau; đổi origin cần xuất/nhập JSON hoặc sync rõ ràng, không coi là mất dữ liệu do update.
3. Chỉ cấu hình custom domain khi chủ dự án đã chọn và có quyền DNS. Không cần mua tên miền để chuẩn bị artifact. Nếu dùng cách tải thủ công này, các lần sau cập nhật cùng project, không tạo site mới mỗi lần.

Không upload source map, bản sao học viên, log, `.env`, `release.json` hoặc thư mục server. Chưa có project hosting được kết nối nên session này không đăng nhập, tạo site hoặc tải artifact ra ngoài.

## 4. HTTP, cache và cập nhật

`_headers` chỉ áp dụng static response trên Pages. HTML, manifest, worker, icon và tài nguyên pack đường dẫn cố định dùng `no-cache` để trình duyệt xác minh lại; JS/CSS/font có hash dưới `/assets/` dùng cache dài. Worker có `Service-Worker-Allowed: /`. Chính sách CSP cho script cùng origin, kết nối cùng origin và Supabase đã chọn; không script inline, frame hoặc nguồn font bên ngoài. Style inline cần cho các thành phần hiện tại. Không dùng cùng quy tắc cho API có dữ liệu tài khoản. [Cấu hình header của Pages](https://developers.cloudflare.com/pages/configuration/headers/).

App dùng route `/#/...`, đặt ở root origin; chưa hỗ trợ `example.com/app_ielts/`. Có `404.html` để các URL không tồn tại và `/api/ai/*` thiếu dịch vụ không bị trả trang app với mã thành công. Pages có thể chuẩn hóa URL `.html`. Tài liệu Pages hiện ghi HTTP Range có thể trả cả file với 200; kiểm tra nghe/tua trên hosting thật. Worker của app xử lý range 206/416 cho âm thanh đã tải offline. [Cách Pages phục vụ file](https://developers.cloudflare.com/pages/configuration/serving-pages/).

Khi phát hành bản mới, tải **toàn bộ** `site/` cùng lần triển khai. Worker mới đợi đóng mọi tab/cửa sổ app cũ rồi kích hoạt; không cưỡng bức reload khi đang làm bài. Có thể cần tải lại pack sau đổi phiên bản. Không xóa localStorage/IndexedDB, không gửi `Clear-Site-Data`, không xóa dữ liệu trình duyệt để chữa lỗi cache. Chi tiết ở [OFFLINE.md](OFFLINE.md).

## 5. Quay lui và khôi phục

Trước update: giữ artifact trước, xuất bản sao JSON hoặc xác nhận sync hoàn tất. Ghi schema/ID học liệu mà bản mới đã ghi. Release hiện ghi StudyState 3, đọc 1/2/3 và biết 32 đơn vị học.

Nếu bản mới lỗi, kiểm tra bản định quay lui có đọc được dữ liệu/ID đã phát sinh không. Nếu không tương thích, sửa tiến thay vì ép người học xóa dữ liệu hoặc chỉ hạ số version. Không quay migration database chỉ vì rollback web; cần kế hoạch dữ liệu riêng.

Pages hỗ trợ quay về deployment production trước trong danh sách Deployments; preview deployment không phải đích rollback. Sau thao tác, mở URL production, kiểm tra worker mới/chờ kích hoạt, đóng các cửa sổ cũ và kiểm tra tiến độ. Rollback hosting không tự đổi worker đang chạy ngay trong tab. [Hướng dẫn rollback](https://developers.cloudflare.com/pages/configuration/rollbacks/).

Nếu dữ liệu local không còn: dùng bản JSON đã xuất trong Cài đặt hoặc dữ liệu đã sync của đúng tài khoản. Cache học liệu không chứa bản sao tiến độ. Xóa tải xuống chỉ xóa pack; xóa dữ liệu học theo thao tác riêng có xác nhận trong app. Xem [SYNC.md](SYNC.md) và [INSTALLATION.md](INSTALLATION.md).

## 6. Kiểm tra trước khi chia sẻ URL

`npm run test:release` tạo bản khách mới rồi chạy 38 ca desktop/viewport điện thoại từ artifact. Gồm học/ôn/bản sao, thích ứng/offline, CSP/404/cache và AI tắt; ca đổi worker dùng HTTP origin thử riêng với chính file của artifact. Không dùng database, API trả phí hoặc thông tin học viên thật. Test này chưa thay việc xác minh hạ tầng hosting.

| Kiểm tra | Local artifact | Trên URL/thiết bị thật |
| --- | --- | --- |
| Config/99 file/hash/không kế thừa khóa env | Đã kiểm tra khách và build tài khoản bằng giá trị thử | Verify artifact trước upload; đối chiếu offline build sau upload |
| HTTPS/HTTP redirect/chứng chỉ | Chưa kiểm tra; preview là loopback HTTP | URL HTTPS không mixed content; HTTP chuyển HTTPS |
| `/`, `/#/today`, `/#/lesson/hello`, `/#/install` | Ca trình duyệt thực | Mở trực tiếp/reload trên Safari iPhone và Chrome Android |
| Headers/CSP/404 | Preview áp quy tắc cùng nguồn `_headers` | Kiểm tra response thật, không giả định nhà cung cấp đã áp cấu hình |
| Hoàn thành bài/reload/backup/restore | Ca trình duyệt thực, tài khoản thử riêng | Làm trên từng máy, giữ bản sao trước update |
| Audio/offline/update | File WAV thật, pack và worker đã kiểm tra | Nghe/tua online, tải đủ pack, đóng/mở lại khi mất mạng, update giữ bài dở |
| Cài PWA | Theo hướng dẫn và kiểm tra Chrome trước đó | Safari: thêm vào màn hình chính; Android: cài từ trình duyệt; mở icon và kiểm tra standalone |
| OTP/sync/nhắc/AI | Backend local ở task trước; bản khách không có | Chỉ công bố dịch vụ đã được cấu hình và kiểm tra thật |

Ghi thiết bị, OS/browser, URL/revision và kết quả vào SESSION_LOG khi thực hiện. Không mở chương trình beta AI hoặc hứa mục tiêu sáu tháng chỉ vì URL static đã hoạt động.

## 7. Thông tin còn cần để phát hành

DEPLOY-002 cần tài khoản/project hosting có quyền triển khai và URL production được chọn. Có thể public bản khách trước mà không cần Supabase/AI. Với bản tài khoản cần thêm project hosted, migration/RLS và SMTP đã kiểm tra. AI-001 tiếp tục cần key/ngân sách máy chủ, kết quả đối chiếu và người duyệt. Việc cài/kiểm tra iOS/Android cần thiết bị thật. Không gửi khóa bí mật trong chat hoặc Git.
