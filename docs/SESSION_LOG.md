# Nhật ký bàn giao

Thêm một mục sau mỗi mốc công việc. Ghi ngày, task, thay đổi, kiểm tra, giới hạn và bước tiếp theo; tránh chép nguyên lịch sử chat. Trạng thái hiện tại nằm trong [STATUS.md](STATUS.md).

## 2026-09-06 — DOC-001: thiết lập tài liệu dự án

### Yêu cầu

Người dùng muốn bắt đầu quản lý task, có tài liệu để session mới tiếp tục đúng hướng, đồng thời commit và push để lưu công việc trên remote.

### Thực hiện

- Đối chiếu đề xuất sản phẩm với repository hiện chỉ có README và initial commit.
- Viết lại README thành điểm bắt đầu đọc tài liệu.
- Tạo AGENTS với quy trình đọc, làm task, kiểm tra và cập nhật bàn giao.
- Tạo PRODUCT, ARCHITECTURE và DECISIONS, ghi rõ lựa chọn mặc định và thông tin chưa xác nhận.
- Tạo TASKS theo các mốc từ scaffold đến học local, đồng bộ/PWA, AI/beta và IELTS.
- Tạo STATUS với bước tiếp theo APP-001; thêm gitignore cho dependency, output và cấu hình bí mật local.

### Kiểm tra

- Trước thay đổi: Git sạch trên `main`; sau fetch, local và `origin/main` không lệch commit.
- Đã kiểm tra 8 file Markdown, 13 liên kết nội bộ và 24 task; không có liên kết hỏng, ID trùng hoặc phụ thuộc sai thứ tự. APP-001 là task READY duy nhất và đủ phụ thuộc.
- Đã đối chiếu trạng thái bàn giao giữa các tài liệu và chạy `git diff --check` thành công; phần staged được kiểm tra lại trước commit.
- Không chạy build/test ứng dụng vì chưa có code hoặc cấu hình tương ứng.

### Giới hạn và lưu Git

- Mốc này chỉ tạo nền tài liệu, chưa khởi tạo ứng dụng.
- Commit/push được thực hiện sau kiểm tra. Lấy hash và trạng thái đồng bộ cuối cùng bằng Git; không chèn hash của chính commit vào tài liệu đang được commit.
- Người dùng đã cho phép commit/push mốc này. Kết quả thực tế và lỗi nếu có cần được báo trong bàn giao cuối session.

### Tiếp theo

APP-001: kiểm tra môi trường Node/npm, khởi tạo React + TypeScript + Vite, bổ sung lệnh chạy và xác minh lint/typecheck/build cùng mở trang.

## 2026-09-06 — Bản học thử local: APP-001/002, CONTENT-001, LEARN-001/002, REVIEW-001

### Yêu cầu và phạm vi

Người dùng yêu cầu bắt đầu làm app. Sau scaffold, tiếp tục đến một phiên học có thể dùng thử và lưu tiến độ; cập nhật tài liệu và commit/push theo yêu cầu lưu công việc trong cuộc trao đổi. Chưa triển khai cloud, AI hoặc cửa hàng ứng dụng.

### Đã thực hiện

- Khởi tạo React 19, TypeScript 5.9, Vite 8, npm/lockfile và các lệnh chạy/lint/typecheck/build/test.
- Tên làm việc “Mỗi ngày”, giao diện tiếng Việt với năm khu vực, điều hướng hash, sidebar desktop/thanh dưới điện thoại, SVG gốc và font đóng gói local.
- Biên soạn bảy bài nền tảng có bản dịch, giải thích và hoạt động nhớ lại/áp dụng. Hồ sơ nguồn và giới hạn rà soát ở CONTENT_REVIEW.
- Luồng giới thiệu → ba hoạt động → tự viết → hoàn thành; ghi riêng đúng độc lập, gợi ý và thử lại.
- Store local có schema version 1, lưu câu đang nhập và bài dở, ngăn nộp trùng, xuất/nhập bản sao và cảnh báo khi không ghi được dữ liệu. Dữ liệu lỗi cũ được giữ nguyên.
- Lịch ôn khởi đầu DEC-009; danh sách đến hạn, ôn sớm và thống kê từ lượt thực tế.
- Form sở thích/tên/thời gian dự kiến/loại thi và lịch sử câu tự viết. PLAN-001 và PROGRESS-001 còn phần cần phát triển.

### Kiểm tra và sửa lỗi

- Dependency cài thành công trên Node 22.18.0/npm 10.9.3; npm báo không có lỗ hổng ở lần kiểm tra dependency của mốc này.
- Lint, typecheck, build đạt; Vitest đạt 26 test, Playwright đạt 18 test trên bản build ở 1440px và 360px.
- Đã sửa lỗi thời gian đến hạn không cập nhật ngay khi đổi route sau khi đồng hồ thay đổi; có test hồi quy mô phỏng qua một ngày.
- Đã bổ sung lưu cả câu/chọn lựa chưa nộp và khôi phục đúng các trường hồ sơ trong form sau khi nhập bản sao.
- Đã chỉnh font serif có tiếng Việt, tăng tương phản chữ phụ và thêm semantics cho thanh tiến độ. Axe không phát hiện vi phạm A/AA trong phạm vi quét các trang chính/cài đặt.
- Đã xem ảnh desktop/điện thoại và kiểm tra không tràn ngang, không có lỗi runtime. Ảnh/trace không đưa vào Git.

### Bàn giao

- DONE: APP-001, APP-002, CONTENT-001, LEARN-001, LEARN-002, REVIEW-001; cộng DOC-001 từ mốc trước.
- READY tiếp theo: PLAN-001 — onboarding, mục tiêu và phiên học 2/5/15 phút/buổi đầy đủ.
- PROGRESS-001 có phần giao diện/thống kê nhưng vẫn TODO cho phần kế hoạch và phút học chủ động.
- Chưa xác minh iPhone/Safari hay Android thật; chưa có PWA offline/install, API AI, ghi âm hoặc tài khoản.
- Chỉ một bài dở, dữ liệu local không phải đồng bộ; bộ bài chỉ rà soát nội bộ. Giữ các giới hạn này rõ trong session sau.
- Các lệnh kiểm tra và đường tiếp tục đã ghi ở TESTING/STATUS/TASKS. Hash commit và trạng thái push cuối mốc được xác minh bằng Git và báo trong kết quả session.

