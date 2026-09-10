# Gia sư AI — nền tảng thử nghiệm

> Từ DATA-003 (2026-09-10), deployment Neon có status/feedback API xác thực nhưng luôn tắt AI và ngân sách 0. Budget SQL đã port/kiểm tra; provider/worker Neon còn ở AI-001. Phần API/provider Supabase bên dưới là nền tảng local được giữ. Xem [NEON_BACKEND.md](NEON_BACKEND.md).

Cập nhật 2026-09-07. **AI-001 IN_PROGRESS**: có API, hạn mức và giao diện gợi ý cuối bài; chưa bật hoặc đối chiếu AI thật vì chưa có API key/ngân sách được xác nhận. Không coi các phản hồi fixture trong test là AI thật. Chưa có luyện nói, chấm phát âm, Writing đầy đủ hoặc band IELTS.

## Dùng trong app

Đăng nhập → học một bài đầy đủ → đến câu tự viết cuối bài. Khi dịch vụ sẵn sàng, nhập tối đa 600 ký tự, đọc thông tin gửi dữ liệu, chọn đồng ý và **Nhờ AI gợi ý**. App không tự gửi nháp. Câu dài hơn vẫn lưu được theo giới hạn hiện tại của bài; không bắt buộc dùng AI để hoàn thành.

Phản hồi có nguồn/model/thời điểm, một điểm làm được hoặc gợi ý sửa, và bước để tự làm tiếp. App không viết đè câu, chấm điểm hoặc đổi lịch ôn. Sửa câu sẽ ẩn phản hồi cho nội dung cũ. Đổi tài khoản/rời bài/hủy sẽ ngăn kết quả tới muộn xuất hiện sai chỗ.

Mất phản hồi: chọn **Kiểm tra lại lượt gửi**, kể cả sau reload hoặc ngân sách vừa hết. App giữ UUID + hash theo kho tài khoản và nội dung bài, server trả lại kết quả còn hạn mà không gọi provider lần nữa. Nếu không còn kết quả, chỉ nút **Gửi một lượt mới** hoặc việc gửi nội dung khác tạo lượt mới. Xóa storage/chuyển máy mất mã local; chưa có lịch sử AI đồng bộ đa thiết bị. Khi máy chủ tắt hoàn toàn hoặc provider bị bỏ cấu hình, tải lại cũng cần chờ dịch vụ bật.

## Chạy local

1. Docker → `npm run db:start` → `npm run db:migrate`.
2. `npm run preview:local`, mở http://127.0.0.1:4175. Terminal khác chạy `npm run ai:local`. Khi chưa cấu hình, server 8787 vẫn trả trạng thái **chưa bật**, không gọi dịch vụ ngoài.
3. Chỉ khi đã chọn ngân sách thử, sao chép `server/ai.env.example` thành `.local/ai.env` bằng `Copy-Item -LiteralPath server/ai.env.example -Destination .local/ai.env`. Kiểm tra file đích chưa tồn tại trước để tránh ghi đè khóa đã có. Điền khóa bằng trình sửa file local, không dán vào chat/Git.
4. `OPENAI_API_KEY` chỉ ở file máy chủ. Đặt `AI_TOTAL_BUDGET_USD` theo khoản đã chọn, từ 0,01 đến 10 USD, tối đa hai số thập phân; `AI_ENABLED=true`. Khởi động lại tiến trình AI của dự án, rồi kiểm tra kết nối trong bài. Biến môi trường shell có ưu tiên hơn file Node env; tránh giữ giá trị cũ ngoài ý muốn.
5. Để tắt gọi mới, đặt `AI_ENABLED=false` và khởi động lại. Không sửa/xóa `ai_budgets` để làm mới tiền đã tính. File mẫu giữ false/0/khóa trống. Vite từ chối `VITE_OPENAI_API_KEY`; không có khóa AI trong cấu hình trình duyệt.

Đã chạy Node 22.18.0. Script có cờ type stripping rõ ràng; dùng dependency/lockfile hiện có, không cài SDK AI. Proxy Vite dev/preview `/api/ai` tới 127.0.0.1:8787; backend Auth ở 54321. Dùng đúng `127.0.0.1`, các origin 5173/4173/4174/4175 được nhận. Preview không phải production. Còn cần HTTPS, proxy/Auth chống abuse, quản trị hạn mức và kiểm thử thiết bị trước triển khai công khai.

## Quyền, thời gian và chi phí

