import { useEffect, useState } from 'react'
import AppLayout from '../components/AppLayout.jsx'

import {
  getProfile,
  updateProfile as updateUserProfile,
  updateProfileImage,
  deleteProfileImage,
} from '../config/user/userAPI.js'

import toast, { Toaster } from 'react-hot-toast'

import {
  User,
  Mail,
  Phone,
  Wallet,
  Hash,
  ShieldCheck,
  FileText,
  MapPin,
  Globe,
  CalendarDays,
  Camera,
  Trash2,
  Save,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

function Profile() {
  const [user, setUser] = useState({
    name: '',
    email: '',
    phone: '',
    preferredCurrency: 'INR',
    profileId: '',
    profileImage: '',
    about: '',
    address: {
      landmark: '',
      state: '',
      country: '',
    },
    status: '',
    createdAt: '',
    updatedAt: '',
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [deletingImage, setDeletingImage] = useState(false)

  // ================= GET PROFILE =================
  useEffect(() => {
    const token = localStorage.getItem('token')

    const fetchProfile = async () => {
      try {
        const res = await getProfile(token)
        const data = res.data.user

        setUser({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          preferredCurrency: data.preferredCurrency || 'INR',
          profileId: data.profileId || '',
          profileImage: data.profileImage || '',
          about: data.about || '',
          address: {
            landmark: data.address?.landmark || '',
            state: data.address?.state || '',
            country: data.address?.country || '',
          },
          status: data.status || '',
          createdAt: data.createdAt || '',
          updatedAt: data.updatedAt || '',
        })
      } catch (error) {
        console.log(error.response?.data || error.message)
        toast.error(error.response?.data?.message || 'Failed to load profile.')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  // ================= INPUT HANDLER =================
  const handleChange = (field, value) => {
    setUser((prev) => ({ ...prev, [field]: value }))
  }

  // ================= ADDRESS HANDLER =================
  const handleAddressChange = (field, value) => {
    setUser((prev) => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }))
  }

  // ================= PROFILE IMAGE UPLOAD =================
  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      e.target.value = ''
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      e.target.value = ''
      return
    }

    const toastId = toast.loading('Uploading profile image...')

    try {
      setUploadingImage(true)
      const token = localStorage.getItem('token')
      const formData = new FormData()
      formData.append('profileImage', file)

      const res = await updateProfileImage(token, formData)

      setUser((prev) => ({
        ...prev,
        profileImage: res.data.user.profileImage,
      }))

      toast.success('Profile image updated successfully!', { id: toastId })
    } catch (error) {
      console.log(error.response?.data || error.message)
      toast.error(
        error.response?.data?.message || 'Failed to upload profile image.',
        { id: toastId }
      )
    } finally {
      setUploadingImage(false)
      e.target.value = ''
    }
  }

  // ================= DELETE PROFILE IMAGE =================
  const handleDeleteImage = async () => {
    if (!user.profileImage) {
      toast.error('No profile image to delete.')
      return
    }

    const confirmed = window.confirm(
      'Are you sure you want to remove your profile image?'
    )
    if (!confirmed) return

    const toastId = toast.loading('Removing profile image...')

    try {
      setDeletingImage(true)
      const token = localStorage.getItem('token')
      const res = await deleteProfileImage(token)

      setUser((prev) => ({
        ...prev,
        profileImage: res.data.user?.profileImage || '',
      }))

      toast.success('Profile image removed successfully!', { id: toastId })
    } catch (error) {
      console.log(error.response?.data || error.message)
      toast.error(
        error.response?.data?.message || 'Failed to delete profile image.',
        { id: toastId }
      )
    } finally {
      setDeletingImage(false)
    }
  }

  // ================= UPDATE PROFILE =================
  const handleUpdate = async () => {
    try {
      setSaving(true)
      const token = localStorage.getItem('token')

      const res = await updateUserProfile(token, {
        name: user.name,
        email: user.email,
        phone: user.phone,
        preferredCurrency: user.preferredCurrency,
        about: user.about,
        address: {
          landmark: user.address.landmark,
          state: user.address.state,
          country: user.address.country,
        },
      })

      const data = res.data.user

      setUser({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        preferredCurrency: data.preferredCurrency || 'INR',
        profileId: data.profileId || '',
        profileImage: data.profileImage || '',
        about: data.about || '',
        address: {
          landmark: data.address?.landmark || '',
          state: data.address?.state || '',
          country: data.address?.country || '',
        },
        status: data.status || '',
        createdAt: data.createdAt || '',
        updatedAt: data.updatedAt || '',
      })

      toast.success('Profile updated successfully!')
    } catch (error) {
      console.log(error.response?.data || error.message)
      toast.error(error.response?.data?.message || 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  // ================= SAVE =================
  const saveSettings = async (event) => {
    event.preventDefault()
    await handleUpdate()
  }

  // ================= DATE FORMAT =================
  const formatDate = (date) => {
    if (!date) return 'Not available'
    return new Date(date).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // ================= LOADING =================
  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
          <div className="h-8 w-48 rounded-xl bg-stone-200" />
          <div className="h-64 rounded-3xl bg-stone-100" />
          <div className="h-96 rounded-3xl bg-stone-100" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <Toaster position="top-right" />

      <div className="mx-auto max-w-4xl space-y-8 animate-fade-in-up">
        {/* ================= HEADER ================= */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#159a8c]/10 text-[#159a8c] text-xs font-semibold uppercase tracking-wider mb-3">
            <User className="w-3.5 h-3.5" />
            <span>Your Account</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1a1a1a]">
            Profile Settings
          </h1>

          <p className="mt-2 text-sm text-stone-500 max-w-2xl">
            Manage your personal information, contact details, and expense preferences.
          </p>
        </div>

        <form className="space-y-6" onSubmit={saveSettings}>
          {/* ================= PROFILE HERO ================= */}
          <section className="overflow-hidden rounded-3xl border border-stone-200/80 bg-white shadow-sm">
            {/* BANNER */}
            <div className="h-32 bg-gradient-to-br from-[#159a8c] via-[#47c5b0] to-[#0e6d63] relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
            </div>

            <div className="px-6 sm:px-8 pb-8">
              <div className="-mt-16 flex flex-col sm:flex-row sm:items-end gap-6">
                {/* PROFILE IMAGE */}
                <div className="relative mx-auto sm:mx-0">
                  {user.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={user.name || 'Profile'}
                      className="h-32 w-32 rounded-3xl border-4 border-white object-cover shadow-xl"
                    />
                  ) : (
                    <div className="flex h-32 w-32 items-center justify-center rounded-3xl border-4 border-white bg-gradient-to-br from-[#159a8c] to-[#0e6d63] text-4xl font-bold text-white shadow-xl">
                      {getInitials(user.name)}
                    </div>
                  )}

                  {/* CAMERA BUTTON */}
                  <label
                    className={`absolute bottom-1 right-1 flex h-10 w-10 items-center justify-center rounded-xl border-2 border-white bg-[#159a8c] text-white shadow-lg transition cursor-pointer ${
                      uploadingImage || deletingImage
                        ? 'cursor-not-allowed opacity-60'
                        : 'hover:bg-[#117d72] active:scale-95'
                    }`}
                    title={
                      uploadingImage
                        ? 'Uploading...'
                        : deletingImage
                        ? 'Deleting...'
                        : 'Change profile picture'
                    }
                  >
                    <Camera className="w-5 h-5" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage || deletingImage}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* PROFILE INFO */}
                <div className="flex-1 text-center sm:text-left pb-2">
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1a1a1a]">
                    {user.name || 'Your Name'}
                  </h2>

                  <p className="mt-1.5 text-sm text-stone-600">
                    {user.email || 'Email not provided'}
                  </p>

                  <div className="mt-3 flex items-center justify-center sm:justify-start gap-3 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200/60">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span className="capitalize">{user.status || 'Active'}</span>
                    </span>

                    {user.profileId && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1 text-xs font-mono font-medium text-stone-600">
                        <Hash className="w-3 h-3" />
                        <span>{user.profileId}</span>
                      </span>
                    )}
                  </div>

                  {/* DELETE IMAGE BUTTON */}
                  {user.profileImage && (
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={handleDeleteImage}
                        disabled={deletingImage || uploadingImage}
                        className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50/50 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-100/70 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{deletingImage ? 'Removing...' : 'Remove Photo'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* ================= PERSONAL INFORMATION ================= */}
          <section className="rounded-3xl border border-stone-200/80 bg-white p-6 sm:p-8 shadow-sm">
            <div className="pb-6 border-b border-stone-100">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#159a8c] mb-1">
                <User className="w-3.5 h-3.5" />
                <span>Personal Information</span>
              </div>
              <h2 className="text-xl font-bold text-[#1a1a1a]">
                Basic Details
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Update your name, email, phone, and preferred currency
              </p>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={user.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-sm placeholder:text-stone-400 focus:bg-white focus:border-[#159a8c] focus:ring-4 focus:ring-[#159a8c]/10 outline-none transition-all"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={user.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-sm placeholder:text-stone-400 focus:bg-white focus:border-[#159a8c] focus:ring-4 focus:ring-[#159a8c]/10 outline-none transition-all"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={user.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-sm placeholder:text-stone-400 focus:bg-white focus:border-[#159a8c] focus:ring-4 focus:ring-[#159a8c]/10 outline-none transition-all"
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>

              {/* Currency */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2">
                  Preferred Currency
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <select
                    value={user.preferredCurrency}
                    onChange={(e) =>
                      handleChange('preferredCurrency', e.target.value)
                    }
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-sm focus:bg-white focus:border-[#159a8c] focus:ring-4 focus:ring-[#159a8c]/10 outline-none transition-all cursor-pointer appearance-none"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* ================= ABOUT ================= */}
          <section className="rounded-3xl border border-stone-200/80 bg-white p-6 sm:p-8 shadow-sm">
            <div className="pb-6 border-b border-stone-100">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#159a8c] mb-1">
                <FileText className="w-3.5 h-3.5" />
                <span>About You</span>
              </div>
              <h2 className="text-xl font-bold text-[#1a1a1a]">Bio</h2>
              <p className="text-xs text-stone-500 mt-1">
                Tell others a little about yourself
              </p>
            </div>

            <div className="mt-6">
              <textarea
                value={user.about}
                onChange={(e) => handleChange('about', e.target.value)}
                rows={5}
                placeholder="Write something about yourself..."
                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-sm placeholder:text-stone-400 resize-y focus:bg-white focus:border-[#159a8c] focus:ring-4 focus:ring-[#159a8c]/10 outline-none transition-all"
              />
            </div>
          </section>

          {/* ================= ADDRESS ================= */}
          <section className="rounded-3xl border border-stone-200/80 bg-white p-6 sm:p-8 shadow-sm">
            <div className="pb-6 border-b border-stone-100">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#159a8c] mb-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>Location</span>
              </div>
              <h2 className="text-xl font-bold text-[#1a1a1a]">Address</h2>
              <p className="text-xs text-stone-500 mt-1">
                Update your location information
              </p>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-3">
              {/* Landmark */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2">
                  Landmark
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={user.address.landmark}
                    onChange={(e) =>
                      handleAddressChange('landmark', e.target.value)
                    }
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-sm placeholder:text-stone-400 focus:bg-white focus:border-[#159a8c] focus:ring-4 focus:ring-[#159a8c]/10 outline-none transition-all"
                    placeholder="Landmark"
                  />
                </div>
              </div>

              {/* State */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2">
                  State
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={user.address.state}
                    onChange={(e) => handleAddressChange('state', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-sm placeholder:text-stone-400 focus:bg-white focus:border-[#159a8c] focus:ring-4 focus:ring-[#159a8c]/10 outline-none transition-all"
                    placeholder="State"
                  />
                </div>
              </div>

              {/* Country */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2">
                  Country
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Globe className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={user.address.country}
                    onChange={(e) => handleAddressChange('country', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-sm placeholder:text-stone-400 focus:bg-white focus:border-[#159a8c] focus:ring-4 focus:ring-[#159a8c]/10 outline-none transition-all"
                    placeholder="Country"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ================= ACCOUNT METADATA ================= */}
          <section className="rounded-3xl border border-stone-200/80 bg-stone-50/70 p-6 sm:p-8">
            <div className="grid gap-6 sm:grid-cols-2">
              {/* Created */}
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <CalendarDays className="w-5 h-5 text-stone-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Account Created
                  </p>
                  <p className="mt-1 text-sm font-bold text-stone-700 truncate">
                    {formatDate(user.createdAt)}
                  </p>
                </div>
              </div>

              {/* Updated */}
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <CalendarDays className="w-5 h-5 text-stone-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Last Updated
                  </p>
                  <p className="mt-1 text-sm font-bold text-stone-700 truncate">
                    {formatDate(user.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ================= SAVE BUTTON ================= */}
          <div className="flex items-center justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#159a8c] px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-[#159a8c]/30 hover:bg-[#117d72] active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}

export default Profile
