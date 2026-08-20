import { Dialog, DialogType } from "../../../../ui/base/Dialog.js"
import { lang } from "../../../../ui/utils/LanguageViewModel.js"
import m from "mithril"
import { DialogHeaderBar, DialogHeaderBarAttrs } from "../../../../ui/base/DialogHeaderBar.js"
import { ButtonType } from "../../../../ui/base/Button.js"
import { theme } from "../../../../ui/theme"
import { ContentWithOptionsDialog } from "../../../../ui/dialogs/ContentWithOptionsDialog"
import { TitleSection, TitleSectionAttrs } from "../../../../ui/TitleSection"
import { font_size, px, size } from "../../../../ui/size"
import { TextField } from "../../../../ui/base/TextField"
import { Icons } from "../../../../ui/base/icons/Icons"
import { LegacyTextFieldType } from "../../../../ui/base/LegacyTextField"
import { ToggleButton } from "../../../../ui/base/buttons/ToggleButton"
import { ButtonSize } from "../../../../ui/base/ButtonSize"
import { ImapAccount, ImapAccountSyncState } from "@tutao/entities/tutanota"
import { OAuthHandlerFactory } from "../../../mail-app/settings/imapimport/oauth/OAuthHandler"
import { getImapConfigForProvider, ImapProvider } from "../../api/common/utils/imapImportUtils/ImapKnownConfigs"
import { tokenEndpointResponseToOAuthTokenEndpointResponse } from "../../api/common/utils/imapImportUtils/ImapImportUtils"
import { mailLocator } from "../../../mail-app/mailLocator"

export interface ImapPasswordInputDialogAttrs {
	syncState: ImapAccountSyncState
	oauthHandlerFactory?: OAuthHandlerFactory
}

/**
 * Show a dialog where the user enters their IMAP password (for custom providers) or starts OAuth (for known providers).
 * All other connection details are displayed as read‑only.
 *
 * @param attrs    The dialog attributes (contains the syncState with connection details).
 * @param okAction Called with the updated account when the user confirms (password set or OAuth tokens obtained).
 * @param onClose  Called when the dialog is closed without confirming (or after okAction).
 */
export function showInitialImapCredentialsDialog(
	attrs: ImapPasswordInputDialogAttrs,
	okAction: (dialog: Dialog, updatedAccount?: ImapAccount) => unknown,
	onClose: () => void,
) {
	const viewModel = {
		password: "",
		showPassword: false,
		disableButton: false,
	}

	const imapAccount = attrs.syncState.imapAccount
	const provider = parseInt(attrs.syncState.provider) as ImapProvider
	const isOAuth = provider !== ImapProvider.Other

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
										if (isOAuth) {
											// OAuth flow
											if (!attrs.oauthHandlerFactory) {
												Dialog.message("migrationGenericError_msg")
												return
											}
											const oauthConfig = getImapConfigForProvider(provider)?.oauthConfig
											if (!oauthConfig) {
												Dialog.message("migrationGenericError_msg")
												return
											}
											const oauthHandler = await attrs.oauthHandlerFactory(oauthConfig, mailLocator.serviceExecutor)
											const extraParams = { login_hint: imapAccount.username }
											await oauthHandler.setupOauthLoginParams(extraParams)
											const responseUrl = await mailLocator
												.getImapMailImportController()
												.openOauthAuthenticationWindow(oauthHandler.buildAuthorizationUrl(), oauthConfig.redirectUri)
											if (responseUrl) {
												try {
													const updatedToken = await oauthHandler.getAuthTokens(responseUrl)
													imapAccount.oAuthTokenEndpointResponse = tokenEndpointResponseToOAuthTokenEndpointResponse(updatedToken)
													okAction(dialog, imapAccount)
												} catch (e) {
													console.error("OAuth token exchange failed", e)
													Dialog.message("migrationGenericError_msg")
												}
											} else {
												// User closed the window or no response
												Dialog.message("migrationGenericError_msg")
											}
										} else {
											// Password flow
											if (!viewModel.password || viewModel.password.trim() === "") {
												Dialog.message("migrationGenericError_msg")
												return
											}
											imapAccount.password = viewModel.password
											okAction(dialog, imapAccount)
										}
									} catch (e) {
										console.error("Migration credential update failed", e)
										Dialog.message("migrationGenericError_msg")
									} finally {
										viewModel.disableButton = false
										dialog.close()
									}
								},
								disableMainActionButton: viewModel.disableButton,
								subActionText: null,
								subActionClick: () => {},
							},
							renderContent(imapAccount, isOAuth, viewModel),
						),
					),
				],
			)
		},
	})

	dialog.show()
}

function renderContent(
	imapAccount: ImapAccount,
	isOAuth: boolean,
	viewModel: {
		password: string
		showPassword: boolean
		disableButton: boolean
	},
) {
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
			// Username (always disabled)
			m(TextField, {
				label: "migrationAccountUsername_label",
				disabled: true,
				value: imapAccount.username,
				leadingIcon: { icon: Icons.MailFilled, color: theme.on_surface_variant },
			}),

			// For OAuth providers, show a hint; for others, show the password field
			isOAuth
				? m(
						".mt-16",
						m(
							"p",
							{
								style: {
									color: theme.on_surface_variant,
									fontSize: px(font_size.small),
									margin: 0,
								},
							},
							lang.getTranslationText("migrationOAuthSignInInfo_msg"),
						),
					)
				: m(TextField, {
						label: "migrationImapAccountPassword_label",
						value: viewModel.password,
						oninput: (newVal) => (viewModel.password = newVal),
						type: viewModel.showPassword ? LegacyTextFieldType.Text : LegacyTextFieldType.Password,
						leadingIcon: { icon: Icons.GenericLockFilled, color: theme.on_surface_variant },
						injectionsRight: () => {
							return m(ToggleButton, {
								title: viewModel.showPassword ? "concealPassword_action" : "revealPassword_action",
								toggled: viewModel.showPassword,
								onToggled: (_, e) => {
									viewModel.showPassword = !viewModel.showPassword
									e.stopPropagation()
								},
								icon: viewModel.showPassword ? Icons.EyeCrossedFilled : Icons.EyeFilled,
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
