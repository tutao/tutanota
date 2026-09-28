import m from "mithril"
import stream from "mithril/stream"
import { Dialog, DialogType } from "../../../ui/base/Dialog"
import { assertNotNull, newPromise } from "@tutao/utils"
import { asPaymentInterval, formatPrice } from "./utils/PriceUtils"
import { getPaymentMethodType, UpgradeType } from "./utils/SubscriptionUtils"
import { formatNameAndAddress } from "../api/common/utils/CommonFormatter"
import { SimplifiedCreditCardViewModel } from "./SimplifiedCreditCardInputModel"
import { lang } from "../../../ui/utils/LanguageViewModel"
import { AccountingInfo, Customer } from "@tutao/entities/sys"
import { PaymentMethodType } from "../../../entities/sys/Utils"
import { getByAbbreviation } from "../gui/CountryList"
import { PaymentDetailsModel } from "./PaymentDetailsModel"
import { createWizard, WizardLayoutAttrs } from "../../../ui/base/wizard/Wizard"
import { Styles } from "../../../ui/styles"
import { px } from "../../../ui/size"

/**
 * @returns {boolean} true if the payment data update was successful
 */
export async function show(customer: Customer, accountingInfo: AccountingInfo, price: number, defaultPaymentMethod: PaymentMethodType): Promise<boolean> {
	const InvoiceAndPaymentDataPageNew = (await import("../signup/InvoiceAndPaymentDataPageNew")).default
	const viewModel: PaymentDetailsModel = {
		customer,
		accountingInfo: { ...accountingInfo },
		options: {
			businessUse: stream(assertNotNull(customer.businessUse)),
			paymentInterval: stream(asPaymentInterval(accountingInfo.paymentInterval)),
		},
		invoiceData: {
			invoiceAddress: formatNameAndAddress(accountingInfo.invoiceName, accountingInfo.invoiceAddress),
			country: accountingInfo.invoiceCountry ? getByAbbreviation(accountingInfo.invoiceCountry) : null,
			vatNumber: accountingInfo.invoiceVatIdNo,
		},
		paymentData: { paymentMethod: getPaymentMethodType(accountingInfo) ?? defaultPaymentMethod, creditCardData: null },
		price: { rawPrice: String(price), displayPrice: formatPrice(price, true) },
		upgradeType: UpgradeType.Switch,
		ccViewModel: new SimplifiedCreditCardViewModel(lang),
		updateInvoiceCountry(country) {
			this.invoiceData.country = country
			assertNotNull(this.accountingInfo).paypalBillingAgreement = null
		},
	}
	const Wizard = createWizard<PaymentDetailsModel>()
	const layout: m.Component<WizardLayoutAttrs<PaymentDetailsModel>> = {
		view: ({ children }) => m("#changePaymentDataDialog.full-width.center-h.pt-16", { style: { maxWidth: px(530) } }, children),
	}

	return newPromise((resolve) => {
		const dialog = Dialog.showActionDialog({
			title: "adminPayment_action",
			type: Styles.get().isMobileLayout() ? DialogType.EditLarge : DialogType.EditMedium,
			okAction: null,
			child: {
				view: () =>
					m(Wizard, {
						viewModel,
						layout,
						steps: [{ content: InvoiceAndPaymentDataPageNew, isBackButtonEnabled: () => false }],
						onComplete: () => {
							dialog.close()
							resolve(true)
						},
					}),
			},
			cancelActionTextId: "close_alt",
			cancelAction: () => resolve(false),
		})
	})
}