## 2026-09-06 — PLAN-001: mục tiêu và phiên học theo thời gian

### Yêu cầu và phạm vi

Người dùng yêu cầu tiếp tục. Thực hiện task READY kế tiếp trên bản học thử local, giữ tiến độ hiện có và tiếp tục commit/push theo ủy quyền trước đó. Không thêm dịch vụ ngoài hoặc dependency.

### Đã thực hiện

- Mở rộng form cài đặt thành thiết lập ban đầu tùy chọn: mục tiêu, ngày tùy chọn, tự nhận xét nền tảng, cùng tên/sở thích/phút/loại thi cũ. Không có bài đánh giá hoặc điểm đầu vào giả.
- Hôm nay chọn phiên 2/5/15 phút/buổi đầy đủ và xem lượng học liệu thực sự được xếp. Buổi dài lấy tối đa ba câu đến hạn rồi bài chưa hoàn thành; ưu tiên bài dở. Không lấp thời gian bằng kết quả hoặc học liệu giả.
- Trang `/session` có danh sách hữu hạn, tạm dừng/tiếp tục, câu đang nhập/gợi ý giữ qua reload và kết thúc rõ ràng. Bài đầy đủ dùng lại LessonPlayer; kết quả gắn với ID lượt làm để không hoàn thành/nộp ôn hai lần.
- Khởi động ngắn ghi `quickLog`, không tăng completions hoặc đổi lịch ôn. Tạo phiên mới giữ bài dở; khi thay danh sách phiên dở có lựa chọn xác nhận trong giao diện.
- Schema version 2, đọc/khôi phục version 1 với giá trị mặc định cho trường mới. Key kho cũ giữ nguyên; chỉ đọc không ghi đè bản gốc. Tiếp tục bảo vệ dữ liệu lỗi/phiên bản chưa hỗ trợ và cảnh báo lỗi lưu.
- Bổ sung quản lý focus khi chuyển câu/nhận phản hồi/kết thúc phiên, dừng giọng đọc khi ẩn câu mẫu. Giao diện giữ phong cách và cách điều hướng hiện tại.
- Cập nhật PRODUCT/ARCHITECTURE/DECISIONS/README/TESTING và tài liệu bàn giao, ghi quyết định DEC-010.

### Kiểm tra và sửa lỗi

- `npm run lint`, `npm run typecheck`, build đạt; Vitest đạt 36 test.
- Lượt Playwright toàn bộ chạy 30 ca: 26 đạt, bốn ca bị timeout do selector `getByLabel` so khớp chính xác với nhãn bọc select. Đã đổi các selector đó sang role combobox có tên, chạy lại đúng bốn ca và đều đạt. Không thay logic app để bỏ qua lỗi test.
- Các ca mới kiểm tra mục tiêu/ngày/loại thi chưa quyết định, 2/5/15/buổi đầy đủ, tiếp tục qua reload, giữ bài dở khi thay phiên, chống nộp lặp, kho cũ và nhập bản sao cũ/lỗi.
- Axe A/AA không phát hiện vi phạm ở các vùng được quét. Kiểm tra responsive và xem ảnh Hôm nay/phiên khởi động trên Chrome ở 1440×1000 và 360×800; không tràn ngang, không phát hiện lỗi runtime khi mở Hôm nay.
- Giới hạn kiểm thử: chưa dùng iPhone/Safari hoặc Android thật. Test không xác nhận hiệu quả học tập, chất lượng giọng tổng hợp hay khả năng đạt IELTS.

### Bàn giao

- PLAN-001 DONE; PROGRESS-001 READY. Không có blocker cho việc tiếp tục phần local.
- File trọng tâm: `src/domain/planner.ts`, `src/data/schema.ts`, `src/features/today/SessionChoices.tsx`, `SessionPage.tsx`, `SettingsDialog.tsx`, hai file kiểm tra planner/planning.
- Chưa đo thời gian hoạt động; phút trên giao diện là ước tính. Chỉ lưu kế hoạch hiện tại, chưa có lịch sử mọi phiên bị thay thế. Lượt khởi động đã lưu riêng nhưng chưa đưa vào trang Tiến bộ.
- Tiếp theo: PROGRESS-001 định nghĩa phép đo có xử lý tab ẩn/bất động/tạm dừng/reload, lưu lịch sử phiên và phân biệt dữ liệu thực với ngân sách. Không suy giờ học của dữ liệu cũ từ số bài đã làm.
- Các giới hạn local, một bài dở, học liệu thử nghiệm, chưa AI/cloud/PWA/install và chưa lộ trình sáu tháng vẫn giữ nguyên. Commit/push sau rà soát; kết quả cuối được báo bằng Git trong bàn giao.

## 2026-09-06 — PROGRESS-001: lịch sử phiên và thời gian hoạt động

### Yêu cầu và phạm vi

Người dùng yêu cầu tiếp tục; thực hiện PROGRESS-001 từ bàn giao trước. Giữ ủy quyền commit/push, không thêm dependency hoặc dịch vụ ngoài. Mốc này hoàn tất các task mốc 1 local.

### Đã thực hiện

- Thêm ActivityClock và ActivityMeter cho bài có draft, câu khởi động và ôn. Chỉ tính khi hiển thị/có focus; dừng sau 60 giây không thao tác, khi rời bài/mở cài đặt, blur/visibility/pagehide hoặc dừng đo thủ công.
- Đồng hồ monotonic, kiểm tra mỗi giây, checkpoint mỗi năm giây và khi rời/dừng, không cộng lại khoảng nghỉ sau reload. Bỏ khoảng callback quá trễ/đổi đồng hồ; chia khoảng qua nửa đêm và lưu theo ngày địa phương.
- Checkpoint cộng dồn theo ID lượt mở/ngày, ghi lại không tăng hai lần. Epoch store vô hiệu callback cũ sau nhập/xóa/nhận kho khác.
- Thêm planHistory khi kết thúc/thay phiên, đóng băng phần đã làm tại thời điểm đó, không xóa draft. Khởi động, bài và ôn giữ kết quả riêng.
- Tách Progress khỏi Pages thành feature riêng: tổng đo, biểu đồ bảy ngày, bốn thẻ thống kê, lịch sử phiên, bộ lọc và xem thêm lượt luyện. Phút dự kiến hiển thị riêng; giữ câu tự viết và ghi rõ chưa chấm.
- Schema version 3 đọc được version 1/2, giữ dữ liệu cũ và giờ chưa biết. Không tạo lịch sử của kế hoạch cũ đã bị thay. DEC-011 ghi quy tắc và giới hạn.
- Cập nhật tài liệu định hướng, kiến trúc, kiểm tra, README và bàn giao.

