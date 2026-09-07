# Nhắc học tự nguyện

Cập nhật 2026-09-07, NOTIFY-001. Trang `#/reminders` mở từ cuối mỗi trang hoặc Tài khoản. Nhắc mặc định tắt; học viên chọn bật cho từng tài khoản/trình duyệt. Có giờ, ngày trong tuần, múi giờ IANA, giờ yên lặng, lưu/sửa, dời lượt tiếp theo 30 phút và tắt. Không phụ thuộc thông báo để mở bài.

## Dùng bản local

1. Mở Docker, chạy `npm run db:start` rồi `npm run db:migrate`.
2. Chạy `npm run preview:local`, mở http://127.0.0.1:4175/#/reminders. Đăng nhập bằng email thử; mã ở http://127.0.0.1:54324. Dev không đăng ký worker nên không nhận nhắc khi đóng trang.
3. Ở terminal khác, chạy `npm run reminders:local`. Lần đầu tạo cặp khóa VAPID trong `.local/reminder-vapid.json`; những lần sau dùng lại. Không đưa file này vào Git, VITE, log hoặc bản sao tiến độ.
4. Chọn **Tải lại lịch và trạng thái**, chỉnh giờ/ngày/múi giờ và **Bật nhắc trên thiết bị này**. Trình duyệt chỉ hỏi quyền từ nút này. Nếu từ chối, đổi quyền trong cài đặt trình duyệt khi muốn thử lại; app vẫn học được.
5. Xem lượt tiếp theo do server tính. Máy gửi kiểm tra mỗi 10 giây, cần máy tính/Docker/Internet còn chạy. Dừng terminal hoặc cho máy ngủ sẽ ngừng gửi; lời nhắc quá một phút được bỏ qua.

Lịch của 4175 khác với 4173/5173, trình duyệt khác và tài khoản khác. Cài thêm biểu tượng không tự bật nhắc. Để dùng điện thoại cần bản HTTPS và backend/bộ gửi truy cập được từ mạng; localhost hiện chưa đáp ứng. Không có triển khai hosted trong task này.

`npm run reminders:local -- --setup` chỉ chuẩn bị khóa/cấu hình công khai, chưa chạy vòng gửi. Heartbeat tại lần setup không có nghĩa tiến trình sẽ tiếp tục hoạt động. Trang báo máy chưa hoạt động nếu không nhận heartbeat trong 90 giây; bấm tải lại để lấy trạng thái mới. Không sửa hoặc tự tạo đè khóa cũ khi file không đọc được.

## Quy tắc lịch và gửi

