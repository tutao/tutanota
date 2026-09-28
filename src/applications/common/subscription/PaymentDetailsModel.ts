import type { AccountingInfo, Customer } from "@tutao/entities/sys"
import type { Country } from "../gui/CountryList"
import type { SelectedSubscriptionOptions } from "./FeatureListProvider"
import type { SimplifiedCreditCardViewModel } from "./SimplifiedCreditCardInputModel"
import type { InvoiceData } from "./utils/PaymentUtils"
import type { OfferPrice } from "./utils/PriceUtils"
import type { PaymentData, UpgradeType } from "./utils/SubscriptionUtils"

export interface PaymentDetailsModel {
	options: SelectedSubscriptionOptions
	invoiceData: InvoiceData
	paymentData: PaymentData
	accountingInfo: AccountingInfo | null
	customer: Customer | null
	price: OfferPrice | null
	upgradeType: UpgradeType
	firstMonthForFreeOfferActive?: boolean
	ccViewModel: SimplifiedCreditCardViewModel
	updateInvoiceCountry(country: Country): void
}
