//@flow
import m from "mithril"
import {assertMainOrNode, isTutanotaDomain} from "../api/Env"
import {Table, ColumnWidth} from "../gui/base/Table"
import {Button} from "../gui/base/Button"
import {SecondFactorTypeRef, createSecondFactor} from "../api/entities/sys/SecondFactor"
import {isSameTypeRef} from "../api/common/EntityFunctions"
import {LazyLoaded} from "../api/common/utils/LazyLoaded"
import {Icons} from "../gui/base/icons/Icons"
import {loadAll, erase, setup, load} from "../api/main/Entity"
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
import {progressIcon, Icon} from "../gui/base/Icon"
import {theme} from "../gui/theme"
import {appIdToLoginDomain} from "../login/SecondFactorHandler"
import {contains} from "../api/common/utils/ArrayUtils"
import {worker} from "../api/main/WorkerClient"
import QRCode from "qrcode"
import {GroupInfoTypeRef} from "../api/entities/sys/GroupInfo"

assertMainOrNode()

export class EditSecondFactorsForm {
	view: Function;
	_2FATable: Table;
	_user: LazyLoaded<User>;

	constructor(user: LazyLoaded<User>) {
		this._user = user
		let add2FAButton = new Button("addSecondFactor_action", () => this._showAddSecondFactorDialog(), () => Icons.Add)
		this._2FATable = new Table(["name_label", "type_label"], [ColumnWidth.Largest, ColumnWidth.Largest], true, add2FAButton)
		this.view = () => {
			return [
				m(".h4.mt-l", lang.get('secondFactorAuthentication_label')),
				m(this._2FATable),
				m("span.small", lang.get("moreInfo_msg") + " "),
				m("span.small", [m(`a[href=${this._get2FAInfoLink()}][target=_blank]`, this._get2FAInfoLink())]),
			]
		}
		this._updateSecondFactors()
	}

	_get2FAInfoLink(): string {
		return lang.code == "de" ? "https://tutanota.uservoice.com/knowledgebase/articles/1201945" : "https://tutanota.uservoice.com/knowledgebase/articles/1201942"
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
								Dialog.progress("pleaseWait_msg", erase(f))
							}
						})
					}, () => Icons.Cancel)
					let domainInfo = (differentDomainAppIds.length > 1) ? ( u2f && (f.name.length > 0) ? " - " : "") + appIdToLoginDomain(neverNull(f.u2f).appId) : ""
					return new TableLine([f.name + domainInfo, lang.get(SecondFactorTypeToNameTextId[f.type])], logins.isAdminUserLoggedIn() ? removeButton : null)
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
				return otpAuthUrlPrefix + account + "?secret=" + cleanSecret + "&issuer=" + issuer + "&algorithm=SHA1&digits=6&period=30"
			})
		})
	}

	_showAddSecondFactorDialog() {
		let u2f = new U2fClient()
		let totpKeys = stream()
		worker.generateTotpSecret().then(keys => totpKeys(keys))
		u2f.isSupported().then(u2fSupport => {
			this._user.getAsync().then(user => {
				let type = new DropDownSelector("type_label", null, Object.keys(SecondFactorTypeToNameTextId).filter(k => (k == SecondFactorType.u2f && !u2fSupport) ? false : true).map(key => {
					return {name: lang.get(SecondFactorTypeToNameTextId[key]), value: key}
				}), u2fSupport ? SecondFactorType.u2f : SecondFactorType.totp, 300)
				let name = new TextField("name_label", () => lang.get("secondFactorNameInfo_msg"))
				let u2fRegistrationData = stream(null)
				let u2fInfoMessage = u2fRegistrationData.map(registrationData => registrationData ? lang.get("registeredU2fDevice_msg") : lang.get("registerU2fDevice_msg"))
				u2fInfoMessage.map(() => m.redraw())

				let totpCode = stream();
				let totpSecret = new TextField("totpSecret_label", totpCode).setDisabled()
				totpKeys.map(keys => totpSecret.value(keys.readableKey))

				let totpSvg
				this._getOtpAuthUrl(totpKeys().readableKey).then(optAuthUrl => {
					console.log(optAuthUrl)
					let grcodeGenerator = new QRCode({
						height: 150,
						width: 150,
						content: optAuthUrl
					})
					totpSvg = grcodeGenerator.svg()
				})

				let dialog = Dialog.smallActionDialog(lang.get("add_action"), {
					view: () => m("", [
						m(type),
						m(name),
						type.selectedValue() === SecondFactorType.u2f ? m("p.flex.items-center", [m(".mr-s", u2fRegistrationData() ? m(Icon, {
									icon: Icons.Checkmark,
									large: true,
									style: {fill: theme.content_accent}
								}) : progressIcon()), m("", u2fInfoMessage())]) : null,
						type.selectedValue() === SecondFactorType.totp ? m(".mb", [
								m(totpSecret),
								m(".flex-center", m.trust(totpSvg))
							]) : null,
						m(".small", lang.get("secondFactorInfoOldClient_msg"))
					])
				}, () => {
					let sf = createSecondFactor()
					sf._ownerGroup = user._ownerGroup
					sf.name = name.value()
					sf.type = type.selectedValue()
					if (type.selectedValue() === SecondFactorType.u2f) {
						if (u2fRegistrationData() == null) {
							Dialog.error("unrecognizedU2fDevice_msg")
							return
						} else {
							sf.u2f = u2fRegistrationData()
						}
					} else if (type.selectedValue() === SecondFactorType.totp) {
						sf.otpSecret = totpKeys().key
					}
					Dialog.progress("pleaseWait_msg", setup(neverNull(user.auth).secondFactors, sf)).then(() => dialog.close())

				}, true, "save_action")

				function updateTotpCode() {
					if (totpKeys() != null) {
						worker.generateTotpCode(Math.floor(new Date().getTime() / 1000 / 30), totpKeys().key).then(number => {
							totpCode(lang.get("totpCurrentCode_label", {"{code}": number}))
							m.redraw()
						})
					}
					setTimeout(() => {
						if (dialog.visible) {
							updateTotpCode()
						}
					}, 1000)
				}

				updateTotpCode()

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
		})
	}


	entityEventReceived<T>(typeRef: TypeRef<any>, listId: ?string, elementId: string, operation: OperationTypeEnum): void {
		if (isSameTypeRef(typeRef, SecondFactorTypeRef)) {
			this._updateSecondFactors()
		}
	}

}

const SecondFactorTypeToNameTextId = {
	[SecondFactorType.u2f]: "u2fSecurityKey_label",
	[SecondFactorType.totp]: "totpAuthenticator_label"
}