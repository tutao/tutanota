import m, {Children} from "mithril"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import type {TextFieldAttrs} from "../gui/base/TextFieldN"
import {TextFieldN} from "../gui/base/TextFieldN"
import {InfoLink, lang} from "../misc/LanguageViewModel"
import {PasswordForm} from "./PasswordForm"
import {logins} from "../api/main/LoginController"
import {Icons} from "../gui/base/icons/Icons"
import {Session, SessionTypeRef} from "../api/entities/sys/TypeRefs.js"
import {LazyLoaded, neverNull, noOp, ofClass} from "@tutao/tutanota-utils"
import {formatDateTimeFromYesterdayOn} from "../misc/Formatter"
import {SessionState} from "../api/common/TutanotaConstants"
import {EditSecondFactorsForm} from "./EditSecondFactorsForm"
import type {EntityUpdateData} from "../api/main/EventController"
import {isUpdateForTypeRef} from "../api/main/EventController"
import type {ButtonAttrs} from "../gui/base/ButtonN"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import {NotFoundError} from "../api/common/error/RestError"
import * as RecoverCodeDialog from "./RecoverCodeDialog"
import {attachDropdown} from "../gui/base/DropdownN"
import {ExpanderButtonN, ExpanderPanelN} from "../gui/base/Expander"
import {ColumnWidth, TableN} from "../gui/base/TableN"
import {ifAllowedTutanotaLinks} from "../gui/base/GuiUtils"
import type {UpdatableSettingsViewer} from "./SettingsView"
import {CredentialEncryptionMode} from "../misc/credentials/CredentialEncryptionMode"
import type {ICredentialsProvider} from "../misc/credentials/CredentialsProvider"
import {hasKeychainAuthenticationOptions} from "../misc/credentials/CredentialsProviderFactory"
import {showCredentialsEncryptionModeDialog} from "../gui/dialogs/SelectCredentialsEncryptionModeDialog"
import {assertMainOrNode} from "../api/common/Env"
import {locator} from "../api/main/MainLocator"
import {elementIdPart, getElementId} from "../api/common/utils/EntityUtils"

assertMainOrNode()

export class LoginSettingsViewer implements UpdatableSettingsViewer {
	private readonly _mailAddress: Stream<string>
	private readonly _stars: Stream<string>
	private readonly _closedSessionsExpanded: Stream<boolean>
	private _sessions: Session[]
	private readonly _secondFactorsForm: EditSecondFactorsForm
	private readonly _credentialsProvider: ICredentialsProvider

	constructor(credentialsProvider: ICredentialsProvider) {
		this._credentialsProvider = credentialsProvider
		this._mailAddress = stream(neverNull(logins.getUserController().userGroupInfo.mailAddress))
		this._stars = stream("***")
		this._closedSessionsExpanded = stream(false)
		this._sessions = []
		this._secondFactorsForm = new EditSecondFactorsForm(new LazyLoaded(() => Promise.resolve(logins.getUserController().user)))

		this._updateSessions()
	}

	view(): Children {
		const mailAddressAttrs: TextFieldAttrs = {
			label: "mailAddress_label",
			value: this._mailAddress(),
			oninput: this._mailAddress,
			disabled: true,
		}
		const changePasswordButtonAttrs: ButtonAttrs = {
			label: "changePassword_label",
			click: () => PasswordForm.showChangeOwnPasswordDialog(),
			icon: () => Icons.Edit,
		}
		const passwordAttrs: TextFieldAttrs = {
			label: "password_label",
			value: this._stars(),
			oninput: this._stars,
			disabled: true,
			injectionsRight: () => m(ButtonN, changePasswordButtonAttrs),
		}
		const recoveryCodeDropdownButtonAttrs: ButtonAttrs = attachDropdown(
			{
                mainButtonAttrs: {
                    label: "edit_action",
                    icon: () => Icons.Edit,
                    click: noOp,
                }, childAttrs: () => [
                    logins.getUserController().user.auth?.recoverCode
                        ? {
                            label: "show_action",
                            click: () => RecoverCodeDialog.showRecoverCodeDialogAfterPasswordVerification("get"),
                            type: ButtonType.Dropdown,
                        }
                        : null,
                    {
                        label: () => (neverNull(logins.getUserController().user.auth).recoverCode ? lang.get("update_action") : lang.get("setUp_action")),
                        click: () => RecoverCodeDialog.showRecoverCodeDialogAfterPasswordVerification("create"),
                        type: ButtonType.Dropdown,
                    },
                ], showDropdown: () => true
            },
		)
		const recoveryCodeFieldAttrs: TextFieldAttrs = {
			label: "recoveryCode_label",
			helpLabel: () => {
				return ifAllowedTutanotaLinks(InfoLink.RecoverCode, link => [
					m("span", lang.get("moreInfo_msg") + " "),
					m("span.text-break", [m(`a[href=${link}][target=_blank]`, link)]),
				])
			},
			value: this._stars(),
			oninput: this._stars,
			disabled: true,
			injectionsRight: () => m(ButtonN, recoveryCodeDropdownButtonAttrs),
		}
		// Might be not there when we are logging out
		if (logins.isUserLoggedIn()) {
			const user = logins.getUserController()
			return m("", [
				m("#user-settings.fill-absolute.scroll.plr-l.pb-xl", [
					m(".h4.mt-l", lang.get("loginCredentials_label")),
					m(TextFieldN, mailAddressAttrs),
					m(TextFieldN, passwordAttrs),
					user.isGlobalAdmin() ? m(TextFieldN, recoveryCodeFieldAttrs) : null,
					this._renderEncryptionModeField(),
					m(this._secondFactorsForm),
					m(".h4.mt-l", lang.get("activeSessions_label")),
					this._renderActiveSessions(),
					m(".small", lang.get("sessionsInfo_msg")),
					m(".flex-space-between.items-center.mt-l.mb-s", [
						m(".h4", lang.get("closedSessions_label")),
						m(ExpanderButtonN, {
							label: "show_action",
							expanded: this._closedSessionsExpanded(),
							onExpandedChange: this._closedSessionsExpanded,
							showWarning: false,
						}),
					]),
					m(ExpanderPanelN, {
							expanded: this._closedSessionsExpanded(),
						},
						this._renderClosedSessions(),
					),
					m(".small", lang.get("sessionsWillBeDeleted_msg")),
					m(".small", lang.get("sessionsInfo_msg")),
				]),
			])
		} else {
			return null
		}
	}

