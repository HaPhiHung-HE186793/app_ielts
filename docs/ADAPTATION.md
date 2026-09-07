# Chọn phiên theo sức học và kết quả

Cập nhật 2026-09-07, ADAPT-001. Bộ gợi ý dùng quy tắc trong app, chạy offline, không gọi AI. Quy tắc phiên bản 1 là lựa chọn sản phẩm thử nghiệm, chưa được hiệu chỉnh bằng nghiên cứu sử dụng hoặc giáo viên.

## Cách dùng

Trong **Hôm nay**, chọn nhịp và thời gian, mở **Xem bài được chọn và lý do** nếu cần rồi bắt đầu. Có thể tiếp tục phiên dở hoặc tự chọn bài trong Khám phá. Trong phiên có đường về chọn nhịp khác/nghỉ; thay danh sách đang dở cần xác nhận, không tự áp dụng chỉ vì đổi lựa chọn xem trước.

| Nhịp | Phiên 15 phút/buổi đầy đủ | Phiên ngắn |
| --- | --- | --- |
| Bình thường | Tối đa ba câu ôn, tổng tối đa 10 hoạt động theo ngân sách | 5 phút: một bài; 2 phút: một câu khởi động |
| Hôm nay mệt | Tối đa một câu ôn và một bài | 5 phút: một bài; 2 phút: ưu tiên câu đã gặp |
| Khó quá | Nếu chọn lâu hơn, tối đa một câu ôn và một bài | Khi chọn nhịp này, chuyển gợi ý sang 2 phút với câu nền tảng liên quan |
| Quay lại sau nghỉ | Tối đa hai câu ôn và một bài | 5 phút: một bài; 2 phút: ưu tiên câu đã gặp |

Chỉ xếp hoạt động vừa ngân sách: bài 5 phút, ôn 1 phút, khởi động 2 phút. Nhịp nhẹ không bù phần trống bằng bài mới. Ví dụ chọn ngân sách 60 phút và “mệt” có thể chỉ xếp sáu phút; phần chưa xếp không được ghi thành thời gian học. Nhịp “khó” không thay bài dở khi làm câu khởi động. Nếu tự chọn một bài đầy đủ khác, vẫn có xác nhận thay draft như trước.

Sau ít nhất bảy ngày từ completion/review/quick/activity gần nhất được lưu, Hôm nay mời quay lại nhẹ; có thể đổi sang bình thường. Không có lịch sử thì không đoán rằng người học đã nghỉ. Timestamps tương lai không dùng cho tín hiệu này. Không dùng lần mở trang để chứng minh đã học, không sửa hạn ôn hoặc xóa lịch sử vì gián đoạn.

## Thứ tự gợi ý

1. Với phiên dài, lấy các câu đã đến hạn theo thứ tự hạn cũ nhất, giới hạn theo nhịp. Không kéo thẻ chưa đến hạn lên trước hoặc thay lịch chỉ vì lập kế hoạch.
2. Bài đang dở được ưu tiên tiếp tục, giữ UUID/câu trả lời. Nhịp nhẹ chỉ có tối đa một bài nên có thể chưa xếp bài cần hỗ trợ khác.
3. Xếp tối đa một bài có tín hiệu cần luyện thêm, nếu bài đó chưa nằm trong phần ôn của phiên. Tín hiệu là **lượt được ghi gần nhất**: completion dưới 2/3 câu độc lập, hoặc ôn/khởi động sai/có gợi ý. Lượt mới thay tín hiệu cũ; không khẳng định đã khắc phục mọi điểm yếu khi một câu ôn đúng. Nếu nhiều bài, ưu tiên tín hiệu cũ hơn; không dựa vào thứ tự mảng sau sync. Bài chưa học ở tuần sau không được đẩy lên chỉ vì từng làm sai một câu khởi động.
4. Bài mới theo tuần đầu tiên còn thiếu. Quan hệ trong `src/content/prerequisites.ts` yêu cầu bài trước đã hoàn thành hoặc nằm trước trong phiên đang lập. Check cuối tuần cần các bài của tuần đứng trước. Đây là thứ tự luyện, không là mô hình chứng nhận thành thạo.
5. Luân phiên một lượt theo thứ tự cơ bản, một lượt có thể chọn sở thích trong ba bài sẵn sàng gần nhất. Pha luân phiên dựa số lượt hoàn thành + vị trí bài trong danh sách gợi ý, không ngẫu nhiên. Như vậy sở thích không cho phép nhảy qua tuần hoặc bỏ mãi các chủ đề khác. Bài cần hỗ trợ được xét trước sở thích.
6. Khi hết bài mới, nhịp bình thường còn phần ôn đến hạn; nhịp nhẹ có thể gợi ý học lại bài quen. Người học luôn có đường nghỉ, dùng câu khởi động hoặc mở Khám phá.

Phiên hai phút dùng bài dở hoặc bài được gợi ý. Khi chọn “khó”, lấy nhánh kiến thức trước đầu tiên và lùi tới nền tảng đã học hoặc bài gốc; không thay draft. Đây là một lựa chọn để bắt đầu lại, chưa phải chẩn đoán nguyên nhân khó.

## Kỹ năng và giới hạn

- Dữ liệu cũ chỉ có tổng câu độc lập của bài và kết quả truy hồi; chưa có bằng chứng chấm riêng nghe/đọc/nói/viết. Không hiển thị “yếu Speaking/Listening” từ dữ liệu tổng này.
- Bài đầy đủ vẫn chứa phần nghe/đọc/tự nói/viết; sở thích không lọc bỏ các hoạt động. Bài cũ có nghe mẫu, bài mới có nghe tình huống. Phần tự nói/viết vẫn có thể bỏ qua và chưa chấm điểm.
- Người học có thể lặp phiên hai phút; app không khóa lựa chọn đó, nhưng nêu rõ đây là khởi động, không thay buổi học đầy đủ hoặc mục tiêu IELTS sáu tháng. Không có streak phạt, nợ bài hoặc thông báo thúc ép mới.
- Sau khi bắt đầu, bài và lý do giữ nguyên kể cả khi kết quả mới xuất hiện. Phiên tiếp theo nhận tín hiệu mới. Không tự cắt ngang bài vì làm sai hoặc đổi thứ tự đã được người học chọn.

## Dữ liệu và kiểm tra

Plan/lịch sử có `adaptation?: { rule: 1, pace }`; mỗi item có `reason?: string` tối đa 240 ký tự. Đây là metadata tùy chọn; vẫn StudyState 3/đọc 1/2/3 và 10 hoạt động, không migration backend. Lý do lưu cùng phiên để không viết lại lịch sử theo trạng thái mới. Merge theo cơ chế plan/lịch sử hiện có; đổi đồng thời vẫn yêu cầu chọn xung đột.

Bản app cũ có thể bỏ các trường tùy chọn nhưng đọc được danh sách/kết quả. Nên cập nhật mọi máy trước khi đồng bộ để giữ nhịp/lý do. Nhập bản sao lỗi vẫn bị từ chối trước ghi. Không lưu mood lâu dài trong hồ sơ hoặc chẩn đoán sức khỏe; lựa chọn thuộc từng phiên và lịch sử của người học.

Phạm vi kiểm tra và kết quả hiện tại ở [TESTING.md](TESTING.md) / [STATUS.md](STATUS.md). Học liệu, nguồn và giới hạn chấm ở [CURRICULUM.md](CURRICULUM.md) / [CONTENT_REVIEW.md](CONTENT_REVIEW.md). Task AI/triển khai riêng, không coi quy tắc này là gia sư AI hoặc beta hoàn chỉnh.
