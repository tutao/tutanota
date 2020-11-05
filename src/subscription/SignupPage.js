// @flow
import m from "mithril"
import stream from "mithril/stream/stream.js"
import type {TranslationKey} from "../misc/LanguageViewModel"
import {lang} from "../misc/LanguageViewModel"
import type {UpgradeSubscriptionData} from "./UpgradeSubscriptionWizard"
import {deleteCampaign} from "./UpgradeSubscriptionWizard"
import {SelectMailAddressForm} from "../settings/SelectMailAddressForm"
import {Checkbox} from "../gui/base/Checkbox"
import {isApp, isTutanotaDomain} from "../api/Env"
import {getWhitelabelRegistrationDomains} from "../login/LoginView"
import {Dialog, DialogType} from "../gui/base/Dialog"
import {TextField} from "../gui/base/TextField"
import {PasswordForm} from "../settings/PasswordForm"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import {AccountType, TUTANOTA_MAIL_ADDRESS_DOMAINS} from "../api/common/TutanotaConstants"
import {SysService} from "../api/entities/sys/Services"
import {worker} from "../api/main/WorkerClient"
import {AccessDeactivatedError, AccessExpiredError, InvalidDataError} from "../api/common/error/RestError"
import {asyncImport, neverNull} from "../api/common/utils/Utils"
import {htmlSanitizer} from "../misc/HtmlSanitizer"
import {HttpMethod} from "../api/common/EntityFunctions"
import {serviceRequest, serviceRequestVoid} from "../api/main/Entity"
import {RegistrationCaptchaServiceReturnTypeRef} from "../api/entities/sys/RegistrationCaptchaServiceReturn"
import {showWorkerProgressDialog} from "../gui/base/ProgressDialog"
import {uint8ArrayToBase64} from "../api/common/utils/Encoding"
import {TextFieldN} from "../gui/base/TextFieldN"
import {createRegistrationCaptchaServiceGetData} from "../api/entities/sys/RegistrationCaptchaServiceGetData"
import type {DialogHeaderBarAttrs} from "../gui/base/DialogHeaderBar"
import {DialogHeaderBar} from "../gui/base/DialogHeaderBar"
import {createRegistrationCaptchaServiceData} from "../api/entities/sys/RegistrationCaptchaServiceData"
import {deviceConfig} from "../misc/DeviceConfig"
import {SubscriptionType} from "./SubscriptionUtils"
import type {WizardPageAttrs, WizardPageN} from "../gui/base/WizardDialogN"
import {emitWizardEvent, WizardEventType} from "../gui/base/WizardDialogN"


type ConfirmStatus = {
	type: string,
	text: TranslationKey
}

export class SignupPage implements WizardPageN<UpgradeSubscriptionData> {
	_mailAddressForm: SelectMailAddressForm
	_passwordForm: PasswordForm
	_codeField: TextField
	_confirm: Checkbox
	_confirmAge: Checkbox
	_confirmStatus: Stream<ConfirmStatus>

	constructor() {
		this._mailAddressForm = new SelectMailAddressForm(isTutanotaDomain() ? TUTANOTA_MAIL_ADDRESS_DOMAINS : getWhitelabelRegistrationDomains())
		this._passwordForm = new PasswordForm(false, true, true, "passwordImportance_msg")
		this._codeField = new TextField("whitelabelRegistrationCode_label")
		this._confirm = new Checkbox(() => [
			m("div", lang.get("termsAndConditions_label")),
			m("div", m(`a[href=${lang.getInfoLink("terms_link")}][target=_blank]`, {
				onclick: (e) => {
					if (isApp()) {
						this.showTerms("terms")
						e.preventDefault()
					}
				}
			}, lang.get("termsAndConditionsLink_label"))),
			m("div", m(`a[href=${lang.getInfoLink("privacy_link")}][target=_blank]`, {
				onclick: (e) => {
					if (isApp()) {
						this.showTerms("privacy")
						e.preventDefault()
					}
				}
			}, lang.get("privacyLink_label")))
		])
		this._confirmAge = new Checkbox(() => [
			m("div", lang.get("ageConfirmation_msg"))
		])
		this._confirmStatus = this._confirm.checked.map(checked => {
			if (!checked) {
				return {type: "neutral", text: "termsAcceptedNeutral_msg"}
			} else {
				return {type: "valid", text: "emptyString_msg"}
			}
		})
	}