### Kiểm tra và sửa lỗi

- Lint/typecheck/build đạt; Vitest 47 ca đạt, gồm đồng hồ, idle, thời gian gián đoạn, nửa đêm, checkpoint, lịch sử và tương thích dữ liệu.
- Lượt Playwright toàn bộ ban đầu: 36/38 đạt. Hai ca đổi tab phát hiện Playwright đang giả lập mọi trang có focus; đã tắt focus emulation qua CDP và chạy lại hai ca đạt với blur/focus của trình duyệt.
- Thêm ca visibility/pagehide/pageshow có giá trị/sự kiện điều khiển, vì Chrome headless vẫn báo visible cho tab nền. Đây là kiểm tra handler, không phải kiểm tra thiết bị native.
- Kiểm tra ảnh phát hiện kiểu thẻ thống kê mobile cũ làm nội dung bị bó hẹp; đã chuyển thẻ mới sang cột. Build lại và chạy 12 ca liên quan (10 tiến bộ + 2 axe trang chính), tất cả đạt. Tổng bộ test hiện có 40 ca trình duyệt đã được kiểm tra thành công ở 1440×1000/360×800.
- Axe A/AA không phát hiện vi phạm trong các vùng đã quét. Kiểm tra tổng đo, idle, dừng thủ công/cài đặt/rời bài, đổi tab, reload, khôi phục/xóa không tái ghi, kết quả thật và lịch sử phiên.
- Đã xem ảnh Tiến bộ ở desktop/mobile và kiểm tra runtime/tràn ngang qua script riêng. Kiểm tra 10 file tài liệu, 22 liên kết nội bộ, 24 task và `git diff --check` đạt.

### Bàn giao

- PROGRESS-001 DONE, mốc 1 local hoàn tất. PWA-001 là task READY tiếp theo, đủ phụ thuộc và chưa cần Supabase.
- File chính: `domain/activity.ts`, `domain/progress.ts`, `domain/planner.ts`, `data/schema.ts`, `data/store.ts`, `components/ActivityMeter.tsx`, `features/progress/Progress.tsx`; test ở activity.test và progress.spec.
- Giữ các giới hạn: phép đo không chứng minh chú ý, có thể mất mốc cuối khi kill, dữ liệu cũ chưa có giờ; không an toàn hợp nhất nhiều tab; chưa iPhone/Safari/Android thật, AI/cloud/PWA hoặc học liệu sáu tháng.
- Nút dừng đo áp dụng cho lượt mở hoạt động; bản ghi thời gian mới bắt đầu lại khi mở hoạt động mới. Dữ liệu local có bản sao thủ công, không phải cloud.
- Commit/push sau rà soát diff và tài liệu; hash/kết quả remote được xác minh bằng Git trong bàn giao cuối.

## 2026-09-06 — PWA-001: biểu tượng và hướng dẫn cài từ web

### Phạm vi và kết quả

Người dùng yêu cầu tiếp tục; triển khai PWA-001 theo bàn giao. Giữ ủy quyền commit/push, không thêm dependency hoặc triển khai dịch vụ công khai.

- Thêm manifest tiếng Việt, tên Mỗi ngày, ID/scope gốc origin, start URL Hôm nay, màu và standalone. SVG gốc dựa trên favicon; bốn PNG any 192/512, maskable 512, apple-touch-icon 180, có script tái tạo `npm run icons`.
- Trang `#/install` từ cài đặt/cuối trang: hướng dẫn iPhone/iPad, Android, máy tính; có chọn lại thiết bị. Nút cài chỉ hiện khi nhận sự kiện hỗ trợ. Giữ prompt qua điều hướng, gọi một lần từ click, xử lý hủy/lỗi và ngăn gọi lại trong khi chờ.
- Phân biệt chấp nhận cài, appinstalled và chế độ cửa sổ thực tế. Không ghi cờ đã cài vào localStorage hoặc gán standalone từ việc đồng ý. Nhắc bản sao khi chuyển kho, nêu địa chỉ local chưa dùng được ở điện thoại.
- Thêm viewport-fit và khoảng safe-area. Điện thoại ngang thấp dùng thanh điều hướng dưới để năm mục vẫn tới được. Chưa thêm service worker/cache, offline, quyền thông báo hoặc tài khoản; schema học version 3 không đổi.
- Có INSTALLATION, DEC-012 và cập nhật README/ARCHITECTURE/TESTING/STATUS/TASKS để session sau tiếp tục đúng DATA-001.

### Kiểm tra và sửa lỗi

- Lint/typecheck/build đạt; Vitest 47 ca đạt. Tái tạo bốn PNG thành công, manifest được phục vụ với MIME `application/manifest+json`.
- Lượt toàn bộ Playwright 56 ca: 52 đạt; bốn ca mới vướng cấu hình test. Chrome trả `in-incognito` ở context mặc định nên chuyển kiểm tra manifest/installability sang hồ sơ tạm riêng. Sửa locator tiếp tục phiên từ button sang link đúng giao diện. Không bỏ qua lỗi Chrome hoặc dùng profile của người dùng.
- Chạy lại sáu ca manifest/mở lại/hướng dẫn, tất cả đạt. Chrome đọc manifest, giải mã icon đúng kích thước và trả mảng lỗi installability rỗng ở hồ sơ thử. Phiên/câu/gợi ý giữ nguyên khi mở start URL trong cùng browser context.
- Sau CSS safe-area, build và chạy sáu ca điều hướng/axe/hướng dẫn trên desktop/mobile, tất cả đạt. Prompt/appinstalled/standalone dùng sự kiện/tín hiệu điều khiển; không phải kiểm tra cài lên hệ điều hành.
- Xem ảnh desktop/mobile và mô phỏng insets bằng CDP ở 390×844 (top 47, bottom 34), 844×390 (left/right 47, bottom 21). Phát hiện sidebar khó tiếp cận khi máy ngang thấp, chuyển về thanh dưới, kiểm tra lại không tràn ngang/lỗi runtime. Đây là mô phỏng, chưa thay kiểm tra điện thoại thật.
- Dev server cũ đã dừng; khởi động lại Vite 5173 bằng tiến trình nền ẩn. Log kiểm tra trong `.local` được gitignore; server có thể cần chạy lại ở session sau.
- Kiểm tra 11 file Markdown, 31 liên kết nội bộ và 24 task: không có lỗi liên kết/phụ thuộc, DATA-001 là READY duy nhất. `git diff --check` đạt.

