// "use client";
// import { useState } from "react";
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { getAllAccounts, createAccount, updateAccount, deleteAccount, getAccountLedger } from "@/utils/api";
// import { Plus, Search, ChevronDown, ChevronRight, Loader2, X, BookOpen, Eye } from "lucide-react";

// const TYPE_COLORS: Record<string, string> = {
//   asset:     "bg-sky-100 text-sky-700",
//   liability: "bg-rose-100 text-rose-700",
//   equity:    "bg-purple-100 text-purple-700",
//   income:    "bg-green-100 text-green-700",
//   expense:   "bg-orange-100 text-orange-700",
// };

// const ACCOUNT_TYPES = ["asset", "liability", "equity", "income", "expense"];
// const SUBTYPES: Record<string, string[]> = {
//   asset:     ["cash", "bank", "accounts_receivable", "other_asset"],
//   liability: ["accounts_payable", "other_liability"],
//   equity:    ["owners_equity", "retained_earnings"],
//   income:    ["tuition_fee", "registration_fee", "other_income"],
//   expense:   ["salary", "marketing", "utilities", "rent", "software", "other_expense"],
// };

// // ── Create Account Modal ──────────────────────────────────────
// function CreateAccountModal({ onClose }: { onClose: () => void }) {
//   const queryClient = useQueryClient();
//   const [form, setForm] = useState({
//     code: "", name: "", type: "asset", subType: "",
//     description: "", openingBalance: 0,
//   });

//   const { mutate, isPending } = useMutation({
//     mutationFn: createAccount,
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["accounts-list"] });
//       onClose();
//     },
//     onError: (err: any) => alert(err?.response?.data?.message || "Error"),
//   });

//   return (
//     <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
//       <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
//         <div className="flex items-center justify-between p-5 border-b border-gray-100">
//           <h2 className="font-semibold text-gray-800">New Account</h2>
//           <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
//         </div>
//         <div className="p-5 space-y-4">
//           <div className="grid grid-cols-2 gap-3">
//             <div>
//               <label className="text-xs text-gray-500 mb-1 block">Code *</label>
//               <input
//                 className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400"
//                 placeholder="e.g. 1003"
//                 value={form.code}
//                 onChange={(e) => setForm({ ...form, code: e.target.value })}
//               />
//             </div>
//             <div>
//               <label className="text-xs text-gray-500 mb-1 block">Name *</label>
//               <input
//                 className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400"
//                 placeholder="Account name"
//                 value={form.name}
//                 onChange={(e) => setForm({ ...form, name: e.target.value })}
//               />
//             </div>
//           </div>

//           <div className="grid grid-cols-2 gap-3">
//             <div>
//               <label className="text-xs text-gray-500 mb-1 block">Type *</label>
//               <select
//                 className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400"
//                 value={form.type}
//                 onChange={(e) => setForm({ ...form, type: e.target.value, subType: "" })}
//               >
//                 {ACCOUNT_TYPES.map((t) => (
//                   <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
//                 ))}
//               </select>
//             </div>
//             <div>
//               <label className="text-xs text-gray-500 mb-1 block">Sub Type</label>
//               <select
//                 className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400"
//                 value={form.subType}
//                 onChange={(e) => setForm({ ...form, subType: e.target.value })}
//               >
//                 <option value="">Select...</option>
//                 {(SUBTYPES[form.type] || []).map((s) => (
//                   <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
//                 ))}
//               </select>
//             </div>
//           </div>

//           <div>
//             <label className="text-xs text-gray-500 mb-1 block">Opening Balance (Rs)</label>
//             <input
//               type="number"
//               className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400"
//               value={form.openingBalance}
//               onChange={(e) => setForm({ ...form, openingBalance: Number(e.target.value) })}
//             />
//           </div>

//           <div>
//             <label className="text-xs text-gray-500 mb-1 block">Description</label>
//             <textarea
//               rows={2}
//               className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400 resize-none"
//               value={form.description}
//               onChange={(e) => setForm({ ...form, description: e.target.value })}
//             />
//           </div>
//         </div>

//         <div className="p-5 border-t border-gray-100 flex justify-end gap-3">
//           <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
//           <button
//             onClick={() => mutate(form as any)}
//             disabled={isPending || !form.code || !form.name}
//             className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-white text-sm font-semibold rounded-lg disabled:opacity-60 flex items-center gap-2"
//           >
//             {isPending && <Loader2 size={14} className="animate-spin" />}
//             Create Account
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ── Ledger Drawer ─────────────────────────────────────────────
// function LedgerDrawer({ account, onClose }: { account: any; onClose: () => void }) {
//   const { data, isLoading } = useQuery({
//     queryKey: ["ledger", account._id],
//     queryFn: () => getAccountLedger(account._id).then((r) => r.data.data),
//   });

