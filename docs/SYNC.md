# Đồng bộ tiến độ

DATA-002 bổ sung đồng bộ phần học của tài khoản, đã kiểm tra với hai browser context độc lập trên Supabase Docker local. Chưa có host công khai hoặc kiểm tra hai điện thoại thật. Cách chạy backend và email thử ở [BACKEND.md](BACKEND.md).

## Cách dùng

1. Mở `#/account` sau khi đăng nhập. Chọn **Bật đồng bộ phần học này** để gửi phần học của tài khoản trên trình duyệt này. Trước khi chọn, app không tự upload dữ liệu học có sẵn.
2. App có trạng thái đang gửi/chờ/mất mạng/lỗi/đã đồng bộ. Chỉ **Đã đồng bộ** mới xác nhận dữ liệu hiện tại đã được máy chủ nhận; thời điểm xác nhận gần nhất vẫn được ghi riêng khi có thay đổi mới.
3. Trên trình duyệt khác, đăng nhập cùng tài khoản và bật đồng bộ tại đó. Bài đã làm, bài dở, câu đang nhập, mục tiêu, phiên hiện tại, lịch ôn và số đo được tải xuống/gộp. Khi vừa chuyển máy có thể bấm **Đồng bộ ngay** để lấy dữ liệu mới.
4. Nếu hai nơi cùng sửa một bài dở, phiên hoặc thiết lập, chọn phần trên máy hoặc trong tài khoản. App giữ hai bản để xem/tải trước chọn; lịch sử có ID khác nhau vẫn được gộp. Trường hợp cùng ID kết quả nhưng nội dung khác cũng cần chọn, không cộng thành hai lượt.
5. Phần học trước đăng nhập không tự nhập. Trong tài khoản, chọn **Xem phần học không đăng nhập**, xem tóm tắt, chọn phía giữ thiết lập/bài dở nếu trùng rồi bấm **Nhập phần học đã chọn**. Có nút tải bản sao, giữ nguồn khách nguyên trạng. Nếu đã bật sync, phần nhập sẽ được gửi vào tài khoản.

Chế độ khách vẫn hoạt động như trước. Bật đồng bộ là lựa chọn trên từng kho trình duyệt/tài khoản, không phải quyền truy cập dữ liệu của người khác.

## Khi gián đoạn

- Khi app đã mở, mất mạng vẫn giữ các thay đổi học trong kho local và gửi lại khi online, lấy focus hoặc thử thủ công. PWA-002 thêm service worker/gói tải trước trên bản build để mở mới khi offline; xem [OFFLINE.md](OFFLINE.md). Dev vẫn cần server. Phiên cần refresh mở phần học local trước, sync chờ SDK xác nhận; cache công khai không giữ response tài khoản.
- App đợi khoảng 800 ms sau thay đổi rồi đồng bộ, kiểm tra lại mỗi 15 giây khi trang hiển thị. Không hứa chạy nền khi OS đóng tab. Hộp cài đặt đang mở tạm hoãn đồng bộ để giữ nội dung chưa bấm lưu.
- Một tài khoản có một tab được phép sửa kho học trong cùng origin, do Web Locks quản lý. Tab khác xem tài khoản/đăng xuất được và sẽ tiếp tục học khi tab giữ khóa đóng/rời tài khoản. Hai trình duyệt/thiết bị có khóa độc lập, dùng quy tắc xung đột server. Nếu thiếu Web Locks, chỉ dùng phần local; không bật sync.
- Đăng xuất/đổi chủ hủy request và vô hiệu phản hồi cũ. Yêu cầu đã tới server có thể đã được ghi; phản hồi đó không cập nhật kho người đăng nhập sau.
- **Dừng đồng bộ**, khôi phục JSON hoặc xóa trên thiết bị không xóa dữ liệu server. Bật lại có thể tải bản server trở lại. Khi cần dọn máy chung: giữ bản sao, xóa phần hiện tại trong cài đặt rồi đăng xuất. Chưa có giao diện xóa toàn bộ lịch sử server/tài khoản.
- Kho vẫn chưa mã hóa. Khi lỗi quota, giữ tab và xuất bản sao; app không xác nhận thành công hoặc gửi payload mới chưa ghi được vào kho local.

## Mô hình và tính nhất quán

`StudyState` và bản sao vẫn version 3, đọc version 1/2. Root localStorage giữ dữ liệu học cùng `_sync` version 1 gồm bản chung đã xác nhận, một payload đang gửi với UUID cố định, bản xung đột nếu có và thời điểm xác nhận. Các thay đổi mới trong lúc gửi được giữ ở trạng thái hiện tại cho lần sau. Metadata và tiến độ được ghi bằng cùng một `setItem`, tránh lệch outbox sau reload. Bản sao hợp lệ chỉ xuất StudyState; khi kho lỗi, xuất nguyên bản lỗi để khôi phục như trước.

