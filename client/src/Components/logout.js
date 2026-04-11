// src/Components/logout.js
// Call this from any dashboard logout button.
// It clears ALL localStorage keys related to auth and
// does a hard redirect to /loginpage so the browser
// history stack is replaced — the Back button can't
// return to the dashboard.

const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("user");
  // replace current history entry so Back button won't go back to dashboard
  window.location.replace("/loginpage");
};

export default logout;
