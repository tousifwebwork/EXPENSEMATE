import { useCallback, useEffect, useRef, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AppLayout from "../components/AppLayout.jsx";
import { useNavigate } from "react-router-dom";

import {searchUsers,sendRequest,respondToRequest,cancelRequest,getPendingRequests,getFriends,removeFriend,
} from "../config/friends/friendAPI.js";

const SEARCH_DEBOUNCE_MS = 400;
 
const getErrorMessage = (error, fallback) => error?.response?.data?.message || fallback;

const initials = (name = "") => name.slice(0, 1).toUpperCase();

function Friends() {
  const token = localStorage.getItem("token");
    const navigate = useNavigate();

  // ----- data state -----
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const [friends, setFriends] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);

  // ids currently mid-request (used to disable buttons / show spinners
  // and prevent double-submits, e.g. double-clicking "Add")
  const [processingIds, setProcessingIds] = useState(() => new Set());

  const searchSeqRef = useRef(0);
  const debounceTimerRef = useRef(null);

  const isProcessing = (id) => processingIds.has(id);
  const setProcessing = (id, value) => {
    setProcessingIds((prev) => {
      const next = new Set(prev);
      value ? next.add(id) : next.delete(id);
      return next;
    });
  };


  // ----- helpers -----
  const patchSearchRelationship = useCallback((userId, relationship) => {
    setSearchResults((prev) =>
      prev.map((u) => (u._id === userId ? { ...u, relationship } : u))
    );
  }, []);


  // ----- loaders -----
  const loadFriends = useCallback(async () => {
    try {
      const response = await getFriends(token);
      setFriends(response.data.friends || response.data.data || []);
    } catch (error) {
      toast.error(getErrorMessage(error, "Couldn't load your friends list"));
    }
  }, [token]);

  const loadPendingRequests = useCallback(async () => {
    try {
      const response = await getPendingRequests(token);
      setIncomingRequests(response.data.incoming || []);
      setOutgoingRequests(response.data.outgoing || []);
    } catch (error) {
      toast.error(getErrorMessage(error, "Couldn't load pending requests"));
    }
  }, [token]);

  const runSearch = useCallback(
    async (value) => {
      const trimmed = value.trim();
      if (!trimmed) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      const seq = ++searchSeqRef.current;
      setIsSearching(true);

      try {
        const response = await searchUsers(trimmed, token);
        // Ignore stale responses from a superseded/older keystroke
        if (seq !== searchSeqRef.current) return;
        setSearchResults(response.data.users || response.data.data || []);
      } catch (error) {
        if (seq !== searchSeqRef.current) return;
        toast.error(getErrorMessage(error, "Search failed"));
        setSearchResults([]);
      } finally {
        if (seq === searchSeqRef.current) setIsSearching(false);
      }
    },
    [token]
  );


  // Debounce the search box so we don't fire a request on every keystroke
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    if (!search.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      runSearch(search);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(debounceTimerRef.current);
  }, [search, runSearch]);


  // Initial load
  useEffect(() => {
    (async () => {
      setInitialLoading(true);
      await Promise.all([loadFriends(), loadPendingRequests()]);
      setInitialLoading(false);
    })();
  }, [loadFriends, loadPendingRequests]);


  // ----- actions -----

  // SEND FRIEND REQUEST (from search results)
  const handleSendRequest = async (user) => {
    if (isProcessing(user._id)) return;
    setProcessing(user._id, true);
    try {
      const response = await sendRequest(user.profileId, token);
      toast.success(response.data.message || "Friend request sent");
      patchSearchRelationship(user._id, {
        status: "pending_sent",
        requestId: response.data.request?._id || null,
      });
      loadPendingRequests();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to send friend request"));
    } finally {
      setProcessing(user._id, false);
    }
  };



  // ACCEPT / DECLINE — targetUserId is passed when responding from a search
  // card so we can keep that card's state in sync too.
  const handleRespondToRequest = async (requestId, action, targetUserId = null) => {
    if (isProcessing(requestId)) return;
    setProcessing(requestId, true);
    try {
      await respondToRequest(requestId, action, token);
      toast.success(
        action === "accept" ? "Friend request accepted" : "Friend request declined"
      );
      await Promise.all([loadPendingRequests(), loadFriends()]);
      if (targetUserId) {
        patchSearchRelationship(
          targetUserId,
          action === "accept"
            ? { status: "friends", requestId }
            : { status: "none", requestId: null }
        );
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to respond to friend request"));
    } finally {
      setProcessing(requestId, false);
    }
  };



  // CANCEL — targetUserId is passed when cancelling from a search card
  const handleCancelRequest = async (requestId, targetUserId = null) => {
    if (isProcessing(requestId)) return;
    if (!window.confirm("Cancel this friend request?")) return;

    setProcessing(requestId, true);
    try {
      await cancelRequest(requestId, token);
      toast.info("Friend request cancelled");
      await loadPendingRequests();
      if (targetUserId) {
        patchSearchRelationship(targetUserId, { status: "none", requestId: null });
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to cancel request"));
    } finally {
      setProcessing(requestId, false);
    }
  };



  // REMOVE FRIEND
  const handleRemoveFriend = async (friendId) => {
    if (isProcessing(friendId)) return;
    if (!window.confirm("Remove this friend?")) return;

    setProcessing(friendId, true);
    try {
      await removeFriend(friendId, token);
      toast.info("Friend removed");
      await loadFriends();
      patchSearchRelationship(friendId, { status: "none", requestId: null });
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to remove friend"));
    } finally {
      setProcessing(friendId, false);
    }
  };

  // ----- render helpers -----
  const renderSearchAction = (user) => {
    const relationship = user.relationship || { status: "none", requestId: null };
    const busy = isProcessing(user._id) || (relationship.requestId && isProcessing(relationship.requestId));

    switch (relationship.status) {
      case "friends":
        return (
          <span className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-400">
            Friends
          </span>
        );

      case "pending_sent":
        return (
          <button
            onClick={() => handleCancelRequest(relationship.requestId, user._id)}
            disabled={busy}
            className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-200 disabled:opacity-50"
          >
            {busy ? "..." : "Cancel Request"}
          </button>
        );

      case "pending_received":
        return (
          <div className="flex gap-2">
            <button
              onClick={() => handleRespondToRequest(relationship.requestId, "accept", user._id)}
              disabled={busy}
              className="rounded-xl bg-[#159a8c] px-3 py-2 text-sm font-bold text-white transition hover:bg-[#117d72] disabled:opacity-50"
            >
              {busy ? "..." : "Accept"}
            </button>
            <button
              onClick={() => handleRespondToRequest(relationship.requestId, "decline", user._id)}
              disabled={busy}
              className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-200 disabled:opacity-50"
            >
              {busy ? "..." : "Decline"}
            </button>
          </div>
        );

      case "none":
      default:
        return (
          <button
            onClick={() => handleSendRequest(user)}
            disabled={busy}
            className="rounded-xl bg-[#159a8c] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#117d72] disabled:opacity-50"
          >
            {busy ? "..." : "Add"}
          </button>
        );
    }
  };

  return (
    <AppLayout>
      <ToastContainer position="top-center" autoClose={3000} hideProgressBar={false} />


      {/* HEADER */}
      <div>
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-[#159a8c]">
          Connections
        </p>

        <h1 className="text-3xl font-bold tracking-tight text-[#102a43]">
          Friends
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Find people, manage friend requests and stay connected.
        </p>
      </div>



      {/* SEARCH */}
      <div className="mt-8">
        <input
          type="text"
          placeholder="Search users by name or email..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#159a8c] focus:ring-4 focus:ring-[#159a8c]/10"
        />
      </div>



      {/* SEARCH RESULTS */}
      {search.trim() && (
        <section className="mt-8">
          <h2 className="mb-4 text-lg font-bold text-[#102a43]">
            Search Results
          </h2>

          {isSearching ? (
            <p className="text-sm text-slate-500">Searching...</p>
          ) : searchResults.length === 0 ? (
            <p className="text-sm text-slate-500">No users found.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {searchResults.map((user) => (
                <article
                  key={user._id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid size-11 shrink-0 place-items-center rounded-full bg-[#e6f8f4] font-bold text-[#117d72]">
                      {initials(user.name)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-bold text-[#102a43]">{user.name}</h3>
                      <p className="truncate text-sm text-slate-500">{user.email}</p>
                    </div>
                  </div>

                  {renderSearchAction(user)}
                </article>
              ))}
            </div>
          )}
        </section>
      )}


      {/* INCOMING REQUESTS */}
      <section className="mt-10">
        <h2 className="mb-4 text-lg font-bold text-[#102a43]">
          Pending Requests
        </h2>

        {initialLoading ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : incomingRequests.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">No pending friend requests.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {incomingRequests.map((request) => {
              const user = request.sender || request.user || request.from;
              const busy = isProcessing(request._id);

              return (
                <article
                  key={request._id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid size-11 shrink-0 place-items-center rounded-full bg-[#eef5ff] font-bold text-[#3569a8]">
                      {initials(user?.name)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-bold text-[#102a43]">{user?.name}</h3>
                      <p className="truncate text-sm text-slate-500">{user?.email}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => handleRespondToRequest(request._id, "accept")}
                      disabled={busy}
                      className="rounded-xl bg-[#159a8c] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#117d72] disabled:opacity-50"
                    >
                      {busy ? "..." : "Accept"}
                    </button>

                    <button
                      onClick={() => handleRespondToRequest(request._id, "decline")}
                      disabled={busy}
                      className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-200 disabled:opacity-50"
                    >
                      {busy ? "..." : "Reject"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>


      {/* OUTGOING REQUESTS */}
      <section className="mt-10">
        <h2 className="mb-4 text-lg font-bold text-[#102a43]">
          Sent Requests
        </h2>

        {initialLoading ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : outgoingRequests.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">You haven't sent any friend requests.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {outgoingRequests.map((request) => {
              const user = request.receiver || request.user || request.to;
              const busy = isProcessing(request._id);

              return (
                <article
                  key={request._id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid size-11 shrink-0 place-items-center rounded-full bg-[#fef3e6] font-bold text-[#b5762c]">
                      {initials(user?.name)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-bold text-[#102a43]">{user?.name}</h3>
                      <p className="truncate text-sm text-slate-500">{user?.email}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCancelRequest(request._id)}
                    disabled={busy}
                    className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-200 disabled:opacity-50"
                  >
                    {busy ? "..." : "Cancel"}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>


      {/* MY FRIENDS */}
      <section className="mt-10">
        <h2 className="mb-4 text-lg font-bold text-[#102a43]">My Friends</h2>

        {initialLoading ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : friends.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">You don't have any friends yet.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {friends.map((friend) => {
              const busy = isProcessing(friend._id);

              return (
                <article key={friend._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  
                  <div className="flex items-center gap-3">
                    <div className="grid size-11 shrink-0 place-items-center rounded-full bg-[#e6f8f4] font-bold text-[#117d72]">
                      {initials(friend.name)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-bold text-[#102a43]">{friend.name}</h3>
                      <p className="truncate text-sm text-slate-500">{friend.email}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex w-full flex-col gap-2 sm:mt-5 sm:flex-row">

                    <button onClick={() => handleRemoveFriend(friend._id)} disabled={busy}
                      className="flex-1 rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-50">
                     {busy ? "..." : "Remove"}
                    </button>

                    <button onClick={() => navigate(`/viewprofile/${friend._id}`)}
                      className="flex-1 rounded-xl bg-blue-50 px-3 py-2 text-sm font-bold text-blue-600 transition hover:bg-blue-100">
                     View Profile
                    </button>

                  </div>
                                    
                </article>
              );
            })}
          </div>
        )}
      </section>


    </AppLayout>
  );
}

export default Friends;
