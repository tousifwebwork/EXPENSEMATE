import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';

function person(value) {
  return value?.name ? value : null;
}

export default function FriendsPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState({ incoming: [], outgoing: [] });

  const loadData = async () => {
    const [friendsResponse, requestResponse] = await Promise.all([
      api.get('/friends'),
      api.get('/friend-requests'),
    ]);
    setFriends(friendsResponse.data.friends);
    setRequests({ incoming: requestResponse.data.incoming, outgoing: requestResponse.data.outgoing });
  };

  useEffect(() => {
    loadData().catch((error) => toast.error(error.response?.data?.message || 'Could not load connections'));
  }, []);

  const search = async (event) => {
    const value = event.target.value;
    setQuery(value);
    if (!value.trim()) {
      setResults([]);
      return;
    }
    try {
      const response = await api.get('/users/search', { params: { q: value } });
      setResults(response.data.users);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not search users');
    }
  };

  const sendRequest = async (userId) => {
    try {
      await api.post('/friend-requests', { userId });
      setResults((current) => current.filter((result) => result.id !== userId));
      toast.success('Friend request sent');
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not send request');
    }
  };

  const respond = async (id, action) => {
    try {
      await api.put(`/friend-requests/${id}/respond`, { action });
      await loadData();
      toast.success(action === 'accept' ? 'Friend request accepted' : 'Friend request declined');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update request');
    }
  };

  const removeFriend = async (id) => {
    try {
      await api.delete(`/friends/${id}`);
      await loadData();
      toast.success('Friend removed');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not remove friend');
    }
  };

  return (
    <main className="page-shell admin-shell">
      <header className="topbar">
        <div><p className="muted">Connections</p><h2>Friends</h2></div>
        <Link className="btn-secondary" to="/dashboard">Back to dashboard</Link>
      </header>
      <section className="card workflow-card page-section">
        <h3>Find people</h3>
        <input className="input" value={query} onChange={search} placeholder="Search by name or email" />
        {results.map((result) => <div className="list-row" key={result.id}><div><strong>{result.name}</strong><span>{result.email}</span></div><button className="btn-primary" type="button" onClick={() => sendRequest(result.id)}>Add friend</button></div>)}
      </section>
      <div className="workspace-grid">
        <section className="card workflow-card page-section">
          <h3>Incoming requests</h3>
          {requests.incoming.length ? requests.incoming.map((request) => { const sender = person(request.sender); return <div className="list-row" key={request._id}><div><strong>{sender?.name}</strong><span>{sender?.email}</span></div><div className="button-row"><button className="btn-primary" type="button" onClick={() => respond(request._id, 'accept')}>Accept</button><button className="btn-secondary" type="button" onClick={() => respond(request._id, 'decline')}>Decline</button></div></div>; }) : <p className="muted">No pending incoming requests.</p>}
        </section>
        <section className="card workflow-card page-section">
          <h3>Outgoing requests</h3>
          {requests.outgoing.length ? requests.outgoing.map((request) => { const receiver = person(request.receiver); return <div className="list-row" key={request._id}><div><strong>{receiver?.name}</strong><span>{receiver?.email}</span></div><span className="muted">Pending</span></div>; }) : <p className="muted">No pending outgoing requests.</p>}
        </section>
      </div>
      <section className="card workflow-card page-section">
        <h3>Your friends</h3>
        {friends.length ? friends.map((friend) => <div className="list-row" key={friend.friendshipId}><div><strong>{friend.name}</strong><span>{friend.email}</span></div><button className="btn-secondary" type="button" onClick={() => removeFriend(friend.friendshipId)}>Remove</button></div>) : <p className="muted">Your accepted connections will appear here.</p>}
      </section>
    </main>
  );
}
