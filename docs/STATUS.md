# Trạng thái bàn giao hiện tại

Cập nhật: 2026-09-06, múi giờ Asia/Saigon.

## Đang ở đâu

**Hoàn thành mốc 1 local, PWA-001 và DATA-001. Task tiếp theo: DATA-002 — đồng bộ tiến độ.**

- Branch `main`, origin `https://github.com/HaPhiHung-HE186793/app_ielts.git`. Dùng Git để lấy commit và xác minh remote hiện tại.
- DATA-001 đã chạy với Supabase Docker local thật: email OTP, tên tài khoản, RLS kiểm tra bằng hai người dùng và kho học riêng theo tài khoản. Không có phần code DATA-001 còn dở.
- Chưa có Supabase cloud/SMTP bên ngoài, sync nhiều thiết bị, AI, service worker/offline hoặc deployment công khai. Mốc 2 chưa hoàn thành.

## Dùng được ngay

- `npm ci` rồi `npm run dev`: học khách trên http://127.0.0.1:5173 khi chưa cấu hình môi trường.
- Thử tài khoản: mở Docker, chạy `npm run db:start`, dừng dev server cũ của repo nếu cần, rồi `npm run dev:local`. Mở http://127.0.0.1:5173/#/account; lấy mã tại http://127.0.0.1:54324. Chỉ dùng dữ liệu thử, không gửi email ra ngoài. Chi tiết [BACKEND.md](BACKEND.md).
- Năm khu vực, bảy bài nền tảng với câu mẫu/ba hoạt động/giải thích/thử lại và câu tự viết tùy chọn. Lưu bài dở và câu chưa nộp, phân biệt đúng độc lập với đúng sau gợi ý.
- Lịch ôn 1/3/7/14/30 ngày; sai/có gợi ý quay lại sau 10 phút. Có ôn sớm và kiểm tra đến hạn khi chuyển trang.
- Thiết lập tên gọi, sở thích, mục tiêu/ngày/loại thi/tự nhận xét tùy chọn. Chọn 2/5/15 phút/buổi đầy đủ, lưu và tiếp tục phiên; khởi động không tính bài hoàn thành hoặc đổi lịch ôn. Thời gian dự kiến không phải số đo.
- Bộ đo có focus/visibility/idle 60 giây, dừng khi mở cài đặt/rời bài, checkpoint 5 giây. Tiến bộ có biểu đồ bảy ngày, lịch sử phiên và bộ lọc; giờ cũ giữ là chưa biết.
- Cài đặt có bản sao JSON version 1/2/3, khôi phục và xóa phần học đang mở; giữ bản lỗi nguyên trạng, cảnh báo quota/lỗi lưu. Kho tài khoản riêng theo backend/user ID; đăng xuất mở lại phần khách. Chưa upload bài học.
- `#/account`: OTP email, lưu tên riêng trên server, khôi phục phiên, logout và lỗi dịch vụ có đường thử lại. Đổi người dùng dựng lại form và vô hiệu timer/import cũ. Auth cập nhật qua các tab cùng origin.
- `#/install`: manifest/icon/standalone, hướng dẫn iPhone/iPad, Android và máy tính; nút cài khi có prompt. Bản cài chưa có offline/cloud; xem [INSTALLATION.md](INSTALLATION.md).

## File cần biết

- Học liệu: `src/content/lessons.ts`, [CONTENT_REVIEW.md](CONTENT_REVIEW.md).
- Logic học: `src/domain/learning.ts`, `session.ts`, `planner.ts`, `activity.ts`, `progress.ts` và unit test tương ứng.
- Kho học: `src/data/schema.ts` version 3; `study-store.ts` tách chủ sở hữu/epoch/bản sao; `store.ts` nối localStorage. Key khách vẫn `moi-ngay.study.v1`.
- Auth: `src/app/auth.ts`, `src/services/supabase.ts`, `supabase-config.ts`, `src/features/account/AccountPage.tsx`. `App.tsx` dựng lại shell theo chủ sở hữu, `SettingsDialog.tsx` bảo vệ import bất đồng bộ.
- Backend: `supabase/config.toml`, `supabase/migrations/20260906000100_account_profiles.sql`, `supabase/templates/otp.html`, `.env.example`, scripts `dev-local`/`test-auth`/`local-backend` và [BACKEND.md](BACKEND.md).
- Giao diện học: `src/features/today`, `lessons`, `review`, `progress`; `ActivityMeter.tsx` và `activity-context.ts` gắn bộ đo.
- PWA: `public/manifest.webmanifest`, `public/icons`, `scripts/generate-icons.js`, `src/app/installation.ts`, `src/features/install/InstallPage.tsx`.
- Kiểm tra: `tests/*.spec.ts`, `tests/auth`, hai cấu hình Playwright và [TESTING.md](TESTING.md). Quyết định tài khoản ở DEC-013 trong [DECISIONS.md](DECISIONS.md).

