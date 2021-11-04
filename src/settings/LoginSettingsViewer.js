// @flow
import m from "mithril"
import stream from "mithril/stream/stream.js"
import type {TextFieldAttrs} from "../gui/base/TextFieldN"
import {TextFieldN} from "../gui/base/TextFieldN"
import {lang} from "../misc/LanguageViewModel"
import {PasswordForm} from "./PasswordForm"
import {logins} from "../api/main/LoginController"
import {Icons} from "../gui/base/icons/Icons"
import {SessionTypeRef} from "../api/entities/sys/Session"
import {neverNull, noOp} from "@tutao/tutanota-utils"
import {erase, loadAll} from "../api/main/Entity"
import {formatDateTimeFromYesterdayOn} from "../misc/Formatter"
import {SessionState} from "../api/common/TutanotaConstants"
import {EditSecondFactorsForm} from "./EditSecondFactorsForm"
import {LazyLoaded} from "@tutao/tutanota-utils"
import type {EntityUpdateData} from "../api/main/EventController"
import {isUpdateForTypeRef} from "../api/main/EventController"
import type {ButtonAttrs} from "../gui/base/ButtonN"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import {NotFoundError} from "../api/common/error/RestError"
import * as RecoverCodeDialog from "./RecoverCodeDialog"
import {attachDropdown} from "../gui/base/DropdownN"
import type {ExpanderAttrs} from "../gui/base/Expander"
import {ExpanderButtonN, ExpanderPanelN} from "../gui/base/Expander"
import type {TableAttrs, TableLineAttrs} from "../gui/base/TableN"
import {ColumnWidth, TableN} from "../gui/base/TableN"
import {ifAllowedTutanotaLinks} from "../gui/base/GuiUtils"
import type {UpdatableSettingsViewer} from "./SettingsView"
import {ofClass, promiseMap} from "@tutao/tutanota-utils"
import type {CredentialEncryptionModeEnum} from "../misc/credentials/CredentialEncryptionMode"
import {CredentialEncryptionMode} from "../misc/credentials/CredentialEncryptionMode"
import type {ICredentialsProvider} from "../misc/credentials/CredentialsProvider"
import {usingKeychainAuthentication} from "../misc/credentials/CredentialsProviderFactory"
import {showCredentialsEncryptionModeDialog} from "../gui/dialogs/SelectCredentialsEncryptionModeDialog"
import {assertMainOrNode} from "../api/common/Env"

assertMainOrNode()

export class LoginSettingsViewer implements UpdatableSettingsViewer {
	_mailAddress: Stream<string>;
	_stars: Stream<string>;
	_closedSessionsExpanded: Stream<boolean>;
	_activeSessionsTableLines: Stream<Array<TableLineAttrs>>;
	_closedSessionsTableLines: Stream<Array<TableLineAttrs>>;
	_secondFactorsForm: EditSecondFactorsForm;
	_credentialsProvider: ICredentialsProvider
	_usingKeychainAuthentication: boolean

	constructor(credentialsProvider: ICredentialsProvider) {
		this._credentialsProvider = credentialsProvider
		this._mailAddress = stream(neverNull(logins.getUserController().userGroupInfo.mailAddress))
		this._stars = stream("***")
		this._closedSessionsExpanded = stream(false)
		this._activeSessionsTableLines = stream([])
		this._closedSessionsTableLines = stream([])
		this._secondFactorsForm = new EditSecondFactorsForm(new LazyLoaded(() => Promise.resolve(logins.getUserController().user)))
		stream.merge([this._closedSessionsTableLines, this._activeSessionsTableLines]).map(m.redraw)
		this._updateSessions()

		this._usingKeychainAuthentication = false
		usingKeychainAuthentication().then((using) => {
			this._usingKeychainAuthentication = using
			m.redraw()
		})
	}

