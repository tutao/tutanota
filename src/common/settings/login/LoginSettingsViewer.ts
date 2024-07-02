import m, { Children } from "mithril"
import stream from "mithril/stream"
import type { TextFieldAttrs } from "../../gui/base/TextField.js"
import { TextField } from "../../gui/base/TextField.js"
import { InfoLink, lang } from "../../misc/LanguageViewModel.js"
import { Icons } from "../../gui/base/icons/Icons.js"
import { CustomerPropertiesTypeRef, Session, SessionTypeRef } from "../../api/entities/sys/TypeRefs.js"
import { assertNotNull, LazyLoaded, neverNull, ofClass } from "@tutao/tutanota-utils"
import { formatDateTimeFromYesterdayOn } from "../../misc/Formatter.js"
import { SessionState } from "../../api/common/TutanotaConstants.js"
import { SecondFactorsEditForm } from "./secondfactor/SecondFactorsEditForm.js"

import { NotFoundError } from "../../api/common/error/RestError.js"
import * as RecoverCodeDialog from "./RecoverCodeDialog.js"
import { attachDropdown } from "../../gui/base/Dropdown.js"
import { ExpanderButton, ExpanderPanel } from "../../gui/base/Expander.js"
import { ColumnWidth, Table } from "../../gui/base/Table.js"
import { ifAllowedTutaLinks } from "../../gui/base/GuiUtils.js"
import { CredentialEncryptionMode } from "../../misc/credentials/CredentialEncryptionMode.js"
import { CredentialsProvider } from "../../misc/credentials/CredentialsProvider.js"
import { showCredentialsEncryptionModeDialog } from "../../gui/dialogs/SelectCredentialsEncryptionModeDialog.js"
import { assertMainOrNode, isDesktop } from "../../api/common/Env.js"
import { locator } from "../../api/main/CommonLocator.js"
import { elementIdPart, getElementId } from "../../api/common/utils/EntityUtils.js"
import { showChangeOwnPasswordDialog } from "./ChangePasswordDialogs.js"
import { IconButton, IconButtonAttrs } from "../../gui/base/IconButton.js"
import { ButtonSize } from "../../gui/base/ButtonSize.js"
import { DropDownSelector, DropDownSelectorAttrs } from "../../gui/base/DropDownSelector.js"
import { UsageTestModel } from "../../misc/UsageTestModel.js"
import { UserSettingsGroupRootTypeRef } from "../../api/entities/tutanota/TypeRefs.js"
import { EntityUpdateData, isUpdateForTypeRef } from "../../api/common/utils/EntityUpdateUtils.js"
import { Dialog } from "../../gui/base/Dialog.js"
import { MoreInfoLink } from "../../misc/news/MoreInfoLink.js"
import { AppLockMethod } from "../../native/common/generatedipc/AppLockMethod.js"
import { MobileSystemFacade } from "../../native/common/generatedipc/MobileSystemFacade.js"
import { UpdatableSettingsViewer } from "../Interfaces.js"
assertMainOrNode()

export class LoginSettingsViewer implements UpdatableSettingsViewer {
	private readonly _mailAddress = stream(neverNull(locator.logins.getUserController().userGroupInfo.mailAddress))
	private readonly _stars = stream("***")
	private readonly _closedSessionsExpanded = stream(false)
	private _sessions: Session[] = []
	private readonly _secondFactorsForm = new SecondFactorsEditForm(
		new LazyLoaded(() => Promise.resolve(locator.logins.getUserController().user)),
		locator.domainConfigProvider(),
	)
	private readonly _usageTestModel: UsageTestModel
	private credentialEncryptionMode: CredentialEncryptionMode | null = null
	private appLockMethod: AppLockMethod | null = null

	constructor(private readonly credentialsProvider: CredentialsProvider, private readonly mobileSystemFacade: MobileSystemFacade | null) {
		this._usageTestModel = locator.usageTestModel

		this._updateSessions()
		this.updateAppLockData()
	}

	private async updateAppLockData() {
		if (isDesktop()) {
			this.credentialEncryptionMode = await this.credentialsProvider.getCredentialEncryptionMode()
		} else if (this.mobileSystemFacade) {
			this.appLockMethod = await this.mobileSystemFacade.getAppLockMethod()
		}
		m.redraw()
	}

