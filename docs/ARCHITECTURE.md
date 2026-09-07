# Kiến trúc dự kiến

Ngày cập nhật: 2026-09-07. Frontend, luồng học local, PWA/offline, Supabase Auth/RLS, đồng bộ và nhắc học Web Push đã triển khai/kiểm tra local. Nền tảng API/giao diện AI đã có, chưa gọi/đối chiếu provider thật; cloud hosted chưa triển khai. Các quyết định nằm trong [DECISIONS.md](DECISIONS.md).

## Hiện có trong code

- React + TypeScript + Vite, điều hướng hash cho năm khu vực, `/lesson/:id`, `/session`, `/install`, `/account` và `/reminders`; không cần cấu hình rewrite để mở đường dẫn bài học trên static host.
- `public/manifest.webmanifest`, `public/icons`, metadata trong `index.html`: tên, ID ở gốc origin, scope, start URL Hôm nay, standalone và bộ icon do dự án tạo. `scripts/generate-icons.js` tái tạo PNG từ SVG. Worker sinh lúc build lưu shell theo hash và gói bài có phiên bản khi người học chọn; hướng dẫn/quyền audio ở [OFFLINE.md](OFFLINE.md).
- `src/app/installation.ts` nhận sự kiện cài từ lúc khởi động, giữ prompt một lần qua điều hướng và xử lý từ chối/lỗi. Chỉ xác nhận chế độ cửa sổ từ display-mode hoặc navigator.standalone. `features/install/InstallPage.tsx` có hướng dẫn nền tảng và đường đến bản sao; xem [INSTALLATION.md](INSTALLATION.md), DEC-012.
- `src/content/lessons.ts`: giữ bảy bài cũ, xuất curriculum bốn tuần và catalogue 28 bài + bốn kiểm tra. `foundation.ts` chứa 21 bài mới/bốn kiểm tra với đoạn đọc, audioText, mục tiêu/nói/tự xem lại; nguồn và rà soát tại [CONTENT_REVIEW.md](CONTENT_REVIEW.md). Xem [CURRICULUM.md](CURRICULUM.md).
- `src/domain/learning.ts` và `session.ts`: chấm đáp án đóng, quản lý lượt làm, kết quả độc lập và lịch ôn đơn giản.
- `src/data/schema.ts`: schema Zod phiên bản 3 và đường đọc version 1/2, xem DEC-010/011. `study-store.ts` chứa logic độc lập, `store.ts` nối với trình duyệt; key khách giữ `moi-ngay.study.v1`, key tài khoản thêm URL backend và user ID. Giữ bản lỗi nguyên trạng, xuất/nhập bản sao, phản ánh lỗi ghi và giữ dữ liệu chưa lưu riêng trong bộ nhớ khi đổi chủ. Dữ liệu nhỏ gồm văn bản và tiến độ; giữ localStorage cho tiến độ, dùng Cache Storage riêng cho file công khai theo DEC-015.
- `src/services/supabase-config.ts` kiểm tra cấu hình công khai cả lúc Vite khởi động/build và trong client. Chỉ nhận publishable key, URL HTTPS hoặc HTTP loopback. `services/supabase.ts` tạo SDK có timeout request 12 giây, khóa phiên riêng theo backend; không xử lý token trong hash URL.
- `src/app/auth.ts` khôi phục phiên và lắng nghe thay đổi Auth; callback đồng bộ chuyển kho trước khi công bố người dùng, không gọi API khi SDK đang giữ lock. Phiên local chỉ chọn giao diện; server xác thực request và kiểm tra RLS độc lập. `features/account/AccountPage.tsx` có OTP, hồ sơ tên, retry và logout; GET hồ sơ tắt retry tự động để trả lỗi kịp thời cho người học.
- `supabase/migrations`: `account_profiles` với RLS CRUD; `study_snapshots` và `study_commits` đọc theo chủ, chỉ ghi qua RPC `commit_study`. Function xác nhận chủ, khóa hàng, kiểm tra revision, ghi snapshot/receipt atomic. Receipt dùng SHA-256 và các bản ghi thay đổi để chống gửi trùng, không sao chép cả lịch sử ở mỗi commit. Không có trigger nhập phần khách. Setup ở [BACKEND.md](BACKEND.md).
- `src/domain/sync.ts` gộp ba phía theo ID/lịch sử thật và chọn xung đột; `data/sync-schema.ts` định nghĩa metadata `_sync` nằm cùng state trong một lần ghi localStorage. Giữ phiên bản bản sao 3 và xuất không có metadata, ngoại trừ bản lỗi được giữ nguyên.
- `data/sync-engine.ts` giữ payload gửi cố định, retry/ack/rebase, không đánh dấu đã lưu trước server xác nhận; `services/study-sync.ts` validation response và AbortSignal. `app/sync.ts` quản lý vòng đời theo Auth, Web Locks một tab sửa theo chủ, online/focus/chu kỳ 15 giây. Hộp cài đặt tạm hoãn sync để giữ nội dung chưa lưu. UI ở `features/account/SyncPanel.tsx`; chi tiết [SYNC.md](SYNC.md).
- `src/domain/planner.ts`: ghép phiên 2/5/15 phút/buổi đầy đủ, tra kết quả theo ID, chuyển bước và ghi lượt khởi động. `domain/adaptation.ts` chọn theo tín hiệu bài/truy hồi, nhịp và sở thích; `content/prerequisites.ts` giữ quan hệ bài trước riêng học liệu. Giới hạn 10 hoạt động/ba câu ôn, nhịp nhẹ giảm thêm; plan/history lưu metadata tùy chọn và lý do trong schema v3. Giao diện ở `SessionChoices.tsx`, `SessionPage.tsx`, `Today.tsx`; xem [ADAPTATION.md](ADAPTATION.md).
- `src/app/clock.ts`: đọc thời gian mới khi render/đổi trang, thông báo cập nhật sau 30 giây hoặc khi tab lấy lại focus/hiển thị. Lịch ôn lưu thời điểm tuyệt đối; ngày hiển thị theo múi giờ trình duyệt.
- `src/components/ListenButton.tsx` phát 57 WAV eSpeak NG từ câu mẫu/audioText, có dừng/lỗi; worker trả byte range khi offline. Trong bài nghe mới, transcript là gợi ý giữ qua reload; nút nghe không submit form. Phần tự nói không ghi âm/chấm phát âm. Font/minh họa local; phát mẫu không gọi AI.
- `src/ai` chứa contract/client và UUID/hash theo kho; `features/ai/AiHint.tsx` gợi ý tùy chọn ở cuối bài. `server/ai` xác thực JWT, validation và adapter OpenAI Responses, `server/local.ts` mở HTTP loopback 8787 sau proxy cùng origin. `ai_budgets`/`ai_requests` có RLS, giữ ngân sách/receipt atomic trước gọi. AI mặc định tắt/0 USD; không đổi StudyState, lịch ôn hoặc nháp. `server/evaluate.ts` có chế độ kiểm tra mẫu không gọi AI và nhánh live cần cấu hình. Xem [AI.md](AI.md), [AI_EVALUATION.md](AI_EVALUATION.md), DEC-017.
- `src/offline/worker.js` nhận allowlist sinh bởi `scripts/offline-build.js`, kiểm tra hash và lưu shell/gói riêng. `app/offline.ts` quản lý đăng ký/lệnh, `features/install/OfflinePanel.tsx` tải/dung lượng/xóa/thông báo cập nhật. Không skipWaiting hay đụng kho tiến độ; chỉ kích hoạt sau khi cửa sổ cũ đóng.
- Khởi động mở chủ local từ phiên SDK lưu sẵn trước khi cần refresh token; sync chờ SDK xác nhận. UI phân biệt bản lưu với phiên đã khôi phục, không cấp quyền server từ thông tin local.
- `features/reminders` có form/lớp điều phối theo chủ, revision và Web Lock riêng. `src/reminders` được ghép vào worker khi build: IndexedDB chỉ giữ binding/ngày nhắc để lọc payload và chống lặp, không thay kho tiến độ. Ba bảng `reminder_service/devices/deliveries` lưu cấu hình công khai/lịch/receipt; Auth/RLS/RPC bảo vệ quyền và tính lịch trong PostgreSQL. Bộ gửi Node `scripts/reminder-sender.js`/`reminders-local.js` dùng `web-push` 3.6.7, khóa riêng chỉ ở `.local`. Xem [NOTIFICATIONS.md](NOTIFICATIONS.md), DEC-016; thông báo thật đã kiểm tra trong Chrome, chưa xác minh điện thoại/OS thật.
- Một bài dở tại một thời điểm. Chuyển sang bài khác cần xác nhận trong giao diện; tiếp tục cùng bài giữ câu đang nhập, đáp án/gợi ý và bài tự viết.
- Một phiên có danh sách hoạt động cố định, câu ôn/khởi động đang nhập, gợi ý và con trỏ lưu qua reload. Bài đầy đủ dùng lại LessonPlayer và draft cũ. Kết quả khởi động tách khỏi completions/reviewLog; chỉ chuyển bước khi có lượt thực tương ứng. `planner.ts` lưu snapshot `planHistory` khi hoàn tất/thay kế hoạch, giữ một bài dở.
- `src/domain/activity.ts`: đồng hồ hoạt động độc lập giao diện, phân ngày địa phương, checkpoint cộng dồn không trùng. `ActivityMeter.tsx` gắn lifecycle/focus/visibility và thao tác vào đồng hồ; `ActivityGate` dừng khi mở cài đặt. Epoch store ngăn callback cũ tái tạo dữ liệu sau reset/import/đổi chủ sở hữu; shell dựng lại form theo key kho, import kiểm tra epoch sau khi đọc file bất đồng bộ.
- `src/features/progress/Progress.tsx` và `src/domain/progress.ts`: biểu đồ bảy ngày, tổng đo, kết quả bài/ôn/khởi động, lịch sử phiên và lọc/phân trang. Phút đo tách khỏi dự kiến; chưa xây lịch sáu tháng cá nhân. Lịch sử đồng bộ dùng cùng dữ liệu này, không tạo số đo giả.

