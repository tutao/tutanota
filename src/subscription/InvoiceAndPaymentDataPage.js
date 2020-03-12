// @flow
import m from "mithril"
import {Dialog} from "../gui/base/Dialog"
import {lang} from "../misc/LanguageViewModel"
import type {UpgradeSubscriptionData} from "./UpgradeSubscriptionWizard"
import {InvoiceDataInput} from "./InvoiceDataInput"
import {PaymentMethodInput} from "./PaymentMethodInput"
import stream from "mithril/stream/stream.js"
import type {PaymentMethodTypeEnum} from "../api/common/TutanotaConstants"
import {PaymentDataResultType} from "../api/common/TutanotaConstants"
import {worker} from "../api/main/WorkerClient"
import {showProgressDialog} from "../gui/base/ProgressDialog"
import {getLazyLoadedPayPalUrl} from "./PaymentDataDialog"
import {logins} from "../api/main/LoginController"
import {client} from "../misc/ClientDetector"
import {AccountingInfoTypeRef} from "../api/entities/sys/AccountingInfo"
import {CustomerInfoTypeRef} from "../api/entities/sys/CustomerInfo"
import {neverNull} from "../api/common/utils/Utils"
import {load} from "../api/main/Entity"
import {CustomerTypeRef} from "../api/entities/sys/Customer"
import type {SubscriptionOptions} from "./SubscriptionUtils"
import {SubscriptionType, UpgradeType} from "./SubscriptionUtils"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import type {SegmentControlItem} from "../gui/base/SegmentControl"
import {SegmentControl} from "../gui/base/SegmentControl"
import type {WizardPageAttrs, WizardPageN} from "../gui/base/WizardDialogN"
import {emitWizardEvent, WizardEventType} from "../gui/base/WizardDialogN"

/**
 * Wizard page for editing invoice and payment data.
 */
export class InvoiceAndPaymentDataPage implements WizardPageN<UpgradeSubscriptionData> {
	_paymentMethodInput: PaymentMethodInput;
	_invoiceDataInput: InvoiceDataInput;
	_availablePaymentMethods: Array<SegmentControlItem<PaymentMethodTypeEnum>>;
	_selectedPaymentMethod: Stream<PaymentMethodTypeEnum>;

	constructor(upgradeData: UpgradeSubscriptionData) {
		this._selectedPaymentMethod = stream()
		this._selectedPaymentMethod.map((method) => this._paymentMethodInput.updatePaymentMethod(method))
	}

	onremove(vnode: Vnode<WizardPageAttrs<UpgradeSubscriptionData>>) {
		const data = vnode.attrs.data
		// TODO check if correct place to update these
		if (this._invoiceDataInput && this._paymentMethodInput) {
			data.invoiceData = this._invoiceDataInput.getInvoiceData()
			data.paymentData = this._paymentMethodInput.getPaymentData()
		}
	}

	oncreate(vnode: Vnode<WizardPageAttrs<UpgradeSubscriptionData>>) {
		const data = vnode.attrs.data
		// TODO check if correct place to update these
		if (this._invoiceDataInput && this._paymentMethodInput) {
			data.invoiceData = this._invoiceDataInput.getInvoiceData()
			data.paymentData = this._paymentMethodInput.getPaymentData()
		}
		let login = Promise.resolve()
		if (!logins.isUserLoggedIn()) {
			login = worker.createSession(neverNull(data.newAccountData).mailAddress, neverNull(data.newAccountData).password, client.getIdentifier(), false, true)
		}
		login.then(() => {
			if (!data.accountingInfo) {
				return load(CustomerTypeRef, neverNull(logins.getUserController().user.customer))
					.then(customer => load(CustomerInfoTypeRef, customer.customerInfo))
					.then(customerInfo => load(AccountingInfoTypeRef, customerInfo.accountingInfo).then(accountingInfo => {
						data.accountingInfo = accountingInfo
					}))
			}
		}).then(() => {
			this._invoiceDataInput = new InvoiceDataInput(data.options, data.invoiceData)
			let payPalRequestUrl = getLazyLoadedPayPalUrl()
			if (logins.isUserLoggedIn()) {
				payPalRequestUrl.getAsync()
			}
			this._paymentMethodInput = new PaymentMethodInput(data.options, this._invoiceDataInput.selectedCountry, neverNull(data.accountingInfo), payPalRequestUrl)
			this._availablePaymentMethods = this._paymentMethodInput.getVisiblePaymentMethods()
			this._selectedPaymentMethod(data.paymentData.paymentMethod)
			this._paymentMethodInput.updatePaymentMethod(data.paymentData.paymentMethod, data.paymentData)
		})
	}

