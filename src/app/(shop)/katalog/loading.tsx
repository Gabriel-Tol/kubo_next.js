export default function LoadingKatalog() {
  return (
    <div className="grid md:grid-cols-[220px_1fr] gap-6" aria-busy="true" aria-label="Memuat katalog">
      <div className="bg-permukaan border border-kakao/10 rounded-xl p-4 space-y-3">
        {[40, 80, 60, 70].map((w, i) => (
          <div key={i} className="h-10 rounded-lg bg-kakao/5" style={{ width: `${w}%` }} />
        ))}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-permukaan border border-kakao/10 rounded-xl overflow-hidden">
            <div className="aspect-square bg-kakao/5" />
            <div className="p-3 space-y-2">
              <div className="h-3 w-1/2 rounded bg-kakao/5" />
              <div className="h-4 w-3/4 rounded bg-kakao/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
