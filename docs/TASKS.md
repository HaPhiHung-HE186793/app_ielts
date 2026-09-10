# Danh sách task phát triển

Cập nhật: 2026-09-10. Thực hiện theo thứ tự ưu tiên và phụ thuộc, không coi các tính năng dự kiến là đã có. Trạng thái tổng quan ở [STATUS.md](STATUS.md).

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
| DOC-002 | DONE | DEPLOY-001 | Đã sửa hướng triển khai thành Vercel/Render/Neon theo đính chính của người dùng; có hướng dẫn tạo Neon từ đầu, đối chiếu phụ thuộc Supabase thật và task DATA-003 với tiêu chí kiểm tra. Đồng bộ tài liệu bàn giao, đánh dấu hướng Supabase cũ; kiểm tra liên kết/task/diff, chưa chuyển code hoặc chạy cloud. |

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
| PWA-002 | DONE | PWA-001, DATA-002 | Gói học liệu được tạo từ nội dung dự án (ban đầu bảy bài/bảy WAV, đã mở rộng ở CONTENT-002); worker/manifest có hash, tải/dung lượng/xóa/lỗi/quota, mở mới offline và chờ sync. Kiểm tra cập nhật giữ draft/outbox, file thiếu/thử lại, range audio và cache không chứa dữ liệu tài khoản. Hướng dẫn/quyền/giới hạn thiết bị ở OFFLINE. |
| NOTIFY-001 | DONE | PWA-001, DATA-001, PLAN-001 | Nhắc học tự nguyện, múi giờ và giờ yên lặng, tắt/dời lịch được. Xin quyền từ thao tác người dùng, xử lý từ chối; xác minh nền tảng hỗ trợ, không phụ thuộc thông báo để vào bài. |
| DATA-003 | DONE | DATA-002, NOTIFY-001, DEPLOY-001 | Adapter Neon Managed Auth REST/JWT, migration schema/role/RLS/CAS riêng, profile/sync/nhắc qua Render và cấu hình Vercel. PostgreSQL local thật kiểm tra hai chủ/replay/đồng thời/rollback/budget; browser với Auth fixture kiểm tra offline/mất response/reload/đổi chủ/cookie. Giữ v3/backup/ID/outbox và Supabase local cũ. Build loại env riêng; AI vẫn tắt/0, worker nhắc/provider Neon production chưa bật. Chưa xác minh Neon hosted/SMTP/cloud/thiết bị thật, chuyển phần này sang DEPLOY-002; chi tiết NEON_BACKEND và DEC-023. |

Điều kiện đạt mốc 2: dùng cùng tài khoản để tiếp tục trên hai thiết bị và học phần đã tải khi mất mạng, với giới hạn được hiển thị rõ.

## Mốc 3 — Gia sư AI và bản beta nền tảng

