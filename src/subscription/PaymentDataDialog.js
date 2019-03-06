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
import {showProgressDialog} from "../gui/base/ProgressDialog"
import type {PaymentMethodTypeEnum} from "../api/common/TutanotaConstants"
import {PaymentMethodType} from "../api/common/TutanotaConstants"
import {neverNull} from "../api/common/utils/Utils"
import {LazyLoaded} from "../api/common/utils/LazyLoaded"
import {serviceRequest} from "../api/main/Entity"
import {PaymentDataServiceGetReturnTypeRef} from "../api/entities/sys/PaymentDataServiceGetReturn"
import {SysService} from "../api/entities/sys/Services"
import {HttpMethod} from "../api/common/EntityFunctions"

/**
 * @returns {boolean} true if the payment data update was successful
 */
export function show(accountingInfo: AccountingInfo): Promise<boolean> {
	let payPalRequestUrl = getLazyLoadedPayPalUrl()

	let invoiceData = {
		invoiceAddress: formatNameAndAddress(accountingInfo.invoiceName, accountingInfo.invoiceAddress),
		country: accountingInfo.invoiceCountry ? getByAbbreviation(accountingInfo.invoiceCountry) : null,
		vatNumber: accountingInfo.invoiceVatIdNo
	}

	const subscriptionOptions = {
		businessUse: stream(accountingInfo.business),
		paymentInterval: stream(Number(accountingInfo.paymentInterval)),
	}

	const paymentMethodInput = new PaymentMethodInput(subscriptionOptions, stream(invoiceData.country), accountingInfo, payPalRequestUrl)
	const availablePaymentMethods = paymentMethodInput.getAvailablePaymentMethods()

	const paymentMethod = neverNull(accountingInfo.paymentMethod)
	const selectedPaymentMethod: Stream<PaymentMethodTypeEnum> = stream(paymentMethod)
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


	return Promise.fromCallback(cb => {
		const confirmAction = () => {
			let error = paymentMethodInput.validatePaymentData()
			if (error) {
				Dialog.error(error)
			} else {
				showProgressDialog("updatePaymentDataBusy_msg", updatePaymentData(subscriptionOptions, invoiceData, paymentMethodInput.getPaymentData(), invoiceData.country))
					.then(success => {
						if (success) {
							dialog.close()
							cb(null, true)
						}
					})
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
			allowCancel: true,
			okActionTextId: "save_action",
			cancelAction: () => cb(null, false)
		})
	})
}

export function getLazyLoadedPayPalUrl(): LazyLoaded<string> {
	return new LazyLoaded(() => {
		return serviceRequest(SysService.PaymentDataService, HttpMethod.GET, null, PaymentDataServiceGetReturnTypeRef)
			.then((result) => {
				return result.loginUrl
			})
	}, null)
}