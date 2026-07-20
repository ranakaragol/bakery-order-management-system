import Category from "../models/Category.js";

export const buildCategoryVisibilityQuery = ({ includeInactive = false } = {}) =>
  includeInactive ? {} : { isActive: { $ne: false } };

export const getVisibleCategoryIds = async ({ includeInactive = false } = {}) => {
  const categories = await Category.find(buildCategoryVisibilityQuery({ includeInactive })).select("_id");
  return categories.map((category) => category._id);
};

export const isProductCategoryVisible = (category, { includeInactive = false } = {}) =>
  includeInactive || !category || category.isActive !== false;
