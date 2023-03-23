import m, { Children, Vnode, VnodeDOM } from "mithril"
import { Dialog, DialogType } from "../gui/base/Dialog"
import { lang } from "../misc/LanguageViewModel"
import type { UpgradeSubscriptionData } from "./UpgradeSubscriptionWizard"
import { InvoiceDataInput, InvoiceDataInputLocation } from "./InvoiceDataInput"
import { PaymentMethodInput } from "./PaymentMethodInput"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import type { InvoiceData, PaymentData } from "../api/common/TutanotaConstants"
import { getClientType, Keys, PaymentDataResultType, PaymentMethodType, PaymentMethodTypeToName } from "../api/common/TutanotaConstants"
import { showProgressDialog } from "../gui/dialogs/ProgressDialog"
import type { AccountingInfo, Braintree3ds2Request } from "../api/entities/sys/TypeRefs.js"
import { AccountingInfoTypeRef, InvoiceInfoTypeRef } from "../api/entities/sys/TypeRefs.js"
import { assertNotNull, neverNull, noOp, promiseMap } from "@tutao/tutanota-utils"
import { getLazyLoadedPayPalUrl, getPreconditionFailedPaymentMsg, PaymentErrorCode, UpgradeType } from "./SubscriptionUtils"
import { Button, ButtonType } from "../gui/base/Button.js"
import type { SegmentControlItem } from "../gui/base/SegmentControl"
import { SegmentControl } from "../gui/base/SegmentControl"
import type { WizardPageAttrs, WizardPageN } from "../gui/base/WizardDialog.js"
import { emitWizardEvent, WizardEventType } from "../gui/base/WizardDialog.js"
import type { Country } from "../api/common/CountryList"
import { DefaultAnimationTime } from "../gui/animation/Animations"
import { EntityEventsListener, EntityUpdateData, isUpdateForTypeRef } from "../api/main/EventController"
import { locator } from "../api/main/MainLocator"
import { getPaymentWebRoot } from "../api/common/Env"
import { Credentials } from "../misc/credentials/Credentials"
import { SessionType } from "../api/common/SessionType.js"
import { UsageTest } from "@tutao/tutanota-usagetests"
import { PaymentInterval } from "./PriceUtils.js"
import { PaymentCredit2Stages } from "./PaymentCredit2Stages.js"

/**
 * Wizard page for editing invoice and payment data.
 */
export class InvoiceAndPaymentDataPage implements WizardPageN<UpgradeSubscriptionData> {
	private _paymentMethodInput: PaymentMethodInput | null = null
	private _invoiceDataInput: InvoiceDataInput | null = null
	private _availablePaymentMethods: Array<SegmentControlItem<PaymentMethodType>> | null = null
	private _selectedPaymentMethod: Stream<PaymentMethodType>
	private _upgradeData: UpgradeSubscriptionData
	private dom!: HTMLElement
	private __signupPaidTest?: UsageTest
	private __paymentPaypalTest?: UsageTest
	private __paymentCreditTest: UsageTest