### Bàn giao

- PWA-001 DONE trong phạm vi manifest/standalone/hướng dẫn và trình duyệt có sẵn. Chưa cài/khởi chạy từ biểu tượng trên iPhone/iPad/Android hoặc cửa sổ app hệ điều hành; còn bước thủ công ghi trong INSTALLATION. Chưa đạt mốc 2.
- File trọng tâm: `public/manifest.webmanifest`, `public/icons`, `index.html`, `src/app/installation.ts`, `src/features/install/InstallPage.tsx`, `src/styles/install.css`, `tests/install.spec.ts` và INSTALLATION.
- DATA-001 READY: kiểm tra môi trường Supabase, làm Auth/migration/quyền và chính sách kho khi đăng xuất. Có docker.exe, chưa xác minh engine; chưa thấy CLI trong PATH hoặc được cấp URL/key cloud. Phải kiểm tra hai tài khoản trên môi trường chạy thật trước DONE.
- Giữ giới hạn local theo origin, chưa đồng bộ/offline/AI/deployment công khai và chưa kiểm duyệt học liệu độc lập. Commit/push sau kiểm tra diff/liên kết; hash và remote được xác minh trong bàn giao cuối.

## 2026-09-06 — DATA-001: tài khoản, Supabase local và quyền riêng từng người

### Phạm vi và kết quả

Người dùng yêu cầu tiếp tục. Đọc bàn giao, xác minh code/Git sạch tại `9f608f9` và chọn DATA-001, đánh dấu IN_PROGRESS trước khi triển khai. Giữ ủy quyền commit/push; không cấu hình cloud, gửi thư ra bên ngoài hoặc triển khai công khai.

- Kiểm tra tài liệu Supabase chính thức và môi trường: Node 22.18.0, npm 10.9.3, Docker Desktop có sẵn nhưng daemon chưa chạy. Khởi động Docker bằng tiến trình ẩn; engine 28.3.2. Thêm SDK 2.115.0/CLI 2.116.0 và lockfile; npm audit khi cài báo 0 lỗ hổng.
- Khởi tạo stack Supabase của repo với PostgreSQL 17, Auth, PostgREST và Mailpit. Migration `account_profiles` có RLS CRUD theo `auth.uid()`, giới hạn tên và chỉ cấp quyền ghi cột cần thiết. Test phát hiện upsert cần quyền update cột ID; bổ sung quyền cột trong migration và local DB, policy vẫn chặn thay chủ.
- Email OTP thật cho đăng ký/đăng nhập, template mã sáu số, hạn 10 phút và cooldown 60 giây. UI có mã sai, retry, lưu tên riêng, khôi phục phiên và logout. Local hiện đường đến Mailpit và ghi rõ chỉ là email thử trên máy.
- `supabase-config.ts` kiểm tra URL/publishable key từ Vite trước bundle và từ client; không nhận secret hoặc JWT legacy. `.env.example` để trống hai biến công khai. Scripts `dev:local`/`test:auth` lấy cấu hình qua CLI, không ghi `.env` và chỉ đưa key công khai vào Vite.
- Tách store thành factory kiểm tra độc lập và adapter trình duyệt, giữ schema version 3/key khách cũ. Kho tài khoản theo backend URL/user ID; đăng xuất về kho khách, giữ bài dở của mỗi người. Lỗi đọc/quota giữ công việc riêng trong bộ nhớ.
- Đổi chủ sở hữu tăng epoch trước khi đổi kho, dựng lại form và cập nhật focus. File import bất đồng bộ kiểm tra epoch trước thay dữ liệu; bộ đo cũ không ghi sang người mới. Auth cập nhật qua tab nhưng chưa hợp nhất tiến độ học nhiều tab.
- Logout dùng scope local. SDK thực tế bỏ phiên local cả khi endpoint logout lỗi; UI phản ánh đã rời trình duyệt/chưa xác nhận thu hồi máy chủ. Không nói dữ liệu local được mã hóa hoặc JWT đã hết hiệu lực tức thì.
- Thêm BACKEND, DEC-013, cập nhật README/ARCHITECTURE/TESTING/TASKS/STATUS để tiếp tục DATA-002.

### Kiểm tra và xử lý lỗi

- Lint/typecheck/build đạt, Vitest 59 ca đạt. Có 7 ca mới về tách kho/epoch/quota/bản lỗi và 5 ca cấu hình công khai/URL/loại key.
- Bộ Playwright khách chạy toàn bộ 58 ca đạt trên Chrome 1440×1000/360×800, giữ luồng học, PWA, bản sao và tiến bộ cũ.
- Lượt Auth đầu 9 ca: 7 đạt, hai ca lỗi tải hồ sơ chưa thấy thông báo kịp thời do PostgREST mặc định retry GET sau 1/2/4 giây. Đọc SDK và tắt retry tự động cho tải tên; giữ nút thử lại của người học. Không tăng timeout test để che độ trễ giao diện.
- Thêm kiểm tra timer đang hoạt động và import bắt đầu trước logout. Chạy lại toàn bộ Auth: 11/11 đạt, gồm API RLS thật với hai tài khoản và năm luồng UI trên mỗi kích thước. Mã OTP đọc từ Mailpit, tạo/xóa tên qua API thật; ca lỗi mạng inject 503 có ghi rõ phạm vi trong TESTING.
- Khi restart Supabase để cập nhật hạn mức test local, Docker Windows chưa nhả cổng 54324 khiến start thất bại. Kiểm tra listener/container rồi retry sau khi cổng được giải phóng; start thành công, không xóa volume/reset dữ liệu hoặc dừng dịch vụ khác.
- Sau sửa focus theo chủ sở hữu và thông tin hộp thư thử, build lại; 12 ca khách/tiến bộ liên quan đạt. Kiểm tra định dạng phát hiện một file test còn khác Prettier, đã định dạng lại và kiểm tra đạt.
- Vite thực sự từ chối key secret giả trước build; quét ba tài nguyên JS/CSS/HTML của bản Auth không chứa server key local. Không capture trace Auth. Sau suite, xác minh 0 Auth user, 0 account profile và 0 email thử còn lại.
- Axe A/AA không phát hiện vi phạm ở form mã và tài khoản có dữ liệu; xem ảnh desktop/mobile, không tràn ngang. Chưa kiểm tra điện thoại/Safari hoặc SMTP ngoài máy.
- Vite có cảnh báo bundle chính khoảng 605 kB minified/174 kB gzip sau thêm SDK; không chặn build, chưa chia route. Cần xét tốc độ tải thực ở mốc tối ưu beta.
- Kiểm tra 12 file Markdown, 41 liên kết nội bộ, 24 task: không lỗi, DATA-002 READY duy nhất. `git diff --check` đạt.

