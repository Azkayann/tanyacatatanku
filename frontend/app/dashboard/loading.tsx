import { AppShell } from "../components/AppShell";

export default function Loading() {
  return (
    <AppShell isAdmin={false}>
      <div className="space-y-6">
        {/* Header loading */}
        <div className="animate-pulse bg-white p-6 rounded-2xl border border-gray-200 shadow-card">
          <div className="h-7 bg-gray-200 rounded-lg w-2/3 mb-2"></div>
          <div className="h-4 bg-gray-100 rounded-lg w-1/3"></div>
        </div>

        {/* KPI loading grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse bg-white p-5 rounded-2xl border border-gray-200 shadow-card">
              <div className="flex items-center justify-between mb-3">
                <div className="h-4 bg-gray-200 rounded-lg w-20"></div>
                <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
              </div>
              <div className="h-8 bg-gray-300 rounded-lg mb-2"></div>
              <div className="h-3 bg-gray-100 rounded-lg w-24"></div>
            </div>
          ))}
        </div>

        {/* Chart area loading */}
        <div className="animate-pulse bg-white p-6 rounded-2xl border border-gray-200 shadow-card">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-2">
              <div className="h-5 bg-gray-300 rounded-lg w-32"></div>
              <div className="h-3 bg-gray-200 rounded-lg w-24"></div>
            </div>
            <div className="h-6 bg-gray-200 rounded-lg w-16"></div>
          </div>
          <div className="h-64 bg-gray-100 rounded-xl"></div>
        </div>
      </div>
    </AppShell>
  );
}