	view(): Children {
		const mailAddressAttrs: TextFieldAttrs = {
			label: "mailAddress_label",
			value: this._mailAddress,
			disabled: true,
		}
		const changePasswordButtonAttrs: ButtonAttrs = {
			label: "changePassword_label",
			click: () => PasswordForm.showChangeOwnPasswordDialog(),
			icon: () => Icons.Edit
		}
		const passwordAttrs: TextFieldAttrs = {
			label: "password_label",
			value: this._stars,
			disabled: true,
			injectionsRight: () => m(ButtonN, changePasswordButtonAttrs)
		}

		const recoveryCodeDropdownButtonAttrs: ButtonAttrs = attachDropdown(
			{
				label: "edit_action",
				icon: () => Icons.Edit,
				click: noOp
			}, () => [
				{
					label: "show_action",
					click: () => RecoverCodeDialog.showRecoverCodeDialogAfterPasswordVerification('get'),
					type: ButtonType.Dropdown,
					isVisible: () => {
						const auth = logins.getUserController().user.auth
						return Boolean(auth && auth.recoverCode)
					}
				},
				{
					label: () => neverNull(logins.getUserController().user.auth).recoverCode
						? lang.get("update_action")
						: lang.get("setUp_action"),
					click: () => RecoverCodeDialog.showRecoverCodeDialogAfterPasswordVerification('create'),
					type: ButtonType.Dropdown
				}
			], () => true)

		const recoveryCodeFieldAttrs: TextFieldAttrs = {
			label: "recoveryCode_label",
			helpLabel: () => {
				return ifAllowedTutanotaLinks("recoverCode_link", link => [
					m("span", lang.get("moreInfo_msg") + " "),
					m("span.text-break", [m(`a[href=${link}][target=_blank]`, link)])
				])
			},
			value: this._stars,
			disabled: true,
			injectionsRight: () => m(ButtonN, recoveryCodeDropdownButtonAttrs)
		}

		const closedSessionExpanderAttrs: ExpanderAttrs = {
			label: "show_action",
			expanded: this._closedSessionsExpanded,
			showWarning: false
		}

		const activeSessionTableAttrs: TableAttrs = {
			columnHeading: ["client_label", "lastAccess_label", "IpAddress_label"],
			columnWidths: [ColumnWidth.Largest, ColumnWidth.Small, ColumnWidth.Small],
			showActionButtonColumn: true,
			lines: this._activeSessionsTableLines(),
		}

		const closedSessionTableAttrs: TableAttrs = {
			columnHeading: ["client_label", "lastAccess_label", "IpAddress_label"],
			columnWidths: [ColumnWidth.Small, ColumnWidth.Largest, ColumnWidth.Small],
			showActionButtonColumn: true,
			lines: this._closedSessionsTableLines(),
		}

		// Might be not there when we are logging out
		if (logins.isUserLoggedIn()) {
			const user = logins.getUserController()
			return m("", [
				m("#user-settings.fill-absolute.scroll.plr-l.pb-xl", [
					m(".h4.mt-l", lang.get('loginCredentials_label')),
					m(TextFieldN, mailAddressAttrs),
					m(TextFieldN, passwordAttrs),
					user.isGlobalAdmin() ? m(TextFieldN, recoveryCodeFieldAttrs) : null,
					this._renderEncryptionModeField(),
					m(this._secondFactorsForm),
					m(".h4.mt-l", lang.get('activeSessions_label')),
					m(TableN, activeSessionTableAttrs),
					m(".small", lang.get("sessionsInfo_msg")),
					m(".flex-space-between.items-center.mt-l.mb-s", [
						m(".h4", lang.get('closedSessions_label')),
						m(ExpanderButtonN, closedSessionExpanderAttrs)
					]),
					m(ExpanderPanelN, {expanded: this._closedSessionsExpanded}, m(TableN, closedSessionTableAttrs)),
					m(".small", lang.get("sessionsWillBeDeleted_msg")),
					m(".small", lang.get("sessionsInfo_msg")),
				])
			])
		} else {
			return null
		}
	}

	_renderEncryptionModeField(): Children {
		if (!this._usingKeychainAuthentication) {
			return null
		}
		const usedMode = this._credentialsProvider.getCredentialsEncryptionMode()
		// User should be prompted before we get here
		if (usedMode == null) {
			return null
		}
		return m(TextFieldN, {
			label: "credentialsEncryptionMode_label",
			value: stream(this._credentialsEncryptionModeName(usedMode)),
			disabled: true,
			injectionsRight: () => m(ButtonN, {
				label: "edit_action",
				icon: () => Icons.Edit,
				click: () => showCredentialsEncryptionModeDialog(this._credentialsProvider).then(m.redraw)
			}),
		})
	}

	_updateSessions(): Promise<void> {
		return loadAll(SessionTypeRef, neverNull(logins.getUserController().user.auth).sessions).then(sessions => {
			sessions.sort((s1, s2) => s2.lastAccessTime.getTime() - s1.lastAccessTime.getTime())
			this._activeSessionsTableLines(sessions
				.filter(session => session.state === SessionState.SESSION_STATE_ACTIVE)
				.map(session => {
					const thisSession = logins.getUserController().sessionId[1] === session._id[1]
					return {
						cells: [
							(thisSession) ? lang.get("thisClient_label") : session.clientIdentifier,
							formatDateTimeFromYesterdayOn(session.lastAccessTime),
							(session.loginIpAddress) ? session.loginIpAddress : ""
						],
						actionButtonAttrs: thisSession ? null : {
							label: "closeSession_action",
							click: () => {
								erase(session).catch(ofClass(NotFoundError, () => {
									console.log(`session ${JSON.stringify(session._id)} already deleted`)
								}))
							},
							icon: () => Icons.Cancel
						}
					}
				}))
			this._closedSessionsTableLines(sessions
				.filter(session => session.state !== SessionState.SESSION_STATE_ACTIVE)
				.map(session => {
					return {
						cells: [
							session.clientIdentifier,
							formatDateTimeFromYesterdayOn(session.lastAccessTime),
							(session.loginIpAddress) ? session.loginIpAddress : ""
						]
					}
				}))
		})
	}

	entityEventsReceived(updates: $ReadOnlyArray<EntityUpdateData>): Promise<void> {
		return promiseMap(updates, update => {
			let promise = Promise.resolve()
			if (isUpdateForTypeRef(SessionTypeRef, update)) {
				promise = this._updateSessions()
			}
			return promise.then(() => {
				return this._secondFactorsForm.entityEventReceived(update)
			})
		}).then(noOp)
	}

	_credentialsEncryptionModeName(credentialsEncryptionMode: CredentialEncryptionModeEnum): string {
		const mapping = {
			[CredentialEncryptionMode.DEVICE_LOCK]: "credentialsEncryptionModeDeviceLock_label",
			[CredentialEncryptionMode.SYSTEM_PASSWORD]: "credentialsEncryptionModeDeviceCredentials_label",
			[CredentialEncryptionMode.BIOMETRICS]: "credentialsEncryptionModeBiometrics_label"
		}
		return lang.get(mapping[credentialsEncryptionMode])
	}
}
