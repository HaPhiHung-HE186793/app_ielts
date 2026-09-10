# Quyết định và giả định

Ngày lập: 2026-09-06. Các lựa chọn kỹ thuật là hướng khởi đầu từ đề xuất sản phẩm, có thể được cập nhật khi có bằng chứng hoặc chỉ dẫn mới. Không ghi một giả định thành yêu cầu đã được người dùng xác nhận.

## DEC-001 — Lưu ngữ cảnh phát triển trong Git

- Trạng thái: yêu cầu rõ ràng của người dùng.
- Quyết định: có `AGENTS.md`, tài liệu định hướng, task, trạng thái hiện tại và nhật ký session; commit và push mốc tài liệu khởi đầu.
- Lý do: session mới cần biết mục tiêu, việc đã làm và bước tiếp theo mà không phụ thuộc lịch sử chat.
- Hệ quả: cập nhật tài liệu bàn giao cùng các mốc phát triển; chỉ ghi tính năng hoàn thành khi có bằng chứng.

## DEC-002 — PWA trước, ứng dụng qua cửa hàng sau

- Trạng thái: hướng triển khai ban đầu.
- Quyết định: web app ưu tiên điện thoại, có thể cài lên màn hình chính; cân nhắc Capacitor khi đến giai đoạn cửa hàng ứng dụng.
- Lý do: đáp ứng việc mở web và dùng trên iPhone/Android với một nền giao diện chung.
- Hệ quả: kiểm thử khác biệt trình duyệt; không hứa khả năng offline, thông báo hoặc chạy nền trước khi đã triển khai và kiểm tra.

## DEC-003 — React, TypeScript, Vite; backend Supabase theo giai đoạn

- Trạng thái: đã triển khai frontend và luồng học local ngày 2026-09-06.
- Quyết định: React + TypeScript + Vite, npm/lockfile; luồng học local trước, tài khoản và đồng bộ sau.
- Lý do: có thể kiểm tra một phiên học hoàn chỉnh trước khi cần cấu hình dịch vụ ngoài.
- Hệ quả: tách lớp dữ liệu, ghi rõ local chưa phải sao lưu. Dùng React 19.2.8, Vite 8.2.2 và TypeScript 5.9.3 với Node 22.18.0; TypeScript 5.9 phù hợp peer dependency của bộ lint. Phiên bản chính xác nằm trong lockfile. Nhà cung cấp AI và hosting chưa chốt.

## DEC-004 — Tiến bộ học tập là mục tiêu chính

- Trạng thái: nguyên tắc sản phẩm khởi đầu.
- Quyết định: dùng bài ngắn, chủ đề sở thích, phản hồi và ôn; có điểm dừng và cơ chế quay lại sau nghỉ.
- Lý do: mục tiêu của việc giữ hứng thú là hỗ trợ nhớ và sử dụng được tiếng Anh.
- Hệ quả: không xây cuộn vô hạn, hình phạt mất streak hoặc quy đổi điểm thưởng thành band IELTS.

## DEC-005 — Điểm AI có giới hạn và nguồn rõ ràng

- Trạng thái: nguyên tắc sản phẩm khởi đầu.
- Quyết định: phân biệt đánh giá AI, giáo viên và bài có đáp án; AI đưa ước lượng với căn cứ và hạn chế.
- Hệ quả: transcript không đủ để chấm phát âm; cần thử nghiệm đánh giá trên tập mẫu trước khi dựa vào điểm AI để đổi lộ trình.

## DEC-006 — Kiểm duyệt học liệu và làm một luồng hoàn chỉnh trước

- Trạng thái: hướng triển khai ban đầu.
- Quyết định: bắt đầu bằng bộ bài nhỏ có kiểm duyệt cho tuần đầu, sau đó mở rộng thành bốn tuần nền tảng trước beta.
- Lý do: cần kiểm tra được trải nghiệm học và độ phù hợp trước khi tăng số lượng nội dung.
- Hệ quả: các bài cần mục tiêu, giải thích, nguồn và quyền sử dụng; nội dung mẫu không được trình bày thành kho học liệu hoàn chỉnh.

## DEC-007 — Tên làm việc và giao diện

- Ngày: 2026-09-06. Trạng thái: tên làm việc, có thể đổi khi người dùng yêu cầu.
- Quyết định: tên hiển thị “Mỗi ngày”, giao diện xanh lá nhạt/kem, chữ Việt Be Vietnam Pro và Lora được đóng gói local, điều hướng cạnh trái trên desktop và dưới cùng trên điện thoại.
- Lý do: thể hiện nhịp học nhẹ nhàng và giữ thao tác học dễ tìm. Tên repository vẫn là app_ielts.

## DEC-008 — Dữ liệu văn bản local với bản sao có kiểm tra

- Ngày: 2026-09-06. Trạng thái: đã triển khai cho mốc 1.
- Quyết định: dùng localStorage cho lượng dữ liệu văn bản nhỏ, qua store riêng và schema Zod; ban đầu version 1, nâng lên version 2 trong PLAN-001 và version 3 trong PROGRESS-001 theo DEC-010/011. IndexedDB được dành cho gói offline/audio sau này.
- Hệ quả: lưu cả câu chưa nộp, lượt sai/gợi ý, bài tự viết; bản lỗi/khác phiên bản không bị ghi đè. Lỗi quota giữ công việc trong bộ nhớ và hiện cảnh báo. Có xuất JSON và nhập JSON được kiểm tra trước khi thay thế dữ liệu.
- Giới hạn: một bài dở; local không thay thế sao lưu. Không cam kết giải quyết ghi đồng thời giữa nhiều tab; đồng bộ và quy tắc xung đột cần DATA-002.

## DEC-009 — Lịch ôn khởi đầu minh bạch

- Ngày: 2026-09-06. Trạng thái: đã triển khai, có thể thay khi có dữ liệu.
- Quyết định: sau lần đầu hoàn thành bài, ôn sau 24 giờ. Trả lời đúng không cần gợi ý tăng bước đến 3/7/14/30 ngày; sai hoặc dùng gợi ý quay về bước 0 và ôn sau 10 phút.
- Quy tắc: ngày là khoảng 24 giờ tính từ lượt luyện, không phải đổi ngày lúc nửa đêm. Học lại bài không xóa lịch ôn sẵn có; một lượt nộp ôn chỉ được ghi một lần theo ID. Một phiên lấy tối đa 10 mục; xem danh sách không đổi lịch.
- Giới hạn: đây là lựa chọn kỹ thuật ban đầu, không phải kết luận về khoảng cách tối ưu cho mọi học viên. Không gọi thuật toán này là FSRS hay dự báo thành thạo.