	view(): Children {
		const mailAddressAttrs: TextFieldAttrs = {
			label: "mailAddress_label",
			value: this._mailAddress(),
			oninput: this._mailAddress,
			isReadOnly: true,
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
			isReadOnly: true,
			injectionsRight: () => m(IconButton, changePasswordButtonAttrs),
		}
		const recoveryCodeDropdownButtonAttrs: IconButtonAttrs = attachDropdown({
			mainButtonAttrs: {
				title: "edit_action",
				icon: Icons.Edit,
				size: ButtonSize.Compact,
			},
			childAttrs: () => [
				locator.logins.getUserController().user.auth?.recoverCode
					? {
							label: "show_action",
							click: () => RecoverCodeDialog.showRecoverCodeDialogAfterPasswordVerification("get"),
					  }
					: null,
				{
					label: () => (neverNull(locator.logins.getUserController().user.auth).recoverCode ? lang.get("update_action") : lang.get("setUp_action")),
					click: () => RecoverCodeDialog.showRecoverCodeDialogAfterPasswordVerification("create"),
				},
			],
			showDropdown: () => true,
		})
		const recoveryCodeFieldAttrs: TextFieldAttrs = {
			label: "recoveryCode_label",
			helpLabel: () => {
				return ifAllowedTutaLinks(locator.logins, InfoLink.RecoverCode, (link) => [m(MoreInfoLink, { link: link })])
			},
			value: this._stars(),
			oninput: this._stars,
			isReadOnly: true,
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
			selectedValue: locator.logins.getUserController().userSettingsGroupRoot.usageDataOptedIn,
			selectionChangedHandler: (v) => {
				this._usageTestModel.setOptInDecision(assertNotNull(v))
			},
			helpLabel: () => {
				return ifAllowedTutaLinks(locator.logins, InfoLink.Usage, (link) => [
					m("span", lang.get("userUsageDataOptInInfo_msg") + " "),
					m(MoreInfoLink, { link: link }),
				])
			},
			dropdownWidth: 250,
		}

		// Might be not there when we are logging out
		if (locator.logins.isUserLoggedIn()) {
			const user = locator.logins.getUserController()
			return m("", [
				m("#user-settings.fill-absolute.scroll.plr-l.pb-xl", [
					m(".h4.mt-l", lang.get("loginCredentials_label")),
					m(TextField, mailAddressAttrs),
					m(TextField, passwordAttrs),
					user.isGlobalAdmin() ? m(TextField, recoveryCodeFieldAttrs) : null,
					this.renderAppLockField(),
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

	private renderAppLockField(): Children {
		const mobileSystemFacade = this.mobileSystemFacade

		// On mobile we display app lock dialog, on desktop credential encryption dialog. They are similar but different.
		if (mobileSystemFacade) {
			const onEdit = async () => {
				const { showAppLockMethodDialog } = await import("../../native/main/SelectAppLockMethodDialog.js")
				await showAppLockMethodDialog(mobileSystemFacade)
				await this.updateAppLockData()
			}
			return m(TextField, {
				label: "credentialsEncryptionMode_label",
				value: this.appLockMethodName(this.appLockMethod ?? AppLockMethod.None),
				isReadOnly: true,
				injectionsRight: () =>
					m(IconButton, {
						title: "edit_action",
						icon: Icons.Edit,
						click: () => onEdit(),
					}),
			})
		} else if (isDesktop()) {
			const usedMode = this.credentialEncryptionMode ?? CredentialEncryptionMode.DEVICE_LOCK

			return m(TextField, {
				label: "credentialsEncryptionMode_label",
				value: this.credentialsEncryptionModeName(usedMode),
				isReadOnly: true,
				injectionsRight: () =>
					m(IconButton, {
						title: "edit_action",
						icon: Icons.Edit,
						click: () => showCredentialsEncryptionModeDialog(this.credentialsProvider).then(() => this.updateAppLockData()),
					}),
			})
		}
	}

	async _updateSessions(): Promise<void> {
		const sessions = await locator.entityClient.loadAll(SessionTypeRef, neverNull(locator.logins.getUserController().user.auth).sessions)
		sessions.sort((s1, s2) => s2.lastAccessTime.getTime() - s1.lastAccessTime.getTime())
		this._sessions = sessions
		m.redraw()
	}

	private _renderActiveSessions(): Children {
		return m(Table, {
			columnHeading: ["client_label"],
			columnWidths: [ColumnWidth.Largest],
			showActionButtonColumn: true,
			lines: this._sessions
				.filter((session) => session.state === SessionState.SESSION_STATE_ACTIVE)
				.map((session) => {
					const thisSession = elementIdPart(locator.logins.getUserController().sessionId) === getElementId(session)

					return {
						cells: () => [
							{
								main: thisSession ? lang.get("thisClient_label") : session.clientIdentifier,
								info: [
									lang.get("lastAccessWithTime_label", {
										"{time}": formatDateTimeFromYesterdayOn(session.lastAccessTime),
									}),
									session.loginIpAddress ? session.loginIpAddress : "",
								],
								click: () => this.showActiveSessionInfoDialog(session, thisSession),
							},
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

	private showActiveSessionInfoDialog(session: Session, isThisSession: boolean) {
		const actionDialogProperties = {
			title: () => lang.get("details_label"),
			child: {
				view: () => {
					return [
						m(TextField, {
							label: "client_label",
							value: isThisSession ? lang.get("thisClient_label") : session.clientIdentifier,
							isReadOnly: true,
						}),
						m(TextField, {
							label: "lastAccess_label",
							value: `${formatDateTimeFromYesterdayOn(session.lastAccessTime)}`,
							isReadOnly: true,
						}),
						m(TextField, {
							label: "IpAddress_label",
							value: session.loginIpAddress ? session.loginIpAddress : "",
							isReadOnly: true,
						}),
					]
				},
			},
			okAction: null,
			allowCancel: true,
			allowOkWithReturn: false,
			cancelActionTextId: "close_alt",
		} as const
		Dialog.showActionDialog(actionDialogProperties)
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

	private credentialsEncryptionModeName(credentialsEncryptionMode: CredentialEncryptionMode): string {
		const mapping = {
			[CredentialEncryptionMode.DEVICE_LOCK]: "credentialsEncryptionModeDeviceLock_label",
			[CredentialEncryptionMode.SYSTEM_PASSWORD]: "credentialsEncryptionModeDeviceCredentials_label",
			[CredentialEncryptionMode.BIOMETRICS]: "credentialsEncryptionModeBiometrics_label",
			[CredentialEncryptionMode.APP_PASSWORD]: "credentialsEncryptionModeAppPassword_label",
		} as const
		return lang.get(mapping[credentialsEncryptionMode])
	}

	private appLockMethodName(appLockMethod: AppLockMethod): string {
		const mapping = {
			[AppLockMethod.None]: "credentialsEncryptionModeDeviceLock_label",
			[AppLockMethod.SystemPassOrBiometrics]: "credentialsEncryptionModeDeviceCredentials_label",
			[AppLockMethod.Biometrics]: "credentialsEncryptionModeBiometrics_label",
		} as const
		return lang.get(mapping[appLockMethod])
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
