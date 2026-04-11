import { useState, useEffect } from "react";
import axios from "axios";
import logout from "./logout";

const api = axios.create({ baseURL: "" });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const NavItem = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${active ? "bg-violet-600 text-white shadow-sm" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"}`}>
    <span className="flex items-center justify-center w-5 h-5">{icon}</span>{label}
  </button>
);

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
    <div className="w-full max-w-md p-6 bg-white shadow-xl rounded-2xl">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold text-slate-800">{title}</h3>
        <button onClick={onClose} className="transition-colors text-slate-400 hover:text-slate-600">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      {children}
    </div>
  </div>
);

export default function SupervisorDashboard() {
  const user   = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user.id;

  const [page, setPage] = useState("overview");
  const [profile, setProfile] = useState(user);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [allGroups, setAllGroups] = useState([]);   // all groups with teacher_name
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editName, setEditName] = useState(user.full_name || "");
  const [editEmail, setEditEmail] = useState(user.email || "");
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confPw, setConfPw] = useState("");

  // modals
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [tName, setTName] = useState(""); const [tEmail, setTEmail] = useState(""); const [tPw, setTPw] = useState("");

  const [showAddCourse, setShowAddCourse] = useState(false);
  const [cCode, setCCode] = useState(""); const [cName, setCName] = useState(""); const [cDesc, setCDesc] = useState("");

  const [showAddGroup, setShowAddGroup] = useState(false);
  const [groupCourseId, setGroupCourseId] = useState(""); const [gLabel, setGLabel] = useState(""); const [gCapacity, setGCapacity] = useState("");

  const [showAssign, setShowAssign] = useState(false);
  const [assignGroupId, setAssignGroupId] = useState(""); const [assignTeacherId, setAssignTeacherId] = useState("");

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [s, t, c, e] = await Promise.all([
        api.get("/api/student"),
        api.get("/api/teacher"),
        api.get("/api/course"),
        api.get("/api/enrollment"),
      ]);
      setStudents(s.data); setTeachers(t.data); setCourses(c.data); setEnrollments(e.data);
      // fetch groups for all courses
      const groups = [];
      for (const course of c.data) {
        try {
          const gr = await api.get(`/api/course-group/course/${course.id}`);
          gr.data.forEach(g => groups.push({ ...g, course_name: course.name, course_code: course.code }));
        } catch {}
      }
      setAllGroups(groups);
    } catch { setError("Failed to load data."); }
    finally { setLoading(false); }
  };

  const handleAddTeacher = async (e) => {
    e.preventDefault(); setError(""); setSuccess("");
    try {
      const res = await api.post(`/api/teacher/register/${userId}`, { full_name: tName, email: tEmail, password: tPw });
      setTeachers(prev => [...prev, res.data]); setSuccess("Teacher registered.");
      setShowAddTeacher(false); setTName(""); setTEmail(""); setTPw("");
    } catch (err) { setError(err.response?.data?.error || "Failed."); }
  };

  const handleDeleteTeacher = async (id) => {
    if (!window.confirm("Delete this teacher?")) return;
    setError(""); setSuccess("");
    try { await api.delete(`/api/teacher/${id}`); setTeachers(prev => prev.filter(t => t.id !== id)); setSuccess("Teacher deleted."); }
    catch (err) { setError(err.response?.data?.error || "Delete failed."); }
  };

  const handleDeleteStudent = async (id) => {
    if (!window.confirm("Delete this student?")) return;
    setError(""); setSuccess("");
    try { await api.delete(`/api/student/${id}`); setStudents(prev => prev.filter(s => s.id !== id)); setSuccess("Student deleted."); }
    catch (err) { setError(err.response?.data?.error || "Delete failed."); }
  };

  const handleAddCourse = async (e) => {
    e.preventDefault(); setError(""); setSuccess("");
    try {
      const res = await api.post(`/api/course/create/${userId}`, { code: cCode, name: cName, description: cDesc });
      setCourses(prev => [...prev, res.data]); setSuccess("Course created.");
      setShowAddCourse(false); setCCode(""); setCName(""); setCDesc("");
    } catch (err) { setError(err.response?.data?.error || "Failed."); }
  };

  const handleDeleteCourse = async (id) => {
    if (!window.confirm("Delete this course?")) return;
    setError(""); setSuccess("");
    try { await api.delete(`/api/course/${id}`); setCourses(prev => prev.filter(c => c.id !== id)); fetchAll(); setSuccess("Course deleted."); }
    catch (err) { setError(err.response?.data?.error || "Delete failed."); }
  };

  const handleAddGroup = async (e) => {
    e.preventDefault(); setError(""); setSuccess("");
    try {
      await api.post(`/api/course-group/create/${groupCourseId}`, { group_label: gLabel, capacity: Number(gCapacity) || 50 });
      setSuccess("Group created."); setShowAddGroup(false); setGLabel(""); setGCapacity(""); setGroupCourseId("");
      fetchAll();
    } catch (err) { setError(err.response?.data?.error || "Failed."); }
  };

  const handleAssignTeacher = async (e) => {
    e.preventDefault(); setError(""); setSuccess("");
    try {
      await api.post("/api/assignment/assign", { teacher_id: assignTeacherId, course_group_id: assignGroupId });
      setSuccess("Teacher assigned to group."); setShowAssign(false); setAssignGroupId(""); setAssignTeacherId("");
      fetchAll();
    } catch (err) { setError(err.response?.data?.error || "Failed."); }
  };

  const handleUnassignTeacher = async (groupId) => {
    if (!window.confirm("Remove teacher from this group?")) return;
    setError(""); setSuccess("");
    try { await api.delete(`/api/assignment/${groupId}`); setSuccess("Teacher unassigned."); fetchAll(); }
    catch (err) { setError(err.response?.data?.error || "Failed."); }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault(); setError(""); setSuccess("");
    try {
      const res = await api.put(`/api/supervisor/${userId}`, { full_name: editName, email: editEmail });
      setProfile(res.data); localStorage.setItem("user", JSON.stringify(res.data)); setSuccess("Profile updated.");
    } catch (err) { setError(err.response?.data?.error || "Update failed."); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault(); setError(""); setSuccess("");
    if (newPw !== confPw) { setError("Passwords do not match."); return; }
    try {
      await api.put(`/api/supervisor/${userId}/password`, { old_password: oldPw, new_password: newPw });
      setSuccess("Password changed."); setOldPw(""); setNewPw(""); setConfPw("");
    } catch (err) { setError(err.response?.data?.error || "Failed."); }
  };

  const handleLogout = () => logout();
  const go = (p) => { setPage(p); setError(""); setSuccess(""); };

  const inputCls = "w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all";
  const unassignedGroups = allGroups.filter(g => !g.teacher_id);

  return (
    <div className="flex min-h-screen font-sans bg-slate-50">
      <aside className="flex flex-col px-3 py-6 bg-white border-r w-60 shrink-0 border-slate-100">
        <div className="flex items-center gap-3 px-3 mb-8">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-600">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
          </div>
          <span className="text-xs font-semibold tracking-widest uppercase text-slate-400">Apex Digital</span>
        </div>
        <div className="flex flex-col items-center px-3 mb-8">
          <div className="flex items-center justify-center mb-2 w-14 h-14 rounded-2xl bg-violet-100">
            <span className="text-2xl font-bold text-violet-600">{(profile.full_name || "S")[0].toUpperCase()}</span>
          </div>
          <p className="text-sm font-semibold text-center text-slate-800">{profile.full_name}</p>
          <span className="mt-1 text-xs bg-violet-50 text-violet-600 font-medium px-2 py-0.5 rounded-full">Supervisor</span>
        </div>
        <nav className="flex flex-col flex-1 gap-1">
          <NavItem label="Overview"        active={page==="overview"}    onClick={() => go("overview")}
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>} />
          <NavItem label="Students"        active={page==="students"}    onClick={() => go("students")}
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>} />
          <NavItem label="Teachers"        active={page==="teachers"}    onClick={() => go("teachers")}
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>} />
          <NavItem label="Courses & Groups" active={page==="courses"}    onClick={() => go("courses")}
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>} />
          <NavItem label="Assign Teachers" active={page==="assign"}      onClick={() => go("assign")}
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>} />
          <NavItem label="Enrollments"     active={page==="enrollments"} onClick={() => go("enrollments")}
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>} />
          <NavItem label="Edit Profile"    active={page==="profile"}     onClick={() => go("profile")}
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>} />
          <NavItem label="Change Password" active={page==="password"}    onClick={() => go("password")}
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>} />
        </nav>
        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-50 hover:text-red-600 transition-all mt-2">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Logout
        </button>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        {error   && <div className="px-4 py-3 mb-6 text-sm text-red-600 border border-red-100 rounded-xl bg-red-50">{error}</div>}
        {success && <div className="px-4 py-3 mb-6 text-sm text-green-700 border border-green-100 rounded-xl bg-green-50">{success}</div>}

        {/* OVERVIEW */}
        {page === "overview" && (
          <div>
            <h1 className="mb-1 text-2xl font-bold text-slate-900">Welcome, {profile.full_name?.split(" ")[0]} 👋</h1>
            <p className="mb-8 text-sm text-slate-400">System overview at a glance.</p>
            <div className="grid grid-cols-2 gap-4 mb-8 sm:grid-cols-4">
              {[
                { label: "Students",         value: students.length,                               color: "text-indigo-600"  },
                { label: "Teachers",         value: teachers.length,                               color: "text-emerald-600" },
                { label: "Courses",          value: courses.length,                                color: "text-amber-500"   },
                { label: "Unassigned Groups",value: unassignedGroups.length,                       color: "text-red-500"     },
              ].map(s => (
                <div key={s.label} className="p-5 bg-white border rounded-2xl border-slate-100">
                  <p className="mb-2 text-xs font-semibold tracking-widest uppercase text-slate-400">{s.label}</p>
                  <p className={`text-3xl font-bold ${s.color}`}>{loading ? "…" : s.value}</p>
                </div>
              ))}
            </div>
            {unassignedGroups.length > 0 && (
              <div className="p-4 mb-6 border bg-amber-50 border-amber-200 rounded-2xl">
                <p className="mb-1 text-sm font-semibold text-amber-700">⚠️ {unassignedGroups.length} group{unassignedGroups.length > 1 ? "s" : ""} without a teacher</p>
                <p className="text-xs text-amber-600">Go to <button onClick={() => go("assign")} className="font-medium underline">Assign Teachers</button> to fix this.</p>
              </div>
            )}
          </div>
        )}

        {/* STUDENTS */}
        {page === "students" && (
          <div>
            <h1 className="mb-1 text-2xl font-bold text-slate-900">Students</h1>
            <p className="mb-6 text-sm text-slate-400">All registered students.</p>
            {loading ? <p className="text-sm text-slate-400">Loading…</p> : (
              <div className="overflow-hidden bg-white border rounded-2xl border-slate-100">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-slate-100">{["ID","Name","Email","Joined",""].map(h => <th key={h} className="px-5 py-3 text-xs font-semibold tracking-widest text-left uppercase text-slate-400">{h}</th>)}</tr></thead>
                  <tbody>
                    {students.map(s => (
                      <tr key={s.id} className="transition-colors border-b border-slate-50 hover:bg-slate-50">
                        <td className="px-5 py-3 text-xs text-slate-400">{s.id?.slice(0,8)}…</td>
                        <td className="px-5 py-3 font-medium text-slate-800">{s.full_name}</td>
                        <td className="px-5 py-3 text-slate-500">{s.email}</td>
                        <td className="px-5 py-3 text-slate-400">{new Date(s.created_at).toLocaleDateString()}</td>
                        <td className="px-5 py-3 text-right"><button onClick={() => handleDeleteStudent(s.id)} className="text-xs font-medium text-red-400 transition-colors hover:text-red-600">Delete</button></td>
                      </tr>
                    ))}
                    {students.length === 0 && <tr><td colSpan={5} className="px-5 py-6 text-sm text-center text-slate-400">No students found.</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TEACHERS */}
        {page === "teachers" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div><h1 className="mb-1 text-2xl font-bold text-slate-900">Teachers</h1><p className="text-sm text-slate-400">Manage your teaching staff.</p></div>
              <button onClick={() => setShowAddTeacher(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 active:scale-[0.98] transition-all">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Add Teacher
              </button>
            </div>
            {loading ? <p className="text-sm text-slate-400">Loading…</p> : (
              <div className="overflow-hidden bg-white border rounded-2xl border-slate-100">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-slate-100">{["ID","Name","Email","Joined",""].map(h => <th key={h} className="px-5 py-3 text-xs font-semibold tracking-widest text-left uppercase text-slate-400">{h}</th>)}</tr></thead>
                  <tbody>
                    {teachers.map(t => (
                      <tr key={t.id} className="transition-colors border-b border-slate-50 hover:bg-slate-50">
                        <td className="px-5 py-3 text-xs text-slate-400">{t.id?.slice(0,8)}…</td>
                        <td className="px-5 py-3 font-medium text-slate-800">{t.full_name}</td>
                        <td className="px-5 py-3 text-slate-500">{t.email}</td>
                        <td className="px-5 py-3 text-slate-400">{new Date(t.created_at).toLocaleDateString()}</td>
                        <td className="px-5 py-3 text-right"><button onClick={() => handleDeleteTeacher(t.id)} className="text-xs font-medium text-red-400 transition-colors hover:text-red-600">Delete</button></td>
                      </tr>
                    ))}
                    {teachers.length === 0 && <tr><td colSpan={5} className="px-5 py-6 text-sm text-center text-slate-400">No teachers found.</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* COURSES & GROUPS */}
        {page === "courses" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div><h1 className="mb-1 text-2xl font-bold text-slate-900">Courses & Groups</h1><p className="text-sm text-slate-400">Manage all courses and their groups.</p></div>
              <div className="flex gap-2">
                <button onClick={() => setShowAddGroup(true)} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-violet-600 bg-violet-50 hover:bg-violet-100 active:scale-[0.98] transition-all">+ Group</button>
                <button onClick={() => setShowAddCourse(true)} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 active:scale-[0.98] transition-all">+ Course</button>
              </div>
            </div>
            {loading ? <p className="text-sm text-slate-400">Loading…</p> : (
              <div className="grid gap-4">
                {courses.map(c => {
                  const courseGroups = allGroups.filter(g => g.course_id === c.id);
                  return (
                    <div key={c.id} className="p-5 bg-white border rounded-2xl border-slate-100">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-slate-800">{c.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{c.code}{c.description ? ` · ${c.description}` : ""}</p>
                        </div>
                        <button onClick={() => handleDeleteCourse(c.id)} className="text-xs font-medium text-red-400 transition-colors hover:text-red-600">Delete</button>
                      </div>
                      {courseGroups.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 mt-3 sm:grid-cols-3">
                          {courseGroups.map(g => (
                            <div key={g.id} className={`rounded-xl p-3 border ${g.teacher_id ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
                              <p className="text-xs font-semibold text-slate-700">Group {g.group_label}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{g.enrolled_students}/{g.capacity} students</p>
                              {g.teacher_name
                                ? <p className="mt-1 text-xs font-medium text-emerald-600">{g.teacher_name}</p>
                                : <p className="mt-1 text-xs text-amber-500">No teacher</p>
                              }
                            </div>
                          ))}
                        </div>
                      )}
                      {courseGroups.length === 0 && <p className="mt-2 text-xs text-slate-400">No groups yet.</p>}
                    </div>
                  );
                })}
                {courses.length === 0 && <p className="text-sm text-slate-400">No courses yet.</p>}
              </div>
            )}
          </div>
        )}

        {/* ASSIGN TEACHERS */}
        {page === "assign" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div><h1 className="mb-1 text-2xl font-bold text-slate-900">Assign Teachers</h1><p className="text-sm text-slate-400">Manually assign or remove teachers from groups.</p></div>
              <button onClick={() => setShowAssign(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 active:scale-[0.98] transition-all">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Assign Teacher
              </button>
            </div>
            <div className="grid gap-3">
              {allGroups.map(g => (
                <div key={g.id} className="flex items-center justify-between p-4 bg-white border rounded-2xl border-slate-100">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{g.course_name} — Group {g.group_label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{g.course_code} · {g.enrolled_students}/{g.capacity} students</p>
                    {g.teacher_name
                      ? <p className="mt-1 text-xs font-medium text-emerald-600">👤 {g.teacher_name}</p>
                      : <p className="mt-1 text-xs text-amber-500">⚠️ No teacher assigned</p>
                    }
                  </div>
                  {g.teacher_id
                    ? <button onClick={() => handleUnassignTeacher(g.id)} className="text-xs font-medium text-red-400 transition-colors hover:text-red-600 shrink-0">Remove</button>
                    : <button onClick={() => { setAssignGroupId(g.id); setShowAssign(true); }} className="text-xs font-medium transition-colors text-violet-600 hover:text-violet-800 shrink-0">Assign →</button>
                  }
                </div>
              ))}
              {allGroups.length === 0 && <p className="text-sm text-slate-400">No groups found. Create a course and add groups first.</p>}
            </div>
          </div>
        )}

        {/* ENROLLMENTS */}
        {page === "enrollments" && (
          <div>
            <h1 className="mb-1 text-2xl font-bold text-slate-900">Enrollments</h1>
            <p className="mb-6 text-sm text-slate-400">All student enrollments ({enrollments.length} total).</p>
            {loading ? <p className="text-sm text-slate-400">Loading…</p> : (
              <div className="overflow-hidden bg-white border rounded-2xl border-slate-100">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-slate-100">{["Student","Course","Group","Teacher","Enrolled"].map(h => <th key={h} className="px-5 py-3 text-xs font-semibold tracking-widest text-left uppercase text-slate-400">{h}</th>)}</tr></thead>
                  <tbody>
                    {enrollments.map(e => (
                      <tr key={e.enrollment_id} className="transition-colors border-b border-slate-50 hover:bg-slate-50">
                        <td className="px-5 py-3 font-medium text-slate-800">{e.student_name}</td>
                        <td className="px-5 py-3 text-slate-600">{e.course_name}</td>
                        <td className="px-5 py-3 text-slate-500">{e.group_label}</td>
                        <td className="px-5 py-3 text-slate-500">{e.teacher_name || <span className="text-amber-500">—</span>}</td>
                        <td className="px-5 py-3 text-slate-400">{new Date(e.enrolled_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {enrollments.length === 0 && <tr><td colSpan={5} className="px-5 py-6 text-sm text-center text-slate-400">No enrollments yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* PROFILE */}
        {page === "profile" && (
          <div className="max-w-lg">
            <h1 className="mb-1 text-2xl font-bold text-slate-900">Edit Profile</h1>
            <p className="mb-8 text-sm text-slate-400">Update your name and email.</p>
            <div className="p-6 bg-white border rounded-2xl border-slate-100">
              <form onSubmit={handleUpdateProfile} className="space-y-5">
                <div><label className="block mb-2 text-xs font-semibold tracking-widest uppercase text-slate-500">Full Name</label><input value={editName} onChange={e => setEditName(e.target.value)} required className={inputCls} /></div>
                <div><label className="block mb-2 text-xs font-semibold tracking-widest uppercase text-slate-500">Email</label><input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} required className={inputCls} /></div>
                <button type="submit" className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 active:scale-[0.98] transition-all">Save Changes</button>
              </form>
            </div>
          </div>
        )}

        {/* PASSWORD */}
        {page === "password" && (
          <div className="max-w-lg">
            <h1 className="mb-1 text-2xl font-bold text-slate-900">Change Password</h1>
            <p className="mb-8 text-sm text-slate-400">Enter your current and new password.</p>
            <div className="p-6 bg-white border rounded-2xl border-slate-100">
              <form onSubmit={handleChangePassword} className="space-y-5">
                {[{ label: "Current Password", val: oldPw, set: setOldPw }, { label: "New Password", val: newPw, set: setNewPw }, { label: "Confirm New Password", val: confPw, set: setConfPw }].map(f => (
                  <div key={f.label}><label className="block mb-2 text-xs font-semibold tracking-widest uppercase text-slate-500">{f.label}</label><input type="password" value={f.val} onChange={e => f.set(e.target.value)} required className={inputCls} /></div>
                ))}
                <button type="submit" className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 active:scale-[0.98] transition-all">Update Password</button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Add Teacher Modal */}
      {showAddTeacher && (
        <Modal title="Register New Teacher" onClose={() => setShowAddTeacher(false)}>
          <form onSubmit={handleAddTeacher} className="space-y-4">
            {[{ label: "Full Name", val: tName, set: setTName, type: "text" }, { label: "Email", val: tEmail, set: setTEmail, type: "email" }, { label: "Password", val: tPw, set: setTPw, type: "password" }].map(f => (
              <div key={f.label}><label className="block mb-2 text-xs font-semibold tracking-widest uppercase text-slate-500">{f.label}</label><input type={f.type} value={f.val} onChange={e => f.set(e.target.value)} required className="w-full px-4 py-3 text-sm transition-all border rounded-xl border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" /></div>
            ))}
            <button type="submit" className="w-full py-3 text-sm font-semibold text-white transition-all rounded-xl bg-violet-600 hover:bg-violet-700">Register Teacher</button>
          </form>
        </Modal>
      )}

      {/* Add Course Modal */}
      {showAddCourse && (
        <Modal title="Create New Course" onClose={() => setShowAddCourse(false)}>
          <form onSubmit={handleAddCourse} className="space-y-4">
            {[{ label: "Course Code", val: cCode, set: setCCode }, { label: "Course Name", val: cName, set: setCName }, { label: "Description (optional)", val: cDesc, set: setCDesc, optional: true }].map(f => (
              <div key={f.label}><label className="block mb-2 text-xs font-semibold tracking-widest uppercase text-slate-500">{f.label}</label><input value={f.val} onChange={e => f.set(e.target.value)} required={!f.optional} className="w-full px-4 py-3 text-sm transition-all border rounded-xl border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" /></div>
            ))}
            <button type="submit" className="w-full py-3 text-sm font-semibold text-white transition-all rounded-xl bg-violet-600 hover:bg-violet-700">Create Course</button>
          </form>
        </Modal>
      )}

      {/* Add Group Modal */}
      {showAddGroup && (
        <Modal title="Create Course Group" onClose={() => setShowAddGroup(false)}>
          <form onSubmit={handleAddGroup} className="space-y-4">
            <div>
              <label className="block mb-2 text-xs font-semibold tracking-widest uppercase text-slate-500">Course</label>
              <select value={groupCourseId} onChange={e => setGroupCourseId(e.target.value)} required className="w-full px-4 py-3 text-sm transition-all bg-white border rounded-xl border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent">
                <option value="">Select a course…</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
              </select>
            </div>
            <div><label className="block mb-2 text-xs font-semibold tracking-widest uppercase text-slate-500">Group Label</label><input value={gLabel} onChange={e => setGLabel(e.target.value)} required placeholder="e.g. A" className="w-full px-4 py-3 text-sm transition-all border rounded-xl border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" /></div>
            <div><label className="block mb-2 text-xs font-semibold tracking-widest uppercase text-slate-500">Capacity</label><input type="number" min={1} value={gCapacity} onChange={e => setGCapacity(e.target.value)} placeholder="Default 50" className="w-full px-4 py-3 text-sm transition-all border rounded-xl border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" /></div>
            <button type="submit" className="w-full py-3 text-sm font-semibold text-white transition-all rounded-xl bg-violet-600 hover:bg-violet-700">Create Group</button>
          </form>
        </Modal>
      )}

      {/* Assign Teacher Modal */}
      {showAssign && (
        <Modal title="Assign Teacher to Group" onClose={() => { setShowAssign(false); setAssignGroupId(""); setAssignTeacherId(""); }}>
          <form onSubmit={handleAssignTeacher} className="space-y-4">
            <div>
              <label className="block mb-2 text-xs font-semibold tracking-widest uppercase text-slate-500">Group</label>
              <select value={assignGroupId} onChange={e => setAssignGroupId(e.target.value)} required className="w-full px-4 py-3 text-sm transition-all bg-white border rounded-xl border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent">
                <option value="">Select a group…</option>
                {allGroups.filter(g => !g.teacher_id).map(g => <option key={g.id} value={g.id}>{g.course_code} — Group {g.group_label}</option>)}
              </select>
            </div>
            <div>
              <label className="block mb-2 text-xs font-semibold tracking-widest uppercase text-slate-500">Teacher</label>
              <select value={assignTeacherId} onChange={e => setAssignTeacherId(e.target.value)} required className="w-full px-4 py-3 text-sm transition-all bg-white border rounded-xl border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent">
                <option value="">Select a teacher…</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
              </select>
            </div>
            <button type="submit" className="w-full py-3 text-sm font-semibold text-white transition-all rounded-xl bg-violet-600 hover:bg-violet-700">Assign</button>
          </form>
        </Modal>
      )}
    </div>
  );
}