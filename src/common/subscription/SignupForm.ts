import m, { Children, Component, Vnode } from "mithril"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import { Dialog } from "../gui/base/Dialog"
import { Autocomplete, TextField } from "../gui/base/TextField.js"
import { getWhitelabelRegistrationDomains } from "../login/LoginView.js"
import { SelectMailAddressForm, SelectMailAddressFormAttrs } from "../settings/SelectMailAddressForm"
import {
	DEFAULT_FREE_MAIL_ADDRESS_SIGNUP_DOMAIN,
	DEFAULT_PAID_MAIL_ADDRESS_SIGNUP_DOMAIN,
	TUTA_MAIL_ADDRESS_SIGNUP_DOMAINS,
} from "../api/common/TutanotaConstants"

import type { CheckboxAttrs } from "../gui/base/Checkbox.js"
import { Checkbox } from "../gui/base/Checkbox.js"
import { defer, DeferredObject, getFirstOrThrow, lazy } from "@tutao/tutanota-utils"
import type { TranslationKey } from "../misc/LanguageViewModel"
import { InfoLink, lang } from "../misc/LanguageViewModel"
import { locator } from "../api/main/CommonLocator"
import { CURRENT_TERMS_VERSION, renderTermsAndConditionsButton, TermsSection } from "./TermsAndConditions"
import { runPowChallenge } from "./captcha/Captcha.js"
import { EmailDomainData, isPaidPlanDomain } from "../settings/mailaddress/MailAddressesUtils.js"
import { LoginButton } from "../gui/base/buttons/LoginButton.js"
import { ExternalLink } from "../gui/base/ExternalLink.js"
import { PasswordForm, PasswordModel } from "../settings/PasswordForm.js"
import { deviceConfig } from "../misc/DeviceConfig"
import { PowSolution } from "../api/common/pow-worker"
import { NewAccountData } from "./UpgradeSubscriptionWizard"

export type SignupFormAttrs = {
	/** Handle a new account signup. if readonly then the argument will always be null */
	onComplete: (
		signupResult:
			| {
					type: "success"
					newAccountData: NewAccountData | null
					registrationCode: string
					powChallengeSolutionPromise: Promise<PowSolution>
			  }
			| { type: "failure" },
	) => void
	onChangePlan: () => void
	isBusinessUse: lazy<boolean>
	isPaidSubscription: lazy<boolean>
	campaignToken: lazy<string | null>
	// only used if readonly is true
	prefilledMailAddress?: string | undefined
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
	private powChallengeSolution: DeferredObject<PowSolution> = defer()
	private readonly: boolean = false

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

		this._confirmTerms = stream<boolean>(false)
		this._confirmAge = stream<boolean>(false)
		this._code = stream("")
		this._isMailVerificationBusy = false
		this._mailAddressFormErrorId = "mailAddressNeutral_msg"
	}

	async oninit() {
		runPowChallenge(deviceConfig.getSignupToken())
			.then((solution) => this.powChallengeSolution.resolve(solution))
			.catch((e) => this.powChallengeSolution.reject(e))
		return this.powChallengeSolution.promise
	}

	async oncreate(vnode: Vnode<SignupFormAttrs>) {
		try {
			const userController = locator.logins.getUserController()
			this.readonly = (await userController.loadCustomer()) !== null
		} catch (e) {
			this.readonly = false
		}
		console.log("readonly: ", this.readonly)
		m.redraw()
	}

	view(vnode: Vnode<SignupFormAttrs>): Children {
		const a = vnode.attrs

		const mailAddressFormAttrs: SelectMailAddressFormAttrs = {
			selectedDomain: this.selectedDomain,
			onDomainChanged: (domain) => {
				if (!domain.isPaid || a.isPaidSubscription()) {
					this.selectedDomain = domain
				} else {
					Dialog.confirm(lang.makeTranslation("confirm_msg", `${lang.get("paidEmailDomainSignup_msg")}\n${lang.get("changePaidPlan_msg")}`)).then(
						(confirmed) => {
							if (confirmed) {
								vnode.attrs.onChangePlan()
							}
						},
					)
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
			signupToken: deviceConfig.getSignupToken(),
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

			if (this.readonly) {
				// Email field is read-only, account has already been created but user switched from different subscription.
				// return a.onComplete({ type: "success", newAccountData: null })
			}

			const errorMessage =
				this._mailAddressFormErrorId || this.passwordModel.getErrorMessageId() || (!this._confirmTerms() ? "termsAcceptedNeutral_msg" : null)

			if (errorMessage) {
				Dialog.message(errorMessage)
				return
			}

			a.onComplete({
				type: "success",
				newAccountData: {
					mailAddress: this._mailAddress,
					password: this.passwordModel.getNewPassword(),
				},
				registrationCode: this._code(),
				powChallengeSolutionPromise: this.powChallengeSolution.promise,
			})
		}

		return m(
			"#signup-account-dialog.flex-center",
			m(".flex-grow-shrink-auto.max-width-m.pt.pb.plr-l", [
				this.readonly
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
							m("div", renderTermsAndConditionsButton(TermsSection.Terms, CURRENT_TERMS_VERSION)),
							m(Checkbox, confirmAgeCheckBoxAttrs),
						],
				m(
					".mt-l.mb-l",
					m(LoginButton, {
						label: "next_action",
						onclick: submit,
						disabled: !this._confirmAge() || !this._confirmTerms(),
					}),
				),
			]),
		)
	}
}

function renderTermsLabel(): Children {
	return lang.get("termsAndConditions_label")
}
