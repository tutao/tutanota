import type { PlanType } from "../../../entities/sys/Utils"
import type { SelectedSubscriptionOptions } from "./FeatureListProvider"
import type { InvoiceData } from "./utils/PaymentUtils"
import type { OfferPrice, PriceAndConfigProvider } from "./utils/PriceUtils"
import type { PaymentData } from "./utils/SubscriptionUtils"

export interface OrderConfirmationModel {
	options: SelectedSubscriptionOptions
	targetPlanType: PlanType
	invoiceData: InvoiceData
	paymentData: PaymentData
	planPrices?: PriceAndConfigProvider
	price: OfferPrice | null
	nextYearPrice: OfferPrice | null
}