	view(vnode: Vnode<WizardPageAttrs<UpgradeSubscriptionData>>) {
		const a = vnode.attrs
		const onNextClick = () => {
			let error = this._invoiceDataInput.validateInvoiceData() || this._paymentMethodInput.validatePaymentData()
			if (error) {
				return Dialog.error(error).then(() => null)
			} else {
				a.data.invoiceData = this._invoiceDataInput.getInvoiceData()
				a.data.paymentData = this._paymentMethodInput.getPaymentData()
				showProgressDialog("updatePaymentDataBusy_msg", updatePaymentData(a.data.options, a.data.invoiceData, a.data.paymentData, null,
					a.data.upgradeType === UpgradeType.Signup)
					.then(success => {
						if (success) {
							emitWizardEvent(vnode.dom, WizardEventType.SHOWNEXTPAGE)
						}
					}))
			}
		}
		return m("#upgrade-account-dialog.pt", this._availablePaymentMethods
			? [
				m(SegmentControl, {
					items: this._availablePaymentMethods,
					selectedValue: this._selectedPaymentMethod,
				}),
				m(".flex-space-around.flex-wrap.pt", [
					m(".flex-grow-shrink-half.plr-l", {style: {minWidth: "260px"}}, m(this._invoiceDataInput)),
					m(".flex-grow-shrink-half.plr-l", {style: {minWidth: "260px"}}, m(this._paymentMethodInput))
				]),
				m(".flex-center.full-width.pt-l", m("", {style: {width: "260px"}}, m(ButtonN, {
					label: "next_action",
					click: onNextClick,
					type: ButtonType.Login,
				})))
			]
			: null)
	}
}

export class InvoiceAndPaymentDataPageAttrs implements WizardPageAttrs<UpgradeSubscriptionData> {

	data: UpgradeSubscriptionData

	constructor(upgradeData: UpgradeSubscriptionData) {
		this.data = upgradeData
	}

	nextAction(showErrorDialog: boolean): Promise<boolean> {
		return Promise.resolve(true)
	}

	headerTitle(): string {
		return lang.get("adminPayment_action")
	}

	isSkipAvailable() {
		return false
	}

	isEnabled(): boolean {
		return this.data.type !== SubscriptionType.Free
	}

}

export function updatePaymentData(subscriptionOptions: SubscriptionOptions, invoiceData: InvoiceData, paymentData: ?PaymentData, confirmedCountry: ?Country, isSignup: boolean): Promise<boolean> {
	return worker.updatePaymentData(subscriptionOptions.businessUse(), subscriptionOptions.paymentInterval(), invoiceData, paymentData, confirmedCountry)
	             .then(paymentResult => {
		             const statusCode = paymentResult.result
		             if (statusCode === PaymentDataResultType.OK) {
			             return true;
		             } else {
			             if (statusCode === PaymentDataResultType.COUNTRY_MISMATCH) {
				             const countryName = invoiceData.country ? invoiceData.country.n : ""
				             const confirmMessage = lang.get("confirmCountry_msg", {"{1}": countryName})
				             return Dialog.confirm(() => confirmMessage).then(confirmed => {
					             if (confirmed) {
						             return updatePaymentData(subscriptionOptions, invoiceData, paymentData, invoiceData.country, isSignup)  // add confirmed invoice country
					             } else {
						             return false;
					             }
				             })
			             } else {
				             if (statusCode === PaymentDataResultType.INVALID_VATID_NUMBER) {
					             Dialog.error(() => lang.get("invalidVatIdNumber_msg") + ((isSignup) ? " "
						             + lang.get("accountWasStillCreated_msg") : ""))
				             } else if (statusCode === PaymentDataResultType.CREDIT_CARD_DECLINED) {
					             Dialog.error(() => lang.get("creditCardDeclined_msg") + ((isSignup) ? " "
						             + lang.get("accountWasStillCreated_msg") : ""))
				             } else if (statusCode === PaymentDataResultType.CREDIT_CARD_CVV_INVALID) {
					             Dialog.error("creditCardCVVInvalid_msg");
				             } else if (statusCode === PaymentDataResultType.PAYMENT_PROVIDER_NOT_AVAILABLE) {
					             Dialog.error(() => lang.get("paymentProviderNotAvailableError_msg") + ((isSignup) ? " "
						             + lang.get("accountWasStillCreated_msg") : ""))
				             } else if (statusCode === PaymentDataResultType.OTHER_PAYMENT_ACCOUNT_REJECTED) {
					             Dialog.error(() => lang.get("paymentAccountRejected_msg") + ((isSignup) ? " "
						             + lang.get("accountWasStillCreated_msg") : ""))
				             } else if (statusCode === PaymentDataResultType.CREDIT_CARD_DATE_INVALID) {
					             Dialog.error("creditCardExprationDateInvalid_msg");
				             } else if (statusCode === PaymentDataResultType.CREDIT_CARD_NUMBER_INVALID) {
					             Dialog.error(() => lang.get("creditCardNumberInvalid_msg") + ((isSignup) ? " "
						             + lang.get("accountWasStillCreated_msg") : ""))
				             } else if (statusCode === PaymentDataResultType.COULD_NOT_VERIFY_VATID) {
					             Dialog.error(() => lang.get("invalidVatIdValidationFailed_msg") + ((isSignup) ? " "
						             + lang.get("accountWasStillCreated_msg") : ""))
				             } else {
					             Dialog.error(() => lang.get("otherPaymentProviderError_msg") + ((isSignup) ? " "
						             + lang.get("accountWasStillCreated_msg") : ""))
				             }
				             return false
			             }
		             }
	             })
}
