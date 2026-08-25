const SESSION_KEY = 'expensemate-session'
const USERS_KEY = 'expensemate-users'
const ADMIN_USERS_KEY = 'expensemate-admin-users'
const PROFILE_KEY = 'expensemate-profile'

export const allowedEmail = /^[^\s@]+@(gmail|outlook|yahoo)\.com$/i

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY))
  } catch {
    return null
  }
}

export function getProfile() {
  const session = getSession()
  try {
    const profiles = JSON.parse(localStorage.getItem(PROFILE_KEY)) || {}
    return profiles[session?.email] || { name: 'ExpenseMate user', email: session?.email || '' }
  } catch {
    return { name: 'ExpenseMate user', email: session?.email || '' }
  }
}

export function registerUser(profile) {
  const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]')
  if (users.some((user) => user.email.toLowerCase() === profile.email.toLowerCase())) {
    return false
  }
  localStorage.setItem(USERS_KEY, JSON.stringify([...users, profile]))
  saveProfile(profile)
  return true
}

export function authenticateUser(email, password) {
  const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]')
  return users.find((user) => user.email.toLowerCase() === email.toLowerCase() && user.password === password)
}

export function registerAdmin(profile) {
  const admins = JSON.parse(localStorage.getItem(ADMIN_USERS_KEY) || '[]')
  if (admins.some((admin) => admin.email.toLowerCase() === profile.email.toLowerCase())) return false
  localStorage.setItem(ADMIN_USERS_KEY, JSON.stringify([...admins, profile]))
  return true
}

export function authenticateAdmin(email, password) {
  const admins = JSON.parse(localStorage.getItem(ADMIN_USERS_KEY) || '[]')
  return admins.find((admin) => admin.email.toLowerCase() === email.toLowerCase() && admin.password === password)
}

export function saveProfile(profile) {
  const profiles = JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}')
  localStorage.setItem(PROFILE_KEY, JSON.stringify({ ...profiles, [profile.email]: profile }))
}

export function startSession(email, role) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ email, role }))
}

export function endSession() {
  localStorage.removeItem(SESSION_KEY)
}
