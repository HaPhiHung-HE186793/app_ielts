# Trạng thái bàn giao hiện tại

Cập nhật: 2026-09-07, múi giờ Asia/Saigon.

## Đang ở đâu

**NOTIFY-001 hoàn thành. Task tiếp theo: AI-001 — nền tảng gia sư AI.** Mốc 1 local, PWA-001/002 và DATA-001/002 đã hoàn thành. Chưa có beta hoàn chỉnh, AI thật hoặc chương trình sáu tháng.

- Branch `main`, origin `https://github.com/HaPhiHung-HE186793/app_ielts.git`; xác minh commit/remote bằng Git.
- Nhắc học mặc định tắt theo tài khoản/trình duyệt, có giờ/ngày/múi giờ/giờ yên lặng, dời lượt tới và tắt. Quyền chỉ xin từ nút bật; từ chối vẫn học được. Lịch tách khỏi tiến độ/sync/bản sao version 3.
- Web Push qua FCM thật đã được Chrome headless Windows nhận khi không còn trang app mở. Xác nhận bằng `getNotifications()`, chưa quan sát màn hình OS, tắt toàn bộ Chrome hoặc thử iPhone/Android thật. Gửi được một lượt không bảo đảm mọi lượt hiện; xem [NOTIFICATIONS.md](NOTIFICATIONS.md).
- Giữ bảy bài/bảy WAV tải offline, Auth/email OTP local, RLS, sync tự nguyện/outbox/CAS/gộp/xung đột. Chưa có hosted/SMTP ngoài máy/public HTTPS.

## Chạy và dùng ngay

1. Docker chạy → `npm run db:start` → `npm run db:migrate` → `npm run preview:local`. Mở http://127.0.0.1:4175/#/reminders hoặc `#/install` để tải gói offline. Email thử ở http://127.0.0.1:54324, không gửi ra ngoài.
2. Terminal khác: `npm run reminders:local`. Trang nhắc học → đăng nhập → tải lại lịch/trạng thái → chọn giờ/ngày/múi giờ → bật quyền. Máy gửi/Docker/Internet cần tiếp tục chạy; lượt quá giờ bị bỏ qua. File khóa `.local/reminder-vapid.json` chỉ ở máy, không commit hoặc tạo đè.
3. `npm run dev` (khách) hoặc `npm run dev:local` (Auth) dùng 5173, không đăng ký worker. Preview khách: build/preview ở 4173. Các origin có kho riêng; chuyển tiến độ bằng sync/JSON, không xóa dữ liệu đang có.

Preview 4175 và máy nhắc local được mở bằng tiến trình Node ẩn trong session này; log `.local/preview.stdout.log`/`preview.stderr.log` và `.local/reminders.stdout.log`/`reminders.stderr.log`. Tiến trình có thể dừng giữa các session, kiểm tra tiến trình hiện có trước khi mở thêm. Chi tiết [BACKEND.md](BACKEND.md), [OFFLINE.md](OFFLINE.md), [SYNC.md](SYNC.md), [NOTIFICATIONS.md](NOTIFICATIONS.md).

## File quan trọng

- `src/features/reminders/RemindersPage.tsx`, `schema.ts`, `service.ts`: UI/validation/API/permission, binding theo chủ, Web Lock riêng và timeout đăng ký 15 giây. `src/app/auth.ts` dọn nhắc trước logout, không gọi SDK trong callback Auth.
- `src/reminders/push-store.js`, `push-worker.js`: IndexedDB cho binding/ngày hiển thị, kiểm tra revision/ngày/hạn/yên lặng, nội dung chung và click cùng origin. Build ghép vào worker; giữ cơ chế chờ cửa sổ cũ đóng của PWA.
- `scripts/reminder-sender.js`, `reminders-local.js`, `verify-reminder-push.js`: bộ gửi, khóa/heartbeat local và probe mạng thật trên tài khoản/hồ sơ thử. Khóa riêng không vào Vite/database/log.
- Bốn migration `20260907…`: bảng/RLS/RPC lịch, validation null/endpoint, khóa thiết bị trước receipt và claim riêng cho probe. Ba migration `20260906…` của Auth/sync giữ nguyên; không reset DB.
- `tests/auth/reminders-api.spec.ts`, `reminders.spec.ts`, `src/features/reminders/reminders.test.ts`; phạm vi tại [TESTING.md](TESTING.md), quyết định DEC-016 tại [DECISIONS.md](DECISIONS.md).
- Learning: `src/domain/*`, `src/data/schema.ts`, `study-store.ts`, `sync-engine.ts`. Bản sao vẫn version 3, đọc 1/2/3. Cache chỉ công khai, không chứa token/câu trả lời. Gói offline 740.035 byte, bảy WAV eSpeak NG thử nghiệm chưa có giáo viên duyệt.

