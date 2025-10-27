import m, { Children, Component, Vnode } from "mithril"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import { Dialog } from "../gui/base/Dialog"
import { Autocomplete, TextField } from "../gui/base/TextField.js"
import { getWhitelabelRegistrationDomains } from "../login/LoginView.js"
import type { NewAccountData } from "./UpgradeSubscriptionWizard"
import { SelectMailAddressForm, SelectMailAddressFormAttrs } from "../settings/SelectMailAddressForm"
import {
	DEFAULT_FREE_MAIL_ADDRESS_SIGNUP_DOMAIN,
	DEFAULT_PAID_MAIL_ADDRESS_SIGNUP_DOMAIN,
	TUTA_MAIL_ADDRESS_SIGNUP_DOMAINS,
} from "../api/common/TutanotaConstants"

import type { CheckboxAttrs } from "../gui/base/Checkbox.js"
import { Checkbox } from "../gui/base/Checkbox.js"
import { defer, DeferredObject, getFirstOrThrow, lazy, ofClass } from "@tutao/tutanota-utils"
import type { TranslationKey } from "../misc/LanguageViewModel"
import { InfoLink, lang } from "../misc/LanguageViewModel"
import { showProgressDialog } from "../gui/dialogs/ProgressDialog"
import { InvalidDataError, PreconditionFailedError } from "../api/common/error/RestError"
import { locator } from "../api/main/CommonLocator"
import { CURRENT_PRIVACY_VERSION, CURRENT_TERMS_VERSION, renderTermsAndConditionsButton, TermsSection } from "./TermsAndConditions"
import { runCaptchaFlow, runPowChallenge } from "./captcha/Captcha.js"
import { EmailDomainData, isPaidPlanDomain } from "../settings/mailaddress/MailAddressesUtils.js"
import { LoginButton } from "../gui/base/buttons/LoginButton.js"
import { ExternalLink } from "../gui/base/ExternalLink.js"
import { PasswordForm, PasswordModel } from "../settings/PasswordForm.js"
import { client } from "../misc/ClientDetector"
import { SubscriptionApp } from "./utils/SubscriptionUtils"
import { deviceConfig } from "../misc/DeviceConfig"
import { SessionType } from "../api/common/SessionType"
import { PowSolution } from "../api/common/pow-worker"
import { credentialsToUnencrypted } from "../misc/credentials/Credentials"

export type SignupFormAttrs = {
	/** Handle a new account signup. if readonly then the argument will always be null */
	onComplete: (signupResult: { type: "success"; newAccountData: NewAccountData | null } | { type: "failure" }) => void
	onChangePlan: () => void
	isBusinessUse: lazy<boolean>
	isPaidSubscription: lazy<boolean>
	campaignToken: lazy<string | null>
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
	private powChallengeSolution: DeferredObject<PowSolution> = defer()

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

			if (a.readonly) {
				// Email field is read-only, account has already been created but user switched from different subscription.
				return a.onComplete({ type: "success", newAccountData: null })
			}

			const errorMessage =
				this._mailAddressFormErrorId || this.passwordModel.getErrorMessageId() || (!this._confirmTerms() ? "termsAcceptedNeutral_msg" : null)

			if (errorMessage) {
				Dialog.message(errorMessage)
				return
			}

			const ageConfirmPromise = this._confirmAge() ? Promise.resolve(true) : Dialog.confirm("parentConfirmation_msg", "paymentDataValidation_action")
			ageConfirmPromise.then((checkedBoxes) => {
				if (checkedBoxes) {
					return signup(
						this._mailAddress,
						this.passwordModel.getNewPassword(),
						this._code(),
						a.isBusinessUse(),
						a.isPaidSubscription(),
						a.campaignToken(),
						this.powChallengeSolution.promise,
					).then((newAccountData) => {
						if (newAccountData != null) {
							a.onComplete({ type: "success", newAccountData })
						} else {
							a.onComplete({ type: "failure" })
						}
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
							m("div", renderTermsAndConditionsButton(TermsSection.Terms, CURRENT_TERMS_VERSION)),
							m("div", renderTermsAndConditionsButton(TermsSection.Privacy, CURRENT_PRIVACY_VERSION)),
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
}

function renderTermsLabel(): Children {
	return lang.get("termsAndConditions_label")
}

/**
 * @return Signs the user up, if no captcha is needed or it has been solved correctly
 */
async function signup(
	mailAddress: string,
	password: string,
	registrationCode: string,
	isBusinessUse: boolean,
	isPaidSubscription: boolean,
	campaignToken: string | null,
	powChallengeSolution: Promise<PowSolution>,
): Promise<NewAccountData | void> {
	const { customerFacade, logins, identityKeyCreator } = locator

	const operation = locator.operationProgressTracker.startNewOperation()
	const signupActionPromise = customerFacade.generateSignupKeys(operation.id).then(async (keyPairs) => {
		const regDataId = await runCaptchaFlow({
			mailAddress,
			isBusinessUse,
			isPaidSubscription,
			campaignToken,
			powChallengeSolution,
		})
		if (regDataId) {
			const app = client.isCalendarApp() ? SubscriptionApp.Calendar : SubscriptionApp.Mail
			const recoverCode = await customerFacade.signup(keyPairs, regDataId, mailAddress, password, registrationCode, lang.code, app)
			let userGroupId
			if (!logins.isUserLoggedIn()) {
				// we do not know the userGroupId at group creation time,
				// so we log in and create the identity key pair now

				const sessionData = await logins.createSession(mailAddress, password, SessionType.Persistent)

				const unencryptedCredentials = credentialsToUnencrypted(sessionData.credentials, sessionData.databaseKey)
				try {
					await locator.credentialsProvider.store(unencryptedCredentials)
				} catch (e) {}
				userGroupId = sessionData.userGroupInfo.group
			} else {
				userGroupId = logins.getUserController().userGroupInfo.group
			}
			await identityKeyCreator.createIdentityKeyPair(
				userGroupId,
				{
					object: keyPairs[0], // user group key pair
					version: 0, //new group
				},
				[],
			)
			return {
				mailAddress,
				password,
				recoverCode,
			}
		}
	})
	return showProgressDialog("createAccountRunning_msg", signupActionPromise, operation.progress)
		.catch(
			ofClass(InvalidDataError, () => {
				Dialog.message("invalidRegistrationCode_msg")
			}),
		)
		.catch(
			ofClass(PreconditionFailedError, (e) => {
				Dialog.message("invalidSignup_msg")
			}),
		)
		.finally(() => operation.done())
}
