import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout.jsx";
import {getProfile,updateProfile as updateUserProfile,} from "../config/user/userAPI.js";
import toast from "react-hot-toast";

function Profile() {
  const [user, setUser] = useState({
    name: "",
    email: "",
    phone: "",
    preferredCurrency: "",
    profileId: "",
    status: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Get profile
  useEffect(() => {
    const token = localStorage.getItem("token");

    const fetchProfile = async () => {
      try {
        const res = await getProfile(token);

        setUser({
          name: res.data.user.name || "",
          email: res.data.user.email || "",
          phone: res.data.user.phone || "",
          preferredCurrency: res.data.user.preferredCurrency || "INR",
          profileId: res.data.user.profileId || "",
          status: res.data.user.status || "",
        });
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Update profile
  const handleUpdate = async () => {
    try {
      setSaving(true);

      const token = localStorage.getItem("token");

      const res = await updateUserProfile(token, {
        name: user.name,
        email: user.email,
        phone: user.phone,
        preferredCurrency: user.preferredCurrency,
      });

      setUser({
        name: res.data.user.name || "",
        email: res.data.user.email || "",
        phone: res.data.user.phone || "",
        preferredCurrency:
          res.data.user.preferredCurrency || "INR",
        profileId: res.data.user.profileId || "",
        status: res.data.user.status || "",
      });

      toast.success("Profile details saved successfully!", {
        duration: 3000,
        style: {
          borderRadius: "12px",
          background: "#102a43",
          color: "#fff",
          padding: "14px 18px",
          fontWeight: "600",
        },
      });
    } catch (error) {
      console.log(error);

      toast.error(
        error.response?.data?.message ||
          "Failed to save profile details.",
        {
          duration: 3000,
          style: {
            borderRadius: "12px",
            padding: "14px 18px",
            fontWeight: "600",
          },
        }
      );
    } finally {
      setSaving(false);
    }
  };

  // Save settings
  const saveSettings = async (event) => {
    event.preventDefault();

    const confirmed = window.confirm(
      "Do you want to save your changes?"
    );

    if (!confirmed) return;

    await handleUpdate();
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AppLayout>
      <div>
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-[#159a8c]">
          Account
        </p>

        <h1 className="text-3xl font-bold tracking-tight text-[#102a43]">
          Settings
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Manage your profile and expense preferences.
        </p>
      </div>

      <form
        className="mt-8 max-w-2xl space-y-6"
        onSubmit={saveSettings}
      >
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <h2 className="text-lg font-bold text-[#102a43]">
            Profile details
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            This information is visible to people in your groups.
          </p>

          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            <label className="text-sm font-semibold text-slate-700">
              Full name
              <input
                className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 font-normal outline-none focus:border-[#159a8c] focus:bg-white focus:ring-4 focus:ring-[#159a8c]/10"
                value={user.name}
                onChange={(e) =>
                  setUser({
                    ...user,
                    name: e.target.value,
                  })
                }
              />
            </label>

            <label className="text-sm font-semibold text-slate-700">
              Email
              <input
                type="email"
                className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 font-normal outline-none focus:border-[#159a8c] focus:bg-white focus:ring-4 focus:ring-[#159a8c]/10"
                value={user.email}
                onChange={(e) =>
                  setUser({
                    ...user,
                    email: e.target.value,
                  })
                }
              />
            </label>

            <label className="text-sm font-semibold text-slate-700">
              Phone
              <input
                className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 font-normal outline-none focus:border-[#159a8c] focus:bg-white focus:ring-4 focus:ring-[#159a8c]/10"
                value={user.phone}
                onChange={(e) =>
                  setUser({
                    ...user,
                    phone: e.target.value,
                  })
                }
              />
            </label>

            <label className="text-sm font-semibold text-slate-700">
              Profile ID
              <input
                className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 font-normal outline-none"
                value={user.profileId}
                readOnly
              />
            </label>

            <label className="text-sm font-semibold text-slate-700">
              Status
              <input
                className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 font-normal outline-none"
                value={user.status}
                readOnly
              />
            </label>

            <label className="text-sm font-semibold text-slate-700">
              My currency
              <select
                className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 font-normal outline-none focus:border-[#159a8c] focus:bg-white focus:ring-4 focus:ring-[#159a8c]/10"
                value={user.preferredCurrency}
                onChange={(e) =>
                  setUser({
                    ...user,
                    preferredCurrency: e.target.value,
                  })
                }
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </label>
          </div>
        </section>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-[#159a8c] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#159a8c]/20 hover:bg-[#117d72] disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </AppLayout>
  );
}

export default Profile;