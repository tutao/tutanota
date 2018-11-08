//@flow
import m from "mithril"
import {assertMainOrNode, isApp, isTutanotaDomain} from "../api/Env"
import {ColumnWidth, Table} from "../gui/base/Table"
import {Button} from "../gui/base/Button"
import {createSecondFactor, SecondFactorTypeRef} from "../api/entities/sys/SecondFactor"
import {LazyLoaded} from "../api/common/utils/LazyLoaded"
import {Icons} from "../gui/base/icons/Icons"
import {erase, load, loadAll, setup} from "../api/main/Entity"
import {Dialog} from "../gui/base/Dialog"
import TableLine from "../gui/base/TableLine"
import {lang} from "../misc/LanguageViewModel"
import {U2fClient, U2fError} from "../misc/U2fClient"
import {TextField} from "../gui/base/TextField"
import {SecondFactorType} from "../api/common/TutanotaConstants"
import {DropDownSelector} from "../gui/base/DropDownSelector"
import stream from "mithril/stream/stream.js"
import {logins} from "../api/main/LoginController"
import {neverNull} from "../api/common/utils/Utils"
import {Icon, progressIcon} from "../gui/base/Icon"
import {theme} from "../gui/theme"
import {appIdToLoginDomain} from "../login/SecondFactorHandler"
import {contains} from "../api/common/utils/ArrayUtils"
import {worker} from "../api/main/WorkerClient"
import QRCode from "qrcode"
import {GroupInfoTypeRef} from "../api/entities/sys/GroupInfo"
import {NotFoundError} from "../api/common/error/RestError"
import {showProgressDialog} from "../gui/base/ProgressDialog"
import {openLinkNative} from "../native/SystemApp"
import {copyToClipboard} from "../misc/ClipboardUtils"
import {isUpdateForTypeRef} from "../api/main/EntityEventController"
import {htmlSanitizer} from "../misc/HtmlSanitizer"
import {ButtonType} from "../gui/base/ButtonN"
import * as RecoverCodeDialog from "./RecoverCodeDialog"

assertMainOrNode()

const VerificationStatus = {
	Progress: "Progress",
	Failed: "Failed",
	Success: "Success",
}

export class EditSecondFactorsForm {
	view: Function;
	_2FATable: Table;
	_user: LazyLoaded<User>;

	constructor(user: LazyLoaded<User>) {
		this._user = user
		let add2FAButton = new Button("addSecondFactor_action", () => this._showAddSecondFactorDialog(), () => Icons.Add)
		this._2FATable = new Table(["name_label", "type_label"], [
			ColumnWidth.Largest, ColumnWidth.Largest
		], true, add2FAButton)
		this.view = () => {
			return [
				m(".h4.mt-l", lang.get('secondFactorAuthentication_label')),
				m(this._2FATable),
				m("span.small", lang.get("moreInfo_msg") + " "),
				m("span.small.text-break", [m(`a[href=${this._get2FAInfoLink()}][target=_blank]`, this._get2FAInfoLink())]),
			]
		}
		this._updateSecondFactors()
	}

	_get2FAInfoLink(): string {
		return (lang.code === "de" || lang.code === "de_sie")
			? "https://tutanota.uservoice.com/knowledgebase/articles/1201945"
			: "https://tutanota.uservoice.com/knowledgebase/articles/1201942"
	}

	_updateSecondFactors(): void {
		this._user.getAsync().then(user => {
			loadAll(SecondFactorTypeRef, neverNull(user.auth).secondFactors).then(factors => {
				let differentDomainAppIds = factors.reduce((result, f) => {
					let u2f = f.type === SecondFactorType.u2f
					if (u2f && !contains(result, neverNull(f.u2f).appId)) {
						result.push(neverNull(f.u2f).appId)
					}
					return result
				}, [])
				let tableLines = factors.map(f => {
					let u2f = f.type === SecondFactorType.u2f
					let removeButton = new Button("remove_action", () => {
						Dialog.confirm("confirmDeleteSecondFactor_msg").then(confirmed => {
							if (confirmed) {
								showProgressDialog("pleaseWait_msg", erase(f)
									.catch(NotFoundError, e =>
										console.log("could not delete second factor (has already been deleted)", e)))
							}
						})
					}, () => Icons.Cancel)
					let domainInfo = ""
					if (u2f && differentDomainAppIds.length > 1) {
						domainInfo = ((f.name.length > 0) ? " - " : "") + appIdToLoginDomain(neverNull(f.u2f).appId)
					}
					return new TableLine([
						f.name + domainInfo, lang.get(SecondFactorTypeToNameTextId[f.type])
					], logins.getUserController().isGlobalOrLocalAdmin() ? removeButton : null)
				})
				this._2FATable.updateEntries(tableLines)
			})
		})
	}


