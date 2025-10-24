import m, { Children, Vnode, VnodeDOM } from "mithril"
import { Dialog, DialogType } from "../gui/base/Dialog"
import { lang, type TranslationKey } from "../misc/LanguageViewModel"
import type { UpgradeSubscriptionData } from "./UpgradeSubscriptionWizard"
import { InvoiceDataInput, InvoiceDataInputLocation } from "./InvoiceDataInput"
import { PaymentMethodInput } from "./PaymentMethodInput"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import {
	AvailablePlanType,
	getClientType,
	getDefaultPaymentMethod,
	InvoiceData,
	Keys,
	PaymentData,
	PaymentDataResultType,
	PaymentMethodType,
} from "../api/common/TutanotaConstants"
import { showProgressDialog } from "../gui/dialogs/ProgressDialog"
import type { AccountingInfo, Braintree3ds2Request } from "../api/entities/sys/TypeRefs.js"
import { AccountingInfoTypeRef, InvoiceInfoTypeRef } from "../api/entities/sys/TypeRefs.js"
import { assertNotNull, neverNull, newPromise, noOp, promiseMap } from "@tutao/tutanota-utils"
import { getLazyLoadedPayPalUrl, getPreconditionFailedPaymentMsg, PaymentErrorCode, UpgradeType } from "./utils/SubscriptionUtils"
import { Button, ButtonType } from "../gui/base/Button.js"
import type { SegmentControlItem } from "../gui/base/SegmentControl"
import { SegmentControl } from "../gui/base/SegmentControl"
import { emitWizardEvent, WizardEventType, WizardPageAttrs, WizardPageN } from "../gui/base/WizardDialog.js"
import type { Country } from "../api/common/CountryList"
import { DefaultAnimationTime } from "../gui/animation/Animations"
import { locator } from "../api/main/CommonLocator"
import { Credentials } from "../misc/credentials/Credentials"
import { SessionType } from "../api/common/SessionType.js"
import { PaymentInterval } from "./utils/PriceUtils.js"
import { EntityUpdateData, isUpdateForTypeRef } from "../api/common/utils/EntityUpdateUtils.js"
import { EntityEventsListener } from "../api/main/EventController.js"
import { LoginButton } from "../gui/base/buttons/LoginButton.js"
import { client } from "../misc/ClientDetector.js"
import { SignupFlowStage, SignupFlowUsageTestController } from "./usagetest/UpgradeSubscriptionWizardUsageTestUtils.js"

/**
 * Wizard page for editing invoice and payment data.
 */
export class InvoiceAndPaymentDataPage implements WizardPageN<UpgradeSubscriptionData> {
	private _paymentMethodInput: PaymentMethodInput | null = null
	private _invoiceDataInput: InvoiceDataInput | null = null
	private _availablePaymentMethods: Array<SegmentControlItem<PaymentMethodType>> | null = null
	private _selectedPaymentMethod: Stream<PaymentMethodType>
	private dom!: HTMLElement