### Bàn giao

- DATA-001 DONE trong phạm vi Auth/migration/quyền trên backend local thật. DATA-002 READY; chưa có sync tiến độ, cloud hosted, AI, service worker, offline hoặc bản public. Mốc 2 chưa hoàn thành.
- File trọng tâm: `src/app/auth.ts`, `src/features/account/AccountPage.tsx`, `src/data/study-store.ts`, `src/services/supabase.ts`, migration và config trong `supabase/`, `tests/auth`, scripts local và BACKEND.
- Đã thay dev server của chính repo bằng `npm run dev:local` tương đương (launcher Node nền ẩn); HTTP 200 tại 127.0.0.1:5173. Docker local và Mailpit đang chạy. Có thể cần khởi động lại ở session mới; hướng dẫn ở README/BACKEND.
- Giữ giới hạn dữ liệu học local chưa mã hóa/chưa sync, một bài dở, chưa an toàn hợp nhất nhiều tab, bộ đo không chứng minh chú ý và học liệu thử nghiệm chưa được giáo viên độc lập xác nhận.
- Task tiếp theo: DATA-002 thiết kế sự kiện/quy tắc xung đột, hàng đợi theo chủ sở hữu, trạng thái sync và nhập dữ liệu khách có lựa chọn; kiểm tra hai phiên độc lập/gửi lặp/mất mạng/đổi tài khoản trên backend thật.
- Commit/push sau rà soát diff, chỉ stage code/cấu hình mẫu/tài liệu; không stage khóa, log, bản build hay dữ liệu người học. Hash và kết quả remote được báo từ Git trong bàn giao cuối.

## 2026-09-06 — DATA-002: đồng bộ tiến độ và giải quyết xung đột

### Phạm vi và triển khai

Người dùng yêu cầu tiếp tục. Đọc bàn giao và code tại `1dffddb`, Git sạch trên main; DATA-002 được chuyển IN_PROGRESS trước khi làm. Docker/Supabase local đang chạy. Giữ ủy quyền commit/push, không tạo dịch vụ hosted, gửi thư ngoài máy hoặc triển khai public.

- Ghi DEC-014 trước triển khai: bật sync theo lựa chọn, gộp ba phía theo ID, phiên bản server/CAS, outbox bền và khóa một tab sửa tài khoản trong cùng origin. Giữ luồng khách và StudyState/bản sao version 3.
- Migration 002 tạo snapshot/commit/RPC theo chủ; RLS cho đọc hàng của mình, không cho client ghi trực tiếp. RPC xác nhận Auth/chủ dự kiến, khóa hàng và kiểm tra revision trước ghi; UUID cùng payload nhận lại receipt, UUID dùng cho payload khác bị chặn.
- Migration 003 giữ hash SHA-256 và phần dữ liệu thay đổi trong receipt, không chép lại toàn bộ lịch sử ở mỗi lần gõ. Có đường bảo toàn receipt cũ thành legacySnapshot. Request vẫn là snapshot đầy đủ trong phạm vi dữ liệu nhỏ hiện tại. Thêm `npm run db:migrate` dùng CLI local đã khóa phiên bản, không thêm dependency.
- `domain/sync.ts` gộp lượt theo ID; cùng checkpoint lấy giá trị cộng dồn lớn nhất. Dựng lịch ôn theo lượt thật/time/ID, giữ lịch cũ nếu thiếu nguồn. Hồ sơ/draft/plan hoặc cùng ID kết quả sửa khác nhau cần lựa chọn; không ngầm xóa lịch sử phía khác.
- Store ghi StudyState và `_sync` trong một lần setItem: bản chung, payload/UUID chờ xác nhận, xung đột và thời điểm xác nhận. Giữ chỉnh sửa phát sinh trong khi gửi; retry sau reload vẫn dùng đúng ID. Giữ bản lỗi/quota và không gửi payload chưa ghi được.
- Engine tách khỏi UI/transport, có retry, rebase, AbortSignal và kiểm tra chủ. Coordinator dùng Web Locks một tab sửa, đánh thức khi online/focus/hiển thị hoặc mỗi 15 giây, debounce 800 ms. Tạm hoãn khi hộp cài đặt mở để tránh thay form chưa lưu.
- App có trạng thái chờ/gửi/đã xác nhận/lỗi/offline, xem/tải hai bản xung đột và lựa chọn. Dựng lại vùng bài học khi nhận draft/plan mới, không dựng lại toàn bộ trang tài khoản làm mất tên đang nhập.
- Nhập phần khách có bước xem/chọn giữ thiết lập/bài dở, nút bản sao và giữ nguồn khách. Bật/tắt sync không tự nhập khách. Khôi phục JSON/reset local dừng sync ở máy đó, không xóa server; bật lại có thể lấy bản server xuống.
- Bổ sung SYNC, cập nhật README/BACKEND/ARCHITECTURE/PRODUCT/INSTALLATION/TESTING/STATUS/TASKS và câu mô tả trong trang cài app để phản ánh sync đã có.

### Kiểm tra và xử lý lỗi