	private _renderEncryptionModeField(): Children {
		if (!hasKeychainAuthenticationOptions()) {
			return null
		}

		const usedMode = this._credentialsProvider.getCredentialsEncryptionMode()

		// User should be prompted before we get here
		if (usedMode == null) {
			return null
		}

		return m(TextFieldN, {
			label: "credentialsEncryptionMode_label",
			value: this._credentialsEncryptionModeName(usedMode),
			disabled: true,
			injectionsRight: () =>
				m(ButtonN, {
					label: "edit_action",
					icon: () => Icons.Edit,
					click: () => showCredentialsEncryptionModeDialog(this._credentialsProvider).then(m.redraw),
				}),
		})
	}

	async _updateSessions(): Promise<void> {
		const sessions = await locator.entityClient.loadAll(SessionTypeRef, neverNull(logins.getUserController().user.auth).sessions)
		sessions.sort((s1, s2) => s2.lastAccessTime.getTime() - s1.lastAccessTime.getTime())
		this._sessions = sessions
		m.redraw()
	}

	private _renderActiveSessions(): Children {
		return m(TableN, {
			columnHeading: ["client_label", "lastAccess_label", "IpAddress_label"],
			columnWidths: [ColumnWidth.Largest, ColumnWidth.Small, ColumnWidth.Small],
			showActionButtonColumn: true,
			lines: this._sessions
					   .filter(session => session.state === SessionState.SESSION_STATE_ACTIVE)
					   .map(session => {
						   const thisSession = elementIdPart(logins.getUserController().sessionId) === getElementId(session)

						   return {
							   cells: [
								   thisSession ? lang.get("thisClient_label") : session.clientIdentifier,
								   formatDateTimeFromYesterdayOn(session.lastAccessTime),
								   session.loginIpAddress ? session.loginIpAddress : "",
							   ],
							   actionButtonAttrs: thisSession
								   ? null
								   : {
									   label: "closeSession_action",
									   click: () => {
										   this._closeSession(session)
									   },
									   icon: () => Icons.Cancel,
								   } as const,
						   }
					   })
		})
	}

	private _closeSession(session: Session) {
		locator.entityClient.erase(session)
			   .catch(ofClass(NotFoundError, () => {
				   console.log(`session ${JSON.stringify(session._id)} already deleted`)
			   }))
	}

	async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		for (const update of updates) {
			if (isUpdateForTypeRef(SessionTypeRef, update)) {
				await this._updateSessions()
			}
			await this._secondFactorsForm.entityEventReceived(update)
		}
	}

	private _credentialsEncryptionModeName(credentialsEncryptionMode: CredentialEncryptionMode): string {
		const mapping = {
			[CredentialEncryptionMode.DEVICE_LOCK]: "credentialsEncryptionModeDeviceLock_label",
			[CredentialEncryptionMode.SYSTEM_PASSWORD]: "credentialsEncryptionModeDeviceCredentials_label",
			[CredentialEncryptionMode.BIOMETRICS]: "credentialsEncryptionModeBiometrics_label",
		} as const
		return lang.get(mapping[credentialsEncryptionMode])
	}

	private _renderClosedSessions(): Children {
		const lines = this._sessions
						  .filter(session => session.state !== SessionState.SESSION_STATE_ACTIVE)
						  .map(session => {
							  return {
								  cells: [
									  session.clientIdentifier,
									  formatDateTimeFromYesterdayOn(session.lastAccessTime),
									  session.loginIpAddress ? session.loginIpAddress : "",
								  ],
							  }
						  })
		return m(TableN, {
			columnHeading: ["client_label", "lastAccess_label", "IpAddress_label"],
			columnWidths: [ColumnWidth.Small, ColumnWidth.Largest, ColumnWidth.Small],
			showActionButtonColumn: true,
			lines: lines,
		})
	}
}