	constructor() {
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

		if (!data.acceptedPlans.includes(data.targetPlanType as AvailablePlanType)) {
			throw new Error("Invalid plan is selected")
		}

		// TODO check if correct place to update these
		if (this._invoiceDataInput && this._paymentMethodInput) {
			data.invoiceData = this._invoiceDataInput.getInvoiceData()
			data.paymentData = this._paymentMethodInput.getPaymentData()
		}

		let loginPromise: Promise<Credentials | null> = Promise.resolve(null)
		const loginController = locator.logins
		if (!loginController.isUserLoggedIn()) {
			loginPromise = loginController
				.createSession(neverNull(data.newAccountData).mailAddress, neverNull(data.newAccountData).password, SessionType.Temporary)
				.then((newSessionData) => newSessionData.credentials)
		}

		loginPromise
			.then(() => {
				if (!data.accountingInfo || !data.customer) {
					return loginController
						.getUserController()
						.loadCustomer()
						.then((customer) => {
							data.customer = customer
							return loginController.getUserController().loadCustomerInfo()
						})
						.then((customerInfo) =>
							locator.entityClient.load(AccountingInfoTypeRef, customerInfo.accountingInfo).then((accountingInfo) => {
								data.accountingInfo = accountingInfo
							}),
						)
				}
			})
			.then(() => getDefaultPaymentMethod())
			.then((defaultPaymentMethod: PaymentMethodType) => {
				this._invoiceDataInput = new InvoiceDataInput(data.options.businessUse(), data.invoiceData, InvoiceDataInputLocation.InWizard)
				let payPalRequestUrl = getLazyLoadedPayPalUrl()

				if (loginController.isUserLoggedIn()) {
					loginController.waitForFullLogin().then(() => payPalRequestUrl.getAsync())
				}

				this._paymentMethodInput = new PaymentMethodInput(
					data.options,
					this._invoiceDataInput.selectedCountry,
					neverNull(data.accountingInfo),
					payPalRequestUrl,
					defaultPaymentMethod,
					!data.firstMonthForFreeOfferActive,
				)
				this._availablePaymentMethods = this._paymentMethodInput.getVisiblePaymentMethods()

				this._selectedPaymentMethod(data.paymentData.paymentMethod)

				this._paymentMethodInput.updatePaymentMethod(data.paymentData.paymentMethod, data.paymentData)
			})
	}

