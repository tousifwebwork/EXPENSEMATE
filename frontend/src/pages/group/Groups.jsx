 
import React, { useEffect, useState } from "react";
import AppLayout from "../../components/AppLayout";
import {
  createGroup,
  getMyGroups,
  deleteGroup,
} from "../../config/group/groupAPI";

import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { useNavigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const Groups = () => {
  const [groupInfo, setgroupInfo] = useState({
    name: "",
    description: "",
    coverImage: "",
    baseCurrency: "",
  });

  const [AllGroups, setAllGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  // =========================
  // GET CURRENT USER ID
  // =========================
  useEffect(() => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Please login again");
        return;
      }

      const decoded = jwtDecode(token);

      setCurrentUserId(decoded.userId);
    } catch (err) {
      console.log("JWT Decode Error:", err);
      toast.error("Invalid login session");
    }
  }, []);

  // =========================
  // GET MY GROUPS
  // Runs again when coming
  // back to Groups page
  // =========================
  useEffect(() => {
    const handleGetGroup = async () => {
      try {
        setLoading(true);

        const token = localStorage.getItem("token");

        if (!token) {
          toast.error("Please login again");
          return;
        }

        const res = await getMyGroups(token);

        console.log("Groups:", res.data);

        setAllGroups(res.data.groups || []);
      } catch (err) {
        console.log(err);

        toast.error(
          err.response?.data?.message ||
            "Failed to load groups"
        );
      } finally {
        setLoading(false);
      }
    };

    handleGetGroup();
  }, [location.pathname]);

  // =========================
  // CREATE GROUP
  // =========================
  const handleCreateGroup = async () => {
    if (!groupInfo.name.trim()) {
      toast.error("Please enter group name!");
      return;
    }

    if (!groupInfo.description.trim()) {
      toast.error("Please enter group description!");
      return;
    }

    if (!groupInfo.baseCurrency) {
      toast.error("Please select base currency!");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Please login again");
        return;
      }

      const res = await createGroup(
        groupInfo,
        token
      );

      // Add newly created group immediately
      setAllGroups((prev) => [
        ...prev,
        res.data.group,
      ]);

      // Close modal
      setTimeout(() => {
        const modal =
          document.getElementById("add_group_modal");

        if (modal) {
          modal.close();
        }
      }, 500);

      toast.success(
        "Group created successfully!"
      );

      // Reset form
      setgroupInfo({
        name: "",
        description: "",
        coverImage: "",
        baseCurrency: "",
      });
    } catch (err) {
      console.log(err);

      toast.error(
        err.response?.data?.message ||
          "Failed to create group!"
      );
    }
  };

  // =========================
  // DELETE GROUP
  // OWNER / ADMIN ONLY
  // =========================
  const handleDeleteGroup = async (id) => {
    const ask = window.confirm(
      "Do you want to delete this group?"
    );

    if (!ask) return;

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Please login again");
        return;
      }

      await deleteGroup(id, token);

      // Immediately remove from UI
      setAllGroups((prev) =>
        prev.filter(
          (group) => group._id !== id
        )
      );

      toast.success(
        "Group deleted successfully!"
      );
    } catch (err) {
      console.log(err);

      toast.error(
        err.response?.data?.message ||
          "Failed to delete group!"
      );
    }
  };

  return (
    <AppLayout>

      <ToastContainer position="top-right" />

      {/* =========================
          HEADER
      ========================= */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-[#159a8c]">
            Workspace
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-[#102a43]">
            Your groups
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Keep every shared plan and balance in one place.
          </p>
        </div>

        {/* CREATE GROUP */}
        <button
          onClick={() => {
            document
              .getElementById("add_group_modal")
              ?.showModal();
          }}
          className="w-fit rounded-xl bg-[#159a8c] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#159a8c]/20 transition hover:bg-[#117d72]"
        >
          + Add Group
        </button>

      </div>

      {/* =========================
          GROUPS
      ========================= */}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">

        {loading ? (

          <div className="col-span-full flex justify-center py-10">

            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#159a8c]"></div>

          </div>

        ) : AllGroups.length === 0 ? (

          <p className="col-span-full py-10 text-center text-slate-500">
            No Groups Found
          </p>

        ) : (

          AllGroups.map((group) => {

            // =========================
            // FIND CURRENT USER
            // =========================
            const currentMember =
              group.members?.find(
                (member) => {

                  const memberUserId =
                    member.user?._id ||
                    member.user;

                  return (
                    memberUserId?.toString() ===
                    currentUserId?.toString()
                  );
                }
              );

            // =========================
            // GET CURRENT USER ROLE
            // =========================

            let currentUserRole =
              currentMember?.role;

            // Extra owner check
            // Handles cases where owner
            // is stored separately
            const ownerId =
              group.owner?._id ||
              group.owner;

            if (
              ownerId?.toString() ===
              currentUserId?.toString()
            ) {
              currentUserRole = "owner";
            }

            // =========================
            // PERMISSION
            // =========================
            const canDeleteGroup =
              currentUserRole === "owner" ||
              currentUserRole === "admin";

            console.log(
              group.name,
              "Role:",
              currentUserRole,
              "Can Delete:",
              canDeleteGroup
            );

            return (
              <div
                key={group._id}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
              >

                {/* =========================
                    TOP
                ========================= */}
                <div className="p-6">

                  <div className="flex items-start justify-between gap-4">

                    {/* GROUP ICON */}
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#159a8c]/10 text-lg font-bold text-[#159a8c]">
                      {group.name
                        ?.charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="flex flex-row items-center gap-4">

                      {/* CURRENCY */}
                      <span className="rounded-full bg-[#159a8c]/10 px-3 py-1 text-xs font-bold text-[#159a8c]">
                        {group.baseCurrency}
                      </span>

                      {/* =========================
                          DELETE BUTTON
                          OWNER / ADMIN ONLY
                      ========================= */}
                      {canDeleteGroup && (
                        <button
                          onClick={() =>
                            handleDeleteGroup(
                              group._id
                            )
                          }
                          className="cursor-pointer rounded border border-red-900 px-2 py-1 text-sm transition-colors duration-200 hover:bg-red-400 hover:text-white"
                        >
                          Delete
                        </button>
                      )}

                    </div>

                  </div>

                  {/* GROUP NAME */}
                  <h2 className="mt-5 text-xl font-bold text-[#102a43]">
                    {group.name}
                  </h2>

                  {/* DESCRIPTION */}
                  <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">
                    {group.description ||
                      "No description available"}
                  </p>

                  {/* CURRENT USER ROLE */}
                  {currentUserRole && (
                    <div className="mt-3">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        You: {currentUserRole}
                      </span>
                    </div>
                  )}

                </div>

                {/* =========================
                    FOOTER
                ========================= */}
                <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-6 py-4">

                  <div className="text-xs text-slate-500">

                    <span className="font-semibold text-slate-700">
                      {group.members?.length || 0}
                    </span>{" "}
                    members

                  </div>

                  <button
                    onClick={() =>
                      navigate(
                        `/groups/${group._id}`
                      )
                    }
                    className="text-sm font-bold text-[#159a8c] transition group-hover:text-[#117d72]"
                  >
                    View Group →
                  </button>

                </div>

              </div>
            );
          })
        )}

      </div>

      {/* =========================
          ADD GROUP MODAL
      ========================= */}
      <dialog
        id="add_group_modal"
        className="fixed inset-0 m-auto w-[92%] max-w-md rounded-2xl border-0 p-0 shadow-2xl backdrop:bg-black/50"
      >

        <div className="bg-white p-6">

          <h3 className="text-2xl font-bold text-[#102a43]">
            Create Group
          </h3>

          {/* GROUP NAME */}
          <input
            value={groupInfo.name}
            onChange={(e) =>
              setgroupInfo({
                ...groupInfo,
                name: e.target.value,
              })
            }
            type="text"
            placeholder="Enter group name"
            className="mt-5 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#159a8c]"
          />

          {/* DESCRIPTION */}
          <input
            value={groupInfo.description}
            onChange={(e) =>
              setgroupInfo({
                ...groupInfo,
                description: e.target.value,
              })
            }
            type="text"
            placeholder="Enter group description"
            className="mt-5 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#159a8c]"
          />

          {/* CURRENCY */}
          <select
            value={groupInfo.baseCurrency}
            onChange={(e) =>
              setgroupInfo({
                ...groupInfo,
                baseCurrency: e.target.value,
              })
            }
            className="mt-5 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#159a8c]"
          >

            <option value="">
              Select base currency
            </option>

            <option value="INR">
              INR - Indian Rupee
            </option>

            <option value="USD">
              USD - US Dollar
            </option>

            <option value="EUR">
              EUR - Euro
            </option>

          </select>

          {/* BUTTONS */}
          <div className="mt-6 flex justify-end gap-3">

            {/* CANCEL */}
            <form method="dialog">

              <button
                type="submit"
                className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>

            </form>

            {/* CREATE */}
            <button
              onClick={handleCreateGroup}
              className="rounded-xl bg-[#159a8c] px-4 py-2 font-semibold text-white hover:bg-[#117d72]"
            >
              Create Group
            </button>

          </div>

        </div>

      </dialog>

    </AppLayout>
  );
};

export default Groups;