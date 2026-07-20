import { Link } from "react-router-dom";

const EmptyState = ({ title, description, actionLabel, actionTo, action, compact = false }) => (
  <div className={`status-card ${compact ? "status-card--compact" : ""}`}>
    {title && <h2>{title}</h2>}
    {description && <p>{description}</p>}
    {actionTo && actionLabel && (
      <Link to={actionTo} className="primary-button">
        {actionLabel}
      </Link>
    )}
    {!actionTo && typeof action === "function" && actionLabel && (
      <button type="button" className="primary-button" onClick={action}>
        {actionLabel}
      </button>
    )}
  </div>
);

export default EmptyState;
