# Định hướng sản phẩm

Ngày lập: 2026-09-06. Trạng thái: cơ sở triển khai ban đầu; tính năng dưới đây là kế hoạch, trừ khi `STATUS.md` và `TASKS.md` ghi đã hoàn thành.

## 1. Vấn đề cần giải quyết

Người Việt mất gốc thường khó chọn bài vừa sức, duy trì lịch học, nhớ kiến thức lâu và nhận được phản hồi cụ thể. Sản phẩm giúp người học mở ứng dụng là biết việc nên làm tiếp theo và nhìn thấy năng lực mình đã cải thiện.

Mục tiêu sản phẩm: hỗ trợ tự học có định hướng từ nền tảng đến IELTS, với các lần kiểm tra và điều chỉnh kế hoạch. IELTS 6.5 trong sáu tháng là mục tiêu tham khảo của người dùng, không phải đầu ra bảo đảm.

## 2. Người dùng và giả định

- Bản đầu phục vụ cá nhân chủ dự án tự học; giả định này chưa được người dùng xác nhận riêng.
- Giao diện ưu tiên điện thoại, sử dụng được trên máy tính, iOS và Android.
- Onboarding đã thu thập thời gian dự kiến, mục tiêu/ngày tùy chọn, Academic/General Training/chưa quyết định, sở thích và tự nhận xét nền tảng. Điểm đầu vào, thời gian học đo thực tế và yêu cầu tối thiểu từng kỹ năng vẫn chưa có.
- Cho phép học trước khi đã quyết định ngày thi; không ép nhập dữ liệu không biết.
- AI hỗ trợ luyện tập. Đánh giá của giáo viên là nguồn đối chiếu cho các mốc quan trọng khi có điều kiện.

## 3. Nguyên tắc học và giữ động lực

1. Nội dung phù hợp trình độ, có ngữ cảnh và gắn với sở thích khi phù hợp mục tiêu bài học.
2. Mỗi bài cần hoạt động chủ động: nhớ lại, trả lời, nói hoặc viết.
3. Phản hồi ngắn, cụ thể, cho phép thử lại; ưu tiên ít lỗi có giá trị sửa nhất ở trình độ đầu.
4. Ôn dựa trên kết quả nhiều lần, bao gồm lần nhớ lại sau khoảng nghỉ; một đáp án đúng chưa chứng minh đã thành thạo.
5. Phiên ngắn giúp bắt đầu. Buổi tập trung, chữa bài và luyện bốn kỹ năng vẫn có trong kế hoạch đầy đủ.
6. Cho chọn chủ đề, mức hỗ trợ và thời gian. Có điểm dừng rõ ràng và chế độ quay lại sau nghỉ.
7. Khen tiến bộ có bằng chứng; không phạt mất streak, tạo áp lực thông báo hoặc coi thời gian lướt là năng lực.
8. Giải thích tiếng Việt khi cần; không bắt người mất gốc chuyển toàn bộ giao diện sang tiếng Anh.

## 4. Hành trình chính

### Lần đầu

Chọn mục tiêu và sở thích → khai báo thời gian → đánh giá nền tảng theo phần ngắn → nhận kế hoạch tuần đầu → hoàn thành một bài vừa sức.

Không gán band IELTS từ một bài kiểm tra nền tảng ngắn. Cho phép bỏ qua phần chưa thể làm; ghi nhận mức độ thiếu dữ liệu.

Hiện thực trong PLAN-001: form thiết lập có thể bỏ qua, sau đó chọn một phiên từ bảy bài hiện có. Chưa triển khai bài đánh giá hoặc kế hoạch tuần/sáu tháng cá nhân. Phiên 2 phút có kết quả khởi động riêng; phiên 5 phút là bài đầy đủ, phiên 15 phút/buổi đầy đủ ghép bài và tối đa ba câu đến hạn. Chi tiết thời lượng và giới hạn ở DEC-010.

### Mỗi ngày

Mở Hôm nay → chọn thời gian hoặc tiếp tục lịch → học/ôn → nhận phản hồi → xem kết quả cụ thể → lưu tiến độ → chọn nghỉ hoặc học tiếp.

### Sau gián đoạn

Chào mừng quay lại → chọn một phiên nhẹ → kiểm tra một phần kiến thức cũ → sắp xếp lại lịch → tăng dần bài mới. Không dồn toàn bộ bài nợ lên một ngày.

## 5. Năm khu vực sản phẩm

| Khu vực | Chức năng chính | Ranh giới |
| --- | --- | --- |
| Hôm nay | Bài tiếp theo, lịch học đầy đủ, chọn 2/5/15 phút hoặc buổi dài | Phiên duy trì không được hiển thị như đã đủ khối lượng luyện thi |
| Khám phá | Thẻ nội dung theo sở thích và trình độ, câu hỏi gắn với nội dung | Học theo cụm hữu hạn, có điểm dừng; không xây mạng xã hội |
| Luyện tập | Bài nghe/đọc/nói/viết, chữa bài và thử lại | Chức năng chưa có AI thật phải được ghi rõ |
| Ôn lại | Từ/cụm từ trong ngữ cảnh và lỗi cần ôn | Không chỉ quẹt để đánh dấu đã biết; có hoạt động tự nhớ lại |
| Tiến bộ | Lịch sử bài, khả năng nhớ, bài nói/viết trước–sau, kết quả đánh giá | XP/streak và band IELTS là các loại thông tin khác nhau |

