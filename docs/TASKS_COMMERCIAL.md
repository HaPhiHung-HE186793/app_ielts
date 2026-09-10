# Kế hoạch task tổng thể — Mỗi ngày: từ nhu cầu khách hàng đến sản phẩm thương mại

Cập nhật: 2026-09-11 · Chủ sản phẩm: chủ dự án · Trạng thái: kế hoạch triển khai, chưa phải chứng nhận sẵn sàng thương mại.

**Mục tiêu:** xây một ứng dụng giúp chủ dự án và người Việt học tiếng Anh dùng được trong đời sống, luyện đều hằng ngày, tiến tới IELTS có đánh giá phù hợp; sau đó bán một dịch vụ có chất lượng học liệu, dữ liệu an toàn, chi phí kiểm soát được và hỗ trợ khách hàng thực tế.

Tài liệu này là backlog tổng thể cho giai đoạn phát triển tiếp theo. “Chuyên nghiệp” được thể hiện bằng bằng chứng về giá trị học tập, chất lượng và khả năng vận hành; quy mô đội ngũ, số công cụ hay số tính năng không tự chứng minh chất lượng.

## 1. Cách dùng và nguồn trạng thái duy nhất

- [TASKS.md](TASKS.md) giữ task kỹ thuật cũ và lịch sử hoàn thành; không đổi ID hoặc làm lại chức năng chỉ để khớp roadmap mới.
- File này quản lý duy nhất các ID `COM-*`: nghiên cứu, cải tiến, kiểm định và thương mại hóa. TASKS chỉ dẫn sang đây, không sao chép trạng thái COM.
- [STATUS.md](STATUS.md) giữ ảnh chụp hiện tại và task tiếp theo; [SESSION_LOG.md](SESSION_LOG.md) giữ kết quả từng session. [PRODUCT.md](PRODUCT.md) và [DECISIONS.md](DECISIONS.md) giữ phạm vi và quyết định.
- Bản nháp `docs/ROADMAP_COMMERCIAL.md` đã có trong working tree trước lượt này được giữ nguyên. Khi chọn task thương mại, dùng file này; các mốc “Cloud Live/DONE”, mức giá, hạn mức và lịch quý trong bản nháp chưa phải quyết định hay bằng chứng nghiệm thu.
- Mỗi ticket trước triển khai phải có người nhận tên cụ thể, đầu ra và ca nghiệm thu. Vai trò trong bảng là vị trí cần đảm nhiệm, không khẳng định dự án đã có nhân sự đó.
- Kế hoạch cho phép nhiều bộ phận làm phần độc lập, nhưng không phải chỉ dẫn tự tạo agent, thuê nhân sự, gửi lời mời, mua dịch vụ hoặc phát hành. Thực thi theo phạm vi được người dùng giao ở từng session.

### Mục lục

1. Cách dùng và nguồn trạng thái duy nhất.
2. Hiện trạng có bằng chứng và khoảng trống.
3. Khách hàng, giá trị và hành trình sản phẩm.
4. Bộ phận, trách nhiệm và bàn giao.
5. Quy tắc quản trị task và nghiệm thu.
6. Các cổng phát hành.
7. Backlog theo bộ phận.
8. Chỉ số, chất lượng và kinh tế sản phẩm.
9. Kế hoạch thực hiện trước mắt.
10. Rủi ro và quyết định còn mở.
11. Mẫu ticket, sprint và hồ sơ phát hành.
12. Tài liệu chuẩn để đối chiếu khi triển khai.

## 2. Hiện trạng có bằng chứng và khoảng trống

Snapshot khi lập kế hoạch ở dưới được giữ theo ngày; kết quả mới hơn: [charter COM-GOV-001](PRODUCT_CHARTER.md) và [kiểm kê COM-GOV-002](BASELINE_AUDIT.md). Cloud hiện trả health/readiness thành công, OTP/sync chưa nghiệm thu. COM-GOV-001/002 DONE phần đầu ra, COM-OPS-002 READY; COM-OPS-001 IN_PROGRESS.

Đối chiếu đầu lượt với branch `main`, HEAD `85b4421`, code và tài liệu đang có. Trong lúc soạn, HEAD chuyển thành `d0a34d8` bởi tiến trình khác, gồm CI/Sentry và bản nháp roadmap; lượt lập kế hoạch này không tạo commit đó và chưa nghiệm thu code mới trong commit. Không chạy lại kiểm thử runtime hoặc truy cập cloud trong task lập kế hoạch này; kết quả test cũ được ghi rõ là lịch sử.

| Hạng mục                                 | Bằng chứng trong repository                                                                                    | Giới hạn phải giải quyết                                                                                                      |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Vòng học, tiếp tục bài, lịch ôn, tiến bộ | `src/features/today/`, `src/features/lessons/`, `src/features/review/`, `src/domain/`, `src/data/`             | Cần quan sát sử dụng hằng ngày và đo khả năng nhớ/sử dụng; không suy hiệu quả từ lượt bấm                                     |
| Học liệu nền tảng                        | `src/content/lessons.ts`, `foundation.ts`, CURRICULUM và CONTENT_REVIEW: 28 bài + 4 kiểm tra, 57 audio         | Học liệu thử nghiệm, chưa có giáo viên độc lập duyệt và chưa đủ chương trình IELTS hoàn chỉnh                                 |
| Đồng bộ, offline, tài khoản              | Adapter Neon, migration và test ở `server/neon/`, `db/neon/`, `src/services/`, `tests/`                        | Local/fixture không thay kiểm tra OTP, quyền, đồng bộ trên cloud và điện thoại thật                                           |
| Triển khai                               | STATUS ghi frontend Vercel live; DEPLOY-002 vẫn IN_PROGRESS                                                    | Chưa có hồ sơ hoàn chỉnh về Render/Neon/Auth, migration, runtime grants, OTP và sync cloud; không đánh dấu toàn hệ thống live |
| AI                                       | `server/ai/` có adapter/thử nghiệm; `server/neon/config.ts` yêu cầu AI tắt, `/api/ai/feedback` trả unavailable | Chưa có AI Neon production được đối chiếu, ngân sách thực, luồng nói/viết hoàn chỉnh                                          |
| Nhắc học                                 | Có UI/schema và đường kiểm thử local                                                                           | Worker Neon production và hành vi hệ điều hành thật chưa hoàn tất                                                             |
| CI và quan sát lỗi                       | Có `.github/workflows/`, `src/services/sentry.ts` và thay đổi dependency chưa commit                           | Chưa nghiệm thu pipeline, tích hợp, lọc dữ liệu hay cảnh báo; kế thừa và kiểm tra thay vì mặc định làm lại                    |
| Kiểm thử                                 | Có unit, browser, release, Neon và Supabase regression; lịch sử ghi 176 unit ở mốc gần đây                     | Không dùng số ca lịch sử để tuyên bố HEAD/working tree hiện tại đạt                                                           |
| Kinh doanh                               | Chưa thấy luồng thanh toán/quyền lợi/gia hạn trong code đã đối chiếu                                           | Cần xác thực nhu cầu trả tiền, chi phí, pháp lý theo thị trường, support và nghiệp vụ giao dịch                               |

Đầu lượt, working tree đã có thay đổi IDE, STATUS, SESSION_LOG, package/lockfile và các file nháp trên; một phần đã vào commit ngoài lượt này trong lúc làm việc. Giữ chúng và lịch sử mới; không dọn Git hoặc ghi đè để trở lại trạng thái cũ.

## 3. Khách hàng, giá trị và hành trình sản phẩm

### Phân khúc khởi đầu

- Người dùng đầu tiên: chủ dự án, cần học dùng được trong đời sống và luyện hằng ngày. Mức đầu vào, lịch rảnh, loại thi và ngày thi phải lấy từ thông tin thực.
- Giả thuyết thị trường đầu tiên: người Việt trưởng thành, bận học/làm, cần xây nền tảng và hướng tới IELTS. Đây là giả thuyết để nghiên cứu, chưa phải thị trường đã xác nhận.
- Chưa chủ động tuyển trẻ em hoặc lớp học tổ chức trước khi có yêu cầu và quy trình dữ liệu/quyền riêng. Hướng B2C được kiểm định trước, B2B/native xét sau bằng bằng chứng.
- Lời hứa cần kiểm chứng: mở app biết nên học gì, hoàn thành hoạt động vừa sức, hiểu lỗi, gặp lại kiến thức đúng lúc và dùng được trong tình huống mới.

### Hành trình xuyên suốt

| Chặng                   | Người học/khách hàng cần làm được                                                | Bằng chứng nghiệm thu                                                          | Nhóm task                |
| ----------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------ |
| Biết đến và cân nhắc    | Hiểu app dành cho ai, xem bài mẫu, hiểu giới hạn và giá khi có bán               | Trang giới thiệu khớp tính năng live, phản hồi nghiên cứu                      | COM-RES, COM-GROW        |
| Bắt đầu                 | Học thử, khai báo mục tiêu có thể bỏ qua, nhận hướng đi vừa sức                  | Usability test lần đầu, activation theo định nghĩa ở mục 8                     | COM-UX, COM-LEARN        |
| Học hôm nay             | Tiếp tục bài dở, chọn khối lượng, học → tự nhớ → dùng → phản hồi → ôn            | Hoàn thành và mở lại không mất dữ liệu; có hoạt động mới chuyển giao kiến thức | COM-LEARN, COM-QA        |
| Dùng ngoài đời          | Tập gọi món, hẹn lịch, hỏi đường, trao đổi công việc rồi thử tình huống tương tự | Bài sản sinh tự viết/nói và rubric phù hợp; tự báo cáo ngoài đời có nhãn       | COM-CONT, COM-LEARN      |
| Vượt khó và quay lại    | Giảm tải, chữa lỗi, trở lại sau nghỉ, không bị dồn bài nợ                        | Kịch bản gián đoạn và phỏng vấn sau sử dụng                                    | COM-LEARN, COM-DATA      |
| Luyện IELTS             | Chọn nhánh thi, học dạng bài, làm bài có thời gian, xem phản hồi có căn cứ       | Học liệu có quyền, rubric và đánh giá của người có chuyên môn                  | COM-IELTS, COM-AI        |
| Trả tiền và được hỗ trợ | Biết quyền lợi, mua, nhận đúng quyền, hủy/gia hạn/hoàn tiền theo chính sách      | Giao dịch đối soát, thử hỗ trợ và đường hủy                                    | COM-BIZ, COM-PAY, COM-CS |
| Kết thúc hoặc rời đi    | Xuất dữ liệu, hủy dịch vụ, yêu cầu xóa và biết giới hạn bản sao lưu              | Ca xuất/xóa/thu hồi quyền thành công                                           | COM-PRIV, COM-PAY        |

