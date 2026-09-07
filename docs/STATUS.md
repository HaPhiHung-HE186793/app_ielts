# Trạng thái bàn giao hiện tại

Cập nhật: 2026-09-07, múi giờ Asia/Saigon.

## Đang ở đâu

**AI-001 IN_PROGRESS: đã có nền tảng API/giao diện/hạn mức, chưa gọi và đối chiếu AI thật.** Chưa có API key/ngân sách được xác nhận; mặc định false/0 USD. Không đánh dấu DONE hoặc chuyển sang AI-002 trước khi có kết quả chất lượng/độ trễ/chi phí. Mốc 1 local, DATA-001/002, PWA-001/002 và NOTIFY-001 đã hoàn thành; chưa có beta đầy đủ.

- Branch `main`, origin `https://github.com/HaPhiHung-HE186793/app_ielts.git`; xác minh commit/remote bằng Git.
- Câu tự viết cuối bài có gợi ý AI tùy chọn, đồng ý gửi rõ ràng, tối đa 600 ký tự. Câu nháp/lưu/hoàn thành không phụ thuộc AI; sửa câu/đổi chủ không hiện kết quả cũ. Không chấm band, viết đè câu hoặc đổi lịch ôn.
- Server xác thực JWT thật, hạn mức SQL atomic, UUID/hash chống gọi lặp qua reload/restart/mất response. Ứng viên OpenAI GPT-4.1 mini snapshot, chưa xác minh quyền truy cập/chất lượng thật. Fixture chỉ trong kiểm thử, có nhãn mô phỏng.
- Giữ bảy bài/bảy WAV offline, Auth/email OTP local, sync tự nguyện/outbox/CAS/xung đột và nhắc học. StudyState/bản sao vẫn version 3, đọc 1/2/3. Chưa có hosted/SMTP ngoài máy/public HTTPS.

## Chạy và dùng ngay

1. Docker → `npm run db:start` → `npm run db:migrate` → `npm run preview:local`. Mở http://127.0.0.1:4175; email thử ở http://127.0.0.1:54324, không gửi ra ngoài.
2. Terminal khác: `npm run ai:local`. Khi chưa có cấu hình, máy chủ trả trạng thái AI chưa bật. Đăng nhập/học bài đến câu tự viết để xem phần gợi ý. `npm run ai:evaluate` kiểm tra 10 mẫu, không gọi provider. Cấu hình/thử thật ở [AI.md](AI.md) và [AI_EVALUATION.md](AI_EVALUATION.md).
3. Nhắc học: `npm run reminders:local`, trang `#/reminders`, tự chọn lịch và bật quyền. Offline: `#/install` → tải gói. Máy gửi/Docker cần chạy; xem [NOTIFICATIONS.md](NOTIFICATIONS.md), [OFFLINE.md](OFFLINE.md).
4. `npm run dev` cho khách hoặc `npm run dev:local` cho Auth tại 5173; dev không đăng ký worker. Mỗi origin có kho riêng; chuyển bằng sync/JSON, không xóa dữ liệu đang có.

Đang để preview 4175, máy AI 8787 (gọi thật tắt) và máy nhắc chạy bằng Node ẩn. Log `.local/preview.*.log`, `ai.*.log`, `reminders.*.log`. Tiến trình có thể dừng giữa session; kiểm tra cổng/tiến trình trước mở thêm. Không commit `.local`, khóa hoặc log.

## File quan trọng

