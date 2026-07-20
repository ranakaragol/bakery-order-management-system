export const buildErrorResponse = ({ message, errors, field, code, ...rest } = {}) => ({
  success: false,
  message: message || "Beklenmeyen bir hata oluştu.",
  ...rest,
  ...(field ? { field } : {}),
  ...(code ? { code } : {}),
  ...(Array.isArray(errors) && errors.length ? { errors } : {})
});

export const sendError = (res, statusCode, payload = {}) =>
  res.status(statusCode).json(buildErrorResponse(payload));
