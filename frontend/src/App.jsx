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
<<<<<<< HEAD
import Profile from './pages/Profile.jsx'
import Friends from "./pages/Friends.jsx"
import Protected from './pages/protected/Protected.jsx'
import ViewProfile from './pages/ViewProfile.jsx'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<Protected />}>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/groups" element={<Groups />} />
      <Route path="/friends" element={<Friends />} />
      <Route path="/expenses" element={<Expenses />} />
      <Route path="/settlements" element={<Settlements />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/viewprofile/:userId" element={<ViewProfile />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
      </Route>



    </Routes>
=======
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
>>>>>>> origin/trial
  )
}

export default App
