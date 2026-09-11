import { Dialog, DialogType } from "../../../../ui/base/Dialog.js"
import { lang } from "../../../../ui/utils/LanguageViewModel.js"
import m from "mithril"
import { DialogHeaderBar, DialogHeaderBarAttrs } from "../../../../ui/base/DialogHeaderBar.js"
import { ButtonType } from "../../../../ui/base/Button.js"
import { theme } from "../../../../ui/theme"
import { ContentWithOptionsDialog } from "../../../../ui/dialogs/ContentWithOptionsDialog"
import { TitleSection, TitleSectionAttrs } from "../../../../ui/TitleSection"
import { px, size } from "../../../../ui/size"
import { TextField } from "../../../../ui/base/TextField"
import { Icons } from "../../../../ui/base/icons/Icons"
import { LegacyTextFieldType } from "../../../../ui/base/LegacyTextField"
import { MailboxMigrationImapConfiguration, MailboxMigrationSyncState } from "@tutao/entities/tutanota"
import { UserMigrationInformation } from "@tutao/entities/sys"
import { getImapConfigForProvider, ImapProvider } from "../../api/common/utils/imapImportUtils/ImapKnownConfigs"
import { ToggleButton } from "../../../../ui/base/buttons/ToggleButton"
import { ButtonSize } from "../../../../ui/base/ButtonSize"
import { OAuthHandlerFactory } from "../../../mail-app/settings/imapimport/oauth/OAuthHandler"
import { mailLocator } from "../../../mail-app/mailLocator"
import {
	getMigrationCredential,
	tokenEndpointResponseToOAuthToken,
	tokenEndpointResponseToOAuthTokenEndpointResponseLegacy,
} from "../../api/common/utils/imapImportUtils/ImapImportUtils"
import type { TokenEndpointResponse } from "oauth4webapi"
import { assertNotNull } from "@tutao/utils"

export interface UpdateImapCredentialsDialogAttrs {
	syncState: MailboxMigrationSyncState
	userMigrationInformation: UserMigrationInformation | null
	oauthHandlerFactory: OAuthHandlerFactory
}

export type UpdatedImapCredentials = {
	imapAccount: MailboxMigrationImapConfiguration
	userMigrationInformation: UserMigrationInformation | null
}

/**
 * Show a dialog with a preview of a given list of contacts
 * @param attrs the UpdateImapCredentialsDialogAttrs to configure the dialog texts
 * @param okAction The action to be executed when the user presses the confirm button with at least one contact selected
 * @param onCloseDialog called when simply closing the dialog or returning the OK action.
 */
export function showUpdateImapCredentialsDialog(
	attrs: UpdateImapCredentialsDialogAttrs,
	okAction: (dialog: Dialog, updatedCredentials?: UpdatedImapCredentials) => unknown,
	onCloseDialog: () => void,
) {
	const viewModel: UpdateImapCredentialsDialogViewModel = new UpdateImapCredentialsDialogViewModel(m.redraw, attrs.syncState, attrs.userMigrationInformation)
	const dialogHeaderBarAttrs: DialogHeaderBarAttrs = {
		left: [
			{
				type: ButtonType.Secondary,
				label: "close_alt",
				click: () => {
					onCloseDialog()
					dialog.close()
				},
			},
		],
		middle: "migrationUpdateCredentials_title",
	}

	const dialog = new Dialog(DialogType.EditMedium, {
		view: () => {
			return m(
				".flex.col.border-radius",
				{
					style: {
						height: "100%",
						"background-color": theme.surface_container,
					},
				},
				[
					m(DialogHeaderBar, dialogHeaderBarAttrs),
					m(
						`${""}.plr-24.flex-grow`,
						m(
							ContentWithOptionsDialog,
							{
								mainActionText: "resolveProblem_action",
								mainActionClick: async () => {
									viewModel.disableUpdateButton = true
									const provider = viewModel.provider
									const isOAuth = provider !== ImapProvider.Other
									if (isOAuth) {
										const oauthConfig = getImapConfigForProvider(provider)?.oauthConfig
										if (oauthConfig) {
											const oauthHandler = await attrs.oauthHandlerFactory(oauthConfig, mailLocator.serviceExecutor)
											const extraParams = { login_hint: viewModel.username }
											await oauthHandler.setupOauthLoginParams(extraParams)
											const responseUrl = await mailLocator
												.getImapMailImportController()
												.openOauthAuthenticationWindow(oauthHandler.buildAuthorizationUrl(), oauthConfig.redirectUri)
											if (responseUrl) {
												try {
													const updatedToken = await oauthHandler.getAuthTokens(responseUrl)
													viewModel.setOAuthToken(updatedToken)
													okAction(dialog, viewModel.buildResult())
												} catch (e) {
													console.log("Failed to refresh token", e)
												}
											}
										}
										viewModel.disableUpdateButton = false
									} else {
										onCloseDialog()
										okAction(dialog, viewModel.buildResult())
									}
									dialog.close()
								},
								disableMainActionButton: viewModel.disableUpdateButton,
								subActionText: null,
								subActionClick: () => {},
							},
							renderContent(viewModel),
						),
					),
				],
			)
		},
	})

	dialog.show()
}

