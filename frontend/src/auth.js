// ---------------------------------------------------------------------
// MOCK AUTH — everything in this file lives only in the browser's
// localStorage. There is no server here: "registering" just saves a
// record, and "signing in" just checks that record. This is enough to
// demo the whole app, but a real backend should replace this file
// (the function names below are a good starting point for that API).
// ---------------------------------------------------------------------

const SESSION_KEY = 'expensemate-session'
const USERS_KEY = 'expensemate-users'
const ADMIN_USERS_KEY = 'expensemate-admin-users'
const PROFILE_KEY = 'expensemate-profile'

// Only Gmail / Outlook / Yahoo addresses are accepted, to keep the demo data tidy.
export const allowedEmail = /^[^\s@]+@(gmail|outlook|yahoo)\.com$/i

const normalizeEmail = (email) => email.trim().toLowerCase()

const readAccounts = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]')
  } catch {
    return []
  }
}

/** An email can have only one ExpenseMate account, regardless of role. */
export function accountExists(email) {
  const normalizedEmail = normalizeEmail(email)
  return [...readAccounts(USERS_KEY), ...readAccounts(ADMIN_USERS_KEY)]
    .some((account) => normalizeEmail(account.email) === normalizedEmail)
}

/** The currently signed-in { email, role } pair, or null if signed out. */
export function getSession() {
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

/** The signed-in user's display profile (name + email) for the sidebar/dashboard. */
export function getProfile() {
  const session = getSession()
  const fallback = { name: 'ExpenseMate user', email: session?.email || '' }
  try {
    const profiles = JSON.parse(localStorage.getItem(PROFILE_KEY)) || {}
    return profiles[session?.email] || fallback
  } catch {
    return fallback
  }
}

/** Creates a new user account. Returns false if the email is already taken. */
export function registerUser(profile) {
  const users = readAccounts(USERS_KEY)
  if (accountExists(profile.email)) return false

  const normalizedProfile = { ...profile, email: normalizeEmail(profile.email) }
  localStorage.setItem(USERS_KEY, JSON.stringify([...users, normalizedProfile]))
  saveProfile(normalizedProfile)
  return true
}

/** Returns the matching user record, or undefined if the email/password don't match. */
export function authenticateUser(email, password) {
  const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]')
  return users.find((user) => user.email.toLowerCase() === email.toLowerCase() && user.password === password)
}

/** Same idea as registerUser(), but for the separate admin account list. */
export function registerAdmin(profile) {
  const admins = readAccounts(ADMIN_USERS_KEY)
  if (accountExists(profile.email)) return false

  const normalizedProfile = { ...profile, email: normalizeEmail(profile.email) }
  localStorage.setItem(ADMIN_USERS_KEY, JSON.stringify([...admins, normalizedProfile]))
  return true
}

/** Same idea as authenticateUser(), but for admins. */
export function authenticateAdmin(email, password) {
  const admins = JSON.parse(localStorage.getItem(ADMIN_USERS_KEY) || '[]')
  return admins.find((admin) => admin.email.toLowerCase() === email.toLowerCase() && admin.password === password)
}

/** Saves/updates the display profile shown in the sidebar and Settings page. */
export function saveProfile(profile) {
  const profiles = JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}')
  localStorage.setItem(PROFILE_KEY, JSON.stringify({ ...profiles, [profile.email]: profile }))
}

/** Marks the browser as "signed in" as this email, with role 'user' or 'admin'. */
export function startSession(email, role) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ email, role }))
}

/** Signs out by clearing the session. */
export function endSession() {
  localStorage.removeItem(SESSION_KEY)
}
