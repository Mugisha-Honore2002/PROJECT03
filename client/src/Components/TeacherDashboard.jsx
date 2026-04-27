import { useState, useEffect } from "react";
import axios from "axios";
import SearchBar from "./SearchBar";
import logo from "../Assets/education-school-logo-design-template_731136-92.avif";

const api = axios.create({ baseURL: "" });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const MARKS_FIELDS = [
  { key: "quiz2", label: "Quiz 2", max: 10, endpoint: "quiz2" },
  { key: "quiz1", label: "Quiz 1", max: 10, endpoint: "quiz1" },
  { key: "group_work", label: "Group", max: 10, endpoint: "group-work" },
  { key: "continuous_assessment", label: "CA", max: 10, endpoint: "ca"         },
  { key: "midsem", label: "Midsem", max: 30, endpoint: "midsem" },
  { key: "exam", label: "Exam", max: 40, endpoint: "exam" },
];

const NavItem = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${active ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"}`}>
    <span className="flex items-center justify-center w-5 h-5">{icon}</span>{label}
  </button>
);

export default function TeacherDashboard() {
  const user   = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user.id;

  const [page, setPage] = useState("overview");
  const [profile, setProfile] = useState(user);
  const [myGroups, setMyGroups] = useState([]);
  const [availGroups, setAvailGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [claimingId, setClaimingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editName, setEditName] = useState(user.full_name || "");
  const [editEmail, setEditEmail] = useState(user.email || "");
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confPw, setConfPw] = useState("");
  const [markInputs, setMarkInputs] = useState({});
  const [studentSearch, setStudentSearch] = useState(null);
  const [groupSearch, setGroupSearch] = useState(null);
  const [savingMark, setSavingMark] = useState(null);

  useEffect(() => { fetchMyGroups(); fetchAvailGroups(); }, []);

  const fetchMyGroups = async () => {
    try { const r = await api.get("/api/assignment/my-groups"); setMyGroups(r.data); }
    catch {}
  };

  const fetchAvailGroups = async () => {
    try { const r = await api.get("/api/assignment/available"); setAvailGroups(r.data); }
    catch {}
  };

  const handleClaimGroup = async (groupId) => {
    setClaimingId(groupId); setError(""); setSuccess("");
    try {
      await api.post(`/api/assignment/claim/${groupId}`);
      setSuccess("Group claimed! It's now assigned to you.");
      fetchMyGroups(); fetchAvailGroups();
    } catch (err) { setError(err.response?.data?.error || "Failed to claim group."); }
    finally { setClaimingId(null); }
  };

  const handleReleaseGroup = async (groupId) => {
    if (!window.confirm("Release this group? It will become available to other teachers.")) return;
    setError(""); setSuccess("");
    try {
      await api.delete(`/api/assignment/release/${groupId}`);
      setSuccess("Group released.");
      if (selectedGroup?.id === groupId) { setSelectedGroup(null); setStudents([]); }
      fetchMyGroups(); fetchAvailGroups();
    } catch (err) { setError(err.response?.data?.error || "Failed."); }
  };

  const fetchStudents = async (group) => {
    setSelectedGroup(group); setStudents([]); setLoading(true);
    try {
      const r = await api.get(`/api/enrollment/group/${group.id}`);
      setStudents(r.data);
      const inputs = {};
      r.data.forEach(s => { inputs[s.enrollment_id] = {}; });
      setMarkInputs(inputs);
    } catch { setError("Failed to load students."); }
    finally { setLoading(false); }
  };

  const handleSetMark = async (enrollmentId, field) => {
    const val = markInputs[enrollmentId]?.[field.key];
    if (val === undefined || val === "") return;
    setSavingMark(`${enrollmentId}-${field.key}`); setError(""); setSuccess("");
    try {
      await api.put(`/api/marks/${field.endpoint}/${enrollmentId}`, { [field.key]: Number(val) });
      setSuccess(`${field.label} saved.`);
      const r = await api.get(`/api/enrollment/group/${selectedGroup.id}`);
      setStudents(r.data);
    } catch (err) { setError(err.response?.data?.error || "Failed to save."); }
    finally { setSavingMark(null); }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault(); setError(""); setSuccess("");
    try {
      const res = await api.put(`/api/teacher/${userId}`, { full_name: editName, email: editEmail });
      setProfile(res.data); localStorage.setItem("user", JSON.stringify(res.data));
      setSuccess("Profile updated.");
    } catch (err) { setError(err.response?.data?.error || "Update failed."); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault(); setError(""); setSuccess("");
    if (newPw !== confPw) { setError("Passwords do not match."); return; }
    try {
      await api.put(`/api/teacher/${userId}/password`, { old_password: oldPw, new_password: newPw });
      setSuccess("Password changed."); setOldPw(""); setNewPw(""); setConfPw("");
    } catch (err) { setError(err.response?.data?.error || "Failed."); }
  };

  const handleLogout = () => { localStorage.clear(); window.location.href = "/login"; };
  const filteredStudents  = studentSearch ? [studentSearch] : students;
  const filteredAvailGroups = groupSearch  ? availGroups.filter(g => g.course_name?.toLowerCase().includes((groupSearch.course_name||"").toLowerCase())) : availGroups;

  const go = (p) => { setPage(p); setError(""); setSuccess(""); setSelectedGroup(null); setStudents([]); };

  return (
    <div className="flex min-h-screen font-sans bg-slate-50">
      <aside className="flex flex-col px-3 py-6 bg-white border-r w-60 shrink-0 border-slate-100">
        <div className="flex items-center gap-3 px-3 mb-8">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-600">
             <img src={logo} alt="Logo" className="rounded rounded-md " />
          </div>
          <span className="text-xs font-semibold tracking-widest uppercase text-slate-400">Apex Digital</span>
        </div>
        <div className="flex flex-col items-center px-3 mb-8">
          <div className="flex items-center justify-center mb-2 bg-indigo-100 w-14 h-14 rounded-2xl">
            <span className="text-2xl font-bold text-indigo-600">{(profile.full_name || "T")[0].toUpperCase()}</span>
          </div>
          <p className="text-sm font-semibold text-center text-slate-800">{profile.full_name}</p>
          <span className="mt-1 text-xs bg-indigo-50 text-indigo-600 font-medium px-2 py-0.5 rounded-full">Teacher</span>
        </div>
        <nav className="flex flex-col flex-1 gap-1">
          <NavItem label="Overview" active={page==="overview"}  onClick={() => go("overview")}
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>} />
          <NavItem label="Pick a Group" active={page==="pick"} onClick={() => go("pick")}
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>} />
          <NavItem label="Enter Marks" active={page==="marks"} onClick={() => go("marks")}
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>} />
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
            <h1 className="mb-1 text-2xl font-bold text-slate-900">Welcome, {profile.full_name?.split(" ")[0]}</h1>
            <p className="mb-8 text-sm text-slate-400">Your teaching overview.</p>
            <div className="grid grid-cols-1 gap-4 mb-8 sm:grid-cols-2">
              <div className="p-5 bg-white border rounded-2xl border-slate-100">
                <p className="mb-2 text-xs font-semibold tracking-widest uppercase text-slate-400">My Groups</p>
                <p className="text-3xl font-bold text-emerald-600">{myGroups.length}</p>
              </div>
              <div className="p-5 bg-white border rounded-2xl border-slate-100">
                <p className="mb-2 text-xs font-semibold tracking-widest uppercase text-slate-400">Available to Claim</p>
                <p className="text-3xl font-bold text-amber-500">{availGroups.length}</p>
              </div>
            </div>
            <h2 className="mb-4 text-base font-semibold text-slate-800">My Assigned Groups</h2>
            <div className="grid gap-3">
              {myGroups.map(g => (
                <div key={g.id} className="flex items-center justify-between p-4 bg-white border rounded-2xl border-slate-100">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{g.course_name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{g.course_code} · Group {g.group_label} · {g.enrolled_students} students</p>
                  </div>
                  <button onClick={() => { go("marks"); fetchStudents(g); }} className="text-xs font-medium text-indigo-600 transition-colors hover:text-indigo-800">Enter Marks →</button>
                </div>
              ))}
              {myGroups.length === 0 && <p className="text-sm text-slate-400">You haven't claimed any groups yet. <button onClick={() => go("pick")} className="text-emerald-600 hover:underline">Pick one →</button></p>}
            </div>
          </div>
        )}

        {/* PICK A GROUP */}
        {page === "pick" && (
          <div>
            <h1 className="mb-1 text-2xl font-bold text-slate-900">Pick a Group</h1>
            <p className="mb-8 text-sm text-slate-400">Available groups without a teacher. Once you claim one, it disappears from this list for other teachers.</p>

            {/* my current groups */}
            {myGroups.length > 0 && (
              <div className="mb-8">
                <h2 className="mb-3 text-sm font-semibold tracking-widest uppercase text-slate-500">Your Current Groups</h2>
                <div className="grid gap-3">
                  {myGroups.map(g => (
                    <div key={g.id} className="flex items-center justify-between p-4 border border-indigo-200 bg-indigo-50 rounded-2xl">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-800">{g.course_name}</p>
                          <span className="text-xs bg-indigo-100 text-indigo-700 font-medium px-2 py-0.5 rounded-full">Assigned to you</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{g.course_code} · Group {g.group_label} · {g.enrolled_students} students</p>
                      </div>
                      <button onClick={() => handleReleaseGroup(g.id)} className="text-xs font-medium text-red-400 transition-colors hover:text-red-600">Release</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <h2 className="mb-3 text-sm font-semibold tracking-widest uppercase text-slate-500">Available Groups</h2>
            <div className="mb-4"><SearchBar items={availGroups} searchKeys={["course_name","course_code","group_label"]} placeholder="Search available groups…" onSelect={setGroupSearch} renderLabel={g => g.course_name} renderSub={g => `${g.course_code} · Group ${g.group_label}`} accentColor="text-indigo-600" /></div>
            <div className="grid gap-3">
              {filteredAvailGroups.map(g => (
                <div key={g.id} className="flex items-center justify-between p-4 bg-white border rounded-2xl border-slate-100">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{g.course_name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{g.course_code} · Group {g.group_label} · Capacity {g.capacity} · {g.enrolled_students} enrolled</p>
                  </div>
                  <button onClick={() => handleClaimGroup(g.id)} disabled={claimingId === g.id} className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 transition-all shrink-0">
                    {claimingId === g.id ? "…" : "Claim"}
                  </button>
                </div>
              ))}
              {availGroups.length === 0 && <p className="text-sm text-slate-400">No available groups right now. All groups have been assigned.</p>}
            </div>
          </div>
        )}

        {/* ENTER MARKS */}
        {page === "marks" && (
          <div>
            <h1 className="mb-1 text-2xl font-bold text-slate-900">Enter Marks</h1>
            <p className="mb-6 text-sm text-slate-400">Select one of your groups then enter marks per student.</p>

            <div className="flex flex-wrap gap-2 mb-8">
              {myGroups.map(g => (
                <button key={g.id} onClick={() => fetchStudents(g)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${selectedGroup?.id === g.id ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200 hover:border-indigo-400"}`}>
                  {g.course_code} · Group {g.group_label}
                </button>
              ))}
              {myGroups.length === 0 && <p className="text-sm text-slate-400">You have no groups assigned yet. <button onClick={() => go("pick")} className="text-indigo-600 hover:underline">Claim a group first →</button></p>}
            </div>

            {loading && <p className="text-sm text-slate-400">Loading students…</p>}

            {selectedGroup && !loading && (
              <div>
                <h2 className="mb-4 text-base font-semibold text-slate-800">{selectedGroup.course_name} — Group {selectedGroup.group_label}</h2>
                <div className="mb-5"><SearchBar items={students} searchKeys={["full_name","email"]} placeholder="Search students in this group…" onSelect={setStudentSearch} renderLabel={s => s.full_name} renderSub={s => s.email} renderAvatar={s => s.full_name?.[0]?.toUpperCase()} accentColor="text-emerald-600" /></div>
                {filteredStudents.length === 0 && <p className="text-sm text-slate-400">No students found.</p>}
                <div className="grid gap-5">
                  {filteredStudents.map(s => (
                    <div key={s.enrollment_id} className="p-5 bg-white border rounded-2xl border-slate-100">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="font-semibold text-slate-800">{s.full_name}</p>
                          <p className="text-xs text-slate-400">{s.email} · Enrollment #{s.enrollment_id?.slice(0,8)}…</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-slate-700">{s.total !== null && s.total !== undefined ? `${s.total}%` : "—"}</p>
                          <p className="text-xs text-slate-400">Total</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {MARKS_FIELDS.map(field => (
                          <div key={field.key} className="p-3 bg-slate-50 rounded-xl">
                            <p className="text-xs text-slate-400 mb-0.5">{field.label} <span className="text-slate-300">(0–{field.max})</span></p>
                            <p className="mb-2 text-xs font-semibold text-indigo-600">Current: {s[field.key] !== null && s[field.key] !== undefined ? s[field.key] : "—"}</p>
                            <div className="flex gap-2">
                              <input
                                type="number" min={0} max={field.max}
                                placeholder={`0–${field.max}`}
                                value={markInputs[s.enrollment_id]?.[field.key] ?? ""}
                                onChange={ev => setMarkInputs(prev => ({ ...prev, [s.enrollment_id]: { ...prev[s.enrollment_id], [field.key]: ev.target.value } }))}
                                className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              />
                              <button
                                onClick={() => handleSetMark(s.enrollment_id, field)}
                                disabled={savingMark === `${s.enrollment_id}-${field.key}`}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 transition-all shrink-0"
                              >
                                {savingMark === `${s.enrollment_id}-${field.key}` ? "…" : "Save"}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
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