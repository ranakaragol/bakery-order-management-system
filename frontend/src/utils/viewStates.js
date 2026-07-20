export const getCollectionViewState = ({ items = [], isLoading = false, errorMessage = "" } = {}) => {
  const normalizedItems = Array.isArray(items) ? items : [];
  const hasItems = normalizedItems.length > 0;

  return {
    hasItems,
    showLoading: isLoading && !hasItems,
    showRefreshing: isLoading && hasItems,
    showError: Boolean(errorMessage) && !hasItems,
    showEmpty: !isLoading && !errorMessage && !hasItems
  };
};
