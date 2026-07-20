export const restoreAuthenticatedUser = async (apiClient) => {
  try {
    const { data } = await apiClient.get("/auth/me");

    return data?.user || null;
  } catch {
    return null;
  }
};
