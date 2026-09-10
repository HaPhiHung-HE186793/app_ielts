# 🚀 ROADMAP THƯƠNG MẠI HÓA — MỖI NGÀY IELTS PLATFORM
> Tài liệu này là bản đồ phát triển cấp phòng dev chuyên nghiệp, bao gồm đầy đủ bộ phận từ Product, Design, Engineering, DevOps, QA, Marketing đến Business. Mọi task đều có Owner, Priority, Acceptance Criteria và Dependencies rõ ràng.

---

## 📐 CẤU TRÚC TỔ CHỨC & PHÂN QUYỀN

| Bộ phận | Vai trò | Trách nhiệm chính |
|---|---|---|
| **PM / Product Owner** | Định hướng sản phẩm | Roadmap, prioritization, OKRs, stakeholder |
| **UX/Design** | Trải nghiệm người dùng | User research, wireframes, design system, usability test |
| **Frontend Engineering** | React/TypeScript/PWA | Components, state, performance, a11y |
| **Backend Engineering** | Node.js/PostgreSQL | API, Auth, DB schema, security |
| **DevOps/Infra** | CI/CD, Cloud | Pipeline, monitoring, scaling, cost |
| **QA** | Chất lượng | Automated tests, regression, security scan |
| **Data/Analytics** | Dữ liệu học thuật | Event tracking, dashboards, A/B test |
| **Content/Pedagogy** | Học liệu | Curriculum design, rubric, giáo viên review |
| **Marketing/Growth** | Tăng trưởng | SEO, landing page, user acquisition, retention |
| **Business/Legal** | Thương mại | Pricing, ToS, Privacy Policy, GDPR |

---

## 🏔️ CÁC MỐC CHIẾN LƯỢC (MILESTONES)

```
M0: Foundation Complete     [✅ DONE]  — Cloud Live, Auth, PWA, 28 bài, Sync
M1: Closed Beta             [⬜ NOW]   — 50 user thật, OTP đăng nhập, AI feedback
M2: Open Beta               [⬜ Q4]    — 500 user, thanh toán, 4 kỹ năng IELTS
M3: Commercial Launch       [⬜ Q1+1]  — App Store/Google Play, 5,000 MAU
M4: Scale & Monetize        [⬜ Q3+1]  — Premium tiers, B2B, 50,000 MAU
```

---

## 🟢 PHASE 0 — FOUNDATION (ĐANG HOÀN THIỆN)

> **Mục tiêu:** Hệ thống cloud stable để bắt đầu Closed Beta.

### [INFRA-001] `IN_PROGRESS` — Neon DB Migration & Production Ready
- **Owner:** Backend
- **Priority:** 🔴 Critical
- **Acceptance Criteria:**
  - [ ] 001_initial.sql chạy thành công trên Neon production
  - [ ] REVOKE neon_superuser FROM moi_ngay_runtime; thành công
  - [ ] check_setup.sql trả version=1, grants đúng (moi_ngay_api, moi_ngay_worker)
  - [ ] /api/readyz trả {"status":"ready"} từ domain Vercel
  - [ ] Đăng nhập Email OTP thật hoạt động end-to-end

### [INFRA-002] `TODO` — Production Monitoring & Alerting
- **Owner:** DevOps
- **Priority:** 🔴 Critical
- **Acceptance Criteria:**
  - [ ] Uptime monitoring (Betterstack / UptimeRobot) cho /api/healthz
  - [ ] Error alerting qua Telegram/Email khi backend down >2 phút
  - [ ] Render log retention >7 ngày
  - [ ] Neon DB metrics dashboard (compute hours, storage)

### [INFRA-003] `TODO` — Custom Domain & SSL
- **Owner:** DevOps + PM
- **Priority:** 🟡 High
- **Acceptance Criteria:**
  - [ ] Domain thật mua (gợi ý: moingay.app hoặc luyen.io)
  - [ ] Vercel custom domain + auto SSL
  - [ ] HSTS, HTTPS-only, security headers đạt securityheaders.com >= A
  - [ ] Cập nhật Neon Trusted Domains, Render APP_ORIGINS

