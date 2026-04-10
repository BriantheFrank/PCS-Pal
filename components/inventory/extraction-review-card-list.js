import { CATEGORY_DEFINITIONS } from "@/inventory-data";

export function ExtractionReviewCardList({ items, onItemChange, onDelete }) {
  return (
    <ul className="extraction-review-cards" aria-label="Extracted inventory items">
      {items.map((item) => (
        <li key={item.reviewId} className="extraction-review-card">
          <label className="inventory-item-field">
            Item name
            <input
              type="text"
              value={item.label}
              onChange={(event) => onItemChange(item.reviewId, "label", event.target.value)}
            />
          </label>
          <label className="inventory-item-field">
            Category
            <select
              value={item.category}
              onChange={(event) => onItemChange(item.reviewId, "category", event.target.value)}
            >
              {CATEGORY_DEFINITIONS.map((category) => (
                <option key={`${item.reviewId}-${category.label}`} value={category.label}>
                  {category.label}
                </option>
              ))}
            </select>
          </label>
          <div className="extraction-review-card-grid">
            <label className="inventory-item-field">
              Quantity
              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(event) => onItemChange(item.reviewId, "quantity", event.target.value)}
              />
            </label>
            <label className="inventory-item-field">
              Weight (lbs)
              <input
                type="number"
                min="1"
                value={item.weight}
                onChange={(event) => onItemChange(item.reviewId, "weight", event.target.value)}
              />
            </label>
          </div>
          <div className="extraction-review-card-toggles">
            <label className="inventory-item-field inventory-item-checkbox">
              <input
                type="checkbox"
                checked={Boolean(item.isFragile)}
                onChange={(event) => onItemChange(item.reviewId, "isFragile", event.target.checked)}
              />
              <span>Fragile</span>
            </label>
            <label className="inventory-item-field inventory-item-checkbox">
              <input
                type="checkbox"
                checked={Boolean(item.isHighValue)}
                onChange={(event) => onItemChange(item.reviewId, "isHighValue", event.target.checked)}
              />
              <span>High value</span>
            </label>
          </div>
          <button type="button" className="label-action secondary" onClick={() => onDelete(item.reviewId)}>
            Delete item
          </button>
        </li>
      ))}
    </ul>
  );
}
