# Supabase và tài khoản

DATA-001 có Supabase Auth thật trên Docker local, xác nhận email bằng mã và tên tài khoản có RLS. DATA-002 bổ sung đồng bộ tiến độ có lựa chọn và xử lý xung đột, xem [SYNC.md](SYNC.md). Chưa có dự án Supabase hosted hoặc SMTP gửi thư thật. Quyết định Auth ở [DEC-013](DECISIONS.md#dec-013--tài-khoản-bằng-mã-email-và-kho-học-theo-chủ-sở-hữu).

## Chạy trên máy phát triển

Yêu cầu Node theo README và Docker đang chạy Linux containers. Repo khóa Supabase CLI 2.116.0 và JavaScript SDK 2.115.0. Lần khởi động đầu cần tải các Docker image; không cần đăng nhập tài khoản Supabase cloud.

```sh
npm ci
npm run db:start
npm run db:migrate
npm run dev:local
```

Mở http://127.0.0.1:5173/#/account hoặc chọn **Tài khoản và đăng nhập** trong cài đặt. Nếu dev server 5173 đang chạy, dừng đúng tiến trình của dự án trước khi chạy `dev:local`.

1. Dùng email thử, chẳng hạn `learner@example.test`, chọn nhận mã.
2. Mở [hộp thư thử Mailpit](http://127.0.0.1:54324), tìm thư đúng người nhận và nhập mã sáu số vào app. Thư chỉ nằm trên máy, không gửi ra địa chỉ email thật. Bất kỳ người truy cập hộp thư thử đều có thể đọc mã; chỉ dùng dữ liệu thử.
3. Tên tài khoản được lưu khi bấm **Lưu tên tài khoản**. Reload để kiểm tra. Phần học của tài khoản bắt đầu riêng; phần khách không tự chuyển sang.
4. Chọn **Bật đồng bộ phần học này** nếu muốn gửi bài học vào tài khoản. Bật ở trình duyệt khác cùng tài khoản để tiếp tục; chờ trạng thái xác nhận. Phần khách chỉ nhập khi bạn chọn.
5. Đăng xuất để trở lại phần khách. Đăng nhập lại cùng tài khoản trên cùng origin để mở phần học đã giữ trên máy; một tab sửa kho tài khoản tại một thời điểm.

`dev:local` đọc cấu hình từ CLI trong tiến trình Node, chỉ truyền URL và publishable key cho Vite; không tạo `.env` hoặc in khóa ra console. `npm run dev` vẫn mở chế độ khách khi chưa cấu hình biến môi trường. Bản dev local chỉ nghe trên 127.0.0.1, chưa phải link mở từ điện thoại.

`npm run db:stop` dừng stack của repository và giữ dữ liệu trong Docker volume. Không dùng reset/xóa volume để sửa lỗi cổng. Khi vừa stop rồi start trên Windows, Docker có thể chưa nhả cổng; kiểm tra listener/container của dự án rồi thử lại sau khi cổng được giải phóng. Không dừng dịch vụ khác để lấy cổng.

## Cấu hình và migration

- `supabase/config.toml`: API 54321, PostgreSQL 54322, hộp thư thử 54324, shadow DB 54320. Chỉ bật các thành phần cần Auth/PostgREST/database/hộp thư; chưa bật Storage, Realtime, Studio, Edge Runtime hoặc Analytics.
- CLI có thể publish cổng Docker trên các interface của máy. Stack này dành cho phát triển với dữ liệu thử, không dùng làm dịch vụ production hoặc mở ra Internet.
- `supabase/migrations/20260906000100_account_profiles.sql`: bảng `account_profiles`, khóa ngoại tới `auth.users`, tên tối đa 40 ký tự, thời điểm tạo do máy chủ đặt. Xóa Auth user sẽ xóa hồ sơ liên quan.
- RLS bắt buộc `auth.uid() = id` cho đọc/tạo/sửa/xóa. Role chưa đăng nhập không có quyền bảng. Client chỉ được ghi ID và tên, không đổi `created_at`; policy chặn đổi ID sang người khác.
- Không có trigger tạo hồ sơ hoặc tải tiến độ lúc đăng ký; hàng tên được tạo qua thao tác lưu của người dùng. Giao diện chưa có xóa tài khoản; quyền xóa hàng được kiểm tra ở mức API.
- Hai template confirmation/magic link dùng `supabase/templates/otp.html` với `{{ .Token }}`. Mã local hết hạn sau 10 phút, tối thiểu 60 giây giữa yêu cầu email. Hạn mức đăng nhập/xác minh local là 100 mỗi 5 phút trên một IP để chạy bộ test tuần tự; không coi đó là cấu hình production đã duyệt.

CLI quản lý migration trong database; `db:start` khởi tạo stack mới, `npm run db:migrate` áp dụng migration còn thiếu vào stack local đã tồn tại. DATA-002 thêm migration 002/003 cho snapshot, nhật ký thay đổi và RPC ghi có kiểm tra phiên bản; quyền và cấu trúc ở SYNC. Không chạy `db reset` trên dữ liệu muốn giữ.

## Khi có dự án cloud

Phần này là hướng dẫn chuẩn bị, chưa triển khai hoặc xác minh dịch vụ hosted:

1. Áp dụng migration của repository vào đúng dự án đã được chọn; kiểm tra RLS với hai tài khoản ở môi trường đó. Không dùng service role trong client.
2. Bật email/passwordless Auth, confirmations và template mã cho cả email mới lẫn email đã đăng ký. App dùng `signInWithOtp` rồi `verifyOtp` loại `email`, không xử lý magic-link callback trong hash route. Thiết lập Site URL của app, thời hạn mã, hạn mức và SMTP phù hợp; kiểm tra gửi thư thật trước khi gọi là sẵn sàng.
3. Tạo `.env.local` từ [.env.example](../.env.example), điền `VITE_SUPABASE_URL` (HTTPS origin) và `VITE_SUPABASE_PUBLISHABLE_KEY` dạng `sb_publishable_…`. Hai giá trị này công khai trong bản build. Không điền secret key, service-role JWT, mật khẩu DB hay khóa AI. App cố ý chưa nhận legacy anon JWT.
4. Khởi động/build lại để nhận cấu hình. Cả hai biến trống mở chế độ khách; thiếu một biến, URL sai hoặc key không đúng loại khiến Vite dừng trước khi bundle. Đừng thêm biến `VITE_*` để giữ bí mật.
5. Kiểm tra đăng ký, mã sai/hết hạn, gửi lại, khôi phục phiên, đăng xuất và quyền chéo trên host thật. `test:auth` chỉ được phép chạy với backend loopback local, không dùng để tạo/xóa dữ liệu cloud.

Lựa chọn key dựa trên [hướng dẫn API key của Supabase](https://supabase.com/docs/guides/getting-started/api-keys). Luồng mã theo [Email passwordless](https://supabase.com/docs/guides/auth/auth-email-passwordless); local theo [CLI getting started](https://supabase.com/docs/guides/local-development/cli/getting-started) và [email templates](https://supabase.com/docs/guides/local-development/customizing-email-templates).

## Dữ liệu và đăng xuất

Để thử cả tài khoản và offline: `npm run preview:local` build vào `.local/preview-dist` với cấu hình công khai rồi mở http://127.0.0.1:4175. Cổng này có kho riêng với dev 5173, dùng đồng bộ/JSON để chuyển. Không có server key trong build. Xem [OFFLINE.md](OFFLINE.md).

| Dữ liệu | Nơi lưu hiện tại |
| --- | --- |
| Email, thông tin xác thực/phiên | Supabase Auth; phiên hiện tại do SDK giữ trong trình duyệt |
| Tên trong tài khoản | Bảng `account_profiles` với RLS |
| Tên gọi học tập, mục tiêu, câu trả lời, bài dở, lịch ôn, thời gian | localStorage riêng theo origin ứng dụng/backend/user ID; thêm study_snapshots và study_commits khi chủ động bật sync |
| Phần học không đăng nhập | Key cũ `moi-ngay.study.v1`, giữ nguyên dữ liệu version 1/2/3 |

Đăng xuất xóa phiên SDK trên trình duyệt và ẩn phần học của tài khoản, không xóa bài đang lưu. Kho học chưa mã hóa; đổi tài khoản chỉ tách giao diện, không bảo vệ khỏi người có quyền đọc dữ liệu trình duyệt/máy. Khi dùng máy chung, tải bản sao rồi xóa phần học hiện tại trong cài đặt trước khi đăng xuất. Khôi phục/xóa local dừng sync tại trình duyệt đó, không xóa dữ liệu học, Auth user hoặc tên trên server; bật lại có thể tải bản server xuống.

SDK khôi phục phiên local để chọn giao diện; mọi quyền server do Auth/RLS kiểm tra, không tin ID do client tự gửi. Khi server logout lỗi nhưng SDK đã bỏ phiên local, app báo đã rời tài khoản trên trình duyệt và chưa xác nhận thu hồi phía máy chủ. Access token đã cấp có thể còn hợp lệ đến lúc hết hạn; xem [Supabase signOut](https://supabase.com/docs/reference/javascript/auth-signout).

Đổi chủ sở hữu tăng epoch trước khi đổi kho và dựng lại form, ngăn bộ đo hoặc thao tác đọc file cũ ghi vào phần học mới. Auth cập nhật qua các tab cùng origin. Web Locks cho một tab sửa kho tài khoản; hai browser context/thiết bị dùng kiểm tra phiên bản và lựa chọn xung đột trên server. Request/callback cũ bị hủy khi đổi người; RPC xác minh chủ dự kiến trước ghi.

## Kiểm tra

```sh
npm run db:start
npm run db:migrate
npm run test:auth
```

Bộ test dùng Auth/PostgreSQL/RLS thật, tạo email `moi-ngay-<uuid>@example.test` và dọn đúng tài khoản/thư do test tạo. Test dùng secret key local chỉ trong Node để dựng/dọn dữ liệu; browser chỉ nhận publishable key và phiên của người dùng thử. Không capture trace Auth vì response có token. Chi tiết kịch bản và giới hạn tại [TESTING.md](TESTING.md).
