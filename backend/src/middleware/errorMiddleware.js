import { buildErrorResponse, sendError } from "../utils/apiResponses.js";

const duplicateFieldMessages = {
  email: "Bu e-posta adresi zaten kullanımda.",
  name: "Bu isim zaten kullanımda.",
  slug: "Bu slug zaten kullanımda."
};

const resolveDuplicateField = (error) =>
  Object.keys(error?.keyPattern || {})[0] || Object.keys(error?.keyValue || {})[0] || "";

export const notFound = (req, res) => {
  sendError(res, 404, {
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
};

export const errorHandler = (error, req, res, _next) => {
  if (error?.code === 11000) {
    const field = resolveDuplicateField(error);

    return sendError(res, 409, {
      message: duplicateFieldMessages[field] || "Bu değer zaten kullanımda.",
      field
    });
  }

  if (error?.name === "ValidationError") {
    return sendError(res, 400, {
      message: "Validation failed.",
      errors: Object.values(error.errors || {}).map((validationError) => ({
        field: validationError.path,
        message: validationError.message
      }))
    });
  }

  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  const isProduction = process.env.NODE_ENV === "production";

  return res.status(statusCode).json(
    buildErrorResponse({
      message: statusCode === 500 && isProduction ? "Unexpected server error." : error.message || "Unexpected server error.",
      ...(isProduction || !error?.stack
        ? {}
        : {
            errors: [
              {
                message: error.stack
              }
            ]
          })
    })
  );
};
