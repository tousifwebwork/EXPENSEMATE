import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

import AppLayout from "../../components/AppLayout";
import {
  getGroupById,
  updateGroup,
  addMember,
  updateMemberRole,
  removeMember,
  toggleArchive,
  deleteGroup,
} from "../../config/group/groupAPI";

import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ViewGroup = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);

  const [currentUserId, setCurrentUserId] = useState(null);

  const [profileId, setProfileId] = useState("");

  const [editData, setEditData] = useState({
    name: "",
    description: "",
    baseCurrency: "",
  });

  // =========================
  // GET GROUP
  // =========================
  const loadGroup = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Please login again");
        return;
      }

      const decoded = jwtDecode(token);

      setCurrentUserId(decoded.userId);

      const res = await getGroupById(groupId, token);

      setGroup(res.data.group);

      setEditData({
        name: res.data.group.name,
        description: res.data.group.description || "",
        baseCurrency: res.data.group.baseCurrency,
      });
    } catch (err) {
      console.log(err);

      toast.error(
        err.response?.data?.message || "Failed to load group"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroup();
  }, [groupId]);

  // =========================
  // CURRENT USER MEMBERSHIP
  // =========================
  const currentMember = group?.members?.find(
    (member) =>
      member.user?._id?.toString() === currentUserId?.toString()
  );

  const currentUserRole = currentMember?.role;

  // =========================
  // EDIT GROUP
  // OWNER / ADMIN ONLY
  // =========================
  const handleUpdateGroup = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await updateGroup(
        groupId,
        editData,
        token
      );

      setGroup(res.data.group);

      toast.success("Group updated successfully!");
    } catch (err) {
      console.log(err);

      toast.error(
        err.response?.data?.message ||
          "Failed to update group"
      );
    }
  };

  // =========================
  // ADD MEMBER
  // OWNER / ADMIN ONLY
  // =========================
  const handleAddMember = async () => {
    if (!profileId.trim()) {
      toast.error("Enter profile ID");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      await addMember(
        groupId,
        { profileId },
        token
      );

      setProfileId("");

      // Reload populated group
      await loadGroup();

      toast.success("Member added successfully!");
    } catch (err) {
      console.log(err);

      toast.error(
        err.response?.data?.message ||
          "Failed to add member"
      );
    }
  };

  // =========================
  // CHANGE ROLE
  // OWNER ONLY
  // =========================
  const handleRoleChange = async (memberId, role) => {
    try {
      const token = localStorage.getItem("token");

      await updateMemberRole(
        groupId,
        memberId,
        { role },
        token
      );

      // Reload populated group
      await loadGroup();

      toast.success("Member role updated!");
    } catch (err) {
      console.log(err);

      toast.error(
        err.response?.data?.message ||
          "Failed to update role"
      );
    }
  };

  // =========================
  // REMOVE MEMBER
  // OWNER / ADMIN
  // =========================
  const handleRemoveMember = async (memberId) => {
    const confirmRemove = window.confirm(
      "Do you want to remove this member?"
    );

    if (!confirmRemove) return;

    try {
      const token = localStorage.getItem("token");

      await removeMember(
        groupId,
        memberId,
        token
      );

      // Reload populated group
      await loadGroup();

      toast.success("Member removed!");
    } catch (err) {
      console.log(err);

      toast.error(
        err.response?.data?.message ||
          "Failed to remove member"
      );
    }
  };

  // =========================
  // ARCHIVE / REOPEN
  // OWNER ONLY
  // =========================
  const handleArchive = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await toggleArchive(
        groupId,
        token
      );

      setGroup(res.data.group);

      toast.success(res.data.message);
    } catch (err) {
      console.log(err);

      toast.error(
        err.response?.data?.message ||
          "Failed to update group status"
      );
    }
  };

  // =========================
  // DELETE GROUP
  // OWNER / ADMIN
  // =========================
  const handleDeleteGroup = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this group?"
    );

    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("token");

      await deleteGroup(
        groupId,
        token
      );

      toast.success(
        "Group deleted successfully!"
      );

      setTimeout(() => {
        navigate("/groups");
      }, 1000);
    } catch (err) {
      console.log(err);

      toast.error(
        err.response?.data?.message ||
          "Failed to delete group"
      );
    }
  };

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#159a8c]"></div>
        </div>
      </AppLayout>
    );
  }

  // =========================
  // GROUP NOT FOUND
  // =========================
  if (!group) {
    return (
      <AppLayout>
        <p className="py-20 text-center text-slate-500">
          Group not found
        </p>
      </AppLayout>
    );
  }

  return (
<AppLayout>

  <ToastContainer position="top-right" />

    {/* Back */}
    <button onClick={() => navigate("/groups")} className="mb-5 text-sm font-semibold text-[#159a8c]">
       ← Back to Groups
    </button>

      {/* HEADER */}
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#159a8c]">
          Group
        </p>

        <h1 className="text-3xl font-bold text-[#102a43]">
          {group.name}
        </h1>

          <p className="mt-2 text-sm text-slate-500">
            {group.description || "No description"}
          </p>
      </div>

      <div className="flex gap-2">

      {/* ARCHIVE - OWNER ONLY */}
      {currentUserRole === "owner" && (
            <button onClick={handleArchive}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-100">
              {group.isArchived ? "Reopen" : "Archive"}
            </button>
      )}

      {/* DELETE - OWNER / ADMIN */}
      {(currentUserRole === "owner" || currentUserRole === "admin") && 
      (
        <button onClick={handleDeleteGroup} className="rounded-xl border border-red-500 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-500 hover:text-white">
          Delete
        </button>
      )}

      </div>
    </div>

      {/* GROUP INFO */}
    <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-[#102a43]"> Group Information</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-sm text-slate-500">Currency</p>
            <p className="font-bold">{group.baseCurrency}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Members</p>
            <p className="font-bold">{group.members?.length || 0}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Status</p>
            <p className="font-bold">{group.isArchived? "Archived": "Active"}</p>
          </div>

        </div>
    </div>

      {/* EDIT GROUP OWNER / ADMIN ONLY */}
      {(currentUserRole === "owner" || currentUserRole === "admin") && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <h2 className="text-xl font-bold text-[#102a43]">
            Edit Group
          </h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">

            <input value={editData.name} onChange={(e) =>setEditData({...editData,name: e.target.value,}) }
              className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#159a8c]"
              placeholder="Group name" />

            <input value={editData.description} onChange={(e) => setEditData({ ...editData,description: e.target.value,})}
              className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#159a8c]"
              placeholder="Description"/>

            <select value={editData.baseCurrency}  onChange={(e) =>setEditData({...editData,baseCurrency: e.target.value,})}
              className="rounded-xl border border-slate-300 px-4 py-3">
              <option value="INR">INR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>

          </div>

          <button
            onClick={handleUpdateGroup}
            className="mt-4 rounded-xl bg-[#159a8c] px-5 py-2 font-semibold text-white hover:bg-[#117d72]"
          >
            Save Changes
          </button>

        </div>
      )}

      {/* MEMBERS  */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <h2 className="text-xl font-bold text-[#102a43]">Members</h2>

        {/* ADD MEMBER OWNER / ADMIN ONLY  */}
        {(currentUserRole === "owner" || currentUserRole === "admin") && 
        (
          <div className="mt-4 flex gap-2">
            <input value={profileId} onChange={(e) =>setProfileId(e.target.value)} placeholder="Enter Profile ID"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#159a8c]"/>
            <button onClick={handleAddMember} className="rounded-xl bg-[#159a8c] px-5 font-semibold text-white hover:bg-[#117d72]">
              Add
            </button>
          </div>
        )}

        {/*  MEMBER LIST */}
        <div className="mt-6 space-y-3"> 
          {
          group.members?.map((member) => {
          const canManageMember = currentUserRole === "owner" ||  ( currentUserRole === "admin" && member.role === "member" );

            return (
            <div key={member._id}
            className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                
                {/* MEMBER DETAILS */}
                <div>
                  <p className="font-bold text-[#102a43]">{member.user?.name}</p>
                  <p className="text-sm text-slate-500">{member.user?.email}</p>
                  <span className="text-xs font-semibold text-[#159a8c]">
                    {member.role}
                  </span>
                </div>
                {/* CONTROLS */}
                {canManageMember && (
                  <div className="flex gap-2">
                    {/* ROLE CHANGE  ONLY OWNER CAN CHANGE ROLE */}
                    {currentUserRole === "owner" &&
                      member.role !== "owner" && (
                        <select value={member.role} onChange={(e) =>handleRoleChange(member.user._id,e.target.value)}
                          className="rounded-lg border border-slate-300 px-2 py-1 text-sm">
                          <option value="member">
                            Member
                          </option>
                          <option value="admin">
                            Admin
                          </option>
                        </select>
                    )}

                    {/* REMOVE */}

                  {member.role !== "owner" && (
                  <button onClick={() => handleRemoveMember(member.user._id)}
                   className="rounded-lg border border-red-500 px-3 py-1 text-sm text-red-600 hover:bg-red-500 hover:text-white">
                    Remove
                  </button>
                  )}

                  </div>
                )}

            </div>
            );
          })}
        </div>
      </div>

</AppLayout>
  );
};

export default ViewGroup;