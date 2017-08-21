//@flow
import m from "mithril"
import {assertMainOrNode} from "../api/Env"
import {Table, ColumnWidth} from "../gui/base/Table"
import {Button} from "../gui/base/Button"
import {SecondFactorTypeRef, createSecondFactor} from "../api/entities/sys/SecondFactor"
import {isSameTypeRef} from "../api/common/EntityFunctions"
import {LazyLoaded} from "../api/common/utils/LazyLoaded"
import {Icons} from "../gui/base/icons/Icons"
import {loadAll, erase, setup} from "../api/main/Entity"
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
					if (!contains(result, neverNull(f.u2f).appId)) {
						result.push(neverNull(f.u2f).appId)
					}
					return result
				}, [])
				let tableLines = factors.map(sf => {
					let removeButton = new Button("remove_action", () => {
						Dialog.confirm("confirmDeleteSecondFactor_msg").then(confirmed => {
							if (confirmed) {
								Dialog.progress("pleaseWait_msg", erase(sf))
							}
						})
					}, () => Icons.Cancel)
					let domainInfo = (differentDomainAppIds.length > 1) ? ((sf.name.length > 0) ? " - " : "") + appIdToLoginDomain(neverNull(sf.u2f).appId) : ""
					return new TableLine([sf.name + domainInfo, lang.get(SecondFactorTypeToNameTextId[sf.type])], logins.isAdminUserLoggedIn() ? removeButton : null)
				})
				this._2FATable.updateEntries(tableLines)
			})
		})
	}


	_showAddSecondFactorDialog() {
		let u2f = new U2fClient()
		u2f.isSupported().then(supported => {
			if (!supported) {
				Dialog.error("u2fNotSupported_msg")
				return
			}
			this._user.getAsync().then(user => {
				let type = new DropDownSelector("type_label", null, Object.keys(SecondFactorTypeToNameTextId).map(key => {
					return {name: lang.get(SecondFactorTypeToNameTextId[key]), value: key}
				}), SecondFactorType.u2f, 300)
				let name = new TextField("name_label", () => lang.get("secondFactorNameInfo_msg"))
				let u2fRegistrationData = stream(null)
				let u2fInfoMessage = u2fRegistrationData.map(registrationData => registrationData ? lang.get("registeredU2fDevice_msg") : lang.get("registerU2fDevice_msg"))
				u2fInfoMessage.map(() => m.redraw())

				let dialog = Dialog.smallActionDialog(lang.get("add_action"), {
					view: () => m("", [
						m(type),
						m(name),
						m("p.flex.items-center", [m(".mr-s", u2fRegistrationData() ? m(Icon, {
								icon: Icons.Checkmark,
								large: true,
								style: {fill: theme.content_accent}
							}) : progressIcon()), m("", u2fInfoMessage())]),
						m(".small", lang.get("secondFactorInfoOldClient_msg"))
					])
				}, () => {
					if (u2fRegistrationData() == null) {
						Dialog.error("unrecognizedU2fDevice_msg")
					} else {
						let sf = createSecondFactor()
						sf._ownerGroup = user._ownerGroup
						sf.name = name.value()
						sf.type = type.selectedValue()
						sf.u2f = u2fRegistrationData()
						Dialog.progress("pleaseWait_msg", setup(neverNull(user.auth).secondFactors, sf)).then(() => dialog.close())
					}
				}, true, "save_action")

				function registerResumeOnTimeout() {
					u2f.register()
						.catch((e) => {
							if (e instanceof U2fError) {
								console.log(e)
								Dialog.error("u2fUnexpectedError_msg").then(() => {
									if (dialog.visible) {
										dialog.close()
									}
								})
							}
						})
						.then(registrationData => u2fRegistrationData(registrationData))
				}

				registerResumeOnTimeout()
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
	[SecondFactorType.u2f]: "u2fSecurityKey_label"
}