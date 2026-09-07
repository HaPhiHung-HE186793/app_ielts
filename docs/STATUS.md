# Trạng thái bàn giao hiện tại

Cập nhật: 2026-09-07, múi giờ Asia/Saigon.

## Đang ở đâu

**PWA-002 hoàn thành. Task tiếp theo: NOTIFY-001 — nhắc học tự nguyện.** Mốc 1 local, PWA-001/002 và DATA-001/002 đã có code/kiểm tra; chưa hoàn thành beta hoặc chương trình sáu tháng.

- Branch `main`, origin `https://github.com/HaPhiHung-HE186793/app_ielts.git`. Xác minh commit/remote bằng Git.
- Bảy bài nền tảng và bảy WAV câu mẫu có gói tải trước; mở lại bản build khi offline, nghe/làm/lưu bài, xóa file tải riêng với tiến độ. Gói 740.035 byte (~0,74 MB), shell ~1,07 MB; cache công khai không giữ Auth hoặc câu trả lời.
- Auth/email OTP, RLS và đồng bộ tự nguyện đã kiểm tra trên Supabase Docker local. Giữ outbox qua reload/mất response, gộp lịch sử, chọn xung đột và nhập phần khách có lựa chọn; xem [SYNC.md](SYNC.md).
- Chưa có hosted/SMTP ngoài máy, thông báo, AI, deployment HTTPS công khai hoặc kiểm thử iPhone/Android thật.

## Chạy và dùng ngay

- **Bản đủ tài khoản + offline:** Docker đang chạy → `npm run db:start` → `npm run db:migrate` → `npm run preview:local`. Mở http://127.0.0.1:4175/#/install, chọn **Tải gói để học offline**, chờ **Sẵn sàng học offline**. Email thử chỉ ở http://127.0.0.1:54324. Hướng dẫn [OFFLINE.md](OFFLINE.md), [BACKEND.md](BACKEND.md).
- Preview 4175 đã được mở bằng launcher Node ẩn trong session này; có thể cần chạy lại ở session mới. Log `.local/preview.stdout.log`/`preview.stderr.log` không chứa cấu hình bí mật.
- **Phát triển:** `npm ci`, `npm run dev` (khách) hoặc `npm run dev:local` (Auth local), http://127.0.0.1:5173. Dev không đăng ký worker. **Preview khách:** `npm run build`, `npm run preview`, http://127.0.0.1:4173.
- Các cổng/origin có kho khác nhau: dùng sync hoặc xuất/nhập JSON để chuyển; không xóa dữ liệu đang có. Preview chỉ dùng trên máy, không phải host cho điện thoại.
- Phiên 2/5/15 phút/buổi đầy đủ, bảy bài/ba hoạt động/phản hồi, lưu câu chưa nộp. Khởi động tách khỏi hoàn thành bài; SRS 1/3/7/14/30 ngày, sai/gợi ý quay lại sau 10 phút.
- Tiến bộ đo focus/visibility/idle 60 giây, checkpoint 5 giây; lịch sử, biểu đồ và bộ lọc. Không suy band từ phút/lượt/XP. Bản sao đọc version 1/2/3, xuất 3; giữ bản lỗi/quota và hiện cảnh báo.
- Tài khoản chủ động **Bật đồng bộ phần học này**; chờ **Đã đồng bộ** trước đổi máy. Một tab sửa cùng tài khoản/origin theo Web Locks; tab khác chờ. Hai context/thiết bị khác dùng merge/xung đột server.
- Bản mới không reload cưỡng bức, chờ đóng tất cả cửa sổ cũ rồi kích hoạt; giữ draft/outbox. Gói đổi phiên bản cần tải lại. Xóa gói giữ shell/tiến độ; reset/nhập JSON dừng sync ở máy và không xóa server.

## File cần biết