### [QA-001] `TODO` — End-to-End Test Suite trên Production Domain
- **Owner:** QA
- **Priority:** 🔴 Critical
- **Acceptance Criteria:**
  - [ ] Playwright E2E test chạy được trên https://<domain>
  - [ ] Luồng: đăng nhập OTP → học bài → đồng bộ → đăng xuất
  - [ ] Test CI tự động trên mỗi PR vào main

---

## 🔵 PHASE 1 — CLOSED BETA (50 users)

> **Mục tiêu:** Sản phẩm đủ dùng cho người thật học IELTS. Tập trung lấy data và feedback.

### 📊 OKR PHASE 1
| Objective | Key Result |
|---|---|
| Người dùng thật học được hằng ngày | 70% user hoàn thành >=1 bài/ngày trong 2 tuần đầu |
| Hệ thống ổn định | Uptime >=99%, <3 bug P0 trong 30 ngày |
| Lấy được insight sản phẩm | 80% user điền khảo sát sau 7 ngày |

---

### 🎨 UX/DESIGN TRACK

#### [UX-001] `TODO` — User Research: Chân dung người học IELTS Việt Nam
- **Owner:** UX
- **Priority:** 🔴 Critical
- **Deliverables:**
  - [ ] Interview 10 người học IELTS (target: sinh viên, người đi làm muốn du học)
  - [ ] 3 User Personas: "Người mất gốc 0→5.0", "Người trung cấp 5.0→6.5", "Nâng cao 6.5+"
  - [ ] Pain points map, jobs-to-be-done, motivation triggers
  - [ ] Competitive analysis: Duolingo, ELSA, EF English, Monkey Junior, Lingo

#### [UX-002] `TODO` — Design System v1
- **Owner:** UX + Frontend
- **Priority:** 🟡 High
- **Deliverables:**
  - [ ] Color palette với tokens (Primary, Neutral, Error, Success, Warning)
  - [ ] Typography scale (Be Vietnam Pro, size/weight tokens)
  - [ ] Spacing system (4px base grid)
  - [ ] Component library: Button, Input, Card, Badge, Toast, Modal, Skeleton
  - [ ] Dark mode tokens
  - [ ] Figma design file (export cho team)

#### [UX-003] `TODO` — Mobile-First UI Overhaul
- **Owner:** UX + Frontend
- **Priority:** 🟡 High
- **Deliverables:**
  - [ ] Redesign màn hình Hôm nay — cảm giác "coach cá nhân"
  - [ ] Lesson player: thanh tiến độ đẹp, animation smooth khi chuyển câu
  - [ ] Onboarding flow mới: <3 bước, visual và motivational
  - [ ] Empty state illustrations (SVG gốc)
  - [ ] Micro-animations (CSS transitions hoặc Framer Motion)

#### [UX-004] `TODO` — Accessibility Audit & Fix
- **Owner:** UX + QA
- **Priority:** 🟡 High
- **Acceptance Criteria:**
  - [ ] WCAG 2.1 AA toàn bộ core flows
  - [ ] Screen reader test (VoiceOver iOS, TalkBack Android)
  - [ ] Keyboard navigation 100% functional
  - [ ] Color contrast ratio >= 4.5:1

---

### 🤖 AI TRACK

#### [AI-001] `IN_PROGRESS` — AI Writing & Speaking Feedback Engine
- **Owner:** Backend + Content
- **Priority:** 🔴 Critical
- **Acceptance Criteria:**
  - [ ] Provider chốt sau đánh giá (gpt-4.1-mini, Claude Haiku, Gemini Flash)
  - [ ] API key + budget được xác nhận
  - [ ] Feedback schema chuẩn IELTS: score 0-9, strengths, improvements, example_correction
  - [ ] Latency P95 < 5 giây
  - [ ] 10 sample outputs đã qua giáo viên review và rubric IELTS
  - [ ] Cost per feedback request < $0.01

