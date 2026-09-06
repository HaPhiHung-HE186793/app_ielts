# Kiến trúc dự kiến

Ngày cập nhật: 2026-09-06. Frontend, luồng học local, cấu hình/hướng dẫn cài PWA và Supabase Auth/RLS local đã triển khai. Đồng bộ, cloud hosted, AI và PWA offline vẫn là kế hoạch. Các quyết định và giả định nằm trong [DECISIONS.md](DECISIONS.md).

## Hiện có trong code

- React + TypeScript + Vite, điều hướng hash cho năm khu vực, `/lesson/:id`, `/session`, `/install` và `/account`; không cần cấu hình rewrite để mở đường dẫn bài học trên static host.
- `public/manifest.webmanifest`, `public/icons`, metadata trong `index.html`: tên, ID ở gốc origin, scope, start URL Hôm nay, standalone và bộ icon do dự án tạo. `scripts/generate-icons.js` tái tạo PNG từ SVG. Chưa có service worker; cài từ web không đồng nghĩa offline.
- `src/app/installation.ts` nhận sự kiện cài từ lúc khởi động, giữ prompt một lần qua điều hướng và xử lý từ chối/lỗi. Chỉ xác nhận chế độ cửa sổ từ display-mode hoặc navigator.standalone. `features/install/InstallPage.tsx` có hướng dẫn nền tảng và đường đến bản sao; xem [INSTALLATION.md](INSTALLATION.md), DEC-012.
- `src/content/lessons.ts`: bảy bài thử nghiệm; nguồn và rà soát tại [CONTENT_REVIEW.md](CONTENT_REVIEW.md).
- `src/domain/learning.ts` và `session.ts`: chấm đáp án đóng, quản lý lượt làm, kết quả độc lập và lịch ôn đơn giản.
- `src/data/schema.ts`: schema Zod phiên bản 3 và đường đọc version 1/2, xem DEC-010/011. `study-store.ts` chứa logic độc lập, `store.ts` nối với trình duyệt; key khách giữ `moi-ngay.study.v1`, key tài khoản thêm URL backend và user ID. Giữ bản lỗi nguyên trạng, xuất/nhập bản sao, phản ánh lỗi ghi và giữ dữ liệu chưa lưu riêng trong bộ nhớ khi đổi chủ. Dữ liệu nhỏ gồm văn bản và tiến độ; chưa dùng IndexedDB/audio cache.
- `src/services/supabase-config.ts` kiểm tra cấu hình công khai cả lúc Vite khởi động/build và trong client. Chỉ nhận publishable key, URL HTTPS hoặc HTTP loopback. `services/supabase.ts` tạo SDK có timeout request 12 giây, khóa phiên riêng theo backend; không xử lý token trong hash URL.
- `src/app/auth.ts` khôi phục phiên và lắng nghe thay đổi Auth; callback đồng bộ chuyển kho trước khi công bố người dùng, không gọi API khi SDK đang giữ lock. Phiên local chỉ chọn giao diện; server xác thực request và kiểm tra RLS độc lập. `features/account/AccountPage.tsx` có OTP, hồ sơ tên, retry và logout; GET hồ sơ tắt retry tự động để trả lỗi kịp thời cho người học.
- `supabase/migrations` định nghĩa `account_profiles` với khóa ngoại Auth và chính sách RLS theo chủ sở hữu cho CRUD. Không có bảng tiến độ cloud hoặc trigger nhập dữ liệu khách. Template mã email và cấu hình Docker ở `supabase/`; setup/test ở [BACKEND.md](BACKEND.md).
- `src/domain/planner.ts`: ghép phiên 2/5/15 phút/buổi đầy đủ từ học liệu và mục đến hạn, tra kết quả theo ID, chuyển bước và ghi lượt khởi động. Giao diện ở `SessionChoices.tsx`, `SessionPage.tsx`; form cài đặt mở rộng thành điểm bắt đầu tùy chọn.
- `src/app/clock.ts`: đọc thời gian mới khi render/đổi trang, thông báo cập nhật sau 30 giây hoặc khi tab lấy lại focus/hiển thị. Lịch ôn lưu thời điểm tuyệt đối; ngày hiển thị theo múi giờ trình duyệt.
- SpeechSynthesis cho câu mẫu tùy khả năng thiết bị; font và minh họa được đóng gói local. Không có lời gọi API AI.
- Một bài dở tại một thời điểm. Chuyển sang bài khác cần xác nhận trong giao diện; tiếp tục cùng bài giữ câu đang nhập, đáp án/gợi ý và bài tự viết.
- Một phiên có danh sách hoạt động cố định, câu ôn/khởi động đang nhập, gợi ý và con trỏ lưu qua reload. Bài đầy đủ dùng lại LessonPlayer và draft cũ. Kết quả khởi động tách khỏi completions/reviewLog; chỉ chuyển bước khi có lượt thực tương ứng. `planner.ts` lưu snapshot `planHistory` khi hoàn tất/thay kế hoạch, giữ một bài dở.
- `src/domain/activity.ts`: đồng hồ hoạt động độc lập giao diện, phân ngày địa phương, checkpoint cộng dồn không trùng. `ActivityMeter.tsx` gắn lifecycle/focus/visibility và thao tác vào đồng hồ; `ActivityGate` dừng khi mở cài đặt. Epoch store ngăn callback cũ tái tạo dữ liệu sau reset/import/đổi chủ sở hữu; shell dựng lại form theo key kho, import kiểm tra epoch sau khi đọc file bất đồng bộ.
- `src/features/progress/Progress.tsx` và `src/domain/progress.ts`: biểu đồ bảy ngày, tổng đo, kết quả bài/ôn/khởi động, lịch sử phiên và lọc/phân trang lượt luyện. Phút đo tách khỏi dự kiến; chưa xây lịch sáu tháng cá nhân. Chưa hỗ trợ chỉnh sửa đồng thời an toàn từ nhiều tab hay đồng bộ nhiều thiết bị.

