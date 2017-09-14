// @flow
import m from "mithril"
import {assertMainOrNode} from "../api/Env"
import {TextField} from "../gui/base/TextField"
import {lang} from "../misc/LanguageViewModel"
import {Button} from "../gui/base/Button"
import {PasswordForm} from "./PasswordForm"
import {isSameTypeRef} from "../api/common/EntityFunctions"
import {logins} from "../api/main/LoginController"
import {BootIcons} from "../gui/base/icons/BootIcons"
import {Table, ColumnWidth} from "../gui/base/Table"
import {Icons} from "../gui/base/icons/Icons"
import TableLine from "../gui/base/TableLine"
import {SessionTypeRef} from "../api/entities/sys/Session"
import {neverNull} from "../api/common/utils/Utils"
import {loadAll, erase} from "../api/main/Entity"
import {formatDateTimeFromYesterdayOn} from "../misc/Formatter"
import {SessionState} from "../api/common/TutanotaConstants"
import {ExpanderButton, ExpanderPanel} from "../gui/base/Expander"
import {EditSecondFactorsForm} from "./EditSecondFactorsForm"
import {LazyLoaded} from "../api/common/utils/LazyLoaded"

assertMainOrNode()

export class LoginSettingsViewer {
	view: Function;
	_activeSessionTable: Table;
	_closedSessionTable: Table;
	_secondFactorsForm: EditSecondFactorsForm;

	constructor() {
		let mailAddress = new TextField("mailAddress_label").setValue(logins.getUserController().userGroupInfo.mailAddress).setDisabled()
		let password = new TextField("password_label").setValue("***").setDisabled()
		let changePasswordButton = new Button("changePassword_label", () => PasswordForm.showChangeOwnPasswordDialog(), () => BootIcons.Edit)
		password._injectionsRight = () => [m(changePasswordButton)]

		this._activeSessionTable = new Table(["client_label", "lastAccess_label", "IpAddress_label"], [ColumnWidth.Largest, ColumnWidth.Small, ColumnWidth.Small], true)
		this._closedSessionTable = new Table(["client_label", "lastAccess_label", "IpAddress_label"], [ColumnWidth.Largest, ColumnWidth.Small, ColumnWidth.Small], true)
		let closedSessionExpander = new ExpanderButton("show_action", new ExpanderPanel(this._closedSessionTable), false)

		this._secondFactorsForm = new EditSecondFactorsForm(new LazyLoaded(() => Promise.resolve(logins.getUserController().user)))

		this.view = () => {
			return [
				m("#user-settings.fill-absolute.scroll.plr-l", [
					m(".h4.mt-l", lang.get('loginCredentials_label')),
					m(".wrapping-row", [
						m(mailAddress),
						m(password)
					]),
					(logins.getUserController().isFreeAccount() || logins.getUserController().isPremiumAccount()) ? m(this._secondFactorsForm) : null,
					m(".h4.mt-l", lang.get('activeSessions_label')),
					m(this._activeSessionTable),
					m(".small.text-break", lang.get("sessionsInfo_msg")),
					m(".flex-space-between.items-center.mt-l.mb-s", [
						m(".h4", lang.get('closedSessions_label')),
						m(closedSessionExpander)
					]),
					m(closedSessionExpander.panel),
					m(".small.text-break", lang.get("sessionsInfo_msg"))
				])
			]
		}
		this._updateSessions()
	}

	_updateSessions() {
		loadAll(SessionTypeRef, neverNull(logins.getUserController().user.auth).sessions).then(sessions => {
			sessions.sort((s1, s2) => s2.lastAccessTime.getTime() - s1.lastAccessTime.getTime())
			this._activeSessionTable.updateEntries(sessions.filter(session => session.state == SessionState.SESSION_STATE_ACTIVE).map(session => {
				let closeSessionButton = null
				let thisSession = logins.getUserController().sessionElementId == session._id[1]
				if (!thisSession) {
					closeSessionButton = new Button("closeSession_action", () => {
						erase(session)
					}, () => Icons.Cancel)
				}
				let identifier = (thisSession) ? lang.get("thisClient_label") : session.clientIdentifier
				return new TableLine([identifier, formatDateTimeFromYesterdayOn(session.lastAccessTime), session.loginIpAddress], closeSessionButton)
			}))
			this._closedSessionTable.updateEntries(sessions.filter(session => session.state != SessionState.SESSION_STATE_ACTIVE).map(session => {
				return new TableLine([session.clientIdentifier, formatDateTimeFromYesterdayOn(session.lastAccessTime), session.loginIpAddress])
			}))
		})
	}


	entityEventReceived<T>(typeRef: TypeRef<any>, listId: ?string, elementId: string, operation: OperationTypeEnum): void {
		if (isSameTypeRef(typeRef, SessionTypeRef)) {
			this._updateSessions()
		}
		this._secondFactorsForm.entityEventReceived(typeRef, listId, elementId, operation)
	}
}
