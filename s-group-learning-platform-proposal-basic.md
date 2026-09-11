# S-Group Learning Platform — BE Basic Project

## 1. Project Overview

S-Group Learning Platform là một ứng dụng nội bộ hỗ trợ quản lý các lớp học và quá trình học tập của thành viên S-Group.

Project tập trung vào các kiến thức Backend Basic:

- REST API
- Database
- Authentication
- Authorization
- CRUD
- Business Logic
- Validation
- Error Handling

Mục tiêu của project là giúp các bạn thực hành việc chuyển từ Business Requirement thành một Backend Application hoàn chỉnh.

---

## 2. Learning Path

Learning path của S-Group:

```text
FE Basic
    ↓
BE Basic
    ↓
Specialization
    ├── Web
    ├── Mobile
    └── AI
```

Member không tự đăng ký từng môn học.

Admin là người quản lý việc member tham gia class.

Ví dụ:

```text
Admin
  ↓
Tạo BE Basic - Batch 01
  ↓
Chỉ định Mentor
  ↓
Thêm Member
```

Member sau đó có thể xem class và nội dung học của mình.

---

## 3. User Roles

MVP sử dụng 2 role:

### ADMIN

Có thể:

- Quản lý user
- Tạo class
- Chỉnh sửa class
- Chỉ định Mentor cho class
- Thêm/xóa Member khỏi class

### MEMBER

Có thể:

- Đăng nhập
- Xem profile
- Xem class mình tham gia
- Xem lesson
- Đánh dấu lesson đã hoàn thành
- Xem progress
- Xem assignment
- Submit assignment
- Xem score và feedback

### Mentor

Trong MVP không cần tạo role riêng.

Một User được xem là Mentor của một class khi user đó được gán vào trường `mentorId` của class.

Ví dụ:

```text
User A
role = MEMBER

BE Basic - Batch 01
mentorId = User A
```

Backend cần kiểm tra user có phải Mentor của class hay không trước khi cho phép Mentor thực hiện các action liên quan.

---

# 4. Class

Class là đơn vị mà Member tham gia.

Ví dụ:

```text
BE Basic - Batch 01
BE Basic - Batch 02
FE Basic - Batch 01
```

Thông tin tối thiểu:

```text
id
name
description
startDate
endDate
mentorId
```

Admin có thể:

- Create
- View
- Update
- Delete

Member chỉ có thể xem class mà mình tham gia.

---

# 5. Class Member

Admin là người thêm Member vào Class.

Member không tự enroll.

Ví dụ:

```text
BE Basic - Batch 01
│
├── Member A
├── Member B
└── Member C
```

Thông tin:

```text
classId
memberId
joinedAt
```

Business rule:

> Một Member không được thêm hai lần vào cùng một Class.

---

# 6. Lesson

Mentor của class có thể tạo và quản lý lesson.

Ví dụ:

```text
BE Basic - Batch 01
│
├── 01. Backend Introduction
├── 02. HTTP
├── 03. REST API
├── 04. Database
└── 05. Authentication
```

Lesson gồm:

```text
id
classId
title
content
order
createdBy
```

Mentor có thể:

- Create
- View
- Update
- Delete

Member có thể:

- View lesson

Member chỉ được xem lesson thuộc class mình tham gia.

---

# 7. Lesson Progress

Hệ thống cần lưu member đã hoàn thành lesson hay chưa.

Ví dụ:

```text
Lesson: HTTP

Member A → Completed
Member B → Not Completed
```

Có thể sử dụng entity:

```text
LessonProgress

id
lessonId
memberId
completedAt
```

Khi Member hoàn thành:

```http
POST /lessons/:id/complete
```

Không cần lưu progress percentage cho từng lesson.

---

# 8. Learning Progress

Progress của Member được tính dựa trên lesson.

Ví dụ:

```text
Total lessons: 10
Completed: 7

Progress: 70%
```

API có thể cung cấp:

```http
GET /classes/:id/progress
```

Response có thể gồm:

```json
{
  "totalLessons": 10,
  "completedLessons": 7,
  "progress": 70
}
```

