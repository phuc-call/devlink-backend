# devlink-backend
# DevLink — Social Network for Developers

A microservices-based social platform built for IT students and developers.  
DevLink supports posts, comments, reactions, video feeds, real-time notifications, learning templates, badge system, and content moderation.

---

## Architecture Overview

```
[React Frontend :5173]
        │  HTTP (proxy /api → :8080)
        ▼
[Gateway Service :8080]
  - JWT validation (jjwt 0.12.6)
  - Rate limiting via Redis
  - CORS allow origin: http://localhost:5173
  - Strips X-User-Id / X-User-Role / X-User-Email từ client
  - Inject lại 3 header trên sau khi validate JWT thành công
  - Blocks X-Internal-Secret từ phía client
        │
        ├──► [User Service :8080 (internal)]
        ├──► [Post Service :8082]
        └──► [Chat Service]
                │
        [Eureka Server :8761]   — Service registry
                │
     ┌──────────┴──────────┐
   Kafka :9092           Redis :6379
 (async events)    
                │
             MinIO :9000
          (media file storage)
```

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Language | Java | 21 |
| Backend framework | Spring Boot | 3.4.5 (user/post/chat), 3.5.13 (gateway/eureka) |
| Service discovery | Spring Cloud Netflix Eureka | 2024.0.1 / 2025.0.1 |
| API Gateway | Spring Cloud Gateway (WebFlux) | 2025.0.1 |
| Inter-service call | Spring Cloud OpenFeign | — |
| Load balancing | Spring Cloud LoadBalancer | — |
| Circuit breaker & retry | Resilience4j | 2.2.0 |
| JWT | jjwt | 0.12.6 |
| Messaging | Apache Kafka | 7.5.0 (Confluent image) |
| Cache | Redis (Lettuce pool) | alpine |
| In-memory cache | Caffeine | — |
| Database | MySQL | 8.0 |
| DB migration | Flyway | — |
| Media storage | MinIO | latest |
| Frontend | React 19 + TypeScript + Vite + TailwindCSS 4 | — |
| State management | Zustand | 5.0.12 |
| HTTP client (FE) | Axios | 1.15.2 |
| Build tool | Maven (wrapper included) | 3.9.6 |
| Container | Docker + Docker Compose | — |

---

## Prerequisites

Cài đặt trước khi chạy:

| Tool | Version yêu cầu | Kiểm tra |
|---|---|---|
| Docker Desktop | 24+ | `docker --version` |
| Node.js | 20+ | `node --version` |
| Java JDK | 21 | `java --version` (chỉ cần nếu chạy local không dùng Docker) |

> Maven **không cần cài** — mỗi service có sẵn `mvnw` wrapper.

---

## Cấu trúc project

```
DevLink/
├── eureka-server/        # Service registry
├── gateway-service/      # API Gateway — JWT, routing, rate limit, CORS
├── user-service/         # Auth, profile, follow, badge, notification, OTP
├── post-service/         # Post, comment, reaction, video feed, report, template
├── chat-service/         # Real-time chat
├── devlink_frontend/     # React + TypeScript + Vite
├── docker-compose.yml
└── .env                  # Secrets (không commit lên git)
```

---

## Chạy bằng Docker (khuyên dùng)

### 1. Clone repo

```bash
git clone https://github.com/phuc-call/devlink-backend.git
cd DevLink
```

### 2. Tạo file `.env`

Tạo file `.env` ở thư mục gốc `DevLink/` với nội dung:

```env
# Gmail App Password — dùng để gửi OTP
MAIL_USERNAME=your_gmail@gmail.com
MAIL_PASSWORD=your_16_char_app_password

# MinIO
MINIO_USER=demo
MINIO_PASSWORD=demo
MINIO_BUCKET=demo

# Secret dùng cho giao tiếp nội bộ giữa các service
INTERNAL_SECRET=your_random_secret_here
```

> Để lấy Gmail App Password: Google Account → Security → 2-Step Verification → App Passwords.

### 3. Khởi động toàn bộ hệ thống

```bash
docker compose up --build
```

Docker Compose tự xử lý thứ tự khởi động qua `depends_on` + healthcheck:

```
Zookeeper
  └── Kafka
        └── MySQL ×3 + Redis + MinIO
              └── Eureka Server
                    └── User Service + Post Service + Chat Service
                          └── Gateway Service
```

