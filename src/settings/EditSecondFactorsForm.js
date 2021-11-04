//@flow
import m from "mithril"
import {assertMainOrNode, isApp, isTutanotaDomain} from "../api/common/Env"
import {createSecondFactor, SecondFactorTypeRef} from "../api/entities/sys/SecondFactor"
import {LazyLoaded} from "@tutao/tutanota-utils"
import {Icons} from "../gui/base/icons/Icons"
import {erase, load, loadAll, setup} from "../api/main/Entity"
import {Dialog, DialogType} from "../gui/base/Dialog"
import {lang} from "../misc/LanguageViewModel"
import {U2fClient} from "../misc/U2fClient"
import {GroupType, SecondFactorType} from "../api/common/TutanotaConstants"
import stream from "mithril/stream/stream.js"
import {logins} from "../api/main/LoginController"
import {neverNull} from "@tutao/tutanota-utils"
import {Icon, progressIcon} from "../gui/base/Icon"
import {theme} from "../gui/theme"
import {appIdToLoginDomain} from "../misc/SecondFactorHandler"
import {contains} from "@tutao/tutanota-utils"
import QRCode from "qrcode"
import {GroupInfoTypeRef} from "../api/entities/sys/GroupInfo"
import {showProgressDialog} from "../gui/dialogs/ProgressDialog"
import {copyToClipboard} from "../misc/ClipboardUtils"
import {htmlSanitizer} from "../misc/HtmlSanitizer"
import type {ButtonAttrs} from "../gui/base/ButtonN"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import * as RecoverCodeDialog from "./RecoverCodeDialog"
import type {TableAttrs, TableLineAttrs} from "../gui/base/TableN"
import {ColumnWidth, TableN} from "../gui/base/TableN"
import {NotFoundError} from "../api/common/error/RestError"
import type {TextFieldAttrs} from "../gui/base/TextFieldN"
import {TextFieldN} from "../gui/base/TextFieldN"
import type {DropDownSelectorAttrs} from "../gui/base/DropDownSelectorN"
import {DropDownSelectorN} from "../gui/base/DropDownSelectorN"
import type {EntityUpdateData} from "../api/main/EventController"
import {isUpdateForTypeRef} from "../api/main/EventController"
import type {User} from "../api/entities/sys/User"
import {getEtId, isSameId} from "../api/common/utils/EntityUtils";
import {ifAllowedTutanotaLinks} from "../gui/base/GuiUtils"
import {ofClass} from "@tutao/tutanota-utils"
import {locator} from "../api/main/MainLocator"

assertMainOrNode()

const VerificationStatus = Object.freeze({
	Initial: "Initial",
	Progress: "Progress",
	Failed: "Failed",
	Success: "Success",
})

type VerificationStatusEnum = $Values<typeof VerificationStatus>

const SecondFactorTypeToNameTextId = {
	[SecondFactorType.totp]: "totpAuthenticator_label",
	[SecondFactorType.u2f]: "u2fSecurityKey_label",
}

export class EditSecondFactorsForm {
	_2FALineAttrs: Stream<TableLineAttrs[]>;
	_user: LazyLoaded<User>

	constructor(user: LazyLoaded<User>) {
		this._2FALineAttrs = stream([])
		this._2FALineAttrs.map(m.redraw)
		this._user = user
		this._updateSecondFactors()
	}

	view(): Children {
		const secondFactorTableAttrs: TableAttrs = {
			columnHeading: ["name_label", "type_label"],
			columnWidths: [ColumnWidth.Largest, ColumnWidth.Largest],
			lines: this._2FALineAttrs(),
			showActionButtonColumn: true,
			addButtonAttrs: {
				label: "addSecondFactor_action",
				click: () => this._showAddSecondFactorDialog(),
				icon: () => Icons.Add
			},
		}

		return [
			m(".h4.mt-l", lang.get('secondFactorAuthentication_label')),
			m(TableN, secondFactorTableAttrs),
			isTutanotaDomain()
				? [
					m("span.small", lang.get("moreInfo_msg") + " "),
					ifAllowedTutanotaLinks("2FA_link", link => m("span.small.text-break", [m(`a[href=${link}][target=_blank]`, link)]))
				]
				: null
		]
	}

	_updateSecondFactors(): Promise<void> {
		return this._user.getAsync()
		           .then(user => loadAll(SecondFactorTypeRef, neverNull(user.auth).secondFactors))
		           .then(factors => {

			           const differentDomainAppIds = factors.reduce((result, f) => {
				           const isU2F = f.type === SecondFactorType.u2f
				           if (isU2F && !contains(result, neverNull(f.u2f).appId)) {
					           result.push(neverNull(f.u2f).appId)
				           }
				           return result
			           }, [])

			           this._2FALineAttrs(factors.map(f => {
				           const isU2F = f.type === SecondFactorType.u2f
				           const removeButtonAttrs: ButtonAttrs = {
					           label: "remove_action",
					           click: () => Dialog
						           .confirm("confirmDeleteSecondFactor_msg")
						           .then(res => res ? showProgressDialog("pleaseWait_msg", erase(f)) : Promise.resolve())
						           .catch(ofClass(NotFoundError, e => console.log("could not delete second factor (already deleted)", e))),
					           icon: () => Icons.Cancel
				           }
				           const domainInfo = (isU2F && differentDomainAppIds.length > 1)
					           ? ((f.name.length > 0) ? " - " : "") + appIdToLoginDomain(neverNull(f.u2f).appId)
					           : ""
				           return {
					           cells: [f.name + domainInfo, lang.get(SecondFactorTypeToNameTextId[f.type])],
					           actionButtonAttrs: logins.getUserController().isGlobalOrLocalAdmin() ? removeButtonAttrs : null
				           }
			           }))
		           })
	}