Các lệnh và phạm vi kiểm tra nằm trong [TESTING.md](TESTING.md). Đọc STATUS để biết phần nào đã đạt tiêu chí task.

## 1. Hướng công nghệ

| Phần | Lựa chọn khởi đầu | Mục đích |
| --- | --- | --- |
| Giao diện | React + TypeScript + Vite | Xây web app tương tác, ưu tiên màn hình điện thoại |
| Điều hướng | Các trang Hôm nay, Khám phá, Luyện tập, Ôn lại, Tiến bộ | Cho phép mở trực tiếp và tiếp tục bài học |
| Dữ liệu local | IndexedDB khi cần lưu bài, lượt làm và tài nguyên offline | Giữ tiến độ giữa các lần mở; không được xem là bản sao lưu đám mây |
| Tài khoản/backend | Supabase Auth, PostgreSQL, Storage | Đồng bộ tiến độ và quản lý dữ liệu riêng của người học |
| AI | Dịch vụ phía máy chủ, provider chọn sau thử nghiệm | Quản lý khóa bí mật, ngân sách, phản hồi và audio |
| Cài lên màn hình chính | Manifest/icons/standalone và service worker | Mở app với gói bốn tuần đã tải; cần kiểm tra thiết bị thật trước phát hành |
| App Store/Google Play | Capacitor ở giai đoạn sau | Tái sử dụng ứng dụng web, bổ sung tích hợp và quy trình phát hành riêng |

