# Chạy và kiểm tra ứng dụng

## Adapter Neon DATA-003

`npm run test:neon` cần Docker local đang chạy (`npm run db:start`) và Chrome theo PLAYWRIGHT_CHANNEL hoặc mặc định chrome. Script tạo database/login thử riêng trên PostgreSQL local, áp migration Neon và dọn phần tự tạo. Kiểm tra RLS/CAS/replay/rollback/quyền nhắc/budget, HTTP JWT/owner/schema/CSRF, browser OTP/profile/đồng bộ hai thiết bị/offline/mất phản hồi/reload/đổi chủ/cookie HttpOnly. Auth REST dùng fixture và JWT ký bằng khóa thử; không gọi Neon hosted, SMTP hoặc AI thật, không ghi trace/token. Không chạy đồng thời với release:build/build:vercel/test:release vì dùng con trỏ latest artifact.

151 unit tại mốc DATA-003, gồm chữ ký/claims/cookie và vòng đời Auth muộn sau đổi chủ. Regression legacy chọn `npm run test:auth -- account.spec.ts sync.spec.ts`; giữ Supabase local cho các bài kiểm tra cũ. Cloud Neon/Render/Vercel và thiết bị thật phải ghi kết quả riêng trong DEPLOY-002, xem [NEON_BACKEND.md](NEON_BACKEND.md).

## Bản phát hành DEPLOY-001

`npm run test:release` tạo artifact khách rồi chạy 38 ca với Chrome desktop và viewport 360px qua preview 4176. Gồm 34 ca tái sử dụng học/bản sao/thích ứng/offline và bốn ca riêng HTTP/cache/404/CSP/AI tắt. Test đổi worker phục vụ chính tài nguyên release trên origin thử riêng, không phụ thuộc `dist` cũ. Không chạy đồng thời hai bộ release hoặc tạo release khác khi bộ này đang dùng con trỏ latest.

DEPLOY-001 thêm 10 ca ranh giới cấu hình/header/file public; mốc đó có 135 unit. Kiểm tra thực thi build khách/tài khoản bằng giá trị thử trong env đã xác minh không kế thừa URL local hoặc marker khóa riêng, kể cả NODE_ENV development; không gọi hosted/AI thật. Verify phát hiện artifact bị sửa. Phạm vi và checklist còn cần HTTPS/iPhone/Android thật ở [DEPLOYMENT.md](DEPLOYMENT.md). Kết quả từng lượt ở STATUS/SESSION_LOG, không coi việc định nghĩa test là đã chạy.

## Môi trường

Đã dùng Node 22.18.0, npm 10.9.3 trên Windows. `package.json` giới hạn Node 22.13+ thuộc nhánh 22 để build local và hosting thống nhất. Dùng `npm ci` để cài từ lockfile. Trên PowerShell có thể dùng `npm.cmd` thay `npm`.

```sh
npm ci
npm run dev
```

Mở http://127.0.0.1:5173. Cổng cố định; nếu đang được dùng, kiểm tra tiến trình thay vì tự dừng ứng dụng khác. Dữ liệu của localhost và 127.0.0.1 nằm ở hai origin khác nhau; dùng cùng địa chỉ khi muốn tiếp tục tiến độ local.

## Các lệnh kiểm tra

```sh
npm run lint
npm run typecheck
npm test
npm run test:e2e
```

`test:e2e` tự build rồi dùng Vite preview tại cổng 4173, tách với dev server 5173. Playwright mặc định dùng Google Chrome đã cài trên máy; hai cấu hình là desktop 1440×1000 và màn hình điện thoại 360×800. Nếu dùng Chromium do Playwright quản lý, cài bằng `npx playwright install chromium` rồi đặt `PLAYWRIGHT_CHANNEL=chromium` cho lệnh test (trong PowerShell: `$env:PLAYWRIGHT_CHANNEL = 'chromium'`).

`npm run format` định dạng source, tests và cấu hình bằng Prettier. `npm run build` tạo dist; `npm run preview` chỉ xem build local.

## Phạm vi

