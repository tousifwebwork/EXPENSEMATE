import { Navigate, useLocation } from 'react-router-dom'
import { getSession } from '../auth.js'

function RequireAuth({ children, role }) {
  const location = useLocation()
  const session = getSession()

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (role && session.role !== role) {
    return <Navigate to={session.role === 'admin' ? '/admin/dashboard' : '/dashboard'} replace />
  }

  return children
}

export default RequireAuth
