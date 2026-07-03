export default function SwapLoading() {
  return (
    <div className="min-h-screen flex items-start justify-center px-4 pt-8" style={{ background: "#0a0a0f" }}>
      <div className="w-full max-w-[480px]">
        <div className="w-40 h-8 rounded-lg bg-gray-800 animate-pulse mx-auto mb-6" />
        <div className="rounded-2xl border border-[#2a2a3a] p-5" style={{ background: "#13131a" }}>
          <div className="flex justify-between items-center mb-5">
            <div className="w-16 h-6 rounded bg-gray-800 animate-pulse" />
            <div className="w-8 h-8 rounded-lg bg-gray-800 animate-pulse" />
          </div>
          <div className="rounded-xl p-4 mb-2" style={{ background: "#1c1c26" }}>
            <div className="w-16 h-3 rounded bg-gray-700 animate-pulse mb-3" />
            <div className="flex justify-between gap-3">
              <div className="w-32 h-9 rounded-lg bg-gray-700 animate-pulse" />
              <div className="w-28 h-10 rounded-xl bg-gray-700 animate-pulse" />
            </div>
          </div>
          <div className="flex justify-center my-2">
            <div className="w-10 h-10 rounded-xl bg-gray-800 animate-pulse" />
          </div>
          <div className="rounded-xl p-4 mt-1" style={{ background: "#1c1c26" }}>
            <div className="w-20 h-3 rounded bg-gray-700 animate-pulse mb-3" />
            <div className="flex justify-between gap-3">
              <div className="w-24 h-9 rounded-lg bg-gray-700 animate-pulse" />
              <div className="w-28 h-10 rounded-xl bg-gray-700 animate-pulse" />
            </div>
          </div>
          <div className="mt-4 w-full h-14 rounded-xl bg-gray-700 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