## Kiểm tra đã đạt

- Node 22.18.0/npm 10.9.3, Supabase Docker/CLI 2.116.0. Thêm dependency server `web-push` 3.6.7 và lockfile; npm audit lúc cài không báo lỗ hổng.
- Lint/typecheck/build và **82 unit test** đạt; bundle chính ~648 kB minified/~186 kB gzip, vẫn có cảnh báo chưa chia route.
- Toàn bộ **68 ca khách** và **39 ca Auth/API/sync/offline/nhắc học** đạt trên Chrome 1440×1000 và 360×800. Axe A/AA không phát hiện vi phạm vùng quét; không tràn ngang, đã xem giao diện.
- Calendar/RLS/CAS thật: qua ngày, ngày trong tuần, DST tiến/lùi, quiet boundary, claim đồng thời, một lượt/ngày, skip quá giờ, dời/tắt/revision cũ/404–410. Sau bổ sung claim giới hạn thiết bị thử, chạy lại bốn ca API nhắc và đạt.
- UI permission/subscription có điều khiển, RPC/worker/IndexedDB thật: từ chối vẫn học, lưu qua reload, bật/dời/tắt, mất response, thay chủ trong request được nhận, logout, chống hiển thị lặp và click. Không gọi CDP injection là mạng push thật.
- Probe mạng thật dùng tài khoản riêng và hồ sơ Chrome thử: dịch vụ đẩy nhận và worker đăng ký thông báo khi 0 trang app mở. Có lượt probe nhận HTTP thành công nhưng chưa thấy thông báo trong thời hạn kiểm tra; không coi `accepted` là đã hiển thị. Chi tiết diễn biến ở [SESSION_LOG.md](SESSION_LOG.md).

## Giới hạn và task tiếp theo

- Chưa có điện thoại/Safari thật, giao diện thông báo OS, HTTPS/SMTP/hosted hoặc dịch vụ gửi chạy liên tục. PWA vẫn cần kiểm tra thiết bị trước beta; viewport không thay thiết bị.
- Tối đa năm ID thiết bị/tài khoản, chưa có UI quản lý/xóa từ xa/retention receipt. Xóa browser storage có thể mất ID; logout mất mạng không bảo đảm xác nhận tắt trên server hoặc thu hồi push đang tới. Local chưa mã hóa.
- Offline cần cache còn tồn tại; tải file không phải sao lưu tiến độ. Không background sync khi OS đóng app. Snapshot sync còn gửi toàn bộ, chưa benchmark nhiều tháng/hạn mức hosted. Giữ giới hạn cũ ở SYNC/OFFLINE.
- Bảy bài chưa đủ bốn tuần, chưa có đánh giá đầu vào hoặc giáo viên độc lập duyệt; không hứa IELTS 6.5/sáu tháng.
- **Bắt đầu AI-001 READY** trong [TASKS.md](TASKS.md): tập bài đối chiếu + thiết kế API có xác thực/validation/timeout/hạn mức; kiểm tra nhà cung cấp, ngân sách và cấu hình thật trước gọi dịch vụ. Không tự giả định có API key hoặc ghi mock là AI thật. Tài liệu bàn giao/lockfile/code/test phải được giữ cùng commit.
