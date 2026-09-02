import { ToastContainer } from 'react-toastify'
import Navbar from './Navbar.jsx'

function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#f4f7fb]">
      <Navbar />
       <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  )
}

export default AppLayout
