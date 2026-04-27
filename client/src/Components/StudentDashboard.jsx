import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import SearchBar from "./SearchBar";
import logo from "../Assets/education-school-logo-design-template_731136-92.avif";

const api = axios.create({ baseURL: "" });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const gradeColor = (v) => {
  if (v === null || v === undefined) return "text-slate-400";
  if (v >= 14) return "text-emerald-600";
  if (v >= 10) return "text-amber-500";
  return "text-red-500";
};
const gradeLetter = (v) => {
  if (v === null || v === undefined) return "—";
  if (v >= 16) return "A"; if (v >= 14) return "B";
  if (v >= 12) return "C"; if (v >= 10) return "D";
  return "F";
};

const NavItem = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${active ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"}`}>
    <span className="flex items-center justify-center w-5 h-5">{icon}</span>{label}
  </button>
);

export default function StudentDashboard() {
  const user   = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user.id;

  const [page, setPage] = useState("overview");
  const [profile, setProfile] = useState(user);
  const [enrollments, setEnrollments] = useState([]);
  const [openGroups, setOpenGroups]   = useState([]);
  const [loadingEnroll, setLoadingEnroll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editName, setEditName] = useState(user.full_name || "");
  const [editEmail, setEditEmail] = useState(user.email || "");
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confPw, setConfPw] = useState("");
  const [browseSearch, setBrowseSearch] = useState(null);
  const [courseSearch, setCourseSearch] = useState(null);

  useEffect(() => { if (userId) { fetchEnrollments(); fetchOpenGroups(); } }, [userId]);

  const fetchEnrollments = useCallback(async () => {
    setLoading(true);
    try { const r = await api.get(`/api/student/${userId}/enrollments`); setEnrollments(r.data); }
    catch { setError("Failed to load your courses."); }
    finally { setLoading(false); }
  }, [userId]);

  const fetchOpenGroups = async () => {
    try { const r = await api.get("/api/assignment/open-groups"); setOpenGroups(r.data); }
    catch {}
  };

  const handleEnroll = async (groupId) => {
    setError(""); setSuccess(""); setLoadingEnroll(groupId);
    try {
      await api.post(`/api/enrollment/${userId}/${groupId}`);
      setSuccess("Enrolled successfully!");
      fetchEnrollments();
      fetchOpenGroups();
    } catch (err) { setError(err.response?.data?.error || "Enrollment failed."); }
    finally { setLoadingEnroll(false); }
  };

  const handleUnenroll = async (groupId) => {
    if (!window.confirm("Leave this course group?")) return;
    setError(""); setSuccess("");
    try {
      await api.delete(`/api/enrollment/${userId}/${groupId}`);
      setSuccess("Unenrolled successfully.");
      fetchEnrollments(); fetchOpenGroups();
    } catch (err) { setError(err.response?.data?.error || "Failed."); }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault(); setError(""); setSuccess("");
    try {
      const res = await api.put(`/api/student/${userId}`, { full_name: editName, email: editEmail });
      setProfile(res.data); localStorage.setItem("user", JSON.stringify(res.data));
      setSuccess("Profile updated.");
    } catch (err) { setError(err.response?.data?.error || "Update failed."); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault(); setError(""); setSuccess("");
    if (newPw !== confPw) { setError("Passwords do not match."); return; }
    try {
      await api.put(`/api/student/${userId}/password`, { old_password: oldPw, new_password: newPw });
      setSuccess("Password changed."); setOldPw(""); setNewPw(""); setConfPw("");
    } catch (err) { setError(err.response?.data?.error || "Failed."); }
  };

  const handleLogout = () => { localStorage.clear(); window.location.href = "/login"; };
  const filteredOpenGroups  = browseSearch ? [browseSearch] : openGroups;
  const filteredEnrollments = courseSearch  ? [courseSearch] : enrollments;

  const go = (p) => { setPage(p); setError(""); setSuccess(""); };

  const graded   = enrollments.filter(e => e.total !== null);
  const avgScore = graded.length ? Math.round(graded.reduce((s, e) => s + e.total, 0) / graded.length) : null;
  const passed   = graded.filter(e => e.total >= 10).length;

  // which groups is student already in
  const enrolledGroupIds = new Set(enrollments.map(e => e.group_id));

  return (
    <div className="flex min-h-screen font-sans bg-slate-50">
      <aside className="flex flex-col px-3 py-6 bg-white border-r w-60 shrink-0 border-slate-100">
        <div className="flex items-center gap-3 px-3 mb-8">
          <div className="flex items-center justify-center w-8 h-8 bg-indigo-600 rounded-lg">
             <img src={logo} alt="Logo" className="rounded rounded-md " />
            </div>
          <span className="text-xs font-semibold tracking-widest uppercase text-slate-400">Apex Digital</span>
        </div>
        <div className="flex flex-col items-center px-3 mb-8">
          <div className="flex items-center justify-center mb-2 bg-indigo-100 w-14 h-14 rounded-2xl">
            <span className="text-2xl font-bold text-indigo-600">{(profile.full_name || "S")[0].toUpperCase()}</span>
          </div>
          <p className="text-sm font-semibold text-center text-slate-800">{profile.full_name}</p>
          <span className="mt-1 text-xs bg-indigo-50 text-indigo-500 font-medium px-2 py-0.5 rounded-full">Student</span>
        </div>
        <nav className="flex flex-col flex-1 gap-1">
          <NavItem label="Overview" active={page==="overview"} onClick={() => go("overview")}
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>} />
          <NavItem label="Browse & Enroll" active={page==="browse"} onClick={() => go("browse")}
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>} />
          <NavItem label="My Courses" active={page==="courses"} onClick={() => go("courses")}
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>} />
          <NavItem label="Edit Profile" active={page==="profile"} onClick={() => go("profile")}
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>} />
          <NavItem label="Change Password" active={page==="password"} onClick={() => go("password")}
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
            <h1 className="mb-1 text-2xl font-bold text-slate-900">Welcome back, {profile.full_name?.split(" ")[0]}</h1>
            <p className="mb-8 text-sm text-slate-400">Your academic summary.</p>
            <div className="grid grid-cols-1 gap-4 mb-8 sm:grid-cols-3">
              {[
                { label: "Enrolled Courses", value: enrollments.length, color: "text-indigo-600" },
                { label: "Average Score", value: avgScore !== null ? `${avgScore}  /20` : "—  /20", color: "text-amber-500" },
                { label: "Courses Passed", value: passed, color: "text-emerald-600"},
              ].map(s => (
                <div key={s.label} className="p-5 bg-white border rounded-2xl border-slate-100">
                  <p className="mb-2 text-xs font-semibold tracking-widest uppercase text-slate-400">{s.label}</p>
                  <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
            <h2 className="mb-4 text-base font-semibold text-slate-800">Recent Courses</h2>
            {loading ? <p className="text-sm text-slate-400">Loading…</p> : (
              <div className="grid gap-3">
                {enrollments.slice(0, 5).map(e => (
                  <div key={e.enrollment_id} className="flex items-center justify-between p-4 bg-white border rounded-2xl border-slate-100">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{e.course_name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{e.course_code} · {e.group_label}{e.teacher_name ? ` · ${e.teacher_name}` : ""}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${gradeColor(e.total)}`}>{e.total !== null ? `${e.total}  /20` : "—"}</p>
                      <p className="text-xs text-slate-400">{gradeLetter(e.total)}</p>
                    </div>
                  </div>
                ))}
                {enrollments.length === 0 && <p className="text-sm text-slate-400">Not enrolled in any course yet. <button onClick={() => go("browse")} className="text-indigo-500 hover:underline">Browse courses →</button></p>}
              </div>
            )}
          </div>
        )}

        {/* BROWSE & ENROLL */}
        {page === "browse" && (
          <div>
            <h1 className="mb-1 text-2xl font-bold text-slate-900">Browse & Enroll</h1>
            <p className="mb-4 text-sm text-slate-400">Available course groups with open spots. Enrolled groups are highlighted.</p>
            <div className="mb-6"><SearchBar items={openGroups} searchKeys={["course_name","course_code","group_label"]} placeholder="Search courses or groups…" onSelect={setBrowseSearch} renderLabel={g => g.course_name} renderSub={g => `${g.course_code} · Group ${g.group_label}`} accentColor="text-indigo-600" /></div>
            <div className="grid gap-3">
              {filteredOpenGroups.map(g => {
                const already = enrolledGroupIds.has(g.id);
                return (
                  <div key={g.id} className={`bg-white rounded-2xl border p-4 flex items-center justify-between transition-all ${already ? "border-indigo-200 bg-indigo-50/40" : "border-slate-100"}`}>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-800">{g.course_name}</p>
                        {already && <span className="text-xs bg-indigo-100 text-indigo-600 font-medium px-2 py-0.5 rounded-full">Enrolled</span>}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {g.course_code} · Group {g.group_label}
                        {g.teacher_name ? ` · ${g.teacher_name}` : " · No teacher yet"}
                        {" · "}{g.enrolled_students}/{g.capacity} students
                      </p>
                    </div>
                    {already ? (
                      <button onClick={() => handleUnenroll(g.id)} className="text-xs font-medium text-red-400 transition-colors hover:text-red-600 shrink-0">Leave</button>
                    ) : (
                      <button onClick={() => handleEnroll(g.id)} disabled={loadingEnroll === g.id} className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 transition-all shrink-0">
                        {loadingEnroll === g.id ? "…" : "Enroll"}
                      </button>
                    )}
                  </div>
                );
              })}
              {openGroups.length === 0 && <p className="text-sm text-slate-400">No open course groups available right now.</p>}
            </div>
          </div>
        )}

        {/* MY COURSES */}
        {page === "courses" && (
          <div>
            <h1 className="mb-1 text-2xl font-bold text-slate-900">My Courses</h1>
            <p className="mb-4 text-sm text-slate-400">Your enrolled courses and full marks breakdown.</p>
            <div className="mb-6"><SearchBar items={enrollments} searchKeys={["course_name","course_code"]} placeholder="Search your courses…" onSelect={setCourseSearch} renderLabel={e => e.course_name} renderSub={e => e.course_code} accentColor="text-indigo-600" /></div>
            {loading ? <p className="text-sm text-slate-400">Loading…</p> : (
              <div className="grid gap-4">
                {filteredEnrollments.map(e => (
                  <div key={e.enrollment_id} className="p-5 bg-white border rounded-2xl border-slate-100">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="font-semibold text-slate-800">{e.course_name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{e.course_code} · Group {e.group_label}{e.teacher_name ? ` · ${e.teacher_name}` : ""}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${gradeColor(e.total)}`}>{e.total !== null ? `${e.total} /20` : "— /20"}</p>
                        <p className="text-xs text-slate-400">Grade {gradeLetter(e.total)}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                      {[
                        { label: "Quiz 1", value: e.quiz1, max: 10 },
                        { label: "Quiz 2", value: e.quiz2, max: 10 },
                        { label: "Group", value: e.group_work, max: 10 },
                        { label: "CA", value: e.continuous_assessment, max: 10 },
                        { label: "Midsem", value: e.midsem, max: 30 },
                        { label: "Exam",  value: e.exam, max: 40 },
                      ].map(m => (
                        <div key={m.label} className="p-3 text-center bg-slate-50 rounded-xl">
                          <p className="mb-1 text-xs text-slate-400">{m.label}</p>
                          <p className="text-sm font-bold text-slate-700">{m.value !== null && m.value !== undefined ? m.value : "—"}<span className="text-xs font-normal text-slate-400">/{m.max}</span></p>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end mt-3">
                      <button onClick={() => handleUnenroll(e.group_id)} className="text-xs font-medium text-red-400 transition-colors hover:text-red-600">Leave group</button>
                    </div>
                  </div>
                ))}
                {enrollments.length === 0 && <p className="text-sm text-slate-400">No courses yet. <button onClick={() => go("browse")} className="text-indigo-500 hover:underline">Browse now →</button></p>}
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
                <div><label className="block mb-2 text-xs font-semibold tracking-widest uppercase text-slate-500">Full Name</label><input value={editName} onChange={e => setEditName(e.target.value)} required className="w-full px-4 py-3 text-sm transition-all border rounded-xl border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" /></div>
                <div><label className="block mb-2 text-xs font-semibold tracking-widest uppercase text-slate-500">Email</label><input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} required className="w-full px-4 py-3 text-sm transition-all border rounded-xl border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" /></div>
                <button type="submit" className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all">Save Changes</button>
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
                  <div key={f.label}><label className="block mb-2 text-xs font-semibold tracking-widest uppercase text-slate-500">{f.label}</label><input type="password" value={f.val} onChange={e => f.set(e.target.value)} required className="w-full px-4 py-3 text-sm transition-all border rounded-xl border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" /></div>
                ))}
                <button type="submit" className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all">Update Password</button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}