- `src/ai/contracts.ts`, `client.ts`, `src/features/ai/AiHint.tsx`, `src/styles/ai.css`; gắn vào `LessonPlayer.tsx`. UUID/hash gần nhất theo kho trong localStorage, không đồng bộ response AI.
- `server/ai/config.ts`, `provider.ts`, `http.ts`, `server/local.ts`; mẫu cấu hình `server/ai.env.example`, proxy trong `vite.config.ts`. Dùng Node/fetch/type stripping và thư viện hiện có, không thêm dependency.
- Migration `20260907000500_ai_request_budget.sql`: `ai_budgets`/`ai_requests`, RLS/service-only RPC, reserve/settle/replay/purge. Đã áp dụng local, không reset DB.
- `server/ai/evaluation.ts`, `server/evaluate.ts`: 10 mẫu gốc, dry validation và runner live có hạn mức; nhánh live chưa chạy. Prompt/model/giá/giới hạn ở DEC-017, hướng dẫn ở AI/AI_EVALUATION.
- `server/ai/provider.test.ts`, `tests/auth/ai-api.spec.ts`, `tests/auth/ai.spec.ts`; phạm vi [TESTING.md](TESTING.md).
- Các phần cũ: `src/domain/*`, `src/data/*`, `features/account`, `features/reminders`, `src/offline`, `src/reminders`, `scripts/reminder-sender.js`. Quyền/sync/offline giữ theo BACKEND/SYNC/OFFLINE/NOTIFICATIONS.

## Kiểm tra đã đạt

- Node 22.18.0/npm 10.9.3, Supabase Docker/CLI 2.116.0; lint/typecheck/build đạt. **89/89 unit**, toàn bộ **68/68 ca khách**, **50/50 ca Auth/API/sync/offline/nhắc/AI** đạt trên Chrome desktop 1440×1000 và viewport 360×800.
- AI: 7 unit về cấu trúc/refusal/quote/giới hạn/cost/không retry; 5 API với Auth/PostgreSQL thật về quyền, quota, giữ chỗ đồng thời, replay/restart, hết hạn/unknown, tổng tiền không reset; 3 UI × 2 viewport về chưa cấu hình, consent/mất response/reload/hết ngân sách, sửa câu/đổi chủ khi chờ.
- Provider fixture có nhãn; không coi đây là đánh giá model. Axe A/AA không báo vi phạm vùng quét, không tràn ngang; đã xem ảnh mobile/desktop. Viewport không thay điện thoại thật.
- `ai:evaluate` kiểm tra 10 mẫu và giới hạn request đạt; nhánh live khi tắt bị chặn trước gọi. Máy AI native Node chạy được và yêu cầu JWT. Build từ chối VITE AI secret và không chứa marker khóa máy chủ/service key/VAPID private hoặc adapter gọi provider.
- Bundle chính khoảng 659 kB minified/189 kB gzip, còn cảnh báo chưa chia route. Các giới hạn PWA/push/thiết bị đã ghi ở tài liệu mốc trước vẫn còn.

## Giới hạn và task tiếp theo

- **Tiếp tục AI-001 bước đối chiếu thật**: người dùng chọn ngân sách/provider và đặt khóa ở file máy chủ; chạy bộ mẫu, người duyệt ghi rubric, đo độ trễ/chi phí rồi mới chốt provider/DONE. Không giả định đã có khoản chi hoặc tự bật AI. Không gửi key vào chat/VITE/Git.
- Response riêng theo chủ replay trong 24 giờ; chỉ dọn khi server chạy, metadata chưa tự hết hạn. Hủy chờ không bảo đảm hủy tiền. Xóa user không giảm tổng budget. Chưa có quản lý/xóa/lịch sử AI đa thiết bị hoặc mã hóa local; xem AI.md.
- Chưa có hosted/SMTP/HTTPS, chống abuse production, Safari/iPhone/Android thật, giáo viên duyệt học liệu/audio, mic/AI nói/viết đầy đủ hoặc đánh giá đầu vào. Bảy bài chưa đủ bốn tuần/sáu tháng, không hứa IELTS 6.5.
- Nhắc học thật đã nhận trong Chrome khi đóng các trang app ở mốc trước, chưa xác minh màn hình OS hoặc tắt toàn bộ Chrome. Offline phụ thuộc cache còn tồn tại; không background sync khi OS đóng app, snapshot sync chưa benchmark nhiều tháng.
