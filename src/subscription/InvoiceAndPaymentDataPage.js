// @flow
import m from "mithril"
import {Dialog, DialogType} from "../gui/base/Dialog"
import {lang} from "../misc/LanguageViewModel"
import type {UpgradeSubscriptionData} from "./UpgradeSubscriptionWizard"
import {InvoiceDataInput} from "./InvoiceDataInput"
import {PaymentMethodInput} from "./PaymentMethodInput"
import stream from "mithril/stream/stream.js"
import type {InvoiceData, PaymentData, PaymentMethodTypeEnum} from "../api/common/TutanotaConstants"
import {getClientType, Keys, PaymentDataResultType} from "../api/common/TutanotaConstants"
import {showProgressDialog} from "../gui/dialogs/ProgressDialog"
import {getLazyLoadedPayPalUrl} from "./PaymentDataDialog"
import {logins, SessionType} from "../api/main/LoginController"
import type {AccountingInfo} from "../api/entities/sys/AccountingInfo"
import {AccountingInfoTypeRef} from "../api/entities/sys/AccountingInfo"
import {CustomerInfoTypeRef} from "../api/entities/sys/CustomerInfo"
import {neverNull, noOp} from "@tutao/tutanota-utils"
import {load, update} from "../api/main/Entity"
import {CustomerTypeRef} from "../api/entities/sys/Customer"
import {getPreconditionFailedPaymentMsg, SubscriptionType, UpgradeType} from "./SubscriptionUtils"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import type {SegmentControlItem} from "../gui/base/SegmentControl"
import {SegmentControl} from "../gui/base/SegmentControl"
import type {WizardPageAttrs, WizardPageN} from "../gui/base/WizardDialogN"
import {emitWizardEvent, WizardEventType} from "../gui/base/WizardDialogN"
import type {Country} from "../api/common/CountryList"
import {DefaultAnimationTime} from "../gui/animation/Animations"
import type {Braintree3ds2Request} from "../api/entities/sys/Braintree3ds2Request"
import {isUpdateForTypeRef} from "../api/main/EventController"
import {locator} from "../api/main/MainLocator"
import {getPaymentWebRoot} from "../api/common/Env"
import {InvoiceInfoTypeRef} from "../api/entities/sys/InvoiceInfo"
import {promiseMap} from "@tutao/tutanota-utils"

/**
 * Wizard page for editing invoice and payment data.
 */
export class InvoiceAndPaymentDataPage implements WizardPageN<UpgradeSubscriptionData> {
	_paymentMethodInput: PaymentMethodInput;
	_invoiceDataInput: InvoiceDataInput;
	_availablePaymentMethods: Array<SegmentControlItem<PaymentMethodTypeEnum>>;
	_selectedPaymentMethod: Stream<PaymentMethodTypeEnum>;
	_upgradeData: UpgradeSubscriptionData;

