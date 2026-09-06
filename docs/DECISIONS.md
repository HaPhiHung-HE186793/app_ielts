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
- Buổi đầy đủ dùng phút/ngày đã khai báo, mặc định 30 nếu chưa thiết lập. Chỉ có bảy bài, vì vậy buổi 60 phút ban đầu chỉ xếp được khoảng 35 phút. Giao diện phân biệt phần đã xếp, ngân sách và phần chưa có học liệu. Không đo phút thực tế trong task này.
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

## Các giả định/chọn lựa còn mở

| Mã | Vấn đề | Mặc định hiện tại | Thời điểm cần làm rõ |
| --- | --- | --- | --- |
| OPEN-001 | Cá nhân hay nhiều học viên | Ưu tiên cá nhân, chưa được xác nhận riêng | Trước tính năng quản lý học viên/kinh doanh |
| OPEN-002 | Academic hay General Training | Không tự điền loại thi; nền tảng dùng chung | Onboarding và trước xây học liệu luyện thi |
| OPEN-003 | Đầu vào, thời gian, ngày thi, điểm tối thiểu từng kỹ năng | Đã có form thời gian/ngày mục tiêu và tự nhận xét; chưa có đánh giá đầu vào hoặc yêu cầu band từng kỹ năng | Trước kế hoạch luyện thi cá nhân |
| OPEN-004 | Nhà cung cấp và ngân sách AI | Chưa chọn, không giả định có API key | AI-001 |
| OPEN-005 | Hosting, dự án Supabase, tên miền | Chưa cấp cấu hình; local trước | DATA-001 và bản triển khai beta |
| OPEN-006 | Đánh giá lại thuật toán lịch ôn | Đã có lịch khởi đầu DEC-009; cần hiệu chỉnh theo dữ liệu | Sau thử nghiệm sử dụng và trước mở rộng |
| OPEN-007 | Thời gian lưu audio và bài cá nhân trên cloud | Chưa chốt, chưa thu thập dữ liệu thật | Trước upload dữ liệu thật và AI-002 |
| OPEN-008 | Người kiểm duyệt/giáo viên đối chiếu bài | Chưa bố trí | Trước phê duyệt học liệu beta và đánh giá AI |

Khi quyết định thay đổi, thêm hoặc cập nhật mục có ngày, lý do và task chịu ảnh hưởng. Không xóa lịch sử thay đổi quan trọng khỏi nhật ký session.
