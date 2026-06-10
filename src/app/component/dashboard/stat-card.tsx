import { StatCardProps } from "@/types/dasboard";


export function StatCard({ title, value, change, icon: Icon, bg, text, onClick }: StatCardProps) {
  return (
    <div className={`${bg} ${text} rounded-xl p-5 shadow-sm`} onClick={onClick}>
      <div className="flex justify-between items-start">
        <p className="text-sm opacity-80">{title}</p>
        <Icon size={18} className="opacity-70" />
      </div>
      <p className="text-3xl font-bold mt-2">{value}</p>
      <p className="text-xs opacity-70 mt-1">{change}</p>
    </div>
  );
}

export function StatCarduser({ title, value, icon: Icon, sub, iconBg, progress, iconColor, onClick }: StatCardProps) {
  return (
        <div key={title} className="bg-white border border-gray-100 rounded-xl p-3 sm:p-4 flex flex-col sm:gap-2.5 shadow-sm" onClick={onClick}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-gray-500">{title}</span>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center order-first sm:order-last mb-2 sm:mb-0" style={{ background: iconBg }}>
              <Icon size={16} color={iconColor} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-medium text-gray-900">{value}</div>
            {sub && <p className="text-xs text-gray-500 sm:mt-0.5">{sub}</p>}
            {progress !== undefined && (
              <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-teal-600 rounded-full" style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>
        </div>
  );
}