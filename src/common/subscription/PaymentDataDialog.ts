import m, { Children } from "mithril"
import stream from "mithril/stream"
import { Dialog } from "../gui/base/Dialog"
import { Country, getByAbbreviation } from "../api/common/CountryList"
import { updatePaymentData } from "./InvoiceAndPaymentDataPage"
import { px } from "../gui/size"
import { showProgressDialog } from "../gui/dialogs/ProgressDialog"
import { PaymentMethodType } from "../api/common/TutanotaConstants"
import { assertNotNull, LazyLoaded, neverNull, newPromise } from "@tutao/tutanota-utils"
import type { AccountingInfo, Customer } from "../api/entities/sys/TypeRefs.js"
import { DropDownSelector } from "../gui/base/DropDownSelector.js"
import { asPaymentInterval } from "./utils/PriceUtils.js"
import { getLazyLoadedPayPalUrl } from "./utils/SubscriptionUtils.js"
import { formatNameAndAddress } from "../api/common/utils/CommonFormatter.js"
import { SimplifiedCreditCardInput } from "./SimplifiedCreditCardInput"
import { SimplifiedCreditCardViewModel } from "./SimplifiedCreditCardInputModel"
import { lang } from "../misc/LanguageViewModel"
import { PaypalButton } from "./PaypalButton"
import { getVisiblePaymentMethods, isOnAccountAllowed, validatePaymentData } from "./utils/PaymentUtils"
import { MessageBox } from "../gui/base/MessageBox"

function renderCCInput(ccViewModel: SimplifiedCreditCardViewModel): Children {
	return m(SimplifiedCreditCardInput, { viewModel: ccViewModel })
}

function renderPaypalInput(
	paypalButtonData: {
		accountingInfo: AccountingInfo
	},
	payPalRequestUrl: LazyLoaded<string>,
): Children {
	return m(PaypalButton, {
		data: paypalButtonData,
		onclick: () => {
			if (payPalRequestUrl.isLoaded()) {
				window.open(payPalRequestUrl.getLoaded())
			} else {
				showProgressDialog("payPalRedirect_msg", payPalRequestUrl.getAsync()).then((url) => window.open(url))
			}
		},
	})
}

function renderInvoiceInput(country: Country | null, accountingInfo: AccountingInfo, isBusiness: boolean): Children {
	return m(
		".flex-center",
		m(
			MessageBox,
			{
				style: {
					marginTop: px(16),
				},
			},
			isOnAccountAllowed(country, accountingInfo, isBusiness)
				? lang.get("paymentMethodOnAccount_msg") + " " + lang.get("paymentProcessingTime_msg")
				: lang.get("paymentMethodNotAvailable_msg"),
		),
	)
}

function renderAccountBalanceInput(): Children {
	return m(
		".flex-center",
		m(
			MessageBox,
			{
				style: {
					marginTop: px(16),
				},
			},
			lang.get("paymentMethodAccountBalance_msg"),
		),
	)
}

/**
 * @returns {boolean} true if the payment data update was successful
 */
export async function show(customer: Customer, accountingInfo: AccountingInfo, price: number, defaultPaymentMethod: PaymentMethodType): Promise<boolean> {
	const paypalButtonData = { accountingInfo }
	const payPalRequestUrl = getLazyLoadedPayPalUrl()
	const invoiceData = {
		invoiceAddress: formatNameAndAddress(accountingInfo.invoiceName, accountingInfo.invoiceAddress),
		country: accountingInfo.invoiceCountry ? getByAbbreviation(accountingInfo.invoiceCountry) : null,
		vatNumber: accountingInfo.invoiceVatIdNo,
	}
	const subscriptionOptions = {
		businessUse: stream(assertNotNull(customer.businessUse)),
		paymentInterval: stream(asPaymentInterval(accountingInfo.paymentInterval)),
	}

	const availablePaymentMethods = getVisiblePaymentMethods({
		isBusiness: subscriptionOptions.businessUse(),
		isBankTransferAllowed: true,
		accountingInfo: neverNull(accountingInfo),
	})

	let selectedPaymentMethod = accountingInfo.paymentMethod as PaymentMethodType
	const selectedPaymentMethodChangedHandler = async (value: PaymentMethodType) => {
		if (value === PaymentMethodType.Paypal && !payPalRequestUrl.isLoaded()) {
			await showProgressDialog("pleaseWait_msg", payPalRequestUrl.getAsync())
		}
		selectedPaymentMethod = value
	}

	const didLinkPaypal = () => selectedPaymentMethod === PaymentMethodType.Paypal && paypalButtonData.accountingInfo.paypalBillingAgreement != null

	const ccViewModel = new SimplifiedCreditCardViewModel(lang)

	return newPromise((resolve) => {
		const confirmAction = () => {
			let error = validatePaymentData({
				paymentMethod: selectedPaymentMethod,
				country: invoiceData.country,
				accountingInfo: paypalButtonData.accountingInfo,
				isBusiness: subscriptionOptions.businessUse(),
			})

			if (error) {
				Dialog.message(error)
			} else {
				const finish = (success: boolean) => {
					if (success) {
						dialog.close()
						resolve(true)
					}
				}

				// updatePaymentData gets done when the big paypal button is clicked
				if (didLinkPaypal()) {
					finish(true)
				} else {
					showProgressDialog(
						"updatePaymentDataBusy_msg",
						updatePaymentData(
							subscriptionOptions.paymentInterval(),
							invoiceData,
							{
								paymentMethod: selectedPaymentMethod,
								creditCardData: selectedPaymentMethod === PaymentMethodType.CreditCard ? ccViewModel.getCreditCardData() : null,
							},
							invoiceData.country,
							false,
							price + "",
							accountingInfo,
						),
					).then(finish)
				}
			}
		}

		let renderInput = (): Children => {
			if (selectedPaymentMethod === PaymentMethodType.AccountBalance) {
				return renderAccountBalanceInput()
			} else if (selectedPaymentMethod === PaymentMethodType.Invoice) {
				return renderInvoiceInput(invoiceData.country, paypalButtonData.accountingInfo, subscriptionOptions.businessUse())
			} else if (selectedPaymentMethod === PaymentMethodType.Paypal) {
				return renderPaypalInput(paypalButtonData, payPalRequestUrl)
			} else {
				return renderCCInput(ccViewModel)
			}
		}

		const dialog = Dialog.showActionDialog({
			title: "adminPayment_action",
			child: {
				view: () =>
					m(
						"#changePaymentDataDialog",
						{
							style: {
								minHeight: px(310),
							},
						},
						[
							m(DropDownSelector, {
								label: "paymentMethod_label",
								items: availablePaymentMethods,
								selectedValue: selectedPaymentMethod,
								selectionChangedHandler: selectedPaymentMethodChangedHandler,
								dropdownWidth: 250,
							}),
							renderInput(),
						],
					),
			},
			okAction: confirmAction,
			// if they've just gone through the process of linking a paypal account, don't offer a cancel button
			allowCancel: () => !didLinkPaypal(),
			okActionTextId: didLinkPaypal() ? "close_alt" : "save_action",
			cancelAction: () => resolve(false),
		})
	})
}
