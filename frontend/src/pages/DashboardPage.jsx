import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user, logout, updateUser } = useAuth();
  const [claimingAdmin, setClaimingAdmin] = useState(false);
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupForm, setGroupForm] = useState({ name: '', description: '', baseCurrency: 'INR' });
  const [expenseForm, setExpenseForm] = useState({
    title: '', amount: '', payer: '', participants: [], splitType: 'equal', category: 'Other', shares: {},
  });
  const [settlementForm, setSettlementForm] = useState({ payer: '', receiver: '', amount: '', note: '' });
  const [editingExpenseId, setEditingExpenseId] = useState('');
  const [memberQuery, setMemberQuery] = useState('');
  const [memberResults, setMemberResults] = useState([]);

  const selectedGroup = groups.find((group) => String(group._id) === selectedGroupId);
  const selectedMembers = selectedGroup?.members || [];

  const money = (value) => `${selectedGroup?.baseCurrency || 'INR'} ${Number(value || 0).toFixed(2)}`;
  const userName = (id) => selectedMembers.find((member) => String(member._id) === String(id))?.name || 'Unknown user';

  const loadGroups = async () => {
    const response = await api.get('/groups');
    const nextGroups = response.data.groups;
    setGroups(nextGroups);
    setSelectedGroupId((current) => current || (nextGroups[0] ? String(nextGroups[0]._id) : ''));
    return nextGroups;
  };

  const loadGroupData = async (groupId) => {
    if (!groupId) return;
    const [expenseResponse, balanceResponse] = await Promise.all([
      api.get(`/groups/${groupId}/expenses`),
      api.get(`/groups/${groupId}/balances`),
    ]);
    setExpenses(expenseResponse.data.expenses);
    setBalances(balanceResponse.data.balances);
    setSuggestions(balanceResponse.data.suggestions);
  };

  useEffect(() => {
    loadGroups()
      .catch((error) => toast.error(error.response?.data?.message || 'Could not load groups'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedGroupId) return;
    loadGroupData(selectedGroupId).catch((error) => toast.error(error.response?.data?.message || 'Could not load group data'));
    setExpenseForm((current) => ({
      ...current,
      payer: current.payer || String(user.id),
      participants: current.participants.length ? current.participants : [String(user.id)],
    }));
  }, [selectedGroupId]);

  const totals = useMemo(() => {
    const currentBalance = balances[String(user.id)] || { net: 0 };
    return {
      owed: currentBalance.net < 0 ? Math.abs(currentBalance.net) : 0,
      receive: currentBalance.net > 0 ? currentBalance.net : 0,
    };
  }, [balances, user.id]);

  const claimFirstAdmin = async () => {
    setClaimingAdmin(true);
    try {
      const response = await api.post('/admin/bootstrap');
      updateUser(response.data.user);
      toast.success('You are now the platform admin');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not enable admin access');
    } finally {
      setClaimingAdmin(false);
    }
  };

  const createGroup = async (event) => {
    event.preventDefault();
    try {
      const response = await api.post('/groups', groupForm);
      const nextGroups = await loadGroups();
      setSelectedGroupId(String(response.data.group._id));
      setGroups(nextGroups);
      setGroupForm({ name: '', description: '', baseCurrency: 'INR' });
      toast.success('Group created');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not create group');
    }
  };

  const submitExpense = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        ...expenseForm,
        participants: expenseForm.participants,
        shares: expenseForm.splitType === 'equal'
          ? []
          : expenseForm.participants.map((memberId) => ({ user: memberId, amount: Number(expenseForm.shares[memberId] || 0) })),
      };
      if (editingExpenseId) {
        await api.put(`/expenses/${editingExpenseId}`, payload);
      } else {
        await api.post(`/groups/${selectedGroupId}/expenses`, payload);
      }
      await loadGroupData(selectedGroupId);
      setExpenseForm({ title: '', amount: '', payer: String(user.id), participants: [String(user.id)], splitType: 'equal', category: 'Other', shares: {} });
      setEditingExpenseId('');
      toast.success(editingExpenseId ? 'Expense updated' : 'Expense added');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not add expense');
    }
  };

  const editExpense = (expense) => {
    setEditingExpenseId(String(expense._id));
    setExpenseForm({
      title: expense.title,
      amount: expense.amount,
      payer: String(expense.payer?._id || expense.payer),
      participants: expense.participants.map((member) => String(member._id || member)),
      splitType: expense.splitType,
      category: expense.category,
      shares: Object.fromEntries((expense.shares || []).map((share) => [String(share.user), share.amount])),
    });
  };

  const deleteExpense = async (expenseId) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await api.delete(`/expenses/${expenseId}`);
      await loadGroupData(selectedGroupId);
      toast.success('Expense deleted');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not delete expense');
    }
  };

  const submitSettlement = async (event) => {
    event.preventDefault();
    try {
      await api.post(`/groups/${selectedGroupId}/settlements`, settlementForm);
      await loadGroupData(selectedGroupId);
      setSettlementForm({ payer: '', receiver: '', amount: '', note: '' });
      toast.success('Settlement recorded');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not record settlement');
    }
  };

  const chooseSuggestion = (suggestion) => setSettlementForm({
    payer: suggestion.from,
    receiver: suggestion.to,
    amount: suggestion.amount,
    note: 'Suggested settlement',
  });

  const searchMembers = async (event) => {
    const value = event.target.value;
    setMemberQuery(value);
    if (!value.trim()) {
      setMemberResults([]);
      return;
    }
    try {
      const response = await api.get('/users/search', { params: { q: value } });
      setMemberResults(response.data.users);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not search users');
    }
  };

  const addMember = async (userId) => {
    try {
      await api.post(`/groups/${selectedGroupId}/members`, { userId });
      await loadGroups();
      setMemberQuery('');
      setMemberResults([]);
      toast.success('Member added');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not add member');
    }
  };

  const removeMember = async (userId) => {
    if (!window.confirm('Remove this member from the group?')) return;
    try {
      await api.delete(`/groups/${selectedGroupId}/members/${userId}`);
      await loadGroups();
      toast.success('Member removed');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not remove member');
    }
  };

  const toggleGroupAdmin = async (memberId, makeAdmin) => {
    try {
      await api.put(`/groups/${selectedGroupId}/members/${memberId}/admin`, { makeAdmin });
      await loadGroups();
      toast.success(makeAdmin ? 'Group admin promoted' : 'Group admin demoted');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update group role');
    }
  };

  return (
    <div className="page-shell">
      <header className="topbar">
        <div>
          <p className="muted">Welcome back</p>
          <h2>{user?.name || 'ExpenseMate User'}</h2>
        </div>
        <button type="button" className="btn-secondary" onClick={logout}>
          Log out
        </button>
        {user?.platformRole === 'platformAdmin' && (
          <Link className="btn-primary" to="/admin">Admin access</Link>
        )}
        <div className="button-row">
          <Link className="btn-secondary" to="/friends">Friends</Link>
          <Link className="btn-secondary" to="/notifications">Notifications</Link>
          <Link className="btn-secondary" to="/profile">Profile</Link>
          <Link className="btn-secondary" to="/reports">Reports</Link>
        </div>
      </header>

      {user?.platformRole !== 'platformAdmin' && (
        <div className="card admin-access-card">
          <div>
            <p className="muted">Platform access</p>
            <strong>Admin access is available only to the first account or an existing admin.</strong>
          </div>
          <button type="button" className="btn-primary" onClick={claimFirstAdmin} disabled={claimingAdmin}>
            {claimingAdmin ? 'Checking...' : 'Claim first admin access'}
          </button>
        </div>
      )}

      <div className="dashboard-layout">
        <aside className="card group-panel">
          <div className="section-heading">
            <div><p className="muted">Your spaces</p><h3>Groups</h3></div>
          </div>
          {loading ? <p className="muted">Loading groups...</p> : groups.map((group) => (
            <button
              type="button"
              className={`group-option ${selectedGroupId === String(group._id) ? 'selected' : ''}`}
              key={group._id}
              onClick={() => setSelectedGroupId(String(group._id))}
            >
              <strong>{group.name}</strong>
              <span>{group.members?.length || 0} members · {group.baseCurrency}</span>
            </button>
          ))}
          <form className="compact-form" onSubmit={createGroup}>
            <input className="input" placeholder="New group name" value={groupForm.name} onChange={(event) => setGroupForm({ ...groupForm, name: event.target.value })} required />
            <button className="btn-primary" type="submit">Create group</button>
          </form>
        </aside>

        <section className="workspace-column">
          {!selectedGroup ? <div className="card empty-state"><h3>Create your first group</h3><p className="muted">Add a group to start recording shared expenses.</p></div> : (
            <>
              <div className="group-heading">
                <div><p className="muted">{selectedGroup.description || 'Shared expenses'}</p><h1>{selectedGroup.name}</h1></div>
                <span className="role-badge">{selectedGroup.members.length} members</span>
              </div>
              <div className="card workflow-card member-management">
                <h3>Manage members</h3>
                <input className="input" value={memberQuery} onChange={searchMembers} placeholder="Search registered users to add" />
                {memberResults.map((result) => <button className="suggestion" type="button" key={result.id} onClick={() => addMember(result.id)}>{result.name} · {result.email} <strong>Add</strong></button>)}
                {selectedMembers.map((member) => {
                  const memberId = String(member._id);
                  const isOwner = String(selectedGroup.owner?._id || selectedGroup.owner) === memberId;
                  const isAdmin = (selectedGroup.admins || []).some((admin) => String(admin._id || admin) === memberId);
                  return <div className="list-row" key={memberId}><div><strong>{member.name}</strong><span>{isOwner ? 'Group owner' : isAdmin ? 'Group admin' : 'Group member'}</span></div>{!isOwner && <div className="button-row"><button className="btn-secondary" type="button" onClick={() => toggleGroupAdmin(memberId, !isAdmin)}>{isAdmin ? 'Demote' : 'Make admin'}</button><button className="btn-secondary" type="button" onClick={() => removeMember(memberId)}>Remove</button></div>}</div>;
                })}
              </div>
              <div className="dashboard-grid">
        <div className="card metric-card">
          <p>Total expenses</p><strong>{money(expenses.reduce((sum, expense) => sum + expense.amount, 0))}</strong>
        </div>
        <div className="card metric-card">
          <p>You are owed</p><strong>{money(totals.receive)}</strong>
        </div>
        <div className="card metric-card">
          <p>You owe</p><strong>{money(totals.owed)}</strong>
        </div>
        <div className="card metric-card">
          <p>Expenses recorded</p><strong>{expenses.length}</strong>
        </div>
      </div>
              <div className="workspace-grid">
                <form className="card workflow-card" onSubmit={submitExpense}>
                  <h3>{editingExpenseId ? 'Edit expense' : 'Add expense'}</h3>
                  <input className="input" placeholder="What was it for?" value={expenseForm.title} onChange={(event) => setExpenseForm({ ...expenseForm, title: event.target.value })} required />
                  <input className="input" type="number" min="0.01" step="0.01" placeholder="Amount" value={expenseForm.amount} onChange={(event) => setExpenseForm({ ...expenseForm, amount: event.target.value })} required />
                  <select className="input" value={expenseForm.payer} onChange={(event) => setExpenseForm({ ...expenseForm, payer: event.target.value })}>{selectedMembers.map((member) => <option value={member._id} key={member._id}>{member.name} paid</option>)}</select>
                  <select className="input" value={expenseForm.category} onChange={(event) => setExpenseForm({ ...expenseForm, category: event.target.value })}>{['Food', 'Travel', 'Shopping', 'Rent', 'Utilities', 'Entertainment', 'Accommodation', 'Medical', 'Other'].map((category) => <option key={category}>{category}</option>)}</select>
                  <select className="input" value={expenseForm.splitType} onChange={(event) => setExpenseForm({ ...expenseForm, splitType: event.target.value })}><option value="equal">Split equally</option><option value="exact">Split by exact amount</option><option value="percentage">Split by percentage</option></select>
                  <div className="member-checks"><span className="muted">Participants</span>{selectedMembers.map((member) => { const memberId = String(member._id); return <label key={memberId}><input type="checkbox" checked={expenseForm.participants.includes(memberId)} onChange={(event) => setExpenseForm({ ...expenseForm, participants: event.target.checked ? [...expenseForm.participants, memberId] : expenseForm.participants.filter((id) => id !== memberId) })} /> {member.name}{expenseForm.splitType !== 'equal' && expenseForm.participants.includes(memberId) && <input className="share-input" type="number" min="0" step="0.01" placeholder={expenseForm.splitType === 'percentage' ? '%' : 'amount'} value={expenseForm.shares[memberId] || ''} onChange={(event) => setExpenseForm({ ...expenseForm, shares: { ...expenseForm.shares, [memberId]: event.target.value } })} />}</label>; })}</div>
                  <div className="button-row"><button className="btn-primary" type="submit">{editingExpenseId ? 'Save changes' : 'Add expense'}</button>{editingExpenseId && <button className="btn-secondary" type="button" onClick={() => { setEditingExpenseId(''); setExpenseForm({ title: '', amount: '', payer: String(user.id), participants: [String(user.id)], splitType: 'equal', category: 'Other', shares: {} }); }}>Cancel</button>}</div>
                </form>
                <div className="card workflow-card"><h3>Balance summary</h3>{Object.entries(balances).map(([memberId, row]) => <div className="balance-row" key={memberId}><span>{userName(memberId)}</span><strong className={row.net >= 0 ? 'positive' : 'negative'}>{row.label === 'should_receive' ? `gets ${money(row.net)}` : row.label === 'owes' ? `owes ${money(Math.abs(row.net))}` : 'settled'}</strong></div>)}<h4>Suggested settlements</h4>{suggestions.length ? suggestions.map((suggestion) => <button className="suggestion" type="button" key={`${suggestion.from}-${suggestion.to}`} onClick={() => chooseSuggestion(suggestion)}>{userName(suggestion.from)} pays {userName(suggestion.to)} {money(suggestion.amount)}</button>) : <p className="muted">Everyone is settled.</p>}</div>
              </div>
              <div className="workspace-grid">
                <div className="card workflow-card"><h3>Recent expenses</h3>{expenses.length ? expenses.slice(0, 8).map((expense) => <div className="expense-row" key={expense._id}><div><strong>{expense.title}</strong><span>{expense.category} · paid by {expense.payer?.name}</span></div><strong>{money(expense.amount)}</strong><div className="button-row"><button className="btn-secondary" type="button" onClick={() => editExpense(expense)}>Edit</button><button className="btn-secondary" type="button" onClick={() => deleteExpense(expense._id)}>Delete</button></div></div>) : <p className="muted">No expenses recorded yet.</p>}</div>
                <form className="card workflow-card" onSubmit={submitSettlement}><h3>Record settlement</h3><select className="input" value={settlementForm.payer} onChange={(event) => setSettlementForm({ ...settlementForm, payer: event.target.value })} required><option value="">Who paid?</option>{selectedMembers.map((member) => <option value={member._id} key={member._id}>{member.name}</option>)}</select><select className="input" value={settlementForm.receiver} onChange={(event) => setSettlementForm({ ...settlementForm, receiver: event.target.value })} required><option value="">Who received?</option>{selectedMembers.map((member) => <option value={member._id} key={member._id}>{member.name}</option>)}</select><input className="input" type="number" min="0.01" step="0.01" placeholder="Amount" value={settlementForm.amount} onChange={(event) => setSettlementForm({ ...settlementForm, amount: event.target.value })} required /><input className="input" placeholder="Note (optional)" value={settlementForm.note} onChange={(event) => setSettlementForm({ ...settlementForm, note: event.target.value })} /><button className="btn-primary" type="submit">Record settlement</button></form>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
