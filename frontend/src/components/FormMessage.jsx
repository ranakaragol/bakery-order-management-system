const messageTypeToClassName = {
  error: "error-text",
  success: "success-banner",
  info: "info-banner"
};

const messageTypeToRole = {
  error: "alert",
  success: "status",
  info: "status"
};

const FormMessage = ({ id, type = "error", message }) => {
  if (!message) {
    return null;
  }

  return (
    <div
      id={id}
      className={messageTypeToClassName[type] || "info-banner"}
      role={messageTypeToRole[type] || "status"}
      aria-live={type === "error" ? "assertive" : "polite"}
    >
      {message}
    </div>
  );
};

export default FormMessage;
