# Product charter — Mỗi ngày

Phiên bản 1 · 2026-09-11 · Task COM-GOV-001 · Phạm vi: cơ sở triển khai bản dùng cá nhân và kiểm định thương mại.

## 1. Quyết định làm việc

Xây một ứng dụng tiếng Việt giúp chủ dự án mở lên biết nên học gì, học và ôn có kết quả được lưu đáng tin cậy, dùng kiến thức trong đời sống và tiến tới luyện IELTS theo đầu vào thực. Sau khi kiểm định giá trị với người học, bán gói quyền lợi có chất lượng và chi phí vận hành đo được.

Người dùng đã yêu cầu bắt đầu triển khai [backlog thương mại](TASKS_COMMERCIAL.md). Charter này cụ thể hóa phạm vi làm việc đó; không giả định đã có đánh giá trình độ, ngân sách, nhân sự hoặc lịch ra mắt được phê duyệt.

## 2. Khách hàng và vấn đề

| Nhóm                            | Điều đã biết                                                                                        | Điều cần kiểm định                                                                                                 |
| ------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Chủ dự án — người dùng đầu tiên | Muốn tự luyện hằng ngày, ứng dụng đời sống và thương mại hóa; phản hồi muốn đầu tư nhiều để làm tốt | Trình độ, thời gian/ngày, thiết bị chính, Academic/General Training, ngày thi và mức chi cụ thể chưa được cung cấp |
| Khách hàng beta                 | Giả thuyết: người Việt trưởng thành bận học/làm, cần nền tảng và định hướng IELTS                   | Vấn đề ưu tiên, trình độ thực, cách học hiện tại, rào cản quay lại và nhu cầu trả tiền                             |
| Khách hàng trả phí              | Chỉ mở sau khi biết gói quyền lợi đáp ứng nhu cầu và có năng lực hỗ trợ                             | Phân khúc, giá, chu kỳ trả phí, chi phí phục vụ và tỷ lệ duy trì                                                   |

Ba vấn đề ưu tiên: khó chọn bài vừa sức; quên kiến thức và không biết dùng lại; mất nhịp hoặc thiếu tin cậy khi tiếp tục bài trên thiết bị khác. Hai vấn đề đầu là giả thuyết cần quan sát, vấn đề kỹ thuật phải đo và tái hiện; không ghi khảo sát/phỏng vấn chưa thực hiện như sự thật.

## 3. Phạm vi bản đầu

### Bản dùng cá nhân tin cậy — G1

- Giữ năm khu vực Hôm nay, Khám phá, Luyện tập, Ôn lại, Tiến bộ; tiếp tục từ code đang có.
- Học theo phiên có điểm dừng; bài dở và kết quả được lưu; có ôn chủ động, phân biệt đúng độc lập với đúng sau gợi ý.
- Dùng học liệu nền tảng hiện có với nhãn thử nghiệm; nghe, đọc, tự nói/viết và tự xem lại đúng phạm vi thực.
- Tài khoản/đồng bộ có trạng thái rõ; kiểm tra đăng nhập, mất mạng, gửi lặp, đổi chủ và khôi phục. Dữ liệu khách không tự gửi lên cloud.
- Gói offline, xuất/nhập bản sao và tiếp tục bài được kiểm tra trên thiết bị thật trước nghiệm thu G1.
- Lịch cá nhân chỉ tạo khi có dữ liệu thực hoặc có nhãn tạm thời. Phiên ngắn giúp bắt đầu; khối lượng IELTS đầy đủ cần kế hoạch riêng.
- AI production và nhắc nền chỉ bật khi task tương ứng có bằng chứng đủ; không để UI mô tả chức năng chưa đạt như đã hoạt động.

### Beta nền tảng có khách hàng — G2

Nghiên cứu phân khúc, duyệt học liệu độc lập, hoàn thiện một cụm tình huống đời sống, sửa UX từ quan sát, hỗ trợ và quyền riêng có đường xử lý. Dự kiến thử nhóm 10–20 người trong 2–4 tuần sau G1/G0; số này là phạm vi thử đề xuất, không phải khách hàng đã có hoặc thời hạn phát hành.

