export const sanitizeUser = (user) => ({
  id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  phone: user.phone,
  address: user.address,
  billingAddress: user.billingAddress,
  role: user.role,
  invoiceInfo: user.invoiceInfo,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});
