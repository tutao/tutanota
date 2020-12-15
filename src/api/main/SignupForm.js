// @flow

import m from "mithril"
import stream from "mithril/stream/stream.js"
import {Dialog, DialogType} from "../../gui/base/Dialog"
import {TextFieldN} from "../../gui/base/TextFieldN"
import {ButtonN, ButtonType} from "../../gui/base/ButtonN"
import {emitWizardEvent, WizardEventType} from "../../gui/base/WizardDialogN"
import {getWhitelabelRegistrationDomains} from "../../login/LoginView"
import type {NewAccountData, UpgradeSubscriptionData} from "../../subscription/UpgradeSubscriptionWizard"
import {deleteCampaign} from "../../subscription/UpgradeSubscriptionWizard"
import {SelectMailAddressForm} from "../../settings/SelectMailAddressForm"
import {isApp, isTutanotaDomain} from "../Env"
import {AccountType, TUTANOTA_MAIL_ADDRESS_DOMAINS} from "../common/TutanotaConstants"
import {PasswordForm} from "../../settings/PasswordForm"
import type {CheckboxAttrs} from "../../gui/base/CheckboxN"
import {asyncImport, neverNull} from "../common/utils/Utils"
import {lang} from "../../misc/LanguageViewModel"
import type {DialogHeaderBarAttrs} from "../../gui/base/DialogHeaderBar"
import {htmlSanitizer} from "../../misc/HtmlSanitizer"
import {showWorkerProgressDialog} from "../../gui/base/ProgressDialog"
import {worker} from "./WorkerClient"
import {AccessDeactivatedError, AccessExpiredError, InvalidDataError} from "../common/error/RestError"
import {createRegistrationCaptchaServiceGetData} from "../entities/sys/RegistrationCaptchaServiceGetData"
import {deviceConfig} from "../../misc/DeviceConfig"
import {showServiceTerms, SubscriptionType} from "../../subscription/SubscriptionUtils"
import {serviceRequest, serviceRequestVoid} from "./Entity"
import {SysService} from "../entities/sys/Services"
import {HttpMethod} from "../common/EntityFunctions"
import {RegistrationCaptchaServiceReturnTypeRef} from "../entities/sys/RegistrationCaptchaServiceReturn"
import {createRegistrationCaptchaServiceData} from "../entities/sys/RegistrationCaptchaServiceData"
import {TextField} from "../../gui/base/TextField"
import {DialogHeaderBar} from "../../gui/base/DialogHeaderBar"
import {uint8ArrayToBase64} from "../common/utils/Encoding"
import {CheckboxN} from "../../gui/base/CheckboxN"

export type SignupFormAttrs = {
	/** Handle a new account signup. if readonly then the argument will always be null */
	newSignupHandler: ?NewAccountData => void,
	isBusinessUse: lazy<boolean>,
	isPaidSubscription: lazy<boolean>,
	campaign: lazy<?string>,
	prefilledMailAddress?: string,
	readonly: boolean,
}

export class SignupForm implements MComponent<SignupFormAttrs> {
	_mailAddressForm: SelectMailAddressForm
	_passwordForm: PasswordForm
	_confirmTerms: Stream<boolean>
	_confirmAge: Stream<boolean>
	_code: Stream<string>

	constructor() {
		this._mailAddressForm = new SelectMailAddressForm(
			isTutanotaDomain() ? TUTANOTA_MAIL_ADDRESS_DOMAINS : getWhitelabelRegistrationDomains())
		this._passwordForm = new PasswordForm(
			false, true, true, "passwordImportance_msg")
		this._confirmTerms = stream(false)
		this._confirmAge = stream(false)
		this._code = stream("")
	}

	view(vnode: Vnode<SignupFormAttrs>): Children {
		const a = vnode.attrs

		const confirmTermsCheckBoxAttrs: CheckboxAttrs = {
			label: renderTermsLabel,
			checked: this._confirmTerms
		}
		const confirmAgeCheckBoxAttrs: CheckboxAttrs = {
			label: () => lang.get("ageConfirmation_msg"),
			checked: this._confirmAge
		}


		const submit = () => {
			if (a.readonly) {
				return a.newSignupHandler(null)
			}
			const errorMessage = this._mailAddressForm.getErrorMessageId() || this._passwordForm.getErrorMessageId()
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
						this._mailAddressForm.getCleanMailAddress(),
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
					m(this._mailAddressForm),
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
		m("div", m(`a[href=${lang.getInfoLink("termsFree_link")}][target=_blank]`, {
			onclick: e => {
				if (isApp()) {
					showServiceTerms("terms")
					e.preventDefault()
				}
			}
		}, lang.get("termsAndConditionsLink_label"))),
		m("div", m(`a[href=${lang.getInfoLink("termsPrivacy_link")}][target=_blank]`, {
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
	return showWorkerProgressDialog("createAccountRunning_msg", worker.generateSignupKeys().then(keyPairs => {
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
 * @returns the auth token for the signup if the captcha was solved or no captcha was necessary, null otherwise
 *
 * TODO:
 *  * Refactor token usage
 *  * Is 'recursion' on runCaptcha a smart move?
 */
function runCaptcha(mailAddress: string, isBusinessUse: boolean, isPaidSubscription: boolean, campaignToken: ?string): Promise<?string> {
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
						let captchaTime = captchaInput.value().trim()
						if (captchaTime.match(/^[0-2][0-9]:[0-5][05]$/) && Number(captchaTime.substr(0, 2)) < 24) {
							let data = createRegistrationCaptchaServiceData()
							data.token = captchaReturn.token
							data.response = captchaTime
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
					let captchaInput = new TextField(() => lang.get("captchaInput_label")
						+ ' (hh:mm)', () => lang.get("captchaInfo_msg"))
					dialog = new Dialog(DialogType.EditSmall, {
						view: (): Children => [
							m(".dialog-header.plr-l", m(DialogHeaderBar, actionBarAttrs)),
							m(".plr-l.pb", [
								m("img.mt-l", {
									src: "data:image/png;base64," + uint8ArrayToBase64(neverNull(captchaReturn.challenge)),
									alt: lang.get("captchaDisplay_label")
								}),
								m(captchaInput)
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
