import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    preferredCurrency: 'INR',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/auth/register', form);
      login(response.data);
      toast.success('Registration successful');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-header">
          <span className="eyebrow">ExpenseMate</span>
          <h1>Create your account</h1>
          <p>Start organizing your shared expenses in minutes.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            <span>Name</span>
            <input className="input" type="text" name="name" value={form.name} onChange={handleChange} required />
          </label>

          <label>
            <span>Email</span>
            <input className="input" type="email" name="email" value={form.email} onChange={handleChange} required />
          </label>

          <label>
            <span>Password</span>
            <input className="input" type="password" name="password" value={form.password} onChange={handleChange} minLength={8} required />
          </label>

          <label>
            <span>Phone</span>
            <input className="input" type="tel" name="phone" value={form.phone} onChange={handleChange} />
          </label>

          <label>
            <span>Preferred currency</span>
            <select className="input" name="preferredCurrency" value={form.preferredCurrency} onChange={handleChange}>
              <option value="INR">INR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </label>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/login">Already have an account?</Link>
        </div>
      </div>
    </div>
  );
}