#### [AI-002] `TODO` — Speaking Practice: Record & Feedback
- **Owner:** Frontend + Backend + Content
- **Priority:** 🟡 High
- **Acceptance Criteria:**
  - [ ] Browser MediaRecorder API: bắt đầu, dừng, nghe lại, gửi, hủy
  - [ ] File size limit: 2MB per recording, 30s max
  - [ ] Transcription: Whisper hoặc Deepgram
  - [ ] Pronunciation score + 3 điểm cải thiện cụ thể
  - [ ] Audio không lưu server > 24h (policy rõ ràng)
  - [ ] Works on iOS Safari (mediaDevices.getUserMedia)

#### [AI-003] `TODO` — Writing Practice: Draft → Submit → Feedback
- **Owner:** Frontend + Backend
- **Priority:** 🟡 High
- **Acceptance Criteria:**
  - [ ] Auto-save draft mỗi 5s
  - [ ] Word count indicator realtime
  - [ ] Submit → loading state → feedback trong 10s
  - [ ] Highlight in-text: từng lỗi có tooltip giải thích
  - [ ] "Rewrite this sentence" gợi ý 3 phương án, không viết hộ toàn bài

#### [AI-004] `TODO` — AI Safety & Rate Limiting Production
- **Owner:** Backend + DevOps
- **Priority:** 🔴 Critical
- **Acceptance Criteria:**
  - [ ] 10 requests/user/ngày (có thể nâng cho Premium)
  - [ ] Budget cap: $5 tổng/ngày, alert khi chạm 80%
  - [ ] Input sanitization: strip injection, max 2000 chars
  - [ ] PII detection: không log nội dung bài người dùng
  - [ ] Abuse detection: rate limit by IP + user_id

---

### 📚 CONTENT TRACK

#### [CONTENT-003] `TODO` — Curriculum 6 Tháng (24 Tuần) đầy đủ
- **Owner:** Content + Pedagogy
- **Priority:** 🔴 Critical
- **Deliverables:**
  - [ ] Tuần 1-4: Nền tảng (28 bài hiện có ✅)
  - [ ] Tuần 5-8: Hội thoại hàng ngày, đọc hiểu ngắn, viết câu (28 bài mới)
  - [ ] Tuần 9-12: IELTS Reading Band 4-5, Listening Part 1-2 (28 bài mới)
  - [ ] Tuần 13-16: IELTS Writing Task 1 cơ bản, Speaking Part 1 (28 bài mới)
  - [ ] Tuần 17-20: IELTS Reading Band 5-6, Listening Part 3-4 (28 bài mới)
  - [ ] Tuần 21-24: IELTS Writing Task 2, Speaking Part 2-3, Mock Tests (28 bài mới)
  - [ ] Tất cả học liệu qua giáo viên IELTS certified review

#### [CONTENT-004] `TODO` — IELTS Mock Test Full (4 kỹ năng)
- **Owner:** Content + Backend
- **Priority:** 🟠 Medium
- **Acceptance Criteria:**
  - [ ] Reading: 40 câu, 60 phút timed
  - [ ] Listening: 40 câu, audio thật, 30 phút
  - [ ] Writing: Task 1 + Task 2, 60 phút, auto-save
  - [ ] Speaking: 3 parts, record + AI feedback
  - [ ] Kết quả KHÔNG quy đổi trực tiếp thành band IELTS; nhãn "AI estimate"

#### [CONTENT-005] `TODO` — Audio Quality Upgrade
- **Owner:** Content
- **Priority:** 🟠 Medium
- **Acceptance Criteria:**
  - [ ] Thay 57 WAV eSpeak bằng giọng tự nhiên (Google TTS WaveNet hoặc ElevenLabs)
  - [ ] UK và US accent variants
  - [ ] Kiểm tra phát âm chuẩn bởi native speaker
  - [ ] File size optimization: OGG/OPUS thay WAV khi phù hợp