- Vitest: 144 ca về chấm đáp án, vòng đời 32 bài/kiểm tra, lịch ôn, ghép phiên, thời gian, cấu hình/adapter AI và tương thích version 1/2/3. Có kiểm tra kho theo chủ, quota, dữ liệu lỗi và cấu hình công khai. DATA-002 thêm 8 ca gộp ba phía/lượt trùng/lịch ôn/checkpoint/xung đột và 9 ca engine: bật tự nguyện, outbox qua reload, mất phản hồi, thay đổi trong lúc gửi, offline, quota, đổi chủ, reset/import và hoãn khi mở cài đặt.
- Playwright: luồng học thực trên bản build; giữ bài dở sau reload, giữ cả lựa chọn/câu đang nhập, ôn đến hạn khi đổi ngày, ghi lịch ôn một lần, cài đặt và bản sao xuất/nhập, dữ liệu lỗi, quota, bộ lọc và URL không tồn tại.
- Tổng 80 ca trình duyệt chế độ khách (40 kịch bản × hai kích thước), gồm mục tiêu/ngày/loại thi chưa quyết định, phiên 2/5/15/buổi đầy đủ, tiếp tục, bản sao, bộ đo/lịch sử tiến bộ và PWA/offline. Có trang tài khoản chưa cấu hình, đường tiếp tục học/focus/axe. Ca buổi đầy đủ kiểm tra tối đa 10 hoạt động và thời gian còn trống, không tự coi các bài đã hoàn thành.
- `domain/adaptation.test.ts`: 11 ca gồm đồ thị bài trước không vòng lặp, thứ tự qua mọi điểm dừng danh mục, sở thích không vượt bài trước, ưu tiên tín hiệu hỗ trợ, kết quả mới/timestamp tương lai/thứ tự sau sync, giới hạn từng nhịp/ngân sách, giữ draft, mốc bảy ngày, metadata qua bản sao/gộp/thay phiên và từ chối metadata lỗi. Các quy tắc là giả định sản phẩm thử nghiệm, test không xác nhận hiệu quả học.
- `tests/adaptation.spec.ts`: ba kịch bản × hai kích thước về khó quá khi mở mới offline, giữ draft/kết quả/lịch sử; quay lại sau nghỉ và mệt không dồn 32 thẻ ôn; hỗ trợ trước sở thích và hủy/chấp nhận thay nhịp. Axe A/AA, không tràn ngang, ảnh hai kích thước. Ca hai thiết bị trong `tests/auth/sync.spec.ts` xác minh nhịp và lý do nguyên vẹn qua Auth/DB thật.
- `tests/curriculum.spec.ts`: bốn tuần hữu hạn, bộ lọc theo tuần, đọc/nghe trong bài mới, lời thoại tính là gợi ý qua reload, nút nghe không nộp form, lưu câu tự viết và ôn. Hoàn thành cả bốn kiểm tra cuối tuần qua UI sau khi đóng trang/mở mới offline, nghe WAV có `currentTime` tăng, giữ kết quả sau reload; quét axe và tràn ngang ở Khám phá. Không đo chất lượng âm thanh/phát âm hoặc hiệu quả học trên người thật.
- Gói hiện tại có 58 tài nguyên, khoảng 8,92 MB. Worker vẫn xác minh mọi file; cập nhật tiến độ mỗi tám file để giảm quét cache. Các ca tải gói chờ tối đa 20 giây trên máy thử, không phải cam kết tốc độ tải trên thiết bị/mạng khác. Unit ghép phiên kiểm tra kế hoạch 10 hoạt động vẫn đọc được qua schema bản sao version 3.
- `tests/progress.spec.ts`: không cộng thời gian nghỉ, dừng thủ công/cài đặt/rời bài, reload, giữ kết quả khởi động riêng, lịch sử phiên đổi/hoàn tất, và không ghi trở lại sau import/reset. Test đổi tab tắt focus emulation của Playwright qua CDP để dùng sự kiện blur/focus của trình duyệt.
- Chrome headless vẫn có thể báo mọi tab là visible; ca visibility/pagehide/pageshow dùng giá trị/sự kiện được điều khiển rõ trong test để kiểm tra handler. Không xem ca mô phỏng này là xác minh lifecycle native trên iOS/Android hoặc thiết bị bị kill.
- Điều hướng, focus bàn phím, không tràn ngang ở 360px và desktop.
- `tests/install.spec.ts`: đọc manifest/giải mã bốn PNG và `Page.getInstallabilityErrors` bằng hồ sơ Chrome tạm riêng (context ẩn danh mặc định bị Chrome chặn cài). Không bấm cài lên hệ điều hành hoặc dùng profile cá nhân. Kiểm tra start URL mở lại phiên/câu/gợi ý trong cùng kho, điều hướng từ cài đặt và axe cả ba hướng dẫn.
- Luồng deferred prompt/từ chối/lỗi/chấp nhận/appinstalled và hai tín hiệu standalone được điều khiển rõ trong test; xác minh handler và phản hồi, không phải cài thật. Không kết luận standalone chỉ từ `userChoice: accepted` hoặc `appinstalled`.
- Đã thử riêng safe-area qua CDP ở 390×844 với top 47/bottom 34, và 844×390 với left/right 47/bottom 21. Không tràn ngang hoặc lỗi runtime; bản ngang thấp dùng thanh điều hướng dưới để cả năm mục vẫn tới được. Đây là mô phỏng CSS insets, chưa phải Safari/thiết bị thật.
- Axe: quét các trang chính, giới thiệu bài, cài đặt, phiên dài, câu khởi động/phản hồi/kết quả và Tiến bộ có dữ liệu với tập luật WCAG A/AA. Kết quả này chỉ là kiểm tra tự động, không phải chứng nhận khả năng tiếp cận đầy đủ.

