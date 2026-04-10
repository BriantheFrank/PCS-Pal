const formatDate = (value) => {
  if (!value) {
    return "";
  }

  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  } catch (_error) {
    return "";
  }
};

export function RoomPhotoGrid({ photos, roomName, onDelete }) {
  if (!photos.length) {
    return (
      <p className="inventory-empty">
        No room photos saved yet for {roomName}. Use the buttons above to take or upload photos.
      </p>
    );
  }

  return (
    <ul className="room-photo-grid">
      {photos.map((photo) => (
        <li className="room-photo-card" key={photo.id}>
          <img
            src={photo.thumbnailDataUrl || photo.originalDataUrl}
            alt={`${roomName} photo`}
            loading="lazy"
          />
          <div className="room-photo-card-meta">
            <span className="room-photo-status" data-status={photo.status || "saved-local"}>
              {photo.status === "saved-local" ? "Saved locally" : "Local"}
            </span>
            {formatDate(photo.createdAt) ? <span>{formatDate(photo.createdAt)}</span> : null}
          </div>
          <button type="button" className="link-button room-photo-delete" onClick={() => onDelete(photo.id)}>
            Remove from device
          </button>
        </li>
      ))}
    </ul>
  );
}