---

### ⚙️ ENGINEERING TRACK

#### [ENG-001] `TODO` — Code Splitting & Performance
- **Owner:** Frontend
- **Priority:** 🟡 High
- **Acceptance Criteria:**
  - [ ] Bundle size main JS < 250KB gzipped (hiện ~182KB — cần code split route)
  - [ ] Dynamic import cho từng feature route
  - [ ] Lighthouse Performance >= 90 trên Mobile
  - [ ] First Contentful Paint < 1.5s trên 4G

#### [ENG-002] `TODO` — Advanced Offline & Background Sync
- **Owner:** Frontend + Backend
- **Priority:** 🟡 High
- **Acceptance Criteria:**
  - [ ] Background Sync API: gửi bài khi có mạng dù app đã đóng
  - [ ] Periodic Background Sync: cập nhật học liệu mỗi 24h
  - [ ] Offline indicator nổi bật + fallback UI graceful
  - [ ] IndexedDB migration strategy (schema versioning)

#### [ENG-003] `TODO` — Error Tracking (Sentry)
- **Owner:** Frontend + Backend
- **Priority:** 🔴 Critical
- **Acceptance Criteria:**
  - [ ] Sentry: Frontend (React error boundaries) + Backend (Express errors)
  - [ ] Source maps upload cho production builds
  - [ ] Error grouping, alert rules (P0: >5 errors/5min)
  - [ ] PII scrubbing: không log email, OTP, content bài cá nhân

#### [ENG-004] `TODO` — CI/CD Pipeline
- **Owner:** DevOps
- **Priority:** 🔴 Critical
- **Acceptance Criteria:**
  - [ ] GitHub Actions: lint + typecheck + test trên mỗi PR
  - [ ] Auto-deploy main → Vercel (frontend) + trigger Render (backend)
  - [ ] Preview deployments cho mỗi PR
  - [ ] Build badge trên README

#### [ENG-005] `TODO` — Security Hardening
- **Owner:** Backend
- **Priority:** 🔴 Critical (trước khi nhận tiền)
- **Acceptance Criteria:**
  - [ ] Rate limit: 100 req/min/IP cho public endpoints
  - [ ] Helmet.js security headers
  - [ ] OWASP Top 10 checklist hoàn thành
  - [ ] Dependency scan: npm audit + Snyk
  - [ ] Brute force OTP: max 5 attempts, lockout 15 phút

---

### 💼 BUSINESS TRACK

#### [BIZ-001] `TODO` — Pricing Strategy & Tiers
- **Owner:** PM + Business
- **Priority:** 🔴 Critical (trước Open Beta)
- **Deliverables:**
  - [ ] **Free:** Học guest 5 bài/ngày, không AI, không sync
  - [ ] **Freemium (có tài khoản):** Unlimited bài 4 tuần, 3 AI feedback/ngày, sync 2 thiết bị
  - [ ] **Premium ~99k VNĐ/tháng:** Toàn bộ 6 tháng, AI không giới hạn, offline full
  - [ ] **Team/Lớp:** Dashboard giáo viên, quản lý học viên (liên hệ báo giá)
  - [ ] A/B test pricing page

#### [BIZ-002] `TODO` — Payment Integration
- **Owner:** Backend + Business
- **Priority:** 🟡 High (cần cho Open Beta)
- **Acceptance Criteria:**
  - [ ] Stripe (international) + VNPay/MoMo (Vietnam local)
  - [ ] Webhook: payment success → upgrade plan trong DB
  - [ ] Invoice email tự động
  - [ ] PCI DSS compliance (không lưu thông tin thẻ)
  - [ ] Chính sách hoàn tiền rõ ràng trong ToS

