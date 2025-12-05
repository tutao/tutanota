import m, { Children, Component, Vnode, VnodeDOM } from "mithril"
import { Dialog } from "../../gui/base/Dialog"
import { lang } from "../../misc/LanguageViewModel"
import { InvoiceDataInput, InvoiceDataInputLocation } from "../../subscription/InvoiceDataInput"
import stream from "mithril/stream"
import { AvailablePlanType, PaymentMethodType } from "../../api/common/TutanotaConstants"
import { showProgressDialog } from "../../gui/dialogs/ProgressDialog"
import { assertNotNull, neverNull } from "@tutao/tutanota-utils"
import { UpgradeType } from "../../subscription/utils/SubscriptionUtils"
import { locator } from "../../api/main/CommonLocator"
import { LoginButton } from "../../gui/base/buttons/LoginButton.js"
import { updatePaymentData, validateInvoiceData, validatePaymentData } from "../../subscription/utils/PaymentUtils"
import { SimplifiedCreditCardViewModel } from "../../subscription/SimplifiedCreditCardInputModel"
import { SignupViewModel } from "../SignupView"
import { WizardStepContext } from "../../gui/base/wizard/WizardController"
import { CreditCardInputForm } from "./CreditCardInputForm"

export interface InvoiceAndPaymentDataPageNewAttrs {
	ctx: WizardStepContext<SignupViewModel>
}
/**
 * Wizard page for editing invoice and payment data.
 */
export class InvoiceAndPaymentDataPageNew implements Component<WizardStepContext<SignupViewModel>> {
	private _invoiceDataInput: InvoiceDataInput | null = null
	private _hasClickedNext: boolean = false
	private ccViewModel: SimplifiedCreditCardViewModel
	private isCreditCardValid: stream<boolean> = stream(false)
	private ctx: WizardStepContext<SignupViewModel>

	constructor(vnode: Vnode<WizardStepContext<SignupViewModel>>) {
		this.ccViewModel = new SimplifiedCreditCardViewModel(lang)
		this.ctx = vnode.attrs
	}

	oncreate(vnode: VnodeDOM<WizardStepContext<SignupViewModel>>) {
		const data = vnode.attrs.viewModel

		if (!data.acceptedPlans.includes(data.targetPlanType as AvailablePlanType)) {
			throw new Error("Invalid plan is selected")
		}
		this._invoiceDataInput = new InvoiceDataInput(data.options.businessUse(), data.invoiceData, InvoiceDataInputLocation.InWizard)
		this.ccViewModel.setCreditCardData(data.paymentData.creditCardData)
		this.isCreditCardValid(!this.ccViewModel.validateCreditCardPaymentData())
		m.redraw()
	}

	view({ attrs: { viewModel: data } }: Vnode<WizardStepContext<SignupViewModel>>): Children {
		return m(
			".mt-16.mb-16.mlr-16",
			m(CreditCardInputForm, {
				viewModel: this.ccViewModel,
			}),
			m(
				".flex.justify-end",
				m(LoginButton, {
					width: "flex",
					label: "next_action",
					onclick: async () => {
						this.onAddPaymentData(data)
					},
					disabled: this.ccViewModel.validateCreditCardPaymentData() != null,
				}),
			),
		)
	}

	private onAddPaymentData = async (data: SignupViewModel) => {
		const invoiceDataInput = assertNotNull(this._invoiceDataInput)

		const error =
			validateInvoiceData({
				address: invoiceDataInput.getAddress(),
				isBusiness: data.options.businessUse(),
			}) ||
			validatePaymentData({
				country: invoiceDataInput.selectedCountry()!,
				isBusiness: data.options.businessUse(),
				paymentMethod: PaymentMethodType.CreditCard,
				accountingInfo: assertNotNull(data.accountingInfo),
			})

		if (error) {
			await Dialog.message(error)
			return
		}

		data.invoiceData = invoiceDataInput.getInvoiceData()
		data.paymentData = {
			paymentMethod: PaymentMethodType.CreditCard,
			creditCardData: this.ccViewModel.getCreditCardData(),
		}

		const progress = (async () => {
			const customer = neverNull(data.customer)
			const businessUse = data.options.businessUse()

			if (customer.businessUse !== businessUse) {
				customer.businessUse = businessUse
				await locator.entityClient.update(customer)
			}

			const success = await updatePaymentData(
				data.options.paymentInterval(),
				data.invoiceData,
				data.paymentData,
				null,
				data.upgradeType === UpgradeType.Signup,
				neverNull(data.price?.rawPrice),
				neverNull(data.accountingInfo),
			)

			if (success && !this._hasClickedNext) {
				this._hasClickedNext = true

				this.ctx.goNext()
			}
		})()

		void showProgressDialog("updatePaymentDataBusy_msg", progress)
	}
}