- Lặp theo các ngày đã chọn và múi giờ đã lưu; đi xa không tự đổi múi giờ. Giờ nhắc phải nằm ngoài khoảng yên lặng. Khoảng yên lặng gồm giờ bắt đầu và không gồm giờ kết thúc, có thể qua nửa đêm.
- Dời chỉ đổi lượt tiếp theo, cộng 30 phút; nếu rơi vào yên lặng, chuyển đến lúc hết yên lặng. Có thể sang ngày khác với lịch lặp. Không cho dời quá 14 ngày. Những lượt sau quay lại lịch thường.
- PostgreSQL bỏ ngày có giờ nhắc không tồn tại khi DST tiến. Khi đồng hồ lùi và giờ lặp, chọn lần sau theo [quy tắc timestamp PostgreSQL 17](https://www.postgresql.org/docs/17/datetime-invalid-input.html). UI định dạng thời điểm server trả, không tính lịch bằng thuật toán thứ hai.
- Tối đa một lượt gửi/ID thiết bị/ngày địa phương; receipt duy nhất được ghi trước HTTP. Claim/prepare dùng khóa hàng và revision; sửa/tắt/dời khiến lượt cũ chưa gửi bị hủy. Giữ thứ tự khóa thiết bị rồi receipt.
- Bỏ lịch quá một phút và kiểm tra yên lặng trước gửi. `TTL: 0` tránh giữ hàng đợi tại dịch vụ để dồn khi thiết bị có mạng lại. Không retry kết quả HTTP chưa rõ; lỗi/đứt tiến trình có thể bỏ lỡ một lượt. `accepted` chỉ nghĩa dịch vụ đẩy nhận request, không bảo đảm OS đã hiển thị.
- Worker kiểm tra ID/revision, hạn payload, ngày địa phương, giờ yên lặng và ngày đã hiển thị trong một transaction IndexedDB. Click chỉ mở `/#/today` cùng origin. Nội dung là lời mời học chung, không có email/tên/câu trả lời/band/streak.
- Hệ điều hành, Focus và dịch vụ push có thể trì hoãn/ẩn thông báo. Thu hồi đăng ký hoặc thay revision không bảo đảm thu hồi một thông báo đã tới. Một số trình duyệt có thể hiện thông báo mặc định khi nhận push bị app bỏ qua; chưa xác minh hành vi này trên mọi nền tảng.

## Dữ liệu, quyền và vòng đời

- `reminder_devices`: user ID, ID thiết bị ngẫu nhiên, revision, lựa chọn, subscription, lượt kế tiếp và trạng thái gửi. RLS chỉ cho chủ đọc; ghi qua `save_reminder`/`snooze_reminder`, kiểm tra Auth/owner/CAS. Tối đa năm ID thiết bị/tài khoản; tắt/bật lại dùng ID cũ. Chưa có màn hình quản lý/xóa thiết bị từ xa; xóa storage có thể làm mất ID và tiêu tốn một chỗ mới.
- `reminder_deliveries`: metadata từng lần thử gửi và ngày, không lưu nội dung học. `reminder_service`: chỉ public key/heartbeat, authenticated đọc; chỉ service role sửa. Khóa riêng và service key chỉ ở Node. Endpoint HTTPS chỉ nhận các host push được hỗ trợ (FCM, Mozilla, Apple); không nhận URL máy chủ tùy ý.
- `src/features/reminders/service.ts` dùng Web Lock riêng cho thao tác đăng ký/sửa/hủy trong cùng origin; generation/owner vô hiệu callback cũ. Đăng ký push chờ tối đa 15 giây, có dọn kết quả tới muộn. Lỗi lưu không tự gửi lại; tải lại để xem revision thật.
- IndexedDB `moi-ngay.reminders` chỉ lưu binding/nhãn ngày nhắc; localStorage giữ ID thiết bị theo backend/chủ. Không chuyển StudyState khỏi version 3, không đưa lịch vào sync/bản sao JSON, không cache token/subscription trong gói tài nguyên công khai.
- Đăng xuất cố hủy subscription và đóng thông báo của app trước khi rời tài khoản; xác nhận tắt server nếu còn phiên/kết nối. Mất phiên/đổi chủ khi mở app cũng dọn binding, không bật nhắc cho chủ mới. Nếu server chưa xác nhận, hàng cũ có thể còn bật đến khi endpoint trả 404/410; client đã bỏ binding. Không hứa tắt từ xa khi không có mạng.
- Bản local chưa có retention tự động cho receipt hoặc UI xóa toàn bộ tài khoản. Xóa Auth user cascade xóa lịch/receipt của người đó; bộ kiểm tra chỉ xóa tài khoản do chính nó tạo. Trước hosted cần quản lý thiết bị, retention, hạn mức, vận hành và kiểm tra thiết bị thật.

## Xác minh và giới hạn nền tảng

`npm test` kiểm tra validation/giờ yên lặng/bộ lọc payload và bộ gửi không retry kết quả chưa rõ. `npm run test:auth` chuẩn bị khóa local bằng `--setup`, kiểm tra RLS/RPC/calendar thật và UI ở hai viewport. Phần UI điều khiển permission/subscription để kiểm tra từ chối, lưu/dời/tắt, mất response và đổi chủ. CDP đưa push vào worker thật để kiểm tra hiển thị, không lặp và click; đây không phải giao hàng qua mạng push.

Để kiểm tra mạng push thật riêng, sau setup và preview 4175 chạy `npm run reminders:verify`. Lệnh tạo một tài khoản thử và hồ sơ Chrome tạm, đăng ký push thật qua UI, đóng tất cả trang app rồi chỉ gửi cho thiết bị thử đó. Nó kiểm tra thông báo bằng `registration.getNotifications()`, hủy subscription và xóa tài khoản thử khi kết thúc. Không dùng profile cá nhân; không ghi token/endpoint/khóa vào log. Cần Internet tới dịch vụ push và không chạy vòng gửi khác đồng thời với probe để tránh tranh lượt.

Đã xác minh đường FCM thật trong Chrome headless trên Windows, với **0 trang app đang mở**, dịch vụ nhận một lượt và worker đăng ký một thông báo. Chưa quan sát thông báo ở giao diện hệ điều hành, chưa tắt toàn bộ tiến trình Chrome và chưa thử iPhone/Android thật. Không suy từ viewport mobile rằng push đã hoạt động trên điện thoại.

[WebKit](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/) công bố Web Push cho web app thêm vào Home Screen từ iOS/iPadOS 16.4, quyền phải từ thao tác người dùng. Trước beta cần thử thiết bị iOS và Android thật: cài/mở từ biểu tượng, cấp/từ chối/thu hồi quyền, khóa màn hình, đóng app, Focus, mất mạng, qua ngày, đổi tài khoản và tắt nhắc. Ghi OS/browser, thời điểm server nhận và thời điểm thấy thông báo riêng.

Nguồn API: [PushManager.subscribe](https://developer.mozilla.org/en-US/docs/Web/API/PushManager/subscribe), [showNotification](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/showNotification), [web-push Node 3.6.7](https://github.com/web-push-libs/web-push). Không có API Notification Triggers hoặc timer tab thay lịch gửi nền.