	/** see https://github.com/google/google-authenticator/wiki/Key-Uri-Format */
	_getOtpAuthUrl(secret: string): Promise<string> {
		return this._user.getAsync()
		           .then(user => load(GroupInfoTypeRef, user.userGroup.groupInfo))
		           .then(userGroupInfo => {
			           let otpAuthUrlPrefix = "otpauth://totp/"
			           let issuer = isTutanotaDomain() ? "Tutanota" : location.hostname
			           let account = encodeURI(issuer + ":" + neverNull(userGroupInfo.mailAddress))
			           let cleanSecret = secret.replace(/ /g, "")
			           return otpAuthUrlPrefix + account + "?secret=" + cleanSecret + "&issuer=" + issuer
				           + "&algorithm=SHA1&digits=6&period=30"
		           })
	}

	_showAddSecondFactorDialog() {
		let u2f = new U2fClient()
		let totpPromise = locator.loginFacade.generateTotpSecret()
		let u2fSupportPromise = u2f.isSupported()
		let userPromise = this._user.getAsync()
		showProgressDialog("pleaseWait_msg", Promise.all([totpPromise, u2fSupportPromise, userPromise]))
			.then(([totpKeys, u2fSupport, user]) => {
				console.log("u2fSupport", u2fSupport)
				const nameValue: Stream<string> = stream("")
				const selectedType: Stream<string> = stream(SecondFactorType.totp)
				const totpCode: Stream<string> = stream("")
				let typeDropdownAttrs: DropDownSelectorAttrs<string> = {
					label: "type_label",
					selectedValue: selectedType,
					items: Object.keys(SecondFactorTypeToNameTextId)
					             .filter(k => (k !== SecondFactorType.u2f || u2fSupport))
						// Order them so that TOTP is the first
						         .sort((a, b) => Number(b) - Number(a))
						         .map(key => {
							         return {
								         name: lang.get(SecondFactorTypeToNameTextId[key]),
								         value: key
							         }
						         }),
					dropdownWidth: 300
				}

				const nameFieldAttrs: TextFieldAttrs = {
					label: "name_label",
					helpLabel: () => lang.get("secondFactorNameInfo_msg"),
					value: nameValue
				}

				const u2fRegistrationData = stream(null)

				const totpSecretFieldAttrs: TextFieldAttrs = {
					label: "totpSecret_label",
					helpLabel: () => lang.get(isApp() ? "totpTransferSecretApp_msg" : "totpTransferSecret_msg"),
					value: stream(totpKeys.readableKey),
					injectionsRight: () => m(ButtonN, copyButtonAttrs),
					disabled: true
				}
				const copyButtonAttrs: ButtonAttrs = {
					label: "copy_action",
					click: () => copyToClipboard(totpKeys.readableKey),
					icon: () => Icons.Clipboard
				}

				let totpQRCodeSvg
				let authUrl
				this._getOtpAuthUrl(totpKeys.readableKey).then(optAuthUrl => {
					if (!isApp()) {
						let qrcodeGenerator = new QRCode({height: 150, width: 150, content: optAuthUrl})
						totpQRCodeSvg = htmlSanitizer.sanitize(qrcodeGenerator.svg(), {blockExternalContent: false}).text
					}
					authUrl = optAuthUrl
				})

				const totpCodeAttrs: TextFieldAttrs = {
					label: "totpCode_label",
					value: totpCode
				}

				const openTOTPAppAttrs: ButtonAttrs = {
					label: "addOpenOTPApp_action",
					click: () => {
						import("../native/main/SystemApp").then(({openLinkNative}) => {
							return openLinkNative(authUrl).then(successful => {
								if (!successful) {
									Dialog.error("noAppAvailable_msg")
								}
							})
						})
					},
					type: ButtonType.Login
				}

				let verificationStatus = stream<VerificationStatusEnum>()
				selectedType.map((type) => {
					verificationStatus(type === SecondFactorType.u2f ? VerificationStatus.Initial : VerificationStatus.Progress)
				})
				verificationStatus.map(() => m.redraw())

				totpCode.map(async v => {
					let cleanedValue = v.replace(/ /g, "")
					if (cleanedValue.length === 6) {
						const expectedCode = Number(cleanedValue)
						const verificationResult = await this._tryCodes(expectedCode, totpKeys.key)
						verificationStatus(verificationResult)
					} else {
						return verificationStatus(VerificationStatus.Progress)
					}
				})

				function statusIcon(): ?Vnode<any> {
					switch (verificationStatus()) {
						case VerificationStatus.Progress:
							return progressIcon()
						case VerificationStatus.Success:
							return m(Icon, {
								icon: Icons.Checkmark,
								large: true,
								style: {fill: theme.content_accent}
							})
						case VerificationStatus.Failed:
							return m(Icon, {
								icon: Icons.Cancel,
								large: true,
								style: {fill: theme.content_accent}
							})
						default:
							return null
					}
				}

				let saveAction = () => {
					let p: Promise<void>
					if (selectedType() === SecondFactorType.u2f) {
						// Prevent starting in parallel
						if (verificationStatus() === VerificationStatus.Progress) {
							return
						}
						verificationStatus(VerificationStatus.Progress)
						p = u2f.register()
						       .then((result) => {
							       u2fRegistrationData(result)
							       verificationStatus(VerificationStatus.Success)
						       })
						       .catch(() => {
							       u2fRegistrationData(null)
							       verificationStatus(VerificationStatus.Failed)
						       })
					} else {
						p = Promise.resolve()
					}

					return p.then(() => {
						let sf = createSecondFactor()
						sf._ownerGroup = user._ownerGroup
						sf.name = nameValue()
						sf.type = selectedType()
						if (sf.type === SecondFactorType.u2f) {
							if (verificationStatus() !== VerificationStatus.Success) {
								Dialog.error("unrecognizedU2fDevice_msg")
								return
							} else {
								sf.u2f = u2fRegistrationData()
							}
						} else if (sf.type === SecondFactorType.totp) {
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
					})
				}

				function statusMessage() {
					if (selectedType() === SecondFactorType.u2f) {
						return verificationStatus() === VerificationStatus.Success
							? lang.get("registeredU2fDevice_msg")
							: lang.get("registerU2fDevice_msg")
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

				const dialog = Dialog.showActionDialog({
					title: lang.get("add_action"),
					allowOkWithReturn: true,
					child: {
						view: () => [
							m(DropDownSelectorN, typeDropdownAttrs),
							m(TextFieldN, nameFieldAttrs),
							selectedType() === SecondFactorType.totp
								? m(".mb", [
									m(TextFieldN, totpSecretFieldAttrs),
									isApp()
										? m(".pt", m(ButtonN, openTOTPAppAttrs))
										: m(".flex-center", m.trust(totpQRCodeSvg)), // sanitized above
									m(TextFieldN, totpCodeAttrs)
								])
								: null,
							// Only show progress for u2f because success/error will show another dialog
							selectedType() === SecondFactorType.u2f && verificationStatus() !== VerificationStatus.Progress
								? null
								: m("p.flex.items-center", [m(".mr-s", statusIcon()), m("", statusMessage())]),
						]
					},
					okAction: saveAction,
					allowCancel: true,
					okActionTextId: "save_action"
				})
			})
	}

	entityEventReceived(update: EntityUpdateData): Promise<void> {
		if (isUpdateForTypeRef(SecondFactorTypeRef, update)) {
			return this._updateSecondFactors()
		} else {
			return Promise.resolve()
		}
	}

	_showRecoveryInfoDialog(user: User) {
		// We only show the recovery code if it is for the current user and it is a global admin
		if (!isSameId(getEtId(logins.getUserController().user), getEtId(user))
			|| !user.memberships.find(gm => gm.groupType === GroupType.Admin)) {
			return
		}
		const isRecoverCodeAvailable = user.auth && user.auth.recoverCode != null
		Dialog.showActionDialog({
			title: lang.get("recoveryCode_label"),
			type: DialogType.EditMedium,
			child: () => m(".pt", lang.get("recoveryCode_msg")),
			allowOkWithReturn: true,
			okAction: (dialog) => {
				dialog.close()
				RecoverCodeDialog.showRecoverCodeDialogAfterPasswordVerification(isRecoverCodeAvailable ? "get" : "create", false)
			},
			okActionTextId: isRecoverCodeAvailable ? "show_action" : "setUp_action"
		})
	}

	async _tryCodes(expectedCode: number, key: Uint8Array): Promise<VerificationStatusEnum> {
		const {loginFacade} = locator
		const time = Math.floor(new Date().getTime() / 1000 / 30)

		// We try out 3 codes: current minute, 30 seconds before and 30 seconds after.
		// If at least one of them works, we accept it.

		const number = await loginFacade.generateTotpCode(time, key)
		if (number === expectedCode) {
			return VerificationStatus.Success
		}
		const number2 = await loginFacade.generateTotpCode(time - 1, key)
		if (number2 === expectedCode) {
			return VerificationStatus.Success
		}
		const number3 = await loginFacade.generateTotpCode(time + 1, key)
		if (number3 === expectedCode) {
			return VerificationStatus.Success
		}
		return VerificationStatus.Failed
	}
}
