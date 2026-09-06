# Danh sách task phát triển

Cập nhật: 2026-09-06. Thực hiện theo thứ tự ưu tiên và phụ thuộc, không coi các tính năng dự kiến là đã có. Trạng thái tổng quan ở [STATUS.md](STATUS.md).

## Quy ước

- `TODO`: đã xác định, chưa bắt đầu.
- `READY`: task được chọn để bắt đầu tiếp theo; các phụ thuộc đã hoàn thành.
- `IN_PROGRESS`: đang thực hiện.
- `BLOCKED`: không thể tiếp tục task do một điều kiện cụ thể; ghi điều kiện trong STATUS, vẫn làm task độc lập nếu có.
- `DONE`: đáp ứng tiêu chí và đã chạy kiểm tra phù hợp.

Mỗi task hoàn thành cần cập nhật trạng thái, kiểm tra và bàn giao. Không đánh dấu DONE chỉ vì đã dựng giao diện mẫu. Các giai đoạn dưới đây là thứ tự phát triển, không phải cam kết thời gian.

## Mốc 0 — Lưu định hướng và bàn giao

| ID | Trạng thái | Phụ thuộc | Kết quả và tiêu chí hoàn thành |
| --- | --- | --- | --- |
| DOC-001 | DONE | Không | Có README, AGENTS, PRODUCT, ARCHITECTURE, DECISIONS, TASKS, STATUS, SESSION_LOG và gitignore; liên kết nội bộ hợp lệ, trạng thái nhất quán, task tiếp theo rõ ràng. Kết quả commit/push được xác minh bằng Git và báo trong bàn giao. |

## Mốc 1 — Một phiên học hoàn chỉnh trên máy local

| ID | Trạng thái | Phụ thuộc | Kết quả và tiêu chí hoàn thành |
| --- | --- | --- | --- |
| APP-001 | DONE | DOC-001 | Khởi tạo React + TypeScript + Vite; có lockfile, scripts dev/build/lint/typecheck, màn hình khởi động tiếng Việt; chạy được và hướng dẫn README chính xác. |
| APP-002 | DONE | APP-001 | Layout ưu tiên điện thoại và điều hướng năm khu vực; dùng được bàn phím, có focus/nhãn; kiểm tra 360px và desktop, không tràn ngang. Mục chưa làm có trạng thái trung thực. |
| CONTENT-001 | DONE | APP-001 | Có 7 bài nền tảng với mục tiêu, hoạt động, giải thích và hồ sơ nguồn/rà soát trong CONTENT_REVIEW. Hiển thị học liệu thử nghiệm do trợ lý rà soát nội bộ, chưa có giáo viên độc lập xác nhận; chưa gọi là nội dung chính thức. |
| LEARN-001 | DONE | APP-002, CONTENT-001 | Chọn bài → làm hoạt động → xem phản hồi → thử lại → hoàn thành; phân biệt đúng độc lập và sau gợi ý. Kiểm tra chấm đáp án, tránh hoàn thành hai lần khi nhấn lặp. |
| LEARN-002 | DONE | LEARN-001 | Lưu tiến độ và bài dở vào local qua lớp dữ liệu riêng; đóng/mở lại tiếp tục được. Hiển thị giới hạn lưu local, xử lý lỗi lưu và thay đổi phiên bản dữ liệu có chủ đích. |
| PLAN-001 | DONE | LEARN-002 | Onboarding lưu sở thích, thời gian, mục tiêu và loại thi chưa xác định nếu cần; Hôm nay chọn 2/5/15 phút hoặc buổi đầy đủ. Phiên hữu hạn, lưu qua reload, khởi động tách khỏi bài đầy đủ; đọc dữ liệu version 1 sang 2. Không tự tạo band đầu vào hoặc hứa mục tiêu chưa có đánh giá. |
| REVIEW-001 | DONE | LEARN-002 | Lịch ôn DEC-009 từ kết quả thật, điền đáp án trước phản hồi; sai/có gợi ý ôn lại sau 10 phút. Kiểm tra qua ngày, reload, nộp trùng và gián đoạn; xem thẻ không đổi lịch. |
| PROGRESS-001 | DONE | PLAN-001, REVIEW-001 | Tiến bộ từ dữ liệu thật, lịch sử phiên hoàn tất/thay, bộ lọc và biểu đồ bảy ngày; đo hoạt động có idle/focus/visibility, checkpoint chống trùng, đọc version 1/2 sang 3. Giữ giờ cũ là chưa có dữ liệu; không suy band từ phút hoặc XP. |

Điều kiện đạt mốc 1: một người mở app local, hoàn thành bài, đóng/mở lại, ôn một mục đến hạn và thấy tiến độ được lưu đúng.

