# Trạng thái bàn giao hiện tại

Cập nhật: 2026-09-06, múi giờ Asia/Saigon.

## Đang ở đâu

**Hoàn thành mốc 1 local, PWA-001, DATA-001 và DATA-002. Task tiếp theo: PWA-002 — gói học offline.**

- Branch `main`, origin `https://github.com/HaPhiHung-HE186793/app_ielts.git`. Lấy commit/trạng thái remote bằng Git.
- Đồng bộ đã chạy trên Supabase Docker local thật: bật có lựa chọn, gộp lịch sử theo ID, chống gửi trùng, xử lý hai nơi cùng sửa và nhập phần khách giữ nguồn. Hai browser context độc lập đã tiếp tục đúng tiến độ.
- Chưa có Supabase hosted/SMTP ngoài máy, AI, service worker/gói offline hoặc deployment công khai. Mốc 2 chưa hoàn thành.

## Chạy và dùng ngay

- `npm ci` rồi `npm run dev`: chế độ khách khi chưa đặt hai biến Supabase, mở http://127.0.0.1:5173.
- Thử tài khoản: mở Docker, `npm run db:start`, `npm run db:migrate`, rồi `npm run dev:local`. Dừng dev server cũ của chính repo nếu cổng 5173 đang dùng. App ở http://127.0.0.1:5173/#/account; mã email chỉ ở http://127.0.0.1:54324, dùng dữ liệu thử. Xem [BACKEND.md](BACKEND.md).
- Chọn **Bật đồng bộ phần học này** ở tài khoản. Trình duyệt khác đăng nhập cùng tài khoản/bật sync sẽ tải/gộp bài dở, câu đang nhập, mục tiêu, phiên, lịch sử và lịch ôn. Chờ **Đã đồng bộ** trước chuyển máy; có trạng thái lỗi/mất mạng/thử lại.
- Khi hai nơi cùng sửa, xem/tải hai bản và chọn phần giữ lại. Lượt khác ID được gộp; checkpoint trùng lấy số cộng dồn lớn nhất. Không dùng snapshot mới để ngầm xóa lịch sử phía khác.
- Phần khách không tự nhập/upload. Có xem/chọn nhập và tải bản sao; giữ nguồn khách. Cùng origin một tab sửa phần học tài khoản, tab khác chờ Web Lock; đóng tab giữ khóa để tiếp tục. Xem [SYNC.md](SYNC.md).
- Bảy bài nền tảng với đọc/nghe mẫu, ba hoạt động, giải thích/thử lại và câu tự viết tùy chọn. Lưu một bài dở/câu chưa nộp; phân biệt đúng độc lập với sau gợi ý.
- Phiên 2/5/15 phút/buổi đầy đủ, thiết lập mục tiêu tùy chọn; khởi động không tính bài hoàn thành. Lịch ôn 1/3/7/14/30 ngày, sai/có gợi ý quay lại sau 10 phút.
- Bộ đo focus/visibility/idle 60 giây, checkpoint 5 giây; Tiến bộ có biểu đồ bảy ngày, lịch sử và bộ lọc. Giữ giờ cũ là chưa biết; không suy band từ số đo.
- Bản sao đọc version 1/2/3, xuất version 3; giữ bản lỗi và cảnh báo quota. Khôi phục JSON/xóa local dừng sync tại máy, không xóa server; bật lại có thể tải dữ liệu server trở lại.
- PWA có manifest/icon/standalone và hướng dẫn `#/install`; chưa có gói offline. SpeechSynthesis không phải audio file đã tải. Xem [INSTALLATION.md](INSTALLATION.md).

## File cần biết

- Học liệu: `src/content/lessons.ts`, [CONTENT_REVIEW.md](CONTENT_REVIEW.md).
- Logic học: `src/domain/learning.ts`, `session.ts`, `planner.ts`, `activity.ts`, `progress.ts` và test.
- Sync: `src/domain/sync.ts`, `src/data/sync-engine.ts`, `sync-schema.ts`, `src/services/study-sync.ts`, `src/app/sync.ts`, `src/features/account/SyncPanel.tsx`.
- Kho: `src/data/schema.ts` giữ version 3; `study-store.ts` ghi state + `_sync` atomic/tách chủ/epoch; `store.ts` chặn ghi từ tab chờ. Key khách vẫn `moi-ngay.study.v1`.
- `App.tsx` xử lý trang chờ/xung đột và dựng lại phần bài khi nhận dữ liệu mới; `SettingsDialog.tsx` bảo vệ file import và hoãn sync lúc form chưa lưu.
- Auth: `src/app/auth.ts`, `src/services/supabase.ts`, `supabase-config.ts`, `AccountPage.tsx`; cấu hình mẫu `.env.example`.
- Backend: migration 001 tên tài khoản, 002 snapshot/CAS, 003 nhật ký thay đổi/hash; template email và config local trong `supabase/`.
- Kiểm tra: `tests/auth/sync-api.spec.ts`, `sync.spec.ts`, `account.spec.ts`, `rls.spec.ts`, bộ khách `tests/*.spec.ts` và [TESTING.md](TESTING.md). Quyết định ở DEC-013/014 trong [DECISIONS.md](DECISIONS.md).

