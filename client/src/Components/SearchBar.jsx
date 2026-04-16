import { useState, useRef, useEffect } from "react";

// ── SearchBar ─────────────────────────────────────────────────
// Props:
//   items        – array of objects to search through
//   searchKeys   – array of keys to match against  e.g. ["full_name","email"]
//   placeholder  – input placeholder text
//   onSelect     – callback(item) when user clicks a result
//   renderLabel  – fn(item) → string shown as main label
//   renderSub    – fn(item) → string shown as subtitle (optional)
//   renderAvatar – fn(item) → string for avatar initial (optional)
//   accentColor  – tailwind text color class for highlights e.g. "text-indigo-600"
export default function SearchBar({
  items = [],
  searchKeys = ["name"],
  placeholder = "Search…",
  onSelect,
  renderLabel,
  renderSub,
  renderAvatar,
  accentColor = "text-indigo-600",
}) {
  const [query, setQuery]       = useState("");
  const [open, setOpen]         = useState(false);
  const [hovered, setHovered]   = useState(-1);
  const inputRef                = useRef(null);
  const containerRef            = useRef(null);

  // close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = query.trim() === ""
    ? []
    : items.filter(item =>
        searchKeys.some(key =>
          String(item[key] ?? "").toLowerCase().includes(query.toLowerCase())
        )
      ).slice(0, 8);

  const handleSelect = (item) => {
    setQuery(renderLabel ? renderLabel(item) : item[searchKeys[0]] ?? "");
    setOpen(false);
    onSelect && onSelect(item);
  };

  const handleKey = (e) => {
    if (!open || filtered.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setHovered(h => Math.min(h + 1, filtered.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setHovered(h => Math.max(h - 1, 0)); }
    if (e.key === "Enter" && hovered >= 0) handleSelect(filtered[hovered]);
    if (e.key === "Escape") setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      {/* Input */}
      <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-indigo-400 focus-within:border-transparent transition-all">
        {/* search icon */}
        <svg className="w-4 h-4 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>

        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder={placeholder}
          onChange={e => { setQuery(e.target.value); setOpen(true); setHovered(-1); }}
          onFocus={() => query && setOpen(true)}
          onKeyDown={handleKey}
          className="flex-1 text-sm text-slate-700 placeholder-slate-300 bg-transparent outline-none"
        />

        {/* clear button */}
        {query && (
          <button
            onClick={() => { setQuery(""); setOpen(false); inputRef.current?.focus(); onSelect && onSelect(null); }}
            className="text-slate-300 hover:text-slate-500 transition-colors shrink-0"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-100 rounded-xl shadow-lg z-50 overflow-hidden">
          {filtered.map((item, i) => {
            const label  = renderLabel  ? renderLabel(item)  : item[searchKeys[0]] ?? "";
            const sub    = renderSub    ? renderSub(item)    : null;
            const avatar = renderAvatar ? renderAvatar(item) : null;

            // highlight matching part
            const idx = label.toLowerCase().indexOf(query.toLowerCase());
            const before = idx >= 0 ? label.slice(0, idx) : label;
            const match  = idx >= 0 ? label.slice(idx, idx + query.length) : "";
            const after  = idx >= 0 ? label.slice(idx + query.length) : "";

            return (
              <div
                key={i}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(-1)}
                onClick={() => handleSelect(item)}
                className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${hovered === i ? "bg-slate-50" : "bg-white"}`}
              >
                {/* left search icon */}
                <svg className="w-4 h-4 text-slate-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>

                {/* text */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 truncate">
                    {before}
                    <span className={`font-semibold ${accentColor}`}>{match}</span>
                    {after}
                  </p>
                  {sub && <p className="text-xs text-slate-400 truncate">{sub}</p>}
                </div>

                {/* right avatar */}
                {avatar && (
                  <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <span className={`text-xs font-bold ${accentColor}`}>{avatar}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* no results */}
      {open && query && filtered.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-100 rounded-xl shadow-lg z-50 px-4 py-3">
          <p className="text-sm text-slate-400">No results for "<span className="text-slate-600">{query}</span>"</p>
        </div>
      )}
    </div>
  );
}
