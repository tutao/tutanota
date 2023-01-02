import m, { Children } from "mithril"
import stream from "mithril/stream"
import type { TextFieldAttrs } from "../../gui/base/TextField.js"
import { TextField } from "../../gui/base/TextField.js"
import { InfoLink, lang } from "../../misc/LanguageViewModel.js"
import { logins } from "../../api/main/LoginController.js"
import { Icons } from "../../gui/base/icons/Icons.js"
import { CustomerPropertiesTypeRef, Session, SessionTypeRef } from "../../api/entities/sys/TypeRefs.js"
import { assertNotNull, LazyLoaded, neverNull, ofClass } from "@tutao/tutanota-utils"
import { formatDateTimeFromYesterdayOn } from "../../misc/Formatter.js"
import { SessionState } from "../../api/common/TutanotaConstants.js"
import { SecondFactorsEditForm } from "./secondfactor/SecondFactorsEditForm.js"
import type { EntityUpdateData } from "../../api/main/EventController.js"
import { isUpdateForTypeRef } from "../../api/main/EventController.js"
import { NotFoundError } from "../../api/common/error/RestError.js"
import * as RecoverCodeDialog from "./RecoverCodeDialog.js"
import { attachDropdown } from "../../gui/base/Dropdown.js"
import { ExpanderButton, ExpanderPanel } from "../../gui/base/Expander.js"
import { ColumnWidth, Table } from "../../gui/base/Table.js"
import { ifAllowedTutanotaLinks } from "../../gui/base/GuiUtils.js"
import type { UpdatableSettingsViewer } from "../SettingsView.js"
import { CredentialEncryptionMode } from "../../misc/credentials/CredentialEncryptionMode.js"
import type { CredentialsProvider } from "../../misc/credentials/CredentialsProvider.js"
import { hasKeychainAuthenticationOptions } from "../../misc/credentials/CredentialsProviderFactory.js"
import { showCredentialsEncryptionModeDialog } from "../../gui/dialogs/SelectCredentialsEncryptionModeDialog.js"
import { assertMainOrNode } from "../../api/common/Env.js"
import { locator } from "../../api/main/MainLocator.js"
import { elementIdPart, getElementId } from "../../api/common/utils/EntityUtils.js"
import { showChangeOwnPasswordDialog } from "./ChangePasswordDialogs.js"
import { IconButton, IconButtonAttrs } from "../../gui/base/IconButton.js"
import { ButtonSize } from "../../gui/base/ButtonSize.js"
import { DropDownSelector, DropDownSelectorAttrs } from "../../gui/base/DropDownSelector.js"
import { UsageTestModel } from "../../misc/UsageTestModel.js"
import { UserSettingsGroupRootTypeRef } from "../../api/entities/tutanota/TypeRefs.js"

assertMainOrNode()

export class LoginSettingsViewer implements UpdatableSettingsViewer {
	private readonly _mailAddress = stream(neverNull(logins.getUserController().userGroupInfo.mailAddress))
	private readonly _stars = stream("***")
	private readonly _closedSessionsExpanded = stream(false)
	private _sessions: Session[] = []
	private readonly _secondFactorsForm = new SecondFactorsEditForm(new LazyLoaded(() => Promise.resolve(logins.getUserController().user)))
	private readonly credentialsEncryptionModeHelpLabel: (() => string) | null
	private readonly _usageTestModel: UsageTestModel

	constructor(private readonly credentialsProvider: CredentialsProvider) {
		this.credentialsEncryptionModeHelpLabel =
			this.credentialsProvider.getCredentialsEncryptionMode() === null ? () => lang.get("deviceEncryptionSaveCredentialsHelpText_msg") : null
		this._usageTestModel = locator.usageTestModel

		this._updateSessions()
	}