Không biến phiên 2–5 phút thành lời hứa đủ luyện IELTS sáu tháng. Khối lượng đầy đủ được điều chỉnh theo đầu vào, lịch thực và đánh giá; không gán band từ streak, phút học hay vài câu hỏi.

## 4. Bộ phận, trách nhiệm và bàn giao

Một người có thể kiêm nhiều vai trò ở giai đoạn đầu. Các đánh giá cần độc lập, như quyền dữ liệu, thanh toán và chất lượng học thuật, phải ghi rõ người đối chiếu; tự review hoặc AI review không được ghi là giáo viên/kiểm toán độc lập.

| Vai trò                         | Chịu trách nhiệm                                            | Đầu ra bàn giao                                          | Người nghiệm thu chính   |
| ------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------- | ------------------------ |
| PO — Chủ sản phẩm               | Mục tiêu, ngân sách, thị trường, quyết định mở bán          | Phạm vi từng mốc, ưu tiên, quyết định tiếp tục/dừng      | Chủ dự án                |
| PM — Quản lý sản phẩm           | PRD, backlog, phụ thuộc và giá trị khách hàng               | Ticket sẵn sàng, kế hoạch thử nghiệm, release brief      | PO                       |
| UXR — Nghiên cứu khách hàng     | Phỏng vấn, quan sát, phân khúc, willingness-to-pay          | Insight có nguồn ẩn danh, mức chắc chắn, cơ hội          | PM                       |
| UX — Thiết kế/UX writing        | Luồng, trạng thái, design system, tiếng Việt, accessibility | Prototype, tokens, nội dung giao diện và test usability  | PM + QA                  |
| EDU — Chuyên môn giáo dục/IELTS | Mục tiêu học, curriculum, rubric, duyệt học liệu và AI      | Nội dung được duyệt, bộ đánh giá, giới hạn sử dụng       | PO + giáo viên đối chiếu |
| FE — Frontend                   | React/PWA, lưu nháp, tương tác, accessibility               | Tính năng chạy được và bằng chứng trên trình duyệt       | TL + QA                  |
| BE — Backend                    | Auth, API, SQL, quyền, sync, media và giao dịch             | Contract, migration, xử lý lỗi và test quyền             | TL + SEC + QA            |
| AI — Kỹ thuật AI                | Tích hợp provider, eval, chi phí và theo dõi phiên bản      | Báo cáo chất lượng/chi phí, fallback, kill switch        | EDU + BE                 |
| TL — Trưởng kỹ thuật            | Kiến trúc, review, maintainability, rủi ro thay đổi         | ADR, contract và phương án nâng cấp/rollback             | PO + QA                  |
| QA — Kiểm thử                   | Test strategy, thiết bị, hồi quy và hồ sơ nghiệm thu        | Test report, defect triage, ý kiến phát hành             | PM                       |
| SRE — Hạ tầng/vận hành          | CI/CD, triển khai, SLO, backup, sự cố và chi phí cloud      | Runbook, dashboard, cảnh báo và diễn tập                 | TL                       |
| SEC — Bảo mật/quyền riêng       | Threat model, kiểm tra quyền, secret và dữ liệu cá nhân     | Ma trận kiểm soát, bằng chứng và rủi ro còn lại          | PO + TL                  |
| DATA — Phân tích dữ liệu        | Định nghĩa event, cohort, chất lượng số đo                  | Dashboard có mẫu số, pipeline và phân tích               | PM + EDU                 |
| BIZ — Kinh doanh/Finance        | Giá, dòng tiền, lợi nhuận đóng góp và đối soát              | Mô hình chi phí, chính sách gói và sổ đối soát           | PO                       |
| LEGAL — Pháp lý chuyên môn      | Thị trường phục vụ, hợp đồng, quyền nội dung/dữ liệu        | Rà soát theo phạm vi áp dụng và chính sách được duyệt    | PO                       |
| GROW — Marketing/tăng trưởng    | Định vị, nội dung giới thiệu, kênh và thử nghiệm thu hút    | Campaign brief, trang công khai, báo cáo chi phí/kết quả | PM + BIZ                 |
| CS — Hỗ trợ/Customer success    | Hướng dẫn, phản hồi, sự cố khách hàng, hủy/hoàn tiền        | Kho trợ giúp, ticket, phân loại và báo cáo vấn đề        | PM + BIZ                 |

Luồng bàn giao: UXR đưa vấn đề có bằng chứng → PM chốt kết quả cần đạt → UX/EDU thiết kế trải nghiệm và bài học → TL/FE/BE/AI thống nhất cách làm → QA/SEC kiểm tra → SRE phát hành trong phạm vi cho phép → CS/DATA đưa kết quả sử dụng trở lại backlog. Một cổng phát hành cần ý kiến của các vai trò liên quan, PO chịu trách nhiệm quyết định cuối.

## 5. Quy tắc quản trị task và nghiệm thu

### Trạng thái, ưu tiên và kích thước

- Dùng `TODO`, `READY`, `IN_PROGRESS`, `BLOCKED`, `DONE` như TASKS. `BLOCKED` phải có nguyên nhân, người xử lý, ngày kiểm tra lại và phần độc lập còn làm được.
- `P0`: chặn an toàn dữ liệu, dùng cá nhân đáng tin cậy hoặc cổng phát hành gần nhất. `P1`: cần cho mốc đã chọn. `P2`: tối ưu sau khi mốc trước có bằng chứng. Không biến mọi ý tưởng thành P0.
- `S`: khoảng 1–2 ngày công; `M`: 3–5; `L`: 6–10; `XL`: cần tách thành ticket trước khi ước lượng. Đây là ước lượng thô, không phải thời hạn; chưa bao gồm thời gian chờ tuyển mẫu, giáo viên, dịch vụ hoặc pháp lý.
- Cột “Phụ thuộc” là điều kiện cứng trước khi hoàn thành; phần khảo sát/thiết kế độc lập có thể chuẩn bị sớm. Phụ thuộc task DONE local không tự xác nhận đạt cloud.
- Mỗi người tối đa một task chính đang làm; PM giữ ít việc dở và ưu tiên đường găng. Không bắt đầu toàn bộ backlog cùng lúc.
- Duy trì một bảng quyết định: đề xuất → bằng chứng → lựa chọn → lý do → tác động scope/chi phí → task liên quan. Không đặt giá, ngày ra mắt hoặc SLO từ mong muốn rồi báo như đã đo được.

### Điều kiện bắt đầu — Definition of Ready

Có vấn đề và người dùng mục tiêu; tiêu chí nghiệm thu kiểm tra được; phạm vi ngoài task; phụ thuộc và quyền truy cập cần thiết; người thực hiện/nghiệm thu; dữ liệu thử hợp lệ; ước lượng và rủi ro; kế hoạch đo hoặc test phù hợp. Task XL phải tách. Chưa có nhân sự/dịch vụ không ngăn việc chuẩn bị tài liệu/code độc lập.

### Điều kiện hoàn thành — Definition of Done

1. Đầu ra đáp ứng tiêu chí của task, có bằng chứng kèm môi trường/ngày/phiên bản và người kiểm tra; không đánh dấu chỉ vì checkbox được tích.
2. Code được review, chạy lint/typecheck/build và test phù hợp với thay đổi; luồng rủi ro có ca lỗi, retry, đồng thời và quyền. Nếu thiếu reviewer độc lập, ghi rõ để cổng có yêu cầu độc lập chưa được mở.
3. UI có loading/empty/error/offline/success khi áp dụng, kiểm tra bàn phím và màn hình liên quan. QA điện thoại thật bắt buộc ở cổng có trải nghiệm thiết bị, không áp máy móc cho task tài liệu.
4. Học liệu có nguồn/quyền, version và người duyệt; AI có eval thay vì vài ví dụ thuận lợi. Dữ liệu demo/fixture được tách và có nhãn.
5. Có cách tắt hoặc khôi phục khi thay đổi dữ liệu/vận hành; không lộ bí mật hoặc dữ liệu cá nhân trong code, log và artifact.
6. Cập nhật file task sở hữu ID, STATUS, SESSION_LOG và README khi mốc/hướng dẫn đổi; quyết định phạm vi cập nhật PRODUCT/DECISIONS.

**DONE của ticket khác với RELEASED của phiên bản.** Ticket có thể xong ở local/staging nếu đó là phạm vi nghiệm thu; production phải qua cổng riêng. Không yêu cầu deploy mọi sửa nhỏ để được DONE, không dùng tỷ lệ coverage chung thay kiểm thử logic rủi ro.

## 6. Các cổng phát hành

Các cổng sau đều **chưa đạt** tại ngày lập. Thời gian đo và cỡ mẫu là kế hoạch đề xuất để PM/PO chốt trước thử nghiệm, không phải kết quả hoặc dự báo tăng trưởng. G0 có thể làm cùng phần kỹ thuật của G1; phát hành công khai cần đủ điều kiện của cổng tương ứng.

