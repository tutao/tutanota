import m, {Children, Component, Vnode} from "mithril"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import {Dialog, DialogType} from "../gui/base/Dialog"
import {TextFieldAttrs, TextFieldN} from "../gui/base/TextFieldN"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import {getWhitelabelRegistrationDomains} from "../login/LoginView"
import type {NewAccountData} from "./UpgradeSubscriptionWizard"
import {SelectMailAddressForm, SelectMailAddressFormAttrs} from "../settings/SelectMailAddressForm"
import {isApp, isTutanotaDomain} from "../api/common/Env"
import {AccountType, TUTANOTA_MAIL_ADDRESS_DOMAINS} from "../api/common/TutanotaConstants"
import {PasswordForm} from "../settings/PasswordForm"
import type {CheckboxAttrs} from "../gui/base/CheckboxN"
import {CheckboxN} from "../gui/base/CheckboxN"
import type {lazy} from "@tutao/tutanota-utils"
import {neverNull, ofClass, uint8ArrayToBase64} from "@tutao/tutanota-utils"
import type {TranslationKey} from "../misc/LanguageViewModel"
import {lang} from "../misc/LanguageViewModel"
import type {DialogHeaderBarAttrs} from "../gui/base/DialogHeaderBar"
import {DialogHeaderBar} from "../gui/base/DialogHeaderBar"
import {showWorkerProgressDialog} from "../gui/dialogs/ProgressDialog"
import {AccessDeactivatedError, AccessExpiredError, InvalidDataError} from "../api/common/error/RestError"
import {createRegistrationCaptchaServiceGetData} from "../api/entities/sys/RegistrationCaptchaServiceGetData"
import {deviceConfig} from "../misc/DeviceConfig"
import {showServiceTerms} from "./SubscriptionUtils"
import {serviceRequest, serviceRequestVoid} from "../api/main/ServiceRequest"
import {SysService} from "../api/entities/sys/Services"
import {HttpMethod} from "../api/common/EntityFunctions"
import {RegistrationCaptchaServiceReturnTypeRef} from "../api/entities/sys/RegistrationCaptchaServiceReturn"
import {createRegistrationCaptchaServiceData} from "../api/entities/sys/RegistrationCaptchaServiceData"
import {locator} from "../api/main/MainLocator"
import {deleteCampaign} from "../misc/LoginUtils"

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
	private readonly _passwordForm: PasswordForm
	private readonly _confirmTerms: Stream<boolean>
	private readonly _confirmAge: Stream<boolean>
	private readonly _code: Stream<string>
	private _mailAddressFormErrorId: TranslationKey | null = null
	private _mailAddress!: string
	private _isMailVerificationBusy: boolean

	constructor() {
		this._passwordForm = new PasswordForm(false, true, true, "passwordImportance_msg")
		this._confirmTerms = stream(false)
		this._confirmAge = stream(false)
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
			checked: this._confirmTerms,
		}
		const confirmAgeCheckBoxAttrs: CheckboxAttrs = {
			label: () => lang.get("ageConfirmation_msg"),
			checked: this._confirmAge,
		}

		const submit = () => {
			if (this._isMailVerificationBusy) return

			if (a.readonly) {
				return a.newSignupHandler(null)
			}

			const errorMessage =
				this._mailAddressFormErrorId || this._passwordForm.getErrorMessageId() || (!this._confirmTerms() ? "termsAcceptedNeutral_msg" : null)

			if (errorMessage) {
				Dialog.message(errorMessage)
				return
			}

			const ageConfirmPromise = this._confirmAge() ? Promise.resolve(true) : Dialog.confirm("parentConfirmation_msg", "paymentDataValidation_action")
			ageConfirmPromise.then(confirmed => {
				if (confirmed) {
					return signup(
						this._mailAddress,
						this._passwordForm.getNewPassword(),
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
					? m(TextFieldN, {
						label: "mailAddress_label",
						value: stream(a.prefilledMailAddress ?? ""),
						disabled: true,
					})
					: [
						m(SelectMailAddressForm, mailAddressFormAttrs),
						m(this._passwordForm),
						getWhitelabelRegistrationDomains().length > 0
							? m(TextFieldN, {
								value: this._code,
								label: "whitelabelRegistrationCode_label",
							})
							: null,
						m(CheckboxN, confirmTermsCheckBoxAttrs),
						m(CheckboxN, confirmAgeCheckBoxAttrs),
					],
				m(
					".mt-l.mb-l",
					m(ButtonN, {
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
		m(
			"div",
			m(
				`a[href=${lang.getInfoLink("terms_link")}][target=_blank]`,
				{
					onclick: (e: MouseEvent) => {
						if (isApp()) {
							showServiceTerms("terms")
							e.preventDefault()
						}
					},
				},
				lang.get("termsAndConditionsLink_label"),
			),
		),
		m(
			"div",
			m(
				`a[href=${lang.getInfoLink("privacy_link")}][target=_blank]`,
				{
					onclick: (e: MouseEvent) => {
						if (isApp()) {
							showServiceTerms("privacy")
							e.preventDefault()
						}
					},
				},
				lang.get("privacyLink_label"),
			),
		),
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
			return runCaptcha(mailAddress, isBusinessUse, isPaidSubscription, campaign).then(regDataId => {
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

/**
 * Accepts multiple formats for a time of day and always returns 12h-format with leading zeros.
 * @param captchaInput
 * @returns {string} HH:MM if parsed, null otherwise
 */
export function parseCaptchaInput(captchaInput: string): string | null {
	if (captchaInput.match(/^[0-2]?[0-9]:[0-5]?[05]$/)) {
		let [h, m] = captchaInput
			.trim()
			.split(":")
			.map(t => Number(t))
		return [h % 12, m % 60].map(a => String(a).padStart(2, "0")).join(":")
	} else {
		return null
	}
}

/**
 * @returns the auth token for the signup if the captcha was solved or no captcha was necessary, null otherwise
 *
 * TODO:
 *  * Refactor token usage
 */
function runCaptcha(
	mailAddress: string,
	isBusinessUse: boolean,
	isPaidSubscription: boolean,
	campaignToken: string | null,
): Promise<string | void> {
	let captchaInput = ""
	let data = createRegistrationCaptchaServiceGetData()
	data.token = campaignToken
	data.mailAddress = mailAddress
	data.signupToken = deviceConfig.getSignupToken()
	data.businessUseSelected = isBusinessUse
	data.paidSubscriptionSelected = isPaidSubscription
	return serviceRequest(SysService.RegistrationCaptchaService, HttpMethod.GET, data, RegistrationCaptchaServiceReturnTypeRef)
		.then(captchaReturn => {
			let regDataId = captchaReturn.token

			if (captchaReturn.challenge) {
				return new Promise<string | void>((resolve, reject) => {
					let dialog: Dialog

					const cancelAction = () => {
						dialog.close()
						resolve()
					}

					const okAction = () => {
						let parsedInput = parseCaptchaInput(captchaInput)

						if (parsedInput) {
							let data = createRegistrationCaptchaServiceData()
							data.token = captchaReturn.token
							data.response = parsedInput
							dialog.close()
							serviceRequestVoid(SysService.RegistrationCaptchaService, HttpMethod.POST, data)
								.then(() => {
									resolve(captchaReturn.token)
								})
								.catch(
									ofClass(InvalidDataError, e => {
										return Dialog.message("createAccountInvalidCaptcha_msg").then(() => {
											runCaptcha(mailAddress, isBusinessUse, isPaidSubscription, campaignToken).then(regDataId => {
												resolve(regDataId)
											})
										})
									}),
								)
								.catch(
									ofClass(AccessExpiredError, e => {
										Dialog.message("createAccountAccessDeactivated_msg").then(() => {
											resolve()
										})
									}),
								)
								.catch(e => {
									reject(e)
								})
						} else {
							Dialog.message("captchaEnter_msg")
						}
					}

					let actionBarAttrs: DialogHeaderBarAttrs = {
						left: [
							{
								label: "cancel_action",
								click: cancelAction,
								type: ButtonType.Secondary,
							},
						],
						right: [
							{
								label: "ok_action",
								click: okAction,
								type: ButtonType.Primary,
							},
						],
						middle: () => lang.get("captchaDisplay_label"),
					}
					const captchaInputAttrs: TextFieldAttrs = {
						label: () => lang.get("captchaInput_label") + " (hh:mm)",
						helpLabel: () => lang.get("captchaInfo_msg"),
						value: stream(captchaInput),
						oninput: (value) => (captchaInput = value),
					}
					dialog = new Dialog(DialogType.EditSmall, {
						view: (): Children => [
							m(".dialog-header.plr-l", m(DialogHeaderBar, actionBarAttrs)),
							m(".plr-l.pb", [
								m("img.mt-l", {
									src: "data:image/png;base64," + uint8ArrayToBase64(neverNull(captchaReturn.challenge)),
									alt: lang.get("captchaDisplay_label"),
								}),
								m(TextFieldN, captchaInputAttrs),
							]),
						],
					})
						.setCloseHandler(cancelAction)
						.show()
				})
			} else {
				return regDataId
			}
		})
		.catch(
			ofClass(AccessDeactivatedError, e => {
				return Dialog.message("createAccountAccessDeactivated_msg")
			}),
		)
}