import { ToastContainer } from 'react-toastify'
import Sidebar from './Sidebar.jsx'

function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#f4f7fb] lg:flex">
      <Sidebar />
      <ToastContainer position="top-right" style={{ zIndex: 99999 }} />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 lg:px-12 lg:py-10">{children}</main>
    </div>
  )
}

export default AppLayout
