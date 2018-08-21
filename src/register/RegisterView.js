// @flow
import m from "mithril"
import {worker} from "../api/main/WorkerClient"
import {assertMainOrNode, isTutanotaDomain} from "../api/Env"
import {TextField} from "../gui/base/TextField"
import {Button, ButtonType} from "../gui/base/Button"
import {lang} from "../misc/LanguageViewModel"
import {TUTANOTA_MAIL_ADDRESS_DOMAINS, AccountType} from "../api/common/TutanotaConstants"
import {SysService} from "../api/entities/sys/Services"
import {HttpMethod} from "../api/common/EntityFunctions"
import {AccessDeactivatedError, InvalidDataError, AccessExpiredError} from "../api/common/error/RestError"
import {serviceRequest, serviceRequestVoid} from "../api/main/Entity"
import {Checkbox} from "../gui/base/Checkbox"
import {RegistrationCaptchaServiceReturnTypeRef} from "../api/entities/sys/RegistrationCaptchaServiceReturn"
import {Dialog, DialogType} from "../gui/base/Dialog"
import {uint8ArrayToBase64} from "../api/common/utils/Encoding"
import {neverNull} from "../api/common/utils/Utils"
import {DialogHeaderBar} from "../gui/base/DialogHeaderBar"
import {createRegistrationCaptchaServiceData} from "../api/entities/sys/RegistrationCaptchaServiceData"
import {SelectMailAddressForm} from "../settings/SelectMailAddressForm"
import {PasswordForm} from "../settings/PasswordForm"
import {themeId} from "../gui/theme"
import {deviceConfig} from "../misc/DeviceConfig"
import {ExpanderButton, ExpanderPanel} from "../gui/base/Expander"
import {showProgressDialog} from "../gui/base/ProgressDialog"
import {getWhitelabelRegistrationDomains} from "../login/LoginView"
import {windowFacade} from "../misc/WindowFacade"

assertMainOrNode()

export class RegisterView {
	view: Function;
	isRegisterView: boolean; // just a static value to let app.js notice this view as the register view

	constructor() {
		let mailAddressForm = new SelectMailAddressForm(isTutanotaDomain() ? TUTANOTA_MAIL_ADDRESS_DOMAINS : getWhitelabelRegistrationDomains())
		let passwordForm = new PasswordForm(false, true, true, "passwordImportance_msg")
		let codeField = new TextField("whitelabelRegistrationCode_label")

		let confirm = new Checkbox(() => [
			m("div", lang.get("termsAndConditions_label")),
			m("div", m(`a[href=${this._getTermsLink()}][target=_blank]`, lang.get("termsAndConditionsLink_label"))),
			m("div", m(`a[href=${this._getPrivacyLink()}][target=_blank]`, lang.get("privacyLink_label")))
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
					let authToken = m.route.param()['authToken']
					if (!authToken) {
						this._signup(mailAddressForm.getCleanMailAddress(), passwordForm.getNewPassword(), codeField.value())
					} else {
						// FIXME
					}
				}
			})
		}

		let signupButton = new Button('createAccount_action', () => _createAccount()).setType(ButtonType.Login)

		let themeSwitch = new Button("switchColorTheme_action", () => {
			switch (themeId()) {
				case 'light':
					return deviceConfig.setTheme('dark')
				case 'dark':
					return deviceConfig.setTheme('light')
			}
		}).setType(ButtonType.Secondary)

		let login = new Button('login_label', () => m.route.set('/login?noAutoLogin=true')).setType(ButtonType.Secondary)

		let panel = {
			view: () => m(".flex-center.flex-column", [
				m(login),
				m(themeSwitch)
			])
		}

		let optionsExpander = new ExpanderButton('more_label', new ExpanderPanel(panel), false)

		let bottomMargin = 0
		const keyboardListener = (keyboardSize) => {
			bottomMargin = keyboardSize
			m.redraw()
		}

		this.view = (): VirtualElement => {
			return m(".main-view.flex-center.scroll.pt-responsive",{
					oncreate: () => windowFacade.addKeyboardSizeListener(keyboardListener),
					onremove: () => windowFacade.removeKeyboardSizeListener(keyboardListener),
					style : {
						marginBottom: bottomMargin + "px"
					}
				}, m(".flex-grow-shrink-auto.max-width-m.pt.pb.plr-l", [
					m("div", [
						m(mailAddressForm),
						m(passwordForm),
						(getWhitelabelRegistrationDomains().length > 0) ? m(codeField) : null,
						m(confirm),
						m(confirmAge),
						m(".mt-l.mb-l", m(signupButton)),
						m(".flex-center", [
							m(optionsExpander),
						]),
						m(".pb-l", [
							m(optionsExpander.panel),
						]),
					])
				])
			)
		}
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
	_signup(mailAddress: string, pw: string, registrationCode: string): Promise<void> {
		return this._requestCaptcha().then(captchaReturn => {
			let authToken = captchaReturn.token
			if (captchaReturn.challenge) {
				return new CaptchaDialog(this, captchaReturn).solveCaptcha().then(captchaReturn => {
					if (captchaReturn) return captchaReturn.token
				})
			} else {
				return authToken
			}
		}).then(authToken => {
			if (authToken) {
				return showProgressDialog("createAccountRunning_msg", worker.signup(AccountType.FREE, authToken, mailAddress, pw, registrationCode, lang.code), true)
					.then(() => {
						m.route.set("/login?loginWith=" + mailAddress)
					})
			}
		}).catch(AccessDeactivatedError, e => Dialog.error("createAccountAccessDeactivated_msg"))
		           .catch(InvalidDataError, e => Dialog.error("invalidRegistrationCode_msg"))
	}

	_requestCaptcha(): Promise<RegistrationCaptchaServiceReturn> {
		return showProgressDialog("loading_msg", serviceRequest(SysService.RegistrationCaptchaService, HttpMethod.GET, null, RegistrationCaptchaServiceReturnTypeRef))
	}

	/**
	 * Notifies the current view about changes of the url within its scope.
	 */
	updateUrl(args: Object) {
	}
}

