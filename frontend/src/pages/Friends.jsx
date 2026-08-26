import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout.jsx";

import { searchUsers, sendRequest,respondToRequest,cancelRequest,getPendingRequests,getFriends,removeFriend,
} from "../config/friends/friendAPI.js";

function Friends() {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  // GET FRIENDS
  const loadFriends = async () => {
    try {
      const response = await getFriends(token);
      setFriends(response.data.friends || response.data.data || []);
    } catch (error) {
      console.error("Error fetching friends:", error);
    }
  };

  // GET PENDING REQUESTS
  const loadPendingRequests = async () => {
    try {
      const response = await getPendingRequests(token);
      setPendingRequests(response.data.incoming || []);
    } catch (error) {
      console.error("Error fetching pending requests:", error);
    }
  };

  // SEARCH USERS
  const handleSearch = async (value) => {
    setSearch(value);
    if (!value.trim()) {
      setUsers([]);
      return;
    }
    try {
      setLoading(true);
      const response = await searchUsers(value, token);
      setUsers(response.data.users || response.data.data || []);
    } catch (error) {
      console.error("Error searching users:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // SEND FRIEND REQUEST
  const handleSendRequest = async (userId) => {
    try {
      await sendRequest(userId, token);
      if (search.trim()) {
        const response = await searchUsers(search, token);
        setUsers(response.data.users || response.data.data || []);
      }
    } catch (error) {
      console.error("Error sending friend request:", error);
      alert(error.response?.data?.message || "Failed to send friend request");
    }
  };

  // ACCEPT / REJECT REQUEST
  const handleRespondToRequest = async (requestId, status) => {
    try {
      await respondToRequest(requestId, status, token);
      await loadPendingRequests();
      await loadFriends();
    } catch (error) {
      console.error("Error responding to request:", error);

      alert(
        error.response?.data?.message ||
          "Failed to respond to friend request"
      );
    }
  };

  // CANCEL REQUEST
  const handleCancelRequest = async (requestId) => {
    try {
      await cancelRequest(requestId, token);
      await loadPendingRequests();
      if (search.trim()) {
        const response = await searchUsers(search, token);
        setUsers(response.data.users || response.data.data || []);
      }
    } catch (error) {
      console.error("Error cancelling request:", error);
      alert(error.response?.data?.message ||"Failed to cancel request");
    }
  };

  // REMOVE FRIEND
  const handleRemoveFriend = async (friendId) => {
    try {
      await removeFriend(friendId, token);
      await loadFriends();
    } catch (error) {
      console.error("Error removing friend:", error);
      alert(error.response?.data?.message ||"Failed to remove friend");
    }
  };

  // INITIAL LOAD
  useEffect(() => {
    loadFriends();
    loadPendingRequests();
  }, []);

  return (
    <AppLayout>
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
          onChange={(event) => handleSearch(event.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#159a8c] focus:ring-4 focus:ring-[#159a8c]/10"
        />
      </div>

      {/* SEARCH RESULTS */}
      {search.trim() && (
        <section className="mt-8">
          <h2 className="mb-4 text-lg font-bold text-[#102a43]">
            Search Results
          </h2>

          {loading ? (
            <p className="text-sm text-slate-500">
              Searching...
            </p>
          ) : users.length === 0 ? (
            <p className="text-sm text-slate-500">
              No users found.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {users.map((user) => (
                <article
                  key={user._id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid size-11 place-items-center rounded-full bg-[#e6f8f4] font-bold text-[#117d72]">
                      {user.name?.slice(0, 1).toUpperCase()}
                    </div>

                    <div>
                      <h3 className="font-bold text-[#102a43]">
                        {user.name}
                      </h3>

                      <p className="text-sm text-slate-500">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSendRequest(user.profileId)}
                    className="rounded-xl bg-[#159a8c] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#117d72]"
                  >
                    Add
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* PENDING REQUESTS */}
      <section className="mt-10">
        <h2 className="mb-4 text-lg font-bold text-[#102a43]">
          Pending Requests
        </h2>

        {pendingRequests.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">
              No pending friend requests.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {pendingRequests.map((request) => {
              const user =
                request.sender ||
                request.user ||
                request.from;

              return (
                <article
                  key={request._id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid size-11 place-items-center rounded-full bg-[#eef5ff] font-bold text-[#3569a8]">
                      {user?.name?.slice(0, 1).toUpperCase()}
                    </div>

                    <div>
                      <h3 className="font-bold text-[#102a43]">
                        {user?.name}
                      </h3>

                      <p className="text-sm text-slate-500">
                        {user?.email}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() =>
                        handleRespondToRequest(
                          request._id,
                          "accept"
                        )
                      }
                      className="rounded-xl bg-[#159a8c] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#117d72]"
                    >
                      Accept
                    </button>

                    <button
                      onClick={() =>
                        handleRespondToRequest(
                          request._id,
                          "decline"
                        )
                      }
                      className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-200"
                    >
                      Reject
                    </button>
 
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* MY FRIENDS */}
      <section className="mt-10">
        <h2 className="mb-4 text-lg font-bold text-[#102a43]">
          My Friends
        </h2>

        {friends.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">
              You don't have any friends yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {friends.map((friend) => (
              <article
                key={friend._id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="grid size-11 place-items-center rounded-full bg-[#e6f8f4] font-bold text-[#117d72]">
                    {friend.name?.slice(0, 1).toUpperCase()}
                  </div>

                  <div>
                    <h3 className="font-bold text-[#102a43]">
                      {friend.name}
                    </h3>

                    <p className="text-sm text-slate-500">
                      {friend.email}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleRemoveFriend(friend._id)}
                  className="mt-4 w-full rounded-xl bg-red-50 px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-100"
                >
                  Remove Friend
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </AppLayout>
  );
}

export default Friends;