	view(vnode: Vnode<WizardPageAttrs<UpgradeSubscriptionData>>): Children {
		const a = vnode.attrs
		const newAccountData = a.data.newAccountData

		let _createAccount = () => {
			let errorMessageId = this._mailAddressForm.getErrorMessageId() || this._passwordForm.getErrorMessageId()
				|| ((this._confirmStatus().type !== "valid") ? this._confirmStatus().text : null)
			if (errorMessageId) {
				Dialog.error(errorMessageId)
				return
			}

			let p = Promise.resolve(true)
			if (!this._confirmAge.checked()) {
				p = Dialog.confirm("parentConfirmation_msg", "paymentDataValidation_action")
			}

			p.then(confirmed => {
				if (confirmed) {
					return this._signup(a.data, vnode.dom, this._mailAddressForm.getCleanMailAddress(), this._passwordForm.getNewPassword(), this._codeField.value(), a.data.campaign)
				}
			})
		}

		return m("#signup-account-dialog.flex-center", m(".flex-grow-shrink-auto.max-width-m.pt.pb.plr-l", [
				newAccountData
					? m("div", [
						m(TextFieldN, {
							label: 'mailAddress_label',
							value: stream(newAccountData.mailAddress),
							disabled: true
						}),
						m(".mt-l.mb-l", m(ButtonN, {
							label: 'next_action',
							type: ButtonType.Login,
							click: () => emitWizardEvent(vnode.dom, WizardEventType.SHOWNEXTPAGE)
						}))
					])
					: m("div", [
						m(this._mailAddressForm),
						m(this._passwordForm),
						(getWhitelabelRegistrationDomains().length > 0) ? m(this._codeField) : null,
						m(this._confirm),
						m(this._confirmAge),
						m(".mt-l.mb-l", m(ButtonN, {
							label: "next_action",
							click: () => _createAccount(),
							type: ButtonType.Login,
						})),
					])
			])
		)
	}

	/**
	 * @return Signs the user up, if no captcha is needed or it has been solved correctly
	 */
	_signup(data: UpgradeSubscriptionData, dom: HTMLElement, mailAddress: string, pw: string, registrationCode: string, campaign: ?string): Promise<void> {
		return showWorkerProgressDialog("createAccountRunning_msg", worker.generateSignupKeys().then(keyPairs => {
			return this._runCaptcha(data, mailAddress, campaign).then(regDataId => {
				if (regDataId) {
					return worker.signup(keyPairs, AccountType.FREE, regDataId, mailAddress, pw, registrationCode, lang.code)
					             .then((recoverCode) => {
						             deleteCampaign()
						             data.newAccountData = {
							             mailAddress,
							             password: pw,
							             recoverCode
						             }
						             emitWizardEvent(dom, WizardEventType.SHOWNEXTPAGE)
					             })
				}
			})
		})).catch(InvalidDataError, e => {
			Dialog.error("invalidRegistrationCode_msg")
		})
	}

	/**
	 * @returns the auth token for the signup if the captcha was solved or no captcha was necessary, null otherwise
	 */
	_runCaptcha(wizardData: UpgradeSubscriptionData, mailAddress: string, campaignToken: ?string): Promise<?string> {
		let data = createRegistrationCaptchaServiceGetData()
		data.token = campaignToken
		data.mailAddress = mailAddress
		data.signupToken = deviceConfig.getSignupToken()
		data.businessUseSelected = wizardData.options.businessUse()
		data.paidSubscriptionSelected = wizardData.type !== SubscriptionType.Free
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
											this._runCaptcha(wizardData, mailAddress, campaignToken).then(regDataId => {
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

	/**
	 * Notifies the current view about changes of the url within its scope.
	 */
	updateUrl(args: Object) {
	}


	showTerms(section: string) {
		asyncImport(typeof module !== "undefined"
			? module.id : __moduleName, `${env.rootPathPrefix}src/subscription/terms.js`)
			.then(terms => {
				let dialog: Dialog
				let visibleLang = lang.code
				let sanitizedTerms: string
				let headerBarAttrs: DialogHeaderBarAttrs = {
					left: [
						{
							label: () => "EN/DE",
							click: () => {
								visibleLang = visibleLang === "de" ? "en" : "de"
								sanitizedTerms = htmlSanitizer.sanitize(terms[section + "_" + visibleLang], false).text
								m.redraw()
							},
							type: ButtonType.Secondary
						}
					],
					right: [{label: 'ok_action', click: () => dialog.close(), type: ButtonType.Primary}]
				}

				sanitizedTerms = htmlSanitizer.sanitize(terms[section + "_" + visibleLang], false).text
				dialog = Dialog.largeDialog(headerBarAttrs, {
					view: () => m(".text-break", m.trust(sanitizedTerms))
				}).show()
			})
	}
}

export class SignupPageAttrs implements WizardPageAttrs<UpgradeSubscriptionData> {

	data: UpgradeSubscriptionData

	constructor(signupData: UpgradeSubscriptionData) {
		this.data = signupData
	}

	headerTitle(): string {
		return lang.get("subscription_label")
	}

	nextAction(showErrorDialog: boolean): Promise<boolean> {
		// next action not available for this page
		return Promise.resolve(true)
	}

	isSkipAvailable(): boolean {
		return false
	}

	isEnabled(): boolean {
		return true
	}
}