#### [BIZ-003] `TODO` — Legal: ToS, Privacy Policy & PDPD Compliance
- **Owner:** Business + Legal
- **Priority:** 🔴 Critical (trước khi nhận user thật)
- **Deliverables:**
  - [ ] Terms of Service (Tiếng Việt + English)
  - [ ] Privacy Policy tuân thủ PDPD Việt Nam và GDPR
  - [ ] Cookie Policy, AI content disclosure
  - [ ] Consent flow khi đăng ký

#### [BIZ-004] `TODO` — Subscription Management Self-Service
- **Owner:** Backend + Frontend
- **Priority:** 🟡 High
- **Acceptance Criteria:**
  - [ ] Dashboard: "Gói hiện tại", ngày gia hạn, lịch sử thanh toán
  - [ ] Upgrade/Downgrade/Cancel tự phục vụ
  - [ ] Grace period 3 ngày sau hết gói (không mất data)
  - [ ] Email nhắc 7/3/1 ngày trước hết hạn

---

## 🟡 PHASE 2 — OPEN BETA (500 users)

### 📊 OKR PHASE 2
| Objective | Key Result |
|---|---|
| Revenue dương | MRR >= 10 triệu VNĐ sau 60 ngày |
| Retention tốt | Day-30 retention >= 25% |
| Chất lượng cao | NPS >= 40, <1% crash rate |

### [DATA-004] `TODO` — Product Analytics
- **Owner:** Data + Frontend
- **Priority:** 🔴 Critical
- **Acceptance Criteria:**
  - [ ] PostHog (self-hosted) hoặc Mixpanel tích hợp
  - [ ] Events: lesson_started, lesson_completed, ai_feedback_requested, subscription_started
  - [ ] Funnel: Signup → First Lesson → Day 7 → Day 30 → Premium
  - [ ] KHÔNG gửi nội dung bài, email vào analytics

### [MKT-001] `TODO` — Landing Page Chuyên Nghiệp
- **Owner:** Marketing + UX
- **Priority:** 🔴 Critical
- **Acceptance Criteria:**
  - [ ] Hero: "Luyện IELTS theo nhịp của bạn, mỗi ngày một ít"
  - [ ] Social proof counter, demo video 60 giây, testimonials 5 user thật
  - [ ] FAQ 10 câu, CTA "Học thử miễn phí"
  - [ ] Lighthouse SEO >= 95, Performance >= 90

### [MKT-002] `TODO` — SEO Content Blog
- **Owner:** Marketing + Content
- **Priority:** 🟡 High
- **Deliverables:**
  - [ ] 20 bài blog IELTS tips, keyword volume >500/tháng tại VN
  - [ ] Schema markup (Article, FAQPage, HowTo)
  - [ ] Blog trên cùng domain (SEO juice)

### [MKT-003] `TODO` — Community & Social
- **Owner:** Marketing
- **Priority:** 🟡 High
- **Deliverables:**
  - [ ] Facebook Group "Cộng đồng IELTS Mỗi Ngày"
  - [ ] TikTok: "1 phút học IELTS" 3 video/tuần target 18-25 tuổi
  - [ ] Discord server cho early users (direct feedback)

### [MKT-004] `TODO` — Referral Program
- **Owner:** Marketing + Backend
- **Priority:** 🟠 Medium
- **Acceptance Criteria:**
  - [ ] Referral link riêng mỗi user
  - [ ] Reward: 1 tháng Premium sau 3 người giới thiệu
  - [ ] Dashboard theo dõi referral trong app

---

## 🔴 PHASE 3 — COMMERCIAL LAUNCH (5,000 MAU)

### [SCALE-001] `TODO` — Infrastructure Scaling
- **Owner:** DevOps
- **Priority:** 🟡 High
- **Acceptance Criteria:**
  - [ ] Render upgrade sang Standard (không cold start)
  - [ ] CDN Cloudflare cho static assets
  - [ ] Database read replica cho analytics
  - [ ] Load test: 1,000 concurrent users, P99 < 2s

