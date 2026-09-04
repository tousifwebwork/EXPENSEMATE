import { ToastContainer } from 'react-toastify'
import Navbar from './Navbar.jsx'
import { motion } from 'framer-motion'

const pageVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
}

function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <Navbar />
      <motion.main
        initial="hidden"
        animate="visible"
        variants={pageVariants}
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8"
      >
        {children}
      </motion.main>
    </div>
  )
}

export default AppLayout
