DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS lesson_progress CASCADE;
DROP TABLE IF EXISTS lessons CASCADE;
DROP TABLE IF EXISTS class_members CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS users CASCADE;


CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    age INT CHECK (age >= 0) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'MEMBER',
    avatar_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_users_role CHECK (role IN ('ADMIN', 'MEMBER')),
    CONSTRAINT uq_users_email UNIQUE (email)
);

COMMENT ON TABLE users IS 'Bảng lưu trữ thông tin người dùng trong hệ thống S-Group';
COMMENT ON COLUMN users.age IS 'Tuổi của người dùng';
COMMENT ON COLUMN users.role IS 'Vai trò tài khoản: ADMIN hoặc MEMBER (Mentor là Member phụ trách lớp)';

CREATE TABLE classes (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    mentor_id BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_classes_mentor FOREIGN KEY (mentor_id) 
        REFERENCES users(id) ON DELETE RESTRICT,

    CONSTRAINT chk_classes_dates CHECK (
        start_date IS NULL OR end_date IS NULL OR end_date >= start_date
    )
);

COMMENT ON TABLE classes IS 'Bảng lưu trữ thông tin các lớp học';
COMMENT ON COLUMN classes.mentor_id IS 'ID của User được chỉ định làm Mentor phụ trách lớp học';

CREATE TABLE class_members (
    id BIGSERIAL PRIMARY KEY,
    class_id BIGINT NOT NULL,
    member_id BIGINT NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT fk_class_members_class FOREIGN KEY (class_id) 
        REFERENCES classes(id) ON DELETE CASCADE,
    CONSTRAINT fk_class_members_member FOREIGN KEY (member_id) 
        REFERENCES users(id) ON DELETE CASCADE,

    CONSTRAINT chk_class_members_status CHECK (status IN ('ACTIVE', 'DROPPED', 'COMPLETED')),

    CONSTRAINT uq_class_members_class_member UNIQUE (class_id, member_id)
);

COMMENT ON TABLE class_members IS 'Bảng trung gian ghi nhận danh sách học viên tham gia từng lớp học';

CREATE TABLE lessons (
    id BIGSERIAL PRIMARY KEY,
    class_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    "order" INT NOT NULL DEFAULT 1,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_lessons_class FOREIGN KEY (class_id) 
        REFERENCES classes(id) ON DELETE CASCADE,
    CONSTRAINT fk_lessons_creator FOREIGN KEY (created_by) 
        REFERENCES users(id) ON DELETE RESTRICT,

    CONSTRAINT chk_lessons_order CHECK ("order" > 0),

    CONSTRAINT uq_lessons_class_order UNIQUE (class_id, "order")
);

COMMENT ON TABLE lessons IS 'Bảng lưu trữ thông tin các bài học trong một lớp học';
COMMENT ON COLUMN lessons."order" IS 'Thứ tự hiển thị bài học trong chương trình (1, 2, 3,...)';

CREATE TABLE lesson_progress (
    id BIGSERIAL PRIMARY KEY,
    lesson_id BIGINT NOT NULL,
    member_id BIGINT NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_lesson_progress_lesson FOREIGN KEY (lesson_id) 
        REFERENCES lessons(id) ON DELETE CASCADE,
    CONSTRAINT fk_lesson_progress_member FOREIGN KEY (member_id) 
        REFERENCES users(id) ON DELETE CASCADE,

    CONSTRAINT uq_lesson_progress_lesson_member UNIQUE (lesson_id, member_id)
);

COMMENT ON TABLE lesson_progress IS 'Bảng ghi nhận tiến độ học tập: bài học nào đã được học viên nào hoàn thành';

CREATE TABLE assignments (
    id BIGSERIAL PRIMARY KEY,
    class_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    maximum_score NUMERIC(5, 2) NOT NULL DEFAULT 10.00,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_assignments_class FOREIGN KEY (class_id) 
        REFERENCES classes(id) ON DELETE CASCADE,
    CONSTRAINT fk_assignments_creator FOREIGN KEY (created_by) 
        REFERENCES users(id) ON DELETE RESTRICT,

    CONSTRAINT chk_assignments_max_score CHECK (maximum_score > 0)
);

COMMENT ON TABLE assignments IS 'Bảng bài tập do Mentor giao cho lớp học';