Phiên bản đã chọn nằm trong `package.json` và lockfile: React 19, Vite 8, TypeScript 5.9; CSS trực tiếp và Lucide, không có bộ UI bên ngoài. Điều hướng hash và lịch ôn khởi đầu đã triển khai. Nhà cung cấp AI và nơi deploy chưa chốt. Dùng npm cùng lockfile.

## 2. Phân chia trách nhiệm

```text
Trình duyệt / PWA
  Giao diện + bài học + lịch ôn local
          |
          +-- Kho dữ liệu local và hàng đợi đồng bộ
          |
          +-- Supabase Auth / dữ liệu riêng có kiểm soát truy cập
          |
          +-- API máy chủ cho AI
                    +-- xác thực, kiểm tra đầu vào, hạn mức
                    +-- gọi dịch vụ AI / audio
                    +-- phản hồi có cấu trúc và trạng thái lỗi
```

Không cần backend để hoàn thành luồng mẫu đầu tiên. Tách lớp truy cập dữ liệu từ sớm để chuyển từ local sang đồng bộ mà không viết lại các màn hình.

## 3. Cấu trúc mã nguồn mục tiêu

Đây là gợi ý cho APP-001 và các task sau; chỉ tạo thư mục khi có mã tương ứng.

```text
src/
  app/                  # Khởi động, điều hướng, layout
  features/
    onboarding/
    today/
    lessons/
    practice/
    review/
    progress/
  domain/               # Mô hình và logic học không phụ thuộc giao diện
  content/              # Học liệu được kiểm duyệt và metadata nguồn
  data/                 # Lưu local, đồng bộ, adapter backend
  services/             # Giao tiếp API, không chứa khóa bí mật
  components/           # Thành phần giao diện dùng chung
  styles/
public/                 # Tài nguyên công khai được phép phân phối
docs/                   # Tài liệu và bàn giao
```

