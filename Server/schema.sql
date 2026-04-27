-- ============================================================
-- SCHEMA — create all 8 tables
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. SUPERVISOR
CREATE TABLE supervisor (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash TEXT         NOT NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- 2. TEACHER
CREATE TABLE teacher (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supervisor_id UUID         REFERENCES supervisor(id) ON DELETE SET NULL,
  full_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash TEXT         NOT NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- 3. COURSE
CREATE TABLE course (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supervisor_id UUID         REFERENCES supervisor(id) ON DELETE SET NULL,
  code          VARCHAR(20)  NOT NULL UNIQUE,
  name          VARCHAR(150) NOT NULL,
  description   TEXT,
  created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- 4. COURSE GROUP
CREATE TABLE course_group (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id   UUID        NOT NULL REFERENCES course(id) ON DELETE CASCADE,
  group_label VARCHAR(10) NOT NULL,
  capacity    INT         NOT NULL DEFAULT 50,
  UNIQUE (course_id, group_label)
);

-- 5. TEACHER GROUP ASSIGNMENT
CREATE TABLE teacher_group_assignment (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id      UUID NOT NULL REFERENCES teacher(id)      ON DELETE CASCADE,
  course_group_id UUID NOT NULL REFERENCES course_group(id) ON DELETE CASCADE,
  UNIQUE (course_group_id)
);

-- 6. STUDENT
CREATE TABLE student (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash TEXT         NOT NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- 7. STUDENT ENROLLMENT
CREATE TABLE student_enrollment (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID      NOT NULL REFERENCES student(id)      ON DELETE CASCADE,
  course_group_id UUID      NOT NULL REFERENCES course_group(id) ON DELETE CASCADE,
  enrolled_at     TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, course_group_id)
);

-- 8. MARKS
CREATE TABLE marks (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id         UUID NOT NULL UNIQUE REFERENCES student_enrollment(id) ON DELETE CASCADE,
  quiz1                 INT  CHECK (quiz1                 BETWEEN 0 AND 10),
  quiz2                 INT  CHECK (quiz2                 BETWEEN 0 AND 10),
  group_work            INT  CHECK (group_work            BETWEEN 0 AND 10),
  continuous_assessment INT  CHECK (continuous_assessment BETWEEN 0 AND 10),
  midsem                INT  CHECK (midsem                BETWEEN 0 AND 30),
  exam                  INT  CHECK (exam                  BETWEEN 0 AND 40),
  total                 INT,
  updated_at            TIMESTAMP NOT NULL DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_teacher_supervisor  ON teacher(supervisor_id);
CREATE INDEX idx_course_supervisor   ON course(supervisor_id);
CREATE INDEX idx_course_group_course ON course_group(course_id);
CREATE INDEX idx_tga_teacher         ON teacher_group_assignment(teacher_id);
CREATE INDEX idx_enrollment_student  ON student_enrollment(student_id);
CREATE INDEX idx_enrollment_group    ON student_enrollment(course_group_id);
CREATE INDEX idx_marks_enrollment    ON marks(enrollment_id);