Kết quả cuối mỗi mốc nằm trong [STATUS.md](STATUS.md) và [SESSION_LOG.md](SESSION_LOG.md). Không báo test đã đạt chỉ vì file test đã tồn tại.

## Auth và quyền dữ liệu trên backend thật

```sh
npm run db:start
npm run db:migrate
npm run test:auth
```

Cần Docker và Supabase local của repo đang chạy; xem [BACKEND.md](BACKEND.md). Runner tự build vào `.local/auth-dist` chỉ với cấu hình công khai, mở preview 4174 và dùng `playwright.auth.config.ts`. Chạy tuần tự một worker, tách khỏi 80 ca khách; không cần `.env`. Khi chạy bộ khách, để hai biến Supabase trống vì ca chưa cấu hình kiểm tra chính trạng thái này.

- 50 ca: mười hai ca API và mười chín kịch bản UI ở mỗi kích thước 1440×1000/360×800. Dùng Auth/PostgreSQL thật và thư từ Mailpit, không thay phản hồi đăng nhập thành công bằng mock. Riêng provider AI dùng fixture có nhãn, chưa gọi dịch vụ thật.
- `tests/auth/rls.spec.ts`: hai người dùng thực có phiên riêng; đọc/tạo/sửa/xóa của mình, chặn đọc/ghi/đổi chủ/xóa của người khác, chặn chưa đăng nhập và sửa thời điểm tạo, giới hạn tên. Xóa hàng của mình được kiểm tra ở API; app chưa có giao diện xóa tài khoản.
- `tests/auth/account.spec.ts`: đăng ký bằng OTP, mã sai, lưu tên và khôi phục phiên sau reload; tách kho khách/A/B qua hai tab; tiến độ của A được giữ và bộ đo không tạo dữ liệu cho B; import đang đọc file không vượt qua lần đăng xuất.
- `tests/auth/sync-api.spec.ts`: quyền đọc theo chủ/chặn chưa đăng nhập, RPC khác chủ và ghi bảng trực tiếp, payload sai, hai commit đồng thời chỉ một được ghi, retry song song không tăng revision, không tái dùng UUID cho payload khác, receipt cũ không làm lùi snapshot. Kiểm tra nhật ký chỉ ghi trường đã đổi và hash payload.
- `tests/auth/sync.spec.ts`: hai context độc lập cùng tài khoản nhận bài/lịch ôn/phiên/câu đang nhập; thiết bị thứ hai có phiên OTP riêng. Một phần dữ liệu lịch sử ban đầu là fixture đã định nghĩa, thao tác tiếp tục/nhập câu thực hiện qua UI.
- Mô phỏng offline bằng context Playwright khi app đã mở; khôi phục mạng và reload giữ outbox. Giữ phản hồi sau khi server thật đã chấp nhận rồi trả 503 để kiểm tra gửi lại đúng UUID. Trường hợp khác giữ response đến sau logout/đăng nhập B, xác minh không ghi vào B. Không coi đây là kiểm thử sóng mạng/OS native.
- Xung đột câu đang nhập hiển thị cả hai phía, giữ qua reload và có lựa chọn; nhập phần khách không tự gửi trước chọn và giữ nguồn. Tab thứ hai chờ Web Lock và tiếp tục khi tab giữ khóa đóng.
- Kịch bản lỗi inject HTTP 503 cho tải/lưu tên, gửi mã và logout; kiểm tra giữ nội dung, thử lại với server thật và trạng thái local khi không có xác nhận logout máy chủ. Đây là kiểm tra xử lý lỗi có điều khiển, chưa phải đo độ ổn định mạng/SMTP production.
- Một số kịch bản chuẩn bị bằng phiên thật được cấp qua đăng nhập mật khẩu của tài khoản thử, rồi nạp vào storage để đi thẳng vào phần cần kiểm tra. Ca đăng ký/đăng nhập OTP được kiểm tra riêng qua UI và email thật ở Mailpit. Không kết luận email đã tới hộp thư bên ngoài.
- Quét axe A/AA ở form mã, tài khoản, đồng bộ thành công và xung đột; kiểm tra tràn ngang ở màn hình đã đồng bộ và xem ảnh desktop/mobile. Trace Auth tắt để không ghi response chứa token; ảnh chỉ dùng dữ liệu thử và nằm trong `.local`.
- Helper chỉ chấp nhận backend/hộp thư loopback đúng cổng repo, tạo email ngẫu nhiên `moi-ngay-<uuid>@example.test`, dùng secret key local trong Node để dựng/dọn đúng tài khoản đó. Không truyền key này cho Vite hoặc đưa vào Git. Không chạy suite lên cloud.
- Chưa kiểm tra SMTP bên ngoài, hosted, mã hết hạn qua thời gian dài, chính sách chống abuse production, thu hồi JWT trước expiry, dữ liệu nhiều tháng hoặc Safari/điện thoại thật. Sync kiểm tra bằng hai browser context. PWA-002 thêm các ca mở mới offline ở bản build, mô tả bên dưới.