CREATE TABLE submissions (
    id BIGSERIAL PRIMARY KEY,
    assignment_id BIGINT NOT NULL,
    member_id BIGINT NOT NULL,
    content TEXT,
    repository_url VARCHAR(500) NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    score NUMERIC(5, 2),
    feedback TEXT,
    reviewed_by BIGINT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED',

    CONSTRAINT fk_submissions_assignment FOREIGN KEY (assignment_id) 
        REFERENCES assignments(id) ON DELETE CASCADE,
    CONSTRAINT fk_submissions_member FOREIGN KEY (member_id) 
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_submissions_reviewer FOREIGN KEY (reviewed_by) 
        REFERENCES users(id) ON DELETE SET NULL,

    CONSTRAINT chk_submissions_status CHECK (status IN ('SUBMITTED', 'REVIEWED')),
    CONSTRAINT chk_submissions_score CHECK (score IS NULL OR score >= 0),

    CONSTRAINT uq_submissions_assignment_member UNIQUE (assignment_id, member_id)
);

COMMENT ON TABLE submissions IS 'Bảng lưu trữ bài nộp và kết quả đánh giá bài tập của học viên';

CREATE INDEX idx_users_role ON users(role);

CREATE INDEX idx_classes_mentor_id ON classes(mentor_id);

CREATE INDEX idx_class_members_class_id ON class_members(class_id);
CREATE INDEX idx_class_members_member_id ON class_members(member_id);

CREATE INDEX idx_lessons_class_id_order ON lessons(class_id, "order" ASC);

CREATE INDEX idx_lesson_progress_member_id ON lesson_progress(member_id);
CREATE INDEX idx_lesson_progress_lesson_id ON lesson_progress(lesson_id);

CREATE INDEX idx_assignments_class_id ON assignments(class_id);
CREATE INDEX idx_assignments_deadline ON assignments(deadline);

CREATE INDEX idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX idx_submissions_member_id ON submissions(member_id);
CREATE INDEX idx_submissions_status ON submissions(status);

INSERT INTO users (name, email, password, role) VALUES
('Admin S-Group', 'admin@sgroup.vn', '$2b$10$hashedAdminPasswordSample', 'ADMIN'),
('Mentor Van A', 'mentor.vana@sgroup.vn', '$2b$10$hashedMentorPasswordSample', 'MEMBER'),
('Student Nguyen B', 'student.nguyenb@sgroup.vn', '$2b$10$hashedStudentPasswordSample', 'MEMBER'),
('Student Le C', 'student.lec@sgroup.vn', '$2b$10$hashedStudentPasswordSample', 'MEMBER');

INSERT INTO classes (name, description, start_date, end_date, mentor_id) VALUES
('BE Basic - Batch 01', 'Khoá đào tạo Backend cơ bản S-Group: ExpressJS, PostgreSQL, RESTful API.', '2026-03-01', '2026-05-30', 2);

INSERT INTO class_members (class_id, member_id, status) VALUES
(1, 3, 'ACTIVE'),
(1, 4, 'ACTIVE');

INSERT INTO lessons (class_id, title, content, "order", created_by) VALUES
(1, '01. Backend Introduction', 'Giới thiệu kiến trúc Client-Server, tổng quan Backend.', 1, 2),
(1, '02. HTTP & RESTful API', 'Giao thức HTTP, Methods (GET/POST/PUT/DELETE), Headers, Status Codes.', 2, 2),
(1, '03. Database & SQL Design', 'Thiết kế RDBMS, ERD, Khóa chính, Khóa ngoại, Constraints, Indexes.', 3, 2),
(1, '04. Authentication & Authorization', 'Xác thực JWT, Cookie-session, phân quyền RBAC.', 4, 2);

INSERT INTO lesson_progress (lesson_id, member_id, completed_at) VALUES
(1, 3, CURRENT_TIMESTAMP - INTERVAL '2 days'),
(2, 3, CURRENT_TIMESTAMP - INTERVAL '1 day');

INSERT INTO lesson_progress (lesson_id, member_id, completed_at) VALUES
(1, 4, CURRENT_TIMESTAMP - INTERVAL '1 day');

INSERT INTO assignments (class_id, title, description, deadline, maximum_score, created_by) VALUES
(1, 'Assignment 01: Thiết kế CSDL S-Group Learning Platform', 'Vẽ sơ đồ ERD (.drawio) và viết file DDL SQL có đầy đủ Constraints & Indexes.', CURRENT_TIMESTAMP + INTERVAL '7 days', 10.00, 2);

INSERT INTO submissions (assignment_id, member_id, content, repository_url, score, feedback, reviewed_by, reviewed_at, status) VALUES
(1, 3, 'Em xin nộp bài tập thiết kế CSDL ạ. Đã hoàn thành ERD và file SQL.', 'https://github.com/studentB/sgroup-db-assignment', 9.50, 'Thiết kế rất chi tiết, ràng buộc và index đầy đủ.', 2, CURRENT_TIMESTAMP, 'REVIEWED');

INSERT INTO submissions (assignment_id, member_id, content, repository_url, status) VALUES
(1, 4, 'Em gửi repo bài tập tuần 1.', 'https://github.com/studentC/sgroup-db-assignment', 'SUBMITTED');