- Lint/typecheck/build đạt. Đã sửa hai lỗi TypeScript trong kiểu nullable/union của merge và fixture. Vitest **76/76** đạt: 8 ca merge và 9 ca engine mới cùng 59 ca cũ.
- Áp dụng migration trên stack hiện có bằng CLI, không reset hoặc xóa volume. Lượt đầu migration 002 vướng cú pháp CASE trong điều kiện PL/pgSQL; bọc biểu thức CASE, chạy lại thành công. Migration 003 áp dụng thành công; `db:migrate` cuối xác nhận không có migration thiếu.
- API ban đầu 3/3 đạt; desktop trước bước bổ sung cuối 9/9 đạt. Sau kiểm tra logout đang gửi/hoãn form và journal thay đổi, chạy toàn bộ **23 ca Auth/API/sync**: 22 đạt, một ca fixture payload sai dùng revision cũ nhận conflict trước validation ID. Đổi fixture dùng revision hiện tại để thực sự kiểm tra đường validation; chạy lại ba ca API, đều đạt. Không thay logic server để bỏ kiểm tra hoặc che lỗi.
- Bộ **58 ca khách** chạy toàn bộ đạt ở Chrome desktop 1440×1000 và mobile viewport 360×800. Sau sửa câu mô tả đồng bộ ở trang cài, lint/build lại và chạy hai ca hướng dẫn/axe đạt. Không thêm/sửa dependency hoặc lockfile trong task này.
- Xác minh quyền chéo/chưa đăng nhập/ghi trực tiếp/RPC khác chủ; commit đồng thời chỉ một thành công, retry song song không tạo bản sao, receipt cũ không làm lùi snapshot. Journal lần sửa draft chỉ chứa trường thay đổi và hash.
- Hai browser context cùng tài khoản có phiên Auth riêng nhận/tiếp tục dữ liệu. Lịch sử nền ban đầu có fixture được khai báo; tiếp tục câu đang nhập và đồng bộ sau sửa thực hiện qua UI. Không gọi context là điện thoại thật.
- Offline bằng Playwright khi app đã mở; server đã nhận commit nhưng response bị thay bằng 503, retry sau reload dùng cùng ID. Response khác giữ đến sau logout và đăng nhập B, xác minh không ghi vào B. Đây là kiểm tra lỗi có điều khiển, chưa chứng minh khả năng mở app offline hoặc hành vi OS native.
- Xung đột hiện hai bản, giữ qua reload và chọn được; nguồn khách không tự gửi và không bị xóa. Tab thứ hai chờ khóa thật của Web Locks, nhận lại quyền khi tab thứ nhất đóng. Axe A/AA ở sync/xung đột không phát hiện vi phạm; xem ảnh desktop/mobile.
- Sau test, Auth user, tên, snapshot và commit thử đều còn 0 hàng. Không dùng dữ liệu học viên thật. Trace Auth tắt; hình/log/build thử trong `.local` hoặc `test-results`, gitignore.
- Kiểm tra tài liệu: 13 file Markdown, 50 liên kết nội bộ và 24 task hợp lệ; PWA-002 READY duy nhất. `git diff --check` đạt. Bundle khoảng 622 kB minified/178 kB gzip vẫn có cảnh báo kích thước.
- Rà soát staged phát hiện dòng trống thừa cuối migration 003, đã sửa và kiểm tra lại. Guard build từ chối secret giả; bundle Auth và 33 file staged không chứa server key local. Mailpit còn 0 thư, app local trả HTTP 200.

### Bàn giao

- DATA-002 DONE, PWA-002 READY; chưa đạt mốc 2 vì còn gói offline và kiểm tra thiết bị. Không còn code DATA-002 làm dở.
- File chính: `src/domain/sync.ts`, `src/data/sync-engine.ts`, `sync-schema.ts`, `study-store.ts`, `src/app/sync.ts`, `src/services/study-sync.ts`, `SyncPanel.tsx`, hai migration mới và `tests/auth/sync*.spec.ts`.
- Docker local, Mailpit và dev server của repo tiếp tục chạy tại các cổng đã ghi trong BACKEND; có thể cần mở lại ở session mới. Chỉ email thử trên máy, chưa có Supabase hosted/SMTP/HTTPS public.
- Giữ giới hạn: local chưa mã hóa/còn quota, request gửi snapshot, chưa benchmark dữ liệu nhiều tháng/hạn mức hosted hoặc UI xóa lịch sử server. Mỗi origin một tab sửa tài khoản, không hứa học khi mở mới app offline. Chưa kiểm tra iPhone/Safari/Android thật, AI, nguồn audio tải offline hoặc hiệu quả học tập.
- Tiếp theo PWA-002: chốt gói bài/audio có quyền lưu, app shell/service worker có phiên bản, tải/xóa/dung lượng, không cache Auth/cá nhân dùng chung, kiểm tra mở mới offline và giữ outbox khi cập nhật. Không tự mở rộng sang deploy hoặc AI.
- Commit/push sau rà soát đúng file; hash và kết quả remote được xác minh bằng Git trong bàn giao cuối.

## 2026-09-07 — PWA-002: tải gói và mở lại khi mất mạng

### Kết quả

- Tiếp tục từ main sạch sau DATA-002, đọc tài liệu/code và đánh dấu PWA-002 IN_PROGRESS. Giữ scope bảy bài, không mở rộng sang AI/native/deploy. Người dùng tiếp tục ủy quyền phát triển/commit/push; không dùng sub-agent.
- Tạo bảy WAV từ câu mẫu tự soạn bằng eSpeak NG 1.51, formant en-us/145 từ mỗi phút, qua Docker Debian. Bản văn bản/câu hỏi JSON và metadata SHA-256/byte cùng tạo bằng `scripts/generate-audio.js`. Gói 740.035 byte; giọng thử nghiệm chưa được giáo viên duyệt, có transcript và giới hạn rõ. Nguồn/quyền ở OFFLINE/CONTENT_REVIEW.
- Build plugin kiểm tra học liệu/asset rồi tạo worker và manifest allowlist từ Vite output. Shell ~1,07 MB tự lưu khi cài worker; gói chỉ tải từ thao tác người học. Không cache Auth/API/Authorization/query/origin ngoài hoặc response cá nhân. Không thêm dependency/đổi lockfile.
- Worker kiểm tra hash trước lưu, marker hoàn tất sau đủ file; tải/xóa tuần tự, có quota/timeout/integrity/thử lại và kiểm tra file bị thu hồi. Byte range 206/416 hỗ trợ WAV. Xóa gói giữ phần mở app, tiến độ và outbox; không xóa cache khác.
- Không skipWaiting/reload cưỡng bức: worker mới đợi cửa sổ cũ đóng, giữ HTML theo build đang chạy; activation dọn cache phiên bản cũ của dự án. Gói đổi phiên bản cần tải lại. Dữ liệu học vẫn version 3/localStorage; không có migration IndexedDB.
- Giao diện gói nằm ở phần Thêm vào màn hình chính, có dung lượng/trạng thái/kiểm tra/xóa/cập nhật. ListenButton chuyển từ SpeechSynthesis sang file thật, có dừng/lỗi và thử lại trên cùng trang sau mất mạng. File online không tự báo đã tải gói.
- Phiên SDK cần refresh có thể chặn khởi động. App mở chủ local từ phiên đã lưu trước, có nhãn bản lưu; chưa cấp quyền server. Sync chờ SDK xác nhận và đánh thức ở task kế tiếp để không gọi API bên trong auth lock. SIGNED_OUT vẫn quay về khách. Không dựa một mình vào navigator.onLine.
- Thêm `npm run preview:local` cho build Auth/offline tại 4175, tách dev 5173 và test 4173/4174. Chỉ đưa cấu hình công khai vào build. Cổng khác có kho khác; tài liệu chỉ đường sync/JSON.