> Lần đầu chạy mất khoảng **3–5 phút** do Docker pull image và build service.

### 4. Kiểm tra hệ thống

| URL | Mô tả |
|---|---|
| http://localhost:8761 | Eureka Dashboard — xem service nào đã đăng ký |
| http://localhost:8080 | API Gateway |
| http://localhost:9001 | MinIO Console (user: `devlink_admin`, pass: `devlink_secret_123`) |
| http://localhost:8080/swagger-ui.html | Swagger UI (aggregate tất cả service) |

### 5. Dừng hệ thống

```bash
docker compose down          # dừng, giữ data
docker compose down -v       # dừng và xóa toàn bộ volume (wipe data)
```

---

## Chạy Frontend

Frontend **không nằm trong Docker Compose**, chạy riêng:

```bash
cd devlink_frontend
npm install
npm run dev
```

Frontend chạy tại: **http://localhost:5173**

Vite proxy tự động chuyển `/api/*` sang `http://localhost:8080` (cấu hình trong `vite.config.ts`), nên không cần cấu hình thêm.

> **Yêu cầu:** Gateway phải đang chạy tại port 8080 trước khi mở frontend.

### Các script frontend

| Script | Lệnh | Mô tả |
|---|---|---|
| Dev server | `npm run dev` | Chạy development với hot reload |
| Build | `npm run build` | Build production |
| Lint | `npm run lint` | Kiểm tra code |
| Preview | `npm run preview` | Preview bản build |

---

## Chạy từng service local (không dùng Docker)

Nếu muốn chạy service riêng lẻ để debug:

### Bước 1 — Khởi động infrastructure

```bash
docker compose up zookeeper kafka user-db post-db chat-db redis minio eureka-server
```

### Bước 2 — Chạy service muốn debug

```bash
cd user-service
./mvnw spring-boot:run
```

Lặp lại cho `post-service`, `gateway-service`, `chat-service` nếu cần.

> Các `application.yml` đều có giá trị mặc định fallback `localhost`, nên service chạy local sẽ kết nối được với infrastructure trong Docker.

---

## Thông tin Database

Mỗi service dùng database MySQL riêng biệt:

| Service | Port (host) | Database |
|---|---|---|
| user-service | 3307 | user_db |
| post-service | 3308 | post_db |
| chat-service | 3309 | chat_db |

Schema được tạo tự động bởi **Flyway** khi service khởi động. Không cần import SQL thủ công.

---

## Luồng bảo mật — Giải thích chi tiết

Hệ thống DevLink dùng **2 lớp bảo mật độc lập**:

### Lớp 1 — Xác thực người dùng (JWT)

```
Client                    Gateway                   User/Post Service
  │                          │                              │
  │── POST /auth/login ──────►│                              │
  │                          │──── forward ────────────────►│
  │                          │◄─── trả về accessToken+refreshToken
  │◄─── trả về token ────────│                              │
  │                          │                              │
  │── GET /api/posts ────────►│                              │
  │   Header: Bearer <JWT>   │                              │
  │                          │ 1. Validate JWT (jjwt 0.12.6)│
  │                          │ 2. Extract: userId/email/role│
  │                          │ 3. XÓA header gốc từ client  │
  │                          │    (chống giả mạo)           │
  │                          │ 4. Inject lại header mới:    │
  │                          │    X-User-Id: 123            │
  │                          │    X-User-Role: ROLE_USER    │
  │                          │    X-User-Email: ...         │
  │                          │──── forward với header ─────►│
  │                          │                              │ 5. HeaderAuthFilter đọc
  │                          │                              │    X-User-Id, X-User-Role
  │                          │                              │    → set SecurityContext
```

**Access token:** hết hạn sau 15 phút (`expiration: 900000` ms).  
**Refresh token:** lưu hash SHA-256 trong DB, hết hạn sau 30 ngày, xoay vòng mỗi lần dùng.  
**Blacklist:** access token bị logout được lưu trong Redis cho đến khi hết hạn.

### Lớp 2 — Xác thực nội bộ giữa các service (Internal Secret)

Khi `post-service` cần gọi sang `user-service` (qua Feign client), không dùng JWT của user:

