import React from "react";
import { Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";

import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ResidentComplaints from "./pages/ResidentComplaints.jsx";
import RaiseComplaint from "./pages/RaiseComplaint.jsx";
import ComplaintDetail from "./pages/ComplaintDetail.jsx";
import NoticeBoard from "./pages/NoticeBoard.jsx";
import AdminComplaints from "./pages/AdminComplaints.jsx";
import AdminNotices from "./pages/AdminNotices.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";

function Private({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="navbar-brand">🏡 Society Maintenance Tracker</div>
      <div className="navbar-links">
        {user.role === "RESIDENT" && (
          <>
            <Link to="/">My Complaints</Link>
            <Link to="/raise">Raise Complaint</Link>
            <Link to="/notices">Notice Board</Link>
          </>
        )}
        {user.role === "ADMIN" && (
          <>
            <Link to="/">Dashboard</Link>
            <Link to="/admin/complaints">Complaints</Link>
            <Link to="/admin/notices">Notices</Link>
          </>
        )}
        <span className="navbar-user">
          {user.name} ({user.role})
        </span>
        <button
          className="btn-link"
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

function Home() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "ADMIN") return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/complaints" replace />;
}

export default function App() {
  return (
    <div>
      <NavBar />
      <main className="container">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Home />} />

          {/* Resident routes */}
          <Route
            path="/complaints"
            element={
              <Private role="RESIDENT">
                <ResidentComplaints />
              </Private>
            }
          />
          <Route
            path="/raise"
            element={
              <Private role="RESIDENT">
                <RaiseComplaint />
              </Private>
            }
          />
          <Route
            path="/notices"
            element={
              <Private>
                <NoticeBoard />
              </Private>
            }
          />
          <Route
            path="/complaint/:id"
            element={
              <Private>
                <ComplaintDetail />
              </Private>
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin/dashboard"
            element={
              <Private role="ADMIN">
                <AdminDashboard />
              </Private>
            }
          />
          <Route
            path="/admin/complaints"
            element={
              <Private role="ADMIN">
                <AdminComplaints />
              </Private>
            }
          />
          <Route
            path="/admin/notices"
            element={
              <Private role="ADMIN">
                <AdminNotices />
              </Private>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
