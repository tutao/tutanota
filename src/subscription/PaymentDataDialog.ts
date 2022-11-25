import m from "mithril"
import stream from "mithril/stream"
import {Dialog} from "../gui/base/Dialog"
import {lang} from "../misc/LanguageViewModel"
import {getByAbbreviation} from "../api/common/CountryList"
import {PaymentMethodInput} from "./PaymentMethodInput"
import {updatePaymentData} from "./InvoiceAndPaymentDataPage"
import {px} from "../gui/size"
import {formatNameAndAddress} from "../misc/Formatter"
import {showProgressDialog} from "../gui/dialogs/ProgressDialog"
import {getClientType, PaymentMethodType} from "../api/common/TutanotaConstants"
import {assertNotNull, LazyLoaded, neverNull} from "@tutao/tutanota-utils"
import type {AccountingInfo, Customer} from "../api/entities/sys/TypeRefs.js"
import {createPaymentDataServiceGetData} from "../api/entities/sys/TypeRefs.js"
import {locator} from "../api/main/MainLocator"
import {PaymentDataService} from "../api/entities/sys/Services"
import {DropDownSelector} from "../gui/base/DropDownSelector.js"
import {asPaymentInterval} from "./PriceUtils.js"

/**
 * @returns {boolean} true if the payment data update was successful
 */
export function show(customer: Customer, accountingInfo: AccountingInfo, price: number): Promise<boolean> {
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
	const paymentMethodInput = new PaymentMethodInput(subscriptionOptions, stream(invoiceData.country), neverNull(accountingInfo), payPalRequestUrl)
	const availablePaymentMethods = paymentMethodInput.getVisiblePaymentMethods()

	let selectedPaymentMethod = accountingInfo.paymentMethod as PaymentMethodType
	paymentMethodInput.updatePaymentMethod(selectedPaymentMethod)
	const selectedPaymentMethodChangedHandler = async (value: PaymentMethodType) => {
		if (value === PaymentMethodType.Paypal && !payPalRequestUrl.isLoaded()) {
			await showProgressDialog("pleaseWait_msg", payPalRequestUrl.getAsync())
		}
		selectedPaymentMethod = value
		paymentMethodInput.updatePaymentMethod(value)
	}

	const didLinkPaypal = () => selectedPaymentMethod === PaymentMethodType.Paypal && paymentMethodInput.isPaypalAssigned()

	return new Promise(resolve => {

		const confirmAction = () => {
			let error = paymentMethodInput.validatePaymentData()

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
							paymentMethodInput.getPaymentData(),
							invoiceData.country,
							false,
							price + "",
							accountingInfo,
						),
					).then(finish)
				}
			}
		}

		const dialog = Dialog.showActionDialog({
			title: lang.get("adminPayment_action"),
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
								dropdownWidth: 250
							}),
							m(paymentMethodInput)
						],
					),
			},
			okAction: confirmAction,
			// if they've just gone through the process of linking a paypal account, don't offer a cancel button
			allowCancel: () => !didLinkPaypal(),
			okActionTextId: () => (didLinkPaypal() ? "close_alt" : "save_action"),
			cancelAction: () => resolve(false),
		})
	})
}

export function getLazyLoadedPayPalUrl(): LazyLoaded<string> {
	return new LazyLoaded(() => {
		const clientType = getClientType()
		return locator.serviceExecutor.get(PaymentDataService, createPaymentDataServiceGetData({
			clientType,
		})).then(result => {
			return result.loginUrl
		})
	})
}