//   const fmt = (n: number) => `Rs ${(n || 0).toLocaleString("en-PK")}`;

//   return (
//     <div className="fixed inset-0 bg-black/40 z-50 flex justify-end">
//       <div className="bg-white w-full max-w-2xl h-full overflow-y-auto shadow-2xl">
//         <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white">
//           <div>
//             <h2 className="font-semibold text-gray-800">{account.name}</h2>
//             <p className="text-xs text-gray-400">{account.code} · Ledger</p>
//           </div>
//           <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
//         </div>

//         {isLoading ? (
//           <div className="flex items-center justify-center py-20">
//             <Loader2 size={24} className="animate-spin text-yellow-500" />
//           </div>
//         ) : (
//           <div className="p-5">
//             {/* Balance summary */}
//             <div className="grid grid-cols-2 gap-3 mb-5">
//               <div className="bg-gray-50 rounded-xl p-4">
//                 <p className="text-xs text-gray-500">Opening Balance</p>
//                 <p className="text-lg font-bold text-gray-800 mt-1">{fmt(data?.openingBalance)}</p>
//               </div>
//               <div className="bg-yellow-50 rounded-xl p-4">
//                 <p className="text-xs text-gray-500">Current Balance</p>
//                 <p className="text-lg font-bold text-yellow-700 mt-1">{fmt(data?.currentBalance)}</p>
//               </div>
//             </div>

//             {/* Ledger table */}
//             <div className="overflow-x-auto">
//               <table className="w-full text-sm">
//                 <thead>
//                   <tr className="bg-gray-50 text-xs text-gray-500">
//                     <th className="text-left px-3 py-2 rounded-l-lg">Date</th>
//                     <th className="text-left px-3 py-2">Description</th>
//                     <th className="text-right px-3 py-2">Debit</th>
//                     <th className="text-right px-3 py-2">Credit</th>
//                     <th className="text-right px-3 py-2 rounded-r-lg">Balance</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {(data?.ledger || []).length === 0 ? (
//                     <tr>
//                       <td colSpan={5} className="text-center py-8 text-gray-400 text-sm">
//                         No transactions yet
//                       </td>
//                     </tr>
//                   ) : (
//                     (data?.ledger || []).map((row: any, i: number) => (
//                       <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
//                         <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap">
//                           {new Date(row.date).toLocaleDateString("en-PK", { day: "2-digit", month: "short" })}
//                         </td>
//                         <td className="px-3 py-3 text-gray-700">{row.description}</td>
//                         <td className="px-3 py-3 text-right text-green-600 font-medium">
//                           {row.debit > 0 ? fmt(row.debit) : "—"}
//                         </td>
//                         <td className="px-3 py-3 text-right text-rose-500 font-medium">
//                           {row.credit > 0 ? fmt(row.credit) : "—"}
//                         </td>
//                         <td className="px-3 py-3 text-right font-semibold text-gray-800">
//                           {fmt(row.balance)}
//                         </td>
//                       </tr>
//                     ))
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// // ── Main Component ────────────────────────────────────────────
// export default function AccountsList() {
//   const [search, setSearch] = useState("");
//   const [filterType, setFilterType] = useState("");
//   const [showCreate, setShowCreate] = useState(false);
//   const [ledgerAccount, setLedgerAccount] = useState<any>(null);
//   const [expanded, setExpanded] = useState<Record<string, boolean>>({
//     asset: true, liability: true, equity: true, income: true, expense: true,
//   });

//   const { data: accounts, isLoading } = useQuery({
//     queryKey: ["accounts-list", filterType, search],
//     queryFn: () =>
//       getAllAccounts({ type: filterType || undefined, search: search || undefined })
//         .then((r) => r.data.grouped),
//   });

//   const fmt = (n: number) => `Rs ${(n || 0).toLocaleString("en-PK")}`;

//   return (
//     <>
//       {showCreate && <CreateAccountModal onClose={() => setShowCreate(false)} />}
//       {ledgerAccount && <LedgerDrawer account={ledgerAccount} onClose={() => setLedgerAccount(null)} />}