## Kiểm tra đã đạt

- Node 22.18.0, npm 10.9.3; SDK/CLI được khóa trong lockfile. Docker engine 28.3.2 và Supabase PostgreSQL 17 local chạy được.
- Lint/typecheck và build đạt; Vitest 59 ca đạt.
- Playwright chế độ khách: toàn bộ 58 ca đạt ở Chrome 1440×1000/360×800; sau chỉnh focus khi đổi chủ sở hữu, build lại và 12 ca tài khoản khách/tiến bộ đạt. Chi tiết ở SESSION_LOG.
- Auth: toàn bộ 11 ca đạt với Supabase local thật, gồm RLS đọc/ghi chéo/chưa đăng nhập, OTP, reload/lưu tên, hai tab/tài khoản, epoch bộ đo/import và xử lý HTTP 503. Các lỗi mạng là inject có điều khiển.
- Vite từ chối cấu hình secret giả trước build; kiểm tra bundle Auth không chứa server key local. Sau test, database còn 0 Auth user/0 hồ sơ, hộp thư thử còn 0 thư.
- Axe không phát hiện vi phạm A/AA trong các trang đã quét; đã xem ảnh tài khoản desktop/mobile, không tràn ngang. Không thay kiểm tra tiếp cận thủ công.
- Kiểm tra cài PWA từ mốc trước: Chrome đọc manifest/icon và trả mảng lỗi installability rỗng trong hồ sơ tạm; không cài lên OS. Prompt/standalone/safe-area dùng mô phỏng có điều khiển.

## Task tiếp theo chính xác

**DATA-002 READY.** Thiết kế migration sự kiện và quy tắc hợp nhất tiến độ trước khi làm hàng đợi đồng bộ. Có trạng thái gửi/chờ/lỗi/đã lưu; kiểm tra hai phiên độc lập, gửi lặp, xung đột, mất mạng và đổi tài khoản trong lúc gửi. Nhập dữ liệu khách cần lựa chọn rõ ràng, giữ nguồn/bản sao. Chi tiết từng bước ở [TASKS.md](TASKS.md).

Backend local và bộ test quyền đã có; chưa cần dự án hosted cho phần phát triển độc lập. Chưa bắt đầu DATA-002. Không tự mở rộng sang AI/deployment/offline; PWA-002 chờ DATA-002.

## Giới hạn cần giữ rõ

- Dữ liệu học nằm ở trình duyệt/origin hiện tại; localhost và 127.0.0.1 là hai kho khác nhau. Đăng nhập chưa đồng bộ học tập. Tên tài khoản là dữ liệu duy nhất app lưu thêm vào bảng server.
- Kho local chưa mã hóa; tách giao diện theo tài khoản không bảo vệ khỏi người đọc dữ liệu máy. Có hướng dẫn xuất/xóa phần đang mở trước logout trên máy chung. Logout không xóa Auth user/hồ sơ; access token có thể còn hợp lệ đến expiry.
- Chỉ giữ một bài dở; chưa hợp nhất ghi đồng thời từ nhiều tab. Auth qua tab đã kiểm tra, không đồng nghĩa dữ liệu học nhiều tab được hợp nhất an toàn.
- Số đo không xác nhận chú ý; đọc/nói yên lặng hoặc kill trước checkpoint có thể tính thiếu. Lifecycle/focus test có phần mô phỏng, chưa thay kiểm tra thiết bị thật.
- Chưa ghi âm/chấm nói/viết bằng AI. SpeechSynthesis tùy thiết bị; bảy bài do trợ lý biên soạn/rà soát nội bộ, chưa có giáo viên độc lập xác nhận. Chưa có đánh giá đầu vào, bốn tuần học liệu hoặc lộ trình sáu tháng cá nhân.
- Chưa kiểm thử iPhone/Safari/Android thật, cài/khởi chạy OS, SMTP gửi thư ngoài hoặc hạ tầng cloud. Chưa có HTTPS công khai cho điện thoại.
- Vite cảnh báo bundle chính khoảng 605 kB minified/174 kB gzip sau thêm SDK; chưa chia nhỏ theo route. Không chặn build, cần xét tốc độ tải ở mốc tối ưu beta.
- Log/ảnh/bản build Auth và dữ liệu test tạm trong `.local`/`test-results`, được gitignore. Dev server/Docker có thể cần khởi động lại ở session sau; không đưa khóa hoặc log chứa token vào Git.
