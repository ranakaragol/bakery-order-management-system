import { pasaliCategories, pasaliContactInfo, pasaliProducts } from "../data/pasaliCatalog";

export const fallbackCategories = pasaliCategories;
export const fallbackProducts = pasaliProducts;
export const fallbackContactInfo = pasaliContactInfo;

export const mergeSiteContent = (contactInfo) => ({
  ...fallbackContactInfo,
  ...(contactInfo || {}),
  aboutContent: {
    ...fallbackContactInfo.aboutContent,
    ...(contactInfo?.aboutContent || {})
  },
  paymentDetails: {
    ...fallbackContactInfo.paymentDetails,
    ...(contactInfo?.paymentDetails || {})
  },
  socialLinks: {
    ...fallbackContactInfo.socialLinks,
    ...(contactInfo?.socialLinks || {})
  }
});