## Mốc 2 — Tài khoản, đồng bộ và dùng trên thiết bị

| ID | Trạng thái | Phụ thuộc | Kết quả và tiêu chí hoàn thành |
| --- | --- | --- | --- |
| DATA-001 | DONE | LEARN-002 | Supabase Docker local, email OTP thật, migration account_profiles/RLS và cấu hình mẫu công khai. Tách kho khách/tài khoản, bảo vệ callback/import khi đổi chủ. Kiểm tra quyền bằng hai tài khoản và 11 ca Auth/API/trình duyệt đạt; setup ở BACKEND. Chưa cấu hình hosted/SMTP thật hoặc đồng bộ. |
| DATA-002 | READY | DATA-001, REVIEW-001, PROGRESS-001 | Đồng bộ lượt làm, tiến độ và trạng thái ôn; nhập tiến độ local sau đăng nhập theo lựa chọn rõ ràng. Kiểm tra hai phiên/thiết bị, mất mạng, gửi lặp, xung đột và đăng xuất; hiển thị trạng thái đồng bộ. |
| PWA-001 | DONE | APP-002, LEARN-002 | Manifest/icon/standalone, hướng dẫn và prompt tự nguyện; Chrome đọc manifest/icon và không báo lỗi installability trong hồ sơ thử riêng. Luồng prompt/standalone có kiểm tra điều khiển; chưa cài/khởi chạy trên iPhone/Android hoặc cửa sổ app hệ điều hành. Phạm vi và bước xác minh ở INSTALLATION/TESTING. |
| PWA-002 | TODO | PWA-001, DATA-002 | Tải một gói bài/audio được phép lưu; mở và học offline, chờ gửi khi có mạng. Có quản lý dung lượng/xóa tải xuống; không rò cache giữa tài khoản, không giả lập AI offline. |
| NOTIFY-001 | TODO | PWA-001, DATA-001, PLAN-001 | Nhắc học tự nguyện, múi giờ và giờ yên lặng, tắt/dời lịch được. Xin quyền từ thao tác người dùng, xử lý từ chối; xác minh nền tảng hỗ trợ, không phụ thuộc thông báo để vào bài. |

Điều kiện đạt mốc 2: dùng cùng tài khoản để tiếp tục trên hai thiết bị và học phần đã tải khi mất mạng, với giới hạn được hiển thị rõ.

## Mốc 3 — Gia sư AI và bản beta nền tảng

| ID | Trạng thái | Phụ thuộc | Kết quả và tiêu chí hoàn thành |
| --- | --- | --- | --- |
| AI-001 | TODO | DATA-001 | Chọn nhà cung cấp từ thử nghiệm chất lượng/độ trễ/chi phí, ghi ngân sách và hạn mức; API máy chủ có xác thực, validation, timeout và giới hạn dùng. Kiểm tra không lộ secret và lỗi dịch vụ không làm mất bài. Không ghi AI thật hoạt động khi chỉ có mock. |
| AI-002 | TODO | AI-001, LEARN-001 | Luyện nói: xin quyền mic, ghi/hủy/nghe lại/gửi, nhận phản hồi và thử lại. Chốt thời gian lưu/xóa trước audio thật; đối chiếu mẫu. Chỉ nhận xét phát âm khi thực sự xử lý âm thanh phù hợp. |
| AI-003 | TODO | AI-001, LEARN-001 | Luyện viết: lưu nháp → nộp → gợi ý theo mức độ → tự sửa → so sánh. Phản hồi có căn cứ, giới hạn và nguồn; kiểm tra tập bài đối chiếu, xử lý phản hồi sai/timeout. |
| CONTENT-002 | TODO | CONTENT-001, LEARN-001 | Mở rộng bốn tuần nền tảng với bốn kỹ năng, mục tiêu và bài kiểm tra; có hồ sơ kiểm duyệt và nguồn/quyền sử dụng. Kiểm tra bài mới phù hợp độ khó, không chỉ tăng số lượng. |
| ADAPT-001 | TODO | PLAN-001, REVIEW-001, PROGRESS-001, CONTENT-002 | Xếp bài theo kiến thức tiên quyết, ôn đến hạn, điểm yếu và sở thích; có “khó quá”, “hôm nay mệt”, quay lại sau nghỉ. Kiểm tra không dồn bài nợ và không bỏ toàn bộ kỹ năng yếu chỉ vì ít thích. |
| BETA-001 | TODO | DATA-002, PWA-002, AI-002, AI-003, CONTENT-002, ADAPT-001, NOTIFY-001 | Chuẩn bị bản triển khai, cấu hình, hướng dẫn dùng/khôi phục/xóa dữ liệu và kiểm tra luồng chính trên web/iOS/Android. Thử nghiệm học theo lịch, ghi phản hồi và hạn chế. Việc phát hành thực tế chỉ thực hiện trong phạm vi đã được cho phép. |

