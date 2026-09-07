# Bộ nền tảng bốn tuần

Cập nhật 2026-09-07. Bộ **thử nghiệm** gồm 28 bài và bốn bài kiểm tra luyện tập, theo bốn nhóm tuần. Tuần là gợi ý thứ tự, không phải hạn chót hoặc chứng nhận trình độ. Có thể dành nhiều ngày cho một bài; các phiên vài phút không đủ thay chương trình IELTS sáu tháng.

## Cách dùng

Vào **Khám phá**, chọn tuần rồi chủ đề. Mỗi tuần có bảy bài và một bài nhìn lại, có điểm dừng. Hôm nay hiển thị tổng số bài/kiểm tra hoàn thành và số đã học từng tuần; số này không đo mức thành thạo. Chọn một bài bất kỳ chưa bị khóa theo ngày.

Bảy bài cũ giữ nguyên ID, câu hỏi và đáp án. Bài cũ làm quen theo cụm; gặp went/going to trong tuần 1 không có nghĩa đã nắm toàn bộ thì quá khứ/tương lai. Tuần 4 quay lại và mở rộng các dạng đó có giải thích.

| Tuần | Bảy bài | Mục tiêu và lần nhìn lại |
| --- | --- | --- |
| 1 · Làm quen với câu | hello, friends, tea, room, morning, yesterday, tonight | Giới thiệu, yêu cầu, giờ/vị trí và cụm quen thuộc; kiểm tra thông tin từ câu ngắn |
| 2 · Mình và người quanh mình | family, have, likes, questions, negative, ability, routine | Đại từ/be, have/has, sở thích, do/not, can, trình tự; đọc thói quen và nghe khả năng |
| 3 · Thực hiện một việc | plural, places, directions, shopping, prices, schedule, requests | Số lượng, vị trí, chỉ đường, mua đồ/giá, thứ/giờ, nhờ giúp; kiểm tra lịch hẹn và nghe chỉ dẫn |
| 4 · Ghép ý ngắn | past-be, past-actions, past-negative, future-plans, reasons, messages, small-story | Was/were, quá khứ quen thuộc/did not, dự định, because, lời nhắn/chuyện ngắn; phân biệt thời gian và lý do |

Mỗi tuần kết thúc bằng `week-N-check`. Mã bài trong dữ liệu là ổn định; tên tuần và vị trí có thể hiệu chỉnh sau đánh giá sử dụng. Chưa có đánh giá đầu vào, phân loại Academic/General hoặc xếp tuần tự động theo điểm yếu; phần thích ứng thuộc ADAPT-001.

## Bốn kỹ năng trong một bài

- **Đọc**: câu mẫu và đoạn ngắn; tìm đúng thông tin trước khi xem giải thích. Bài mới có đoạn 11–21 từ, không yêu cầu đoán thông tin ngoài đoạn.
- **Nghe**: file mẫu và, với bài mới/kiểm tra, một tình huống khác. Lời thoại ẩn trước trả lời; có thể nghe lại. Chọn xem lời thoại hoặc gợi ý sẽ ghi `hintUsed`, giữ qua reload và không tính câu đó là độc lập. Bài cũ có nghe mẫu, chưa có câu hỏi nghe riêng.
- **Tự nói**: yêu cầu cụ thể, từ một câu tới một lượt hỏi–đáp hoặc câu chuyện ngắn. Tự nói thành tiếng, nghe lại mẫu khi cần. Không ghi âm hoặc chấm phát âm; chưa có bằng chứng định lượng cho kết quả nói.
- **Viết**: câu nháp lưu theo kho học; phần “Tự xem lại” nêu tiêu chí để sửa. Tăng từ câu đơn tới lời nhắn/chuyện ba hoặc bốn câu. Không có điểm tự động cho bài mở; AI chỉ là gợi ý tùy chọn khi dịch vụ đã bật và người học đồng ý.

Ba câu đóng/bài giữ cấu trúc đọc/hiểu → tự nhớ → tình huống mới. Câu sai có giải thích và được thử lại. Thông báo `n/3` chỉ nói số câu đúng lần đầu không cần gợi ý; không chấm nói/viết, không là tổng điểm bài thi. Phần nói/viết không bắt buộc để vượt màn hình, vì thế “đã học” cũng không chứng minh người học đã thực hành đủ bốn kỹ năng.

## Kiểm tra luyện tập và ôn

Bài cuối tuần tái sử dụng kiến thức trong ngữ cảnh khác, có gợi ý/thử lại như bài thường. Kết quả, câu tự viết và một câu ôn được lưu bằng cơ chế hiện có. Không có đếm ngược, đậu/rớt hoặc band. Câu trả lời có hỗ trợ được phân biệt trong kết quả; xem lại transcript sau khi đã trả lời đúng không làm đổi ngược kết quả trước đó.

Khi thấy khó, xem lại bài cùng chủ đề, dùng lời thoại hoặc làm một phiên ngắn rồi nghỉ. Không có cơ chế tự chẩn đoán điểm yếu/sắp lại bài trong CONTENT-002. Task ADAPT-001 sẽ kết nối tín hiệu thực tế với lịch ôn và lựa chọn “khó quá/hôm nay mệt”.

## Dữ liệu, offline và tương thích

- StudyState/JSON backup vẫn version 3, đọc bản 1/2/3; giữ toàn bộ định nghĩa bảy bài cũ. Bài mới có ID mới; một bài dở tại một thời điểm như trước.
- Một phiên tối đa 10 hoạt động để phù hợp schema hiện có. Buổi dài hiển thị phần thời gian chưa được xếp; không tạo giờ học giả. Phút bài vẫn là ước tính 5 phút để giữ tương thích kế hoạch; tự nói/viết kỹ có thể lâu hơn.
- Gói có **57 WAV + 1 JSON**, tổng **8.921.491 byte**, khoảng 8,92 MB, chưa gồm shell/overhead. Giữ bảy WAV cũ nguyên byte, thêm 50 file công khai từ eSpeak NG 1.51. Có hash kiểm tra, không tự tải gói mới; xem [OFFLINE.md](OFFLINE.md).
- Trước sync hoặc nhập JSON có bài mới sang máy khác, cập nhật app ở máy đó. Bản cũ không biết ID mới và có thể từ chối dữ liệu; không xóa kho/bản sao để né lỗi. Đóng hết cửa sổ cũ để worker mới kích hoạt, mở lại rồi chủ động tải gói mới.
- Không có migration backend mới, không ghi âm cá nhân hoặc thêm dữ liệu AI vào bản sao. Cache chỉ chứa học liệu công khai. Hồ sơ biên soạn/rà soát ở [CONTENT_REVIEW.md](CONTENT_REVIEW.md).