Các lệnh và phạm vi kiểm tra nằm trong [TESTING.md](TESTING.md). Đọc STATUS để biết phần nào đã đạt tiêu chí task.

## 1. Hướng công nghệ

| Phần | Lựa chọn khởi đầu | Mục đích |
| --- | --- | --- |
| Giao diện | React + TypeScript + Vite | Xây web app tương tác, ưu tiên màn hình điện thoại |
| Điều hướng | Các trang Hôm nay, Khám phá, Luyện tập, Ôn lại, Tiến bộ | Cho phép mở trực tiếp và tiếp tục bài học |
| Dữ liệu local | IndexedDB khi cần lưu bài, lượt làm và tài nguyên offline | Giữ tiến độ giữa các lần mở; không được xem là bản sao lưu đám mây |
| Tài khoản/backend | Supabase Auth, PostgreSQL, Storage | Đồng bộ tiến độ và quản lý dữ liệu riêng của người học |
| AI | Dịch vụ phía máy chủ, provider chọn sau thử nghiệm | Quản lý khóa bí mật, ngân sách, phản hồi và audio |
| Cài lên màn hình chính | Đã có manifest/icons/standalone; service worker dành cho PWA-002 | Chuẩn bị mở như ứng dụng; offline có phạm vi riêng, chưa triển khai |
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

Migration hiện có chỉ lưu `account_profiles(id, display_name, created_at)`. Các nhóm dữ liệu dưới đây là mô hình mục tiêu, chưa phải schema cloud đã triển khai:

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
- DATA-001 giữ kho học theo URL backend/user ID, ẩn khi đăng xuất và mở lại kho khách; không tự upload. Kho chưa mã hóa, không phải ranh giới bảo mật với người có quyền đọc máy. Import/reset chỉ ảnh hưởng kho đang mở. Đồng bộ nhiều thiết bị và hợp nhất nhiều tab thuộc DATA-002, xem DEC-013.

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

## 9. Tham khảo triển khai

- [Vite](https://vite.dev/guide/)
- [Supabase](https://supabase.com/docs)
- [PWA installation](https://web.dev/learn/pwa/installation?hl=en)
- [WebKit: Web Push cho Home Screen web apps](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)
- [Capacitor](https://capacitorjs.com/docs)

Các khả năng nền tảng có thể thay đổi; kiểm tra lại tài liệu chính thức lúc triển khai chức năng tương ứng.