| Cổng                      | Kết quả được phép công bố                        | Điều kiện ra cổng                                                                                                                               | Chịu trách nhiệm |
| ------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| G0 — Hiểu vấn đề          | Phân khúc và phạm vi bản đầu có căn cứ           | COM-GOV-001/002, COM-RES-001/002/003 hoàn tất; có phản chứng, lựa chọn vấn đề ưu tiên và ngân sách dự kiến                                      | PO + PM          |
| G1 — Dùng cá nhân tin cậy | Chủ dự án dùng trên thiết bị thật, biết giới hạn | COM-REL-001 hoàn tất; cloud OTP/sync, khôi phục, thiết bị và 14 ngày nhật ký được kiểm tra; AI/nhắc chưa đạt phải tắt và hiển thị đúng          | QA + PO          |
| G2 — Beta kín nền tảng    | Mời nhóm nhỏ thử giá trị học hằng ngày           | COM-REL-002 hoàn tất; G0/G1, học liệu duyệt, quyền riêng, support và đo lường sẵn sàng. Có thể chưa có AI; phải mô tả chính xác phạm vi         | PM + EDU + SEC   |
| G3 — Beta IELTS/AI        | Công bố các khả năng AI/IELTS đã kiểm định       | COM-REL-003 hoàn tất; giáo viên đối chiếu, provider/budget thật, vòng sửa bài và nhánh thi được chọn. Không có nhãn chứng nhận IELTS chính thức | EDU + QA         |
| G4 — Bán thử có giới hạn  | Thu phí cho gói quyền lợi cụ thể                 | COM-REL-004 hoàn tất; G2, và G3 nếu bán AI/IELTS; pháp lý, giao dịch/hoàn tiền, quyền gói, chi phí, restore và trực hỗ trợ đủ bằng chứng        | PO + BIZ + SEC   |
| G5 — Mở rộng              | Tăng lượng khách theo năng lực đã đo             | COM-REL-005 hoàn tất; cohort trả tiền có dữ liệu, chất lượng học không giảm, lợi nhuận đóng góp và tải/sự cố trong giới hạn                     | PO + BIZ + SRE   |

**Không phát hành khi:** còn lỗi mất/lộ dữ liệu chưa kiểm soát, thanh toán sai quyền/sai tiền, secret còn hiệu lực đã lộ chưa xử lý, restore bắt buộc chưa thử hoặc quảng cáo vượt khả năng thực. Lỗi thẩm mỹ có thể đưa vào known issues với mức ảnh hưởng và lịch sửa. Sự cố nghiêm trọng mở lại cổng liên quan dù từng đạt trước đó.

G2 là beta nền tảng mới, tách khỏi BETA-001 cũ vốn bao gồm AI nói/viết. Không đổi BETA-001 thành DONE khi chỉ đạt G2.

## 7. Backlog theo bộ phận

Mỗi hàng là một work package có đầu ra và nghiệm thu; khi chọn làm, tách phần L/XL theo mẫu mục 11. “R/V” = vai trò thực hiện chính / vai trò nghiệm thu. Tất cả đầu ra bên dưới là cần tạo, trừ tài liệu hiện có được yêu cầu kiểm tra/cải tiến.

### A. Quản trị, khách hàng và xác thực sản phẩm

| ID          | Trạng thái | Ưu tiên / cỡ | R/V       | Phụ thuộc   | Kết quả và tiêu chí nghiệm thu                                                                                                                                                                                                                           |
| ----------- | ---------- | ------------ | --------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| COM-GOV-001 | DONE       | P0 / S       | PM / PO   | Không       | Lập product charter: vấn đề, khách hàng đầu tiên, mục tiêu dùng cá nhân và thương mại, phạm vi bản đầu, điều không làm, năng lực đội và khoảng ngân sách. Có danh sách giả định và quyết định cần bằng chứng, không tự điền band/ngày thi của chủ dự án. |
| COM-GOV-002 | DONE       | P0 / S       | PM / TL   | COM-GOV-001 | Lập bản kiểm kê theo code/local/staging/cloud; ánh xạ task cũ, bản nháp roadmap, CI/Sentry đang dở. Mỗi tuyên bố “đã có” gắn file hoặc test/deployment evidence; sửa mâu thuẫn tài liệu, không tự đóng task cloud.                                       |
| COM-RES-001 | TODO       | P1 / M       | UXR / PM  | COM-GOV-001 | Kịch bản phỏng vấn và nhật ký chủ dự án; dự kiến 8–12 người trưởng thành thuộc hai nhóm sinh viên/người đi làm. Có cách tuyển/đồng ý tham gia, lưu dữ liệu riêng, ghi mẫu thực tế và sai lệch; không bịa phỏng vấn khi chưa có người tham gia.           |
| COM-RES-002 | TODO       | P1 / M       | UXR / PM  | COM-RES-001 | Tổng hợp việc cần hoàn thành, hoàn cảnh bỏ học, công cụ đang dùng và rào cản trả tiền; đối chiếu 4–6 lựa chọn thay thế bằng nguồn/ngày tra cứu. Chọn một phân khúc đầu, nêu cơ hội và bằng chứng phản bác; không mặc định cần ba persona theo band.      |
| COM-RES-003 | TODO       | P1 / M       | PM / PO   | COM-RES-002 | Chốt PRD bản dùng hằng ngày và beta: journey, user stories, phạm vi, outcome, giả thuyết thử và tiêu chí dừng/đổi hướng. Có ma trận vấn đề → tính năng → chỉ số → task, ưu tiên giá trị học trước mở rộng catalogue.                                     |
| COM-RES-004 | TODO       | P2 / M       | UXR / BIZ | COM-RES-003 | Thử định vị/quyền lợi và mức sẵn lòng trả bằng mô tả sản phẩm trung thực; báo số người, câu hỏi, mức giá thử và giới hạn mẫu. Phân biệt ý định mua với giao dịch thật; chuyển dữ liệu sang COM-BIZ-002.                                                  |

### B. Thiết kế sản phẩm và khả năng tiếp cận

| ID         | Trạng thái | Ưu tiên / cỡ | R/V      | Phụ thuộc   | Kết quả và tiêu chí nghiệm thu                                                                                                                                                                                                               |
| ---------- | ---------- | ------------ | -------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| COM-UX-001 | TODO       | P1 / M       | UX / PM  | COM-RES-003 | Audit năm khu vực hiện có, onboarding, bài dở, ôn, sync và lỗi; tạo sơ đồ luồng cùng trạng thái loading/empty/error/offline. Xếp lỗi theo ảnh hưởng hoàn thành việc; đề xuất sửa có căn cứ, không thay toàn bộ UI chỉ vì thẩm mỹ.            |
| COM-UX-002 | TODO       | P1 / L       | UX / FE  | COM-UX-001  | Design system từ CSS/font/component hiện có: màu, chữ, khoảng cách, focus, controls, feedback, responsive và reduced motion. Có trang mẫu trong repo và hướng dẫn dùng; file thiết kế chỉ thêm khi cần bàn giao, dark mode xét theo nhu cầu. |
| COM-UX-003 | TODO       | P1 / L       | FE / QA  | COM-UX-002  | Hoàn thiện Hôm nay → học → phản hồi → ôn → tiến bộ với tiếng Việt thống nhất, CTA rõ, không CTA chết. Kiểm tra 360px, bàn phím ảo, loading/lỗi, font lớn và giữ nháp khi điều hướng; ghi ảnh/video ở thiết bị mục tiêu.                      |
| COM-UX-004 | TODO       | P1 / M       | UXR / PM | COM-UX-003  | Usability test dự kiến 5–8 người: bắt đầu, tiếp tục, ôn, nhận biết lưu/đồng bộ và tìm trợ giúp. Ghi số hoàn thành không cần nhắc, thời gian và lỗi; sửa lỗi cản trở rồi kiểm tra lại trên ca bị ảnh hưởng.                                   |
| COM-UX-005 | TODO       | P1 / M       | QA / UX  | COM-UX-003  | Audit theo phạm vi WCAG 2.2 AA: bàn phím/focus, nhãn, lỗi form, tương phản, zoom, audio/transcript; VoiceOver/TalkBack trên luồng chính. Báo từng tiêu chí áp dụng/chưa đạt; axe/Lighthouse không tự chứng minh tuân thủ đầy đủ.             |

### C. Dùng cá nhân, thói quen học và ứng dụng đời sống

| ID            | Trạng thái | Ưu tiên / cỡ | R/V        | Phụ thuộc                               | Kết quả và tiêu chí nghiệm thu                                                                                                                                                                                                                       |
| ------------- | ---------- | ------------ | ---------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| COM-LEARN-001 | TODO       | P0 / M       | PM / EDU   | COM-GOV-001, PLAN-001                   | Lập lịch tuần cho chủ dự án từ thời gian/đầu vào thực, có phiên ngắn và buổi đầy đủ, thời gian nghỉ và mục tiêu đời sống. Chưa có dữ liệu thì kế hoạch có nhãn tạm thời; không tự dự đoán band hay hứa đủ học trong vài phút.                        |
| COM-LEARN-002 | TODO       | P1 / L       | EDU / PM   | COM-RES-003, CONTENT-002                | Thiết kế đánh giá nền tảng ngắn cho nghe/đọc và tự sản sinh nói/viết, cho bỏ qua và ghi thiếu dữ liệu. Có rubric, nhiệm vụ mới và giáo viên rà soát; kết quả dùng chọn điểm bắt đầu, không chuyển thành band IELTS.                                  |
| COM-LEARN-003 | TODO       | P1 / L       | FE / EDU   | COM-LEARN-001, COM-LEARN-002, ADAPT-001 | Kế hoạch tuần dựa trên mục tiêu, kiến thức cần trước và kết quả; cho đổi lịch/nhịp mệt/quay lại. Giải thích thay đổi, giữ phiên đang dở, không tăng nợ ôn vô hạn; test thiếu dữ liệu, nghỉ dài, timezone và backup/sync.                             |
| COM-LEARN-004 | TODO       | P1 / L       | FE / EDU   | COM-CONT-002, REVIEW-001                | Luyện tình huống đời sống từ đầu vào → tự trả lời → phản hồi → dùng lại trong ngữ cảnh mới; ưu tiên gọi món, hẹn lịch, giới thiệu, trao đổi công việc. Có sổ lỗi/cụm từ cần ôn, phân biệt tự báo cáo dùng ngoài đời với kết quả được đánh giá.       |
| COM-LEARN-005 | TODO       | P0 / M       | QA / PO    | COM-OPS-001, COM-QA-002, COM-LEARN-001  | Chủ dự án dùng 14 ngày theo lịch đã chọn: tiếp tục bài, ôn, offline, đổi thiết bị và quay lại sau gián đoạn. Nhật ký ghi buổi dự định/thực hiện, lỗi, điều dùng được; không yêu cầu streak 14/14. Có báo cáo và sửa mọi lỗi mất dữ liệu/cản trở học. |
| COM-LEARN-006 | TODO       | P2 / M       | EDU / DATA | COM-DATA-002, COM-LEARN-003             | Hiệu chỉnh lịch ôn và gợi ý bằng truy hồi sau khoảng nghỉ, tình huống mới và khối lượng bài nợ. So sánh với quy tắc cũ, version thuật toán và phương án rollback; test thời gian/xung đột, không dùng lượt mở thẻ làm thành thạo.                    |
| COM-LEARN-007 | TODO       | P1 / M       | BE / QA    | COM-OPS-001, NOTIFY-001                 | Hoàn thiện worker nhắc Neon nếu phạm vi phát hành có thông báo: opt-in, múi giờ/giờ yên lặng, chống gửi trùng, xóa subscription và giới hạn retry. Kiểm tra điện thoại thật; nếu chưa đủ, tắt nhắc nền và ghi phạm vi release rõ.                    |

