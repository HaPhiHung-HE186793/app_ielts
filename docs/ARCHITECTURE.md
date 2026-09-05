# Kiến trúc dự kiến

Ngày lập: 2026-09-06. Đây là thiết kế để bắt đầu triển khai, chưa mô tả hệ thống đang chạy. Các quyết định và giả định nằm trong [DECISIONS.md](DECISIONS.md).

## 1. Hướng công nghệ

| Phần | Lựa chọn khởi đầu | Mục đích |
| --- | --- | --- |
| Giao diện | React + TypeScript + Vite | Xây web app tương tác, ưu tiên màn hình điện thoại |
| Điều hướng | Các trang Hôm nay, Khám phá, Luyện tập, Ôn lại, Tiến bộ | Cho phép mở trực tiếp và tiếp tục bài học |
| Dữ liệu local | IndexedDB khi cần lưu bài, lượt làm và tài nguyên offline | Giữ tiến độ giữa các lần mở; không được xem là bản sao lưu đám mây |
| Tài khoản/backend | Supabase Auth, PostgreSQL, Storage | Đồng bộ tiến độ và quản lý dữ liệu riêng của người học |
| AI | Dịch vụ phía máy chủ, provider chọn sau thử nghiệm | Quản lý khóa bí mật, ngân sách, phản hồi và audio |
| Cài lên màn hình chính | PWA: manifest, icons, service worker | Mở như ứng dụng và hỗ trợ các chức năng offline được triển khai |
| App Store/Google Play | Capacitor ở giai đoạn sau | Tái sử dụng ứng dụng web, bổ sung tích hợp và quy trình phát hành riêng |

Chưa chốt phiên bản, thư viện UI, routing, thuật toán ôn, nhà cung cấp AI hoặc nơi deploy. Chọn khi làm task tương ứng và ghi lý do nếu có ảnh hưởng dài hạn. Dùng npm cùng lockfile cho scaffold đầu tiên, trừ khi môi trường hoặc yêu cầu mới cho thấy cần thay đổi.

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

Tránh tạo kiến trúc nhiều tầng khi chưa có nhu cầu. Các thư mục máy chủ/migration sẽ được thêm khi chọn cách triển khai backend.

## 4. Mô hình dữ liệu ban đầu

Các nhóm dữ liệu dưới đây là khái niệm, chưa phải schema migration đã chốt:

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
- Lịch ôn là logic có thể kiểm tra bằng thời gian giả lập. Chưa chọn FSRS hay thuật toán khác; cần ghi rõ quyết định trước REVIEW-001.
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
- Không cache phản hồi cá nhân giữa các tài khoản; xác định cách xử lý dữ liệu local khi đăng xuất trước beta.

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
