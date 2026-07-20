const LoadingState = ({ message = "Yükleniyor...", compact = false }) => (
  <div
    className={`status-card ${compact ? "status-card--compact" : ""}`}
    role="status"
    aria-live="polite"
    aria-busy="true"
  >
    <p>{message}</p>
  </div>
);

export default LoadingState;
