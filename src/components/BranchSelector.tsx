// import React, { useState } from "react";
// import { Building2, ChevronDown, Check } from "lucide-react";
// import { motion, AnimatePresence } from "motion/react";
// import { useBranch } from "../contexts/BranchContext";

// export default function BranchSelector() {
//   const { currentBranch, branches, switchBranch, canSwitchBranch, isLoading } =
//     useBranch();
//   const [isOpen, setIsOpen] = useState(false);

//   if (isLoading) {
//     return (
//       <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 animate-pulse">
//         <div className="w-5 h-5 bg-slate-200 dark:bg-white/10 rounded-md"></div>
//         <div className="w-24 h-4 bg-slate-200 dark:bg-white/10 rounded"></div>
//       </div>
//     );
//   }

//   const currentName = currentBranch ? currentBranch.name : "كل الفروع";
//   const isActive = currentBranch ? currentBranch.is_active : true;

//   if (!canSwitchBranch) {
//     // Show static badge
//     return (
//       <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm relative">
//         <div
//           className={`absolute top-0 right-0 w-2.5 h-2.5 -mt-1 -mr-1 rounded-full border-2 border-white dark:border-[#080c13] ${isActive ? "bg-green-500" : "bg-red-500"}`}
//         />
//         <Building2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
//         <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
//           {currentName}
//         </span>
//       </div>
//     );
//   }

//   // Show dropdown
//   return (
//     <div className="relative z-50">
//       <button
//         onClick={() => setIsOpen(!isOpen)}
//         className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 shadow-sm hover:bg-slate-50 dark:hover:bg-white/5 transition-colors relative"
//       >
//         <div
//           className={`absolute top-0 right-0 w-2.5 h-2.5 -mt-1 -mr-1 rounded-full border-2 border-white dark:border-[#080c13] ${isActive ? "bg-green-500" : "bg-red-500"}`}
//         />
//         <Building2 className="w-4 h-4 text-primary-500" />
//         <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
//           {currentName}
//         </span>
//         <ChevronDown
//           className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
//         />
//       </button>

//       <AnimatePresence>
//         {isOpen && (
//           <>
//             <div
//               className="fixed inset-0 z-40"
//               onClick={() => setIsOpen(false)}
//             ></div>
//             <motion.div
//               initial={{ opacity: 0, y: 10, scale: 0.95 }}
//               animate={{ opacity: 1, y: 0, scale: 1 }}
//               exit={{ opacity: 0, y: 10, scale: 0.95 }}
//               transition={{ duration: 0.2 }}
//               className="absolute left-0 mt-2 min-w-[220px] max-w-sm bg-white dark:bg-[#11151c] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden z-50"
//             >
//               <div className="p-2 border-b border-slate-100 dark:border-white/5">
//                 <span className="text-xs font-bold text-slate-500 dark:text-slate-400 px-2 tracking-widest uppercase">
//                   الفروع المتاحة
//                 </span>
//               </div>
//               <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
//                 <button
//                   onClick={() => {
//                     switchBranch("");
//                     setIsOpen(false);
//                   }}
//                   className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-start transition-colors ${
//                     !currentBranch
//                       ? "bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400 font-bold"
//                       : "hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 font-medium"
//                   }`}
//                 >
//                   <div className="flex items-center gap-2">
//                     <div className="w-2 h-2 rounded-full bg-primary-500" />
//                     <span className="truncate max-w-[150px]">كل الفروع</span>
//                   </div>
//                   {!currentBranch && (
//                     <Check className="w-4 h-4 text-primary-500" />
//                   )}
//                 </button>
//                 {branches.map((branch) => (
//                   <button
//                     key={branch.id}
//                     onClick={() => {
//                       switchBranch(branch.id);
//                       setIsOpen(false);
//                     }}
//                     className={`w-full flex items-center justify-between px-3 py-2.5 mt-1 rounded-lg text-sm text-start transition-colors ${
//                       currentBranch?.id === branch.id
//                         ? "bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400 font-bold"
//                         : "hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 font-medium"
//                     }`}
//                   >
//                     <div className="flex items-center gap-2">
//                       <div
//                         className={`w-2 h-2 rounded-full ${branch.is_active ? "bg-green-500" : "bg-red-500"}`}
//                       />
//                       <span className="truncate max-w-[150px]">
//                         {branch.name}
//                       </span>
//                     </div>
//                     {currentBranch?.id === branch.id && (
//                       <Check className="w-4 h-4 text-primary-500" />
//                     )}
//                   </button>
//                 ))}
//               </div>
//             </motion.div>
//           </>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }
import React from "react";
import { Building2 } from "lucide-react";
import { useBranch } from "../contexts/BranchContext";

export default function BranchSelector() {
  const { currentBranch, branches, switchBranch, canSwitchBranch, isLoading } =
    useBranch();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 animate-pulse">
        <div className="w-5 h-5 bg-slate-200 dark:bg-white/10 rounded-md"></div>
        <div className="w-24 h-4 bg-slate-200 dark:bg-white/10 rounded"></div>
      </div>
    );
  }

  const currentName = currentBranch ? currentBranch.name : "كل الفروع";
  const isActive = currentBranch ? currentBranch.is_active : true;

  if (!canSwitchBranch) {
    // Show static badge
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm relative">
        <div
          className={`absolute top-0 right-0 w-2.5 h-2.5 -mt-1 -mr-1 rounded-full border-2 border-white dark:border-[#080c13] ${isActive ? "bg-green-500" : "bg-red-500"}`}
        />
        <Building2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
          {currentName}
        </span>
      </div>
    );
  }

  // Show buttons row
  return (
    <div className="flex flex-nowrap md:flex-wrap items-center gap-2 max-w-[60vw] md:max-w-none overflow-x-auto custom-scrollbar pb-1">
      <button
        onClick={() => switchBranch("")}
        className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg border shadow-sm transition-colors text-sm font-bold ${
          !currentBranch
            ? "bg-primary-50 dark:bg-primary-500/10 border-primary-200 dark:border-primary-500/20 text-primary-700 dark:text-primary-400"
            : "bg-white dark:bg-[#11151c] border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
        }`}
      >
        <Building2 className="w-4 h-4" />
        كل الفروع
      </button>
      {branches.map((branch) => (
        <button
          key={branch.id}
          onClick={() => switchBranch(branch.id)}
          className={`shrink-0 relative flex items-center gap-2 px-3 py-1.5 rounded-lg border shadow-sm transition-colors text-sm font-bold ${
            currentBranch?.id === branch.id
              ? "bg-primary-50 dark:bg-primary-500/10 border-primary-200 dark:border-primary-500/20 text-primary-700 dark:text-primary-400"
              : "bg-white dark:bg-[#11151c] border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full ${branch.is_active ? "bg-green-500" : "bg-red-500"}`}
          />
          <span className="truncate max-w-[150px]">{branch.name}</span>
        </button>
      ))}
    </div>
  );
}
