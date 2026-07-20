const ErrorState = ({ message, onRetry, retryLabel = "Tekrar Dene", compact = false }) => (
  <div className={`status-card status-card--error ${compact ? "status-card--compact" : ""}`} role="alert">
    <p>{message}</p>
    {typeof onRetry === "function" && (
      <button type="button" className="ghost-button" onClick={onRetry}>
        {retryLabel}
      </button>
    )}
  </div>
);

export default ErrorState;
