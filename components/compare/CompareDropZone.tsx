"use client";

export function CompareDropZone({ selected, onRemove, onDropSymbol, onClearAll }: { selected: string[]; onRemove: (s: string) => void; onDropSymbol: (s: string) => void; onClearAll: () => void }) {
  return (
    <section onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onDropSymbol(e.dataTransfer.getData("text/plain")); }} className="mt-4 rounded-2xl border border-dashed border-white/25 p-4">
      <p className="text-sm text-slate-300">เลือกหุ้น 2–4 ตัวเพื่อนำมาเปรียบเทียบ</p>
      <p className="text-xs text-slate-400">Selected {selected.length}/4</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {selected.map((symbol) => <span key={symbol} className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-xs">{symbol}<button onClick={() => onRemove(symbol)} className="text-rose-300">×</button></span>)}
      </div>
      <button onClick={onClearAll} className="mt-3 text-xs text-slate-300 underline">Clear All</button>
    </section>
  );
}