## PWA offline trên bản build

- `src/offline/range.test.ts`: hai ca đơn vị cho khoảng byte có chặn biên, suffix, EOF và khoảng sai/nhiều khoảng. Mốc PWA-002 có 78 ca, NOTIFY-001 có 82, nền tảng AI-001 có 89, CONTENT-002 có 114; ADAPT-001 có 125; DEPLOY-001 có 135; tổng hiện tại 144 sau chuẩn bị DEPLOY-002.
- `tests/offline.spec.ts`: năm kịch bản × desktop/mobile = 10 ca, gồm tải/đóng cửa sổ/mở mới khi context offline/phát WAV thật, trả HTTP 206/416, hoàn thành và lưu bài/lịch ôn; xóa gói giữ tiến độ/shell/cache khác; integrity thất bại/reload/thử lại và file bị thu hồi; giả lập `QuotaExceededError` ở worker rồi tải lại; allowlist loại request cá nhân.
- Kịch bản nâng phiên bản dùng `tests/offline-update-server.ts`, HTTP server riêng/port ngẫu nhiên cho từng ca, phục vụ hai bộ shell/pack manifest khác nhau từ bản build thật. Worker cũ chờ các cửa sổ đóng; test đợi trạng thái activation thực rồi mở bản mới, kiểm tra nguyên văn draft/outbox ở cả key khách/tài khoản fixture, dọn cache cũ, tải gói mới và reload offline. Không sửa dist của test khác hoặc gọi skipWaiting trong fixture.
- `tests/auth/offline.spec.ts`: hai kịch bản × hai kích thước = bốn ca, mở mới offline với `expires_at` của phiên SDK đã qua hạn (JWT server vẫn do Auth cấp), làm/nộp khởi động, kết nối lại, nhận 503 sau commit thật rồi reload/gửi lại đúng UUID. Kiểm tra riêng A/B dùng chung gói công khai nhưng cache không chứa response/token/nội dung riêng và B không thấy tiến độ A.
- Context offline là mô phỏng mạng của Chrome; navigator.onLine khi tạo trang mới có thể còn báo online. Code mở chủ local trước và chờ SDK xác nhận phiên trước sync, không dựa một mình vào cờ này để chặn toàn bộ giao diện. Thiết bị/OS thật vẫn cần xác minh.
- Kiểm tra axe A/AA, không tràn ngang và ảnh màn hình tải đủ ở 1440×1000/360×800. Kết quả phát/giải mã không xác nhận phát âm đúng; audio chưa có giáo viên độc lập duyệt.
- Build có kiểm tra byte/hash và nội dung bài trùng gói; `npm run audio` chỉ dùng khi sửa học liệu/file nghe. Không tạo audio từ dữ liệu cá nhân hoặc đưa bản thu thật vào Git. Hướng dẫn sử dụng/phạm vi ở [OFFLINE.md](OFFLINE.md).

