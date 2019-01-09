// @flow
import m from "mithril"
import stream from "mithril/stream/stream.js"
import {lang} from "../misc/LanguageViewModel"
import type {UpgradeSubscriptionData} from "./UpgradeSubscriptionWizard"
import {deleteCampaign} from "./UpgradeSubscriptionWizard"
import type {WizardPage, WizardPageActionHandler} from "../gui/base/WizardDialog"
import {SelectMailAddressForm} from "../settings/SelectMailAddressForm"
import {Checkbox} from "../gui/base/Checkbox"
import {isApp, isTutanotaDomain} from "../api/Env"
import {Button, ButtonType} from "../gui/base/Button"
import {getWhitelabelRegistrationDomains} from "../login/LoginView"
import {Dialog, DialogType} from "../gui/base/Dialog"
import {TextField} from "../gui/base/TextField"
import {PasswordForm} from "../settings/PasswordForm"
import {ButtonN} from "../gui/base/ButtonN"
import {AccountType, TUTANOTA_MAIL_ADDRESS_DOMAINS} from "../api/common/TutanotaConstants"
import {SysService} from "../api/entities/sys/Services"
import {worker} from "../api/main/WorkerClient"
import {AccessDeactivatedError, AccessExpiredError, InvalidDataError} from "../api/common/error/RestError"
import {asyncImport, neverNull} from "../api/common/utils/Utils"
import {htmlSanitizer} from "../misc/HtmlSanitizer"
import {HttpMethod} from "../api/common/EntityFunctions"
import {serviceRequest, serviceRequestVoid} from "../api/main/Entity"
import {RegistrationCaptchaServiceReturnTypeRef} from "../api/entities/sys/RegistrationCaptchaServiceReturn"
import {showProgressDialog} from "../gui/base/ProgressDialog"
import {DialogHeaderBar} from "../gui/base/DialogHeaderBar"
import {uint8ArrayToBase64} from "../api/common/utils/Encoding"
import {createRegistrationCaptchaServiceData} from "../api/entities/sys/RegistrationCaptchaServiceData"
import {TextFieldN} from "../gui/base/TextFieldN"
import {createRegistrationCaptchaServiceGetData} from "../api/entities/sys/RegistrationCaptchaServiceGetData"


export class SignupPage implements WizardPage<UpgradeSubscriptionData> {
	view: Function;
	_pageActionHandler: WizardPageActionHandler<UpgradeSubscriptionData>;
	_upgradeData: UpgradeSubscriptionData;