	view(): Children {
		const mailAddressAttrs: TextFieldAttrs = {
			label: "mailAddress_label",
			value: this._mailAddress(),
			oninput: this._mailAddress,
			disabled: true,
		}
		const changePasswordButtonAttrs: IconButtonAttrs = {
			title: "changePassword_label",
			click: () => showChangeOwnPasswordDialog(),
			icon: Icons.Edit,
			size: ButtonSize.Compact,
		}
		const passwordAttrs: TextFieldAttrs = {
			label: "password_label",
			value: this._stars(),
			oninput: this._stars,
			disabled: true,
			injectionsRight: () => m(IconButton, changePasswordButtonAttrs),
		}
		const recoveryCodeDropdownButtonAttrs: IconButtonAttrs = attachDropdown({
			mainButtonAttrs: {
				title: "edit_action",
				icon: Icons.Edit,
				size: ButtonSize.Compact,
			},
			childAttrs: () => [
				logins.getUserController().user.auth?.recoverCode
					? {
							label: "show_action",
							click: () => RecoverCodeDialog.showRecoverCodeDialogAfterPasswordVerification("get"),
					  }
					: null,
				{
					label: () => (neverNull(logins.getUserController().user.auth).recoverCode ? lang.get("update_action") : lang.get("setUp_action")),
					click: () => RecoverCodeDialog.showRecoverCodeDialogAfterPasswordVerification("create"),
				},
			],
			showDropdown: () => true,
		})
		const recoveryCodeFieldAttrs: TextFieldAttrs = {
			label: "recoveryCode_label",
			helpLabel: () => {
				return ifAllowedTutanotaLinks(InfoLink.RecoverCode, (link) => [
					m("span", lang.get("moreInfo_msg") + " "),
					m("span.text-break", [m(`a[href=${link}][target=_blank]`, link)]),
				])
			},
			value: this._stars(),
			oninput: this._stars,
			disabled: true,
			injectionsRight: () => m(IconButton, recoveryCodeDropdownButtonAttrs),
		}
		const usageDataOptInAttrs: DropDownSelectorAttrs<boolean | null> = {
			label: "userUsageDataOptIn_label",
			items: [
				{
					name: lang.get("activated_label"),
					value: true,
				},
				{
					name: lang.get("deactivated_label"),
					value: false,
				},
				{
					name: lang.get("undecided_label"),
					value: null,
					selectable: false,
				},
			],
			selectedValue: logins.getUserController().userSettingsGroupRoot.usageDataOptedIn,
			selectionChangedHandler: (v) => {
				this._usageTestModel.setOptInDecision(assertNotNull(v))
			},
			helpLabel: () => {
				return ifAllowedTutanotaLinks(InfoLink.Usage, (link) => [
					m("span", lang.get("userUsageDataOptInInfo_msg") + " " + lang.get("moreInfo_msg") + " "),
					m("span.text-break", [
						m(
							"a",
							{
								href: link,
								target: "_blank",
							},
							link,
						),
					]),
				])
			},
			dropdownWidth: 250,
		}

		// Might be not there when we are logging out
		if (logins.isUserLoggedIn()) {
			const user = logins.getUserController()
			return m("", [
				m("#user-settings.fill-absolute.scroll.plr-l.pb-xl", [
					m(".h4.mt-l", lang.get("loginCredentials_label")),
					m(TextField, mailAddressAttrs),
					m(TextField, passwordAttrs),
					user.isGlobalAdmin() ? m(TextField, recoveryCodeFieldAttrs) : null,
					this._renderEncryptionModeField(),
					m(this._secondFactorsForm),
					m(".h4.mt-l", lang.get("activeSessions_label")),
					this._renderActiveSessions(),
					m(".small", lang.get("sessionsInfo_msg")),
					m(".flex-space-between.items-center.mt-l.mb-s", [
						m(".h4", lang.get("closedSessions_label")),
						m(ExpanderButton, {
							label: "show_action",
							expanded: this._closedSessionsExpanded(),
							onExpandedChange: this._closedSessionsExpanded,
							showWarning: false,
						}),
					]),
					m(
						ExpanderPanel,
						{
							expanded: this._closedSessionsExpanded(),
						},
						this._renderClosedSessions(),
					),
					m(".small", lang.get("sessionsWillBeDeleted_msg")),
					m(".small", lang.get("sessionsInfo_msg")),
					this._usageTestModel.isCustomerOptedOut()
						? null
						: m("", [m(".h4.mt-l", lang.get("usageData_label")), m(DropDownSelector, usageDataOptInAttrs)]),
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

		const usedMode = this.credentialsProvider.getCredentialsEncryptionMode() ?? CredentialEncryptionMode.DEVICE_LOCK

		return m(TextField, {
			label: "credentialsEncryptionMode_label",
			helpLabel: this.credentialsEncryptionModeHelpLabel,
			value: this._credentialsEncryptionModeName(usedMode ?? CredentialEncryptionMode.DEVICE_LOCK),
			disabled: true,
			injectionsRight: () =>
				m(IconButton, {
					title: "edit_action",
					icon: Icons.Edit,
					click: () => showCredentialsEncryptionModeDialog(this.credentialsProvider).then(m.redraw),
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
		return m(Table, {
			columnHeading: ["client_label", "lastAccess_label", "IpAddress_label"],
			columnWidths: [ColumnWidth.Largest, ColumnWidth.Small, ColumnWidth.Small],
			showActionButtonColumn: true,
			lines: this._sessions
				.filter((session) => session.state === SessionState.SESSION_STATE_ACTIVE)
				.map((session) => {
					const thisSession = elementIdPart(logins.getUserController().sessionId) === getElementId(session)

					return {
						cells: [
							thisSession ? lang.get("thisClient_label") : session.clientIdentifier,
							formatDateTimeFromYesterdayOn(session.lastAccessTime),
							session.loginIpAddress ? session.loginIpAddress : "",
						],
						actionButtonAttrs: thisSession
							? null
							: ({
									title: "closeSession_action",
									click: () => {
										this._closeSession(session)
									},
									icon: Icons.Cancel,
									size: ButtonSize.Compact,
							  } as const),
					}
				}),
		})
	}

	private _closeSession(session: Session) {
		locator.entityClient.erase(session).catch(
			ofClass(NotFoundError, () => {
				console.log(`session ${JSON.stringify(session._id)} already deleted`)
			}),
		)
	}

	async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		for (const update of updates) {
			if (isUpdateForTypeRef(SessionTypeRef, update)) {
				await this._updateSessions()
			} else if (isUpdateForTypeRef(CustomerPropertiesTypeRef, update) || isUpdateForTypeRef(UserSettingsGroupRootTypeRef, update)) {
				m.redraw()
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
			.filter((session) => session.state !== SessionState.SESSION_STATE_ACTIVE)
			.map((session) => {
				return {
					cells: [
						session.clientIdentifier,
						formatDateTimeFromYesterdayOn(session.lastAccessTime),
						session.loginIpAddress ? session.loginIpAddress : "",
					],
				}
			})
		return m(Table, {
			columnHeading: ["client_label", "lastAccess_label", "IpAddress_label"],
			columnWidths: [ColumnWidth.Small, ColumnWidth.Largest, ColumnWidth.Small],
			showActionButtonColumn: true,
			lines: lines,
		})
	}
}
