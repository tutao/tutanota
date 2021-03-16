// @flow
import m from "mithril"
import stream from "mithril/stream/stream.js"
import {Dialog, DialogType} from "../gui/base/Dialog"
import {TextFieldN} from "../gui/base/TextFieldN"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import {getWhitelabelRegistrationDomains} from "../login/LoginView"
import type {NewAccountData} from "./UpgradeSubscriptionWizard"
import {deleteCampaign} from "./UpgradeSubscriptionWizard"
import {SelectMailAddressForm} from "../settings/SelectMailAddressForm"
import {isApp, isTutanotaDomain} from "../api/common/Env"
import {AccountType, TUTANOTA_MAIL_ADDRESS_DOMAINS} from "../api/common/TutanotaConstants"
import {PasswordForm} from "../settings/PasswordForm"
import type {CheckboxAttrs} from "../gui/base/CheckboxN"
import {CheckboxN} from "../gui/base/CheckboxN"
import {neverNull} from "../api/common/utils/Utils"
import {lang} from "../misc/LanguageViewModel"
import type {DialogHeaderBarAttrs} from "../gui/base/DialogHeaderBar"
import {DialogHeaderBar} from "../gui/base/DialogHeaderBar"
import {showWorkerProgressDialog} from "../gui/ProgressDialog"
import {worker} from "../api/main/WorkerClient"
import {AccessDeactivatedError, AccessExpiredError, InvalidDataError} from "../api/common/error/RestError"
import {createRegistrationCaptchaServiceGetData} from "../api/entities/sys/RegistrationCaptchaServiceGetData"
import {deviceConfig} from "../misc/DeviceConfig"
import {showServiceTerms} from "./SubscriptionUtils"
import {serviceRequest, serviceRequestVoid} from "../api/main/Entity"
import {SysService} from "../api/entities/sys/Services"
import {HttpMethod} from "../api/common/EntityFunctions"
import {RegistrationCaptchaServiceReturnTypeRef} from "../api/entities/sys/RegistrationCaptchaServiceReturn"
import {createRegistrationCaptchaServiceData} from "../api/entities/sys/RegistrationCaptchaServiceData"
import {uint8ArrayToBase64} from "../api/common/utils/Encoding"
import type {TranslationKey} from "../misc/LanguageViewModel"

export type SignupFormAttrs = {
	/** Handle a new account signup. if readonly then the argument will always be null */
	newSignupHandler: ?NewAccountData => void,
	isBusinessUse: lazy<boolean>,
	isPaidSubscription: lazy<boolean>,
	campaign: lazy<?string>,
	// only used if readonly is true
	prefilledMailAddress?: string,
	readonly: boolean,
}

export class SignupForm implements MComponent<SignupFormAttrs> {
	_passwordForm: PasswordForm
	_confirmTerms: Stream<boolean>
	_confirmAge: Stream<boolean>
	_code: Stream<string>
	_mailAddressFormErrorId: ?TranslationKey
	_mailAddress: string
	_isMailVerificationBusy: boolean

	constructor() {
		this._passwordForm = new PasswordForm(
			false, true, true, "passwordImportance_msg")
		this._confirmTerms = stream(false)
		this._confirmAge = stream(false)
		this._code = stream("")
		this._isMailVerificationBusy = false
	}

	view(vnode: Vnode<SignupFormAttrs>): Children {
		const a = vnode.attrs

		const mailAddressFormAttrs = {
			availableDomains: isTutanotaDomain() ? TUTANOTA_MAIL_ADDRESS_DOMAINS : getWhitelabelRegistrationDomains(),
			onEmailChanged: (email, validationResult) => {
				if (validationResult.isValid) {
					this._mailAddress = email
					this._mailAddressFormErrorId = null
				} else {
					this._mailAddressFormErrorId = validationResult.errorId
				}
			},
			onBusyStateChanged: (isBusy) => {this._isMailVerificationBusy = isBusy},
		}

		const confirmTermsCheckBoxAttrs: CheckboxAttrs = {
			label: renderTermsLabel,
			checked: this._confirmTerms
		}
		const confirmAgeCheckBoxAttrs: CheckboxAttrs = {
			label: () => lang.get("ageConfirmation_msg"),
			checked: this._confirmAge
		}


		const submit = () => {
			if (this._isMailVerificationBusy) return

			if (a.readonly) {
				return a.newSignupHandler(null)
			}
			const errorMessage = this._mailAddressFormErrorId || this._passwordForm.getErrorMessageId()
				|| (!this._confirmTerms() ? "termsAcceptedNeutral_msg" : null)

			if (errorMessage) {
				Dialog.error(errorMessage)
				return
			}

			const ageConfirmPromise = this._confirmAge()
				? Promise.resolve(true)
				: Dialog.confirm("parentConfirmation_msg", "paymentDataValidation_action")

			ageConfirmPromise.then(confirmed => {
				if (confirmed) {
					return signup(
						this._mailAddress,
						this._passwordForm.getNewPassword(),
						this._code(),
						a.isBusinessUse(),
						a.isPaidSubscription(),
						a.campaign()
					).then(newAccountData => {
						a.newSignupHandler(newAccountData)
					})
				}
			})
		}

		return m("#signup-account-dialog.flex-center", m(".flex-grow-shrink-auto.max-width-m.pt.pb.plr-l", [
			a.readonly
				? m(TextFieldN, {
					label: "mailAddressNeutral_msg",
					value: stream(a.prefilledMailAddress),
					disabled: true
				})
				: [
					m(SelectMailAddressForm, mailAddressFormAttrs),
					m(this._passwordForm),
					(getWhitelabelRegistrationDomains().length > 0) ? m(TextFieldN, {
						value: this._code,
						label: "whitelabelRegistrationCode_label"
					}) : null,
					m(CheckboxN, confirmTermsCheckBoxAttrs),
					m(CheckboxN, confirmAgeCheckBoxAttrs),
				],
			m(".mt-l.mb-l", m(ButtonN, {
				label: "next_action",
				click: submit,
				type: ButtonType.Login,
			}))
		]))
	}
}

