import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout.jsx";
import {getProfile,updateProfile as updateUserProfile,} from "../config/user/userAPI.js";
import toast from "react-hot-toast";
import {User,Mail,Phone,Wallet,Hash,ShieldCheck,Image,FileText,MapPin,Globe,CalendarDays,
} from "lucide-react";

function Profile() {
  const [user, setUser] = useState({
    name: "",
    email: "",
    phone: "",
    preferredCurrency: "INR",
    profileId: "",
    profileImage: "",
    about: "",
    address: {
      landmark: "",
      state: "",
      country: "",
    },
    status: "",
    createdAt: "",
    updatedAt: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ================= GET PROFILE =================
  useEffect(() => {
    const token = localStorage.getItem("token");

    const fetchProfile = async () => {
      try {
        const res = await getProfile(token);
        const data = res.data.user;

        setUser({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          preferredCurrency: data.preferredCurrency || "INR",
          profileId: data.profileId || "",
          profileImage: data.profileImage || "",
          about: data.about || "",
          address: {
            landmark: data.address?.landmark || "",
            state: data.address?.state || "",
            country: data.address?.country || "",
          },
          status: data.status || "",
          createdAt: data.createdAt || "",
          updatedAt: data.updatedAt || "",
        });
      } catch (error) {
        console.log(
          error.response?.data || error.message
        );

        toast.error(
          error.response?.data?.message ||
            "Failed to load profile."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);


  // ================= INPUT HANDLER =================
  const handleChange = (field, value) => {
    setUser((prev) => ({
      ...prev,
      [field]: value,
    }));
  };



  // ================= ADDRESS HANDLER =================
  const handleAddressChange = (field, value) => {
    setUser((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value,
      },
    }));
  };



  // ================= UPDATE PROFILE =================
  const handleUpdate = async () => {
    try {
      setSaving(true);

      const token = localStorage.getItem("token");

      const res = await updateUserProfile(token, {
        name: user.name,
        email: user.email,
        phone: user.phone,
        preferredCurrency: user.preferredCurrency,
        profileImage: user.profileImage,
        about: user.about,
        address: {
          landmark: user.address.landmark,
          state: user.address.state,
          country: user.address.country,
        },
      });

      const data = res.data.user;

      setUser({
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        preferredCurrency: data.preferredCurrency || "INR",
        profileId: data.profileId || "",
        profileImage: data.profileImage || "",
        about: data.about || "",
        address: {
          landmark: data.address?.landmark || "",
          state: data.address?.state || "",
          country: data.address?.country || "",
        },
        status: data.status || "",
        createdAt: data.createdAt || "",
        updatedAt: data.updatedAt || "",
      });

      toast.success("Profile updated successfully!", {
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
      console.log(
        error.response?.data || error.message
      );

      toast.error(
        error.response?.data?.message ||
          "Failed to update profile.",
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



  // ================= SAVE =================
  const saveSettings = async (event) => {
    event.preventDefault();

    const confirmed = window.confirm(
      "Do you want to save your changes?"
    );

    if (!confirmed) return;

    await handleUpdate();
  };



  // ================= DATE FORMAT =================
  const formatDate = (date) => {
    if (!date) return "Not available";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };



  // ================= LOADING =================
  if (loading) {
    return (
      <AppLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#159a8c]" />

            <p className="mt-4 text-sm font-medium text-slate-500">
              Loading profile...
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }


  
  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl">

        {/* ================= HEADER ================= */}
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-[#159a8c]">
            Account
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-[#102a43]">
            Profile Settings
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage your personal information, contact details,
            profile, and expense preferences.
          </p>
        </div>

        <form  className="mt-8 space-y-6"  onSubmit={saveSettings} >

          {/* ================= PROFILE PREVIEW ================= */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="h-28 bg-gradient-to-r from-[#102a43] via-[#159a8c] to-[#159a8c]" />

            <div className="px-5 pb-7 sm:px-7">

              <div className="-mt-14 flex flex-col items-center gap-4 sm:flex-row sm:items-end">

                {/* Profile Image */}

                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.name}
                    className="h-28 w-28 rounded-full border-4 border-white object-cover shadow-md"
                  />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-white bg-[#159a8c] text-4xl font-bold text-white shadow-md">
                    {user.name
                      ? user.name.charAt(0).toUpperCase()
                      : "U"}
                  </div>
                )}

                <div className="pb-1 text-center sm:text-left">
                  <h2 className="text-4xl font-bold text-white">
                    {user.name || "Your Name"}
                  </h2>

                  <p className="mt-2  text-sm text-slate-700">
                    {user.email || "Email not provided"}
                  </p>

                  <span className="mt-1 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold capitalize text-emerald-600">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    {user.status || "Active"}
                  </span>
                </div>

              </div>

            </div>
          </section>

          {/* ================= PERSONAL INFORMATION ================= */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">

            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#159a8c]/10 text-[#159a8c]">
                <User size={18} />
              </div>

              <div>
                <h2 className="text-lg font-bold text-[#102a43]">
                  Personal Information
                </h2>

                <p className="text-sm text-slate-500">
                  Update your basic personal details.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">

              {/* Name */}

              <label className="text-sm font-semibold text-slate-700">
                Full Name

                <div className="relative">
                  <User
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    value={user.name}
                    onChange={(e) =>
                      handleChange("name", e.target.value)
                    }
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-4 font-normal outline-none transition focus:border-[#159a8c] focus:bg-white focus:ring-4 focus:ring-[#159a8c]/10"
                    placeholder="Enter your full name"
                  />
                </div>
              </label>

              {/* Email */}

              <label className="text-sm font-semibold text-slate-700">
                Email Address

                <div className="relative">
                  <Mail
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="email"
                    value={user.email}
                    onChange={(e) =>
                      handleChange("email", e.target.value)
                    }
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-4 font-normal outline-none transition focus:border-[#159a8c] focus:bg-white focus:ring-4 focus:ring-[#159a8c]/10"
                    placeholder="Enter your email"
                  />
                </div>
              </label>

              {/* Phone */}

              <label className="text-sm font-semibold text-slate-700">
                Phone Number

                <div className="relative">
                  <Phone
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    value={user.phone}
                    onChange={(e) =>
                      handleChange("phone", e.target.value)
                    }
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-4 font-normal outline-none transition focus:border-[#159a8c] focus:bg-white focus:ring-4 focus:ring-[#159a8c]/10"
                    placeholder="Enter your phone number"
                  />
                </div>
              </label>

              {/* Currency */}

              <label className="text-sm font-semibold text-slate-700">
                Preferred Currency

                <div className="relative">
                  <Wallet
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <select
                    value={user.preferredCurrency}
                    onChange={(e) =>
                      handleChange(
                        "preferredCurrency",
                        e.target.value
                      )
                    }
                    className="mt-2 w-full appearance-none rounded-xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-4 font-normal outline-none transition focus:border-[#159a8c] focus:bg-white focus:ring-4 focus:ring-[#159a8c]/10"
                  >
                    <option value="INR">
                      INR (₹)
                    </option>

                    <option value="USD">
                      USD ($)
                    </option>

                    <option value="EUR">
                      EUR (€)
                    </option>
                  </select>
                </div>
              </label>

            </div>
          </section>


          {/* ================= ABOUT ================= */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">

            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#159a8c]/10 text-[#159a8c]">
                <FileText size={18} />
              </div>

              <div>
                <h2 className="text-lg font-bold text-[#102a43]">
                  About
                </h2>

                <p className="text-sm text-slate-500">
                  Tell others a little about yourself.
                </p>
              </div>
            </div>

            <textarea
              value={user.about}
              onChange={(e) =>
                handleChange("about", e.target.value)
              }
              rows={5}
              placeholder="Write something about yourself..."
              className="mt-6 w-full resize-none rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#159a8c] focus:bg-white focus:ring-4 focus:ring-[#159a8c]/10"
            />
          </section>



          {/* ================= PROFILE INFORMATION ================= */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">

            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#159a8c]/10 text-[#159a8c]">
                <ShieldCheck size={18} />
              </div>

              <div>
                <h2 className="text-lg font-bold text-[#102a43]">
                  Account Information
                </h2>

                <p className="text-sm text-slate-500">
                  System-generated account information.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">

              {/* Profile ID */}

              <label className="text-sm font-semibold text-slate-700">
                Profile ID

                <div className="relative">
                  <Hash
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    value={user.profileId}
                    readOnly
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-100 py-3 pl-11 pr-4 font-mono text-sm outline-none"
                  />
                </div>
              </label>

              {/* Status */}

              <label className="text-sm font-semibold text-slate-700">
                Account Status

                <div className="relative">
                  <ShieldCheck
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    value={user.status}
                    readOnly
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-100 py-3 pl-11 pr-4 font-normal capitalize outline-none"
                  />
                </div>
              </label>

            </div>
          </section>


          {/* ================= PROFILE IMAGE ================= */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">

            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#159a8c]/10 text-[#159a8c]">
                <Image size={18} />
              </div>

              <div>
                <h2 className="text-lg font-bold text-[#102a43]">
                  Profile Image
                </h2>

                <p className="text-sm text-slate-500">
                  Add the URL of your profile image.
                </p>
              </div>
            </div>

            <div className="mt-6">

              <label className="text-sm font-semibold text-slate-700">
                Image URL

                <div className="relative">
                  <Image
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    value={user.profileImage}
                    onChange={(e) =>
                      handleChange(
                        "profileImage",
                        e.target.value
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-4 font-normal outline-none transition focus:border-[#159a8c] focus:bg-white focus:ring-4 focus:ring-[#159a8c]/10"
                    placeholder="https://example.com/profile.jpg"
                  />
                </div>
              </label>

              {/* Preview */}

              {user.profileImage && (
                <div className="mt-5 flex justify-center">
                  <img
                    src={user.profileImage}
                    alt="Profile preview"
                    className="h-32 w-32 rounded-full border-4 border-slate-100 object-cover shadow-sm"
                  />
                </div>
              )}

            </div>
          </section>


          {/* ================= ADDRESS ================= */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">

            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#159a8c]/10 text-[#159a8c]">
                <MapPin size={18} />
              </div>

              <div>
                <h2 className="text-lg font-bold text-[#102a43]">
                  Address
                </h2>

                <p className="text-sm text-slate-500">
                  Update your location information.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-3">

              {/* Landmark */}

              <label className="text-sm font-semibold text-slate-700">
                Landmark

                <div className="relative">
                  <MapPin
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    value={user.address.landmark}
                    onChange={(e) =>
                      handleAddressChange(
                        "landmark",
                        e.target.value
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-4 font-normal outline-none transition focus:border-[#159a8c] focus:bg-white focus:ring-4 focus:ring-[#159a8c]/10"
                    placeholder="Landmark"
                  />
                </div>
              </label>

              {/* State */}

              <label className="text-sm font-semibold text-slate-700">
                State

                <div className="relative">
                  <MapPin
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    value={user.address.state}
                    onChange={(e) =>
                      handleAddressChange(
                        "state",
                        e.target.value
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-4 font-normal outline-none transition focus:border-[#159a8c] focus:bg-white focus:ring-4 focus:ring-[#159a8c]/10"
                    placeholder="State"
                  />
                </div>
              </label>

              {/* Country */}

              <label className="text-sm font-semibold text-slate-700">
                Country

                <div className="relative">
                  <Globe
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    value={user.address.country}
                    onChange={(e) =>
                      handleAddressChange(
                        "country",
                        e.target.value
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-4 font-normal outline-none transition focus:border-[#159a8c] focus:bg-white focus:ring-4 focus:ring-[#159a8c]/10"
                    placeholder="Country"
                  />
                </div>
              </label>

            </div>
          </section>



          {/* ================= ACCOUNT DATES ================= */}
          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">

            <div className="grid gap-5 sm:grid-cols-2">

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm">
                  <CalendarDays size={18} />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Account Created
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    {formatDate(user.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm">
                  <CalendarDays size={18} />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Last Updated
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    {formatDate(user.updatedAt)}
                  </p>
                </div>
              </div>

            </div>
          </section>



          {/* ================= SAVE ================= */}
          <div className="flex items-center justify-end border-t border-slate-200 pt-6">

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#159a8c] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#159a8c]/20 transition hover:bg-[#117d72] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving changes..." : "Save changes"}
            </button>

          </div>

        </form>
      </div>
    </AppLayout>
  );
}

export default Profile;
 