## Dữ liệu và giới hạn thực tế

- Test dùng browser context tách biệt và dữ liệu giả riêng; không dùng hồ sơ học thật của người dùng.
- Ảnh, trace và báo cáo lỗi nằm trong test-results hoặc .local, được gitignore. Không đưa audio hoặc bản sao cá nhân vào Git.
- Chưa kiểm thử Safari/iPhone hoặc Android thật, cài/khởi chạy từ biểu tượng hệ điều hành, microphone, provider AI thật hoặc tài khoản cloud hosted. PWA offline/Auth/RLS/nhắc học đã kiểm tra trên Chrome/local trong phạm vi các mục riêng. Quy trình kiểm tra thiết bị nằm trong [INSTALLATION.md](INSTALLATION.md).
- 57 WAV có byte/hash/header hợp lệ; các ca Chrome xác minh phát thật ở bài cũ, bài shopping và bốn kiểm tra tuần. Chưa nghe duyệt toàn bộ âm thanh bằng người; không xác minh chất lượng phát âm bằng test trình duyệt.
- Bộ 28 bài + bốn kiểm tra được rà soát nội bộ; test không thay đánh giá của giáo viên hay đo hiệu quả sau thời gian học. Xem [CONTENT_REVIEW.md](CONTENT_REVIEW.md).

## Gia sư AI

- `server/ai/provider.test.ts`: 7 ca trong tổng hiện tại **144 unit**. Kiểm tra cấu hình tắt/khóa/hạn mức, JSON schema, prompt tách dữ liệu, body/output, refusal/incomplete, quote không tồn tại, không retry provider và dự toán token. Không gọi mạng OpenAI.
- `tests/auth/ai-api.spec.ts`: **5 ca** với JWT/Auth/PostgreSQL thật và provider fixture: giả mạo/khác chủ/RLS/service-only/body/origin; giữ chỗ đồng thời, replay sau restart, đổi hash/24 giờ, ngân sách không reset sau xóa user; timeout unknown giữ tiền, cooldown/quota/cap active và tự tắt khi usage bất thường.
- `tests/auth/ai.spec.ts`: **3 ca × 2 viewport**. AI chưa cấu hình vẫn lưu/reload/hoàn thành; chưa đồng ý không gọi; sau xử lý thật ở server fixture mới làm mất response, reload khi hết ngân sách vẫn replay UUID cũ/1 lần provider; sửa câu/đổi chủ khi chờ giữ draft và không lộ kết quả. API test được chuyển qua route đến HTTP server riêng, Auth/RLS thật; không gọi đây là AI thật.
- Tổng bộ Auth hiện tại **50 ca**, khách **80 ca**. Axe A/AA vùng AI, không tràn ngang, xem ảnh desktop/mobile. Chưa thử Safari/điện thoại thật. Không có API key/tokens trong trace/report Git.
- `npm run ai:evaluate` đã kiểm tra 10 mẫu gốc; đây là validation không đánh giá chất lượng. Nhánh `--live` cần cấu hình và có thể tốn phí, chưa chạy với provider thật; quy trình/rubric ở [AI_EVALUATION.md](AI_EVALUATION.md).
- Đã kiểm tra Node chạy máy AI local mặc định tắt; build chặn `VITE_OPENAI_API_KEY`, không đóng gói secret máy chủ hoặc adapter OpenAI. Tài liệu setup/retention/hạn mức ở [AI.md](AI.md).

