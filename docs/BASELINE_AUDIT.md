# Kiểm kê sản phẩm và kỹ thuật — COM-GOV-002

Cập nhật 2026-09-11, Asia/Saigon. Đối chiếu code tại HEAD `d0a34d8` cùng working tree có tài liệu chưa commit. Đây là bản kiểm kê và bằng chứng kiểm tra, không là chứng nhận bảo mật hoặc phát hành.

## 1. Kết quả chính

- Cloud có tiến triển so với bàn giao cũ: domain Vercel, health và readiness trả 200. Không còn dùng log NEON_DB_UNKNOWN ngày trước làm kết luận lỗi hiện tại.
- Auth `get-session` không có cookie trả `null`; API AI không có token trả 401. Chưa thực hiện OTP, profile, sync hoặc kiểm tra hai chủ trên cloud.
- Lint/typecheck và 176 unit test đạt ở lượt này. Bộ release khách đạt 37/38 lượt đầu; một ca timeout chạy riêng lại đạt, xem giới hạn ở mục 3.
- Code có CI/Sentry nhưng kiểm tra tĩnh cho thấy các khoảng trống về chờ CI trước deploy, lọc dữ liệu telemetry và thông báo lưu tiến độ. Những khoảng trống đó chưa được sửa trong task kiểm kê.
- [PRODUCT_CHARTER.md](PRODUCT_CHARTER.md) chốt phạm vi làm việc G1 và giả định; ngân sách, lịch học cá nhân, giáo viên/reviewer vẫn chưa được xác định cụ thể.

## 2. Bằng chứng cloud công khai

Kiểm tra bằng GET từ máy phát triển, không cookie/Authorization, không gửi OTP/email, không sửa cloud. Chỉ ghi HTTP status và các trường cố định; không lưu response có thông tin cá nhân hoặc secret.

| Thời điểm địa phương | URL/path trên `https://app-ielts-two.vercel.app` | Kết quả                                        | Phạm vi chứng minh                                                                                          |
| -------------------- | ------------------------------------------------ | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 2026-09-11 00:29:32  | `/`                                              | 200, HTML                                      | Domain phục vụ frontend; chưa biết revision deployment hoặc toàn bộ UI hoạt động                            |
| 2026-09-11 00:29:32  | `/api/healthz`                                   | 200, `status: ok`                              | Proxy và HTTP backend trả lời tại thời điểm kiểm tra                                                        |
| 2026-09-11 00:29:33  | `/api/readyz`                                    | 200, `status: ready`                           | Readiness endpoint thành công; cần đối chiếu revision cloud trước suy toàn bộ implementation                |
| 2026-09-11 00:32:44  | `/api/ai/status`                                 | 401, `unauthorized`, `Cache-Control: no-store` | Route này từ chối request thiếu token; không chứng minh mọi quyền hoặc trạng thái AI của người đã đăng nhập |
| 2026-09-11 00:32:44  | `/api/auth/get-session`                          | 200, `null`, `Cache-Control: no-store`         | Proxy Auth trả trạng thái không có phiên; chưa chứng minh gửi/nhận OTP và phiên thật                        |

Trong code đang đọc, [database.ts](../server/neon/database.ts) kiểm tra readiness bằng transaction chuyển sang `moi_ngay_api` và đọc schema version 1. Vì chưa lấy revision cloud, chỉ ghi đây là cách giải thích theo code local; readiness không xác minh runtime đã hết membership quản trị, role worker hay secret cũ đã được đổi.

**Bước cloud tiếp theo:** ghi revision/deployment thực, kiểm tra grants chỉ đọc và xác nhận xử lý credential cũ; dùng tài khoản thử hợp lệ để kiểm tra OTP → profile → sync hai thiết bị/tài khoản, mất mạng và đổi chủ. Không chạy lại migration chỉ vì tài liệu ngày trước nói thiếu schema. Chưa truy cập Dashboard hoặc dùng credential riêng trong lượt này.

## 3. Kiểm tra local ở lượt này