### Bản thương mại — G4

Chỉ bán quyền lợi đã kiểm chứng, có giá/điều khoản, quyền gói phía server, giao dịch/đối soát/hoàn tiền, ngân sách và hỗ trợ. Nếu bán AI/IELTS, bắt buộc qua G3. Web PWA là kênh đầu tiên; native và B2B có quyết định đầu tư riêng.

## 4. Ưu tiên và phạm vi để sau

| Thứ tự | Kết quả cần đạt                                        | Task dẫn đường                                            |
| ------ | ------------------------------------------------------ | --------------------------------------------------------- |
| 1      | Biết chính xác bản đang có và cloud đang ở đâu         | COM-GOV-002, DEPLOY-002/COM-OPS-001                       |
| 2      | Tin cậy khi học, lưu, đồng bộ và khôi phục             | COM-QA-001/002, COM-ENG-002, COM-OPS-003, COM-SEC-001/002 |
| 3      | Chủ dự án sử dụng theo lịch thực và có nhật ký         | COM-LEARN-001/005, COM-REL-001                            |
| 4      | Chọn đúng khách hàng và cải thiện trải nghiệm/học liệu | COM-RES-001/002/003, COM-UX, COM-CONT                     |
| 5      | Kiểm định AI/IELTS và tính khả thi bán hàng            | COM-AI, COM-IELTS, COM-BIZ, COM-PAY, COM-REL-004          |

Chưa làm ở G1: mạng xã hội, bảng xếp hạng công khai, cuộn vô hạn, thanh toán, lớp học/B2B, native, CMS riêng, microservice hoặc chương trình IELTS sáu tháng hoàn chỉnh. Không đặt mục tiêu viết lại code/UI toàn bộ khi chưa có bằng chứng cần thay.

## 5. Tiêu chí thành công và bằng chứng

| Mục tiêu                 | Cách kiểm tra                                                                                                    | Điều chưa thể kết luận                                                  |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Bắt đầu/tiếp tục dễ hiểu | Người dùng hoàn tất phiên đầy đủ, mở lại tiếp tục đúng bài; ghi điểm cần trợ giúp                                | Không suy từ lượt mở app hoặc khởi động hai phút                        |
| Dữ liệu đáng tin cậy     | Ca lỗi mạng/response mất/gửi trùng/đổi chủ và khôi phục đạt; không còn lỗi mất/lộ dữ liệu đã tái hiện chưa xử lý | Healthcheck thành công không chứng minh toàn bộ Auth/sync/quyền         |
| Học theo lịch thực       | Nhật ký 14 ngày ghi buổi dự định/thực hiện/đổi lịch, lỗi và điều dùng được                                       | Không yêu cầu streak 14/14 hoặc bịa số phút/ngày                        |
| Nhớ và sử dụng lại       | Tự nhớ sau khoảng nghỉ, bài sản sinh mới có rubric; báo mức hỗ trợ                                               | Tự nhận xét đời sống không đồng nghĩa giáo viên đánh giá hoặc tăng band |
| Có cơ sở thương mại      | Nhu cầu trả tiền, chi phí biến đổi và phản hồi cohort thực                                                       | Chưa chốt giá, doanh thu, số MAU, LTV hoặc ngày ra mắt                  |

Các định nghĩa đo chi tiết theo mục 8 của TASKS_COMMERCIAL. Ngưỡng thành công beta và cách phân tích phải chốt trước tuyển người; cỡ mẫu nhỏ phải ghi giới hạn.

## 6. Nguồn lực và ngân sách làm việc