### Kiểm tra và sửa lỗi

- Lint/typecheck/build đạt, Prettier các file mới/đổi đạt. Vitest **78/78** đạt, thêm hai ca byte range. Vite vẫn cảnh báo bundle ~632 kB minified/~181 kB gzip.
- Chạy toàn bộ **68/68 ca khách** và **27/27 ca Auth/API/sync** đạt trên Chrome desktop/mobile viewport với backend Docker thật. Các ca PWA mới gồm tải/đóng/mở mới offline/phát audio/làm bài/lịch ôn; mất file/hash sai/quota giả lập/thử lại; xóa tài nguyên giữ dữ liệu; cache không chứa dữ liệu riêng A/B.
- Ca tài khoản mở lại khi `expires_at` SDK đã qua hạn (giữ JWT thật), nộp khởi động offline; khi online, server đã commit nhưng nhận response 503; reload gửi lại UUID cũ, chỉ một receipt/kết quả. Các ca Auth/đồng bộ cũ vẫn đạt.
- Ca cập nhật dùng server HTTP riêng/port ngẫu nhiên, hai bộ shell/manifest thật, draft/outbox fixture. Lượt đầu có race khi mở trang ngay trong lúc worker chuyển activation; sửa test đợi trạng thái activation thật sau khi đóng cửa sổ, không thêm skipWaiting hoặc delay đoán. Bộ đầy đủ sau sửa đạt ở cả hai viewport.
- Lượt test đầu có import JSON thiếu import attribute trong Node và selector chưa khớp nhãn/nút hai bước của bài; đã sửa fixture/selector theo UI. Ca Auth lộ việc navigator.onLine trang mới còn báo online dù context offline: sửa khôi phục chủ local và chờ SDK thay vì kẹt màn hình loading; không sửa JWT để giả lập Auth thành công. Fixture profile null được sửa thành completion hợp lệ.
- Sau bộ đầy đủ, chuẩn hóa MB theo 1.000.000 byte và sửa audio bị lỗi mạng cần `load()` trước phát lại. Chạy lại lint/typecheck/78 unit/build và hai ca tải/mở/học offline, bổ sung nghe thất bại sau xóa gói rồi có mạng phát lại trên cùng trang: đều đạt. Không chạy lại toàn bộ Auth vì các sửa cuối chỉ ở hiển thị dung lượng/player.
- Axe A/AA không phát hiện vi phạm trong các vùng đã quét, không tràn ngang; đã xem ảnh desktop/mobile. Test WAV/phát/range không xác nhận phát âm/ngữ điệu đúng hay hiệu quả học.
- Trong lúc chốt, Docker Desktop và preview đã dừng; mở lại Docker bằng tiến trình ẩn, các container của repo lên lại, không reset/xóa volume. `db:migrate` xác nhận không còn migration thiếu; số hàng Auth user/account_profiles/study_snapshots/study_commits đều 0 sau test. Mở lại preview 4175 để dùng thử.
- Kiểm tra build từ chối tài nguyên bị sửa/học liệu chưa đóng gói, đọc header WAV 22.050 Hz/16 bit, kiểm tra secret trong build và staged ở bước rà soát cuối. Tài liệu hiện có 14 Markdown/64 liên kết nội bộ/24 task, NOTIFY-001 READY duy nhất; git diff --check đạt.

### Bàn giao

- **PWA-002 DONE; NOTIFY-001 READY** với các bước cụ thể trong TASKS. STATUS là trạng thái hiện tại; OFFLINE mô tả cách dùng, quyền audio, cache và cập nhật. README/ARCHITECTURE/PRODUCT/INSTALLATION/BACKEND/SYNC/TESTING/CONTENT_REVIEW/DEC-015 cùng cập nhật.
- File chính: `src/offline/worker.js`, `range.js`, `src/app/offline.ts`, `OfflinePanel.tsx`, `ListenButton.tsx`, `scripts/offline-build.js`, `generate-audio.js`, `preview-local.js`, `public/packs/foundation-v1/` và các test offline.
- Chưa có hosted/SMTP ngoài máy, public HTTPS, push/AI, kiểm thử iPhone/Safari/Android thật/cửa sổ OS hoặc giáo viên duyệt âm thanh. Cache có thể bị thu hồi, local chưa mã hóa, không đồng bộ khi app bị OS đóng. Bảy bài chưa đủ bốn tuần hoặc lộ trình sáu tháng.
- Commit/push main sau rà soát; lấy hash và xác minh remote bằng Git trong bàn giao cuối, không tự sửa lịch sử/force-push.

## 2026-09-07 — NOTIFY-001: nhắc học tự nguyện qua Web Push

### Kết quả

