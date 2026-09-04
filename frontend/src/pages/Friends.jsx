import { useCallback, useEffect, useRef, useState } from 'react'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import AppLayout from '../components/AppLayout.jsx'
import { useNavigate } from 'react-router-dom'

import {
  searchUsers,
  sendRequest,
  respondToRequest,
  cancelRequest,
  getPendingRequests,
  getFriends,
  removeFriend,
} from '../config/friends/friendAPI.js'

import {
  Users,
  Search,
  UserPlus,
  UserCheck,
  UserX,
  Mail,
  Clock,
  Send,
  X,
  Eye,
  Trash2,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import { motion } from 'framer-motion'

const SEARCH_DEBOUNCE_MS = 400

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || fallback

const getInitials = (name = '') => {
  if (!name) return 'U'
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function Friends() {
  const token = localStorage.getItem('token')
  const navigate = useNavigate()

  // ----- data state -----
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)

  const [friends, setFriends] = useState([])
  const [incomingRequests, setIncomingRequests] = useState([])
  const [outgoingRequests, setOutgoingRequests] = useState([])
  const [initialLoading, setInitialLoading] = useState(true)

  // ids currently mid-request (used to disable buttons / show spinners
  // and prevent double-submits, e.g. double-clicking "Add")
  const [processingIds, setProcessingIds] = useState(() => new Set())

  const searchSeqRef = useRef(0)
  const debounceTimerRef = useRef(null)

  const isProcessing = (id) => processingIds.has(id)
  const setProcessing = (id, value) => {
    setProcessingIds((prev) => {
      const next = new Set(prev)
      value ? next.add(id) : next.delete(id)
      return next
    })
  }

  // ----- helpers -----
  const patchSearchRelationship = useCallback((userId, relationship) => {
    setSearchResults((prev) =>
      prev.map((u) => (u._id === userId ? { ...u, relationship } : u))
    )
  }, [])

  // ----- loaders -----
  const loadFriends = useCallback(async () => {
    try {
      const response = await getFriends(token)
      setFriends(response.data.friends || response.data.data || [])
    } catch (error) {
      toast.error(getErrorMessage(error, "Couldn't load your friends list"))
    }
  }, [token])

  const loadPendingRequests = useCallback(async () => {
    try {
      const response = await getPendingRequests(token)
      setIncomingRequests(response.data.incoming || [])
      setOutgoingRequests(response.data.outgoing || [])
    } catch (error) {
      toast.error(getErrorMessage(error, "Couldn't load pending requests"))
    }
  }, [token])

  const runSearch = useCallback(
    async (value) => {
      const trimmed = value.trim()
      if (!trimmed) {
        setSearchResults([])
        setIsSearching(false)
        return
      }

      const seq = ++searchSeqRef.current
      setIsSearching(true)

      try {
        const response = await searchUsers(trimmed, token)
        // Ignore stale responses from a superseded/older keystroke
        if (seq !== searchSeqRef.current) return
        setSearchResults(response.data.users || response.data.data || [])
      } catch (error) {
        if (seq !== searchSeqRef.current) return
        toast.error(getErrorMessage(error, 'Search failed'))
        setSearchResults([])
      } finally {
        if (seq === searchSeqRef.current) setIsSearching(false)
      }
    },
    [token]
  )

  // Debounce the search box so we don't fire a request on every keystroke
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)

    if (!search.trim()) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    debounceTimerRef.current = setTimeout(() => {
      runSearch(search)
    }, SEARCH_DEBOUNCE_MS)

    return () => clearTimeout(debounceTimerRef.current)
  }, [search, runSearch])

  // Initial load
  useEffect(() => {
    ;(async () => {
      setInitialLoading(true)
      await Promise.all([loadFriends(), loadPendingRequests()])
      setInitialLoading(false)
    })()
  }, [loadFriends, loadPendingRequests])

  // ----- actions -----

  // SEND FRIEND REQUEST (from search results)
  const handleSendRequest = async (user) => {
    if (isProcessing(user._id)) return
    setProcessing(user._id, true)
    try {
      const response = await sendRequest(user.profileId, token)
      toast.success(response.data.message || 'Friend request sent')
      patchSearchRelationship(user._id, {
        status: 'pending_sent',
        requestId: response.data.request?._id || null,
      })
      loadPendingRequests()
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to send friend request'))
    } finally {
      setProcessing(user._id, false)
    }
  }

  // ACCEPT / DECLINE — targetUserId is passed when responding from a search
  // card so we can keep that card's state in sync too.
  const handleRespondToRequest = async (
    requestId,
    action,
    targetUserId = null
  ) => {
    if (isProcessing(requestId)) return
    setProcessing(requestId, true)
    try {
      await respondToRequest(requestId, action, token)
      toast.success(
        action === 'accept'
          ? 'Friend request accepted'
          : 'Friend request declined'
      )
      await Promise.all([loadPendingRequests(), loadFriends()])
      if (targetUserId) {
        patchSearchRelationship(
          targetUserId,
          action === 'accept'
            ? { status: 'friends', requestId }
            : { status: 'none', requestId: null }
        )
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to respond to friend request'))
    } finally {
      setProcessing(requestId, false)
    }
  }

  // CANCEL — targetUserId is passed when cancelling from a search card
  const handleCancelRequest = async (requestId, targetUserId = null) => {
    if (isProcessing(requestId)) return
    if (!window.confirm('Cancel this friend request?')) return

    setProcessing(requestId, true)
    try {
      await cancelRequest(requestId, token)
      toast.info('Friend request cancelled')
      await loadPendingRequests()
      if (targetUserId) {
        patchSearchRelationship(targetUserId, {
          status: 'none',
          requestId: null,
        })
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to cancel request'))
    } finally {
      setProcessing(requestId, false)
    }
  }

  // REMOVE FRIEND
  const handleRemoveFriend = async (friendId) => {
    if (isProcessing(friendId)) return
    if (!window.confirm('Remove this friend?')) return

    setProcessing(friendId, true)
    try {
      await removeFriend(friendId, token)
      toast.info('Friend removed')
      await loadFriends()
      patchSearchRelationship(friendId, { status: 'none', requestId: null })
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to remove friend'))
    } finally {
      setProcessing(friendId, false)
    }
  }

  // ----- render helpers -----
  const renderSearchAction = (user) => {
    const relationship = user.relationship || {
      status: 'none',
      requestId: null,
    }
    const busy =
      isProcessing(user._id) ||
      (relationship.requestId && isProcessing(relationship.requestId))

    switch (relationship.status) {
      case 'friends':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-600 border border-emerald-200/60">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Friends</span>
          </span>
        )

      case 'pending_sent':
        return (
          <button
            onClick={() =>
              handleCancelRequest(relationship.requestId, user._id)
            }
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-xl bg-stone-100 px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-200 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <X className="w-3.5 h-3.5" />
            )}
            <span>{busy ? 'Cancelling...' : 'Cancel'}</span>
          </button>
        )

      case 'pending_received':
        return (
          <div className="flex gap-2">
            <button
              onClick={() =>
                handleRespondToRequest(relationship.requestId, 'accept', user._id)
              }
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#159a8c] px-3 py-2 text-xs font-semibold text-white hover:bg-[#117d72] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-[#159a8c]/20"
            >
              {busy ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              <span>Accept</span>
            </button>
            <button
              onClick={() =>
                handleRespondToRequest(relationship.requestId, 'decline', user._id)
              }
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-xl bg-stone-100 px-3 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-200 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-3.5 h-3.5" />
              <span>Decline</span>
            </button>
          </div>
        )

      case 'none':
      default:
        return (
          <button
            onClick={() => handleSendRequest(user)}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#159a8c] px-4 py-2 text-xs font-semibold text-white hover:bg-[#117d72] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-[#159a8c]/20"
          >
            {busy ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <UserPlus className="w-3.5 h-3.5" />
            )}
            <span>{busy ? 'Adding...' : 'Add Friend'}</span>
          </button>
        )
    }
  }

  return (
    <AppLayout>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
      />

      <div className="mx-auto max-w-5xl space-y-8 animate-fade-in-up">
        {/* ================= HEADER ================= */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#159a8c]/10 text-[#159a8c] text-xs font-semibold uppercase tracking-wider mb-3">
            <Users className="w-3.5 h-3.5" />
            <span>Connections</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1a1a1a]">
            Friends
          </h1>

          <p className="mt-2 text-sm text-stone-500 max-w-2xl">
            Find people, manage friend requests, and stay connected.
          </p>
        </div>

        {/* ================= SEARCH ================= */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-stone-200 bg-white text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#159a8c] focus:ring-4 focus:ring-[#159a8c]/10 outline-none transition-all shadow-sm"
          />
          {isSearching && (
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <Loader2 className="w-4 h-4 text-stone-400 animate-spin" />
            </div>
          )}
        </div>

        {/* ================= SEARCH RESULTS ================= */}
        {search.trim() && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#1a1a1a]">
                Search Results
              </h2>
              {searchResults.length > 0 && (
                <span className="text-xs font-semibold text-stone-500">
                  {searchResults.length} {searchResults.length === 1 ? 'user' : 'users'} found
                </span>
              )}
            </div>

            {isSearching ? (
              <div className="rounded-2xl border border-stone-200/80 bg-white p-8 text-center shadow-sm">
                <Loader2 className="w-6 h-6 text-[#159a8c] animate-spin mx-auto mb-3" />
                <p className="text-sm text-stone-500">Searching...</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="rounded-2xl border border-stone-200/80 bg-white p-8 text-center shadow-sm">
                <Search className="w-8 h-8 text-stone-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-stone-600">No users found</p>
                <p className="text-xs text-stone-400 mt-1">
                  Try a different name or email
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {searchResults.map((user, index) => (
                  <motion.article
                    key={user._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.25 }}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#159a8c] to-[#0e6d63] text-sm font-bold text-white shadow-sm">
                        {getInitials(user.name)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-bold text-[#1a1a1a] text-sm">
                          {user.name}
                        </h3>
                        <p className="truncate text-xs text-stone-500 flex items-center gap-1.5 mt-0.5">
                          <Mail className="w-3 h-3" />
                          <span>{user.email}</span>
                        </p>
                      </div>
                    </div>

                    {renderSearchAction(user)}
                  </motion.article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ================= INCOMING REQUESTS ================= */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#1a1a1a]">
              Pending Requests
            </h2>
            {incomingRequests.length > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                <Clock className="w-3 h-3" />
                <span>{incomingRequests.length}</span>
              </span>
            )}
          </div>

          {initialLoading ? (
            <div className="rounded-2xl border border-stone-200/80 bg-white p-8 text-center shadow-sm animate-pulse">
              <div className="h-4 w-24 bg-stone-200 rounded mx-auto" />
            </div>
          ) : incomingRequests.length === 0 ? (
            <div className="rounded-2xl border border-stone-200/80 bg-white p-8 text-center shadow-sm">
              <Clock className="w-8 h-8 text-stone-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-stone-600">No pending requests</p>
              <p className="text-xs text-stone-400 mt-1">
                Friend requests will appear here
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {incomingRequests.map((request, index) => {
                const user = request.sender || request.user || request.from
                const busy = isProcessing(request._id)

                return (
                  <motion.article
                    key={request._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.25 }}
                    className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/50 to-white p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-sm font-bold text-white shadow-sm">
                        {getInitials(user?.name)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-bold text-[#1a1a1a] text-sm">
                          {user?.name}
                        </h3>
                        <p className="truncate text-xs text-stone-500 flex items-center gap-1.5 mt-0.5">
                          <Mail className="w-3 h-3" />
                          <span>{user?.email}</span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() =>
                          handleRespondToRequest(request._id, 'accept')
                        }
                        disabled={busy}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#159a8c] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#117d72] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-[#159a8c]/20"
                      >
                        {busy ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        <span>Accept</span>
                      </button>

                      <button
                        onClick={() =>
                          handleRespondToRequest(request._id, 'decline')
                        }
                        disabled={busy}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-white border border-stone-200 px-4 py-2.5 text-xs font-semibold text-stone-600 hover:bg-stone-50 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Decline</span>
                      </button>
                    </div>
                  </motion.article>
                )
              })}
            </div>
          )}
        </section>

        {/* ================= OUTGOING REQUESTS ================= */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#1a1a1a]">Sent Requests</h2>
            {outgoingRequests.length > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                <Send className="w-3 h-3" />
                <span>{outgoingRequests.length}</span>
              </span>
            )}
          </div>

          {initialLoading ? (
            <div className="rounded-2xl border border-stone-200/80 bg-white p-8 text-center shadow-sm animate-pulse">
              <div className="h-4 w-24 bg-stone-200 rounded mx-auto" />
            </div>
          ) : outgoingRequests.length === 0 ? (
            <div className="rounded-2xl border border-stone-200/80 bg-white p-8 text-center shadow-sm">
              <Send className="w-8 h-8 text-stone-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-stone-600">
                No sent requests
              </p>
              <p className="text-xs text-stone-400 mt-1">
                Requests you send will appear here
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {outgoingRequests.map((request, index) => {
                const user = request.receiver || request.user || request.to
                const busy = isProcessing(request._id)

                return (
                  <motion.article
                    key={request._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.25 }}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 text-sm font-bold text-white shadow-sm">
                        {getInitials(user?.name)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-bold text-[#1a1a1a] text-sm">
                          {user?.name}
                        </h3>
                        <p className="truncate text-xs text-stone-500 flex items-center gap-1.5 mt-0.5">
                          <Mail className="w-3 h-3" />
                          <span>{user?.email}</span>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCancelRequest(request._id)}
                      disabled={busy}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-stone-100 px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-200 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {busy ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <X className="w-3.5 h-3.5" />
                      )}
                      <span>{busy ? 'Cancelling...' : 'Cancel'}</span>
                    </button>
                  </motion.article>
                )
              })}
            </div>
          )}
        </section>

        {/* ================= MY FRIENDS ================= */}
        <section className="space-y-4 pb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#1a1a1a]">My Friends</h2>
            {friends.length > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                <UserCheck className="w-3 h-3" />
                <span>{friends.length}</span>
              </span>
            )}
          </div>

          {initialLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm animate-pulse"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-xl bg-stone-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-24 bg-stone-200 rounded" />
                      <div className="h-3 w-32 bg-stone-200 rounded" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-9 flex-1 bg-stone-200 rounded-xl" />
                    <div className="h-9 flex-1 bg-stone-200 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : friends.length === 0 ? (
            <div className="rounded-2xl border border-stone-200/80 bg-white p-12 text-center shadow-sm">
              <Users className="w-12 h-12 text-stone-300 mx-auto mb-4" />
              <p className="text-sm font-medium text-stone-600">
                No friends yet
              </p>
              <p className="text-xs text-stone-400 mt-1">
                Search for users above to send friend requests
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {friends.map((friend, index) => {
                const busy = isProcessing(friend._id)

                return (
                  <motion.article
                    key={friend._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.25 }}
                    className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#159a8c] to-[#0e6d63] text-sm font-bold text-white shadow-sm">
                        {getInitials(friend.name)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-bold text-[#1a1a1a] text-sm">
                          {friend.name}
                        </h3>
                        <p className="truncate text-xs text-stone-500 flex items-center gap-1.5 mt-0.5">
                          <Mail className="w-3 h-3" />
                          <span>{friend.email}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/viewprofile/${friend._id}`)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#159a8c] px-3 py-2.5 text-xs font-semibold text-white hover:bg-[#117d72] active:scale-95 transition-all shadow-sm shadow-[#159a8c]/20"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>

                      <button
                        onClick={() => handleRemoveFriend(friend._id)}
                        disabled={busy}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-red-50 border border-red-200/60 px-3 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-100 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {busy ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                        <span>{busy ? 'Removing...' : 'Remove'}</span>
                      </button>
                    </div>
                  </motion.article>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  )
}

export default Friends
