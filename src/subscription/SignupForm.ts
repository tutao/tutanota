import m, {Children, Component, Vnode} from "mithril"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import {Dialog} from "../gui/base/Dialog"
import {TextField} from "../gui/base/TextField.js"
import {Button, ButtonType} from "../gui/base/Button.js"
import {getWhitelabelRegistrationDomains} from "../login/LoginView"
import type {NewAccountData} from "./UpgradeSubscriptionWizard"
import {SelectMailAddressForm, SelectMailAddressFormAttrs} from "../settings/SelectMailAddressForm"
import {isTutanotaDomain} from "../api/common/Env"
import {AccountType, TUTANOTA_MAIL_ADDRESS_DOMAINS} from "../api/common/TutanotaConstants"
import {PasswordForm, PasswordModel} from "../settings/PasswordForm"
import type {CheckboxAttrs} from "../gui/base/Checkbox.js"
import {Checkbox} from "../gui/base/Checkbox.js"
import type {lazy} from "@tutao/tutanota-utils"
import {ofClass} from "@tutao/tutanota-utils"
import type {TranslationKey} from "../misc/LanguageViewModel"
import {lang} from "../misc/LanguageViewModel"
import {showWorkerProgressDialog} from "../gui/dialogs/ProgressDialog"
import {InvalidDataError} from "../api/common/error/RestError"
import {locator} from "../api/main/MainLocator"
import {deleteCampaign} from "../misc/LoginUtils"
import {CURRENT_PRIVACY_VERSION, CURRENT_TERMS_VERSION, renderTermsAndConditionsButton, TermsSection} from "./TermsAndConditions"
import {logins} from "../api/main/LoginController.js"
import {runCaptchaFlow} from "./Captcha.js"

export type SignupFormAttrs = {
	/** Handle a new account signup. if readonly then the argument will always be null */
	newSignupHandler: (arg0: NewAccountData | null) => void
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
	private _mailAddressFormErrorId: TranslationKey | null = null
	private _mailAddress!: string
	private _isMailVerificationBusy: boolean

	constructor() {
		this.passwordModel = new PasswordModel(logins, {checkOldPassword: false, enforceStrength: true, repeatInput: true})
		this._confirmTerms = stream<boolean>(false)
		this._confirmAge = stream<boolean>(false)
		this._code = stream("")
		this._isMailVerificationBusy = false
	}

	view(vnode: Vnode<SignupFormAttrs>): Children {
		const a = vnode.attrs
		const mailAddressFormAttrs: SelectMailAddressFormAttrs = {
			availableDomains: isTutanotaDomain() ? TUTANOTA_MAIL_ADDRESS_DOMAINS : getWhitelabelRegistrationDomains(),
			onEmailChanged: (email, validationResult) => {
				if (validationResult.isValid) {
					this._mailAddress = email
					this._mailAddressFormErrorId = null
				} else {
					this._mailAddressFormErrorId = validationResult.errorId
				}
			},
			onBusyStateChanged: isBusy => {
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
				return a.newSignupHandler(null)
			}

			const errorMessage =
				this._mailAddressFormErrorId || this.passwordModel.getErrorMessageId() || (!this._confirmTerms() ? "termsAcceptedNeutral_msg" : null)

			if (errorMessage) {
				Dialog.message(errorMessage)
				return
			}

			const ageConfirmPromise = this._confirmAge() ? Promise.resolve(true) : Dialog.confirm("parentConfirmation_msg", "paymentDataValidation_action")
			ageConfirmPromise.then(confirmed => {
				if (confirmed) {
					return signup(
						this._mailAddress,
						this.passwordModel.getNewPassword(),
						this._code(),
						a.isBusinessUse(),
						a.isPaidSubscription(),
						a.campaign(),
					).then(newAccountData => {
						a.newSignupHandler(newAccountData ? newAccountData : null)
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
						disabled: true,
					})
					: [
						m(SelectMailAddressForm, mailAddressFormAttrs),
						m(PasswordForm, {
							model: this.passwordModel,
							passwordInfoKey: "passwordImportance_msg"
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
					m(Button, {
						label: "next_action",
						click: submit,
						type: ButtonType.Login,
					}),
				),
			]),
		)
	}
}

function renderTermsLabel(): Children {
	return [
		m("div", lang.get("termsAndConditions_label")),
		m("div", renderTermsAndConditionsButton(TermsSection.Terms, CURRENT_TERMS_VERSION)),
		m("div", renderTermsAndConditionsButton(TermsSection.Privacy, CURRENT_PRIVACY_VERSION))
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
	const {customerFacade} = locator
	return showWorkerProgressDialog(
		locator.worker,
		"createAccountRunning_msg",
		customerFacade.generateSignupKeys().then(keyPairs => {
			return runCaptchaFlow(mailAddress, isBusinessUse, isPaidSubscription, campaign).then(regDataId => {
				if (regDataId) {
					return customerFacade.signup(keyPairs, AccountType.FREE, regDataId, mailAddress, pw, registrationCode, lang.code).then(recoverCode => {
						deleteCampaign()
						return {
							mailAddress,
							password: pw,
							recoverCode,
						}
					})
				}
			})
		}),
	).catch(
		ofClass(InvalidDataError, () => {
			Dialog.message("invalidRegistrationCode_msg")
		}),
	)
}