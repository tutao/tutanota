import m, { Children, ClassComponent, Vnode } from "mithril"
import { WizardStepComponentAttrs } from "../gui/base/wizard/WizardStep"
import { SignupViewModel } from "./SignupView"
import { SignupFlowStage } from "../subscription/usagetest/UpgradeSubscriptionWizardUsageTestUtils"
import { lang, TranslationKey } from "../misc/LanguageViewModel"
import { PaymentInterval } from "../subscription/utils/PriceUtils"
import { getClientType, InvoiceData, Keys, PaymentData, PaymentDataResultType, PaymentMethodType } from "../api/common/TutanotaConstants"
import { Country } from "../api/common/CountryList"
import { AccountingInfo, Braintree3ds2Request, InvoiceInfoTypeRef } from "../api/entities/sys/TypeRefs"
import { locator } from "../api/main/CommonLocator"
import { Dialog, DialogType } from "../gui/base/Dialog"
import { neverNull, newPromise, noOp, promiseMap } from "@tutao/tutanota-utils"
import { DefaultAnimationTime } from "../gui/animation/Animations"
import { Button, ButtonType } from "../gui/base/Button"
import { EntityEventsListener } from "../api/main/EventController"
import { EntityUpdateData, isUpdateForTypeRef } from "../api/common/utils/EntityUpdateUtils"
import { getPreconditionFailedPaymentMsg, PaymentErrorCode } from "../subscription/utils/SubscriptionUtils"
import { client } from "../misc/ClientDetector"
import { RadioSelectorOption } from "../gui/base/RadioSelectorItem"
import { RadioSelector, RadioSelectorAttrs } from "../gui/base/RadioSelector"
import { getVisiblePaymentMethods } from "../subscription/utils/PaymentUtils"
import { WizardStepContext } from "../gui/base/wizard/WizardController"
import { ProgrammingError } from "../api/common/error/ProgrammingError"
import { LoginButton } from "../gui/base/buttons/LoginButton"
import { theme } from "../gui/theme"
import { CreditCardInput } from "../subscription/CreditCardInput"
import { renderCountryDropdownNew } from "../gui/base/GuiUtils"
import { PaypalButtonNew, PaypalButtonNewAttrs } from "../subscription/PaypalButtonNew"

export class InvoiceAndPaymentDataPageNew implements ClassComponent<WizardStepComponentAttrs<SignupViewModel>> {
	private SignupFlowUsageTestController: any

	view(vnode: Vnode<WizardStepComponentAttrs<SignupViewModel>>): Children {
		const ctx = vnode.attrs.ctx
		const visiblePaymentMethods = getVisiblePaymentMethods({
			// fixme: proper args
			isBusiness: true,
			isBankTransferAllowed: true,
			accountingInfo: null,
		})

		const options: ReadonlyArray<RadioSelectorOption<PaymentMethodType | null>> = visiblePaymentMethods.map(({ name, value }, index) => ({
			name: lang.makeTranslation("selectorItem" + index, name),
			value,
			renderChild: () => this.renderPaymentMethodForm(ctx, value),
		}))

		return m(
			"div.flex.items-center.flex-center.items-stretch",
			m(
				".flex.flex-column",

				[
					m("h1", lang.get("payment_page_title")),
					m("p.b", { style: { color: theme.on_surface_variant } }, lang.get("payment_page_subtitle")),
					m(RadioSelector, {
						groupName: "credentialsEncryptionMode_label",
						options,
						selectedOption: ctx.viewModel.paymentData.paymentMethod,
						onOptionSelected: (method: PaymentMethodType | null) => {
							if (method == null) {
								// fixme: should actually not happen...
								return
							}
							ctx.viewModel.paymentData.paymentMethod = method
						},
					} satisfies RadioSelectorAttrs<PaymentMethodType | null>),
				],
			),
		)
	}

	private renderPaymentMethodForm(ctx: WizardStepContext<SignupViewModel>, method: PaymentMethodType): Children {
		switch (method) {
			case PaymentMethodType.Invoice:
				return m("", "Invoice")
			case PaymentMethodType.CreditCard:
				return this.renderCreditCardForm(ctx)
			case PaymentMethodType.Paypal:
				return this.renderPaypalForm(ctx)
			default:
				throw new ProgrammingError(`unknown payment method for signup: ${method}`)
		}
	}

	private renderCreditCardForm(ctx: WizardStepContext<SignupViewModel>): Children {
		return m(".flex.col.gap-24", [
			m(CreditCardInput, {
				viewModel: ctx.viewModel.ccViewModel,
			}),
			renderCountryDropdownNew({
				selectedCountry: ctx.viewModel.invoiceData.country,
				onSelectionChanged: (country: Country) => (ctx.viewModel.invoiceData.country = country),
				label: "billingCountry_label",
			}),
			m(
				".flex-shrink.align-self-end",
				m(LoginButton, {
					label: "verifyCreditCard_action",
					size: "md",
					width: "flex",
					onclick: () => ctx.goNext(),
				}),
			),
		])
	}

	private renderPaypalForm(ctx: WizardStepContext<SignupViewModel>): Children {
		return m(".flex.col.gap-24", [
			m(".flex.row", [
				m(
					".flex.col",
					{
						style: { "max-width": "250px" },
					},
					[
						m("div", lang.get("paymentDataPayPalLogin_msg")),
						m("", ctx.viewModel.accountingInfo?.paypalBillingAgreement ? ctx.viewModel.accountingInfo!.paymentMethodInfo : "FIXME: NONE"),
					],
				),
				m(PaypalButtonNew, {
					data: ctx.viewModel,
					onclick: () => console.log("clicked"),
					oncomplete: () => console.log("completed"),
				} satisfies PaypalButtonNewAttrs),
			]),
			renderCountryDropdownNew({
				selectedCountry: ctx.viewModel.invoiceData.country,
				onSelectionChanged: (country: Country) => (ctx.viewModel.invoiceData.country = country),
				label: "billingCountry_label",
			}),
		])
	}

	nextAction(showErrorDialog: boolean): Promise<boolean> {
		// fixme
		// SignupFlowUsageTestController.completeStage(
		// 	SignupFlowStage.SELECT_PAYMENT_METHOD,
		// 	this.data.targetPlanType,
		// 	this.data.options.paymentInterval(),
		// 	this.data.paymentData.paymentMethod,
		// )
		return Promise.resolve(true)
	}

	prevAction(showErrorDialog: boolean): Promise<boolean> {
		this.SignupFlowUsageTestController.deletePing(SignupFlowStage.CREATE_ACCOUNT)
		return Promise.resolve(true)
	}

	headerTitle(): TranslationKey {
		return "adminPayment_action"
	}

	isSkipAvailable(): boolean {
		return false
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
