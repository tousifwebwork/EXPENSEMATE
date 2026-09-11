import { Plus, Activity, Loader2 } from 'lucide-react'
import AppLayout from '../components/AppLayout.jsx'  
import { useEffect, useState } from 'react'
import { getProfile } from '../config/user/userAPI.js';
import { toast } from 'react-hot-toast';
import { sent_email_invite } from '../config/auth/authAPI.js';

const InviteEmail = () => { 
   
  const [inviteText, setInviteText] = useState('') 
  const [email, setemail] = useState('')
  const [sending, setSending] = useState(false)  
  
  
  useEffect(() => {
    const CLIENT_URL_PROD=`https://expensmatefrontend.vercel.app`
    const token = localStorage.getItem('token')
    const fetchProfile = async () => {
      try {
        const res = await getProfile(token)  
        setInviteText(`Hey ${res.data.user.name}, I am using this amazing app to manage my expenses. Visit ${CLIENT_URL_PROD} and join me to make expense sharing easier and more fun!`)
      } catch (error) {
        console.log(error.response?.data || error.message) 
      }  
    }
    fetchProfile()
  }, [])

  const handle_mail = async (e) => {
    try {
      e.preventDefault();

      if (!email) {
        toast.error("Please enter valid email.");
        return;
      }

      setSending(true); // start loader

      const token = localStorage.getItem('token');
      await sent_email_invite({ email, inviteText }, token);
      toast.success("Invite sent successfully.");
      setemail('');  
    } catch (error) {
      toast.error("Server Error.");
      console.log(error.response?.data || error.message)
    } finally {
      setSending(false); // stop loader, runs whether success or failure
    }
  }


  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl space-y- animate-fade-in-up grid grid-cols-1 lg:grid-cols-[4fr_6fr] gap-6">
         
         {/* Left */}
         <div className="flex flex-col  gap-5 sm:flex-row sm:items-start ">
          <div className=" flex flex-col">
            <div className="inline-flex w-fit items-center gap-2 px-3 py-1 rounded-full bg-[#159a8c]/10 text-[#159a8c] text-xs font-semibold uppercase tracking-wider mb-3">
               <Plus className="w-4 h-4" />
               <span>Invite users</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1a1a1a]">
              Invite Your Friend
            </h1>

            <p className="mt-2 text-sm text-stone-500">
              Invite your friends to join the app and start sharing expenses together.
            </p>
          </div> 
        </div>

        {/* Right Column */}
        <div className=''> 
        <div  className="lg:col-span-2 bg-white border border-gray-300 rounded-2xl shadow-sm">
              
              {/* Heading */}
              <div className="flex items-center justify-between p-5 border-b border-gray-300">
                <div>
                  <h2 className="font-semibold text-gray-900">
                    Send an Invite
                  </h2>

                  <p className="text-xs text-gray-500 mt-1">
                    Send the invite mail to your friends and family just by entering their email address. 
                  </p>
                </div>

                <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-gray-600" />
                </div>
              </div>
              
              {/* Mail Box */}
              <div className='py-5 flex  justify-around space-y-4'> 
                  <form onSubmit={handle_mail} className="border flex flex-col gap-y-5 items-center border-gray-300 px-8 py-4 rounded-lg w-full max-w-xl h-fit">

                  <span className="flex justify-center font-bold text-2xl">Email Address</span>
                   <input
                     name='email'
                     onChange={(e) => { setemail(e.target.value); }}
                     value={email}
                     type="email"
                     placeholder="Enter email address"
                     disabled={sending}
                     className="w-full mt-2 p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#159a8c] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                   />
                   <textarea
                     type="text"
                     value={inviteText}
                     rows="3"
                     onChange={(e) => setInviteText(e.target.value)}
                     placeholder="Enter name"
                     disabled={sending}
                     className="w-full mt-2 p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#159a8c] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                   />
                   <button
                     type='submit'
                     disabled={sending}
                     className="w-full max-w-md bg-[#159a8c] text-white py-2 px-4 rounded-lg hover:bg-[#159a8c]/90 focus:outline-none focus:ring-2 focus:ring-[#159a8c] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                   >
                     {sending ? (
                       <>
                         <Loader2 className="w-4 h-4 animate-spin" />
                         Sending...
                       </>
                     ) : (
                       "Invite"
                     )}
                   </button>
                 
                  </form>  
              </div> 

        </div> 
        </div> 

      </div>
    </AppLayout>
  )
}

export default InviteEmail