### D. Học liệu, chuyên môn và luyện IELTS

| ID            | Trạng thái | Ưu tiên / cỡ | R/V         | Phụ thuộc                             | Kết quả và tiêu chí nghiệm thu                                                                                                                                                                                                                            |
| ------------- | ---------- | ------------ | ----------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| COM-CONT-001  | TODO       | P0 / L       | EDU / LEGAL | CONTENT-002                           | Rà soát 28 bài, 4 kiểm tra và audio: mục tiêu, độ khó, đáp án thay thế, giải thích, nguồn/quyền, người duyệt/ngày/version. Giáo viên độc lập xử lý lỗi ảnh hưởng học; chỉ công bố các bài đủ quyền và đủ duyệt, giữ nhãn phần chưa đạt.                   |
| COM-CONT-002  | TODO       | P1 / L       | EDU / PM    | COM-CONT-001, COM-RES-003             | Xây một cụm 10–14 tình huống đời sống theo nhu cầu đã chọn, đủ vòng học và rubric tự dùng lại. Thử độ khó với người học, ghi lỗi hiểu đề và chỉnh; số bài là phạm vi ban đầu, không là thước đo hiệu quả.                                                 |
| COM-CONT-003  | TODO       | P1 / L       | EDU / QA    | COM-CONT-001                          | Nâng audio ưu tiên bài nghe quan trọng: quyền dùng thương mại, script khớp âm thanh, tốc độ/giọng rõ, dung lượng và định dạng tương thích. Kiểm tra nghe thật trên iOS/Android và offline/range; không thay toàn bộ bằng một provider chưa được đánh giá. |
| COM-CONT-004  | TODO       | P1 / M       | TL / EDU    | COM-CONT-001                          | Quy trình author → review → publish → withdraw; ID/version ổn định, validator mục tiêu/đáp án/quyền, changelog và rollback gói offline. Sửa bài không làm mất lịch sử/nháp; bắt đầu bằng workflow trong repo, CMS chỉ xây khi có nhu cầu biên tập thực.   |
| COM-CONT-005  | TODO       | P2 / XL      | EDU / PO    | COM-REL-002, COM-CONT-004             | Thiết kế khung 26 tuần thích nghi với nền tảng/đời sống/IELTS, triển khai theo từng cụm đã kiểm định. Mỗi cụm có mục tiêu, điều kiện vào/ra, rubric và công sức học dự kiến; không sản xuất hàng trăm bài trước khi cụm đầu có phản hồi.                  |
| COM-IELTS-001 | TODO       | P1 / L       | EDU / PO    | COM-REL-002                           | Chốt Academic hoặc General Training từ nhu cầu thực; đối chiếu cấu trúc/dạng bài/rubric với nguồn IELTS hiện hành và quyền học liệu. Có bảng phủ bốn kỹ năng, giới hạn tính năng và bằng chứng giáo viên duyệt; phối hợp task IELTS-001 cũ.               |
| COM-IELTS-002 | TODO       | P1 / XL      | FE / EDU    | COM-IELTS-001, COM-CONT-004           | Xây ngân hàng và player nghe/đọc theo nhánh đã chọn: phát audio, nhập/chọn đáp án, giới hạn từ khi áp dụng, giải thích và chữa lỗi. Test chuẩn hóa đáp án, nộp lặp, timer/reload/offline; mỗi bài có version và nguồn.                                    |
| COM-IELTS-003 | TODO       | P1 / XL      | FE / EDU    | COM-IELTS-002, COM-AI-003, COM-AI-004 | Thi thử trong phạm vi đã công bố, lưu và khôi phục theo từng phần; báo cáo bốn kỹ năng có nguồn, rubric, ngày và giới hạn. Giáo viên đối chiếu nói/viết; chỉ quy đổi điểm khi có căn cứ đúng dạng đề, không gọi ước lượng là kết quả thi chính thức.      |

### E. AI, luyện nói và luyện viết

| ID         | Trạng thái | Ưu tiên / cỡ | R/V      | Phụ thuộc                             | Kết quả và tiêu chí nghiệm thu                                                                                                                                                                                                                                                                                  |
| ---------- | ---------- | ------------ | -------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| COM-AI-001 | TODO       | P1 / L       | AI / EDU | COM-CONT-001, COM-PRIV-001            | Chuẩn bị tập đối chiếu có quyền gồm đúng/sai/mơ hồ, nhiều trình độ, giọng nói và nhiễu khi có audio. Chốt rubric/ngưỡng với giáo viên trước đánh giá; so chất lượng, độ trễ, giá thực theo provider hiện hành. Báo theo nhóm và lỗi nghiêm trọng, tách tập phát triển/giữ lại, không chọn từ vài ví dụ đẹp.     |
| COM-AI-002 | TODO       | P1 / L       | BE / SEC | COM-AI-001, COM-OPS-001, COM-BIZ-001  | Hoàn thiện AI-001 trên Neon: xác thực, quota/giữ ngân sách atomic, receipt/idempotency, timeout, retry và đối soát chi phí chưa rõ. Có mức chi được chủ dự án chốt, test concurrent/abuse, kill switch. Dữ liệu đầu vào không có quyền điều khiển hệ thống; không coi lọc chuỗi là giải quyết prompt injection. |
| COM-AI-003 | TODO       | P1 / L       | FE / EDU | COM-AI-002, COM-PRIV-002              | Hoàn thiện AI-003: viết → lưu nháp → gửi → phản hồi có dẫn chứng vào câu → tự sửa → so sánh. Version bài/rubric/model rõ; timeout/rời trang/đổi tài khoản không mất hoặc trộn bài; người dùng báo phản hồi sai. Test với bài ngoài tập phát triển.                                                              |
| COM-AI-004 | TODO       | P1 / XL      | FE / EDU | COM-AI-002, COM-PRIV-002, COM-ENG-003 | Hoàn thiện AI-002: xin mic khi cần, ghi/dừng/nghe/hủy/upload/thử lại, hiển thị lưu/xóa. Giới hạn audio theo tác vụ/thiết bị và ngân sách; chỉ nhận xét phát âm từ mô hình xử lý âm thanh đủ năng lực, transcript chỉ hỗ trợ nội dung/ngôn ngữ. Có kiểm tra iOS/Android và đường từ chối mic.                    |
| COM-AI-005 | TODO       | P1 / M       | AI / EDU | COM-AI-003, COM-AI-004                | Release eval độc lập theo nhóm, rate lỗi gây hại học tập, phản hồi không căn cứ và mức bất đồng với giáo viên. Chốt ngưỡng trước chạy; nếu không đạt thì thu hẹp hoặc tắt phần đó. Model/prompt thay đổi phải có regression, rollout hạn chế và rollback; không tự đổi điểm lịch sử.                            |

### F. Kiến trúc, dữ liệu và chất lượng kỹ thuật

| ID          | Trạng thái | Ưu tiên / cỡ | R/V      | Phụ thuộc                 | Kết quả và tiêu chí nghiệm thu                                                                                                                                                                                                                                    |
| ----------- | ---------- | ------------ | -------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| COM-ENG-001 | TODO       | P1 / M       | TL / BE  | COM-GOV-002               | Rà contract FE/BE/schema/content; ghi ADR cho media, AI job và quyền gói khi cần. Giữ React/TS/Vite PWA + Vercel/Render/Neon; ưu tiên module trong hệ thống hiện có. Không thêm microservice, queue hay IndexedDB migration nếu chưa có nhu cầu đo được.          |
| COM-ENG-002 | TODO       | P0 / L       | BE / QA  | COM-OPS-001, DATA-003     | Kiểm tra dữ liệu qua hai thiết bị/tài khoản, tab, outbox, mất acknowledgement, duplicate, conflict, quá quota và schema cũ. Có hướng phục hồi khi vượt kích thước snapshot; giữ bản gốc trước migration, không dùng bản đến sau xóa ngầm dữ liệu khác.            |
| COM-ENG-003 | TODO       | P1 / L       | BE / SEC | COM-ENG-001, COM-PRIV-001 | Kho audio/bài nộp riêng khi cần: quyền theo chủ, URL truy cập có hạn, loại/kích thước hợp lệ, quota, upload dở và dọn file mồ côi. Có lifecycle/xóa và test chéo hai chủ; chốt dịch vụ/chi phí trước dùng audio thật, không đưa file cá nhân vào cache công khai. |
| COM-ENG-004 | TODO       | P1 / M       | FE / QA  | COM-UX-003                | Đo baseline tải trang, độ trễ thao tác, bundle và thiết bị yếu; tối ưu chỗ nghẽn bằng bằng chứng. Kiểm tra font/audio/offline và cold start; báo điều kiện mạng/mẫu đo. Code splitting chỉ áp nơi có lợi, không thêm animation làm chậm luồng học.                |
| COM-ENG-005 | TODO       | P1 / M       | TL / SEC | COM-GOV-002               | Chính sách dependency/lockfile, license, lịch cập nhật và secret scanning. Đánh giá CI/Sentry đang dở theo code thật; thay đổi thư viện kiểm tra tương thích và dữ liệu gửi đi. Có chủ xử lý lỗ hổng, thời hạn theo mức rủi ro và ngoại lệ có ngày hết hạn.       |