| ID | Trạng thái | Phụ thuộc | Kết quả và tiêu chí hoàn thành |
| --- | --- | --- | --- |
| AI-001 | IN_PROGRESS | DATA-001 | Chọn nhà cung cấp từ thử nghiệm chất lượng/độ trễ/chi phí, ghi ngân sách và hạn mức; API máy chủ có xác thực, validation, timeout và giới hạn dùng. Kiểm tra không lộ secret và lỗi dịch vụ không làm mất bài. Không ghi AI thật hoạt động khi chỉ có mock. |
| AI-002 | TODO | AI-001, LEARN-001 | Luyện nói: xin quyền mic, ghi/hủy/nghe lại/gửi, nhận phản hồi và thử lại. Chốt thời gian lưu/xóa trước audio thật; đối chiếu mẫu. Chỉ nhận xét phát âm khi thực sự xử lý âm thanh phù hợp. |
| AI-003 | TODO | AI-001, LEARN-001 | Luyện viết: lưu nháp → nộp → gợi ý theo mức độ → tự sửa → so sánh. Phản hồi có căn cứ, giới hạn và nguồn; kiểm tra tập bài đối chiếu, xử lý phản hồi sai/timeout. |
| CONTENT-002 | DONE | CONTENT-001, LEARN-001 | Có 28 bài + bốn kiểm tra theo mục tiêu tăng dần, đoạn đọc/nghe, tự nói/viết và tiêu chí tự xem lại; gói 57 WAV offline. Giữ bảy bài cũ và dữ liệu v3; kiểm tra cả bốn bài tuần qua UI offline, hint/reload/lưu/ôn. Hồ sơ nguồn/rà soát nội bộ ở CURRICULUM/CONTENT_REVIEW; học liệu thử nghiệm, chưa có giáo viên độc lập hoặc hiệu chỉnh độ khó bằng người học thật. |
| ADAPT-001 | DONE | PLAN-001, REVIEW-001, PROGRESS-001, CONTENT-002 | Gợi ý theo bài trước/tuần, tín hiệu bài và truy hồi, ôn đến hạn và sở thích trong nhóm sẵn sàng; nhịp mệt/khó/quay lại có giới hạn, lý do lưu cùng phiên. Giữ draft, schema v3, lịch ôn và danh sách đã bắt đầu; kiểm tra thứ tự/giảm tải/backup/offline/sync. Chưa chẩn đoán riêng bốn kỹ năng hoặc hiệu chỉnh quy tắc trên người học; chi tiết ADAPTATION. |
| DEPLOY-001 | DONE | PWA-002, ADAPT-001 | Chuẩn bị artifact/cấu hình web để triển khai HTTPS: tách cấu hình khách/tài khoản/API, hướng dẫn biến môi trường, cache/cập nhật và quay lui; kiểm tra build không chứa khóa, luồng học từ artifact và phương án dùng trên điện thoại. Ghi rõ hosting/SMTP/dịch vụ nào chưa cấu hình; không coi build local là đã phát hành hoặc cần chờ AI để chuẩn bị phần độc lập. |
| DEPLOY-002 | IN_PROGRESS | DEPLOY-001, DATA-003 | Hướng mới Vercel frontend, Render backend, Neon PostgreSQL (DEC-022). Sau chuyển code DATA-003, cấu hình project/migration/Auth/env và ghi URL/revision/deployment, kiểm tra HTTPS/OTP/sync/worker trên host thật. Phần chuẩn bị Supabase cũ không là bằng chứng chạy Neon; hướng dẫn/build không là đã public. AI thật cần ngân sách/đối chiếu riêng. |
| BETA-001 | TODO | DEPLOY-002, DATA-002, PWA-002, AI-002, AI-003, CONTENT-002, ADAPT-001, NOTIFY-001 | Chuẩn bị bản triển khai, cấu hình, hướng dẫn dùng/khôi phục/xóa dữ liệu và kiểm tra luồng chính trên web/iOS/Android. Thử nghiệm học theo lịch, ghi phản hồi và hạn chế. Việc phát hành thực tế chỉ thực hiện trong phạm vi đã được cho phép. |

Điều kiện đạt mốc 3: người học có thể mở app hằng ngày, dùng học liệu bốn tuần và nhận phản hồi AI đã được kiểm tra trong phạm vi công bố. Không coi beta này là đã hoàn thành chương trình luyện IELTS sáu tháng.

## Mốc 4 — Luyện IELTS và mở rộng khi có nhu cầu

