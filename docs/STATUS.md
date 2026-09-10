# Trạng thái bàn giao hiện tại

Cập nhật 2026-09-11, Asia/Saigon. HEAD kiểm kê: d0a34d8; working tree có tài liệu chưa commit và thay đổi IDE có sẵn.

## Đã hoàn thành lượt này

- **COM-GOV-001 DONE phần charter:** [PRODUCT_CHARTER.md](PRODUCT_CHARTER.md) chốt phạm vi G1 dùng cá nhân → beta → thương mại, trách nhiệm và giả định. Người dùng muốn đầu tư để làm tốt nhưng chưa có trần chi cụ thể; chưa có trình độ/lịch học/thiết bị, không tự điền band/ngày thi.
- **COM-GOV-002 DONE phần kiểm kê:** [BASELINE_AUDIT.md](BASELINE_AUDIT.md) đối chiếu code, local và cloud, có khoảng trống giao cho các task tương ứng. Không đồng nghĩa đã sửa mọi khoảng trống hoặc đạt cổng phát hành.
- DOC-003 giữ DONE: [TASKS_COMMERCIAL.md](TASKS_COMMERCIAL.md) quản lý 71 task, 17 vai trò, 6 cổng; các cổng chưa đạt. Task kỹ thuật cũ giữ ở [TASKS.md](TASKS.md).

## Cloud hiện tại và bước tiếp theo

**DEPLOY-002 / COM-OPS-001 IN_PROGRESS.** Kiểm tra GET công khai ngày 2026-09-11 trên https://app-ielts-two.vercel.app:

- Frontend 200; /api/healthz 200 với status ok; /api/readyz 200 với status ready.
- /api/auth/get-session không cookie: 200/null; /api/ai/status thiếu token: 401/unauthorized; cả hai no-store.
- Chưa có revision deployment, OTP/profile/sync hai thiết bị/tài khoản hoặc chứng cứ quyền runtime/worker đầy đủ và credential cũ đã được đổi. Không coi GET thành công là đã nghiệm thu Auth/sync.

**Không chạy lại migration chỉ từ log NEON_DB_UNKNOWN/ảnh thiếu schema ngày trước.** Bước tiếp theo là ghi revision, kiểm tra grants chỉ đọc và xử lý credential cũ, rồi OTP/sync qua tài khoản thử hợp lệ. Không đưa mật khẩu/OTP vào chat/Git. Hướng dẫn ở [DEPLOY_VERCEL_RENDER_NEON.md](DEPLOY_VERCEL_RENDER_NEON.md); số đo và giới hạn ở BASELINE_AUDIT.

## Kiểm tra lượt này

- Lint và typecheck PASS; unit **176/176, 19 file PASS**.
- test:release build khách thành công; **37/38 PASS**, một ca mobile adaptation timeout tại nút tải offline. Ca đó chạy riêng cùng artifact **1/1 PASS**, không sửa assertion/nới timeout; chưa kết luận nguyên nhân hoặc gọi bộ suite sạch.
- Trace/ảnh/context lượt lỗi giữ ở .local/baseline-2026-09-11-first-failure. Artifact khách dưới .local/releases; không deploy artifact này như bản tài khoản Neon.
- Build main JS gzip 210,66 kB, có cảnh báo chunk >500 kB minified; chưa đo hiệu năng thiết bị thực. Không chạy lại test:neon/test:auth, không kiểm tra iPhone/Android thật trong lượt này.
- Kiểm tra tài liệu/liên kết/Unicode/ID/phụ thuộc và diff; bằng chứng cuối ghi SESSION_LOG. Không thay code runtime, commit/push, gửi OTP/email, deploy hoặc mua/nâng dịch vụ.

## Công việc cụ thể tiếp theo

**COM-OPS-002 READY:** sửa workflow deploy để chờ đúng revision qua CI và báo lỗi hook thật, kiểm tra secret scan/check bắt buộc. Workflow hiện có chưa bảo đảm điều đó; code Sentry cũng cần kiểm tra payload ở COM-OPS-004, không coi đã lọc hết dữ liệu cá nhân.

COM-OPS-001 tiếp tục phần cloud; COM-QA-001 lập ma trận test gồm ca offline vừa timeout. Giữ Vercel/Render/Neon và Supabase local regression, AI off/0; worker nhắc production, giáo viên duyệt, thiết bị thật, ngân sách và lịch học cá nhân vẫn cần xác minh. Các file IDE có sẵn giữ nguyên.