## Kiểm tra đã đạt

- Node 22.18.0, npm 10.9.3, Docker 28.3.2, Supabase local PostgreSQL 17; không đổi dependency trong DATA-002.
- Lint/typecheck/build đạt; Vitest **76 ca** đạt.
- Playwright khách: toàn bộ **58 ca** đạt ở Chrome 1440×1000/360×800. Sau cập nhật câu mô tả sync ở hướng dẫn cài, build/lint lại và hai ca hướng dẫn/axe đạt.
- Auth/RLS/sync: **23 ca đã được kiểm tra thành công** qua các lượt. Lượt toàn bộ 22/23 đạt; một test payload sai dùng revision cũ nên nhận conflict trước bước kiểm tra ID. Sửa fixture dùng revision hiện tại, chạy lại cả ba ca API đạt. Chi tiết trong SESSION_LOG.
- Hai context cùng tài khoản có phiên Auth riêng, nhận/tiếp tục dữ liệu; mô phỏng offline và mất response sau commit thật, giữ outbox qua reload; xung đột chọn được và giữ qua reload; logout trong lúc gửi không ghi vào B; tab thứ hai nhận khóa khi tab trước đóng.
- Axe A/AA không phát hiện vi phạm trong các vùng đã quét, gồm sync/xung đột. Đã xem ảnh desktop/mobile; chưa thay kiểm tra tiếp cận thủ công/điện thoại thật.
- Migration 002/003 đã áp dụng trên stack local hiện hữu bằng CLI; không reset/xóa volume. Backend và dev server local đang chạy, có thể cần mở lại ở session mới.
- Sau kiểm tra, database còn 0 Auth user/0 tên/0 snapshot/0 commit thử; `db:migrate` xác nhận không còn migration chưa áp dụng. Tài liệu: 13 file, 50 liên kết nội bộ và 24 task hợp lệ.

## Task tiếp theo chính xác

**PWA-002 READY.** Thiết kế gói bài/tài nguyên offline có phiên bản và quyền lưu, service worker/app shell, tải/xem dung lượng/xóa gói và kiểm tra mở mới khi offline. Giữ outbox, scope tài khoản và dữ liệu dở khi cập nhật; không cache Auth hoặc phản hồi cá nhân dùng chung. Repo chưa có audio file, cần xử lý nguồn/quyền/phạm vi thật trước đóng task. Chi tiết ở [TASKS.md](TASKS.md).

## Giới hạn cần giữ rõ

- Chỉ kiểm tra backend local và hai context Chrome; chưa có host HTTPS cho điện thoại, SMTP bên ngoài, Safari/iPhone/Android thật hoặc cửa sổ app OS.
- App đang mở mất mạng giữ thay đổi được; mở mới app offline chưa được hỗ trợ. Không tự chạy sync khi OS đóng tab; hoãn khi hộp cài đặt mở.
- localStorage chưa mã hóa, còn quota; metadata có thể giữ nhiều bản tiến độ. Bản cũ của app chưa hiểu `_sync` không được chạy song song trên cùng kho. Khi lỗi lưu, giữ tab và xuất bản sao.
- Request sync còn gửi snapshot đầy đủ, giới hạn server 5 MB; nhật ký chỉ ghi phần thay đổi. Chưa benchmark dữ liệu nhiều tháng, giới hạn RPC/tổng dung lượng hoặc chính sách lưu/xóa lịch sử hosted. Chưa có UI xóa toàn bộ tài khoản/lịch sử server.
- Một tab sửa tài khoản trong cùng origin; thiếu Web Locks chỉ dùng local và giữ giới hạn nhiều tab cũ. Phần khách vẫn riêng; localhost và 127.0.0.1 là hai kho khác nhau.
- Số đo không xác nhận chú ý; có thể thiếu mốc cuối hoặc lúc đọc/nói yên lặng. Bảy bài do trợ lý biên soạn/rà soát nội bộ, chưa có giáo viên độc lập xác nhận; chưa đánh giá đầu vào, học liệu bốn tuần hoặc lộ trình sáu tháng cá nhân.
- Chưa ghi âm/chấm AI. Vite cảnh báo bundle chính khoảng 622 kB minified/178 kB gzip; chưa chia theo route.
- Log, ảnh, bản build test trong `.local`/`test-results`, đều gitignore. Không commit khóa/token hoặc dữ liệu người học.