- Tiếp tục main sạch sau e274188, đọc tài liệu và code, đánh dấu NOTIFY-001 IN_PROGRESS rồi triển khai đúng phạm vi. Không dùng sub-agent, không triển khai hosted/AI/native. Quyền commit/push tiếp tục từ yêu cầu đã có.
- Trang Nhắc học tiếng Việt có mặc định tắt, giờ/ngày/IANA timezone, giờ yên lặng, dời lượt tới 30 phút và tắt. Quyền chỉ xin từ nút bật; người từ chối vẫn vào bài. Lịch theo thiết bị/tài khoản, giữ StudyState/bản sao version 3 và sync cũ.
- PostgreSQL tính ngày/lịch/DST; RLS/owner/CAS bảo vệ sửa, chỉ server claim/prepare/finish. Receipt duy nhất theo thiết bị/ngày, bỏ quá một phút/yên lặng; revision cũ không gửi. Đã áp dụng bốn migration bổ sung, không reset database: bảng/RPC, chặn null/endpoint sai, thống nhất thứ tự khóa, claim riêng thiết bị thử.
- Bộ gửi Node dùng web-push 3.6.7 (khóa phiên bản/lockfile, Node 22 phù hợp; npm audit lúc cài 0 lỗ hổng). VAPID chỉ tạo một lần trong .local, public key/heartbeat ở database, service key ở Node. Host endpoint có allowlist HTTPS. Ghi attempt trước HTTP, TTL 0, không retry kết quả chưa rõ; 404/410 tắt endpoint cùng revision.
- Worker ghép trong build hiện có, giữ update chờ cửa sổ cũ đóng. IndexedDB chỉ thêm binding/ngày nhắc, transaction chặn hiển thị lặp; không chuyển kho học hoặc thêm token/subscription vào Cache Storage. Push không có dữ liệu học cá nhân, click chỉ về Hôm nay cùng origin.
- Client dùng Web Lock riêng, generation/owner guard, giới hạn chờ subscribe 15 giây và dọn kết quả tới muộn. Logout hủy local trước rời Auth; đổi chủ hoặc mất phiên ở lần mở mới dọn binding. Không cản logout vì request dọn bị lỗi; không hứa thu hồi thông báo đang tới.
- Thêm reminders:local, --setup và reminders:verify. Probe mạng thật chỉ tạo/dùng/xóa tài khoản thử, hồ sơ Chrome tạm và claim đúng ID thiết bị của nó; không gửi hoặc sửa lịch của tài khoản local khác.

### Kiểm tra và giới hạn bằng chứng

- Lint/typecheck/build đạt, Vitest 82/82. Toàn bộ 68/68 ca khách và 39/39 Auth/API/UI/sync/offline/nhắc học đạt trên Chrome desktop 1440×1000 và viewport 360×800. Các luồng học, quota, bản sao, update worker và outbox cũ giữ nguyên qua hồi quy. Bundle chính khoảng 648 kB/186 kB gzip còn cảnh báo chia route.
- Bốn ca API nhắc kiểm tra quyền, null/validation, CAS đồng thời, qua ngày/ngày tuần, DST tiến/lùi, quiet boundary, claim idempotency, dời/hủy revision, endpoint hết hạn và tránh tắt revision mới do receipt cũ. Sau thêm phạm vi claim thiết bị thử, chạy lại cả bốn và đạt.
- Tám ca UI nhắc dùng permission/subscription có điều khiển, backend/worker/IndexedDB thật: từ chối, lưu qua reload, bật/dời/tắt, mất response sau server nhận, đổi chủ khi enable đang gửi, logout, push cũ/lặp và click an toàn. CDP injection kiểm tra handler, không gọi là đường mạng push thật. Axe A/AA không báo vi phạm vùng quét, không tràn ngang; xem ảnh giao diện.
- Đã kiểm tra riêng subscription/gửi mã hóa qua FCM thật trong Chrome headless Windows. Một lượt khi trang còn mở và một lượt với 0 trang app mở đều accepted=1, worker getNotifications() có thông báo. Probe tái lập dùng hồ sơ tạm lần đầu accepted=1 nhưng chưa thấy thông báo trong 15 giây; không đổi kết quả này thành thành công. Bổ sung 3 giây để kết nối push mới ổn định và chờ quan sát tối đa 30 giây; chạy lại tài khoản/hồ sơ thử mới đạt với 0 trang app mở, accepted=1, browserNotificationRegistered=true. Không gửi lại receipt cũ.
- Việc chờ ổn định không chứng minh đã xử lý mọi nguyên nhân mất thông báo. TTL 0/Focus/network/OS vẫn có thể bỏ lượt. Chưa quan sát thông báo ở màn hình OS, tắt toàn bộ tiến trình Chrome, iPhone/Safari/Android thật hoặc host chạy liên tục. Tách accepted khỏi hiển thị trong UI/tài liệu.
- Sửa trong triển khai: validation SQL cần chặn null để CAS không bị bỏ qua; regex host cần dấu chấm literal; lần khởi động ở khách cũng phải dọn binding cũ; React dùng đồng hồ hook thay Date.now trong render. Các bộ đạt nêu trên chạy sau sửa liên quan, không dùng test pass trước sửa làm bằng chứng thay thế.

### Bàn giao

- NOTIFY-001 DONE; AI-001 READY với bước tiếp theo cụ thể trong TASKS. README/STATUS/ARCHITECTURE/DECISIONS/BACKEND/INSTALLATION/TESTING cùng cập nhật; NOTIFICATIONS mô tả dùng, dữ liệu, giới hạn và probe thật.
- File chính: features/reminders, src/reminders, scripts/reminder-sender.js/reminders-local.js/verify-reminder-push.js, bốn migration 20260907 và hai test Auth nhắc. .local/log/profile/khóa/dữ liệu thử không commit.
- Chưa có hosted/SMTP/HTTPS, UI quản lý thiết bị từ xa/retention receipt, giáo viên duyệt audio hoặc chương trình bốn tuần/sáu tháng. Giữ giới hạn sync/offline/local chưa mã hóa như mốc trước.
- Rà soát diff, kiểm tra tài liệu/secret/build/staged, commit và push main; hash/remote xác minh bằng Git ở bàn giao cuối, không force-push hoặc sửa lịch sử.
- Rà soát cuối: 15 Markdown/72 liên kết nội bộ/24 task hợp lệ, AI-001 READY duy nhất; diff --check đạt. Build từ chối cấu hình secret, quét auth build/worker và 37 file staged không thấy service key hoặc VAPID private key. Sau test/probe, Auth user, profile, snapshot, commit, reminder device/receipt và Mailpit đều 0; chỉ giữ cấu hình công khai/khóa local để dùng tiếp. Preview 4175 có worker nhắc; mở máy nhắc Node ẩn sau khi dọn test (log riêng trong .local).