### G. Cloud, CI/CD, độ tin cậy và kiểm thử

| ID          | Trạng thái  | Ưu tiên / cỡ | R/V       | Phụ thuộc                             | Kết quả và tiêu chí nghiệm thu                                                                                                                                                                                                                                                              |
| ----------- | ----------- | ------------ | --------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| COM-OPS-001 | IN_PROGRESS | P0 / L       | SRE / QA  | DATA-003                              | Hoàn tất phần cloud DEPLOY-002: đúng Neon project/Auth, migration/version/grants, xử lý credential đã lộ, Render readyz, HTTPS/proxy/origins, OTP thật và sync. Ghi URL/revision/ngày/test; worker nhắc nghiệm thu ở COM-LEARN-007, không đóng DEPLOY-002 toàn bộ nếu tiêu chí còn thiếu.   |
| COM-OPS-002 | READY       | P0 / M       | SRE / TL  | COM-GOV-002                           | Hoàn thiện CI hiện có: clean install, lint/typecheck/unit/build, test Neon/release phù hợp; check bắt buộc chặn merge khi lỗi. Preview/staging tách secret/data production, workflow quyền tối thiểu và pin phiên bản có chủ đích; ghi run URL. Không gọi pipeline “đạt” chỉ từ YAML.       |
| COM-OPS-003 | TODO        | P0 / L       | SRE / QA  | COM-OPS-001, COM-PRIV-001             | Backup/restore database, Auth phụ thuộc provider, media và version học liệu; chốt RPO/RTO rồi diễn tập phục hồi vào môi trường riêng. Kiểm tra owner/revision/quyền, đối chiếu số bản ghi và dữ liệu sau backup; ghi thời gian thực, không coi export local là backup cloud.                |
| COM-OPS-004 | TODO        | P0 / M       | SRE / SEC | COM-OPS-001, COM-PRIV-001             | Health/readiness, lỗi frontend/backend, request ID, sync và AI budget có dashboard/cảnh báo. Kiểm tra lọc token/email/nội dung ở payload thực trước bật telemetry; gửi lỗi thử và xác nhận người trực nhận được. Sentry file đang có phải được tích hợp/kiểm tra, không mặc định hoạt động. |
| COM-OPS-005 | TODO        | P1 / M       | SRE / TL  | COM-OPS-002, COM-OPS-003, COM-OPS-004 | Runbook deploy, smoke, rollback FE/BE/schema tương thích, feature flag, lỗi Auth/provider và sự cố dữ liệu. Diễn tập trên staging; ghi người trực/khung giờ, cách thông báo, hành động khi hết ngân sách lỗi. Không hứa hỗ trợ 24/7 nếu chưa có nhân lực.                                   |
| COM-OPS-006 | TODO        | P1 / L       | SRE / BIZ | COM-OPS-005, COM-ENG-004              | Test tải theo hồ sơ beta/bán thử: OTP burst, sync đồng thời, cold start, DB pool, audio và AI queue nếu có. Ghi giới hạn, p95, error rate và chi phí ở từng mức tải; xác định trần mở khách. Không coi gói miễn phí hoặc số MAU mong muốn là năng lực đã đo.                                |
| COM-QA-001  | TODO        | P0 / M       | QA / TL   | COM-GOV-002                           | Lập test matrix rủi ro từ bộ test có sẵn: khách/tài khoản, học/ôn/sync, quyền, offline, cập nhật và lỗi dịch vụ. Gắn requirement → test → môi trường → bằng chứng; phân biệt fixture/local/cloud. Ca flaky có chủ/nguyên nhân, không nới timeout tùy tiện.                                  |
| COM-QA-002  | TODO        | P0 / L       | QA / PO   | COM-OPS-001, COM-QA-001               | Kiểm tra trên iPhone Safari/PWA và Android Chrome/PWA thật cùng desktop: cài/mở, audio, resume, airplane mode, dung lượng, nâng cấp, logout/đổi chủ. Ghi model/OS/browser/version app và ca không hỗ trợ; giả lập viewport không thay bằng chứng thiết bị.                                  |
| COM-QA-003  | TODO        | P0 / M       | QA / PM   | COM-OPS-002, COM-ENG-002              | Bộ regression release chọn theo rủi ro, chạy từ artifact sẽ phát hành; smoke production bằng tài khoản thử riêng, không chạy phá dữ liệu khách. Report lưu revision/môi trường/kết quả và known issues; lỗi P0/P1 ảnh hưởng cổng có quyết định xử lý trước phát hành.                       |

### H. Bảo mật, quyền riêng và pháp lý

| ID            | Trạng thái | Ưu tiên / cỡ | R/V         | Phụ thuộc                  | Kết quả và tiêu chí nghiệm thu                                                                                                                                                                                                                                                          |
| ------------- | ---------- | ------------ | ----------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| COM-SEC-001   | TODO       | P0 / M       | SEC / TL    | COM-GOV-002                | Threat model browser/proxy/API/DB/Auth/AI/media, tài sản và ranh giới tin cậy; chọn kiểm soát ASVS áp dụng và bằng chứng. Ưu tiên truy cập chéo, chiếm phiên, replay, upload, log và abuse; ghi ngoại lệ cụ thể thay một checkbox “OWASP pass”.                                         |
| COM-SEC-002   | TODO       | P0 / L       | SEC / QA    | COM-SEC-001, COM-OPS-001   | Kiểm tra độc lập JWT/session/CSRF/CORS, role runtime/RLS, rate limit/OTP abuse, SQL/input và cache riêng tư. Hai chủ và request không đăng nhập phải được thử thật; rà secret đã lộ và xác nhận thu hồi/đổi. Đóng lỗi nghiêm trọng và retest; scan tự động không thay toàn bộ kiểm tra. |
| COM-PRIV-001  | TODO       | P0 / M       | SEC / LEGAL | COM-GOV-001                | Lập data inventory theo mục đích/nơi lưu/ai truy cập/provider/thời hạn: profile, bài, audio, event, log, billing và backup. Chốt dữ liệu tối thiểu, cách thông báo/lựa chọn, nhóm tuổi/phạm vi quốc gia; không coi “sendDefaultPii=false” là chính sách đầy đủ.                         |
| COM-PRIV-002  | TODO       | P0 / L       | BE / SEC    | COM-PRIV-001, COM-OPS-001  | Luồng xuất/xóa tài khoản và dữ liệu cloud: xác minh người yêu cầu, thu hồi phiên, ngừng upload/sync, xóa file/job/cache/subscription, xử lý bản sao lưu theo thời hạn. Test retry/idempotency và thiết bị cũ không tái tạo dữ liệu đã xóa; UI nói rõ phần local cần xóa riêng.          |
| COM-LEGAL-001 | TODO       | P0 / M       | LEGAL / PO  | COM-PRIV-001, COM-RES-003  | Xác định đơn vị bán, thị trường, tuổi khách và nghĩa vụ áp dụng về dữ liệu/tiêu dùng/thương mại/thuế với người có chuyên môn, nguồn hiện hành. Duyệt Terms/Privacy, quyền học liệu/nhãn hiệu và giới hạn AI; không tự gắn GDPR hay chứng nhận pháp lý cho mọi thị trường.               |
| COM-LEGAL-002 | TODO       | P1 / M       | LEGAL / BIZ | COM-LEGAL-001, COM-BIZ-002 | Hoàn thiện điều khoản gói, gia hạn/hủy/hoàn tiền, chứng từ và hợp đồng nhà cung cấp xử lý dữ liệu theo mô hình bán đã chọn. Có người chịu trách nhiệm cập nhật, ngày hiệu lực và bản lưu; chỉ chốt cổng thanh toán đủ điều kiện đăng ký ở thị trường của đơn vị bán.                    |

### I. Dữ liệu sản phẩm và hiệu quả học

| ID           | Trạng thái | Ưu tiên / cỡ | R/V        | Phụ thuộc                 | Kết quả và tiêu chí nghiệm thu                                                                                                                                                                                                                                |
| ------------ | ---------- | ------------ | ---------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| COM-DATA-001 | TODO       | P1 / M       | DATA / SEC | COM-RES-003, COM-PRIV-001 | Event dictionary có version cho bắt đầu/hoàn thành/ôn/sửa bài/sync lỗi và funnel; định nghĩa event ID, owner, timestamp, timezone, consent. Không gửi bài/audio/email vào analytics; phân biệt dữ liệu vận hành và nghiên cứu, có ca gửi lặp/offline/opt-out. |
| COM-DATA-002 | TODO       | P1 / M       | DATA / PM  | COM-DATA-001, COM-OPS-004 | Dashboard activation/cohort/truy hồi/lỗi/cost có mẫu số và khoảng thời gian; loại test/bot/nội bộ, khử lặp sync, xử lý dữ liệu đến muộn. Đối chiếu mẫu với nguồn gốc trước sử dụng; không gộp khách và tài khoản bằng email hoặc suy danh tính.               |
| COM-DATA-003 | TODO       | P1 / L       | EDU / PM   | COM-DATA-002, COM-REL-002 | Nghiên cứu trước/sau bằng bài tương đương và nhiệm vụ mới; báo bỏ cuộc, thiếu dữ liệu, cỡ mẫu và giới hạn nhân quả. Ngưỡng/cách phân tích chốt trước đo; không tuyên bố cải thiện IELTS từ phút học hoặc khảo sát hài lòng.                                   |

### J. Kinh doanh, thanh toán và quyền lợi