| Quy tắc | Hiện thực |
| --- | --- |
| Xác thực | Server kiểm tra Bearer JWT qua Supabase Auth, so owner; RLS chỉ đọc receipt của mình, các hàm ghi/hạn mức chỉ service role |
| Dữ liệu | JSON body tối đa 8 KiB, text 600 ký tự, lesson ID có thật; không cho client chọn URL/model/prompt hệ thống |
| Provider | Ứng viên OpenAI Responses, snapshot `gpt-4.1-mini-2025-04-14`, JSON schema chặt, không tool, không stream, `store:false` |
| Giới hạn gọi | Request provider tối đa 12.000 byte, output tối đa 1.000 token; timeout provider 20 giây, client HTTP 35 giây |
| Tần suất | 10 lượt đã giữ chỗ/tài khoản/ngày UTC; cách ít nhất 20 giây; tối đa 2 lượt đang xử lý toàn budget, 1 lượt/tài khoản |
| Ngân sách | Tổng tích lũy riêng của pilot local, mặc định 0, trần cấu hình 10 USD; không tự reset theo ngày/tháng/restart/xóa user |
| Giữ chỗ | Transaction khóa ngân sách và đặt 0,01 USD trước gọi; trả phần dư khi có usage hợp lệ, giữ cả 0,01 nếu kết quả chưa rõ |
| Retry | Receipt `(user_id,request_id)` + hash; cùng ID/nội dung không gọi lại, khác nội dung bị từ chối; pending hơn 2 phút chuyển unknown, giữ tiền |
| Lỗi | Không tự retry provider; lỗi cấu trúc, refusal, trích sai dữ liệu hoặc timeout không hiện thành gợi ý thành công |

Dự toán dùng giá standard 0,40 USD input và 1,60 USD output mỗi triệu token; cached input vẫn tính theo giá input thường để thận trọng. Nếu usage cho chi phí vượt tiền giữ chỗ, ngân sách tự tắt và phản hồi bị từ chối. Giá/quyền truy cập phải kiểm tra lại trước gọi thật; trần app không phải giới hạn thanh toán của tài khoản OpenAI và không bao phủ tác vụ ngoài app. Xem [model/giá chính thức](https://developers.openai.com/api/docs/models/gpt-4.1-mini).

Hủy chờ không bảo đảm hủy chi phí đã phát sinh. Nếu tiến trình dừng sau gọi nhưng trước ghi kết quả, không tự gọi lại UUID cũ: có thể mất phản hồi, tiền giữ chỗ vẫn tồn tại. Không sửa metadata để giả định provider chưa xử lý.

## Dữ liệu và giới hạn lưu

- Trình duyệt giữ nháp qua kho học hiện có. UUID/hash lượt AI gần nhất nằm trong localStorage riêng theo kho; không lưu response AI vào StudyState/sync/JSON backup. Nội dung feedback chỉ hiện trong bộ nhớ UI.
- Provider nhận câu đã nhập và ngữ cảnh học liệu công khai; app không đính kèm hồ sơ/email/tiến độ/audio. Nếu người học tự viết dữ liệu cá nhân trong câu, phần đó vẫn được gửi.
- `ai_requests` không có cột nguyên văn câu/prompt. Response riêng theo chủ có thể chứa trích đoạn, giữ để replay trong 24 giờ. Bộ dọn chạy lúc AI server khởi động và mỗi phút; nếu server tắt thì bản lưu có thể tồn tại quá 24 giờ đến khi chạy lại. Metadata/hash/cost chưa có retention tự động.
- Xóa user qua Auth cascade xóa receipt nhưng không giảm tổng ngân sách đã tính. Chưa có UI xóa phản hồi hoặc lịch sử AI từ xa. Không dùng reset tiến độ làm bằng chứng đã xóa receipt server.
- Không log câu/token/khóa hoặc nội dung lỗi provider. API đặt `Cache-Control: no-store`; service worker chỉ cache allowlist công khai, không cache `/api/ai`. Local chưa mã hóa.
- `store:false` không có nghĩa không lưu ở bất kỳ đâu. Chính sách nhà cung cấp vẫn áp dụng; xem [dữ liệu API OpenAI](https://developers.openai.com/api/docs/guides/your-data). Phản hồi cấu trúc dựa trên [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs).

## Kiểm tra và tiếp tục

`npm test` kiểm tra adapter/validation; `npm run test:auth -- ai-api.spec.ts --project=supabase-api` dùng Auth/PostgreSQL thật với provider fixture. `npm run test:auth -- ai.spec.ts` kiểm tra UI desktop/mobile, mất response/reload/hết ngân sách/đổi chủ. Fixture chỉ do test tiêm vào server, nhãn rõ, không có chế độ mock bật ở sản phẩm.

`npm run ai:evaluate` kiểm tra 10 mẫu mà **không gọi provider**. Quy trình đánh giá thật, rubric và điều kiện đóng AI-001 ở [AI_EVALUATION.md](AI_EVALUATION.md). Xem [STATUS.md](STATUS.md) và [DECISIONS.md](DECISIONS.md) DEC-017 trước tiếp tục.