| Nguồn lực                                          | Hiện có/xác nhận                                                                    | Cách làm trong lúc chưa chốt                                                                                   |
| -------------------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Chủ sản phẩm/người dùng đầu tiên                   | Chủ dự án                                                                           | Cung cấp mục tiêu cá nhân và kiểm tra thao tác trên thiết bị của mình khi tới task                             |
| Thực hiện trong workspace                          | Trợ lý lập tài liệu, chỉnh code, chạy kiểm tra theo phạm vi được giao               | Thực hiện tuần tự theo ưu tiên, không tự giả có một phòng dev hoặc người review độc lập                        |
| Giáo viên, UX research, QA thiết bị, Legal/Finance | Chưa bố trí người cụ thể hoặc số giờ cam kết                                        | Chuẩn bị checklist, mẫu và code độc lập; giữ cổng cần đối chiếu chuyên môn chưa đạt                            |
| Năng lực sprint                                    | Chưa có ngày công thật/thành viên được chốt                                         | S0 làm charter + kiểm kê + xác minh cloud; không cam kết mọi task S0 xong trong hai tuần                       |
| Cloud hiện có                                      | Vercel, Render, Neon theo repository; tài khoản và gói thực tế do chủ dự án quản lý | Dùng cấu hình hiện có, xác minh đọc công khai; không tự mua/nâng gói                                           |
| Ngân sách                                          | Người dùng muốn đầu tư nhiều để làm tốt nhưng chưa nêu số tiền/tiền tệ/tháng        | Trần chi phát sinh mới do tự động hóa: 0 cho đến khi có mức cụ thể; đây không phải tổng hóa đơn cloud hiện tại |
| AI live                                            | Chưa có mức trần ngày/tháng hoặc provider được chốt                                 | Giữ AI tắt/0; chuẩn bị eval, đo fixture và mô hình chi phí trước dùng trả phí                                  |

Khoảng ngân sách tiền tệ của dự án hiện là **chưa xác định**, không tự thay bằng con số giả hoặc “không giới hạn”. COM-BIZ-001 sẽ đưa ba kịch bản chi phí có nguồn giá hiện hành; chủ dự án chốt trần tổng/tháng, trần AI/ngày và mức cảnh báo trước khi bật chi phí mới.

## 7. Giả định và quyết định cần bằng chứng

| Mã    | Nội dung                                                | Trạng thái/nguồn                                                                      | Task làm rõ                  |
| ----- | ------------------------------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------- |
| CH-01 | Chủ dự án là người học đầu tiên, ưu tiên dùng hằng ngày | Đã yêu cầu trong hội thoại                                                            | COM-LEARN-001                |
| CH-02 | B2C người Việt trưởng thành là thị trường mở đầu        | Giả thuyết DEC-024                                                                    | COM-RES-001/002              |
| CH-03 | Đầu vào, lịch học và thiết bị                           | Chưa cung cấp; phản hồi “ok” không chứa các dữ liệu này                               | COM-LEARN-001/002            |
| CH-04 | IELTS 6.5/sáu tháng                                     | Mục tiêu tham khảo trong PRODUCT, chưa phải điểm đầu vào hoặc ngày thi hiện tại       | COM-LEARN-001, COM-IELTS-001 |
| CH-05 | Khả năng đầu tư và mức chi                              | Muốn chất lượng cao, mức chi cụ thể chưa chốt                                         | COM-BIZ-001                  |
| CH-06 | Hệ thống cloud hoạt động đầy đủ                         | Health/readiness công khai thành công ngày 2026-09-11; OTP/sync/quyền chưa nghiệm thu | COM-OPS-001                  |
| CH-07 | Có nhân sự giáo viên/reviewer độc lập                   | Chưa có bằng chứng                                                                    | COM-CONT-001, COM-SEC-002    |

## 8. Điều kiện xem lại và bàn giao

Xem lại charter khi có dữ liệu nghiên cứu, lịch cá nhân, ngân sách hoặc trở ngại kỹ thuật làm đổi phạm vi. Mỗi thay đổi ghi lý do, bằng chứng, tác động task/cổng/chi phí và cập nhật DECISIONS nếu đổi hướng.

Đầu ra COM-GOV-001 là charter dùng để triển khai với giả định minh bạch, không phải chấp thuận ngân sách hoặc nghiệm thu G0. Người thực hiện trong lượt này: trợ lý; chủ sản phẩm: chủ dự án; chưa có reviewer độc lập. Kiểm tra tài liệu theo liên kết, tính nhất quán và diff; COM-GOV-002 tiếp tục bằng chứng kỹ thuật thực tế.