	constructor(upgradeData: UpgradeSubscriptionData) {
		this._upgradeData = upgradeData
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
			login = logins.createSession(neverNull(data.newAccountData).mailAddress, neverNull(data.newAccountData).password, SessionType.Temporary)
		}
		login.then(() => {
			if (!data.accountingInfo || !data.customer) {
				return load(CustomerTypeRef, neverNull(logins.getUserController().user.customer))
					.then(customer => {
						data.customer = customer
						return load(CustomerInfoTypeRef, customer.customerInfo)
					})
					.then(customerInfo => load(AccountingInfoTypeRef, customerInfo.accountingInfo).then(accountingInfo => {
						data.accountingInfo = accountingInfo
					}))
			}
		}).then(() => {
			this._invoiceDataInput = new InvoiceDataInput(data.options.businessUse(), data.invoiceData)
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

	view(vnode: Vnode<WizardPageAttrs<UpgradeSubscriptionData>>): Children {
		const a = vnode.attrs
		const onNextClick = () => {
			let error = this._invoiceDataInput.validateInvoiceData() || this._paymentMethodInput.validatePaymentData()
			if (error) {
				return Dialog.error(error).then(() => null)
			} else {
				a.data.invoiceData = this._invoiceDataInput.getInvoiceData()
				a.data.paymentData = this._paymentMethodInput.getPaymentData()
				showProgressDialog("updatePaymentDataBusy_msg", Promise.resolve().then(() => {
					let customer = neverNull(a.data.customer)
					if (customer.businessUse !== a.data.options.businessUse()) {
						customer.businessUse = a.data.options.businessUse()
						return update(customer)
					}
				}).then(() => updatePaymentData(a.data.options.paymentInterval(), a.data.invoiceData, a.data.paymentData, null,
					a.data.upgradeType === UpgradeType.Signup, a.data.price, neverNull(a.data.accountingInfo))
					.then(success => {
						if (success) {
							emitWizardEvent(vnode.dom, WizardEventType.SHOWNEXTPAGE)
						}
					})))
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

	isSkipAvailable(): boolean {
		return false
	}

	isEnabled(): boolean {
		return this.data.type !== SubscriptionType.Free
	}
}

export function updatePaymentData(
	paymentInterval: number, invoiceData: InvoiceData, paymentData: ?PaymentData, confirmedCountry: ?Country,
	isSignup: boolean, price: string, accountingInfo: AccountingInfo
): Promise<boolean> {
	return locator.customerFacade.updatePaymentData(paymentInterval, invoiceData, paymentData, confirmedCountry)
	             .then(paymentResult => {
		             const statusCode = paymentResult.result
		             if (statusCode === PaymentDataResultType.OK) {
			             // show dialog
			             let braintree3ds = paymentResult.braintree3dsRequest
			             if (braintree3ds) {
				             return verifyCreditCard(accountingInfo, braintree3ds, price)
			             } else {
				             return true
			             }
		             } else {
			             if (statusCode === PaymentDataResultType.COUNTRY_MISMATCH) {
				             const countryName = invoiceData.country ? invoiceData.country.n : ""
				             const confirmMessage = lang.get("confirmCountry_msg", {"{1}": countryName})
				             return Dialog.confirm(() => confirmMessage).then(confirmed => {
					             if (confirmed) {
						             return updatePaymentData(paymentInterval, invoiceData, paymentData, invoiceData.country, isSignup, price, accountingInfo)  // add confirmed invoice country
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
				             } else if (statusCode === PaymentDataResultType.CREDIT_CARD_VERIFICATION_LIMIT_REACHED) {
					             Dialog.error(() => lang.get("creditCardVerificationLimitReached_msg") + ((isSignup) ? " "
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


/**
 * Displays a progress dialog that allows to cancel the verification and opens a new window to do the actual verification with the bank.
 */
function verifyCreditCard(accountingInfo: AccountingInfo, braintree3ds: Braintree3ds2Request, price: string): Promise<boolean> {
	return locator.entityClient.load(InvoiceInfoTypeRef, neverNull(accountingInfo.invoiceInfo)).then(invoiceInfo => {
		let invoiceInfoWrapper = {invoiceInfo}

		let resolve: (boolean)=>void;
		let progressDialogPromise: Promise<boolean> = new Promise((res) => resolve = res);
		let progressDialog: Dialog
		const closeAction = () => {
			// user did not complete the 3ds dialog and PaymentDataService.POST was not invoked
			progressDialog.close()
			setTimeout(() => resolve(false), DefaultAnimationTime)
		}

		progressDialog = new Dialog(DialogType.Alert, {
			view: () => [
				m(".dialog-contentButtonsBottom.text-break.selectable", lang.get("creditCardPendingVerification_msg")),
				m(".flex-center.dialog-buttons", m(ButtonN, {
					label: "cancel_action",
					click: closeAction,
					type: ButtonType.Primary,
				}))
			]
		}).setCloseHandler(closeAction)
		  .addShortcut({
			  key: Keys.RETURN,
			  shift: false,
			  exec: closeAction,
			  help: "close_alt"
		  })
		  .addShortcut({
			  key: Keys.ESC,
			  shift: false,
			  exec: closeAction,
			  help: "close_alt"
		  })

		let entityEventListener = (updates) => {
			return promiseMap(updates, update => {
				if (isUpdateForTypeRef(InvoiceInfoTypeRef, update)) {
					return locator.entityClient.load(InvoiceInfoTypeRef, update.instanceId).then(invoiceInfo => {
						invoiceInfoWrapper.invoiceInfo = invoiceInfo
						if (!invoiceInfo.paymentErrorInfo) {
							// user successfully verified the card
							progressDialog.close()
							resolve(true)
						} else if (invoiceInfo.paymentErrorInfo && invoiceInfo.paymentErrorInfo.errorCode === "card.3ds2_pending") {
							// keep waiting. this error code is set before starting the 3DS2 verification and we just received the event very late
						} else if (invoiceInfo.paymentErrorInfo && (invoiceInfo.paymentErrorInfo.errorCode !== null)) {
							// verification error during 3ds verification
							Dialog.error(getPreconditionFailedPaymentMsg(invoiceInfo.paymentErrorInfo.errorCode))
							resolve(false)
							progressDialog.close()
						}
						m.redraw()
					})
				}
			}).then(noOp)
		}
		locator.eventController.addEntityListener(entityEventListener)
		let params = `clientToken=${encodeURIComponent(braintree3ds.clientToken)}&nonce=${encodeURIComponent(braintree3ds.nonce)}&bin=${encodeURIComponent(braintree3ds.bin)}&price=${encodeURIComponent(price)}&message=${encodeURIComponent(lang.get("creditCardVerification_msg"))}&clientType=${getClientType()}`
		Dialog.error("creditCardVerificationNeededPopup_msg")
		      .then(() => {
			      window.open(`${getPaymentWebRoot()}/braintree.html#${params}`)
			      progressDialog.show()
		      })

		return progressDialogPromise.finally(() => locator.eventController.removeEntityListener(entityEventListener))
	})
}