| ID          | Trạng thái | Ưu tiên / cỡ | R/V      | Phụ thuộc                               | Kết quả và tiêu chí nghiệm thu                                                                                                                                                                                                                                                       |
| ----------- | ---------- | ------------ | -------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| COM-BIZ-001 | TODO       | P1 / M       | BIZ / PO | COM-GOV-001                             | Mô hình chi phí thấp/cơ sở/cao gồm cloud, Auth/email, AI/audio, storage/egress, giáo viên, support và phí giao dịch dự kiến. Lấy báo giá hiện hành khi chọn dịch vụ, tách fixed/variable, đặt trần chi thử và cảnh báo. Không coi AI unlimited là mặc định khả thi.                  |
| COM-BIZ-002 | TODO       | P1 / M       | BIZ / PO | COM-BIZ-001, COM-RES-004, COM-DATA-002  | Đề xuất gói miễn phí/trả phí bằng giá trị đã kiểm chứng, nhu cầu trả tiền và chi phí mỗi người. Có hạn mức công bằng, quyền lợi rõ, doanh thu hòa vốn và kịch bản dùng AI cao; giá là giả thuyết cho tới khi chốt, không tự đặt 99k hay khóa dữ liệu cũ.                             |
| COM-PAY-001 | TODO       | P1 / L       | BE / QA  | COM-BIZ-002, COM-LEGAL-002, COM-SEC-001 | Chọn một cổng đủ điều kiện; sandbox luồng order → pending → paid/failed/expired/refunded. Webhook xác minh chữ ký, idempotency, số tiền/đơn vị/đơn hàng từ server; test trùng/đảo thứ tự/mất callback, không cấp quyền chỉ từ redirect thành công.                                   |
| COM-PAY-002 | TODO       | P1 / L       | BE / SEC | COM-PAY-001                             | Entitlement phía máy chủ, hạn mức atomic và trạng thái active/grace/canceled/expired/refunded theo gói đã chốt. Test đổi gói, gia hạn/hủy, timeout và đồng thời, chỉnh đồng hồ client không kéo dài quyền. Hết gói vẫn xuất dữ liệu; offline chỉ cấp đúng phạm vi thiết kế.          |
| COM-PAY-003 | TODO       | P1 / M       | BIZ / QA | COM-PAY-002                             | Đối soát giao dịch/provider/entitlement và xử lý refund/chargeback khi áp dụng; trường hợp lệch có hàng chờ và người chịu trách nhiệm. Sandbox đạt trước giao dịch thật có giới hạn trong phạm vi cho phép; lưu bằng chứng đã che dữ liệu, không tự gửi email hóa đơn thử cho khách. |

### K. Marketing, chăm sóc và quản trị nội bộ

| ID            | Trạng thái | Ưu tiên / cỡ | R/V        | Phụ thuộc                             | Kết quả và tiêu chí nghiệm thu                                                                                                                                                                                                                              |
| ------------- | ---------- | ------------ | ---------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| COM-GROW-001  | TODO       | P1 / M       | GROW / PM  | COM-RES-003, COM-LEGAL-001            | Trang giới thiệu/bài mẫu/FAQ phản ánh bản đang chạy, nhãn thử nghiệm/AI và ai phù hợp; metadata/SEO cơ bản, CTA có đường đích thật. Không dùng testimonial, số người dùng, chứng nhận hoặc cam kết band giả; thu email chỉ khi có thông báo và mục đích rõ. |
| COM-GROW-002  | TODO       | P2 / M       | GROW / BIZ | COM-REL-004, COM-DATA-002             | Thử 1–2 kênh với ngân sách/mốc dừng và attribution đã chốt; đo từ khách đủ điều kiện đến học có giá trị và trả tiền, cùng chi phí hỗ trợ. Không mở quảng cáo lớn trước retention/unit economics; liên hệ bên ngoài theo phạm vi được giao.                  |
| COM-CS-001    | TODO       | P0 / M       | CS / PM    | COM-GOV-001                           | FAQ/hướng dẫn bắt đầu, offline, tài khoản, backup, xóa và báo lỗi; biểu mẫu chỉ lấy thông tin cần, nhắc che dữ liệu. Ticket có mức độ/owner/khung giờ phản hồi, tuyến chuyển QA/SEC/EDU; diễn tập một yêu cầu mất bài và một phản hồi học liệu sai.         |
| COM-CS-002    | TODO       | P1 / M       | CS / EDU   | COM-CS-001, COM-DATA-002              | Thu phản hồi trong/sau học có thể bỏ qua; phân loại bug, nội dung sai, AI sai, khó dùng, thiếu giá trị và hủy dịch vụ. Mỗi nhóm có SLA nội bộ, chủ xử lý và liên kết ticket; báo lại khách khi được phép, không ép khảo sát để tiếp tục học.                |
| COM-ADMIN-001 | TODO       | P1 / L       | BE / SEC   | COM-SEC-002, COM-PRIV-002, COM-CS-001 | Công cụ hỗ trợ tối thiểu với role riêng, audit log, truy cập theo nhu cầu; không mặc định cho support đọc bài/audio hay mạo danh học viên. Các thao tác nguy hiểm xác nhận và có dấu vết; trước bán bổ sung tra giao dịch/entitlement từ COM-PAY-002.       |

### L. Nghiệm thu, phát hành và mở rộng có điều kiện

| ID          | Trạng thái | Ưu tiên / cỡ | R/V      | Phụ thuộc                                                                                                                                                                                                              | Kết quả và tiêu chí nghiệm thu                                                                                                                                                                                                                              |
| ----------- | ---------- | ------------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| COM-REL-001 | TODO       | P0 / S       | QA / PO  | COM-LEARN-005, COM-ENG-002, COM-OPS-003, COM-SEC-002                                                                                                                                                                   | Hồ sơ G1: nhật ký 14 ngày, cloud/thiết bị/restore, lỗi và phạm vi biết rõ. Không còn lỗi mất/lộ dữ liệu hoặc chặn học; người dùng có thể học/ôn/tiếp tục và dùng bản sao. Chức năng chưa đạt được tắt hoặc ghi giới hạn, không công bố AI thật.             |
| COM-REL-002 | TODO       | P1 / L       | PM / PO  | COM-REL-001, COM-RES-003, COM-UX-004, COM-UX-005, COM-CONT-001, COM-CONT-002, COM-CONT-003, COM-CONT-004, COM-LEARN-003, COM-LEARN-004, COM-PRIV-002, COM-LEGAL-001, COM-CS-001, COM-DATA-002, COM-QA-003, COM-OPS-005 | Beta kín G2 dự kiến 10–20 người trong 2–4 tuần, chỉ tuyển trong phạm vi cho phép. Có protocol/đồng ý/tiêu chí dừng, báo cáo activation/quay lại/lỗi và phỏng vấn người bỏ dở. Chốt tiếp tục/sửa/thu hẹp từ dữ liệu; mẫu nhỏ không đại diện toàn thị trường. |
| COM-REL-003 | TODO       | P1 / L       | QA / EDU | COM-REL-002, COM-AI-005, COM-IELTS-003, COM-CS-002                                                                                                                                                                     | Hồ sơ G3 cho đúng nhánh IELTS và phạm vi AI đã thử; rubric, tập đối chiếu, nguồn và giới hạn rõ. Đối chiếu toàn bộ BETA-001/AI-001/002/003/IELTS-001/002 cũ, chỉ đóng task cũ nếu đủ từng tiêu chí; không tự đồng nhất các mốc.                             |
| COM-REL-004 | TODO       | P1 / L       | PM / PO  | COM-REL-002, COM-BIZ-002, COM-PAY-003, COM-LEGAL-002, COM-OPS-006, COM-GROW-001, COM-ADMIN-001, COM-CS-002, COM-DATA-003                                                                                               | Hồ sơ G4: gói bán/giá/phạm vi, điều khoản, QA giao dịch, đối soát, rollback, support, dung lượng và trần ngân sách. Bắt buộc thêm G3 nếu bán AI/IELTS. Mở bán giới hạn khách theo năng lực đã đo, kiểm tra sau phát hành và lối hủy/hoàn tiền hoạt động.    |
| COM-REL-005 | TODO       | P2 / L       | BIZ / PO | COM-REL-004, COM-GROW-002                                                                                                                                                                                              | Hồ sơ G5 từ cohort trả tiền ít nhất một chu kỳ gia hạn phù hợp: retention/churn, học tập, margin, support, sự cố và tải. Có quyết định tăng/giữ/giảm quy mô cùng bằng chứng; thiếu mẫu thì kéo dài đo, không suy LTV chắc chắn từ vài khách.                |
| COM-EXP-001 | TODO       | P2 / M       | PM / PO  | COM-REL-005                                                                                                                                                                                                            | Đánh giá nhu cầu lớp học/B2B bằng khách hàng cụ thể, quyền chia sẻ và chi phí phục vụ; chỉ chuyển COACH-001 sang READY khi có bài toán được xác nhận. Thiết kế quyền giáo viên/học viên và kiểm tra cô lập trước triển khai.                                |
| COM-EXP-002 | TODO       | P2 / M       | TL / PO  | COM-REL-005                                                                                                                                                                                                            | So PWA với nhu cầu native thực: hạn chế nền tảng, phân phối, chi phí build/ký/review/store. Chỉ mở MOBILE-001 khi có lợi ích đủ rõ và tài khoản/thiết bị/quyền phát hành; không coi App Store là điều kiện bắt buộc để thương mại hóa web.                  |

### Ánh xạ với backlog kỹ thuật cũ

| Task cũ trong TASKS                           | Work package dùng lại/kiểm định         | Quy tắc                                                                                          |
| --------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------ |
| DATA-003, DEPLOY-002                          | COM-OPS-001, COM-ENG-002, COM-LEARN-007 | DATA-003 giữ DONE code/local; DEPLOY-002 giữ IN_PROGRESS đến đủ cloud/worker theo phạm vi cũ     |
| PLAN-001, ADAPT-001, REVIEW-001, PROGRESS-001 | COM-LEARN-001/003/006, COM-DATA-002     | Cải tiến từ implementation hiện có; không viết lại lịch sử                                       |
| PWA-001/002, DATA-001/002, NOTIFY-001         | COM-QA-002, COM-ENG-002, COM-LEARN-007  | Bổ sung bằng chứng thiết bị/Neon, giữ regression legacy                                          |
| CONTENT-001/002                               | COM-CONT-001/003/004                    | Giữ ID bài và tiến độ; bổ sung duyệt độc lập/quyền/version                                       |
| AI-001/002/003                                | COM-AI-001 đến COM-AI-005               | Kế thừa API/contract/eval, tích hợp và nghiệm thu Neon thật                                      |
| BETA-001                                      | COM-REL-003                             | G2 chưa đủ để đóng beta có AI của task cũ                                                        |
| IELTS-001/002                                 | COM-IELTS-001/002/003                   | Gỡ phụ thuộc chờ beta chỉ đối với công việc khảo sát/spec độc lập; task cũ hoàn thành theo AC cũ |
| COACH-001, MOBILE-001                         | COM-EXP-001/002                         | Giữ TODO, quyết định đầu tư sau dữ liệu nhu cầu và năng lực                                      |

