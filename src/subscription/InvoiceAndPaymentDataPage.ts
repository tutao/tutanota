import m, {Children, Vnode, VnodeDOM} from "mithril"
import {Dialog, DialogType} from "../gui/base/Dialog"
import {lang} from "../misc/LanguageViewModel"
import type {UpgradeSubscriptionData} from "./UpgradeSubscriptionWizard"
import {InvoiceDataInput} from "./InvoiceDataInput"
import {PaymentMethodInput} from "./PaymentMethodInput"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import type {InvoiceData, PaymentData, PaymentMethodType} from "../api/common/TutanotaConstants"
import {getClientType, Keys, PaymentDataResultType} from "../api/common/TutanotaConstants"
import {showProgressDialog} from "../gui/dialogs/ProgressDialog"
import {getLazyLoadedPayPalUrl} from "./PaymentDataDialog"
import {logins} from "../api/main/LoginController"
import type {AccountingInfo, Braintree3ds2Request} from "../api/entities/sys/TypeRefs.js"
import {AccountingInfoTypeRef, CustomerInfoTypeRef, CustomerTypeRef, InvoiceInfoTypeRef} from "../api/entities/sys/TypeRefs.js"
import {assertNotNull, neverNull, noOp, promiseMap} from "@tutao/tutanota-utils"
import {getPreconditionFailedPaymentMsg, SubscriptionType, UpgradeType} from "./SubscriptionUtils"
import {Button, ButtonType} from "../gui/base/Button.js"
import type {SegmentControlItem} from "../gui/base/SegmentControl"
import {SegmentControl} from "../gui/base/SegmentControl"
import type {WizardPageAttrs, WizardPageN} from "../gui/base/WizardDialog.js"
import {emitWizardEvent, WizardDialogAttrsBuilder, WizardEventType} from "../gui/base/WizardDialog.js"
import type {Country} from "../api/common/CountryList"
import {DefaultAnimationTime} from "../gui/animation/Animations"
import {EntityEventsListener, EntityUpdateData, isUpdateForTypeRef} from "../api/main/EventController"
import {locator} from "../api/main/MainLocator"
import {getPaymentWebRoot} from "../api/common/Env"
import {Credentials} from "../misc/credentials/Credentials";
import {SessionType} from "../api/common/SessionType.js";

/**
 * Wizard page for editing invoice and payment data.
 */
export class InvoiceAndPaymentDataPage implements WizardPageN<UpgradeSubscriptionData> {
	private _paymentMethodInput: PaymentMethodInput | null = null
	private _invoiceDataInput: InvoiceDataInput | null = null
	private _availablePaymentMethods: Array<SegmentControlItem<PaymentMethodType>> | null = null
	private _selectedPaymentMethod: Stream<PaymentMethodType>
	private _upgradeData: UpgradeSubscriptionData
	private dom!: HTMLElement;

	constructor(upgradeData: UpgradeSubscriptionData) {
		this._upgradeData = upgradeData
		this._selectedPaymentMethod = stream()

		this._selectedPaymentMethod.map(method => neverNull(this._paymentMethodInput).updatePaymentMethod(method))
	}

	onremove(vnode: Vnode<WizardPageAttrs<UpgradeSubscriptionData>>) {
		const data = vnode.attrs.data

		// TODO check if correct place to update these
		if (this._invoiceDataInput && this._paymentMethodInput) {
			data.invoiceData = this._invoiceDataInput.getInvoiceData()
			data.paymentData = this._paymentMethodInput.getPaymentData()
		}
	}

	oncreate(vnode: VnodeDOM<WizardPageAttrs<UpgradeSubscriptionData>>) {

		this.dom = vnode.dom as HTMLElement
		const data = vnode.attrs.data

		// TODO check if correct place to update these
		if (this._invoiceDataInput && this._paymentMethodInput) {
			data.invoiceData = this._invoiceDataInput.getInvoiceData()
			data.paymentData = this._paymentMethodInput.getPaymentData()
		}

		let login: Promise<Credentials | null> = Promise.resolve(null)

		if (!logins.isUserLoggedIn()) {
			login = logins.createSession(neverNull(data.newAccountData).mailAddress, neverNull(data.newAccountData).password, SessionType.Temporary)
		}

		login
			.then(() => {
				if (!data.accountingInfo || !data.customer) {
					return locator.entityClient
								  .load(CustomerTypeRef, neverNull(logins.getUserController().user.customer))
								  .then(customer => {
									  data.customer = customer
									  return locator.entityClient.load(CustomerInfoTypeRef, customer.customerInfo)
								  })
								  .then(customerInfo =>
									  locator.entityClient.load(AccountingInfoTypeRef, customerInfo.accountingInfo).then(accountingInfo => {
										  data.accountingInfo = accountingInfo
									  }),
								  )
				}
			})
			.then(() => {
				this._invoiceDataInput = new InvoiceDataInput(data.options.businessUse(), data.invoiceData)
				let payPalRequestUrl = getLazyLoadedPayPalUrl()

				if (logins.isUserLoggedIn()) {
					logins.waitForFullLogin().then(() => payPalRequestUrl.getAsync())
				}

				this._paymentMethodInput = new PaymentMethodInput(
					data.options,
					this._invoiceDataInput.selectedCountry,
					neverNull(data.accountingInfo),
					payPalRequestUrl,
				)
				this._availablePaymentMethods = this._paymentMethodInput.getVisiblePaymentMethods()

				this._selectedPaymentMethod(data.paymentData.paymentMethod)

				this._paymentMethodInput.updatePaymentMethod(data.paymentData.paymentMethod, data.paymentData)
			})
	}

