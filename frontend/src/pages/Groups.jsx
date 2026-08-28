import React, { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import {createGroup,getMyGroups} from "../config/group/groupAPI"

const Groups = () => {

  const [groupInfo, setgroupInfo] = useState({name:"", description:"", coverImage:"", baseCurrency:""});
  const [AllGroups, setAllGroups] = useState([]);

  const handleCreateGroup = async ()=>{
    try{
    const token = localStorage.getItem("token");
    const res = await createGroup(token);
    console.log(res.data);
    }catch(err){
      console.log(err)
    }
  }

 useEffect(() => {
  const handleGetGroup = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await getMyGroups(token);
      console.log(res.data);
      setAllGroups(res.data.groups);
    } catch (err) {
      console.log(err);
    }
  };
  handleGetGroup();
}, []);



  return (
    <AppLayout>

      {/* Header */}
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

        <button
          onClick={() =>
            document.getElementById("add_group_modal").showModal()
          }
          className="w-fit rounded-xl bg-[#159a8c] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#159a8c]/20 transition hover:bg-[#117d72]"
        >
          + Add Group
        </button>
      </div>

      {/* Groups */}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">       
       {AllGroups.map((group) => (
        <div key={group._id} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
        
         {/* Top */}
           <div className="p-6">
             <div className="flex items-start justify-between gap-4">
             <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#159a8c]/10 text-lg font-bold text-[#159a8c]">
             {group.name?.charAt(0).toUpperCase()}
             </div>

             <span className="rounded-full bg-[#159a8c]/10 px-3 py-1 text-xs font-bold text-[#159a8c]">
              {group.baseCurrency}
            </span>
            
           </div>

        <h2 className="mt-5 text-xl font-bold text-[#102a43]">
          {group.name}
        </h2>

        <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">
          {group.description || "No description available"}
        </p>
           </div>

        {/* Footer */}
         <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-6 py-4">
          <div className="text-xs text-slate-500">
           <span className="font-semibold text-slate-700">
             {group.members?.length || 0}
           </span>{" "}
            members
          </div>

         <button className="text-sm font-bold text-[#159a8c] transition group-hover:text-[#117d72]">
           View Group →
         </button>
         </div>
        </div>
    ))}
      </div>

      {/* Add Group Modal */}
      <dialog id="add_group_modal"  className="fixed inset-0 m-auto w-[90%] max-w-md rounded-2xl border-0 p-0 shadow-2xl backdrop:bg-black/40">
           <div className="bg-white p-6">
            <h3 className="text-2xl font-bold text-[#102a43]">Create Group </h3>
            
            <input  value={groupInfo.name} onChange={(e)=> setgroupInfo({ ...groupInfo, name: e.target.value })} 
            type="text" placeholder="Enter group name" className="mt-5 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#159a8c]"/>
            
            <input value={groupInfo.description} onChange={(e)=>setgroupInfo({ ...groupInfo, description: e.target.value })}
            type="text" placeholder="Enter group description" className="mt-5 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#159a8c]"/>
            
            <select  value={groupInfo.baseCurrency} onChange={(e) =>setgroupInfo({ ...groupInfo, baseCurrency: e.target.value })} 
            className="mt-5 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#159a8c]">
              <option value="">Select base currency</option>
              <option value="INR">INR - Indian Rupee</option>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
            </select>

              <div className="mt-6 flex justify-end gap-3">
                <form method="dialog">
                  <button className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100">
                  Cancel
                  </button>
                </form>

                  <button onClick={handleCreateGroup} className="rounded-xl bg-[#159a8c] px-4 py-2 font-semibold text-white hover:bg-[#117d72]">
                   Create Group
                  </button>
              </div>
         </div>
      </dialog>

    </AppLayout>
  );
};

export default Groups;