---

# 9. Assignment

Mentor có thể tạo assignment cho class.

Ví dụ:

```text
BE Basic - Batch 01

Assignment 01
HTTP API

Assignment 02
CRUD API

Assignment 03
Authentication
```

Assignment gồm:

```text
id
classId
title
description
deadline
maximumScore
```

Mentor có thể:

- Create
- View
- Update
- Delete

Member có thể xem assignment của class mình.

---

# 10. Submission

Member có thể submit assignment.

Thông tin tối thiểu:

```text
id
assignmentId
memberId
content
repositoryUrl
submittedAt
score
feedback
reviewedAt
```

Member:

- Submit assignment
- Xem submission của mình
- Xem score
- Xem feedback

Mentor:

- Xem submission của member trong class
- Cho điểm
- Viết feedback

Không cần tạo entity `Review` riêng trong MVP.

---

# 11. Authentication

Hệ thống cần có:

```text
POST /auth/login
GET /auth/me
```

User đăng nhập bằng:

```text
Email
Password
```

Password phải được hash trước khi lưu database.

JWT có thể được sử dụng cho authentication.

---

# 12. Authorization

Backend phải kiểm tra quyền của user.

Ví dụ:

### Admin

Có quyền:

```text
Create Class
Add Member
Assign Mentor
Manage User
```

### Member

Có quyền:

```text
View My Class
View Lesson
Complete Lesson
Submit Assignment
View My Submission
```

### Mentor

Một Member được xem là Mentor nếu là `mentorId` của Class.

Mentor có quyền:

```text
Manage Lesson
Create Assignment
Review Submission
```

Ví dụ:

> Mentor của Class A không được sửa Lesson của Class B.

---

# 13. Main Entities

MVP chỉ cần các entity chính:

```text
User
Class
ClassMember
Lesson
LessonProgress
Assignment
Submission
```

Team phải tự thiết kế:

- Primary Key
- Foreign Key
- Relationships
- Constraints
- Index
- Delete behavior

---

# 14. API

Team tự thiết kế API.

Các API dưới đây chỉ là gợi ý:

```text
POST /auth/login
GET  /auth/me

GET   /users
GET   /users/:id
POST  /users
PATCH /users/:id

GET   /classes
GET   /classes/:id
POST  /classes
PATCH /classes/:id
DELETE /classes/:id

GET    /classes/:id/members
POST   /classes/:id/members
DELETE /classes/:id/members/:memberId

GET   /classes/:id/lessons
GET   /lessons/:id
POST  /classes/:id/lessons
PATCH /lessons/:id
DELETE /lessons/:id

POST /lessons/:id/complete
GET  /classes/:id/progress

GET   /classes/:id/assignments
GET   /assignments/:id
POST  /classes/:id/assignments
PATCH /assignments/:id
DELETE /assignments/:id

POST /assignments/:id/submissions
GET  /assignments/:id/submissions
GET  /submissions/:id

PATCH /submissions/:id/review
```

Team cần tự quyết định:

- HTTP Method
- URL
- Request body
- Response body
- Status code
- Authentication
- Authorization

---

# 15. Technical Requirements

Backend:

- Node.js
- Express hoặc NestJS
- TypeScript

Database:

- PostgreSQL hoặc MySQL

Yêu cầu:

- REST API
- Validation
- Error handling
- Authentication
- Authorization
- Database migration
- Database seed
- API documentation

Swagger/OpenAPI được khuyến khích.

---

# 16. Testing

MVP cần có một số automated tests cho các logic quan trọng.

Tối thiểu nên test:

- Login
- Authorization
- CRUD chính
- Validation
- Duplicate member trong class
- Member không được truy cập class khác
- Mentor không được quản lý class mình không phụ trách
- Score validation

Không yêu cầu test coverage cao.

---

# 17. Docker

Application nên có thể chạy bằng:

```bash
docker compose up
```

MVP tối thiểu:

```text
Backend
Database
```

---

# 18. Deliverables

Team cần nộp:

### 1. Requirement Analysis

- User Stories
- Use Cases
- Business Rules

### 2. ERD

Database design và relationships.

### 3. API Documentation

Danh sách API và request/response.

### 4. Backend Source Code

Source code hoàn chỉnh.

### 5. Database

- Migration
- Seed data

### 6. Tests

Automated tests cho các logic quan trọng.

### 7. Docker

Docker configuration.

### 8. README

Hướng dẫn setup và chạy project.

---

# 19. Development Phases

## Phase 1 — Analysis

Không code.

Deliver:

```text
Requirement
Use Case
ERD
API Design
```

## Phase 2 — Authentication

```text
Login
JWT
Authorization
```

## Phase 3 — Class

```text
User
Class
ClassMember
```

## Phase 4 — Learning

```text
Lesson
LessonProgress
Progress
```

## Phase 5 — Assignment

```text
Assignment
Submission
Review
```

## Phase 6 — Testing & Docker

```text
Tests
Migration
Seed
Docker
README
```

---

# 20. Definition of Done — Level 7

- [ ] Login hoạt động
- [ ] JWT authentication hoạt động
- [ ] Authorization hoạt động
- [ ] Admin tạo được Class
- [ ] Admin chỉ định Mentor
- [ ] Admin thêm Member vào Class
- [ ] Member xem được Class của mình
- [ ] Mentor tạo được Lesson
- [ ] Member xem được Lesson
- [ ] Member đánh dấu Lesson Completed
- [ ] Hệ thống tính được Progress
- [ ] Mentor tạo Assignment
- [ ] Member submit Assignment
- [ ] Mentor review Submission
- [ ] Member xem Score và Feedback
- [ ] Validation hoạt động
- [ ] Error handling hoạt động
- [ ] Business rules quan trọng được enforce
- [ ] Database migration/seed hoạt động
- [ ] API documentation có sẵn
- [ ] Có automated tests cơ bản
- [ ] Application chạy được bằng Docker

---

# 21. Optional Extensions

Các phần dưới đây **không bắt buộc**.

Team có khả năng có thể chọn thêm.

## Level 8

```text
Pagination
Filtering
Sorting
Search
```

## Level 9

```text
Class Schedule
File Upload
Assignment Resubmission
Submission History
Attendance
```

## Level 10

```text
Notification
Analytics
Activity Log
Advanced RBAC
AI Learning Assistant
Learning Recommendation
```

Mục tiêu:

```text
Level 7
    ↓
MVP hoàn chỉnh
    ↓
Level 8
    ↓
Level 9
    ↓
Level 10
```

Team không cần đạt Level 10 để được xem là hoàn thành project.

---

# 22. Challenge Questions

Trước khi code, team cần tự trả lời:

1. Entity nào cần có?
2. Quan hệ giữa các entity là gì?
3. Member completion nên lưu ở đâu?
4. Một Member có thể tham gia nhiều Class không?
5. Một Class có thể có bao nhiêu Mentor?
6. Làm sao xác định một user có phải Mentor của Class?
7. Member có được submit assignment nhiều lần không?
8. Member có được submit sau deadline không?
9. Mentor của Class A có được review submission của Class B không?
10. Làm sao tránh duplicate Member trong Class?
11. Khi xóa Class thì dữ liệu Lesson và Assignment xử lý thế nào?
12. API nào cần authentication?
13. API nào cần authorization?
14. Những field nào cần unique constraint?
15. Những field nào cần index?

---

# 23. Project Goal

Project không nhằm kiểm tra khả năng viết thật nhiều API.

Mục tiêu là các bạn có thể thực hiện được quy trình:

```text
Business Requirement
        ↓
Requirement Analysis
        ↓
Domain Model
        ↓
Database Design
        ↓
API Design
        ↓
Backend Implementation
        ↓
Testing
        ↓
Deployment
```

**Level 7 là mức hoàn thành kỳ vọng cho BE Basic.**

Các team có năng lực tốt có thể tiếp tục phát triển project thành một application nội bộ hoàn chỉnh thông qua các optional extensions.