## DEC-010 — Phiên học hữu hạn và nâng dữ liệu lên version 2

- Ngày: 2026-09-06. Trạng thái: triển khai trong PLAN-001.
- Onboarding mở từ Hôm nay hoặc cài đặt, có thể đóng để học ngay. Tái sử dụng form sẵn có và thêm mục tiêu khám phá/nền tảng/IELTS 6.5, ngày tùy chọn và tự nhận xét nền tảng. Không coi tự nhận xét là đánh giá đầu vào; ngày mục tiêu không kích hoạt dự báo band hay tự chuyển trình độ. Ngày đã qua vẫn giữ để người học chỉnh lại.
- Phiên 2 phút: đọc/nghe câu mẫu, ẩn mẫu, làm một câu nhớ lại và xem giải thích. Lượt này vào `quickLog`; không hoàn thành bài, không tạo hoặc đổi lịch ôn.
- Phiên 5 phút: một bài đầy đủ, ưu tiên bài dở rồi bài chưa hoàn thành theo thứ tự học liệu. Phiên 15 phút/buổi đầy đủ: tối đa ba câu đến hạn cũ nhất (ước tính một phút/câu), rồi thêm bài theo ngân sách còn lại. Không tự lặp bài để lấp thời gian. Sở thích tiếp tục ảnh hưởng gợi ý Khám phá/Hôm nay, chưa thay quy tắc kiến thức tiên quyết.
- Buổi đầy đủ dùng phút/ngày đã khai báo, mặc định 30 nếu chưa thiết lập. Tại mốc PLAN-001 chỉ có bảy bài, vì vậy buổi 60 phút ban đầu chỉ xếp được khoảng 35 phút; CONTENT-002 mở rộng danh mục và giữ trần 10 hoạt động theo DEC-018. Giao diện phân biệt phần đã xếp, ngân sách và phần chưa có học liệu. Không đo phút thực tế trong task này.
- Lưu một phiên hiện tại, danh sách cố định lúc tạo, con trỏ hoạt động, câu đang nhập/gợi ý và bài dở. Chuyển bước chỉ sau kết quả thực có cùng ID lượt làm; reload không nộp lại. Tạo phiên mới xác nhận thay danh sách phiên dở và giữ nguyên bài đang học. Lịch sử lượt làm vẫn còn, chưa lưu lịch sử mọi kế hoạch đã thay thế.
- Schema version 2 bổ sung hồ sơ, `plan`, `quickLog`. Giữ key `moi-ngay.study.v1` để đọc kho cũ. `parseBackup` chuyển version 1 sang version 2 trong bộ nhớ, kiểm tra đầy đủ trước khi dùng; ghi version 2 ở lần thay đổi/khôi phục thành công. Đọc đơn thuần không ghi đè bản gốc. Version không hỗ trợ hoặc dữ liệu lỗi tiếp tục được giữ nguyên theo DEC-008. Bản app cũ không đọc được version 2.
- Lựa chọn này tạo nền cho PROGRESS-001 (lịch sử phiên và phút hoạt động), không thay thế kế hoạch sáu tháng, kiểm tra đầu vào hoặc học liệu bốn kỹ năng đầy đủ.

## DEC-011 — Đo hoạt động và lưu lịch sử phiên