Tránh tạo kiến trúc nhiều tầng khi chưa có nhu cầu. Đã có `features/account`, `services` và `supabase/migrations`; các thư mục mục tiêu chưa cần thì chưa tạo.

## 4. Mô hình dữ liệu ban đầu

Migration hiện có lưu `account_profiles`, `study_snapshots(user_id, revision, state, updated_at)`, `study_commits(user_id, mutation_id, base_revision, revision, payload_hash, changes, created_at)`, ba bảng nhắc và `ai_budgets`/`ai_requests`. Các nhóm khái niệm dưới đây nằm trong StudyState hoặc là mục tiêu sau này; chưa có lưu audio cá nhân hoặc bảng bài Writing đầy đủ:

| Nhóm | Thông tin cần lưu |
| --- | --- |
| Hồ sơ học | Mục tiêu, thời gian, sở thích, loại bài thi, múi giờ, kết quả đầu vào |
| Đơn vị học | ID, phiên bản, trình độ, mục tiêu, chủ đề, tài nguyên và nguồn sử dụng |
| Hoạt động | Loại câu hỏi, prompt, đáp án/rubric, gợi ý, giải thích |
| Lượt làm | ID duy nhất, người học, hoạt động, thời gian, câu trả lời, kết quả, mức hỗ trợ đã dùng |
| Trạng thái ôn | Người học, mục kiến thức, thời điểm ôn, lịch sử kết quả và phiên bản thuật toán |
| Bài nộp | Bài viết/audio, trạng thái tải lên, tham chiếu file riêng tư |
| Đánh giá | Nguồn AI/giáo viên/bài có đáp án, tiêu chí, phản hồi, hạn chế, ngày và phiên bản |
| Kế hoạch | Mục tiêu tuần, bài được chọn, thời lượng dự kiến, thay đổi theo tiến độ |

Một phiên hoàn thành phải được lưu từ hành động thực của người học. Dữ liệu demo có nhãn và không làm tăng tiến độ thật. Không lưu toàn bộ lịch sử đánh giá như một trường band duy nhất có thể bị ghi đè.

## 5. Luồng học và lịch ôn

- Chọn bài dựa trên kiến thức tiên quyết, nội dung đến hạn ôn, mục tiêu và sở thích.
- Ghi lại câu trả lời trước khi hiển thị đáp án; phân biệt đúng độc lập với đúng sau gợi ý.
- Phản hồi xác định được dùng cho câu hỏi có đáp án; gọi AI khi cần xử lý câu trả lời mở.
- Lịch ôn dùng các khoảng 1/3/7/14/30 ngày; sai hoặc có gợi ý quay lại sau 10 phút, xem DEC-009. Đây là thuật toán khởi đầu có test bằng thời gian giả lập, không phải FSRS hoặc ước lượng xác suất ghi nhớ.
- Không đổi lịch ôn chỉ vì người học xem thẻ hoặc tải lại trang.
- Giới hạn tải bài ôn mỗi ngày, giữ lại bài chưa ôn và ưu tiên lại sau thời gian nghỉ.
- Tách phút tương tác chủ động với thời gian tab đang mở; xử lý tab nền và thời gian không hoạt động khi triển khai đo lường.

## 6. Offline và đồng bộ

- Nêu rõ bài/tài nguyên nào đã tải và hoạt động nào cần mạng.
- AI trực tuyến cần mạng; có thể lưu bài viết/ghi âm chờ gửi nhưng không giả lập kết quả AI thành công.
- Mỗi lượt làm/bài nộp có ID ổn định để thử gửi lại không sinh bản sao.
- Giữ lịch sử lượt làm; dữ liệu tổng hợp cần quy tắc giải quyết xung đột cụ thể trước khi hỗ trợ nhiều thiết bị.
- Lưu thời điểm tuyệt đối ở UTC, tính ngày học theo múi giờ hồ sơ; kiểm tra tình huống qua nửa đêm.
- Chủ động thử đồng bộ khi mở app hoặc có mạng trở lại. Không dựa hoàn toàn vào khả năng chạy nền của hệ điều hành.
- Có trạng thái đang lưu/chờ đồng bộ/đã đồng bộ/lỗi và đường thử lại.
- DATA-002 chỉ sync phần tài khoản đã chọn bật. Kho khách giữ nguyên; nhập có xem/chọn trước. Kho chưa mã hóa, không bảo vệ khỏi người đọc máy. Khôi phục JSON/reset tắt sync ở máy và không xóa server. Cùng origin một tab sửa tài khoản; khác browser context dùng gộp/xung đột theo revision. Xem DEC-013/014 và SYNC.