function renderContent(viewModel: UpdateImapCredentialsDialogViewModel) {
	const isOAuth = viewModel.provider !== ImapProvider.Other
	return m(".mt-24", [
		m(TitleSection, {
			icon: Icons.SyncProblem,
			iconOptions: { color: theme.error },
			subTitle: lang.getTranslationText("migrationUpdateCredentialsInfo_msg"),
			title: "",
			style: {
				marginTop: px(size.spacing_16),
				borderRadius: px(size.radius_16),
			},
		} as TitleSectionAttrs),
		m(".mt-16"),
		m(TextField, {
			label: "migrationAccountUsername_label",
			class: "",
			disabled: true,
			value: viewModel.username,
			oninput: (value) => (viewModel.username = value),
			leadingIcon: {
				icon: Icons.MailFilled,
				color: theme.on_surface_variant,
			},
		}),
		isOAuth ? null : renderImapCredentials(viewModel),
		m(
			".flex-end.full-width.pt-32.mb-32",
			m("", {
				style: {
					width: "260px",
				},
			}),
		),
	])
}

function renderImapCredentials(viewModel: UpdateImapCredentialsDialogViewModel) {
	return m("", [
		m(
			".flex.row.gap-16.mt-16",
			m(TextField, {
				label: "migrationImapAccountPassword_label",
				value: viewModel.password || "",
				oninput: (value) => (viewModel.password = value),
				type: viewModel.renderPasswordVisibly ? LegacyTextFieldType.Text : LegacyTextFieldType.Password,
				injectionsRight: () => {
					return m(ToggleButton, {
						title: viewModel.renderPasswordVisibly ? "concealPassword_action" : "revealPassword_action",
						toggled: viewModel.renderPasswordVisibly,
						onToggled: (_, e) => {
							viewModel.renderPasswordVisibly = !viewModel.renderPasswordVisibly
							e.stopPropagation()
						},
						icon: viewModel.renderPasswordVisibly ? Icons.EyeCrossedFilled : Icons.EyeFilled,
						size: ButtonSize.Compact,
					})
				},
				class: "",
				leadingIcon: {
					icon: Icons.GenericLockFilled,
					color: theme.on_surface_variant,
				},
			}),
		),
		m(".flex.row.gap-16.mt-16", [
			m(TextField, {
				label: "migrationImapAccountHost_label",
				class: "",
				value: viewModel.host,
				oninput: (value) => (viewModel.host = value),
				leadingIcon: {
					icon: Icons.ServerFilled,
					color: theme.on_surface_variant,
				},
			}),
			m(TextField, {
				label: "migrationImapAccountPort_label",
				class: "",
				value: viewModel.port,
				oninput: (value) => {
					const typedNumber = Number.parseInt(value)
					viewModel.port = Number.isNaN(typedNumber) ? "0" : typedNumber.toString()
				},
				leadingIcon: {
					icon: Icons.KeyFilled,
					color: theme.on_surface_variant,
				},
			}),
		]),
	])
}

class UpdateImapCredentialsDialogViewModel {
	public renderPasswordVisibly: boolean = false
	public disableUpdateButton: boolean = false
	public readonly provider: ImapProvider
	public username: string
	public password: string
	public host: string
	public port: string

	constructor(
		readonly updateUi: () => void,
		readonly syncState: MailboxMigrationSyncState,
		readonly userMigrationInformation: UserMigrationInformation | null,
	) {
		const credentialSource = getMigrationCredential(syncState, userMigrationInformation)
		this.provider = credentialSource.provider
		this.username = credentialSource.username
		this.password = credentialSource.password ?? ""
		this.host = assertNotNull(syncState.imapAccount).host
		this.port = assertNotNull(syncState.imapAccount).port
	}

	setOAuthToken(tokenEndpointResponse: TokenEndpointResponse) {
		if (this.userMigrationInformation?.credential) {
			this.userMigrationInformation.credential.oAuthToken = tokenEndpointResponseToOAuthToken(tokenEndpointResponse)
		} else {
			assertNotNull(this.syncState.imapAccount).sharedOauthToken = tokenEndpointResponseToOAuthTokenEndpointResponseLegacy(tokenEndpointResponse)
		}
	}

	buildResult(): UpdatedImapCredentials {
		const imapAccount = assertNotNull(this.syncState.imapAccount)
		imapAccount.host = this.host
		imapAccount.port = this.port
		if (this.userMigrationInformation?.credential) {
			this.userMigrationInformation.credential.username = this.username
			this.userMigrationInformation.credential.password = this.password || null
		} else {
			imapAccount.sharedUsername = this.username
			imapAccount.sharedPassword = this.password || null
		}
		return { imapAccount, userMigrationInformation: this.userMigrationInformation }
	}
}
