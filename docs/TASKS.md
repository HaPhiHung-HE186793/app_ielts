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
| DATA-001 | DONE | LEARN-002 | Supabase Docker local, email OTP thật, migration account_profiles/RLS và cấu hình mẫu công khai. Tách kho khách/tài khoản, bảo vệ callback/import khi đổi chủ. Kiểm tra quyền bằng hai tài khoản và 11 ca Auth/API/trình duyệt đạt; setup ở BACKEND. Chưa cấu hình hosted/SMTP thật; đồng bộ ở DATA-002. |
| DATA-002 | DONE | DATA-001, REVIEW-001, PROGRESS-001 | Đồng bộ tự nguyện với outbox/revision, gộp lượt theo ID/checkpoint, lịch ôn và chọn bản xung đột; nhập phần khách có lựa chọn và giữ nguồn. RLS/RPC thật kiểm tra quyền, gửi trùng/đồng thời. Hai browser context kiểm tra tiếp tục, offline/response mất, reload, đổi chủ khi đang gửi; một tab sửa tài khoản theo Web Locks. Giới hạn thiết bị/hosted và cách dùng ở SYNC. |
| PWA-001 | DONE | APP-002, LEARN-002 | Manifest/icon/standalone, hướng dẫn và prompt tự nguyện; Chrome đọc manifest/icon và không báo lỗi installability trong hồ sơ thử riêng. Luồng prompt/standalone có kiểm tra điều khiển; chưa cài/khởi chạy trên iPhone/Android hoặc cửa sổ app hệ điều hành. Phạm vi và bước xác minh ở INSTALLATION/TESTING. |
| PWA-002 | READY | PWA-001, DATA-002 | Tải một gói bài/audio được phép lưu; mở và học offline, chờ gửi khi có mạng. Có quản lý dung lượng/xóa tải xuống; không rò cache giữa tài khoản, không giả lập AI offline. |
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

## Chi tiết task tiếp theo: PWA-002

### Thực hiện

1. Đọc STATUS, INSTALLATION, SYNC, ARCHITECTURE và DEC-012/014. Kiểm tra code/Git/Docker; dùng db:migrate nếu stack local đã tồn tại. Không thay thuật toán gộp hoặc tự bật sync.
2. Chốt phạm vi gói offline từ bảy bài hiện có, metadata phiên bản/dung lượng/nguồn tài nguyên. Chưa có audio file trong repo: SpeechSynthesis tùy thiết bị không được coi là audio đã tải. Xác định tài nguyên âm thanh có quyền lưu trước khi đóng task; không gắn nhãn gói đầy đủ khi phần đó chưa có.
3. Thêm service worker và app shell theo phiên bản, xử lý cập nhật không làm mất bài dở/outbox. Không cache request/response Auth hoặc dữ liệu cá nhân vào cache dùng chung. Ghi quyết định cache, giới hạn và quá trình nâng phiên bản.
4. Giao diện tải/xem dung lượng/xóa gói; lỗi mạng/quota giữ trạng thái trung thực và có thử lại. Phân biệt xóa tài nguyên tải với xóa tiến độ hoặc bản server. Xem lại nhu cầu IndexedDB cho dữ liệu lớn; nếu chuyển kho, cần migration an toàn và test quota/gián đoạn.
5. Kiểm tra tải thành công rồi đóng/mở mới app khi offline, học/tiếp tục/lưu, trở lại mạng gửi outbox không trùng. Kiểm tra cập nhật version, gói tải dở, xóa tài nguyên và không rò cache giữa tài khoản. Phần cần mạng có trạng thái rõ; không giả lập AI.
6. Kiểm tra Chrome có sẵn và các thiết bị/nền tảng thật nếu khả dụng. Mô phỏng viewport/offline không thay Safari/Android thật; giữ bước thiếu trong INSTALLATION/TESTING.
7. Chạy kiểm tra phù hợp, cập nhật README/docs/task/status/session log và commit/push theo ủy quyền. Chưa tự triển khai host công khai hoặc phát hành cửa hàng.

### Chưa thuộc task này

AI, thông báo, deployment công khai, phát hành cửa hàng và chương trình học liệu đầy đủ.

### Phần đã có nhưng chưa đóng task khác

Mốc 1 local, PWA-001, DATA-001 và DATA-002 đã đóng. PWA-002 READY, chưa triển khai. Sync đã kiểm tra hai context trên backend local, chưa phải hai điện thoại thật. Mốc 2 còn gói offline và kiểm tra dùng trên thiết bị; bước thiếu ghi trong INSTALLATION/BETA-001.
