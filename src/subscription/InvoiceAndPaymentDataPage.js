// @flow
import m from "mithril"
import {Dialog} from "../gui/base/Dialog"
import {lang} from "../misc/LanguageViewModel"
import type {WizardPage, WizardPageActionHandler} from "../gui/base/WizardDialog"
import type {UpgradeSubscriptionData} from "./UpgradeSubscriptionWizard"
import {InvoiceDataInput} from "./InvoiceDataInput"
import {PaymentMethodInput} from "./PaymentMethodInput"
import type {SegmentControlItem} from "../gui/base/SegmentControl"
import {SegmentControl} from "../gui/base/SegmentControl"
import stream from "mithril/stream/stream.js"
import type {PaymentMethodTypeEnum} from "../api/common/TutanotaConstants"
import {PaymentDataResultType} from "../api/common/TutanotaConstants"
import {worker} from "../api/main/WorkerClient"
import {Button, ButtonType} from "../gui/base/Button"
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
import {SubscriptionType} from "./SubscriptionUtils"


/**
 * Wizard page for editing invoice and payment data.
 */
export class InvoiceAndPaymentDataPage implements WizardPage<UpgradeSubscriptionData> {

	view: Function;
	_pageActionHandler: WizardPageActionHandler<UpgradeSubscriptionData>;
	_upgradeData: UpgradeSubscriptionData;
	_paymentMethodInput: PaymentMethodInput;
	_invoiceDataInput: InvoiceDataInput;
	_availablePaymentMethods: Array<SegmentControlItem<PaymentMethodTypeEnum>>;
	_selectedPaymentMethod: Stream<SegmentControlItem<PaymentMethodTypeEnum>>;
	_paymentMethodSelector: SegmentControl<PaymentMethodTypeEnum>;

	constructor(upgradeData: UpgradeSubscriptionData) {
		this._selectedPaymentMethod = stream()
		this._upgradeData = upgradeData
		let nextButton = new Button("next_action", () => {
			let error = this._invoiceDataInput.validateInvoiceData() || this._paymentMethodInput.validatePaymentData()
			if (error) {
				return Dialog.error(error).then(() => null)
			} else {
				this._upgradeData.invoiceData = this._invoiceDataInput.getInvoiceData()
				this._upgradeData.paymentData = this._paymentMethodInput.getPaymentData()
				showProgressDialog("updatePaymentDataBusy_msg", updatePaymentData(this._upgradeData.options, this._upgradeData.invoiceData, this._upgradeData.paymentData, null)
					.then(success => {
						if (success) {
							this._pageActionHandler.showNext(this._upgradeData)
						}
					}))

			}
		}).setType(ButtonType.Login)


		this.view = () => m("#upgrade-account-dialog.pt", this._paymentMethodSelector
			? [
				m(this._paymentMethodSelector),
				m(".flex-space-around.flex-wrap.pt", [
					m(".flex-grow-shrink-half.plr-l", {style: {minWidth: "260px"}}, m(this._invoiceDataInput)),
					m(".flex-grow-shrink-half.plr-l", {style: {minWidth: "260px"}}, m(this._paymentMethodInput))
				]),
				m(".flex-center.full-width.pt-l", m("", {style: {width: "260px"}}, m(nextButton)))
			]
			: null)
	}

	nextAction(): Promise<?UpgradeSubscriptionData> {
		return Promise.resolve(null)
	}

	headerTitle(): string {
		return lang.get("adminPayment_action")
	}


	isNextAvailable() {
		return false
	}

	setPageActionHandler(handler: WizardPageActionHandler<UpgradeSubscriptionData>) {
		this._pageActionHandler = handler
	}

	getUncheckedWizardData(): UpgradeSubscriptionData {
		if (this._invoiceDataInput && this._paymentMethodInput) {
			this._upgradeData.invoiceData = this._invoiceDataInput.getInvoiceData()
			this._upgradeData.paymentData = this._paymentMethodInput.getPaymentData()
		}
		return this._upgradeData
	}

	updateWizardData(data: UpgradeSubscriptionData) {
		this._upgradeData = data
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
			this._paymentMethodInput = new PaymentMethodInput(data.options, this._invoiceDataInput.selectedCountry, data.accountingInfo, payPalRequestUrl)
			this._availablePaymentMethods = this._paymentMethodInput.getAvailablePaymentMethods()
			this._paymentMethodSelector = new SegmentControl(this._availablePaymentMethods, this._selectedPaymentMethod, 130)
				.setSelectionChangedHandler((selectedItem) => {
					this._selectedPaymentMethod(selectedItem)
					this._paymentMethodInput.updatePaymentMethod(selectedItem.value)
				})
			let initialItem = this._availablePaymentMethods.find(item => item.value === data.paymentData.paymentMethod) || this._availablePaymentMethods[0]
			this._selectedPaymentMethod(initialItem)
			this._paymentMethodInput.updatePaymentMethod(initialItem.value, data.paymentData)
		})
	}

	isEnabled(data: UpgradeSubscriptionData) {
		return data.type !== SubscriptionType.Free
	}

}


export function updatePaymentData(subscriptionOptions: SubscriptionOptions, invoiceData: InvoiceData, paymentData: ?PaymentData, confirmedCountry: ?Country): Promise<boolean> {
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
						             return updatePaymentData(subscriptionOptions, invoiceData, paymentData, invoiceData.country)  // add confirmed invoice country
					             } else {
						             return false;
					             }
				             })
			             } else {
				             if (statusCode === PaymentDataResultType.INVALID_VATID_NUMBER) {
					             Dialog.error("invalidVatIdNumber_msg")
				             } else if (statusCode === PaymentDataResultType.CREDIT_CARD_DECLINED) {
					             Dialog.error("creditCardNumberInvalid_msg");
				             } else if (statusCode === PaymentDataResultType.CREDIT_CARD_CVV_INVALID) {
					             Dialog.error("creditCardCVVInvalid_msg");
				             } else if (statusCode === PaymentDataResultType.PAYMENT_PROVIDER_NOT_AVAILABLE) {
					             Dialog.error("paymentProviderNotAvailable_msg");
				             } else if (statusCode === PaymentDataResultType.OTHER_PAYMENT_ACCOUNT_REJECTED) {
					             Dialog.error("paymentAccountRejected_msg");
				             } else if (statusCode === PaymentDataResultType.CREDIT_CARD_DATE_INVALID) {
					             Dialog.error("creditCardExprationDateInvalid_msg");
				             } else if (statusCode === PaymentDataResultType.CREDIT_CARD_NUMBER_INVALID) {
					             Dialog.error("creditCardNumberInvalid_msg");
				             } else if (statusCode === PaymentDataResultType.COULD_NOT_VERIFY_VATID) {
					             Dialog.error("invalidVatIdValidationFailed_msg");
				             } else {
					             Dialog.error("otherPaymentProviderError_msg");
				             }
				             return false
			             }
		             }
	             })
}