// @flow
import m from "mithril"
import stream from "mithril/stream/stream.js"
import {Dialog} from "../gui/base/Dialog"
import {lang} from "../misc/LanguageViewModel"
import {getByAbbreviation} from "../api/common/CountryList"
import {DropDownSelector} from "../gui/base/DropDownSelector"
import {PaymentMethodInput} from "./PaymentMethodInput"
import {updatePaymentData} from "./InvoiceAndPaymentDataPage"
import {px} from "../gui/size"
import {formatNameAndAddress} from "../misc/Formatter"
import {showProgressDialog} from "../gui/dialogs/ProgressDialog"
import {getClientType, getPaymentMethodType, PaymentMethodType} from "../api/common/TutanotaConstants"
import {LazyLoaded} from "@tutao/tutanota-utils"
import {serviceRequest} from "../api/main/Entity"
import {PaymentDataServiceGetReturnTypeRef} from "../api/entities/sys/PaymentDataServiceGetReturn"
import {SysService} from "../api/entities/sys/Services"
import {HttpMethod} from "../api/common/EntityFunctions"
import {neverNull} from "@tutao/tutanota-utils"
import type {AccountingInfo} from "../api/entities/sys/AccountingInfo"
import {createPaymentDataServiceGetData} from "../api/entities/sys/PaymentDataServiceGetData"
import type {Customer} from "../api/entities/sys/Customer"

/**
 * @returns {boolean} true if the payment data update was successful
 */
export function show(customer: Customer, accountingInfo: AccountingInfo, price: number): Promise<boolean> {
	let payPalRequestUrl = getLazyLoadedPayPalUrl()

	let invoiceData = {
		invoiceAddress: formatNameAndAddress(accountingInfo.invoiceName, accountingInfo.invoiceAddress),
		country: accountingInfo.invoiceCountry ? getByAbbreviation(accountingInfo.invoiceCountry) : null,
		vatNumber: accountingInfo.invoiceVatIdNo
	}

	const subscriptionOptions = {
		businessUse: stream(neverNull(customer.businessUse)),
		paymentInterval: stream(Number(accountingInfo.paymentInterval)),
	}

	const paymentMethodInput = new PaymentMethodInput(subscriptionOptions, stream(invoiceData.country), neverNull(accountingInfo), payPalRequestUrl)
	const availablePaymentMethods = paymentMethodInput.getVisiblePaymentMethods()

	const paymentMethod = getPaymentMethodType(accountingInfo)
	const selectedPaymentMethod = stream(paymentMethod)
	paymentMethodInput.updatePaymentMethod(paymentMethod)

	const paymentMethodSelector = new DropDownSelector("paymentMethod_label",
		null,
		availablePaymentMethods,
		selectedPaymentMethod,
		250)

	paymentMethodSelector.setSelectionChangedHandler(value => {
		if (value === PaymentMethodType.Paypal && !payPalRequestUrl.isLoaded()) {
			showProgressDialog("pleaseWait_msg", payPalRequestUrl.getAsync().then(() => {
				selectedPaymentMethod(value)
				paymentMethodInput.updatePaymentMethod(value)
			}))
		} else {
			selectedPaymentMethod(value)
			paymentMethodInput.updatePaymentMethod(value)
		}

	})


	return new Promise(resolve => {
		const didLinkPaypal = () => selectedPaymentMethod() === PaymentMethodType.Paypal && paymentMethodInput.isPaypalAssigned()
		const confirmAction = () => {
			let error = paymentMethodInput.validatePaymentData()
			if (error) {
				Dialog.error(error)
			} else {
				const finish = success => {
					if (success) {
						dialog.close()
						resolve(true)
					}
				}
				// updatePaymentData gets done when the big paypal button is clicked
				if (didLinkPaypal()) {
					finish(true)
				} else {
					showProgressDialog("updatePaymentDataBusy_msg",
						updatePaymentData(
							subscriptionOptions.paymentInterval(),
							invoiceData,
							paymentMethodInput.getPaymentData(),
							invoiceData.country,
							false,
							price + "",
							accountingInfo))
						.then(finish)
				}
			}
		}

		const dialog = Dialog.showActionDialog({
			title: lang.get("adminPayment_action"),
			child: {
				view: () => m("#changePaymentDataDialog", {style: {minHeight: px(310)}}, [
					m(paymentMethodSelector),
					m(paymentMethodInput),
				])
			},
			okAction: confirmAction,
			// if they've just gone through the process of linking a paypal account, don't offer a cancel button
			allowCancel: () => !didLinkPaypal(),
			okActionTextId: () => didLinkPaypal() ? "close_alt" : "save_action",
			cancelAction: () => resolve(false)
		})
	})
}

export function getLazyLoadedPayPalUrl(): LazyLoaded<string> {
	return new LazyLoaded(() => {
		const clientType = getClientType()
		return serviceRequest(SysService.PaymentDataService, HttpMethod.GET, createPaymentDataServiceGetData({clientType}), PaymentDataServiceGetReturnTypeRef)
			.then((result) => {
				return result.loginUrl
			})
	}, null)
}