	view(vnode: Vnode<WizardPageAttrs<UpgradeSubscriptionData>>): Children {
		const a = vnode.attrs

		const onNextClick = () => {
			console.count("onNextClick")
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
								neverNull(a.data.price?.rawPrice),
								neverNull(a.data.accountingInfo),
							).then((success) => {
								if (success) {
									// Payment method confirmation (click on next), send selected payment method as an enum
									emitWizardEvent(this.dom, WizardEventType.SHOW_NEXT_PAGE)
								}
							}),
						),
				)
			}
		}

		if (this._paymentMethodInput) {
			this._paymentMethodInput.onConnectPaypal = onNextClick
		}

		return m(
			".pt",
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
							m(LoginButton, {
								label: "next_action",
								class: "small-login-button",
								onclick: onNextClick,
							}),
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
		SignupFlowUsageTestController.completeStage(
			SignupFlowStage.SELECT_PAYMENT_METHOD,
			this.data.targetPlanType,
			this.data.options.paymentInterval(),
			this.data.paymentData.paymentMethod,
		)
		return Promise.resolve(true)
	}

	prevAction(showErrorDialog: boolean): Promise<boolean> {
		SignupFlowUsageTestController.deletePing(SignupFlowStage.CREATE_ACCOUNT)
		return Promise.resolve(true)
	}

	headerTitle(): TranslationKey {
		return "adminPayment_action"
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
	price: string | null,
	accountingInfo: AccountingInfo,
): Promise<boolean> {
	const paymentResult = await locator.customerFacade.updatePaymentData(paymentInterval, invoiceData, paymentData, confirmedCountry)
	const statusCode = paymentResult.result

	if (statusCode === PaymentDataResultType.OK) {
		// show dialog
		let braintree3ds = paymentResult.braintree3dsRequest
		if (braintree3ds) {
			return verifyCreditCard(accountingInfo, braintree3ds, price!)
		} else {
			return true
		}
	} else if (statusCode === PaymentDataResultType.COUNTRY_MISMATCH) {
		const countryName = invoiceData.country ? invoiceData.country.n : ""
		const confirmMessage = lang.getTranslation("confirmCountry_msg", {
			"{1}": countryName,
		})
		const confirmed = await Dialog.confirm(confirmMessage)
		if (confirmed) {
			return updatePaymentData(paymentInterval, invoiceData, paymentData, invoiceData.country, isSignup, price, accountingInfo) // add confirmed invoice country
		} else {
			return false
		}
	} else if (statusCode === PaymentDataResultType.INVALID_VATID_NUMBER) {
		await Dialog.message(
			lang.makeTranslation("invalidVatIdNumber_msg", lang.get("invalidVatIdNumber_msg") + (isSignup ? " " + lang.get("accountWasStillCreated_msg") : "")),
		)
	} else if (statusCode === PaymentDataResultType.CREDIT_CARD_DECLINED) {
		await Dialog.message(
			lang.makeTranslation("creditCardDeclined_msg", lang.get("creditCardDeclined_msg") + (isSignup ? " " + lang.get("accountWasStillCreated_msg") : "")),
		)
	} else if (statusCode === PaymentDataResultType.CREDIT_CARD_CVV_INVALID) {
		await Dialog.message("creditCardCVVInvalid_msg")
	} else if (statusCode === PaymentDataResultType.PAYMENT_PROVIDER_NOT_AVAILABLE) {
		await Dialog.message(
			lang.makeTranslation(
				"paymentProviderNotAvailableError_msg",
				lang.get("paymentProviderNotAvailableError_msg") + (isSignup ? " " + lang.get("accountWasStillCreated_msg") : ""),
			),
		)
	} else if (statusCode === PaymentDataResultType.OTHER_PAYMENT_ACCOUNT_REJECTED) {
		await Dialog.message(
			lang.makeTranslation(
				"paymentAccountRejected_msg",
				lang.get("paymentAccountRejected_msg") + (isSignup ? " " + lang.get("accountWasStillCreated_msg") : ""),
			),
		)
	} else if (statusCode === PaymentDataResultType.CREDIT_CARD_DATE_INVALID) {
		await Dialog.message("creditCardExprationDateInvalid_msg")
	} else if (statusCode === PaymentDataResultType.CREDIT_CARD_NUMBER_INVALID) {
		await Dialog.message(
			lang.makeTranslation(
				"creditCardNumberInvalid_msg",
				lang.get("creditCardNumberInvalid_msg") + (isSignup ? " " + lang.get("accountWasStillCreated_msg") : ""),
			),
		)
	} else if (statusCode === PaymentDataResultType.COULD_NOT_VERIFY_VATID) {
		await Dialog.message(
			lang.makeTranslation(
				"invalidVatIdValidationFailed_msg",
				lang.get("invalidVatIdValidationFailed_msg") + (isSignup ? " " + lang.get("accountWasStillCreated_msg") : ""),
			),
		)
	} else if (statusCode === PaymentDataResultType.CREDIT_CARD_VERIFICATION_LIMIT_REACHED) {
		await Dialog.message(
			lang.makeTranslation(
				"creditCardVerificationLimitReached_msg",
				lang.get("creditCardVerificationLimitReached_msg") + (isSignup ? " " + lang.get("accountWasStillCreated_msg") : ""),
			),
		)
	} else {
		await Dialog.message(
			lang.makeTranslation(
				"otherPaymentProviderError_msg",
				lang.get("otherPaymentProviderError_msg") + (isSignup ? " " + lang.get("accountWasStillCreated_msg") : ""),
			),
		)
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
		let progressDialogPromise: Promise<boolean> = newPromise((res) => (resolve = res))
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
			return promiseMap(updates, (update) => {
				if (isUpdateForTypeRef(InvoiceInfoTypeRef, update)) {
					return locator.entityClient.load(InvoiceInfoTypeRef, update.instanceId).then((invoiceInfo) => {
						invoiceInfoWrapper.invoiceInfo = invoiceInfo
						if (!invoiceInfo.paymentErrorInfo) {
							// user successfully verified the card
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
		const app = client.isCalendarApp() ? "calendar" : "mail"
		let params = `clientToken=${encodeURIComponent(braintree3ds.clientToken)}&nonce=${encodeURIComponent(braintree3ds.nonce)}&bin=${encodeURIComponent(
			braintree3ds.bin,
		)}&price=${encodeURIComponent(price)}&message=${encodeURIComponent(lang.get("creditCardVerification_msg"))}&clientType=${getClientType()}&app=${app}`
		Dialog.message("creditCardVerificationNeededPopup_msg").then(() => {
			const paymentUrlString = locator.domainConfigProvider().getCurrentDomainConfig().paymentUrl
			const paymentUrl = new URL(paymentUrlString)
			paymentUrl.hash += params
			window.open(paymentUrl)
			progressDialog.show()
		})
		return progressDialogPromise.finally(() => locator.eventController.removeEntityListener(entityEventListener))
	})
}