## 8. Chỉ số, chất lượng và kinh tế sản phẩm

### Đo giá trị học trước khi tối ưu tăng trưởng

Chỉ số định hướng: **số người trong tuần hoàn thành vòng học có hoạt động tự nhớ lại và sử dụng trong ngữ cảnh mới**. Báo riêng số có bài đánh giá và số chỉ tự báo cáo; số lượng này không chứng minh tăng band. Các ngưỡng kinh doanh dưới đây chưa được chốt; COM-RES-003/COM-DATA-001 phải chốt định nghĩa và mục tiêu trước tuyển beta.

| Chỉ số                    | Định nghĩa/mẫu số                                                                                                        | Cách dùng và giới hạn                                                                    |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Activation                | Người lần đầu hoàn tất một phiên đầy đủ trong 24 giờ / người lần đầu bắt đầu học trong cohort; phiên khởi động báo riêng | Tách khách/tài khoản, loại fixture/nội bộ; dùng tìm trở ngại onboarding                  |
| Tuân thủ lịch cá nhân     | Số buổi đã hoàn thành / số buổi đã lên lịch của tuần; ghi lịch đổi theo version                                          | So với lịch thực của chủ dự án, không bắt học mỗi ngày                                   |
| D7 và D30 retention       | Người cohort có hoạt động học có ý nghĩa đúng ngày thứ 7/30 từ lần đầu / cohort đã đủ tuổi quan sát                      | Chốt timezone; rolling/weekly retention là chỉ số khác, không thay tên để làm đẹp        |
| Nhớ sau khoảng nghỉ       | Lượt đúng độc lập lần đầu trong cửa sổ ôn được chốt / lượt hợp lệ cùng cửa sổ                                            | Báo số người, số mục, ngày trễ và mức khó; xem thẻ/đúng sau gợi ý tách riêng             |
| Dùng trong tình huống mới | Bài sản sinh mới đạt rubric / bài mới được đánh giá, kèm số người tham gia                                               | Không lấy bài đã học thuộc; tự báo cáo đời sống không gộp với giáo viên chấm             |
| Hiệu quả sửa bài          | Lỗi mục tiêu giảm ở bài sau theo rubric so với bài trước, trên cặp bài đủ dữ liệu                                        | Báo rơi mẫu, độ khó và người chấm; không coi sửa theo AI là đã học được                  |
| Độ tin cậy sync           | Mutation hợp lệ được xác nhận / mutation hợp lệ đã gửi, cùng thời gian chờ và xung đột                                   | Khử retry theo ID, phân biệt offline chủ động với lỗi server; mất dữ liệu là sự cố riêng |
| Chất lượng AI             | Tỷ lệ phản hồi có căn cứ/đúng rubric, lỗi nghiêm trọng và bất đồng giáo viên theo nhóm                                   | Đo cả trường hợp từ chối, timeout và audio kém; hài lòng không thay chất lượng           |
| Paid conversion/churn     | Người trả tiền / người đủ điều kiện thấy đề nghị; số hủy/hết hạn / thuê bao đầu kỳ                                       | Phân biệt thử miễn phí, refund, chủ động hủy và lỗi thanh toán                           |
| Chi phí và lợi nhuận      | Doanh thu thuần trừ chi phí biến đổi trên người trả tiền/cohort                                                          | Bao gồm AI, media, phí giao dịch, hoàn tiền và support; fixed cost báo riêng             |

Không chạy A/B test khi lượng mẫu chưa đủ để trả lời câu hỏi. Trước đó ưu tiên usability, phỏng vấn và quan sát cohort; công bố hạn chế thay kết luận chắc chắn.

### Ngưỡng kỹ thuật đề xuất để chốt trước beta/bán thử