## 6. Bài học mẫu cần hỗ trợ

Người học xem/nghe câu “I usually play with my friends.”, tìm hiểu “usually”, ẩn câu mẫu, tự trả lời về thói quen của mình, nhận phản hồi và gặp lại cấu trúc trong ngữ cảnh mới ở lần ôn sau.

Một đơn vị học có: mục tiêu, mức độ, chủ đề, văn bản/audio phù hợp, hoạt động, đáp án hoặc rubric, giải thích, gợi ý và nguồn/quyền sử dụng. Nội dung AI tạo phải qua kiểm tra trước khi vào bộ học liệu chuẩn.

## 7. Khung sáu tháng có điều chỉnh

| Giai đoạn dự kiến | Trọng tâm | Điều kiện xem xét chuyển tiếp |
| --- | --- | --- |
| Tuần 1–4 | Âm thường gặp, từ/cụm từ thiết yếu, câu đơn giản; nghe, nói, đọc, viết từ đầu | Hiểu và trả lời tình huống quen thuộc với mức hỗ trợ giảm dần |
| Tuần 5–8 | Hội thoại, đọc ngắn, kể chuyện, viết đoạn, làm quen IELTS vừa sức | Thực hiện nhiệm vụ mới và nhớ lại kiến thức sau khoảng nghỉ |
| Tuần 9–16 | Bốn kỹ năng IELTS, phát triển ý, bài dài hơn, chữa lỗi | Kết quả đánh giá từng kỹ năng cải thiện qua nhiều lần |
| Tuần 17–22 | Luyện có thời gian, tập trung điểm yếu, sửa bài hoàn chỉnh | Hoàn thành nhiệm vụ đúng thời gian và chất lượng phù hợp |
| Tuần 23–26 | Thi thử, chữa lỗi, điều chỉnh chiến thuật | Nhiều kết quả gần mục tiêu, có đối chiếu giáo viên khi có thể |

Các tuần là khung kế hoạch, không phải cam kết đạt một trình độ vào ngày cố định. Nếu tiến độ thiếu, nêu rõ lựa chọn tăng thời gian, bổ sung hỗ trợ hoặc đổi ngày mục tiêu. Không coi nghe nền là giờ học chủ động tương đương.

## 8. Giới hạn đánh giá AI

- Writing: người học viết → gợi ý → tự sửa → đánh giá lại. Không mặc định viết hộ toàn bài.
- Speaking: cần bản ghi âm để đánh giá các đặc điểm âm thanh; transcript đơn thuần không đủ căn cứ nhận xét phát âm.
- Kết quả có nguồn, ngày, phạm vi đã đánh giá và hạn chế. Điểm AI hiển thị là ước lượng.
- Không suy band từ một câu nói, số từ đã học hoặc mức hoàn thành kế hoạch.
- Lưu ví dụ và lý do sửa lỗi để học viên hiểu phản hồi; cho phép báo phản hồi sai.

## 9. Phạm vi bản đầu và phần để sau

Bản đầu cần một luồng học hoàn chỉnh với học liệu thật, lưu tiến độ, ôn lại và hoạt động tốt trên màn hình điện thoại. Ban đầu có thể dùng dữ liệu local; phải nói rõ giới hạn sao lưu trước khi có tài khoản/đồng bộ.

Sau đó bổ sung tài khoản, đồng bộ, AI, học liệu bốn tuần được kiểm duyệt và PWA offline có phạm vi rõ. Ngân sách AI cần hạn mức phía máy chủ.

Để sau: thi thử đầy đủ, dashboard gia sư, nhiều học viên, thu phí, phát hành App Store/Google Play. Không nằm trong kế hoạch ban đầu: mạng xã hội, bảng xếp hạng công khai, cuộn vô hạn, “hộp quà” ngẫu nhiên nhằm kéo dài sử dụng.

## 10. Đo hiệu quả

- Hoàn thành phiên học đầu và biết hành động tiếp theo.
- Nhớ lại được sau vài ngày, sử dụng được trong tình huống chưa gặp.
- Lỗi đã sửa có giảm qua các bài sau hay không.
- Người học quay lại và tiếp tục sau ngày nghỉ mà không bị quá tải bài ôn.
- Kết quả bốn kỹ năng theo các đánh giá có nguồn rõ ràng.
- Theo dõi phút luyện chủ động riêng với thời gian mở ứng dụng.

Chưa đặt ngưỡng thành công định lượng trước khi có dữ liệu thử nghiệm; không dùng số giả như kết quả đo thực.

## 11. Nguồn tham khảo

Các nguồn đã được xem khi lập đề xuất ngày 2026-09-06:

- [Cambridge: guided learning hours](https://support.cambridgeenglish.org/hc/en-gb/articles/202838506-Guided-learning-hours): tham khảo quy mô công sức, không quy đổi trực tiếp giờ học thành IELTS.
- [Karpicke & Roediger, 2008](https://doi.org/10.1126/science.1152408): nghiên cứu về truy hồi trong học từ vựng.
- [IELTS: scoring in detail](https://ielts.org/take-a-test/your-results/ielts-scoring-in-detail): tiêu chí và cách tính điểm; xem lại khi triển khai tính năng đánh giá.
