# Trạng thái bàn giao hiện tại

Cập nhật: 2026-09-08, múi giờ Asia/Saigon.

## Đang ở đâu

**DEPLOY-002 IN_PROGRESS: đã chuẩn bị Vercel frontend + Render backend + Supabase Auth/DB theo lựa chọn người dùng.** Người dùng xác nhận chưa tạo project, muốn hướng dẫn từ đầu. Chưa có URL public, migration hosted/SMTP, kết quả cloud hoặc điện thoại thật. DEPLOY-001 đã DONE, AI-001 vẫn chờ ngân sách/key/đối chiếu riêng.

- Có vercel.json, render.yaml, build:vercel và start:backend. Frontend vẫn dùng Supabase Auth/RLS/RPC cho đăng nhập/sync; Vercel chuyển API gia sư/health sang Render cùng origin. Build chỉ chọn ba env public, tạo 98 static file + config Build Output API v3, không publish metadata/secret/_headers.
- Render production entrypoint dùng PORT/0.0.0.0/healthz, URL hosted/secret key, origins chính xác, cấu hình budget tồn tại trong DB và dọn response quá hạn. AI false/0 ban đầu; không worker nhắc production. Health chỉ xác nhận HTTP sau startup, không là kiểm tra DB liên tục.
- Node nhánh 22 thống nhất package/lockfile/hosting; chưa thay dependency version. createRelease tái dùng cho artifact độc lập (AI tắt) và Vercel (UI hỏi trạng thái server). Khi build snapshot không có Git, SHA provider được ghi nguồn riêng, dirty null.
- Giữ 28 bài + bốn kiểm tra, 57 WAV, phiên thích ứng, lịch ôn, bản sao/sync và StudyState 3/đọc 1/2/3. Không thêm tính năng học hoặc bật AI trả phí trong task này.

## Hướng dẫn dùng/triển khai

1. **Bắt đầu tại [DEPLOY_VERCEL_RENDER_SUPABASE.md](DEPLOY_VERCEL_RENDER_SUPABASE.md)**: tạo Supabase → dry-run/áp tám migration → OTP/SMTP → Render → Vercel → APP_ORIGINS/Site URL → kiểm tra URL thật. Bảng env/lỗi thường gặp ghi đúng lệnh và không yêu cầu gửi secret trong chat.
2. Vercel: Other, npm ci, npm run build:vercel, không Output Directory override; VITE_SUPABASE_URL/VITE_SUPABASE_PUBLISHABLE_KEY/RENDER_API_URL. Render: Node 22.18, npm ci, npm run start:backend, healthz; SUPABASE_URL/SUPABASE_SECRET_KEY, APP_ORIGINS sau khi có Vercel URL, AI false/ngân sách 0.
3. Bản khách local vẫn npm run release:build → release:verify → release:preview, http://127.0.0.1:4176/#/today; preview để chạy ẩn sau kiểm tra. Bản Auth local cũ 4175, OTP hộp thử 54324 và dịch vụ AI/nhắc cũ giữ nguyên. Không dùng ai:local trên Render.
4. Mỗi origin có dữ liệu local riêng; chuyển sang tên miền cần sync hoặc bản JSON. Hướng Pages trong DEPLOYMENT chỉ là phương án thay thế cũ cho release:build; không dùng với artifact Vercel có API proxy.

## File quan trọng

- [DEPLOY_VERCEL_RENDER_SUPABASE.md](DEPLOY_VERCEL_RENDER_SUPABASE.md), [TASKS.md](TASKS.md), DEC-021: hướng đi đã chốt và bước cần người dùng tạo project.
- vercel.json/render.yaml, scripts/release/vercel.js/vercel-config.js/create.js/source.js: cấu hình deploy/build public, proxy/cache/404, metadata nguồn và thư mục generated riêng.
- server/production.ts/deployment-config.ts, server/ai/http.ts: boot cloud không Docker, env/health, Auth/rate/budget giữ logic đã kiểm tra.
- server/*test.ts và scripts/release/*test.ts: validation/origin/health/routing/metadata; .local giữ artifact, fixture, log, bản kê và script kiểm tra không commit.

## Kiểm tra

- Lint/typecheck/build, 144/144 unit đạt. 38/38 ca release khách (desktop/360px), năm/năm API Auth/DB local thật đạt; provider test fixture, không AI thật. Bản kê/hash kiểm tra Vercel 98 static file, cấu hình/route và không chứa marker secret/biến không được chọn; trường hợp không Git checkout dùng metadata provider đạt.
- Entrypoint Node thực khởi động với transport DB fixture: health 200, không token 401, origin lạ 403, không lộ key trong log. Chưa chạy Render/HTTPS/CDN thật; không trình bày fixture là hosted DB.
- Đã sửa lint quét nhầm .vercel/output bằng ignore thư mục sinh, không bỏ lint source. Lockfile chỉ đổi engines root, không dependency. Docs/diff/secret scan và Git kiểm tra trước commit/push. Bundle vẫn cảnh báo chưa chia route.
- Smoke local AI vẫn tắt, paidRequests 0; sau dọn đúng tài khoản thử, user/profile/snapshot/commit/reminder/receipt/Mailpit 0, pilot budget false/0/spend0. Không reset DB hoặc xóa dữ liệu người dùng.

## Tiếp theo

**Tiếp tục DEPLOY-002 cùng người dùng tạo project Supabase trước**, rồi Render/Vercel theo hướng dẫn. Khi có URL/ref công khai, ghi vào STATUS và đối chiếu env/migration/OTP/proxy trên host thật. Không yêu cầu key/password qua chat. Chỉ đánh dấu task DONE sau deployment và kiểm tra thực tế trong phạm vi công bố.

Giới hạn: SMTP mặc định không gửi tự do đến học viên; Render Free có ngủ, không bảo đảm nhắc nền; chưa worker nhắc production, AI đã đối chiếu, mic, chương trình IELTS sáu tháng hoặc thiết bị thật. Nội dung/quy tắc học còn thử nghiệm như các tài liệu sản phẩm.