	constructor(upgradeData: UpgradeSubscriptionData) {
		this.__signupPaidTest = locator.usageTestController.getTest("signup.paid")
		this.__paymentPaypalTest = locator.usageTestController.getTest("payment.paypal")
		this.__paymentCreditTest = locator.usageTestController.getTest("payment.credit2")
		this.__paymentCreditTest.recordTime = true

		this._upgradeData = upgradeData
		this._selectedPaymentMethod = stream()

		this._selectedPaymentMethod.map((method) => neverNull(this._paymentMethodInput).updatePaymentMethod(method))
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

		if (!locator.logins.isUserLoggedIn()) {
			login = locator.logins
				.createSession(neverNull(data.newAccountData).mailAddress, neverNull(data.newAccountData).password, SessionType.Temporary)
				.then((newSessionData) => newSessionData.credentials)
		}

		login
			.then(() => {
				if (!data.accountingInfo || !data.customer) {
					return locator.logins
						.getUserController()
						.loadCustomer()
						.then((customer) => {
							data.customer = customer
							return locator.logins.getUserController().loadCustomerInfo()
						})
						.then((customerInfo) =>
							locator.entityClient.load(AccountingInfoTypeRef, customerInfo.accountingInfo).then((accountingInfo) => {
								data.accountingInfo = accountingInfo
							}),
						)
				}
			})
			.then(() => {
				this._invoiceDataInput = new InvoiceDataInput(data.options.businessUse(), data.invoiceData, InvoiceDataInputLocation.InWizard)
				let payPalRequestUrl = getLazyLoadedPayPalUrl()

				if (locator.logins.isUserLoggedIn()) {
					locator.logins.waitForFullLogin().then(() => payPalRequestUrl.getAsync())
				}

				this._paymentMethodInput = new PaymentMethodInput(
					data.options,
					this._invoiceDataInput.selectedCountry,
					neverNull(data.accountingInfo),
					payPalRequestUrl,
					this.__paymentCreditTest,
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
				return showProgressDialog(
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
								this.__paymentCreditTest,
							).then((success) => {
								if (success) {
									// Payment method confirmation (click on next), send selected payment method as an enum
									const paymentMethodConfirmationStage = this.__signupPaidTest?.getStage(4)
									paymentMethodConfirmationStage?.setMetric({
										name: "paymentMethod",
										value: PaymentMethodTypeToName[a.data.paymentData.paymentMethod],
									})
									paymentMethodConfirmationStage?.complete()
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

export async function updatePaymentData(
	paymentInterval: PaymentInterval,
	invoiceData: InvoiceData,
	paymentData: PaymentData | null,
	confirmedCountry: Country | null,
	isSignup: boolean,
	price: string,
	accountingInfo: AccountingInfo,
	usageTest?: UsageTest,
): Promise<boolean> {
	// helper lambda to reduce boilerplate
	const send3DSPreValidationPing = (value: string) => {
		const stage = (usageTest ?? locator.usageTestController.getObsoleteTest()).getStage(PaymentCredit2Stages.TDSPreValidation)
		stage.setMetric({
			name: "validationFailure",
			value,
		})
		stage.complete()
	}
	const paymentResult = await locator.customerFacade.updatePaymentData(paymentInterval, invoiceData, paymentData, confirmedCountry)
	const statusCode = paymentResult.result

	if (statusCode === PaymentDataResultType.OK) {
		// show dialog
		let braintree3ds = paymentResult.braintree3dsRequest
		send3DSPreValidationPing("none")
		if (braintree3ds) {
			return verifyCreditCard(accountingInfo, braintree3ds, price)
		} else {
			return true
		}
	} else if (statusCode === PaymentDataResultType.COUNTRY_MISMATCH) {
		send3DSPreValidationPing("countryMismatch")
		const countryName = invoiceData.country ? invoiceData.country.n : ""
		const confirmMessage = lang.get("confirmCountry_msg", {
			"{1}": countryName,
		})
		const confirmed = await Dialog.confirm(() => confirmMessage)
		if (confirmed) {
			return updatePaymentData(paymentInterval, invoiceData, paymentData, invoiceData.country, isSignup, price, accountingInfo, usageTest) // add confirmed invoice country
		} else {
			return false
		}
	} else if (statusCode === PaymentDataResultType.INVALID_VATID_NUMBER) {
		send3DSPreValidationPing("invalidVatId")
		await Dialog.message(() => lang.get("invalidVatIdNumber_msg") + (isSignup ? " " + lang.get("accountWasStillCreated_msg") : ""))
	} else if (statusCode === PaymentDataResultType.CREDIT_CARD_DECLINED) {
		send3DSPreValidationPing("ccDeclined")
		await Dialog.message(() => lang.get("creditCardDeclined_msg") + (isSignup ? " " + lang.get("accountWasStillCreated_msg") : ""))
	} else if (statusCode === PaymentDataResultType.CREDIT_CARD_CVV_INVALID) {
		send3DSPreValidationPing("cvvInvalid")
		await Dialog.message("creditCardCVVInvalid_msg")
	} else if (statusCode === PaymentDataResultType.PAYMENT_PROVIDER_NOT_AVAILABLE) {
		send3DSPreValidationPing("providerNotAvailable")
		await Dialog.message(() => lang.get("paymentProviderNotAvailableError_msg") + (isSignup ? " " + lang.get("accountWasStillCreated_msg") : ""))
	} else if (statusCode === PaymentDataResultType.OTHER_PAYMENT_ACCOUNT_REJECTED) {
		send3DSPreValidationPing("accountRejected")
		await Dialog.message(() => lang.get("paymentAccountRejected_msg") + (isSignup ? " " + lang.get("accountWasStillCreated_msg") : ""))
	} else if (statusCode === PaymentDataResultType.CREDIT_CARD_DATE_INVALID) {
		send3DSPreValidationPing("dateInvalid")
		await Dialog.message("creditCardExprationDateInvalid_msg")
	} else if (statusCode === PaymentDataResultType.CREDIT_CARD_NUMBER_INVALID) {
		send3DSPreValidationPing("ccNumberInvalid")
		await Dialog.message(() => lang.get("creditCardNumberInvalid_msg") + (isSignup ? " " + lang.get("accountWasStillCreated_msg") : ""))
	} else if (statusCode === PaymentDataResultType.COULD_NOT_VERIFY_VATID) {
		send3DSPreValidationPing("vatValidationFailure")
		await Dialog.message(() => lang.get("invalidVatIdValidationFailed_msg") + (isSignup ? " " + lang.get("accountWasStillCreated_msg") : ""))
	} else if (statusCode === PaymentDataResultType.CREDIT_CARD_VERIFICATION_LIMIT_REACHED) {
		send3DSPreValidationPing("ccVerificationLimitReached")
		await Dialog.message(() => lang.get("creditCardVerificationLimitReached_msg") + (isSignup ? " " + lang.get("accountWasStillCreated_msg") : ""))
	} else {
		send3DSPreValidationPing("other")
		await Dialog.message(() => lang.get("otherPaymentProviderError_msg") + (isSignup ? " " + lang.get("accountWasStillCreated_msg") : ""))
	}

	return false
}

/**
 * Displays a progress dialog that allows to cancel the verification and opens a new window to do the actual verification with the bank.
 */
function verifyCreditCard(accountingInfo: AccountingInfo, braintree3ds: Braintree3ds2Request, price: string): Promise<boolean> {
	return locator.entityClient.load(InvoiceInfoTypeRef, neverNull(accountingInfo.invoiceInfo)).then((invoiceInfo) => {
		let invoiceInfoWrapper = {
			invoiceInfo,
		}
		let resolve: (arg0: boolean) => void
		let progressDialogPromise: Promise<boolean> = new Promise((res) => (resolve = res))
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
		const test = locator.usageTestController.getTest("payment.credit2")
		let entityEventListener: EntityEventsListener = (updates: ReadonlyArray<EntityUpdateData>, eventOwnerGroupId: Id) => {
			return promiseMap(updates, (update) => {
				if (isUpdateForTypeRef(InvoiceInfoTypeRef, update)) {
					return locator.entityClient.load(InvoiceInfoTypeRef, update.instanceId).then((invoiceInfo) => {
						invoiceInfoWrapper.invoiceInfo = invoiceInfo
						const stage = test.getStage(PaymentCredit2Stages.TDSValidationResult)
						if (!invoiceInfo.paymentErrorInfo) {
							// user successfully verified the card
							stage.setMetric({
								name: "validationFailure",
								value: "none",
							})
							stage.complete().then(() => test.getStage(PaymentCredit2Stages.TDSSuccess).complete())
							progressDialog.close()
							resolve(true)
						} else if (invoiceInfo.paymentErrorInfo && invoiceInfo.paymentErrorInfo.errorCode === "card.3ds2_pending") {
							// keep waiting. this error code is set before starting the 3DS2 verification and we just received the event very late
						} else if (invoiceInfo.paymentErrorInfo && invoiceInfo.paymentErrorInfo.errorCode !== null) {
							// verification error during 3ds verification
							let error = "3dsFailedOther"

							switch (invoiceInfo.paymentErrorInfo.errorCode as PaymentErrorCode) {
								case "card.cvv_invalid":
									error = "cvvInvalid"
									break
								case "card.number_invalid":
									error = "ccNumberInvalid"
									break

								case "card.date_invalid":
									error = "expirationDate"
									break
								case "card.insufficient_funds":
									error = "insufficientFunds"
									break
								case "card.expired_card":
									error = "cardExpired"
									break
								case "card.3ds2_failed":
									error = "3dsFailed"
									break
							}

							stage.setMetric({
								name: "validationFailure",
								value: error,
							})
							stage.complete()

							// Restart the test after a validation failure
							test.forceRestart()

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
			const elapsedSeconds = (Date.now() / 1000 - test.meta["ccTestStartTime"]) as number
			test.getStage(PaymentCredit2Stages.TDSInfoConfirmed).setMetric({
				name: "secondsPassedSinceStart",
				value: elapsedSeconds.toString(),
			})
			test.getStage(PaymentCredit2Stages.TDSInfoConfirmed)
				.complete()
				.catch((e) => console.log("failed to send ping, ignoring.", e))
			window.open(`${getPaymentWebRoot()}/braintree.html#${params}`)
			progressDialog.show()
		})
		return progressDialogPromise.finally(() => locator.eventController.removeEntityListener(entityEventListener))
	})
}