class CaptchaDialog {
	dialog: Dialog;
	captchaReturn: RegistrationCaptchaServiceReturn;
	callback: Callback;

	constructor(registerView: RegisterView, captchaReturn: RegistrationCaptchaServiceReturn) {
		this.captchaReturn = captchaReturn
		let captchaInput = new TextField(() => lang.get("captchaInput_label")
			+ ' (hh:mm)', () => lang.get("captchaInfo_msg"))

		this.dialog = new Dialog(DialogType.EditSmall, {
			view: (): Children => [
				m(".dialog-header.plr-l", m(actionBar)),
				m(".plr-l.pb", [
					m("img.mt-l", {
						src: "data:image/png;base64," + uint8ArrayToBase64(neverNull(this.captchaReturn.challenge)),
						alt: lang.get("captchaDisplay_label")
					}),
					m(captchaInput)
				])
			]
		})

		let actionBar = new DialogHeaderBar()
		let cancelAction = () => {
			this.dialog.close()
			this.callback(null, null)
		}
		actionBar.addLeft(new Button("cancel_action", cancelAction).setType(ButtonType.Secondary))
		actionBar.addRight(new Button("ok_action", () => {
			let captchaTime = captchaInput.value().trim()
			if (captchaTime.match(/^[0-2][0-9]:[0-5][05]$/) && Number(captchaTime.substr(0, 2)) < 24) {
				let data = createRegistrationCaptchaServiceData()
				data.token = this.captchaReturn.token
				data.response = captchaTime
				showProgressDialog("loading_msg", serviceRequestVoid(SysService.RegistrationCaptchaService, HttpMethod.POST, data))
					.then(() => {
						this.dialog.close()
						this.callback(null, this.captchaReturn)
					})
					.catch(InvalidDataError, e => {
						registerView._requestCaptcha().then(captchaReturn => {
							this.captchaReturn = captchaReturn
							Dialog.error("createAccountInvalidCaptcha_msg")
						}).catch(e => {
							this.dialog.close()
							this.callback(e)
						})
					})
					.catch(AccessExpiredError, e => {
						Dialog.error("createAccountAccessDeactivated_msg")
						this.dialog.close()
						this.callback(null, null)
					})
					.catch(e => {
						this.dialog.close()
						this.callback(e, null)
					})
			} else {
				Dialog.error("captchaEnter_msg")
			}
		}).setType(ButtonType.Primary))
		         .setMiddle(() => lang.get("captchaDisplay_label"))
		this.dialog.setCloseHandler(cancelAction)
	}

	/**
	 * returns the authToken, after the captcha has been solved
	 */
	solveCaptcha(): Promise<?RegistrationCaptchaServiceReturn> {
		return Promise.fromCallback(callback => {
			this.callback = callback
			this.dialog.show()
		})
	}

}