	view(vnode: Vnode<WizardPageAttrs<UpgradeSubscriptionData>>): Children {
		const a = vnode.attrs

		const onNextClick = () => {
			const invoiceDataInput = assertNotNull(this._invoiceDataInput)
			const paymentMethodInput = assertNotNull(this._paymentMethodInput)
			let error = invoiceDataInput.validateInvoiceData() || paymentMethodInput.validatePaymentData()

			if (error) {
				return Dialog.message(error).then(() => null)
			} else {
				a.data.invoiceData = invoiceDataInput.getInvoiceData()
				a.data.paymentData = paymentMethodInput.getPaymentData()
				showProgressDialog(
					"updatePaymentDataBusy_msg",
					Promise.resolve()
						   .then(() => {
							   let customer = neverNull(a.data.customer)

							   if (customer.businessUse !== a.data.options.businessUse()) {
								   customer.businessUse = a.data.options.businessUse()
								   return locator.entityClient.update(customer)
							   }
						   })
						   .then(() =>
							   updatePaymentData(
								   a.data.options.paymentInterval(),
								   a.data.invoiceData,
								   a.data.paymentData,
								   null,
								   a.data.upgradeType === UpgradeType.Signup,
								   a.data.price,
								   neverNull(a.data.accountingInfo),
							   ).then(success => {
								   if (success) {
									   emitWizardEvent(this.dom, WizardEventType.SHOWNEXTPAGE)
								   }
							   }),
						   ),
				)
			}
		}

		return m(
			"#upgrade-account-dialog.pt",
			this._availablePaymentMethods
				? [
					m(SegmentControl, {
						items: this._availablePaymentMethods,
						selectedValue: this._selectedPaymentMethod(),
						onValueSelected: this._selectedPaymentMethod,
					}),
					m(".flex-space-around.flex-wrap.pt", [
						m(
							".flex-grow-shrink-half.plr-l",
							{
								style: {
									minWidth: "260px",
								},
							},
							m(neverNull(this._invoiceDataInput)),
						),
						m(
							".flex-grow-shrink-half.plr-l",
							{
								style: {
									minWidth: "260px",
								},
							},
							m(neverNull(this._paymentMethodInput)),
						),
					]),
					m(
						".flex-center.full-width.pt-l",
						m(
							"",
							{
								style: {
									width: "260px",
								},
							},
							m(Button, {
								label: "next_action",
								click: onNextClick,
								type: ButtonType.Login,
							}),
						),
					),
				]
				: null,
		)
	}
}

export class InvoiceAndPaymentDataPageAttrs implements WizardPageAttrs<UpgradeSubscriptionData> {
	data: UpgradeSubscriptionData
	_enabled: () => boolean = () => true

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
		return this._enabled()
	}

	/**
	 * Set the enabled function for isEnabled
	 * @param enabled
	 */
	setEnabledFunction<T>(enabled: () => boolean) {
		this._enabled = enabled
	}
}

