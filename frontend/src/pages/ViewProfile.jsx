import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Wallet,
  ShieldCheck,
  Hash,
  FileText,
  ArrowLeft,
  CalendarDays,
  CircleUserRound,
  Database,
  Image as ImageIcon,
} from "lucide-react";

import AppLayout from "../components/AppLayout.jsx";
import { getUserById } from "../config/user/userAPI.js";

const ViewProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    const fetchUser = async () => {
      try {
        if (!userId) {
          console.error("User ID is missing");
          return;
        }

        const res = await getUserById(userId, token);

        console.log("PROFILE DATA:", res.data.user);

        setUser(res.data.user);
      } catch (error) {
        console.error(
          "GET USER ERROR:",
          error.response?.data || error.message
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  // Format date
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

  // Reusable information card
  const InfoItem = ({ icon: Icon, label, value, mono = false }) => {
    return (
      <div className="flex gap-4 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-[#159a8c] shadow-sm">
          <Icon size={19} />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {label}
          </p>

          <p
            className={`mt-1 break-words text-sm font-semibold text-slate-800 ${
              mono ? "font-mono text-xs" : ""
            }`}
          >
            {value || "Not provided"}
          </p>
        </div>
      </div>
    );
  };

  // Reusable section
  const Section = ({ icon: Icon, title, children }) => {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#159a8c]/10 text-[#159a8c]">
            <Icon size={18} />
          </div>

          <h2 className="text-lg font-bold text-[#102a43]">
            {title}
          </h2>
        </div>

        <div className="mt-6">
          {children}
        </div>
      </section>
    );
  };

  // Loading
  if (loading) {
    return (
      <AppLayout>
        <div className="flex min-h-[500px] items-center justify-center">
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

  // User not found
  if (!user) {
    return (
      <AppLayout>
        <div className="flex min-h-[500px] items-center justify-center">
          <div className="text-center">
            <CircleUserRound
              size={50}
              className="mx-auto text-slate-300"
            />

            <h2 className="mt-4 text-xl font-bold text-[#102a43]">
              User not found
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              The requested profile could not be loaded.
            </p>

            <button
              onClick={() => navigate(-1)}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#159a8c] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#128477]"
            >
              <ArrowLeft size={16} />
              Go Back
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const fullName = user.name || "Unnamed User";

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl space-y-6">

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-[#159a8c]"
        >
          <ArrowLeft size={17} />
          Back
        </button>

        {/* Heading */}
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#159a8c]">
            User Profile
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#102a43]">
            Profile Details
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Complete personal, contact, account, address, and system
            information.
          </p>
        </div>

        {/* ================= PROFILE HEADER ================= */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* Banner */}
          <div className="h-28 bg-gradient-to-r from-[#102a43] via-[#159a8c] to-[#159a8c]" />

          <div className="px-5 pb-7 sm:px-8">

            <div className="-mt-14 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

              {/* User */}
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end">

                {/* Profile Image */}
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={fullName}
                    className="h-28 w-28 rounded-full border-4 border-white object-cover shadow-md"
                  />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-white bg-[#159a8c] text-4xl font-bold text-white shadow-md">
                    {fullName.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="pb-1 text-center sm:text-left">
                  <h2 className="mb-2 text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
                    {fullName}
                  </h2>

                  <p className="mt-1 flex items-center justify-center gap-2 text-sm text-slate-700 sm:justify-start">
                    <Mail size={15} />
                    <span className="truncate">{user.email || "Email not provided"}</span>
                  </p>

                  <p className="mt-1 flex items-center justify-center gap-2 text-xs text-slate-600 sm:justify-start">
                    <Hash size={13} />
                    <span className="truncate">{user.profileId || "No Profile ID"}</span>
                  </p>
                </div>
              </div>

              {/* Status */}
              <span className="inline-flex items-center justify-center gap-2 self-center rounded-full bg-emerald-50 px-4 py-2 text-xs font-bold capitalize text-emerald-600 sm:self-auto">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                {user.status || "Active"}
              </span>
            </div>

            {/* Quick information */}
            <div className="mt-7 grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-3">

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  <Hash size={17} />
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    Profile ID
                  </p>

                  <p className="text-sm font-semibold text-slate-700">
                    {user.profileId || "Not provided"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  <Wallet size={17} />
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    Currency
                  </p>

                  <p className="text-sm font-semibold text-slate-700">
                    {user.preferredCurrency || "INR"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  <CalendarDays size={17} />
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    Joined
                  </p>

                  <p className="text-sm font-semibold text-slate-700">
                    {formatDate(user.createdAt)}
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>

        
        {/* ================= ABOUT ================= */}
        <Section
          icon={FileText}
          title="About"
        >
          <div className="rounded-xl bg-slate-50 p-5">
            <p className="whitespace-pre-line text-sm leading-7 text-slate-600">
              {user.about || "No information has been provided by this user."}
            </p>
          </div>
        </Section>

        {/* ================= PERSONAL INFORMATION ================= */}
        <Section
          icon={User}
          title="Personal Information"
        >
          <div className="grid gap-4 sm:grid-cols-2">

            <InfoItem
              icon={User}
              label="Full Name"
              value={user.name}
            />

            <InfoItem
              icon={Mail}
              label="Email Address"
              value={user.email}
            />

            <InfoItem
              icon={Phone}
              label="Phone Number"
              value={user.phone}
            />

            <InfoItem
              icon={Hash}
              label="Profile ID"
              value={user.profileId}
            />

          </div>
        </Section>

        {/* ================= ACCOUNT INFORMATION ================= */}
        <Section
          icon={ShieldCheck}
          title="Account Information"
        >
          <div className="grid gap-4 sm:grid-cols-2">

            <InfoItem
              icon={ShieldCheck}
              label="Account Status"
              value={user.status || "Active"}
            />

            <InfoItem
              icon={Wallet}
              label="Preferred Currency"
              value={user.preferredCurrency || "INR"}
            />

            <InfoItem
              icon={CalendarDays}
              label="Account Created"
              value={formatDate(user.createdAt)}
            />

            <InfoItem
              icon={CalendarDays}
              label="Last Updated"
              value={formatDate(user.updatedAt)}
            />

          </div>
        </Section>

        

        {/* ================= ADDRESS ================= */}
        <Section
          icon={MapPin}
          title="Address"
        >
          <div className="grid gap-4 sm:grid-cols-3">

            <InfoItem
              icon={MapPin}
              label="Landmark"
              value={user.address?.landmark}
            />

            <InfoItem
              icon={MapPin}
              label="State"
              value={user.address?.state}
            />

            <InfoItem
              icon={Globe}
              label="Country"
              value={user.address?.country}
            />

          </div>
        </Section> 

        {/* ================= SYSTEM INFORMATION ================= */}
        <Section
          icon={Database}
          title="System Information"
        >
          <div className="grid gap-4 sm:grid-cols-2">

            <InfoItem
              icon={Database}
              label="MongoDB User ID"
              value={user._id}
              mono
            />

            <InfoItem
              icon={Hash}
              label="Profile ID"
              value={user.profileId}
              mono
            />

            <InfoItem
              icon={CalendarDays}
              label="Created At"
              value={formatDate(user.createdAt)}
            />

            <InfoItem
              icon={CalendarDays}
              label="Updated At"
              value={formatDate(user.updatedAt)}
            />
 

          </div>
        </Section>
 

      </div>
    </AppLayout>
  );
};

export default ViewProfile;