### [MOBILE-003] `TODO` — Native App (Capacitor)
- **Owner:** Mobile + Frontend
- **Priority:** 🟠 Medium
- **Acceptance Criteria:**
  - [ ] Capacitor wrapper: Android APK + iOS IPA
  - [ ] Google Play Store listing đầy đủ
  - [ ] Apple App Store Review Guidelines compliance
  - [ ] Push notification native (FCM + APNs)

### [COACH-001] `TODO` — Dashboard Giáo Viên (B2B)
- **Owner:** Frontend + Backend
- **Priority:** 🟠 Medium
- **Acceptance Criteria:**
  - [ ] Giáo viên xem tiến độ học viên (chỉ người đã chia sẻ)
  - [ ] Giao bài thêm, nhận xét Writing/Speaking
  - [ ] Học viên không xem chéo dữ liệu nhau
  - [ ] Pricing: gói "Lớp học" theo số học viên

---

## 🔒 SECURITY & COMPLIANCE (Xuyên suốt tất cả phases)

### [SEC-001] `TODO` — Security Audit Checklist
- **Owner:** Backend + DevOps
- **Priority:** 🔴 Critical (trước khi nhận tiền)
- **Checklist:**
  - [ ] OWASP Top 10 audit
  - [ ] Dependency scan: npm audit, Snyk
  - [ ] Secret rotation policy (mỗi 90 ngày)
  - [ ] GDPR right to erasure: API xóa toàn bộ dữ liệu user
  - [ ] Backup policy: daily Neon DB snapshot, test restore hàng tháng

### [SEC-002] `TODO` — Data Privacy Implementation
- **Owner:** Backend + Legal
- **Priority:** 🔴 Critical
- **Acceptance Criteria:**
  - [ ] DELETE /api/account: xóa hoàn toàn profile, snapshots, reminders, AI logs
  - [ ] GET /api/account/export: trả JSON toàn bộ dữ liệu user (GDPR right)
  - [ ] Data classification: PII vs Learning data vs Content

---

## 📏 ĐỊNH NGHĨA "DONE" CHUẨN PHÒNG DEV

Một task chỉ được đánh dấu **DONE** khi đủ **TẤT CẢ**:

1. ✅ Code review: approve >=1 reviewer
2. ✅ Unit tests pass, coverage >=80% cho logic nghiệp vụ
3. ✅ E2E test: happy path + critical error paths
4. ✅ QA sign-off trên thiết bị thật (không chỉ emulator)
5. ✅ WCAG 2.1 AA: không có vi phạm mới
6. ✅ Performance: không regression Lighthouse >5 điểm
7. ✅ Security: không expose secret, không log PII
8. ✅ Docs: README/CHANGELOG/API docs cập nhật
9. ✅ Deployed: đang chạy production, không chỉ staging

---

## 📊 KPIs THEO DÕI HÀNG TUẦN

| KPI | Target Phase 1 | Target Phase 2 | Cách đo |
|---|---|---|---|
| Daily Active Users (DAU) | 20 | 150 | Analytics |
| Day-7 Retention | 40% | 50% | Cohort |
| Day-30 Retention | 15% | 25% | Cohort |
| Lessons completed/user/day | 2 | 3 | Analytics |
| AI feedback satisfaction | - | >=4/5 | In-app rating |
| Uptime | 99% | 99.5% | Uptime monitor |
| P95 API latency | <2s | <1s | Render metrics |
| MRR | 0 | 10M VNĐ | Stripe |
| NPS | - | >=40 | Khảo sát 30 ngày |

---

## 🗓️ SPRINT TEMPLATE (2 tuần/sprint)

```
Sprint N (DD/MM — DD/MM)
━━━━━━━━━━━━━━━━━━━━━━━━
Goal: <1 câu mô tả mục tiêu sprint>

MUST HAVE:
  [ ] TICKET-XXX: Tên task — Owner — Estimate (days)

SHOULD HAVE:
  [ ] TICKET-XXX: ...

BLOCKED:
  TICKET-XXX: Lý do blocked

Review date: DD/MM | Demo: <URL staging>
```
