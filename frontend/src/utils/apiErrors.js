export const getApiErrorMessage = (error, fallbackMessage) => {
  const responseData = error?.response?.data;

  if (typeof responseData?.message === "string" && responseData.message.trim()) {
    return responseData.message;
  }

  if (Array.isArray(responseData?.errors) && responseData.errors.length > 0) {
    const firstError = responseData.errors.find((item) => item?.message);

    if (firstError?.message) {
      return firstError.message;
    }
  }

  if (!error?.response) {
    return "Sunucuya ulaşılamadı. Lütfen birkaç saniye sonra tekrar deneyin.";
  }

  return fallbackMessage;
};