export function updatePaymentData(
	paymentInterval: number,
	invoiceData: InvoiceData,
	paymentData: PaymentData | null,
	confirmedCountry: Country | null,
	isSignup: boolean,
	price: string,
	accountingInfo: AccountingInfo,
): Promise<boolean> {
	return locator.customerFacade.updatePaymentData(paymentInterval, invoiceData, paymentData, confirmedCountry).then(paymentResult => {
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
				const confirmMessage = lang.get("confirmCountry_msg", {
					"{1}": countryName,
				})
				return Dialog.confirm(() => confirmMessage).then(confirmed => {
					if (confirmed) {
						return updatePaymentData(paymentInterval, invoiceData, paymentData, invoiceData.country, isSignup, price, accountingInfo) // add confirmed invoice country
					} else {
						return false
					}
				})
			} else {
				if (statusCode === PaymentDataResultType.INVALID_VATID_NUMBER) {
					Dialog.message(() => lang.get("invalidVatIdNumber_msg") + (isSignup ? " " + lang.get("accountWasStillCreated_msg") : ""))
				} else if (statusCode === PaymentDataResultType.CREDIT_CARD_DECLINED) {
					Dialog.message(() => lang.get("creditCardDeclined_msg") + (isSignup ? " " + lang.get("accountWasStillCreated_msg") : ""))
				} else if (statusCode === PaymentDataResultType.CREDIT_CARD_CVV_INVALID) {
					Dialog.message("creditCardCVVInvalid_msg")
				} else if (statusCode === PaymentDataResultType.PAYMENT_PROVIDER_NOT_AVAILABLE) {
					Dialog.message(() => lang.get("paymentProviderNotAvailableError_msg") + (isSignup ? " " + lang.get("accountWasStillCreated_msg") : ""))
				} else if (statusCode === PaymentDataResultType.OTHER_PAYMENT_ACCOUNT_REJECTED) {
					Dialog.message(() => lang.get("paymentAccountRejected_msg") + (isSignup ? " " + lang.get("accountWasStillCreated_msg") : ""))
				} else if (statusCode === PaymentDataResultType.CREDIT_CARD_DATE_INVALID) {
					Dialog.message("creditCardExprationDateInvalid_msg")
				} else if (statusCode === PaymentDataResultType.CREDIT_CARD_NUMBER_INVALID) {
					Dialog.message(() => lang.get("creditCardNumberInvalid_msg") + (isSignup ? " " + lang.get("accountWasStillCreated_msg") : ""))
				} else if (statusCode === PaymentDataResultType.COULD_NOT_VERIFY_VATID) {
					Dialog.message(() => lang.get("invalidVatIdValidationFailed_msg") + (isSignup ? " " + lang.get("accountWasStillCreated_msg") : ""))
				} else if (statusCode === PaymentDataResultType.CREDIT_CARD_VERIFICATION_LIMIT_REACHED) {
					Dialog.message(() => lang.get("creditCardVerificationLimitReached_msg") + (isSignup ? " " + lang.get("accountWasStillCreated_msg") : ""))
				} else {
					Dialog.message(() => lang.get("otherPaymentProviderError_msg") + (isSignup ? " " + lang.get("accountWasStillCreated_msg") : ""))
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
		let invoiceInfoWrapper = {
			invoiceInfo,
		}
		let resolve: (arg0: boolean) => void
		let progressDialogPromise: Promise<boolean> = new Promise(res => (resolve = res))
		let progressDialog: Dialog

		const closeAction = () => {
			// user did not complete the 3ds dialog and PaymentDataService.POST was not invoked
			progressDialog.close()
			setTimeout(() => resolve(false), DefaultAnimationTime)
		}

		progressDialog = new Dialog(DialogType.Alert, {
			view: () => [
				m(".dialog-contentButtonsBottom.text-break.selectable", lang.get("creditCardPendingVerification_msg")),
				m(
					".flex-center.dialog-buttons",
					m(Button, {
						label: "cancel_action",
						click: closeAction,
						type: ButtonType.Primary,
					}),
				),
			],
		})
			.setCloseHandler(closeAction)
			.addShortcut({
				key: Keys.RETURN,
				shift: false,
				exec: closeAction,
				help: "close_alt",
			})
			.addShortcut({
				key: Keys.ESC,
				shift: false,
				exec: closeAction,
				help: "close_alt",
			})

		let entityEventListener: EntityEventsListener = (updates: ReadonlyArray<EntityUpdateData>, eventOwnerGroupId: Id) => {
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
						} else if (invoiceInfo.paymentErrorInfo && invoiceInfo.paymentErrorInfo.errorCode !== null) {
							// verification error during 3ds verification
							Dialog.message(getPreconditionFailedPaymentMsg(invoiceInfo.paymentErrorInfo.errorCode))
							resolve(false)
							progressDialog.close()
						}

						m.redraw()
					})
				}
			}).then(noOp)
		}

		locator.eventController.addEntityListener(entityEventListener)
		let params = `clientToken=${encodeURIComponent(braintree3ds.clientToken)}&nonce=${encodeURIComponent(braintree3ds.nonce)}&bin=${encodeURIComponent(
			braintree3ds.bin,
		)}&price=${encodeURIComponent(price)}&message=${encodeURIComponent(lang.get("creditCardVerification_msg"))}&clientType=${getClientType()}`
		Dialog.message("creditCardVerificationNeededPopup_msg").then(() => {
			window.open(`${getPaymentWebRoot()}/braintree.html#${params}`)
			progressDialog.show()
		})
		return progressDialogPromise.finally(() => locator.eventController.removeEntityListener(entityEventListener))
	})
}