Không chạy song song bản app cũ chưa hiểu `_sync` trên cùng kho. Bản sao JSON vẫn tương thích, nhưng code cũ có thể ghi bỏ metadata. Chưa chuyển sang IndexedDB; dung lượng phụ thuộc quota trình duyệt và metadata có thể chứa nhiều bản của tiến độ. PWA-002 chỉ dùng Cache Storage cho file công khai, chưa chuyển tiến độ sang IndexedDB; cần xét khi dữ liệu lớn hơn.

| Thành phần | Trách nhiệm |
| --- | --- |
| `src/domain/sync.ts` | So sánh độc lập thứ tự key JSON; gộp ba phía; chọn xung đột |
| `src/data/study-store.ts` | Ghi trạng thái/metadata atomic, giữ bản lỗi, epoch và số phiên bản giao diện khi tải dữ liệu khác |
| `src/data/sync-engine.ts` | Outbox, nhận xác nhận, rebase, retry, hoãn khi mở cài đặt và hủy theo chủ |
| `src/app/sync.ts` | Vòng đời Auth, khóa tab, online/focus/chu kỳ và trạng thái UI |
| `src/services/study-sync.ts` | Gọi Supabase, validation dữ liệu nhận, truyền AbortSignal/chủ dự kiến |
| `src/features/account/SyncPanel.tsx` | Bật/dừng, trạng thái, hai bản xung đột và nhập phần khách |

Lịch sử completion/review/quick/plan được hợp nhất theo ID, không dùng xóa từ một snapshot cũ để loại kết quả phía khác. Checkpoint có cùng ID/nguồn lấy số mili giây cộng dồn lớn nhất, không cộng lại delta. Lịch ôn dựng lại theo thời gian lượt ôn, dùng ID để phá hòa; bắt đầu từ lần hoàn thành đầu tiên. Bản cũ thiếu lịch sử nguồn giữ lịch có sẵn, không bịa các lượt đã mất. Số đo từ các lượt mở khác nhau vẫn cộng, không khẳng định chú ý hoặc band IELTS.

Hồ sơ, draft và plan dùng gộp ba phía: chỉ một phía thay thì nhận phía đó; cả hai thay khác nhau thì dừng để chọn. Form bài học được dựng lại khi cần nhận phiên/draft mới; không dựng lại toàn bộ trang tài khoản và làm mất tên đang nhập. Epoch ngăn bộ đo/file import cũ ghi vào bộ dữ liệu vừa thay.

## Server

- Migration `20260906000200_study_sync.sql` tạo `study_snapshots`, `study_commits` và RPC `commit_study`. Migration `20260906000300_study_commit_changes.sql` chuyển receipt sang hash SHA-256 và các phần thay đổi; bảo toàn receipt cũ nếu có. Cả hai migration cần áp dụng đúng thứ tự.
- Snapshot giữ trạng thái hiện tại và revision. Commit giữ UUID, revision gốc/kết quả, hash payload và `changes`: hồ sơ/draft/plan/reviews thay đổi; lịch sử chỉ có các bản ghi upsert và ID bị loại. Không lưu lại toàn bộ lịch sử không đổi theo mỗi lần gõ. Bản nhận chuyển từ migration cũ có `legacySnapshot`.
- RPC xác nhận người gọi bằng Auth và đòi `p_owner = auth.uid()`, khóa hàng trước kiểm tra revision. Revision cũ trả bản hiện tại để client gộp; không ghi đè. UUID/nội dung/revision gốc giống lần trước trả receipt cũ; tái dùng UUID cho nội dung khác bị từ chối.
- Chỉ RPC có quyền ghi theo quy trình này. Role authenticated chỉ đọc hàng của mình qua RLS; chưa đăng nhập không có quyền. Function definer khóa `search_path`, định danh đầy đủ bảng và không nhận quyền từ ID client tự khai. Test kiểm tra cả chéo chủ và cố ghi bảng trực tiếp.
- Server kiểm tra version, cấu trúc ngoài, các loại trường, số lượng/ID bản ghi và giới hạn JSON 5 MB. Zod phía client kiểm tra chi tiết ngữ nghĩa học; dữ liệu server không hợp lệ bị từ chối trước thay local. Không coi kiểm tra client là cơ chế phân quyền server.
- Request/pull vẫn gửi snapshot đầy đủ cho bộ dữ liệu nhỏ hiện tại. Chưa benchmark dữ liệu nhiều tháng, phân trang lịch sử, thời gian lưu/xóa log hoặc giới hạn tần suất RPC production. Cần hoàn thiện trước beta/hosted, không coi giới hạn 5 MB là ngân sách vận hành đã duyệt.

Quyết định và nguồn chính thức ở [DEC-014](DECISIONS.md#dec-014--đồng-bộ-có-phiên-bản-và-xử-lý-xung-đột-rõ-ràng). Kịch bản kiểm tra, dữ liệu fixture và giới hạn thiết bị ở [TESTING.md](TESTING.md).
