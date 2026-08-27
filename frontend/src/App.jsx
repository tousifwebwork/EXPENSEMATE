import { Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import RequireAuth from './components/RequireAuth.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import AdminSignIn from './pages/AdminSignIn.jsx'
import AdminRegister from './pages/AdminRegister.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Groups from './pages/Groups.jsx'
import Expenses from './pages/Expenses.jsx'
import Settlements from './pages/Settlements.jsx'
import Settings from './pages/Settings.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import GroupDetails from './pages/groups/GroupDetails.jsx'

function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Routes>
      {/* Visiting the site root just sends people to the dashboard.
          RequireAuth (below) then bounces them to /login if needed. */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Public pages — anyone can visit these without being signed in */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/admin/login" element={<AdminSignIn />} />
      <Route path="/admin/register" element={<AdminRegister />} />

      {/* Protected pages — RequireAuth redirects to /login if signed out */}
      <Route path="/dashboard" element={<RequireAuth role="user"><Dashboard /></RequireAuth>} />
      <Route path="/groups" element={<RequireAuth role="user"><Groups /></RequireAuth>} />
      <Route path="/groups/:groupId" element={<RequireAuth role="user"><GroupDetails /></RequireAuth>} />
      <Route path="/expenses" element={<RequireAuth role="user"><Expenses /></RequireAuth>} />
      <Route path="/settlements" element={<RequireAuth role="user"><Settlements /></RequireAuth>} />
      <Route path="/settings" element={<RequireAuth role="user"><Settings /></RequireAuth>} />
      <Route path="/admin/dashboard" element={<RequireAuth role="admin"><AdminDashboard /></RequireAuth>} />

      {/* Any unknown URL falls back to the dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  )
}

export default App
