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
import { MailboxMigrationSyncState } from "@tutao/entities/tutanota"
import { UserMigrationInfo } from "@tutao/entities/sys"
import { getServerMigrationConfigForProvider, MailboxMigrationProvider } from "../../api/common/utils/migrationImportUtils/MigrationKnownConfigs"
import { ToggleButton } from "../../../../ui/base/buttons/ToggleButton"
import { ButtonSize } from "../../../../ui/base/ButtonSize"
import { OAuthHandlerFactory } from "../../../mail-app/settings/migration/oauth/OAuthHandler"
import { mailLocator } from "../../../mail-app/mailLocator"
import { getMailboxMigrationCredential, tokenEndpointResponseToOAuthToken } from "../../api/common/utils/migrationImportUtils/MigrationImportUtils"
import { UpdatedMigrationCredentials } from "./UpdateMigrationCredentialsDialog"
import type { TokenEndpointResponse } from "oauth4webapi"
import { assertNotNull } from "@tutao/utils"

export interface InitialMigrationCredentialsDialogAttrs {
	syncState: MailboxMigrationSyncState
	userMigrationInformation: UserMigrationInfo
	oauthHandlerFactory: OAuthHandlerFactory
}

/**
 * Show a dialog where the user enters their account password (for custom providers) or starts OAuth (for known
 * providers) for a newly-scheduled migration. All other connection details are displayed as read-only.
 *
 * @param attrs    The dialog attributes (contains the syncState with connection details).
 * @param okAction Called with the updated credentials when the user confirms (password set or OAuth tokens obtained).
 * @param onClose  Called when the dialog is closed without confirming (or after okAction).
 */
export function showInitialMigrationCredentialsDialog(
	attrs: InitialMigrationCredentialsDialogAttrs,
	okAction: (dialog: Dialog, updatedCredentials?: UpdatedMigrationCredentials) => unknown,
	onClose: () => void,
) {
	const viewModel = new InitialMigrationCredentialsDialogViewModel(attrs.syncState, attrs.userMigrationInformation)

	const headerBarAttrs: DialogHeaderBarAttrs = {
		left: [
			{
				type: ButtonType.Secondary,
				label: "close_alt",
				click: () => {
					onClose()
					dialog.close()
				},
			},
		],
		middle: "migrationScheduled_title",
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
					m(DialogHeaderBar, headerBarAttrs),
					m(
						".plr-24.flex-grow",
						m(
							ContentWithOptionsDialog,
							{
								mainActionText: "migrationStart_action",
								mainActionClick: async () => {
									viewModel.disableButton = true

									try {
										if (viewModel.isOAuth) {
											if (!attrs.oauthHandlerFactory) {
												Dialog.message("migrationGenericError_msg")
												return
											}
											const oauthConfig = getServerMigrationConfigForProvider(viewModel.provider)?.oauthConfig
											if (!oauthConfig) {
												Dialog.message("migrationGenericError_msg")
												return
											}
											const oauthHandler = await attrs.oauthHandlerFactory(oauthConfig, mailLocator.serviceExecutor)
											const extraParams = { login_hint: viewModel.username }
											await oauthHandler.setupOauthLoginParams(extraParams)
											const responseUrl = await mailLocator
												.getMailboxMigrationController()
												.openOauthAuthenticationWindow(oauthHandler.buildAuthorizationUrl(), oauthConfig.redirectUri)
											if (responseUrl) {
												const updatedToken = await oauthHandler.getAuthTokens(responseUrl)
												viewModel.setOAuthToken(updatedToken)
												okAction(dialog, viewModel.buildResult())
											} else {
												Dialog.message("migrationGenericError_msg")
												return
											}
										} else {
											if (!viewModel.password || viewModel.password.trim() === "") {
												Dialog.message("migrationGenericError_msg")
												return
											}
											okAction(dialog, viewModel.buildResult())
										}
										dialog.close()
									} catch (e) {
										console.error("Migration credential update failed", e)
										Dialog.message("migrationGenericError_msg")
									} finally {
										viewModel.disableButton = false
									}
								},
								disableMainActionButton: viewModel.disableButton,
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

function renderContent(viewModel: InitialMigrationCredentialsDialogViewModel) {
	return m(".mt-24", [
		m(TitleSection, {
			icon: Icons.SimpleArrowRight,
			iconOptions: { color: theme.primary },
			subTitle: lang.getTranslationText("migrationScheduledInfo_msg"),
			title: "",
			style: {
				marginTop: px(size.spacing_16),
				borderRadius: px(size.radius_16),
			},
		} as TitleSectionAttrs),
		m(".mt-24", [
			m(TextField, {
				label: "migrationAccountUsername_label",
				disabled: true,
				value: viewModel.username,
				leadingIcon: { icon: Icons.MailFilled, color: theme.on_surface_variant },
			}),
			viewModel.isOAuth
				? null
				: m(TextField, {
						label: "migrationImapAccountPassword_label",
						value: viewModel.password,
						oninput: (newVal) => (viewModel.password = newVal),
						type: viewModel.renderPasswordVisibly ? LegacyTextFieldType.Text : LegacyTextFieldType.Password,
						leadingIcon: { icon: Icons.GenericLockFilled, color: theme.on_surface_variant },
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
					}),
		]),
		m(
			".flex-end.full-width.pt-32.mb-32",
			m("", {
				style: { width: "260px" },
			}),
		),
	])
}

class InitialMigrationCredentialsDialogViewModel {
	public renderPasswordVisibly: boolean = false
	public disableButton: boolean = false
	public readonly provider: MailboxMigrationProvider
	public readonly isOAuth: boolean
	public username: string
	public password: string

	constructor(
		readonly syncState: MailboxMigrationSyncState,
		readonly userMigrationInfo: UserMigrationInfo,
	) {
		const credentialSource = getMailboxMigrationCredential(syncState, userMigrationInfo)
		this.provider = credentialSource.provider
		this.isOAuth = this.provider !== MailboxMigrationProvider.Other
		this.username = credentialSource.username
		this.password = credentialSource.password ?? ""
	}

	setOAuthToken(tokenEndpointResponse: TokenEndpointResponse) {
		this.userMigrationInfo.credential.oAuthToken = tokenEndpointResponseToOAuthToken(tokenEndpointResponse)
	}

	buildResult(): UpdatedMigrationCredentials {
		const mailboxMigrationImapConfiguration = assertNotNull(this.syncState.imapConfiguration)
		this.userMigrationInfo.credential.username = this.username
		this.userMigrationInfo.credential.password = this.password || null
		return { mailboxMigrationImapConfiguration, userMigrationInfo: this.userMigrationInfo }
	}
}
