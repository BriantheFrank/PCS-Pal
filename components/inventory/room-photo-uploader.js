export function RoomPhotoUploader({ roomName, disabled, onCapture, onUpload }) {
  return (
    <div className="room-photo-actions">
      <label className={`label-action room-photo-button ${disabled ? "is-disabled" : ""}`.trim()}>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          onChange={onCapture}
          disabled={disabled}
          hidden
        />
        Take room photos
      </label>
      <label className={`label-action secondary room-photo-button ${disabled ? "is-disabled" : ""}`.trim()}>
        <input type="file" accept="image/*" multiple onChange={onUpload} disabled={disabled} hidden />
        Upload saved photos
      </label>
      <p className="room-photo-guidance" id={`room-photo-guidance-${roomName}`}>
        Stand in corners and take 3–6 wide shots. Include closets or shelves if visible. JPEG/HEIC/PNG up to 8MB.
      </p>
    </div>
  );
}
