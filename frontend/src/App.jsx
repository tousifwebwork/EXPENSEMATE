import { Routes, Route, Navigate } from 'react-router-dom'

import Login from './pages/auth/Login.jsx'
import Register from './pages/auth/Register.jsx'
import Groups from './pages/group/Groups.jsx'
import ViewGroup from './pages/group/ViewGroup.jsx'
import GroupExpenses from './pages/group/GroupExpenses.jsx'
import Expenses from './pages/Expenses.jsx'
import Friends from './pages/Friends.jsx'
import Profile from './pages/Profile.jsx'
import ViewProfile from './pages/ViewProfile.jsx'
import AddExpense from './pages/expense/AddExpense.jsx'
import EditExpense from './pages/expense/EditExpense.jsx'
import Balances from './pages/Balances.jsx'
import SettlementSuggestions from './pages/SettlementSuggestions.jsx'

import Protected from './pages/protected/Protected.jsx'

function App() {
  return (
    <Routes>

      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Routes */}
      <Route element={<Protected />}>

        <Route path="/" element={<Navigate to="/groups" replace />} />

        {/* Groups */}
        <Route path="/groups"  element={<Groups />} />
        <Route  path="/groups/:groupId" element={<ViewGroup />} />

        {/* Group Expenses */}
        <Route path="/groups/:groupId/expenses" element={<GroupExpenses />}/>
        <Route path="/groups/:groupId/expenses/add" element={<AddExpense />}/>
        <Route path="/groups/:groupId/expenses/:expenseId/edit" element={<EditExpense />}/>

        {/* Friends */}
        <Route path="/friends" element={<Friends />}/>
        {/* All Expenses */}
        <Route path="/expenses" element={<Expenses />}/>
        {/* Balances */}
        <Route path="/balances" element={<Balances />}/>
        {/* Settlement Suggestions */}
        <Route path="/settlement-suggestions" element={<SettlementSuggestions />}/>
        {/* Profile */}
        <Route path="/profile" element={<Profile />}/>
        <Route path="/viewprofile/:userId" element={<ViewProfile />}/>
        {/* 404 */}
        <Route path="*" element={<Navigate to="/groups" replace />}/>

      </Route>

    </Routes>
  )
}

export default App