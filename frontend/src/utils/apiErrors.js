export const getApiValidationMessages = (error) =>
  Array.isArray(error?.response?.data?.errors)
    ? error.response.data.errors.map((item) => item?.message).filter(Boolean)
    : [];

export const getApiFieldErrors = (error) => {
  const responseData = error?.response?.data;
  const fieldErrors = {};

  if (responseData?.field && typeof responseData?.message === "string" && responseData.message.trim()) {
    fieldErrors[responseData.field] = responseData.message;
  }

  if (Array.isArray(responseData?.errors)) {
    responseData.errors.forEach((item) => {
      const field = String(item?.field || "").trim();
      const message = String(item?.message || "").trim();

      if (field && message && !fieldErrors[field]) {
        fieldErrors[field] = message;
      }
    });
  }

  return fieldErrors;
};

export const getFieldErrorMessage = (fieldErrors = {}, fieldName = "") => fieldErrors[fieldName] || "";

export const getApiErrorMessage = (error, fallbackMessage) => {
  const responseData = error?.response?.data;

  if (typeof responseData?.message === "string" && responseData.message.trim()) {
    return responseData.message;
  }

  const validationMessages = getApiValidationMessages(error);

  if (validationMessages.length > 0) {
    const [firstError] = validationMessages;

    return firstError;
  }

  if (!error?.response) {
    return "Sunucuya ulaşılamadı. Lütfen birkaç saniye sonra tekrar deneyin.";
  }

  return fallbackMessage;
};
