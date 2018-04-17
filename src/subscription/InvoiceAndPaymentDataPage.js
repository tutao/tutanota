// @flow
import m from "mithril"
import {Dialog} from "../gui/base/Dialog"
import {lang} from "../misc/LanguageViewModel"
import type {WizardPage, WizardPageActionHandler} from "../gui/base/WizardDialog"
import type {UpgradeAccountTypeData} from "./UpgradeAccountTypeDialog"
import {InvoiceDataInput} from "./InvoiceDataInput"
import {PaymentMethodInput} from "./PaymentMethodInput"
import type {SegmentControlItem} from "../gui/base/SegmentControl"
import {SegmentControl} from "../gui/base/SegmentControl"
import stream from "mithril/stream/stream.js"
import type {PaymentMethodTypeEnum} from "../api/common/TutanotaConstants"
import {PaymentDataResultType} from "../api/common/TutanotaConstants"
import {worker} from "../api/main/WorkerClient"
import {Button, ButtonType} from "../gui/base/Button"

/**
 * Wizard page for editing invoice and payment data.
 */
export class InvoiceAndPaymentDataPage implements WizardPage<UpgradeAccountTypeData> {

	view: Function;
	updateWizardData: (UpgradeAccountTypeData)=>void;
	_pageActionHandler: WizardPageActionHandler<UpgradeAccountTypeData>;
	_upgradeData: UpgradeAccountTypeData;
	_paymentMethodInput: PaymentMethodInput;
	_invoiceDataInput: InvoiceDataInput;
	_availablePaymentMethods: Array<SegmentControlItem<PaymentMethodTypeEnum>>;
	_selectedPaymentMethod: stream<SegmentControlItem<PaymentMethodTypeEnum>>;
	_paymentMethodSelector: SegmentControl<PaymentMethodTypeEnum>;

	constructor(upgradeData: UpgradeAccountTypeData) {
		this._selectedPaymentMethod = stream(null)
		this.updateWizardData = (data: UpgradeAccountTypeData) => {
			this._upgradeData = data
			this._invoiceDataInput = new InvoiceDataInput(upgradeData.subscriptionOptions, upgradeData.invoiceData)
			this._paymentMethodInput = new PaymentMethodInput(upgradeData.subscriptionOptions, this._invoiceDataInput.selectedCountry, data.accountingInfo)
			this._availablePaymentMethods = this._paymentMethodInput.getAvailablePaymentMethods()
			this._paymentMethodSelector = new SegmentControl(this._availablePaymentMethods, this._selectedPaymentMethod, 130)
				.setSelectionChangedHandler((selectedItem) => {
					this._selectedPaymentMethod(selectedItem)
					this._paymentMethodInput.updatePaymentMethod(selectedItem.value)
				})
			let initialItem = this._availablePaymentMethods.find(item => item.value == upgradeData.paymentData.paymentMethod) || this._availablePaymentMethods[0]
			this._selectedPaymentMethod(initialItem)
			this._paymentMethodInput.updatePaymentMethod(initialItem.value, data.paymentData)
		}
		this.updateWizardData(upgradeData)


		let nextButton = new Button("next_action", () => {
			let error = this._invoiceDataInput.validateInvoiceData() || this._paymentMethodInput.validatePaymentData()
			if (error) {
				return Dialog.error(error).then(() => null)
			} else {
				this._upgradeData.invoiceData = this._invoiceDataInput.getInvoiceData()
				this._upgradeData.paymentData = this._paymentMethodInput.getPaymentData()
				this._pageActionHandler.showNext(this._upgradeData)
			}
		}).setType(ButtonType.Login)


		this.view = () => m("#upgrade-account-dialog.pt", [
			m(this._paymentMethodSelector),
			m(".flex-space-around.flex-wrap.pt", [
				m(".flex-grow-shrink-half.plr-l", {style: {minWidth: "260px"}}, m(this._invoiceDataInput)),
				m(".flex-grow-shrink-half.plr-l", {style: {minWidth: "260px"}}, m(this._paymentMethodInput))
			]),
			m(".flex-center.full-width.pt-l", m("", {style: {width: "260px"}}, m(nextButton)))
		])
	}

	nextAction(): Promise<?UpgradeAccountTypeData> {
		return Promise.resolve(null)
	}

	headerTitle(): string {
		return lang.get("adminPayment_action")
	}


	isNextAvailable() {
		return false
	}

	setPageActionHandler(handler: WizardPageActionHandler < UpgradeAccountTypeData >) {
		this._pageActionHandler = handler
	}

	getUncheckedWizardData(): UpgradeAccountTypeData {
		this._upgradeData.invoiceData = this._invoiceDataInput.getInvoiceData()
		this._upgradeData.paymentData = this._paymentMethodInput.getPaymentData()
		return this._upgradeData
	}

}


export function updatePaymentData(subscriptionOptions: SubscriptionOptions, invoiceData: InvoiceData, paymentData: ?PaymentData, confirmedCountry: ?Country): Promise<boolean> {
	return worker.updatePaymentData(subscriptionOptions, invoiceData, paymentData, confirmedCountry).then(paymentResult => {
		const statusCode = paymentResult.result
		if (statusCode == PaymentDataResultType.OK) {
			return true;
		} else {
			if (statusCode == PaymentDataResultType.COUNTRY_MISMATCH) {
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
				if (statusCode == PaymentDataResultType.INVALID_VATID_NUMBER) {
					Dialog.error("invalidVatIdNumber_msg")
				} else if (statusCode == PaymentDataResultType.CREDIT_CARD_DECLINED) {
					Dialog.error("creditCardNumberInvalid_msg");
				} else if (statusCode == PaymentDataResultType.CREDIT_CARD_CVV_INVALID) {
					Dialog.error("creditCardCVVInvalid_msg");
				} else if (statusCode == PaymentDataResultType.PAYMENT_PROVIDER_NOT_AVAILABLE) {
					Dialog.error("paymentProviderNotAvailable_msg");
				} else if (statusCode == PaymentDataResultType.OTHER_PAYMENT_ACCOUNT_REJECTED) {
					Dialog.error("paymentAccountRejected_msg");
				} else {
					Dialog.error("otherPaymentProviderError_msg");
				}
				return false
			}
		}
	})
}