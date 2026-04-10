import { CATEGORY_DEFINITIONS } from "@/inventory-data";

export function ExtractionReviewTable({ items, onItemChange, onDelete }) {
  return (
    <div className="extraction-review-table-wrap">
      <table className="extraction-review-table">
        <thead>
          <tr>
            <th scope="col">Item</th>
            <th scope="col">Category</th>
            <th scope="col">Qty</th>
            <th scope="col">Weight (lbs)</th>
            <th scope="col">Fragile</th>
            <th scope="col">High value</th>
            <th scope="col" aria-label="Delete item"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.reviewId}>
              <td>
                <input
                  type="text"
                  value={item.label}
                  onChange={(event) => onItemChange(item.reviewId, "label", event.target.value)}
                />
              </td>
              <td>
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
              </td>
              <td>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(event) => onItemChange(item.reviewId, "quantity", event.target.value)}
                />
              </td>
              <td>
                <input
                  type="number"
                  min="1"
                  value={item.weight}
                  onChange={(event) => onItemChange(item.reviewId, "weight", event.target.value)}
                />
              </td>
              <td>
                <label className="inventory-item-checkbox inline">
                  <input
                    type="checkbox"
                    checked={Boolean(item.isFragile)}
                    onChange={(event) => onItemChange(item.reviewId, "isFragile", event.target.checked)}
                  />
                </label>
              </td>
              <td>
                <label className="inventory-item-checkbox inline">
                  <input
                    type="checkbox"
                    checked={Boolean(item.isHighValue)}
                    onChange={(event) => onItemChange(item.reviewId, "isHighValue", event.target.checked)}
                  />
                </label>
              </td>
              <td>
                <button type="button" className="link-button" onClick={() => onDelete(item.reviewId)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