## Nhắc học

- `src/features/reminders/reminders.test.ts`: thêm bốn ca validation/giờ yên lặng/bộ lọc worker/host endpoint và thứ tự ghi attempt trước gửi, không retry kết quả chưa rõ.
- `tests/auth/reminders-api.spec.ts`: bốn ca với PostgreSQL thật về quyền/RLS/CAS/null/endpoint, lịch ngày/múi giờ/DST, claim đồng thời/một lượt/ngày/skip quá giờ và yên lặng, dời/hủy revision cũ/endpoint hết hạn. Claim có tham số service-only giới hạn đúng thiết bị thử để không thay lịch của người dùng khác.
- `tests/auth/reminders.spec.ts`: bốn kịch bản × hai viewport. Không tự hỏi quyền; từ chối vẫn học; lưu qua reload; bật/dời/tắt/đăng xuất; mất response và đổi chủ trong request đã được nhận. Permission/subscription được điều khiển rõ, RPC/IndexedDB/worker thật. CDP đưa payload vào worker để thử thông báo chung, chặn revision/lượt trùng và click chỉ về Hôm nay. Axe A/AA và không tràn ngang; chưa thay thiết bị thật.
- `npm run test:auth` thêm bước `reminders:local -- --setup`, tạo/đọc khóa ở `.local`, chưa chạy vòng gửi. Không commit file khóa, trace Auth, profile hoặc ảnh dữ liệu thử.
- `npm run reminders:verify` kiểm tra Web Push qua mạng thật riêng: tài khoản local/hồ sơ Chrome tạm, subscription thật, đóng các trang app, gửi chỉ cho ID thiết bị thử, xác nhận `getNotifications()`, hủy và dọn tài khoản. Đã đạt trên Chrome Windows với 0 trang mở. Chưa xác minh màn hình OS, tắt toàn bộ Chrome, iPhone/Android, public HTTPS hoặc máy gửi hosted. Cách chạy/giới hạn ở [NOTIFICATIONS.md](NOTIFICATIONS.md).

## Vercel/Render — DEPLOY-002 đang thực hiện

- Tổng 144 unit: thêm validation Render/origin/port/ngân sách, HTTP health không bỏ auth, cấu hình public/proxy Vercel và metadata Git/provider. Mã boot Node 22.18 được smoke bằng transport DB fixture có nhãn; không gọi hosted hoặc provider thật.
- Thực thi build:vercel với giá trị public thử và marker secret: 98 static file đúng hash, Build Output API v3/routing được kiểm tra; biến không được chọn không xuất hiện. Thử cả tình huống không có Git checkout dùng SHA hệ thống và dirty null. Đây không phải xác minh Vercel edge đã chạy các route.
- 38 ca release khách sau tách createRelease và năm ca API AI với Auth/DB local thật đạt. Không chạy lại toàn bộ 80 khách/50 Auth. Lint loại .vercel/output là file sinh; source vẫn được lint. Không gọi phí, không áp migration cloud, không kiểm tra SMTP hay điện thoại thật. Hướng dẫn và phép thử hosting tiếp theo ở [DEPLOY_VERCEL_RENDER_SUPABASE.md](DEPLOY_VERCEL_RENDER_SUPABASE.md).
