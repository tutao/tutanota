import m, { Children, Component, Vnode } from "mithril"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import { Dialog } from "../gui/base/Dialog"
import { Autocomplete, TextField } from "../gui/base/TextField.js"
import { getWhitelabelRegistrationDomains } from "../login/LoginView.js"
import type { NewAccountData } from "./UpgradeSubscriptionWizard"
import { SelectMailAddressForm, SelectMailAddressFormAttrs } from "../../common/settings/SelectMailAddressForm.js"
import {
	AccountType,
	DEFAULT_FREE_MAIL_ADDRESS_SIGNUP_DOMAIN,
	DEFAULT_PAID_MAIL_ADDRESS_SIGNUP_DOMAIN,
	TUTA_MAIL_ADDRESS_SIGNUP_DOMAINS,
} from "../api/common/TutanotaConstants"

import type { CheckboxAttrs } from "../gui/base/Checkbox.js"
import { Checkbox } from "../gui/base/Checkbox.js"
import type { lazy } from "@tutao/tutanota-utils"
import { getFirstOrThrow, ofClass } from "@tutao/tutanota-utils"
import type { TranslationKey } from "../misc/LanguageViewModel"
import { InfoLink, lang } from "../misc/LanguageViewModel"
import { showProgressDialog } from "../gui/dialogs/ProgressDialog"
import { InvalidDataError } from "../api/common/error/RestError"
import { locator } from "../api/main/CommonLocator"
import { CURRENT_PRIVACY_VERSION, CURRENT_TERMS_VERSION, renderTermsAndConditionsButton, TermsSection } from "./TermsAndConditions"
import { UsageTest } from "@tutao/tutanota-usagetests"
import { runCaptchaFlow } from "./Captcha.js"
import { EmailDomainData, isPaidPlanDomain } from "../settings/mailaddress/MailAddressesUtils.js"
import { LoginButton } from "../gui/base/buttons/LoginButton.js"
import { ExternalLink } from "../gui/base/ExternalLink.js"
import { PasswordForm, PasswordModel } from "../settings/PasswordForm.js"

export type SignupFormAttrs = {
	/** Handle a new account signup. if readonly then the argument will always be null */
	onComplete: (arg0: NewAccountData | null) => void
	onChangePlan: () => void
	isBusinessUse: lazy<boolean>
	isPaidSubscription: lazy<boolean>
	campaign: lazy<string | null>
	// only used if readonly is true
	prefilledMailAddress?: string | undefined
	readonly: boolean
}

export class SignupForm implements Component<SignupFormAttrs> {
	private readonly passwordModel: PasswordModel
	private readonly _confirmTerms: Stream<boolean>
	private readonly _confirmAge: Stream<boolean>
	private readonly _code: Stream<string>
	private selectedDomain: EmailDomainData
	private _mailAddressFormErrorId: TranslationKey | null = null
	private _mailAddress!: string
	private _isMailVerificationBusy: boolean
	private readonly __mailValid: Stream<boolean>
	private readonly __lastMailValidationError: Stream<TranslationKey | null>
	private __signupFreeTest?: UsageTest
	private __signupPaidTest?: UsageTest

	private readonly availableDomains: readonly EmailDomainData[] = (locator.domainConfigProvider().getCurrentDomainConfig().firstPartyDomain
		? TUTA_MAIL_ADDRESS_SIGNUP_DOMAINS
		: getWhitelabelRegistrationDomains()
	).map((domain) => ({ domain, isPaid: isPaidPlanDomain(domain) }))

	constructor(vnode: Vnode<SignupFormAttrs>) {
		this.selectedDomain = getFirstOrThrow(this.availableDomains)
		// tuta.com gets preference user is signing up for a paid account and it is available
		if (vnode.attrs.isPaidSubscription()) {
			this.selectedDomain = this.availableDomains.find((domain) => domain.domain === DEFAULT_PAID_MAIL_ADDRESS_SIGNUP_DOMAIN) ?? this.selectedDomain
		} else {
			this.selectedDomain = this.availableDomains.find((domain) => domain.domain === DEFAULT_FREE_MAIL_ADDRESS_SIGNUP_DOMAIN) ?? this.selectedDomain
		}

		this.__mailValid = stream(false)
		this.__lastMailValidationError = stream(null)
		this.passwordModel = new PasswordModel(
			locator.usageTestController,
			locator.logins,
			{
				checkOldPassword: false,
				enforceStrength: true,
				reservedStrings: () => (this._mailAddress ? [this._mailAddress.split("@")[0]] : []),
			},
			this.__mailValid,
		)

		this.__signupFreeTest = locator.usageTestController.getTest("signup.free")
		this.__signupPaidTest = locator.usageTestController.getTest("signup.paid")

		this._confirmTerms = stream<boolean>(false)
		this._confirmAge = stream<boolean>(false)
		this._code = stream("")
		this._isMailVerificationBusy = false
		this._mailAddressFormErrorId = "mailAddressNeutral_msg"
	}

