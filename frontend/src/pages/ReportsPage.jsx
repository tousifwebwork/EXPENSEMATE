import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';

function csvCell(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

export default function ReportsPage() {
  const [report, setReport] = useState(null);
  const [filters, setFilters] = useState({ startDate: '', endDate: '' });

  const loadReport = async () => {
    try {
      const response = await api.get('/reports/summary', { params: filters });
      setReport(response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not load report');
    }
  };

  useEffect(() => { loadReport(); }, []);

  const exportCsv = () => {
    if (!report) return;
    const rows = [['Title', 'Amount', 'Category', 'Group', 'Payer', 'Date'], ...report.expenses.map((expense) => [expense.title, expense.amount, expense.category, expense.group?.name, expense.payer?.name, new Date(expense.date).toLocaleDateString()])];
    const blob = new Blob([rows.map((row) => row.map(csvCell).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'expensemate-report.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="page-shell admin-shell">
      <header className="topbar"><div><p className="muted">Financial overview</p><h2>Reports</h2></div><div className="button-row"><button className="btn-secondary" type="button" onClick={exportCsv} disabled={!report}>Export CSV</button><Link className="btn-secondary" to="/dashboard">Back to dashboard</Link></div></header>
      <form className="card report-filters" onSubmit={(event) => { event.preventDefault(); loadReport(); }}><label>From<input className="input" type="date" value={filters.startDate} onChange={(event) => setFilters({ ...filters, startDate: event.target.value })} /></label><label>To<input className="input" type="date" value={filters.endDate} onChange={(event) => setFilters({ ...filters, endDate: event.target.value })} /></label><button className="btn-primary" type="submit">Apply filters</button></form>
      {report && <><div className="dashboard-grid report-metrics"><div className="card metric-card"><p>Total spend</p><strong>INR {report.total.toFixed(2)}</strong></div><div className="card metric-card"><p>Expenses</p><strong>{report.expenseCount}</strong></div></div><div className="workspace-grid"><section className="card workflow-card page-section"><h3>By category</h3>{Object.entries(report.categoryTotals).map(([name, amount]) => <div className="balance-row" key={name}><span>{name}</span><strong>{amount.toFixed(2)}</strong></div>)}</section><section className="card workflow-card page-section"><h3>By group</h3>{Object.entries(report.groupTotals).map(([name, amount]) => <div className="balance-row" key={name}><span>{name}</span><strong>{amount.toFixed(2)}</strong></div>)}</section></div><section className="card workflow-card page-section"><h3>Expense detail</h3>{report.expenses.slice(0, 30).map((expense) => <div className="expense-row" key={expense._id}><div><strong>{expense.title}</strong><span>{expense.group?.name} · {expense.category} · {expense.payer?.name}</span></div><strong>{expense.amount.toFixed(2)}</strong></div>)}</section></>}
    </main>
  );
}