| Kiểm tra                                              | Kết quả                                  | Giới hạn                                                                                         |
| ----------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `npm.cmd run lint`                                    | PASS                                     | Kiểm tra lint code hiện có, không thay audit CI/cloud                                            |
| `npm.cmd run typecheck`                               | PASS                                     | Kiểu dữ liệu không chứng minh hợp đồng provider live                                             |
| `npm.cmd test`                                        | PASS, 176 test / 19 file                 | Unit hiện có; không có eval AI live hoặc kiểm định Sentry end-to-end                             |
| `npm.cmd run test:release`                            | Build PASS; 37/38 test PASS, một timeout | Mobile adaptation chờ nút tải offline tại tests/adaptation.spec.ts:40; chưa xác định nguyên nhân |
| Chạy riêng mobile hard mode, cùng artifact, workers=1 | PASS 1/1, 6,1 giây cho ca test           | Không sửa test/nới timeout; không coi đây là bằng chứng toàn bộ suite đã sạch                    |
| Neon integration/legacy Auth                          | Chưa chạy lại trong lượt này             | Kết quả PostgreSQL/fixture cũ ở SESSION_LOG, không tính là kết quả mới                           |
| iPhone/Android thật                                   | Chưa thực hiện                           | Mobile viewport Chrome không thay thiết bị thật                                                  |

Build artifact khách đã hoàn thành: main JS 722,90 kB, gzip 210,66 kB; CSS gzip 10,21 kB. Có cảnh báo chunk JS lớn hơn 500 kB minified. Đây là số kích thước build, không là phép đo Core Web Vitals hoặc kết luận app chậm; COM-ENG-004 đo trước tối ưu. Không build/deploy prebuilt Vercel ở lượt này.

Trace/ảnh/context lỗi được giữ tại .local/baseline-2026-09-11-first-failure; artifact .local/releases/2026-09-10T17-31-50-884Z-d0a34d8b-rRUt2U. COM-QA-001 theo dõi tính lặp lại/khởi tạo worker; chưa quy lỗi cho tải máy hoặc code khi chưa có bằng chứng.

## 4. Kiểm kê theo năng lực

| Năng lực                      | Code/tài liệu đối chiếu                                                                                 | Mức bằng chứng và khoảng trống                                                               | Task tiếp tục                         |
| ----------------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------- |
| Học và tiếp tục bài           | `src/features/lessons/`, `today/`, `domain/planner.ts`, `data/study-store.ts`, `tests/learning.spec.ts` | Có implementation và unit; kiểm tra release ghi riêng mục 3; chưa nhật ký cá nhân thực       | COM-LEARN-001/005                     |
| Ôn/tiến bộ/thích ứng          | `src/domain/learning.ts`, `adaptation.ts`, `progress.ts`, các unit tương ứng                            | Quy tắc có code và test; không có chứng cứ tăng band hoặc thuật toán đã hiệu chỉnh người học | COM-LEARN-006, COM-DATA-003           |
| Học liệu/audio                | `src/content/lessons.ts`, `foundation.ts`, CONTENT_REVIEW                                               | 28 bài + 4 kiểm tra và gói nghe trong repo; học liệu thử nghiệm chưa giáo viên độc lập duyệt | COM-CONT-001/003/004                  |
| Account/sync/quyền            | `server/neon/http.ts`, `database.ts`, `data.ts`, `identity.ts`, `src/services/`, `src/domain/sync.ts`   | Có implementation/unit; cloud chỉ có GET không đăng nhập ở mục 2, thiếu luồng owner thực     | COM-OPS-001, COM-ENG-002, COM-SEC-002 |
| PWA/offline                   | `src/offline/`, `src/app/offline.ts`, `tests/offline.spec.ts`                                           | Có test artifact khách, cần thiết bị thật và update trên host thật                           | COM-QA-002                            |
| AI                            | `server/ai/`, `server/neon/config.ts`, `http.ts`                                                        | Neon config ép AI off, feedback trả unavailable; chưa có provider live/eval/budget được chốt | AI-001, COM-AI-001/002                |
| Nhắc học                      | `src/features/reminders/`, `src/reminders/`, `scripts/reminder-sender.js`                               | Có đường legacy/local, không có bằng chứng worker Neon production đang chạy                  | COM-LEARN-007                         |
| CI/CD                         | `.github/workflows/ci.yml`, `deploy.yml`                                                                | Có YAML; chưa xem run/check bắt buộc/branch protection. Deploy trigger hiện chưa chờ CI      | COM-OPS-002                           |
| Quan sát lỗi                  | `src/main.tsx`, `src/services/sentry.ts`, `server/neon/error-reporter.ts`, `production.ts`              | Có tích hợp tùy config, chưa nghiệm thu payload/routing/cảnh báo; xem khoảng trống bên dưới  | COM-OPS-004, COM-PRIV-001             |
| Thanh toán/AI nói/viết đầy đủ | Backlog và các màn hình thực trong `src/features/pages/Pages.tsx`                                       | Không ghi như tính năng đã có; luyện nói hiện tự nói, chưa recorder/đánh giá phát âm         | COM-PAY, COM-AI-003/004               |