//       {/* Toolbar */}
//       <div className="flex flex-col sm:flex-row gap-3 mb-5">
//         <div className="relative flex-1">
//           <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
//           <input
//             className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-yellow-400"
//             placeholder="Search accounts..."
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//           />
//         </div>
//         <select
//           className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400"
//           value={filterType}
//           onChange={(e) => setFilterType(e.target.value)}
//         >
//           <option value="">All Types</option>
//           {ACCOUNT_TYPES.map((t) => (
//             <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
//           ))}
//         </select>
//         <button
//           onClick={() => setShowCreate(true)}
//           className="flex items-center gap-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-white text-sm font-semibold rounded-lg"
//         >
//           <Plus size={14} /> New Account
//         </button>
//       </div>

//       {isLoading ? (
//         <div className="flex items-center justify-center py-20">
//           <Loader2 size={24} className="animate-spin text-yellow-500" />
//         </div>
//       ) : (
//         <div className="space-y-4">
//           {ACCOUNT_TYPES.map((type) => {
//             const list: any[] = accounts?.[type] || [];
//             if (list.length === 0) return null;
//             const total = list.reduce((s: number, a: any) => s + a.currentBalance, 0);

//             return (
//               <div key={type} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
//                 {/* Group header */}
//                 <button
//                   onClick={() => setExpanded((p) => ({ ...p, [type]: !p[type] }))}
//                   className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
//                 >
//                   <div className="flex items-center gap-3">
//                     {expanded[type] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
//                     <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${TYPE_COLORS[type]}`}>
//                       {type}
//                     </span>
//                     <span className="text-xs text-gray-400">{list.length} accounts</span>
//                   </div>
//                   <span className="text-sm font-bold text-gray-700">{fmt(total)}</span>
//                 </button>

//                 {/* Account rows */}
//                 {expanded[type] && (
//                   <table className="w-full text-sm">
//                     <thead>
//                       <tr className="bg-gray-50 text-xs text-gray-500 border-t border-gray-100">
//                         <th className="text-left px-5 py-2">Code</th>
//                         <th className="text-left px-3 py-2">Name</th>
//                         <th className="text-left px-3 py-2 hidden md:table-cell">Sub Type</th>
//                         <th className="text-right px-3 py-2">Balance</th>
//                         <th className="text-right px-5 py-2">Status</th>
//                         <th className="px-3 py-2"></th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {list.map((acc: any) => (
//                         <tr key={acc._id} className="border-t border-gray-50 hover:bg-gray-50">
//                           <td className="px-5 py-3 font-mono text-xs text-gray-500">{acc.code}</td>
//                           <td className="px-3 py-3 font-medium text-gray-800">
//                             {acc.name}
//                             {acc.isSystem && (
//                               <span className="ml-2 text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">system</span>
//                             )}
//                           </td>
//                           <td className="px-3 py-3 hidden md:table-cell text-xs text-gray-400 capitalize">
//                             {acc.subType?.replace(/_/g, " ") || "—"}
//                           </td>
//                           <td className="px-3 py-3 text-right font-semibold text-gray-800">
//                             {fmt(acc.currentBalance)}
//                           </td>
//                           <td className="px-5 py-3 text-right">
//                             <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${acc.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
//                               {acc.isActive ? "Active" : "Inactive"}
//                             </span>
//                           </td>
//                           <td className="px-3 py-3 text-right">
//                             <button
//                               onClick={() => setLedgerAccount(acc)}
//                               className="p-1.5 hover:bg-yellow-50 rounded-lg text-yellow-500 transition-colors"
//                               title="View Ledger"
//                             >
//                               <Eye size={14} />
//                             </button>
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 )}
//               </div>
//             );
//           })}
//         </div>
//       )}
//     </>
//   );
// }

"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllAccounts, createAccount, updateAccount, deleteAccount, getAccountLedger } from "@/utils/api";
import { Plus, Search, ChevronDown, ChevronRight, Loader2, X, BookOpen, Eye, Wallet } from "lucide-react";
import PageHeader from "@/app/component/dashboard/page-header";
import { useRouter } from "next/navigation";
import ExportButton from "@/app/component/ui/export-button";
import InputWithSelect from "@/app/component/ui/input-with-select";

const TYPE_COLORS: Record<string, string> = {
  asset: "bg-sky-100 text-sky-700",
  liability: "bg-rose-100 text-rose-700",
  equity: "bg-purple-100 text-purple-700",
  income: "bg-green-100 text-green-700",
  expense: "bg-orange-100 text-orange-700",
};

const ACCOUNT_TYPES = ["asset", "liability", "equity", "income", "expense"];
const SUBTYPES: Record<string, string[]> = {
  asset: ["cash", "bank", "accounts_receivable", "other_asset"],
  liability: ["accounts_payable", "other_liability"],
  equity: ["owners_equity", "retained_earnings"],
  income: ["tuition_fee", "registration_fee", "other_income"],
  expense: ["salary", "marketing", "utilities", "rent", "software", "other_expense"],
};