- [OFFLINE.md](OFFLINE.md), DEC-015 trong [DECISIONS.md](DECISIONS.md): phạm vi/quyền audio, cache và nâng phiên bản.
- `scripts/offline-build.js` sinh worker/manifest từ build và kiểm tra byte/hash; `src/offline/worker.js` lưu allowlist, marker gói, xếp lệnh tải/xóa, range WAV; `range.js` có unit test.
- `src/app/offline.ts`, `features/install/OfflinePanel.tsx`, `components/ListenButton.tsx`: đăng ký, trạng thái, giao diện tải và phát nghe. `src/content/offline-pack.json`, `public/packs/foundation-v1/`: metadata, JSON học liệu và bảy WAV. `npm run audio` tái tạo khi thay nội dung, không chạy mỗi build.
- `src/app/auth.ts` mở chủ local trước refresh; `app/sync.ts` chờ SDK xác nhận để gửi, đánh thức ở task sau callback Auth. `services/supabase.ts` dùng khóa phiên cố định theo backend.
- `src/domain/*`, `src/data/schema.ts`, `study-store.ts`, `sync-engine.ts`, `sync-schema.ts` giữ logic học/phiên/ôn/đồng bộ. Schema vẫn version 3, key khách `moi-ngay.study.v1`; metadata `_sync` không nằm trong bản sao hợp lệ.
- Backend: ba migration trong `supabase/migrations` cho tên, snapshot/RPC/CAS và receipt hash/thay đổi. Không reset database trong task này.
- `tests/offline.spec.ts`, `offline-update-server.ts`, `tests/auth/offline.spec.ts`; phạm vi suite ở [TESTING.md](TESTING.md).

## Kiểm tra đã đạt

- Node 22.18.0/npm 10.9.3, Docker/Supabase local hiện hữu. Không thêm dependency; package chỉ thêm lệnh audio/preview.
- Lint, typecheck, build đạt; Vitest **78 ca** đạt. Build có cảnh báo bundle chính ~632 kB minified/181 kB gzip; chưa chia route.
- Toàn bộ **68 ca khách** đạt trên Chrome 1440×1000/360×800: học/ôn/lưu/khôi phục/cài đặt và 10 ca offline. Toàn bộ **27 ca Auth/API/sync** đạt trên backend local thật, gồm bốn ca offline có tài khoản.
- Tải đủ → đóng/mở trang mới offline → phát WAV thật, HTTP range 206/416 → hoàn thành bài/lưu lịch ôn; file lỗi/quota giả lập/thử lại/thu hồi một file; cache riêng không chứa response/token/nội dung riêng A/B.
- Server kiểm thử phiên bản riêng cho mỗi ca: worker chờ cửa sổ đóng, activation thật, giữ nguyên draft/outbox fixture, dọn cache cũ và tải gói mới. Không skipWaiting trong test.
- Auth: ép thời điểm hết hạn trong phiên SDK lưu local (không sửa JWT server), mở mới offline, nộp bài; khi có mạng, server nhận commit rồi response 503, reload/gửi lại cùng UUID chỉ có một receipt/kết quả.
- Axe A/AA không phát hiện vi phạm trong vùng quét, không tràn ngang; đã xem ảnh desktop/mobile. Không thay kiểm tra thủ công/thiết bị thật hoặc giáo viên nghe audio.
- Kết quả tinh chỉnh cuối, tài liệu và xác minh Git được ghi trong [SESSION_LOG.md](SESSION_LOG.md).

## Giới hạn cần giữ rõ

- Offline cần tải bản build ở origin ổn định và còn cache. Browser có thể thu hồi dữ liệu; giữ bản sao tiến độ. Không có background sync khi OS đóng app, không bảo đảm lưu vĩnh viễn.
- Audio eSpeak NG thử nghiệm còn cứng/tên Việt có thể chưa tự nhiên; chưa có giáo viên độc lập duyệt, không gọi là mẫu accent chuẩn. Bảy bài chưa đủ chương trình nền tảng bốn tuần; chưa đánh giá đầu vào hoặc lộ trình sáu tháng cá nhân.
- Kho local chưa mã hóa. Phần khách và nhiều tab khi không có Web Locks vẫn giữ giới hạn cũ; metadata sync còn chiếm quota. Hộp cài đặt hoãn sync để giữ form chưa lưu.
- Request sync vẫn snapshot đầy đủ/giới hạn 5 MB; chưa benchmark nhiều tháng, hạn mức RPC hoặc chính sách xóa/retention hosted. Chưa có UI xóa toàn bộ tài khoản/server.
- Các bài kiểm tra dùng context Chrome và dữ liệu thử, chưa có Safari/iPhone/Android thật, cửa sổ app OS, public HTTPS/SMTP hoặc push delivery thật.
- Log/build/test và dữ liệu thử nằm trong `.local`/`test-results`, không commit. Tiếp tục từ **NOTIFY-001 READY** trong [TASKS.md](TASKS.md).