| ID | Trạng thái | Phụ thuộc | Kết quả và tiêu chí hoàn thành |
| --- | --- | --- | --- |
| IELTS-001 | TODO | BETA-001 | Hoàn thiện nhánh Academic/General Training cần dùng, học liệu và các dạng bài; ghi nguồn/quyền sử dụng, tiêu chí chấm và điểm tối thiểu từng kỹ năng nếu có. |
| IELTS-002 | TODO | IELTS-001 | Thi thử có thời gian, lưu bài, chữa lỗi và báo cáo bốn kỹ năng; chỉ quy đổi điểm trong phạm vi có căn cứ. Giáo viên đối chiếu bài nói/viết, kết quả AI có nhãn ước lượng. |
| COACH-001 | TODO | BETA-001 | Nếu người dùng cần: dashboard gia sư, giao bài và nhận xét với quyền truy cập có lựa chọn; kiểm tra học viên khác không xem chéo dữ liệu. |
| MOBILE-001 | TODO | BETA-001 | Nếu cần cửa hàng ứng dụng: đánh giá Capacitor, build/ký và kiểm thử native, chuẩn bị thông tin phát hành. Tài khoản, thiết bị và quyền phát hành phải có trước khi gửi lên cửa hàng. |

## Chi tiết task tiếp theo: DEPLOY-002

**DATA-003 DONE phần code/local; DEPLOY-002 IN_PROGRESS phần cloud.** Người dùng đã mở form New Web Service Render (Start Command trống) và import Vercel (preset Vite cũ). [Hướng dẫn từng trường](DEPLOY_VERCEL_RENDER_NEON.md) đã khớp code. Giữ thay đổi IDE sẵn có của người dùng ngoài commit task.

1. Neon production/neondb: áp `db/neon/001_initial.sql` bằng owner, kiểm tra version 1; đặt/reset mật khẩu role SQL moi_ngay_runtime và lấy Connect pooled/TLS. Không xóa DB cũ, không đưa chuỗi DB vào chat/Vercel.
2. Bật Neon Auth, lấy Auth Base URL công khai; chọn email OTP, cấu hình SMTP production khi mở cho học viên. Không đổi sang mật khẩu hoặc ghép tài khoản cũ theo email.
3. Render: npm ci, npm run start:backend, Singapore, env Neon/AI off. Xác minh Live/healthz/readyz; lấy URL Render thực tế.
4. Vercel Other, npm run build:vercel, hai env công khai. Sau khi có production domain, điền Render APP_ORIGINS và Neon Trusted Domains chính xác, redeploy; thử OTP thật/profile/sync hai tài khoản/hai thiết bị và offline.
5. Ghi URL/revision/deployment/kết quả HTTPS/cookie/session/cache thật vào STATUS/SESSION_LOG. Chưa có Auth URL/SQL cloud/SMTP/URL public được xác minh; không gọi fixture là cloud.
6. Giữ AI tắt/0; xác minh UI báo nhắc chưa sẵn sàng khi chưa có worker. AI-001 và worker production cần bước riêng. Không đóng DEPLOY-002/BETA-001 chỉ vì build/docs hoặc form tạo project thành công.

## AI-001 đang chờ bước đối chiếu

**IN_PROGRESS — đã có API/UI/hạn mức và bộ 10 mẫu, chưa đóng task.** Xem [AI.md](AI.md), [AI_EVALUATION.md](AI_EVALUATION.md), DEC-017. Chưa có API key/ngân sách được xác nhận hoặc kết quả provider thật; không dựng lại nền tảng, tự bật dịch vụ hoặc chuyển sang AI-002/003.

Khi có cấu hình máy chủ và khoản chi hợp lệ: khởi động lại dịch vụ để nạp danh mục mới, chạy tập mẫu qua API có hạn mức, ghi chất lượng/độ trễ/chi phí và người duyệt rubric, rồi mới chốt provider/DONE. Không gửi key vào chat/VITE/Git. Provider trong kiểm thử là fixture có nhãn; Auth/PostgreSQL là local thật.

Mốc 1 local, PWA-001/002, DATA-001/002, NOTIFY-001, CONTENT-002 và ADAPT-001 đã đóng trong phạm vi công bố. Chưa có bản beta hoàn chỉnh, thiết bị thật, học liệu giáo viên phê duyệt hoặc chương trình luyện IELTS sáu tháng. Giới hạn triển khai/cài đặt ở STATUS/INSTALLATION/NOTIFICATIONS/BETA-001.