	/** see https://github.com/google/google-authenticator/wiki/Key-Uri-Format */
	_getOtpAuthUrl(secret: string): Promise<string> {
		return this._user.getAsync().then(user => {
			return load(GroupInfoTypeRef, user.userGroup.groupInfo).then(userGroupInfo => {
				let otpAuthUrlPrefix = "otpauth://totp/"
				let issuer = isTutanotaDomain() ? "Tutanota" : location.hostname
				let account = encodeURI(issuer + ":" + neverNull(userGroupInfo.mailAddress))
				let cleanSecret = secret.replace(/ /g, "")
				return otpAuthUrlPrefix + account + "?secret=" + cleanSecret + "&issuer=" + issuer
					+ "&algorithm=SHA1&digits=6&period=30"
			})
		})
	}

	_showAddSecondFactorDialog() {
		let u2f = new U2fClient()
		let totpPromise = worker.generateTotpSecret()
		let u2fSupportPromise = u2f.isSupported()
		let userPromise = this._user.getAsync()
		showProgressDialog("pleaseWait_msg", Promise.all([totpPromise, u2fSupportPromise, userPromise]))
			.spread((totpKeys, u2fSupport, user) => {
				let type = new DropDownSelector("type_label", null,
					Object.keys(SecondFactorTypeToNameTextId)
					      .filter(k => (k === SecondFactorType.u2f && !u2fSupport) ? false : true)
					      .map(key => {
						      return {
							      name: lang.get(SecondFactorTypeToNameTextId[key]),
							      value: key
						      }
					      }), stream(u2fSupport ? SecondFactorType.u2f : SecondFactorType.totp), 300)
				let name = new TextField("name_label", () => lang.get("secondFactorNameInfo_msg"))
				let u2fRegistrationData = stream(null)

				let totpSecret = new TextField("totpSecret_label",
					() => lang.get(isApp() ? "totpTransferSecretApp_msg" : "totpTransferSecret_msg"))
					.setDisabled()
				totpSecret.value(totpKeys.readableKey)
				let button = new Button("copy_action",
					() => copyToClipboard(totpKeys.readableKey),
					() => Icons.Copy
				)
				totpSecret._injectionsRight = () => m(button)
				let totpQRCodeSvg
				let authUrl
				this._getOtpAuthUrl(totpKeys.readableKey).then(optAuthUrl => {
					if (!isApp()) {
						let qrcodeGenerator = new QRCode({
							height: 150,
							width: 150,
							content: optAuthUrl
						})
						totpQRCodeSvg = htmlSanitizer.sanitize(qrcodeGenerator.svg(), false).text
					}
					authUrl = optAuthUrl
				})

				let totpCode = new TextField("totpCode_label")
				let openTOTPApp = new Button("addOpenOTPApp_action", () => {
					openLinkNative(authUrl).then(successful => {
						if (!successful) {
							Dialog.error("noAppAvailable_msg")
						}
					})
				}).setType(ButtonType.Login)

				let verificationStatus = stream(VerificationStatus.Progress)
				verificationStatus.map(() => m.redraw())
				u2fRegistrationData.map(registrationData => {
					if (registrationData) {
						verificationStatus(VerificationStatus.Success)
					} else {
						verificationStatus(VerificationStatus.Progress)
					}
				})
				totpCode.value.map(v => {
					let cleanedValue = v.replace(/ /g, "")
					if (cleanedValue.length === 6) {
						worker.generateTotpCode(Math.floor(new Date().getTime() / 1000 / 30), totpKeys.key)
						      .then(number => {
							      if (number === Number(cleanedValue)) {
								      verificationStatus(VerificationStatus.Success)
							      } else {
								      verificationStatus(VerificationStatus.Failed)
							      }
						      })
					} else {
						verificationStatus(VerificationStatus.Progress)
					}
				})

				function statusIcon() {
					if (verificationStatus() === VerificationStatus.Progress) {
						return progressIcon()
					} else if (verificationStatus() === VerificationStatus.Success) {
						return m(Icon, {
							icon: Icons.Checkmark,
							large: true,
							style: {fill: theme.content_accent}
						})
					} else {
						return m(Icon, {
							icon: Icons.Cancel,
							large: true,
							style: {fill: theme.content_accent}
						})
					}
				}

				let saveAction = () => {
					let sf = createSecondFactor()
					sf._ownerGroup = user._ownerGroup
					sf.name = name.value()
					sf.type = type.selectedValue()
					if (type.selectedValue() === SecondFactorType.u2f) {
						if (verificationStatus() !== VerificationStatus.Success) {
							Dialog.error("unrecognizedU2fDevice_msg")
							return
						} else {
							sf.u2f = u2fRegistrationData()
						}
					} else if (type.selectedValue() === SecondFactorType.totp) {
						if (verificationStatus() !== VerificationStatus.Success) {
							Dialog.error("totpCodeEnter_msg")
							return
						} else {
							sf.otpSecret = totpKeys.key
						}
					}
					showProgressDialog("pleaseWait_msg", setup(neverNull(user.auth).secondFactors, sf))
						.then(() => dialog.close())
						.then(() => this._showRecoveryInfoDialog(user))
				}

				function statusMessage() {
					if (type.selectedValue() === SecondFactorType.u2f) {
						return verificationStatus()
						=== VerificationStatus.Success ? lang.get("registeredU2fDevice_msg") : lang.get("registerU2fDevice_msg")
					} else {
						if (verificationStatus() === VerificationStatus.Success) {
							return lang.get("totpCodeConfirmed_msg")
						} else if (verificationStatus() === VerificationStatus.Failed) {
							return lang.get("totpCodeWrong_msg")
						} else {
							return lang.get("totpCodeEnter_msg")
						}
					}
				}

				let dialog = Dialog.showActionDialog({
					title: lang.get("add_action"),
					child: {
						view: () => [
							m(type),
							m(name),
							type.selectedValue() === SecondFactorType.totp ? m(".mb", [
								m(totpSecret),
								isApp() ? m(".pt", m(openTOTPApp)) : m(".flex-center", m.trust(totpQRCodeSvg)), // sanitized above
								m(totpCode)
							]) : null,
							m("p.flex.items-center", [m(".mr-s", statusIcon()), m("", statusMessage())]),
							m(".small", lang.get("secondFactorInfoOldClient_msg"))
						]
					},
					okAction: saveAction,
					allowCancel: true,
					okActionTextId: "save_action"
				})

				function registerResumeOnTimeout() {
					u2f.register()
					   .catch((e) => {
						   if (e instanceof U2fError) {
							   Dialog.error("u2fUnexpectedError_msg").then(() => {
								   if (dialog.visible) {
									   dialog.close()
								   }
							   })
						   } else {
							   registerResumeOnTimeout()
						   }
					   })
					   .then(registrationData => u2fRegistrationData(registrationData))
				}

				if (u2fSupport) registerResumeOnTimeout()
			})
	}


	entityEventReceived(update: EntityUpdateData): void {
		if (isUpdateForTypeRef(SecondFactorTypeRef, update)) {
			this._updateSecondFactors()
		}
	}

	_showRecoveryInfoDialog(user: User) {
		const isRecoverCodeAvailable = user.auth && user.auth.recoverCode != null
		Dialog.showActionDialog({
			title: "Recovery code",
			child: {
				view: () => m(".pt", lang.get("recoverCode_msg"))
			},
			okAction: (dialog) => {
				dialog.close()
				RecoverCodeDialog.show(isRecoverCodeAvailable ? "get" : "create", false)
			},
			okActionTextId: isRecoverCodeAvailable ? "show_action" : "setUp_action"
		})
	}
}

const SecondFactorTypeToNameTextId = {
	[SecondFactorType.u2f]: "u2fSecurityKey_label",
	[SecondFactorType.totp]: "totpAuthenticator_label"
}