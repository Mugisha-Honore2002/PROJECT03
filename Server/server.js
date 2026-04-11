const express = require('express');
const app = express();
require('dotenv').config();

app.use(express.json());

// ─── ROUTES ──────────────────────────────────────────────────
const supervisorRoutes = require('./routes/supervisorRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const courseRoutes = require('./routes/courseRoutes');
const courseGroupRoutes = require('./routes/courseGroupRoutes');
const studentRoutes = require('./routes/studentRoutes');
const enrollmentRoutes = require('./routes/studentEnrollmentRouter');
const marksRoutes = require('./routes/marksRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');


app.use('/api/assignment', assignmentRoutes);
app.use('/api/supervisor', supervisorRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/course', courseRoutes);
app.use('/api/course-group', courseGroupRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/enrollment', enrollmentRoutes);
app.use('/api/marks', marksRoutes);

// ─── START SERVER ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`SERVER IS RUNNING ON PORT: ${PORT}`);
});