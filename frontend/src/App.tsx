import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import AdminRoute from "./components/AdminRoute";
import Home from "./pages/Home";
import Login from "./pages/admin/Login";
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import AdminProjects from "./pages/admin/AdminProjects";
import AdminSkills from "./pages/admin/AdminSkills";
import AdminExperience from "./pages/admin/AdminExperience";
import AdminProfile from "./pages/admin/AdminProfile";
import AdminMessages from "./pages/admin/AdminMessages";
import AdminMedia from "./pages/admin/AdminMedia";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public portfolio */}
            <Route path="/" element={<Home />} />

            {/* Admin login */}
            <Route path="/admin/login" element={<Login />} />

            {/* Protected admin area */}
            <Route path="/admin" element={<AdminRoute />}>
              <Route element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="projects" element={<AdminProjects />} />
                <Route path="skills" element={<AdminSkills />} />
                <Route path="experience" element={<AdminExperience />} />
                <Route path="profile" element={<AdminProfile />} />
                <Route path="messages" element={<AdminMessages />} />
                <Route path="media" element={<AdminMedia />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}