- Ngày: 2026-09-06. Triển khai trong PROGRESS-001, schema version 3; giữ key kho cũ và đọc version 1/2 mà không bù giờ hoặc tạo các kế hoạch đã mất.
- Chỉ gắn bộ đo vào bài có draft, câu khởi động và câu ôn đang mở, bao gồm lúc đọc phản hồi. Không gắn ở trang danh sách, cài đặt hoặc kết quả phiên. Đồng hồ chạy khi tài liệu hiển thị và cửa sổ có focus; mở cài đặt, rời hoạt động, ẩn/blur/pagehide hoặc nút dừng đo đều ngừng tính. Sau 60 giây không chạm/gõ/nhập/cuộn thì tự dừng; thao tác tiếp theo mở lại khoảng đo, không cộng thời gian nghỉ.
- Dùng `performance.now()` cho khoảng thời gian, `Date.now()` cho ngày ghi. Kiểm tra mỗi giây, lưu mốc cộng dồn mỗi năm giây và khi dừng/rời. Nếu callback gián đoạn trên 10 giây hoặc hai đồng hồ lệch trên hai giây, bỏ khoảng chưa chắc chắn và chờ tương tác/focus mới. Tham khảo [Performance.now](https://developer.mozilla.org/en-US/docs/Web/API/Performance/now), [Page Visibility](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API) và [pagehide](https://developer.mozilla.org/en-US/docs/Web/API/Window/pagehide_event).
- `activityLog` lưu một mốc cộng dồn theo lượt mở hoạt động/ngày địa phương, với UUID, loại hoạt động, ID lượt làm, ID phiên nếu có, ngày, mốc thời gian và mili giây đã đo. Tách khoảng qua nửa đêm theo ngày địa phương lúc ghi. Gửi lại cùng ID dùng số cộng dồn lớn hơn, không cộng delta hai lần. Reload tạo lượt mở mới và không khôi phục đồng hồ đang chạy từ timestamp cũ.
- Store có epoch trong bộ nhớ tăng khi nhập/xóa/nhận kho khác qua storage event. Timer cũ không được ghi vào bộ dữ liệu vừa thay. Chưa giải quyết hợp nhất đồng thời nhiều tab; chỉ cửa sổ có focus được tính, không tuyên bố tổng dữ liệu nhiều tab an toàn như đồng bộ cloud.
- `planHistory` giữ danh sách và trạng thái kết quả tại lúc kết thúc/thay phiên. Hoàn tất chỉ khi đủ lượt thực; phiên đổi giữ phần đã làm tại lúc đổi, không nhận thêm kết quả hoàn thành về sau. Lưu một lần theo ID; tạo kế hoạch mới vẫn giữ bài dở. Thời gian phiên tính từ bản ghi có cùng `planId`, độc lập với phút kế hoạch.
- Giới hạn phép đo: không xác nhận chú ý hoặc chất lượng học. Đọc/nói yên lặng quá 60 giây có thể bị tính thiếu; thao tác không đồng nghĩa đang hiểu bài. Tắt đột ngột/thiết bị kill có thể mất mốc chưa lưu (thông thường tối đa khoảng năm giây); dữ liệu trước bản cập nhật không có số đo. Không suy band từ thời gian.
- Bước tiếp theo ưu tiên PWA-001 để chuẩn bị mở từ màn hình chính; chưa cần cấu hình dịch vụ ngoài. DATA-001 vẫn cần Supabase và kiểm tra truy cập thật trước khi đóng task.

## DEC-012 — Cài từ web, giữ nguyên dữ liệu local

- Ngày: 2026-09-06. Triển khai PWA-001 bằng manifest tĩnh và tài nguyên trong repo, không thêm dependency. Tên “Mỗi ngày”, ID ổn định tại gốc origin, `start_url` mở `#/today`, scope toàn app và `display: standalone`. Bản build hiện dùng gốc tên miền; nếu chuyển sang thư mục con phải kiểm tra lại Vite base, ID/scope và đường dẫn icon trước khi phát hành.
- SVG tự tạo dựa trên favicon hiện có; PNG 192/512, maskable 512 nền kín và apple-touch-icon 180. `npm run icons` tái tạo bằng Chrome/Playwright đã có, không tải ảnh ngoài. Nét chính của maskable nằm trong vòng tròn an toàn bán kính 40% cạnh theo [hướng dẫn maskable của Chrome](https://web.dev/articles/maskable-icon).
- Manifest và HTTPS/localhost là nền cho cài đặt; service worker không phải điều kiện bắt buộc theo [MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable). Chưa thêm service worker/cache; PWA-002 vẫn phụ thuộc DATA-002. Không coi cache HTTP thông thường là học offline được hỗ trợ.
- Trang `#/install` mở từ cài đặt/cuối trang, không tự bật hộp cài hoặc thông báo. Lắng nghe `beforeinstallprompt` từ lúc khởi động, giữ sự kiện qua điều hướng và chỉ gọi `prompt()` từ thao tác người dùng, một lần cho mỗi sự kiện. Có đường từ chối/lỗi/menu thủ công. Không lưu cờ “đã cài” vào kho học.
- Phân biệt người dùng đồng ý, trình duyệt phát `appinstalled` và cửa sổ đang standalone. `appinstalled` trên Android có thể đến trước khi hoàn tất thêm app; phản hồi chỉ ghi trình duyệt đã nhận cài đặt. Cửa sổ app nhận qua `display-mode: standalone` hoặc `navigator.standalone`; không kết luận app chưa cài chỉ vì tab web thường không có tín hiệu. Tham khảo [installation prompt](https://web.dev/learn/pwa/installation-prompt) và [detection](https://web.dev/learn/pwa/detection).
- Nhận diện nền tảng chỉ để chọn hướng dẫn đầu tiên; người học đổi iPhone/iPad, Android hoặc máy tính được. Nút cài trực tiếp dựa trên sự kiện trình duyệt, không dựa user agent. Hướng dẫn lấy từ Apple/Google/Microsoft, nguồn trong [INSTALLATION.md](INSTALLATION.md).
- Giữ key và schema version 3. Bản cài, trình duyệt khác hoặc địa chỉ mới có thể có kho riêng; có đường tải/khôi phục bản sao. Localhost trên máy tính không phải link điện thoại. Chưa triển khai HTTPS công khai hoặc xác nhận cài trên thiết bị thật.
- Tiếp theo chọn DATA-001: chuẩn bị Supabase/Auth/migration và chính sách local khi đăng xuất. Chỉ đóng task sau khi có môi trường Supabase chạy thật và kiểm tra quyền bằng hai tài khoản; thiếu cấu hình dịch vụ không ngăn phần code/tài liệu độc lập.

## DEC-013 — Tài khoản bằng mã email và kho học theo chủ sở hữu

- Ngày: 2026-09-06. Triển khai DATA-001 trên Supabase Docker local; SDK 2.115.0, CLI 2.116.0, PostgreSQL 17. Chưa được cấp dự án cloud/SMTP; không cần dịch vụ hosted để kiểm tra quyền thật. Setup và nguồn chính thức ở [BACKEND.md](BACKEND.md).
- Chọn email OTP thay vì mật khẩu hoặc callback magic link để người học nhập mã ngay trong hash route. Email mới tạo Auth user, phải xác nhận mã mới có phiên. Hộp thư local giữ thư thử, không gửi ra ngoài; UI và tài liệu ghi rõ. Thiết lập giới hạn/gửi thư production cần kiểm tra khi có host.
- Chỉ nhận key công khai `sb_publishable_…`, không nhận JWT legacy hoặc `sb_secret_…`. Vite kiểm tra trước khi bundle để lỗi điền nhầm key không đưa bí mật vào client. URL phải là HTTPS origin hoặc HTTP loopback; cả hai biến trống vẫn dùng khách, cấu hình dở/sai dừng Vite. Đây là kiểm tra hai biến đã biết, không thay việc giữ mọi bí mật khỏi `VITE_*`.
- Server lưu Auth user và tên trong `account_profiles` khi người dùng chủ động lưu. Bảng giới hạn độ dài, thời điểm tạo do server cấp và RLS CRUD theo `auth.uid()`. Không tạo hồ sơ học cloud, không tự copy tên gọi học tập hoặc tải tiến độ lên. Hai tài khoản và request chưa đăng nhập phải được kiểm tra bằng Auth/RLS thật.
- Giữ schema học version 3; key khách cũ không đổi. Key tài khoản gồm origin backend và user ID, tránh dùng nhầm dữ liệu giữa các dự án/tài khoản. Đăng nhập mở kho riêng; đăng xuất quay lại kho khách; đăng nhập lại mở dữ liệu local đã giữ. Bản sao vẫn không gắn định danh để người học chủ động chuyển dữ liệu; nhập/xóa chỉ thay kho đang mở.
- Epoch tăng trước khi đổi kho, shell dựng lại toàn bộ form theo chủ sở hữu. Timer cũ và file import đã bắt đầu trước khi đổi người dùng không được ghi vào kho mới. Dữ liệu lỗi/quota chưa lưu vẫn được giữ riêng trong bộ nhớ trang; đóng trang khi chưa xuất bản sao có thể mất phần đó. Auth thay đổi qua tab, chưa hợp nhất ghi học đồng thời nhiều tab.
- Phiên SDK trong localStorage chỉ quyết định UI, không cấp quyền server. Auth/RLS xác minh JWT và chủ sở hữu của từng request. Kho học chưa mã hóa; ẩn theo tài khoản không chặn người đọc devtools/dữ liệu trên máy. Có hướng dẫn tải bản sao rồi xóa phần hiện tại khi dùng máy chung.
- Logout dùng scope `local`; nếu server lỗi nhưng SDK đã xóa phiên local, thông báo đúng trạng thái đã rời trình duyệt/chưa xác nhận thu hồi trên server. Không hứa access token hết hiệu lực tức thì; token có thể còn dùng đến expiry. Logout không xóa hàng tên, Auth user hoặc các bản sao học.
- DATA-002 là task tiếp theo: migration sự kiện, hàng đợi, gửi lặp/xung đột, đồng bộ hai phiên và nhập phần khách có lựa chọn rõ ràng. Mốc 2 chưa hoàn thành; chưa mở rộng sang AI, offline hoặc deployment.

## DEC-014 — Đồng bộ có phiên bản và xử lý xung đột rõ ràng

- Ngày: 2026-09-06. Đã triển khai DATA-002. Giữ StudyState/bản sao version 3; metadata đồng bộ chỉ ở kho trình duyệt, không nằm trong bản sao hợp lệ. Người học chủ động bật đồng bộ phần tài khoản trên trình duyệt; phần khách không được tự nhập hoặc gửi.
- Server có snapshot hiện tại và nhật ký commit bất biến với UUID gửi, phiên bản gốc, SHA-256 nội dung, các trường/lượt làm thay đổi và phiên bản máy chủ. Không chép lại toàn bộ lịch sử vào mỗi commit khi gõ câu mới; request vẫn gửi snapshot đầy đủ trong phạm vi dữ liệu nhỏ hiện tại. Một RPC khóa hàng theo chủ, kiểm tra phiên bản trước khi ghi và nhận lại cùng UUID/nội dung mà không ghi hai lần. Từ chối UUID tái dùng cho nội dung khác. Client không được ghi trực tiếp các bảng hoặc chọn chủ khác.
- Khi khác phiên bản, gộp ba phía (bản chung đã xác nhận, phần đang học, bản server): lịch sử hợp nhất theo ID; checkpoint cùng ID lấy số cộng dồn lớn nhất; lịch ôn dựng từ các lượt đã gộp theo thời gian/ID. Dữ liệu cũ thiếu lượt nguồn giữ lịch có sẵn, không bịa lịch sử đã mất.
- Bài dở, phiên hiện tại, hồ sơ hoặc cùng ID kết quả có hai sửa đổi khác nhau cần lựa chọn rõ. Giữ hai bản trong xung đột, cho xem/tải bản sao trước chọn. Không tự dùng snapshot gửi sau để xóa lịch sử của thiết bị khác.
- Outbox chứa đúng payload/UUID đang gửi, bản gốc và tiến độ hiện tại trong cùng một lần ghi localStorage. Gửi thành công nhưng mất response sẽ thử lại UUID cũ; chỉnh sửa trong lúc gửi còn lại cho lần sau. Không báo đã đồng bộ trước xác nhận. Lỗi quota hoặc dữ liệu không đọc được chặn gửi và giữ cảnh báo/bản gốc.
- Mỗi tài khoản chỉ một tab sửa kho học trong cùng origin, dùng Web Locks; tab khác có thể vào tài khoản/đăng xuất nhưng chờ tab giữ khóa đóng/rời tài khoản trước khi học. Hai browser context/thiết bị vẫn học độc lập và giải quyết xung đột qua phiên bản server. Nếu trình duyệt thiếu Web Locks, không bật đồng bộ; vẫn có chế độ học local.
- Đồng bộ khi có thay đổi, lấy lại focus, trở lại online, theo chu kỳ khi hiển thị hoặc bấm thử lại; không cần Realtime/background sync. Tạm hoãn khi hộp cài đặt đang mở để không thay nội dung chưa bấm lưu. Đổi chủ hoặc tắt đồng bộ hủy request và vô hiệu callback theo thế hệ. Request RPC mang chủ dự kiến và phải khớp `auth.uid()` để token đổi người không ghi sai chủ.
- Nhập phần khách có màn hình lựa chọn và giữ nguồn khách. Khôi phục JSON hoặc xóa dữ liệu trên thiết bị dừng đồng bộ tại trình duyệt đó, không xóa bản server; bật lại có thể tải bản server xuống. Chưa có nút xóa toàn bộ lịch sử server; không dùng reset local như xóa cloud.
- Backend vẫn chạy Docker local, chưa triển khai hosted/SMTP ngoài máy. RPC dùng quyền definer chỉ để bảo vệ đường ghi atomic, khóa search_path và kiểm tra chủ rõ ràng; quyền đọc bảng vẫn dùng RLS. Tham khảo [Supabase functions](https://supabase.com/docs/guides/database/functions), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [PostgreSQL transaction isolation](https://www.postgresql.org/docs/17/transaction-iso.html).

## DEC-015 — Gói công khai và mở lại khi mất mạng

- Ngày: 2026-09-07. PWA-002. Giữ StudyState version 3, localStorage/metadata đồng bộ và quy tắc chủ sở hữu. Dùng Cache Storage cho tài nguyên HTTP công khai, chưa chuyển tiến độ sang IndexedDB; không đưa dữ liệu Auth/câu trả lời vào cache dùng chung.
- Phạm vi gói đầu: bảy bài hiện tại, JSON văn bản/hoạt động và bảy WAV câu mẫu tạo bằng eSpeak NG 1.51, giọng formant en-us/145 từ mỗi phút. Audio thử nghiệm có transcript, không phải bản thu giáo viên; nguồn/quyền lưu và giới hạn ở [OFFLINE.md](OFFLINE.md).
- Build tạo allowlist, byte/hash tài nguyên và worker, kiểm tra học liệu trùng bản gói. Shell được lưu khi worker cài; tải gói cần thao tác người học. Marker hoàn tất sau khi đủ file có SHA-256 đúng; thiếu mạng/quota giữ trạng thái chưa đầy đủ, có kiểm tra/thử lại/xóa riêng.
- Worker xử lý range cho WAV, không cache API/Auth/Authorization/query/origin ngoài. Lệnh tải/xóa xếp hàng và không nhận URL tùy ý. Xóa gói giữ shell, tiến độ và outbox; chỉ dọn cache có prefix dự án.
- Không skipWaiting hoặc reload cưỡng bức; bản mới chờ các cửa sổ cũ đóng. Shell HTML được trả theo worker hiện tại để tránh trộn code; activation dọn cache cũ và giữ gói cùng phiên bản. Gói đổi cần tải lại. Tham khảo [vòng đời service worker](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers) và [cache/thu hồi dung lượng](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Caching).
- Khôi phục chủ local từ phiên SDK đã lưu trước khi chờ làm mới token, vì tín hiệu navigator.onLine có thể không phản ánh kết nối Internet thực. Chỉ chọn kho trên máy, không cấp quyền server; UI ghi đang mở bản lưu, sync hoãn đến khi SDK xác nhận phiên. SIGNED_OUT thực vẫn chuyển về khách. Khi SDK thông báo, engine được đánh thức ở task kế tiếp để không gọi API trong auth lock.
- Chỉ đăng ký worker trong bản build. `preview:local` build với cấu hình công khai của Supabase Docker rồi mở cổng 4175 riêng; cổng khác là kho khác. Không tự triển khai hosted; không thay kiểm thử iOS/Android thật bằng viewport Chrome.

## DEC-016 — Nhắc học theo thiết bị, có lựa chọn rõ ràng

- Ngày: 2026-09-07. NOTIFY-001 đã triển khai. Chọn Web Push với bộ gửi Node và Supabase local hiện hữu, không dùng timer trong tab để hứa nhắc khi đóng app. Mặc định tắt; người học chọn bật/quyền trình duyệt, giờ/ngày/múi giờ và giờ yên lặng. Chưa triển khai công khai hoặc gửi cho người học thật.
- Mỗi trình duyệt/origin có một thiết bị nhắc cho chủ hiện tại; lịch/subscription có RLS riêng và revision để tránh ghi đè từ tab cũ. Đăng xuất/đổi chủ tắt binding local và hủy subscription; không tự bật lại cho tài khoản mới. Lịch không nhập theo bản sao học và không làm thay đổi StudyState version 3.
- PostgreSQL chọn lần nhắc tiếp theo theo IANA timezone; bỏ giờ không tồn tại khi DST tiến, dùng lần sau khi giờ lặp theo quy tắc PostgreSQL. Chỉ gửi tối đa một lượt/thiết bị/ngày địa phương, bỏ lượt quá một phút, kiểm tra giờ yên lặng trước gửi. Dời một lần giữ lịch lặp. Ghi nhận attempt trước gọi dịch vụ; không retry kết quả mạng chưa rõ để tránh nhắc trùng, có thể bỏ lỡ một lần nếu tiến trình dừng.
- VAPID private key chỉ trong `.local` của bộ gửi, public key đọc từ cấu hình máy chủ. Chỉ chấp nhận endpoint push HTTPS của nhà cung cấp hỗ trợ, không cho URL tùy ý làm request máy chủ. Payload chỉ là lời nhắc chung, không có câu trả lời/tên/email/band. TTL 0 tránh lưu thông báo để dồn khi thiết bị có mạng lại; dịch vụ nhận không đồng nghĩa OS đã hiển thị.
- Chrome headless Windows đã đăng ký/gửi/nhận qua FCM thật khi không còn trang app mở; `getNotifications()` xác nhận worker đã đăng ký thông báo. Chưa quan sát màn hình OS, tắt cả trình duyệt hoặc thử iPhone/Android. Probe chỉ claim ID thiết bị do nó tạo; không thay lịch của tài khoản local khác. Chi tiết và retention còn thiếu ở [NOTIFICATIONS.md](NOTIFICATIONS.md).
- Nguồn: [WebKit Home Screen Web Push](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/), [MDN subscribe](https://developer.mozilla.org/en-US/docs/Web/API/PushManager/subscribe), [showNotification](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/showNotification), [web-push Node](https://github.com/web-push-libs/web-push), [PostgreSQL timestamp/DST](https://www.postgresql.org/docs/17/datetime-invalid-input.html).

## DEC-017 — Nền tảng AI có hạn mức và thử nghiệm có đối chiếu

- Ngày: 2026-09-07. AI-001 IN_PROGRESS. Chưa có API key/ngân sách được xác nhận; gọi AI mặc định tắt, ngân sách 0 USD. Có adapter ứng viên OpenAI Responses cho một câu nền tảng, chưa chốt nhà cung cấp thắng thử nghiệm. Chọn snapshot `gpt-4.1-mini-2025-04-14` làm mốc thử đầu vì hỗ trợ JSON schema, không có bước reasoning và chi phí văn bản rõ; không gọi đây là lựa chọn chất lượng tốt nhất hoặc model mới nhất.
- Server Node 22 có HTTP/fetch/type stripping sẵn; dùng SDK Supabase và Zod đã cài, không thêm dependency. API `/api/ai/*` qua proxy cùng origin tới loopback 8787. Server xác minh JWT thật, đối chiếu owner, giới hạn body/text/output/thời gian, dùng endpoint/model cố định và không có tool cho model gọi. Client không được chọn model/URL/hạn mức hoặc đưa system prompt tùy ý.
- Trường hợp đầu là một gợi ý cho câu tự viết cuối bài; chưa làm luồng Writing/Speaking đầy đủ. Phản hồi ngắn bằng tiếng Việt, trích đúng đoạn câu đầu vào, một điểm sửa và bước tự làm tiếp, không thay câu/đổi lịch ôn/gán band. Schema và quote check chỉ chặn lỗi cấu trúc/bằng chứng giả; không chứng minh nhận xét đúng ngôn ngữ. Bộ mẫu cần đối chiếu thật trước đóng AI-001.
- Bảng ngân sách/receipt riêng, giữ chỗ 0,01 USD/lượt trước gọi; dùng dự toán theo token nhận được để quyết toán. Kết quả chi phí chưa rõ giữ nguyên chỗ đã đặt. Trần thử tích lũy do người dùng cấu hình, tối đa 10 USD trong bản local; 10 lượt/người/ngày UTC, cách 20 giây, tối đa hai request đang xử lý. Restart/xóa tài khoản không làm mới tổng đã tính. Mặc định 0, không có khoản chi được tự suy ra từ đề xuất.
- Request ID cùng hash được lưu trước gửi ở client, receipt server chống gửi lặp và replay trong 24 giờ; ID cũ khác nội dung bị từ chối. Phản hồi cache riêng theo chủ, dọn sau 24 giờ khi server chạy; metadata hạn mức không tự xóa. Không lưu nguyên câu/prompt trong bảng receipt hoặc log. Response có thể chứa trích đoạn câu, cần thông báo và đồng ý gửi ngay trong bài.
- `store:false` giảm trạng thái lưu phía Responses API, không có nghĩa không còn log của nhà cung cấp. Chỉ gửi câu + ngữ cảnh bài, không gửi email/hồ sơ/audio. UI ghi rõ nguồn/thử nghiệm; fixture chỉ có trong kiểm thử với nhãn riêng, không phải AI thật. `.local/ai.env` chỉ được Node nạp, không dùng VITE cho bí mật.
- Nguồn đã đối chiếu: [model/giá GPT-4.1 mini](https://developers.openai.com/api/docs/models/gpt-4.1-mini) (0,40 USD input/1,60 USD output mỗi triệu token, standard, tại ngày kiểm tra), [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs), [chính sách dữ liệu API](https://developers.openai.com/api/docs/guides/your-data). Kiểm tra lại giá, quyền truy cập tài khoản và chất lượng trước bật thật; ước tính trong app không thay hóa đơn nhà cung cấp.

## DEC-018 — Bốn tuần học liệu, tiếp tục độc lập khi AI chờ cấu hình

- Ngày 2026-09-07. CONTENT-002 đã triển khai và kiểm tra trong phạm vi học liệu thử nghiệm; phụ thuộc CONTENT-001/LEARN-001 đã đạt. AI-001 vẫn chờ key/ngân sách/đối chiếu thật, không tự bật dịch vụ hoặc bỏ điều kiện để sang AI-002/003. Tiếp tục học liệu độc lập theo yêu cầu phát triển app.
- Giữ nguyên ID/câu hỏi/đáp án bảy bài đầu để không thay nghĩa dữ liệu cũ. Bổ sung 21 bài và bốn bài kiểm tra cuối tuần, nhóm thành bốn tuần gợi ý (bảy bài và một kiểm tra/tuần). Tuần là nhóm nội dung, không khóa theo lịch, không hứa học hết là đạt CEFR/IELTS; có thể dành nhiều ngày cho một bài.
- Bài mới có mục tiêu, đọc ngắn, tự nhớ, nghe ngữ cảnh mới có transcript xem như gợi ý, tự nói và viết có tiêu chí tự xem lại. Không thu âm/chấm phát âm hoặc gọi tự nhận xét là đánh giá giáo viên. Giữ ba câu đóng/bài và StudyState version 3; kết quả kiểm tra ghi theo cơ chế học hiện có, không là thi chuẩn hóa.
- Dùng câu/đoạn biên soạn mới và giọng eSpeak NG thử nghiệm, đóng gói offline bằng hash. Hồ sơ rà soát nội bộ/phạm vi và nguồn ngữ pháp ghi cùng học liệu; chưa có giáo viên độc lập duyệt audio/bộ bài. Phản hồi đóng giữ nguồn biên soạn, AI chỉ là gợi ý tùy chọn đã tách.
- Danh mục lớn hơn làm lộ giới hạn schema kế hoạch vốn tối đa 10 hoạt động. Chặn bộ ghép phiên ở cùng giới hạn, hiển thị thời gian chưa xếp; giữ schema version 3 thay vì thay đổi bản sao không cần thiết. Gói 57 WAV + JSON vẫn xác minh từng file; báo tiến độ mỗi tám file và quét đầy đủ cuối lượt để giảm số lần đọc cache.

## DEC-019 — Phiên thích ứng có lý do, giữ kế hoạch đã bắt đầu

- Ngày 2026-09-07, ADAPT-001 đã triển khai và kiểm tra trong phạm vi quy tắc thử nghiệm. Dùng quy tắc xác định được từ dữ liệu học hiện có, không gọi AI hoặc tự suy band. Metadata kiến thức tiên quyết nằm riêng học liệu, không sửa ID/câu/âm thanh cũ. Hoàn thành bài chỉ mở đường gợi ý, không là xác nhận thành thạo; người học vẫn tự chọn bài ở Khám phá.
- Chọn ôn đến hạn với trần ba; một bài cần luyện thêm từ kết quả gần nhất trước sở thích. Đi theo tuần và quan hệ bài trước; xen lựa chọn sở thích trong các bài sẵn sàng gần nhất để không bỏ kiến thức khác. Mọi bài đầy đủ giữ hoạt động nghe/đọc/tự nói/viết; dữ liệu cũ chỉ cho biết kết quả bài/truy hồi, không đủ chẩn đoán từng kỹ năng nói/viết.
- Nhịp mệt/khó/quay lại giới hạn một bài đầy đủ và một hoặc hai câu ôn; “khó quá” gợi ý phiên hai phút về câu nền tảng liên quan, giữ bài dở. Sau ít nhất bảy ngày không có lượt học ghi nhận, mời quay lại nhẹ; ngưỡng là lựa chọn sản phẩm cần thử nghiệm, không là kết luận tâm lý. Người học có thể đổi nhịp/thời gian.
- PlanItem thêm reason tùy chọn, plan/lịch sử thêm adaptation tùy chọn (nhịp, phiên bản quy tắc), vẫn StudyState 3/đọc 1/2/3. Không thay schema bắt buộc hoặc backend; bản cũ có thể bỏ metadata này nhưng đọc được danh sách/kết quả. Các máy nên dùng bản mới để giữ lý do/nhịp qua sync. Chốt danh sách/lý do khi tạo; không tự thay giữa bài, qua reload hoặc khi đổi ngày. Thay phiên giữ xác nhận hiện có, lưu lịch sử và giữ draft.

- Sau ADAPT-001, tách DEPLOY-001 từ phần chuẩn bị triển khai của BETA-001 để tiếp tục artifact/cấu hình/hướng dẫn độc lập khi AI chờ key/ngân sách. Không mở rộng sang app native hoặc tự coi beta đã hoàn chỉnh/phát hành. BETA-001 thêm phụ thuộc DEPLOY-001; việc triển khai thật vẫn theo phạm vi được cho phép.

## DEC-020 — Artifact phát hành riêng, triển khai khách trước

- Ngày 2026-09-07, DEPLOY-001. Tạo release mới trong `.local/releases`, không thay bản trước hoặc build Auth local. Build qua Vite API với configFile/envDir tắt, không tự công khai biến env; chỉ nhận JSON public đã kiểm tra. Ép production và AI tắt trong release. Bản tài khoản hiện chỉ chấp nhận Supabase hosted chuẩn, chưa hỗ trợ custom domain; không tự tạo backend/SMTP.
- Artifact gồm static site, 404 thật cho path thiếu và `_headers` cho Cloudflare Pages. Chọn Direct Upload làm ví dụ triển khai có thể chuẩn bị độc lập, chưa chọn thay người dùng tài khoản/project hoặc public site. Không thêm SDK hosting/dependency/CI có token. Preview 4176 áp cùng quy tắc HTTP, chỉ phục vụ danh sách file đã xác minh, không proxy AI local.
- Bản kê ngoài web root ghi revision/dirty/hash và schema. Thư mục bất biến theo lượt build giúp kiểm tra/quay lui; không là bản sao dữ liệu học viên, chữ ký xác thực hoặc xác nhận đã triển khai. Giữ origin qua update, đợi worker kích hoạt và kiểm tra tương thích dữ liệu trước rollback; không xóa storage để sửa cache.
- Tách DEPLOY-002 cho hành động phát hành/kiểm tra URL thật. Điều kiện còn thiếu là tài khoản/project hosting có quyền triển khai và origin được chọn, được ghi cụ thể ở DEPLOYMENT/STATUS. Bản khách không cần chờ AI; BETA-001 vẫn cần AI và kiểm tra thiết bị thật.

## DEC-021 — Vercel frontend, Render backend, Supabase hosted

- Trạng thái từ 2026-09-10: lựa chọn DB được thay bằng Neon theo DEC-022; cấu hình/code Supabase đã viết vẫn là hiện trạng, không là đích triển khai mới.
- Ngày 2026-09-07, người dùng chọn rõ ba dịch vụ và xác nhận chưa tạo project; yêu cầu hướng dẫn từ đầu. Lựa chọn này thay hướng Pages mặc định của DEC-020. DEPLOY-002 IN_PROGRESS phần cấu hình/hướng dẫn, chưa có deployment thật hoặc bật AI trả phí.
- Giữ browser → Supabase Auth/RLS/RPC cho tài khoản/sync; Vercel chỉ proxy các route AI/health đã định nghĩa sang Render. Dùng Vercel Build Output API v3 để sinh CSP/header/cache theo đúng URL public lúc build, tránh sửa URL cứng trong source. Framework Other, không override dist; chỉ ba env public được chọn, bỏ qua .env/biến khác. Bản release:build độc lập vẫn guest/account với AI tắt như cũ.
- Render dùng server/production.ts, PORT/0.0.0.0/healthz, URL hosted và secret key, origins chính xác và ngân sách riêng tồn tại trong DB. APP_ORIGINS có thể trống khi boot đầu và được điền sau khi có URL Vercel. Blueprint không ghi đè origin đã nhập khi sync tiếp. Khởi động kiểm tra RPC; health chỉ báo HTTP liveness, không hứa DB luôn sẵn sàng. Chưa triển khai worker nhắc hoặc AI đã đối chiếu.
- Giới hạn Node nhánh 22 trong package/lockfile để Vercel không tự chọn nhánh mới ngoài bản đã kiểm tra; Render NODE_VERSION 22.18.0 theo môi trường thử. Không đổi dependency version. Mã nguồn Vercel không có Git checkout có thể lấy SHA từ System Environment Variables, dirty để null, không tự tuyên bố checkout sạch.
- Trình tự vận hành Supabase (tám migration + OTP/SMTP) → Render → Vercel → quay lại APP_ORIGINS/Site URL. Khóa riêng chỉ nhập Dashboard, không đưa chat/Git/browser. Ghi rõ SMTP mặc định giới hạn người nhận, Render Free có ngủ và chưa có thử điện thoại/cloud; hướng dẫn chi tiết tại DEPLOY_VERCEL_RENDER_SUPABASE.

## DEC-022 — Sửa DB thành Neon, giữ Vercel và Render

- Ngày 2026-09-10, người dùng đính chính “nhầm tôi dùng db neon” trong lúc yêu cầu hướng dẫn deploy từ đầu. Vercel frontend + Render backend được giữ; Neon PostgreSQL thay lựa chọn Supabase DB của DEC-021. Chưa nhận tên/URL project được tạo, chưa triển khai cloud.
- DOC-002 cập nhật hướng dẫn và bàn giao; DATA-003 chuyển implementation trước khi hoàn tất DEPLOY-002. Code còn gọi Supabase Auth/PostgREST/RPC, các migration phụ thuộc auth.users/auth.uid và role Supabase. Không thể chuyển bằng đổi connection string; không áp nguyên migration cũ vào Neon.
- Giả định triển khai để tiến hành phần độc lập: hướng đến ba nền tảng đã chọn, không yêu cầu tạo Supabase hosted riêng cho Auth. Ưu tiên đánh giá Neon Auth (Managed Better Auth, beta tại thời điểm tra cứu) để giữ email OTP; đây là lựa chọn kỹ thuật đề xuất, không phải yêu cầu Auth đã được người dùng xác nhận hay chức năng hoàn thành. Chốt SDK/session/JWT/email sau kiểm tra tương thích trong DATA-003; không tự đổi sang mật khẩu hoặc viết Auth từ đầu.
- Luồng dữ liệu đích: browser → Vercel → Render → Neon. Render xác thực chủ trước truy cập DB; kết nối ứng dụng quyền giới hạn, migration có quyền riêng, không lấy ID chủ từ payload làm căn cứ cấp quyền. Bảo toàn giao dịch CAS/receipt/outbox, hạn mức AI và kiểm tra chéo hai tài khoản. Không đưa chuỗi PostgreSQL vào VITE, không dựng auth.uid giả hoặc tắt quyền để migration chạy.
- Giữ kho local, schema StudyState v3/đọc 1/2/3, ID nội dung, backup và dữ liệu Supabase cũ trong lúc chuyển. ID Auth có thể khác; không tự ghép dữ liệu theo email hoặc nhập khách. Chưa xác minh có dữ liệu cloud cũ, không mặc định được phép xóa/reset.
- Hướng dẫn mới tại [DEPLOY_VERCEL_RENDER_NEON.md](DEPLOY_VERCEL_RENDER_NEON.md). Có thể tạo project Neon/kiểm tra SELECT trước khi sửa app. render.yaml/start:backend/build:vercel/.env.example vẫn là cấu hình Supabase; chưa hướng dẫn nhập env mới như thể code đã đọc được. Bản release khách độc lập không đổi. Giữ AI tắt/ngân sách 0, worker nhắc production là phần chưa có.
- Nguồn đã đối chiếu: [Neon connection](https://neon.com/docs/connect/connect-from-any-app), [Neon Auth](https://neon.com/docs/auth/overview), [React SDK](https://neon.com/docs/auth/quick-start/react), [Email OTP](https://neon.com/docs/auth/guides/plugins/email-otp). Kiểm tra lại phiên bản/thực tế dịch vụ lúc viết adapter; không áp hướng dẫn Stack Auth cũ như bản Managed Better Auth hiện tại.

## DEC-023 — Triển khai adapter Neon và proxy Auth cùng origin

- Ngày 2026-09-10, người dùng đã mở form Render/Vercel và hỏi cách điền. DATA-003 được triển khai để các lệnh/env trong hướng dẫn có code thực thi; thay hiện trạng Supabase-only ghi ở DEC-022. Supabase local giữ nguyên cho regression và xuất bản sao, không xóa/ghép dữ liệu theo email.
- Dùng Neon Managed Better Auth qua allowlist REST email OTP/session/token/sign-out. Lần cài SDK beta gặp peer dependency/npm edgesOut; không dùng force hoặc tắt kiểm tra dependency. REST adapter nhỏ chỉ quản lý vòng đời client, không tự triển khai cơ chế xác thực. Neon Auth/email hosted vẫn phải thử trong DEPLOY-002; fixture không thay bằng chứng dịch vụ thật.
- Cookie HttpOnly được proxy Vercel → Render → Neon và gắn vào origin app, Path /api/auth, giữ Secure. Chỉ owner hint lưu local; token trong bộ nhớ. Chặn callback cũ/refresh trong khi logout/verify; lỗi mạng không bỏ kho offline. Origin chính xác bắt buộc với POST cookie.
- Render dùng pg/Jose, xác minh JWT theo JWKS/EdDSA/issuer/audience/expiry/verified email/UUID trước gọi SQL. Dữ liệu chỉ đi qua action API cố định, không SQL tùy ý hoặc Neon Data API từ browser. Mỗi transaction SET LOCAL role/actor; RLS và CAS/receipt bảo toàn. Migration riêng trong schema moi_ngay, role runtime tạo bằng SQL để tránh quyền neon_superuser của Console-created role. Không giả lập auth.uid/schema Auth nhà cung cấp.
- Build Vercel chọn Other/Build Output v3, chỉ nhận VITE_NEON_AUTH_URL và RENDER_API_URL; proxy Auth/data/AI/health no-store. Backend yêu cầu DATABASE_URL runtime/TLS, NEON_AUTH_BASE_URL; APP_ORIGINS điền sau URL Vercel. Khóa SQL không đi vào bundle/log.
- Schema nhắc/budget được port và kiểm tra local; Neon production vẫn tắt AI/0 và chưa có worker nhắc. Hoàn tất tích hợp provider và kiểm tra chi phí ở AI-001, không tự mở khoản chi. DATA-003 DONE phần code/local; DEPLOY-002 tiếp tục migration/Auth/SMTP/cloud/thiết bị thật.
- Chi tiết tại [NEON_BACKEND.md](NEON_BACKEND.md), hướng dẫn vận hành tại [DEPLOY_VERCEL_RENDER_NEON.md](DEPLOY_VERCEL_RENDER_NEON.md). Nguồn hiện hành: [JWT](https://neon.com/docs/auth/guides/plugins/jwt), [Email OTP](https://neon.com/docs/auth/guides/plugins/email-otp), [Auth flow](https://neon.com/docs/auth/authentication-flow), [roles](https://neon.com/docs/manage/roles).

## Các giả định/chọn lựa còn mở (hiện tại)

| Mã | Vấn đề | Mặc định hiện tại | Thời điểm cần làm rõ |
| --- | --- | --- | --- |
| OPEN-001 | Cá nhân hay nhiều học viên | Ưu tiên cá nhân, chưa được xác nhận riêng | Trước tính năng quản lý học viên/kinh doanh |
| OPEN-002 | Academic hay General Training | Không tự điền loại thi; nền tảng dùng chung | Onboarding và trước xây học liệu luyện thi |
| OPEN-003 | Đầu vào, thời gian, ngày thi, điểm tối thiểu từng kỹ năng | Đã có form thời gian/ngày mục tiêu và tự nhận xét; chưa có đánh giá đầu vào hoặc yêu cầu band từng kỹ năng | Trước kế hoạch luyện thi cá nhân |
| OPEN-004 | Nhà cung cấp và ngân sách AI | Chưa chọn, không giả định có API key | AI-001 |
| OPEN-005 | Project hosting, Neon, tên miền và Auth | Neon production/neondb Singapore; Auth Base URL đã thấy và lưu công khai trong STATUS. Render app_ielts build đạt nhưng startup sai role DATABASE_URL; chưa xác minh migration/OTP/URL Live | DEPLOY-002: sửa runtime role/redeploy Render rồi Vercel/origin/kiểm tra hai tài khoản; secret giữ riêng |
| OPEN-006 | Đánh giá lại thuật toán lịch ôn | Đã có lịch khởi đầu DEC-009; cần hiệu chỉnh theo dữ liệu | Sau thử nghiệm sử dụng và trước mở rộng |
| OPEN-007 | Thời gian lưu audio và bài cá nhân trên cloud | Chưa chốt, chưa thu thập dữ liệu thật | Trước upload dữ liệu thật và AI-002 |
| OPEN-008 | Người kiểm duyệt/giáo viên đối chiếu bài | Chưa bố trí | Trước phê duyệt học liệu beta và đánh giá AI |

Khi quyết định thay đổi, thêm hoặc cập nhật mục có ngày, lý do và task chịu ảnh hưởng. Không xóa lịch sử thay đổi quan trọng khỏi nhật ký session.