// ── Custom Type Dropdown ────────────────────────────────────
function TypeDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400 flex items-center justify-between bg-white"
      >
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${TYPE_COLORS[value]}`}>
          {value}
        </span>
        <ChevronDown size={14} className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg overflow-hidden">
          {ACCOUNT_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                onChange(t);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
            >
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${TYPE_COLORS[t]}`}>
                {t}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Custom SubType Combobox ─────────────────────────────────


// ── Create Account Modal ──────────────────────────────────────
function CreateAccountModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    code: "", name: "", type: "asset", subType: "",
    description: "", openingBalance: 0,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: createAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts-list"] });
      onClose();
    },
    onError: (err: any) => alert(err?.response?.data?.message || "Error"),
  });

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">New Account</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Code *</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400 text-gray-900 placeholder:text-gray-400"
                placeholder="e.g. 1003"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Name *</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400 text-gray-900 placeholder:text-gray-400"
                placeholder="Account name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Type *</label>
              <TypeDropdown
                value={form.type}
                onChange={(v) => setForm({ ...form, type: v, subType: "" })}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Sub Type</label>
              <InputWithSelect
                value={form.subType}
                onChange={(v) => setForm({ ...form, subType: v })}
                options={SUBTYPES[form.type] || []}
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Opening Balance (Rs)</label>
            <input
              type="number"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400 text-gray-900 placeholder:text-gray-400"
              value={form.openingBalance}
              onChange={(e) => setForm({ ...form, openingBalance: Number(e.target.value) })}
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Description</label>
            <textarea
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400 text-gray-900 placeholder:text-gray-400 resize-none"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
        </div>

        <div className="p-5 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
          <button
            onClick={() => mutate(form as any)}
            disabled={isPending || !form.code || !form.name}
            className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-white text-sm font-semibold rounded-lg disabled:opacity-60 flex items-center gap-2"
          >
            {isPending && <Loader2 size={14} className="animate-spin" />}
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Ledger Drawer ─────────────────────────────────────────────
function LedgerDrawer({ account, onClose }: { account: any; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["ledger", account._id],
    queryFn: () => getAccountLedger(account._id).then((r) => r.data.data),
  });

  const fmt = (n: number) => `Rs ${(n || 0).toLocaleString("en-PK")}`;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex justify-end">
      <div className="bg-white w-full max-w-2xl h-full overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white">
          <div>
            <h2 className="font-semibold text-gray-800">{account.name}</h2>
            <p className="text-xs text-gray-400">{account.code} · Ledger</p>
          </div>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-yellow-500" />
          </div>
        ) : (
          <div className="p-5">
            {/* Balance summary */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500">Opening Balance</p>
                <p className="text-lg font-bold text-gray-800 mt-1">{fmt(data?.openingBalance)}</p>
              </div>
              <div className="bg-yellow-50 rounded-xl p-4">
                <p className="text-xs text-gray-500">Current Balance</p>
                <p className="text-lg font-bold text-yellow-700 mt-1">{fmt(data?.currentBalance)}</p>
              </div>
            </div>

            {/* Ledger table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500">
                    <th className="text-left px-3 py-2 rounded-l-lg">Date</th>
                    <th className="text-left px-3 py-2">Description</th>
                    <th className="text-right px-3 py-2">Debit</th>
                    <th className="text-right px-3 py-2">Credit</th>
                    <th className="text-right px-3 py-2 rounded-r-lg">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.ledger || []).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-400 text-sm">
                        No transactions yet
                      </td>
                    </tr>
                  ) : (
                    (data?.ledger || []).map((row: any, i: number) => (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {new Date(row.date).toLocaleDateString("en-PK", { day: "2-digit", month: "short" })}
                        </td>
                        <td className="px-3 py-3 text-gray-700">{row.description}</td>
                        <td className="px-3 py-3 text-right text-green-600 font-medium">
                          {row.debit > 0 ? fmt(row.debit) : "—"}
                        </td>
                        <td className="px-3 py-3 text-right text-rose-500 font-medium">
                          {row.credit > 0 ? fmt(row.credit) : "—"}
                        </td>
                        <td className="px-3 py-3 text-right font-semibold text-gray-800">
                          {fmt(row.balance)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function AccountsList() {
  const router = useRouter();
  const [filters, setFilters] = useState({ search: "", type: "" });
  const [showCreate, setShowCreate] = useState(false);
  const [ledgerAccount, setLedgerAccount] = useState<any>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    asset: true, liability: true, equity: true, income: true, expense: true,
  });

  const { data: accounts, isLoading } = useQuery({
    queryKey: ["accounts-list", filters.type, filters.search],
    queryFn: () =>
      getAllAccounts({ type: filters.type || undefined, search: filters.search || undefined })
        .then((r) => r.data.grouped),
  });

  const totalAccounts = ACCOUNT_TYPES.reduce(
    (sum, type) => sum + (accounts?.[type]?.length || 0), 0
  );

  const fmt = (n: number) => `Rs ${(n || 0).toLocaleString("en-PK")}`;

  return (
    <>
      {showCreate && <CreateAccountModal onClose={() => setShowCreate(false)} />}
      {ledgerAccount && <LedgerDrawer account={ledgerAccount} onClose={() => setLedgerAccount(null)} />}

      <PageHeader
        title="Chart of Accounts"
        subtitle="Manage ledger accounts and balances"
        titleIcon={<Wallet size={24} />}
        totalCount={totalAccounts}
        onAdd={() => setShowCreate(true)}
        filters={filters}
        setFilters={setFilters}
        filterFields={[
          {
            type: "input",
            name: "search",
            placeholder: "Search accounts...",
          },
          {
            type: "select",
            name: "type",
            placeholder: "All Types",
            options: ACCOUNT_TYPES.map((t) => ({
              label: t.charAt(0).toUpperCase() + t.slice(1),
              value: t,
            })),
          },
        ]}
        exportBtn={
          <ExportButton
            filename="chart-of-accounts"
            label="Export Excel"
            fetchData={async () => {
              const res = await getAllAccounts();
              return res.data.data;
            }}
            columns={[
              { header: "Code", key: "code" },
              { header: "Name", key: "name" },
              { header: "Type", key: "type" },
              { header: "Sub Type", key: "subType" },
              { header: "Balance (Rs)", key: "currentBalance", format: (v) => Number(v || 0).toLocaleString() },
              { header: "Opening (Rs)", key: "openingBalance", format: (v) => Number(v || 0).toLocaleString() },
              { header: "Status", key: "isActive", format: (v) => v ? "Active" : "Inactive" },
              { header: "System", key: "isSystem", format: (v) => v ? "Yes" : "No" },
            ]}
          />
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-yellow-500" />
        </div>
      ) : (
        <div className="space-y-4">
          {ACCOUNT_TYPES.map((type) => {
            const list: any[] = accounts?.[type] || [];
            if (list.length === 0) return null;
            const total = list.reduce((s: number, a: any) => s + a.currentBalance, 0);

            return (
              <div key={type} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Group header */}
                <button
                  onClick={() => setExpanded((p) => ({ ...p, [type]: !p[type] }))}
                  className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {expanded[type] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${TYPE_COLORS[type]}`}>
                      {type}
                    </span>
                    <span className="text-xs text-gray-400">{list.length} accounts</span>
                  </div>
                  <span className="text-sm font-bold text-gray-700">{fmt(total)}</span>
                </button>

                {/* Account rows */}
                {expanded[type] && (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-xs text-gray-500 border-t border-gray-100">
                        <th className="text-left px-5 py-2">Code</th>
                        <th className="text-left px-3 py-2">Name</th>
                        <th className="text-left px-3 py-2 hidden md:table-cell">Sub Type</th>
                        <th className="text-right px-3 py-2">Balance</th>
                        <th className="text-right px-5 py-2">Status</th>
                        <th className="px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((acc: any) => (
                        <tr key={acc._id} className="border-t border-gray-50 hover:bg-gray-50">
                          <td className="px-5 py-3 font-mono text-xs text-gray-500">{acc.code}</td>
                          <td className="px-3 py-3 font-medium text-gray-800">
                            {acc.name}
                            {acc.isSystem && (
                              <span className="ml-2 text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">system</span>
                            )}
                          </td>
                          <td className="px-3 py-3 hidden md:table-cell text-xs text-gray-400 capitalize">
                            {acc.subType?.replace(/_/g, " ") || "—"}
                          </td>
                          <td className="px-3 py-3 text-right font-semibold text-gray-800">
                            {fmt(acc.currentBalance)}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${acc.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                              {acc.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <button
                              // onClick={() => setLedgerAccount(acc)}
                              onClick={() => router.push(`/dashboard/finance/accounts/ledger-view?id=${acc._id}`)}
                              className="p-1.5 hover:bg-yellow-50 rounded-lg text-yellow-500 transition-colors"
                              title="View Ledger"
                            >
                              <Eye size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}