Điều kiện đạt mốc 3: người học có thể mở app hằng ngày, dùng học liệu bốn tuần và nhận phản hồi AI đã được kiểm tra trong phạm vi công bố. Không coi beta này là đã hoàn thành chương trình luyện IELTS sáu tháng.

## Mốc 4 — Luyện IELTS và mở rộng khi có nhu cầu

| ID | Trạng thái | Phụ thuộc | Kết quả và tiêu chí hoàn thành |
| --- | --- | --- | --- |
| IELTS-001 | TODO | BETA-001 | Hoàn thiện nhánh Academic/General Training cần dùng, học liệu và các dạng bài; ghi nguồn/quyền sử dụng, tiêu chí chấm và điểm tối thiểu từng kỹ năng nếu có. |
| IELTS-002 | TODO | IELTS-001 | Thi thử có thời gian, lưu bài, chữa lỗi và báo cáo bốn kỹ năng; chỉ quy đổi điểm trong phạm vi có căn cứ. Giáo viên đối chiếu bài nói/viết, kết quả AI có nhãn ước lượng. |
| COACH-001 | TODO | BETA-001 | Nếu người dùng cần: dashboard gia sư, giao bài và nhận xét với quyền truy cập có lựa chọn; kiểm tra học viên khác không xem chéo dữ liệu. |
| MOBILE-001 | TODO | BETA-001 | Nếu cần cửa hàng ứng dụng: đánh giá Capacitor, build/ký và kiểm thử native, chuẩn bị thông tin phát hành. Tài khoản, thiết bị và quyền phát hành phải có trước khi gửi lên cửa hàng. |

## Chi tiết task tiếp theo: DATA-002

### Thực hiện

1. Đọc STATUS, BACKEND, ARCHITECTURE và DEC-008/011/013. Kiểm tra Git và backend local bằng CLI trong lockfile; Docker có thể cần mở lại. Giữ kho khách, bản sao version 1/2/3 và bộ test Auth đã đạt.
2. Chốt mô hình sự kiện/lượt làm trên server và quy tắc xung đột trước khi code: ID ổn định cho gửi lại, lịch ôn từ lượt thực, checkpoint cộng dồn lấy giá trị phù hợp thay vì cộng trùng, cách chọn bài/phiên dở khi hai nơi cùng sửa. Ghi quyết định, không ghi đè cả snapshot theo lần gửi cuối một cách ngầm định.
3. Thêm migration theo chủ sở hữu và RLS, lớp đồng bộ tách khỏi giao diện. Hàng đợi phải gắn đúng backend/user ID; hủy/vô hiệu request và callback khi đăng xuất/đổi tài khoản. Kiểm tra read/write chưa đăng nhập và chéo tài khoản trên backend thật.
4. Hiển thị rõ đang lưu/chờ đồng bộ/đã đồng bộ/lỗi và thử lại; chỉ báo thành công sau xác nhận máy chủ. Tải xuống/merge không tự phá dữ liệu chưa gửi hoặc bản lỗi. Xử lý reload, nhiều tab, mất mạng, retry và phản hồi đến muộn.
5. Cho người học lựa chọn rõ trước khi nhập phần khách vào tài khoản. Giữ nguồn khách và có bản sao; không tự upload dữ liệu có sẵn. Phân biệt bản sao JSON thủ công với trạng thái sync.
6. Kiểm tra hai browser context độc lập cùng tài khoản tiếp tục đúng dữ liệu, hai tài khoản không đọc chéo, gửi lặp, xung đột, mất mạng/khôi phục và đăng xuất trong khi gửi. Browser context không thay kiểm tra hai điện thoại thật; ghi rõ giới hạn môi trường.
7. Chạy các kiểm tra phù hợp, cập nhật docs/README/task/status, commit/push theo ủy quyền. Chưa cần cloud hosted để hoàn thành các kiểm tra local độc lập; chưa tự triển khai dịch vụ công khai.

### Chưa thuộc task này

AI, thông báo, gói tải offline/service worker (PWA-002), deployment công khai, phát hành cửa hàng và kho học liệu đầy đủ.

### Phần đã có nhưng chưa đóng task khác

Mốc 1 local, PWA-001 và DATA-001 đã đóng. DATA-002 READY, chưa triển khai; PWA-002 chờ DATA-002. Chưa đạt mốc 2: cần đồng bộ hai thiết bị và học gói đã tải khi mất mạng. Kiểm tra điện thoại thật còn được ghi rõ trong INSTALLATION và BETA-001.