## 5. Khoảng trống có thể giao xử lý

| Mã     | Phát hiện từ code                                                                                                                                                                                                           | Ảnh hưởng/ưu tiên                                                            | Chủ / task và nghiệm thu                                                                                                                                                |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GAP-01 | `deploy.yml` chạy trực tiếp khi push main; `needs: []` không chờ workflow CI. Hook lỗi bị đổi thành `echo`, báo summary không xác minh thành công                                                                           | P0 trước phát hành tự động: có thể deploy khi CI lỗi hoặc báo sai trạng thái | SRE / COM-OPS-002: chỉ deploy revision đã qua CI, lỗi hook khiến job thất bại, quyền/env đúng; có kiểm tra đường thành công/thất bại                                    |
| GAP-02 | `ci.yml` scan secret dùng `continue-on-error: true`, action trỏ `main`; chưa có bằng chứng protected branch yêu cầu check                                                                                                   | P0 trước mở beta: scan fail chưa chắc chặn thay đổi                          | SRE + SEC / COM-OPS-002: kiểm tra cấu hình thực, pin phù hợp, kiểm tra bắt buộc và không dùng secret production cho fork                                                |
| GAP-03 | Backend reporter dựng event từ `error.message`, stack và tags; startup truyền error gốc dù console đã có thông báo an toàn                                                                                                  | P0 trước bật telemetry: dữ liệu lỗi gốc có thể chứa thông tin không nên gửi  | SEC / COM-OPS-004: payload allowlist, test bằng canary/fixture transport; chưa kết luận đã có rò rỉ thực                                                                |
| GAP-04 | Frontend xóa breadcrumbs nhưng vẫn có exception/event và browser tracing; chưa có test chứng minh mọi đường gửi được lọc. Envelope backend có `length: 0` với body có nội dung, auth chưa được xác minh bằng transport/live | P1 tích hợp, P0 về dữ liệu trước bật: chưa chứng minh gửi/nhận và scrub đúng | SRE + SEC / COM-OPS-004: đối chiếu tài liệu SDK/protocol hiện hành, transport fixture và lỗi thử không có dữ liệu cá nhân; không gọi đã theo dõi lỗi chỉ từ file config |
| GAP-05 | ErrorBoundary ở `src/main.tsx` nói “Tiến độ học của bạn đã được lưu” mà không kiểm tra kết quả lưu                                                                                                                          | P1: người học có thể tin dữ liệu đã an toàn khi chưa có bằng chứng           | FE + QA / COM-UX-003: thông báo trung thực, đường xem/khôi phục phù hợp; không tự xác nhận đã lưu                                                                       |
| GAP-06 | README, TASKS và phần kiến trúc/deploy cũ vẫn nói đang thiếu schema hoặc chưa chuyển code Neon                                                                                                                              | P0 tài liệu vận hành: có thể dẫn người dùng chạy lại migration không cần     | PM/TL / COM-GOV-002: cập nhật snapshot theo probe mới, giữ lịch sử lỗi ở SESSION_LOG, bước tiếp theo là xác minh Auth/sync                                              |
| GAP-07 | Chưa biết lịch học/ngân sách/số người review thật                                                                                                                                                                           | P1 sản phẩm, không chặn kiểm kê/code độc lập                                 | PO/PM / COM-LEARN-001, COM-BIZ-001: nhận dữ liệu cụ thể, giữ giả định có nhãn; không quy “càng nhiều càng tốt” thành ngân sách vô hạn                                   |

Các GAP là đầu vào cho task COM hiện có, không tạo backlog trạng thái song song. COM-GOV-002 hoàn tất khi kiểm kê và cập nhật mâu thuẫn tài liệu xong; không đồng nghĩa mọi GAP đã được sửa.

## 6. Quyết định sau kiểm kê

Tiếp tục COM-OPS-001 cho OTP/sync/grants và revision cloud; việc cần tài khoản do người dùng thao tác trong luồng hợp lệ, không gửi OTP/secret vào tài liệu. Phần local tiếp theo là COM-OPS-002 để sửa đường phát hành và các check CI. COM-QA-001 dùng bảng năng lực/GAP trên để xây test matrix đầy đủ; COM-PRIV-001 chuẩn bị data inventory trước bật thêm telemetry/AI.

Giữ các thay đổi có sẵn trong working tree; không commit/push, kích hoạt deploy hook, gửi email/OTP hoặc thay mật khẩu/cloud trong lượt kiểm kê.