function renderTermsLabel(): Children {
	return [
		m("div", lang.get("termsAndConditions_label")),
		m("div", m(`a[href=${lang.getInfoLink("terms_link")}][target=_blank]`, {
			onclick: e => {
				if (isApp()) {
					showServiceTerms("terms")
					e.preventDefault()
				}
			}
		}, lang.get("termsAndConditionsLink_label"))),
		m("div", m(`a[href=${lang.getInfoLink("privacy_link")}][target=_blank]`, {
			onclick: e => {
				if (isApp()) {
					showServiceTerms("privacy")
					e.preventDefault()
				}
			}
		}, lang.get("privacyLink_label")))
	]
}

/**
 * @return Signs the user up, if no captcha is needed or it has been solved correctly
 */
function signup(mailAddress: string, pw: string, registrationCode: string, isBusinessUse: boolean, isPaidSubscription: boolean, campaign: ?string): Promise<NewAccountData> {
	return showWorkerProgressDialog(worker, "createAccountRunning_msg", worker.generateSignupKeys().then(keyPairs => {
		return runCaptcha(mailAddress, isBusinessUse, isPaidSubscription, campaign).then(regDataId => {
			if (regDataId) {
				return worker.signup(keyPairs, AccountType.FREE, regDataId, mailAddress, pw, registrationCode, lang.code)
				             .then((recoverCode) => {
					             deleteCampaign()
					             return {
						             mailAddress,
						             password: pw,
						             recoverCode
					             }
				             })
			}
		})
	})).catch(InvalidDataError, e => {
		Dialog.error("invalidRegistrationCode_msg")
	})
}

/**
 * Accepts multiple formats for a time of day and always returns 12h-format with leading zeros.
 * @param captchaInput
 * @returns {string} HH:MM if parsed, null otherwise
 */
export function parseCaptchaInput(captchaInput: string): ?string {
	if (captchaInput.match(/^[0-2]?[0-9]:[0-5]?[05]$/)) {
		let [h, m] = captchaInput.trim().split(':').map(t => Number(t))
		return [h % 12, m % 60].map(a => String(a).padStart(2, '0')).join(':')
	} else {
		return null;
	}
}

/**
 * @returns the auth token for the signup if the captcha was solved or no captcha was necessary, null otherwise
 *
 * TODO:
 *  * Refactor token usage
 */
function runCaptcha(mailAddress: string, isBusinessUse: boolean, isPaidSubscription: boolean, campaignToken: ?string): Promise<?string> {
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
				return Promise.fromCallback(callback => {
					let dialog: Dialog
					const cancelAction = () => {
						dialog.close()
						callback(null)
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
									callback(null, captchaReturn.token)
								})
								.catch(InvalidDataError, e => {
									return Dialog.error("createAccountInvalidCaptcha_msg").then(() => {
										runCaptcha(mailAddress, isBusinessUse, isPaidSubscription, campaignToken).then(regDataId => {
											callback(null, regDataId)
										})
									})
								})
								.catch(AccessExpiredError, e => {
									Dialog.error("createAccountAccessDeactivated_msg").then(() => {
										callback(null, null)
									})
								})
								.catch(e => {
									callback(e)
								})
						} else {
							Dialog.error("captchaEnter_msg")
						}
					}
					let actionBarAttrs: DialogHeaderBarAttrs = {
						left: [{label: "cancel_action", click: cancelAction, type: ButtonType.Secondary}],
						right: [{label: "ok_action", click: okAction, type: ButtonType.Primary}],
						middle: () => lang.get("captchaDisplay_label")
					}
					const captchaInputAttrs = {
						label: lang.get("captchaInput_label") + ' (hh:mm)',
						helpLabel: () => lang.get("captchaInfo_msg"),
						value: stream(captchaInput),
						oninput: (value) => captchaInput = value,
					}

					dialog = new Dialog(DialogType.EditSmall, {
						view: (): Children => [
							m(".dialog-header.plr-l", m(DialogHeaderBar, actionBarAttrs)),
							m(".plr-l.pb", [
								m("img.mt-l", {
									src: "data:image/png;base64," + uint8ArrayToBase64(neverNull(captchaReturn.challenge)),
									alt: lang.get("captchaDisplay_label")
								}),
								m(TextFieldN, captchaInputAttrs)
							])
						]
					}).setCloseHandler(cancelAction).show()
				})
			} else {
				return regDataId
			}
		})
		.catch(AccessDeactivatedError, e => {
			return Dialog.error("createAccountAccessDeactivated_msg")
		})
}
