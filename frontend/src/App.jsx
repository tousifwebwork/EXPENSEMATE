import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import RequireAuth from "./components/RequireAuth.jsx";

import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx"; 

import Dashboard from "./pages/Dashboard.jsx";
import Groups from "./pages/Groups.jsx";
import GroupDetails from "./pages/groups/GroupDetails.jsx";
import Friends from "./pages/Friends.jsx";
import Expenses from "./pages/Expenses.jsx";
import Settlements from "./pages/Settlements.jsx";
import Profile from "./pages/Profile.jsx";
import ViewProfile from "./pages/ViewProfile.jsx";
import Settings from "./pages/Settings.jsx"; 

function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />

      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} /> 

        <Route path="/dashboard" element={<RequireAuth role="user"><Dashboard /></RequireAuth>} />
        <Route path="/groups" element={<RequireAuth role="user"><Groups /></RequireAuth>} />
        <Route path="/groups/:groupId" element={<RequireAuth role="user"><GroupDetails /></RequireAuth>} />
        <Route path="/friends" element={<RequireAuth role="user"><Friends /></RequireAuth>} />
        <Route path="/expenses" element={<RequireAuth role="user"><Expenses /></RequireAuth>} />
        <Route path="/settlements" element={<RequireAuth role="user"><Settlements /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth role="user"><Profile /></RequireAuth>} />
        <Route path="/viewprofile/:userId" element={<RequireAuth role="user"><ViewProfile /></RequireAuth>} />
        <Route path="/settings" element={<RequireAuth role="user"><Settings /></RequireAuth>} />
 
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}

export default App;