	view(vnode: Vnode<SignupFormAttrs>): Children {
		const a = vnode.attrs

		const mailAddressFormAttrs: SelectMailAddressFormAttrs = {
			selectedDomain: this.selectedDomain,
			onDomainChanged: (domain) => {
				if (!domain.isPaid || a.isPaidSubscription()) {
					this.selectedDomain = domain
				} else {
					Dialog.confirm(() => `${lang.get("paidEmailDomainSignup_msg")}\n${lang.get("changePaidPlan_msg")}`).then((confirmed) => {
						if (confirmed) {
							vnode.attrs.onChangePlan()
						}
					})
				}
			},
			availableDomains: this.availableDomains,
			onValidationResult: (email, validationResult) => {
				this.__mailValid(validationResult.isValid)

				if (validationResult.isValid) {
					this._mailAddress = email
					this.passwordModel.recalculatePasswordStrength()
					this._mailAddressFormErrorId = null
				} else {
					this._mailAddressFormErrorId = validationResult.errorId
				}
			},
			onBusyStateChanged: (isBusy) => {
				this._isMailVerificationBusy = isBusy
			},
		}
		const confirmTermsCheckBoxAttrs: CheckboxAttrs = {
			label: renderTermsLabel,
			checked: this._confirmTerms(),
			onChecked: this._confirmTerms,
		}
		const confirmAgeCheckBoxAttrs: CheckboxAttrs = {
			label: () => lang.get("ageConfirmation_msg"),
			checked: this._confirmAge(),
			onChecked: this._confirmAge,
		}

		const submit = () => {
			if (this._isMailVerificationBusy) return

			if (a.readonly) {
				// Email field is read-only, account has already been created but user switched from different subscription.
				this.__completePreviousStages()

				return a.onComplete(null)
			}

			const errorMessage =
				this._mailAddressFormErrorId || this.passwordModel.getErrorMessageId() || (!this._confirmTerms() ? "termsAcceptedNeutral_msg" : null)

			if (errorMessage) {
				Dialog.message(errorMessage)
				return
			}

			const ageConfirmPromise = this._confirmAge() ? Promise.resolve(true) : Dialog.confirm("parentConfirmation_msg", "paymentDataValidation_action")
			ageConfirmPromise.then((confirmed) => {
				if (confirmed) {
					this.__completePreviousStages()

					return signup(
						this._mailAddress,
						this.passwordModel.getNewPassword(),
						this._code(),
						a.isBusinessUse(),
						a.isPaidSubscription(),
						a.campaign(),
					).then((newAccountData) => {
						a.onComplete(newAccountData ? newAccountData : null)
					})
				}
			})
		}

		return m(
			"#signup-account-dialog.flex-center",
			m(".flex-grow-shrink-auto.max-width-m.pt.pb.plr-l", [
				a.readonly
					? m(TextField, {
							label: "mailAddress_label",
							value: a.prefilledMailAddress ?? "",
							autocompleteAs: Autocomplete.newPassword,
							isReadOnly: true,
					  })
					: [
							m(SelectMailAddressForm, mailAddressFormAttrs), // Leave as is
							a.isPaidSubscription()
								? m(".small.mt-s", lang.get("configureCustomDomainAfterSignup_msg"), [
										m(ExternalLink, { href: InfoLink.DomainInfo, isCompanySite: true }),
								  ])
								: null,
							m(PasswordForm, {
								model: this.passwordModel,
								passwordInfoKey: "passwordImportance_msg",
							}),
							getWhitelabelRegistrationDomains().length > 0
								? m(TextField, {
										value: this._code(),
										oninput: this._code,
										label: "whitelabelRegistrationCode_label",
								  })
								: null,
							m(Checkbox, confirmTermsCheckBoxAttrs),
							m(Checkbox, confirmAgeCheckBoxAttrs),
					  ],
				m(
					".mt-l.mb-l",
					m(LoginButton, {
						label: "next_action",
						onclick: submit,
					}),
				),
			]),
		)
	}

	private async __completePreviousStages() {
		// Only the started test's (either free or paid clicked) stages are completed here
		if (this.__signupFreeTest) {
			// Make sure that the previous two pings (valid email + valid passwords) have been sent in the correct order
			await this.__signupFreeTest.getStage(2).complete()
			await this.__signupFreeTest.getStage(3).complete()

			// Credentials confirmation (click on next)
			await this.__signupFreeTest.getStage(4).complete()
		}

		if (this.__signupPaidTest) {
			// Make sure that the previous two pings (valid email + valid passwords) have been sent in the correct order
			await this.__signupPaidTest.getStage(1).complete()
			await this.__signupPaidTest.getStage(2).complete()

			// Credentials confirmation (click on next)
			await this.__signupPaidTest.getStage(3).complete()
		}
	}
}

function renderTermsLabel(): Children {
	return [
		lang.get("termsAndConditions_label"),
		m("div", renderTermsAndConditionsButton(TermsSection.Terms, CURRENT_TERMS_VERSION)),
		m("div", renderTermsAndConditionsButton(TermsSection.Privacy, CURRENT_PRIVACY_VERSION)),
	]
}

/**
 * @return Signs the user up, if no captcha is needed or it has been solved correctly
 */
function signup(
	mailAddress: string,
	pw: string,
	registrationCode: string,
	isBusinessUse: boolean,
	isPaidSubscription: boolean,
	campaign: string | null,
): Promise<NewAccountData | void> {
	const { customerFacade } = locator
	const operation = locator.operationProgressTracker.startNewOperation()
	return showProgressDialog(
		"createAccountRunning_msg",
		customerFacade.generateSignupKeys(operation.id).then((keyPairs) => {
			return runCaptchaFlow(mailAddress, isBusinessUse, isPaidSubscription, campaign).then(async (regDataId) => {
				if (regDataId) {
					return customerFacade.signup(keyPairs, AccountType.FREE, regDataId, mailAddress, pw, registrationCode, lang.code).then((recoverCode) => {
						return {
							mailAddress,
							password: pw,
							recoverCode,
						}
					})
				}
			})
		}),
		operation.progress,
	)
		.catch(
			ofClass(InvalidDataError, () => {
				Dialog.message("invalidRegistrationCode_msg")
			}),
		)
		.finally(() => operation.done())
}