```
post-service (FeignClientConfig)         user-service (InternalAuthFilter)
        │                                          │
        │── GET /internal/users/info ─────────────►│
        │   Header: X-Internal-Secret: <secret>    │
        │   Header: X-User-Id: 123 (forward lại)   │ 1. Kiểm tra path bắt đầu /internal/
        │                                          │ 2. So sánh X-Internal-Secret với
        │                                          │    biến môi trường INTERNAL_SECRET
        │                                          │ 3. Nếu sai → 403 Forbidden ngay
        │◄─── trả về data ─────────────────────────│ 4. Nếu đúng → xử lý bình thường
```

**`INTERNAL_SECRET`** được load từ file `.env` → inject vào container qua `docker-compose.yml` → đọc trong `application.yml` qua `${INTERNAL_SECRET}`.  
Gateway **chặn** header `X-Internal-Secret` từ phía client — client bên ngoài không thể giả mạo internal call.

### Tóm tắt các header bảo mật

| Header | Ai set | Ai nhận | Mục đích |
|---|---|---|---|
| `Authorization: Bearer <JWT>` | Client | Gateway | Xác thực người dùng |
| `X-User-Id` | Gateway | User/Post/Chat Service | Identity sau khi JWT đã được validate |
| `X-User-Role` | Gateway | User/Post/Chat Service | Phân quyền ROLE_USER / ROLE_ADMIN |
| `X-User-Email` | Gateway | User/Post/Chat Service | Email người dùng |
| `X-Internal-Secret` | Feign client (post/chat) | User Service `/internal/**` | Xác thực service-to-service |

---

## Biến môi trường

### File `.env` (thư mục gốc DevLink/)

| Biến | Mô tả | Dùng bởi |
|---|---|---|
| `MAIL_USERNAME` | Gmail address gửi OTP | user-service |
| `MAIL_PASSWORD` | Gmail App Password (16 ký tự) | user-service |
| `MINIO_USER` | MinIO root username | post-service, docker-compose |
| `MINIO_PASSWORD` | MinIO root password | post-service, docker-compose |
| `MINIO_BUCKET` | Tên bucket lưu media | post-service |
| `INTERNAL_SECRET` | Secret cho internal service call | post-service, user-service |

### File `devlink_frontend/.env`

| Biến | Giá trị mặc định | Mô tả |
|---|---|---|
| `VITE_API_GATEWAY_URL` | `http://localhost:8080` | URL của Gateway (hiện tại frontend dùng Vite proxy, biến này là tham chiếu) |

### Biến hardcode trong `docker-compose.yml` (chỉ dùng local dev)

| Biến | Giá trị | Ghi chú |
|---|---|---|
| `JWT_SECRET` | `5ZVnyGvacZRrCczj+...` | Đổi trước khi deploy production |
| `DB_USER` / `DB_PASS` | `root` / `root` | Đổi trước khi deploy production |

---

## Tính năng chính

- **Authentication** — Đăng ký/đăng nhập, JWT access token (15 phút) + refresh token rotation (30 ngày), blacklist token bằng Redis, OTP qua Gmail, đăng nhập Google OAuth2
- **Post & Comment** — Tạo bài đăng với ảnh/video (upload lên MinIO), comment, reply, reaction
- **Video Feed** — Xếp hạng theo điểm ưu tiên (badge weight, follower count, like count), config-driven qua `VideoFeedProperties`
- **Badge System** — Tự động evaluate và cấp thủ công, giới hạn upload video theo badge
- **Follow System** — Follow/unfollow, visibility `FOLLOWERS_ONLY`
- **Learning Templates** — Admin quản lý, cộng đồng propose/fork
- **Report & Moderation** — Strategy Pattern handler per target type, async media cleanup qua Kafka
- **Notifications** — Real-time, có section ẩn với PIN
- **Rate Limiting** — Theo IP và theo user tại Gateway qua Redis

---

## Lưu ý quan trọng
- Chat-service trong quá trình xây dựng
- Nếu service khởi động lỗi, kiểm tra Eureka trước: http://localhost:8761. Service phải xuất hiện tại đây trước khi Gateway route được.
- Flyway chạy migration tự động khi service start — không sửa file migration đã tồn tại.
- File upload tối đa: 200MB/file, 500MB/request (cấu hình trong post-service).
- CORS chỉ cho phép `http://localhost:5173` — nếu đổi port frontend thì phải sửa `SecurityConfig` của gateway.
- `INTERNAL_SECRET` không được để trống — post-service sẽ không gọi được user-service.