## 7. Truy cập, audio và chi phí AI

- Các bảng dữ liệu cá nhân và file audio riêng tư cần chính sách truy cập theo chủ sở hữu; kiểm thử bằng hai tài khoản.
- Khóa dịch vụ, token bí mật và thông tin thanh toán không nằm ở client hay Git.
- Xin quyền microphone tại lúc người học bắt đầu ghi; hỗ trợ từ chối quyền, hủy, nghe lại và gửi lại.
- Người học cần biết audio được gửi đi để xử lý và có cách xóa. Chính sách thời gian lưu phải được chốt trước khi dùng dữ liệu thật trên cloud.
- API AI phải xác thực, giới hạn kích thước bài/audio, thời lượng, tần suất và chi phí; xử lý timeout và retry có kiểm soát.
- Nội dung người học hoặc tài liệu đưa vào AI được coi là dữ liệu, không có quyền thay đổi quy tắc hệ thống hay truy cập dữ liệu khác.
- Log vận hành ưu tiên metadata; không mặc định ghi nội dung bài cá nhân, audio hay khóa bí mật.

## 8. Chất lượng và kiểm tra

- APP-001: cài dependency, lint, typecheck, build và kiểm tra mở trang thực tế; chưa cần test cho nội dung placeholder.
- Logic học: kiểm thử chấm đáp án, kết quả sau thử lại, lịch ôn và khôi phục phiên.
- Đồng bộ: mất mạng, reload, gửi lặp và tiếp tục trên thiết bị khác.
- Dữ liệu cloud: kiểm thử quyền giữa hai tài khoản và đường xóa dữ liệu.
- AI: đối chiếu tập bài mẫu có nhận xét của người kiểm duyệt; lỗi dịch vụ không được làm mất bài.
- PWA: kiểm tra cài đặt và phạm vi offline trên trình duyệt/thiết bị thật; mô phỏng màn hình nhỏ không thay thế kiểm thử iOS/Android.
- Khả năng tiếp cận: bàn phím, nhãn điều khiển, tương phản, phụ đề/transcript và trạng thái focus.

Chỉ ghi các môi trường và lệnh thực sự đã kiểm tra. Điều kiện cần tài khoản, thiết bị hoặc chi phí được ghi rõ ở task liên quan, không ngăn cản phần local độc lập.

## 9. Artifact triển khai (DEPLOY-001)

`scripts/release/` dùng Vite API riêng để tắt tải `.env`, tự động đưa biến env vào browser và cấu hình proxy local. JSON public nhận chế độ khách/tài khoản (Supabase hosted chuẩn); release ép production, AI tắt. Giữ luồng build/dev/Auth cũ. `site/` chỉ chứa tài nguyên public được cho phép, có hash để verify và `_headers`/404 cho Pages; `release.json` chứa metadata/schema nằm ngoài web root. Mỗi lần tạo thư mục mới, không xóa release cũ.

App đặt ở root origin, route hash. Preview 4176 đọc artifact đã verify, áp header cùng nguồn với `_headers`, không phục vụ file ngoài bản kê hoặc proxy API. Đây vẫn là loopback HTTP; chưa kiểm tra deployment/CDN/HTTPS thật. Giữ origin và khả năng đọc dữ liệu khi update/rollback. Chi tiết, giới hạn account/API/SMTP, hướng dẫn Pages và checklist thiết bị ở [DEPLOYMENT.md](DEPLOYMENT.md), DEC-020.

## 10. Tham khảo triển khai

- [Vite](https://vite.dev/guide/)
- [Supabase](https://supabase.com/docs)
- [PWA installation](https://web.dev/learn/pwa/installation?hl=en)
- [WebKit: Web Push cho Home Screen web apps](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)
- [Capacitor](https://capacitorjs.com/docs)

Các khả năng nền tảng có thể thay đổi; kiểm tra lại tài liệu chính thức lúc triển khai chức năng tương ứng.