| Phạm vi                    | Mục tiêu khởi đầu đề xuất                                                                         | Bằng chứng và hành động nếu không đạt                                                                                                                      |
| -------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lưu và quyền dữ liệu       | Không có lỗi mất dữ liệu hoặc truy cập chéo được tái hiện còn mở trong bộ ca phát hành            | Test lỗi/quyền + diễn tập phục hồi; không phải cam kết tuyệt đối không có lỗi                                                                              |
| Web trên thiết bị mục tiêu | Theo Core Web Vitals: p75 LCP ≤ 2,5 giây, INP ≤ 200 ms, CLS ≤ 0,1 khi đủ dữ liệu thực             | Các ngưỡng tốt từ [web.dev](https://web.dev/articles/vitals); lab đo có cấu hình riêng khi chưa đủ field data, không thay thế ngang nhau                   |
| API dữ liệu tương tác      | p95 ≤ 1 giây khi đã ấm ở tải đã chốt; cold start đo riêng                                         | Tách Auth/provider/AI khỏi chỉ số này, ghi payload/vùng/mạng; điều chỉnh kiến trúc hoặc gói dịch vụ nếu ảnh hưởng sử dụng                                  |
| Độ sẵn sàng                | Đề xuất SLO 99,5% trong cửa sổ 30 ngày trước mở rộng; không coi đây là SLA hợp đồng               | Định nghĩa request/probe hợp lệ và thời gian mất phục vụ; báo cửa sổ thực nếu chưa đủ 30 ngày, sự cố lặp lại ưu tiên hơn feature                           |
| Khôi phục                  | Đề xuất RPO ≤ 24 giờ, RTO ≤ 4 giờ cho beta; xét siết trước bán theo tác động                      | RPO: lượng dữ liệu theo thời gian có thể mất; RTO: thời gian phục hồi. Chỉ chốt sau xem khả năng/giá provider và diễn tập; không công bố đã đạt từ tên gói |
| AI                         | Trần chi theo người/ngày/tổng đã được chốt, không có chi vượt cap do request đồng thời trong test | Độ trễ/chất lượng chốt riêng theo nói/viết ở COM-AI-001; có trạng thái chờ/thử lại/tắt, không ép mọi tác vụ dưới 5 giây                                    |
| Accessibility              | Mục tiêu WCAG 2.2 AA cho phạm vi luồng phát hành                                                  | Theo [W3C](https://www.w3.org/WAI/standards-guidelines/wcag/), cần đánh giá các tiêu chí áp dụng; báo giới hạn audit và thiết bị                           |

Các con số API/SLO/RPO/RTO là đề xuất của dự án, không là tiêu chuẩn bắt buộc của nhà cung cấp hoặc thành tích đã đạt. PO/SRE phải ghi quyết định điều chỉnh trước thử nghiệm, không hạ ngưỡng sau đo để gọi là thành công.

### Tính khả thi thương mại

Mô hình COM-BIZ-001 cần tối thiểu ba kịch bản sử dụng, nguồn báo giá/ngày, tiền tệ và giả định thuế/phí được Finance/Legal xác minh khi áp dụng:

```text
Chi phí biến đổi/người = AI văn bản + audio + storage/egress phân bổ
                      + phí thanh toán + hoàn tiền dự kiến + support biến đổi
Lợi nhuận đóng góp/người = doanh thu thuần/người - chi phí biến đổi/người
Số người hòa vốn = chi phí cố định / lợi nhuận đóng góp/người (chỉ nếu > 0)
CAC theo kênh = chi phí thu hút của kênh / số khách trả tiền quy thuộc được
Runway = tiền có thể dùng / mức đốt tiền ròng trung bình tháng (nếu đang âm tiền)
```

Tách lợi nhuận khỏi dòng tiền thu trước; doanh thu định kỳ, doanh thu nhận trước và tiền đã thu không đồng nghĩa nhau. Chưa đủ dữ liệu gia hạn thì chưa dự báo LTV chắc chắn. Mỗi tính năng AI phải có kịch bản dùng cao và đường giảm chi phí mà người học hiểu được.

## 9. Kế hoạch thực hiện trước mắt

### Thứ tự công việc

1. **COM-GOV-001/002 đã DONE phần charter/kiểm kê.** Đọc PRODUCT_CHARTER và BASELINE_AUDIT; task local READY tiếp theo là COM-OPS-002 để sửa CI/CD. Thông tin học cá nhân và ngân sách chưa có mức cụ thể, giữ giả định công khai.
2. **Tiếp tục DEPLOY-002 qua COM-OPS-001**: health/readiness công khai đã đạt; lấy revision, kiểm tra grants chỉ đọc, xử lý credential cũ rồi OTP/sync. Không chạy lại migration từ log lịch sử. Thiếu quyền cloud thì tiếp tục phần test/runbook độc lập.
3. **COM-GOV-002 + COM-QA-001 + COM-PRIV-001**: kiểm kê, ma trận test và dữ liệu. Sau đó COM-OPS-002/003/004, COM-SEC-001/002 và kiểm tra thiết bị.
4. **COM-LEARN-001 → COM-LEARN-005 → COM-REL-001**: chủ dự án thực sự dùng theo lịch và ghi 14 ngày; sửa trở ngại trước mở beta.
5. **COM-RES-001/002/003 → UX, học liệu, vòng học đời sống → COM-REL-002**: kiểm định với nhóm nhỏ. Có thể nghiên cứu và duyệt học liệu trong lúc chờ cloud/nhật ký.
6. **AI/IELTS theo khả năng đã kiểm định; BIZ/LEGAL/PAY theo nhu cầu trả tiền → COM-REL-004**. Không cần chờ native/B2B để bán web; không quảng cáo AI/IELTS chưa qua G3.

Đường găng kỹ thuật cho G1: cloud → kiểm tra sync/quyền/restore/thiết bị → nhật ký sử dụng → hồ sơ nghiệm thu. Đường giá trị cho G2: nghiên cứu → PRD → UX/học liệu/vòng học → thử người thật. Cổng bị chậm không ngăn công việc độc lập trên đường còn lại.

### Hai sprint khởi đầu đề xuất

Một sprint dài hai tuần là nhịp review đề xuất, không là cam kết xong toàn bộ danh sách. COM-GOV-001 chốt số ngày công thật; chỉ đưa vào sprint phần vừa năng lực, để khoảng 20–30% xử lý lỗi/vận hành. Không cộng cơ học các ước lượng XL thành ngày ra mắt.

| Sprint                               | Mục tiêu demo                                                     | Must-have để chọn theo năng lực                                                              | Kết quả review                                                                     |
| ------------------------------------ | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| S0 — Chốt cơ sở và cloud             | Một luồng học có tài khoản với bằng chứng lưu/đồng bộ, charter rõ | COM-GOV-001/002; phần COM-OPS-001 làm được; COM-QA-001, COM-PRIV-001; chuẩn bị COM-LEARN-001 | Demo thực + danh sách điều chưa kiểm chứng, phân công blocker cloud/thiết bị       |
| S1 — Dùng cá nhân và tìm đúng vấn đề | Chủ dự án dùng thật, có test lỗi/restore và kế hoạch nghiên cứu   | Phần ưu tiên COM-SEC-001/002, COM-OPS-003/004, COM-QA-002; bắt đầu nhật ký và COM-RES-001    | Dữ liệu nhật ký đủ thời gian mới nghiệm thu; không rút 14 ngày thành một buổi demo |

Sau mỗi sprint: review sản phẩm và học liệu bằng demo; QA trình ca lỗi; PM cập nhật số đo và quyết định; retrospective chọn tối đa 1–2 cải tiến cách làm. Mỗi tuần triage phản hồi/support; mỗi tháng rà chi phí, quyền truy cập, dependency và roadmap theo thực tế.

## 10. Rủi ro và quyết định còn mở

| Rủi ro/điều chưa biết                      | Dấu hiệu cần chú ý                           | Chủ xử lý / task               | Cách giảm rủi ro                                                           |
| ------------------------------------------ | -------------------------------------------- | ------------------------------ | -------------------------------------------------------------------------- |
| Cloud chưa hoạt động trọn luồng            | Frontend mở nhưng OTP/sync lỗi               | SRE / COM-OPS-001              | Bằng chứng từng tầng, role tối thiểu, test từ domain thật                  |
| Thông tin kết nối từng lộ                  | Chưa xác nhận đổi/thu hồi                    | SEC / COM-SEC-002              | Xử lý credential có hiệu lực trước beta, không đưa secret vào chat/Git     |
| Sai phân khúc/thiếu giá trị dùng hằng ngày | Bỏ dở, không biết dùng kiến thức ở đâu       | UXR / COM-RES-001/003          | Nghiên cứu hành vi và thử cụm đời sống trước mở catalogue                  |
| Chưa biết đầu vào/ngày thi                 | Kế hoạch quá khó hoặc không đủ thời gian     | EDU / COM-LEARN-001/002        | Ghi dữ liệu thiếu, đánh giá vừa sức, cho đổi mục tiêu                      |
| Học liệu sai/thiếu quyền                   | Đáp án mơ hồ, audio lệch, không có giấy phép | EDU / COM-CONT-001/004         | Duyệt và version, rút bài lỗi, bảo toàn lịch sử                            |
| AI sai hoặc chi phí tăng                   | Nhận xét phát âm từ text, cap bị vượt        | AI / COM-AI-001/002/005        | Eval theo nhóm, giới hạn năng lực, budget atomic/kill switch               |
| PWA bị OS hạn chế nền                      | Nhắc/sync không chạy khi app đóng            | FE / COM-QA-002, COM-LEARN-007 | Sync khi mở app, ghi giới hạn, kiểm thử thiết bị thật                      |
| Trùng giao dịch/sai quyền gói              | Paid trên UI nhưng server không nhất quán    | BE / COM-PAY-001/003           | Webhook idempotency và đối soát, không tin redirect                        |
| Xóa xong dữ liệu bị sync lại               | Thiết bị cũ gửi outbox sau xóa               | SEC / COM-PRIV-002             | Thu hồi/đánh dấu vòng đời và test retry/thiết bị cũ                        |
| Chưa có giáo viên/reviewer/thiết bị        | Mục nghiệm thu độc lập không có người ký     | PO / COM-GOV-001               | Bố trí rõ người/chi phí; giữ cổng liên quan chưa đạt, vẫn làm phần độc lập |
| Kinh tế không bền                          | AI/support cao hơn doanh thu đóng góp        | BIZ / COM-BIZ-001/002          | Điều chỉnh gói/phạm vi, đo cohort trước chạy tăng trưởng                   |
| Quá nhiều dự án con                        | B2B/native/CMS làm chậm vòng học             | PM / COM-RES-003               | Giữ phạm vi theo cổng, yêu cầu bằng chứng nhu cầu cho đầu tư mới           |

Các giả định khởi đầu được ghi tại DEC-024: người dùng đã yêu cầu mục tiêu cá nhân và thương mại; tạm nghiên cứu B2C người trưởng thành tại Việt Nam trước; giá, ngân sách, nhân sự, loại thi, ngày bán và provider đều chưa chốt.

## 11. Mẫu ticket, sprint và hồ sơ phát hành

### Ticket có thể giao thực hiện

```markdown
ID / tiêu đề:
Epic/work package COM cha:
Trạng thái / ưu tiên / cỡ / cổng mục tiêu:
Người thực hiện / người nghiệm thu (tên cụ thể):
Vấn đề và bằng chứng khách hàng:
User story: Là ..., tôi cần ..., để ...
Kết quả cần đạt / phạm vi ngoài task:
Phụ thuộc / quyền truy cập / dữ liệu và ngân sách nếu cần:
Đầu ra: file, contract, prototype, báo cáo hoặc artifact cụ thể
Tiêu chí nghiệm thu:

- Given ... When ... Then ...
- Ca lỗi/offline/retry/quyền/đồng thời khi áp dụng
  Đo lường hoặc kiểm thử / môi trường / thiết bị:
  Migration, rollout, tắt tính năng và rollback khi áp dụng:
  Rủi ro / quyết định còn mở / người xử lý:
  Bằng chứng thực tế: revision, ngày, lệnh, kết quả, reviewer
  Giới hạn còn lại / tài liệu bàn giao:
```

Ví dụ ca nghiệm thu COM-ENG-002: thiết bị A gửi mutation M và server đã commit nhưng response mất; khi mở lại A và gửi M lần nữa, chỉ có một kết quả học, revision/receipt nhất quán, UI chỉ báo đã đồng bộ sau acknowledgement. Đăng nhập tài khoản B trong lúc A chờ response không được ghi dữ liệu A vào kho B.

### Sprint

```markdown
Sprint / ngày bắt đầu-kết thúc / năng lực ngày công thực:
Một mục tiêu có thể demo:
Must-have: ID, owner, đầu ra, estimate
Should-have: chỉ kéo vào khi còn năng lực
Phụ thuộc ngoài nhóm: người liên hệ, ngày kiểm tra, phần độc lập
Demo / bằng chứng / chỉ số trước-sau:
Task dở và nguyên nhân / quyết định scope:
Retrospective: một cải tiến, người phụ trách, thời điểm kiểm tra
```

### Hồ sơ ra cổng/phát hành

- Phiên bản/revision, ngày, môi trường và URL; danh sách tính năng bật/tắt, nhánh IELTS/gói bán nếu có.
- Checklist task bắt buộc của cổng, người nghiệm thu theo vai trò, evidence link, known issues và rủi ro còn lại.
- Test code/thiết bị/cloud/quyền; học liệu và eval AI khi có; giao dịch/đối soát/hoàn tiền khi có thu phí.
- Backup/restore gần nhất, migration/rollback, dashboard/cảnh báo, người trực và khung giờ hỗ trợ.
- Giới hạn số người/budget, điều kiện dừng hoặc rollback, người ra quyết định.
- Ghi rõ `GO`, `NO-GO` hoặc phạm vi thu hẹp và lý do; quyền phát hành phải nằm trong phạm vi người dùng đã giao.
- Kiểm tra ngay sau deploy, sau 24 giờ và review sau 7 ngày hoặc chu kỳ phù hợp; cập nhật STATUS/SESSION_LOG bằng kết quả thật.

## 12. Tài liệu chuẩn để đối chiếu khi triển khai

Đã mở/tra cứu ngày lập để đặt định hướng kiểm tra; phải kiểm tra phiên bản và phạm vi áp dụng khi làm task. Đây là nguồn cho tiêu chí tương ứng, không chứng nhận dự án đã tuân thủ.

- UX/accessibility dùng các tiêu chí WCAG và kiểm tra thủ công cùng tự động, theo [W3C — WCAG 2 Overview](https://www.w3.org/WAI/standards-guidelines/wcag/).
- Bảo mật xây ma trận yêu cầu có phiên bản và bằng chứng từ [OWASP — Application Security Verification Standard](https://owasp.org/www-project-application-security-verification-standard/); không dùng một lượt scan thay kiểm định.
- Chỉ số trải nghiệm tải/tương tác/ổn định hiển thị và phân biệt field/lab theo [web.dev — Web Vitals](https://web.dev/articles/vitals).
- Phạm vi chấm IELTS và khác biệt kỹ năng phải đối chiếu [IELTS — Scoring in detail](https://ielts.org/take-a-test/your-results/ielts-scoring-in-detail); rubric chính thức không biến chấm AI nội bộ thành kết quả thi.

Thị trường, giá dịch vụ, điều khoản provider và nghĩa vụ pháp lý không được kết luận từ tài liệu kế hoạch này; task BIZ/LEGAL chịu trách nhiệm đối chiếu nguồn hiện hành theo đúng mô hình đã chọn.
