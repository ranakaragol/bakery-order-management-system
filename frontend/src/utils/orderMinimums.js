import {
  MINIMUM_ORDER_WARNING_MESSAGE,
  getMinimumOrderRuleStatus
} from "../../../shared/deliveryZones.js";
import { formatCurrency } from "./formatters.js";

export const getRegionalOrderNotice = (deliveryAddress = {}, subtotal = 0, fallbackDeliveryFee = 0) => {
  const status = getMinimumOrderRuleStatus({
    province: deliveryAddress?.province,
    district: deliveryAddress?.district,
    subtotal,
    fallbackDeliveryFee
  });

  return {
    ...status,
    warningMessage: status.isBlocked ? MINIMUM_ORDER_WARNING_MESSAGE : "",
    shortfallMessage: status.isBlocked
      ? `Sipariş verebilmek için sepetinize ${formatCurrency(status.remainingAmount)} daha ürün eklemelisiniz.`
      : ""
  };
};
