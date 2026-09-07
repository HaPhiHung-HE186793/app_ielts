# Trạng thái bàn giao hiện tại

Cập nhật: 2026-09-07, múi giờ Asia/Saigon.

## Đang ở đâu

**ADAPT-001 DONE; DEPLOY-001 READY để chuẩn bị triển khai web HTTPS.** Bộ gợi ý bài chạy offline bằng quy tắc thử nghiệm. AI-001 vẫn IN_PROGRESS, thiếu key/ngân sách được xác nhận và đối chiếu provider thật; không tự bật gọi trả phí hoặc coi beta hoàn chỉnh.

- Hôm nay chọn bình thường/mệt/khó/quay lại, thời gian và xem lý do từng bài. Phiên dài ưu tiên tối đa ba câu ôn, giữ bài dở, một bài cần hỗ trợ rồi bài mới theo tuần/kiến thức trước và sở thích. Nhịp nhẹ giới hạn một bài và một hoặc hai câu ôn, không dồn toàn bộ thẻ cũ.
- “Khó quá” chuyển gợi ý sang hai phút với câu nền tảng liên quan, không thay draft. Sau bảy ngày không có hoạt động ghi nhận, mời quay lại nhẹ; người học được đổi lựa chọn. Kết quả bài/truy hồi chưa đủ chẩn đoán riêng nghe/đọc/nói/viết hoặc band.
- Plan/lịch sử lưu nhịp và lý do tùy chọn, vẫn StudyState 3/đọc 1/2/3, không migration/dependency mới. Không tự đổi phiên đang học khi có kết quả mới/reload/đổi ngày; thay phiên có xác nhận và giữ draft. Các máy nên cập nhật để giữ metadata tùy chọn qua sync.
- Giữ 28 bài + bốn kiểm tra/57 WAV (~8,92 MB), học liệu thử nghiệm chưa giáo viên độc lập duyệt. Auth/OTP, sync/outbox/xung đột, nhắc học và nền tảng API AI giữ phạm vi mốc trước.

## Dùng ngay

1. Docker → npm run db:start → npm run db:migrate → npm run preview:local. Mở http://127.0.0.1:4175/#/today, chọn nhịp và thời gian. Preview đang để chạy Node ẩn; kiểm tra cổng trước mở thêm.
2. Vào #/install để tải gói trước khi học offline. Khám phá vẫn chọn bài tự do. Mỗi origin có kho riêng, dùng sync/JSON khi chuyển từ 5173 sang 4175. Dev không đăng ký worker.
3. OTP ở http://127.0.0.1:54324, không gửi ra ngoài. Máy nhắc dùng npm run reminders:local, đăng nhập/chọn lịch tự nguyện. Máy AI 8787 vẫn gọi thật tắt; cần nạp lại server khi tới bước đối chiếu thật. Không thay cấu hình AI/nhắc trong task này.

Log/ảnh/trace thử nằm trong .local (không commit). Chưa có hosted/SMTP/HTTPS công khai hoặc thiết bị iOS/Android thật.

## File quan trọng

- [ADAPTATION.md](ADAPTATION.md): cách dùng, giới hạn từng nhịp, thuật toán, metadata và giới hạn đánh giá; DEC-019 ghi quyết định.
- src/content/prerequisites.ts: đồ thị bài trước của 32 đơn vị, tách khỏi nội dung/âm thanh.
- src/domain/adaptation.ts và planner.ts: tín hiệu từ kết quả, bài sẵn sàng, sở thích, trần số hoạt động; schema.ts thêm metadata tùy chọn.
- features/today/SessionChoices.tsx, SessionPage.tsx, Today.tsx và styles/adaptation.css: chọn nhịp, lý do, tiếp tục/thay phiên. Kho được dựng lại theo chủ tài khoản như trước.
- domain/adaptation.test.ts, tests/adaptation.spec.ts, tests/auth/sync.spec.ts: thứ tự/tải/backup/merge/UI/offline/two-device; tests/progress.spec.ts và tests/auth/reminders.spec.ts sửa điều kiện chờ không ổn định của test cũ.

## Kiểm tra

- Lint/typecheck/build và **125/125 unit** đạt. Đã chạy toàn bộ 80 ca khách/50 ca Auth, phát hiện hai test phụ thuộc thời gian thực; sửa test đồng hồ và chờ dọn subscription, giữ nguyên code tính giờ/nhắc.
- Sau sửa, chạy lại **16/16 ca thích ứng/tiến bộ** và **18/18 ca nhắc/đồng bộ** đạt, gồm hai ca từng lỗi. Các ca hồi quy còn lại đạt ở lượt toàn bộ; không trình bày hai lượt đầu 79/80 và 49/50 là đã đạt hết ngay lần đầu. Chi tiết [SESSION_LOG.md](SESSION_LOG.md), phạm vi [TESTING.md](TESTING.md).
- Bộ thích ứng: thứ tự qua mọi điểm dừng danh mục, quan hệ không vòng, tín hiệu mới/có hỗ trợ, sở thích không bỏ bài trước, trần nhịp/ngân sách, gap, backup và merge. UI hai kích thước giữ draft khi “khó” offline, giới hạn 32 thẻ cũ, hủy/thay phiên và lưu lý do. Auth/DB thật giữ nhịp và lý do trên hai browser context.
- Axe A/AA không báo vi phạm vùng quét, không tràn ngang 360px/desktop, đã xem ảnh. Test không thay thiết bị thật hoặc đo hiệu quả học. Bundle khách ~716 kB minified/208 kB gzip, còn cảnh báo chia route. Không gọi AI thật.
- Prettier/diff, 19 Markdown/100 liên kết/25 task và quét secret build/25 file staged đạt. Preview 4175 code cuối chọn nhịp/lưu/reload đạt; smoke Auth/proxy xác nhận AI tắt và không lượt trả phí, dữ liệu thử đã dọn. Commit/remote xác minh bằng Git ở bàn giao cuối.

## Tiếp theo và giới hạn

**DEPLOY-001**: chuẩn bị artifact/cấu hình web, môi trường khách/tài khoản/API, hướng dẫn HTTPS/cache/cập nhật/quay lui và thông tin còn thiếu cho phát hành. Tách khỏi BETA-001 để tiến hành phần độc lập; chưa có deployment thật. Xem [TASKS.md](TASKS.md).

AI-001 chỉ đối chiếu thật sau cấu hình máy chủ/ngân sách và rubric người duyệt. Chưa có phản hồi AI đã kiểm chứng, mic, đánh giá đầu vào hoặc chương trình IELTS sáu tháng. Nhịp/đồ thị/threshold là quy tắc thử nghiệm cần dữ liệu người học. Lưu local chưa mã hóa; cache offline không là sao lưu, không background sync khi OS đóng app; chưa benchmark lịch sử nhiều tháng. Giữ giới hạn trong BACKEND/SYNC/OFFLINE/NOTIFICATIONS/AI.
