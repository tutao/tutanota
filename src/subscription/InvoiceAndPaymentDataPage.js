// @flow
import m from "mithril"
import {Dialog} from "../gui/base/Dialog"
import {lang} from "../misc/LanguageViewModel"
import type {WizardPage, WizardPageActionHandler} from "../gui/base/WizardDialog"
import type {UpgradeAccountTypeData} from "./UpgradeAccountTypeDialog"
import {InvoiceAndPaymentDataEditor} from "./InvoiceAndPaymentDataEditor"


export class InvoiceAndPaymentDataPage implements WizardPage<UpgradeAccountTypeData> {

	view: Function;
	updateWizardData: (UpgradeAccountTypeData)=>void;
	_pageActionHandler: WizardPageActionHandler<UpgradeAccountTypeData>;
	_upgradeData: UpgradeAccountTypeData;
	_invoiceAndPaymentDataEditor: InvoiceAndPaymentDataEditor;

	constructor(upgradeData: UpgradeAccountTypeData) {
		this.updateWizardData = (data: UpgradeAccountTypeData) => {
			this._upgradeData = data
			this._invoiceAndPaymentDataEditor = new InvoiceAndPaymentDataEditor(data.subscriptionOptions, data.invoiceData, data.paymentData)
		}

		this.updateWizardData(upgradeData)
		this.view = () => m("#upgrade-account-dialog.pt", [
			m("", m(this._invoiceAndPaymentDataEditor))
		])
	}


	nextAction(): Promise<?UpgradeAccountTypeData> {
		let error = this._invoiceAndPaymentDataEditor.validateInvoiceData() || this._invoiceAndPaymentDataEditor.validatePaymentData()
		if (error) {
			return Dialog.error(error).then(() => null)
		} else {
			this._upgradeData.invoiceData = this._invoiceAndPaymentDataEditor.getInvoiceData()
			this._upgradeData.paymentData = this._invoiceAndPaymentDataEditor.getPaymentData()
			return Promise.resolve(this._upgradeData)
		}
	}

	headerTitle(): string {
		return lang.get("adminPayment_action")
	}


	isNextAvailable() {
		return true
	}

	setPageActionHandler(handler: WizardPageActionHandler < UpgradeAccountTypeData >) {
		this._pageActionHandler = handler
	}

	getUncheckedWizardData(): UpgradeAccountTypeData {
		this._upgradeData.invoiceData = this._invoiceAndPaymentDataEditor.getInvoiceData()
		this._upgradeData.paymentData = this._invoiceAndPaymentDataEditor.getPaymentData()
		return this._upgradeData
	}

}