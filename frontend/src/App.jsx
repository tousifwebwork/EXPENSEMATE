import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/auth/Login.jsx'
import Register from './pages/auth/Register.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Groups from './pages/group/Groups.jsx'
import Expenses from './pages/Expenses.jsx'
import Settlements from './pages/Settlements.jsx'
import Profile from './pages/Profile.jsx'
import Friends from "./pages/Friends.jsx"
import Protected from './pages/protected/Protected.jsx'
import ViewProfile from './pages/ViewProfile.jsx'
import ViewGroup from './pages/group/ViewGroup.jsx'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<Protected />}>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/groups" element={<Groups />} />
      <Route path="/groups/:groupId" element={<ViewGroup />} />
      <Route path="/friends" element={<Friends />} />
      <Route path="/expenses" element={<Expenses />} />
      <Route path="/settlements" element={<Settlements />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/viewprofile/:userId" element={<ViewProfile />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
      </Route>



    </Routes>
  )
}

export default App
