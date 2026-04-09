export function FilterBar({ children, onClear, clearDisabled = false }) {
  return (
    <div className="filter-bar">
      <div className="filter-bar-fields">{children}</div>
      <button type="button" className="filter-clear" onClick={onClear} disabled={clearDisabled}>
        Clear filters
      </button>
    </div>
  );
}