	constructor(upgradeData: UpgradeSubscriptionData) {
		this._upgradeData = upgradeData

		let mailAddressForm = new SelectMailAddressForm(isTutanotaDomain() ? TUTANOTA_MAIL_ADDRESS_DOMAINS : getWhitelabelRegistrationDomains())
		let passwordForm = new PasswordForm(false, true, true, "passwordImportance_msg")
		let codeField = new TextField("whitelabelRegistrationCode_label")

		let confirm = new Checkbox(() => [
			m("div", lang.get("termsAndConditions_label")),

			m("div", m(`a[href=${this._getTermsLink()}][target=_blank]`, {
				onclick: (e) => {
					if (isApp()) {
						this.showTerms("terms")
						e.preventDefault()
					}
				}
			}, lang.get("termsAndConditionsLink_label"))),
			m("div", m(`a[href=${this._getPrivacyLink()}][target=_blank]`, {
				onclick: (e) => {
					if (isApp()) {
						this.showTerms("privacy")
						e.preventDefault()
					}
				}
			}, lang.get("privacyLink_label")))
		])
		let confirmAge = new Checkbox(() => [
			m("div", lang.get("ageConfirmation_msg"))
		])
		let confirmStatus = confirm.checked.map(checked => {
			if (!checked) {
				return {type: "neutral", text: "termsAcceptedNeutral_msg"}
			} else {
				return {type: "valid", text: "emptyString_msg"}
			}
		})

		let _createAccount = () => {
			let errorMessageId = mailAddressForm.getErrorMessageId() || passwordForm.getErrorMessageId()
				|| ((confirmStatus().type !== "valid") ? confirmStatus().text : null)
			if (errorMessageId) {
				Dialog.error(errorMessageId)
				return
			}

			let p = Promise.resolve(true)
			if (!confirmAge.checked()) {
				p = Dialog.confirm("parentConfirmation_msg", "paymentDataValidation_action")
			}

			p.then(confirmed => {
				if (confirmed) {
					return this._signup(mailAddressForm.getCleanMailAddress(), passwordForm.getNewPassword(), codeField.value(), this._upgradeData.campaign)
				}
			})
		}

		let signupButton = new Button('next_action', () => _createAccount()).setType(ButtonType.Login)

		this.view = (): VirtualElement => {
			const newAccountData = this._upgradeData.newAccountData
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
								click: () => this._pageActionHandler.showNext(this._upgradeData)
							}))
						])
						: m("div", [
							m(mailAddressForm),
							m(passwordForm),
							(getWhitelabelRegistrationDomains().length > 0) ? m(codeField) : null,
							m(confirm),
							m(confirmAge),
							m(".mt-l.mb-l", m(signupButton)),
						])
				])
			)
		}

	}

	headerTitle(): string {
		return lang.get("subscription_label")
	}

	nextAction(): Promise<?UpgradeSubscriptionData> {
		// next action not available for this page
		return Promise.resolve(null)
	}

	isNextAvailable() {
		return false
	}

	setPageActionHandler(handler: WizardPageActionHandler<UpgradeSubscriptionData>) {
		this._pageActionHandler = handler
	}

	updateWizardData(wizardData: UpgradeSubscriptionData) {
		this._upgradeData = wizardData
	}

	getUncheckedWizardData(): UpgradeSubscriptionData {
		return this._upgradeData
	}


	_getTermsLink() {
		return (lang.code === "de" || lang.code === "de_sie") ?
			"https://tutanota.com/de/terms#terms-free" : "https://tutanota.com/terms#terms-free"
	}

	_getPrivacyLink() {
		return (lang.code === "de" || lang.code === "de_sie") ?
			"https://tutanota.com/de/terms#privacy" : "https://tutanota.com/terms#privacy"
	}


	/**
	 * @return Signs the user up, if no captcha is needed or it has been solved correctly
	 */
	_signup(mailAddress: string, pw: string, registrationCode: string, campaign: ?string): Promise<void> {
		return showProgressDialog("createAccountRunning_msg", worker.generateSignupKeys().then(keyPairs => {
			return this._runCaptcha(mailAddress, campaign).then(regDataId => {
				if (regDataId) {
					return worker.signup(keyPairs, AccountType.FREE, regDataId, mailAddress, pw, registrationCode, lang.code)
					             .then((recoverCode) => {
						             deleteCampaign()
						             this._upgradeData.newAccountData = {
							             mailAddress,
							             password: pw,
							             recoverCode
						             }
						             this._pageActionHandler.showNext(this._upgradeData)
					             })
				}
			})
		}), true)
	}

	/**
	 * @returns the auth token for the signup if the captcha was solved or no captcha was necessary, null otherwise
	 */
	_runCaptcha(mailAddress: string, campaignToken: ?string): Promise<?string> {
		let data = createRegistrationCaptchaServiceGetData()
		data.token = campaignToken
		data.mailAddress = mailAddress
		return serviceRequest(SysService.RegistrationCaptchaService, HttpMethod.GET, data, RegistrationCaptchaServiceReturnTypeRef)
			.then(captchaReturn => {
				let regDataId = captchaReturn.token
				if (captchaReturn.challenge) {
					return Promise.fromCallback(callback => {
						let captchaInput = new TextField(() => lang.get("captchaInput_label") + ' (hh:mm)', () => lang.get("captchaInfo_msg"))
						let actionBar = new DialogHeaderBar()
						let dialog = new Dialog(DialogType.EditSmall, {
							view: (): Children => [
								m(".dialog-header.plr-l", m(actionBar)),
								m(".plr-l.pb", [
									m("img.mt-l", {
										src: "data:image/png;base64," + uint8ArrayToBase64(neverNull(captchaReturn.challenge)),
										alt: lang.get("captchaDisplay_label")
									}),
									m(captchaInput)
								])
							]
						})

						let cancelAction = () => {
							dialog.close()
							callback(null)
						}
						actionBar.addLeft(new Button("cancel_action", cancelAction).setType(ButtonType.Secondary))
						actionBar.addRight(new Button("ok_action", () => {
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
											this._runCaptcha(mailAddress, campaignToken).then(regDataId => {
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
						}).setType(ButtonType.Primary))
						         .setMiddle(() => lang.get("captchaDisplay_label"))
						dialog.setCloseHandler(cancelAction)
						dialog.show()
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
			? module.id : __moduleName, `${env.rootPathPrefix}src/register/terms.js`)
			.then(terms => {
				let visibleLang = lang.code
				let headerBar = new DialogHeaderBar()
				headerBar.addLeft(new Button(() => "EN/DE", () => {
					visibleLang = visibleLang === "de" ? "en" : "de"
					m.redraw()
				}).setType(ButtonType.Secondary))
				headerBar.setMiddle(() => "")
				         .addRight(new Button('ok_action', () => dialog.close()).setType(ButtonType.Primary))

				let sanitizedTerms = htmlSanitizer.sanitize(terms[section + "_" + visibleLang], false).text
				const dialog = Dialog.largeDialog(headerBar, {
					view: () => m(".text-break", m.trust(sanitizedTerms))
				})
				dialog.show()
			})
	}

	isEnabled(data: UpgradeSubscriptionData) {
		return true
	}
}