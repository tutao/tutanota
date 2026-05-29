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
import { ImapAccount, ImapAccountSyncState } from "@tutao/entities/tutanota"
import { getImapConfigForProvider, ImapProvider } from "../../api/common/utils/imapImportUtils/ImapKnownConfigs"
import { ToggleButton } from "../../../../ui/base/buttons/ToggleButton"
import { ButtonSize } from "../../../../ui/base/ButtonSize"
import { OAuthHandlerFactory } from "../../../mail-app/settings/imapimport/oauth/OAuthHandler"
import { mailLocator } from "../../../mail-app/mailLocator"
import { tokenEndpointResponseToOAuthTokenEndpointResponse } from "../../api/common/utils/imapImportUtils/ImapImportUtils"

export interface UpdateImapCredentialsDialogAttrs {
	syncState: ImapAccountSyncState
	oauthHandlerFactory: OAuthHandlerFactory
}

/**
 * Show a dialog with a preview of a given list of contacts
 * @param attrs the UpdateImapCredentialsDialogAttrs to configure the dialog texts
 * @param okAction The action to be executed when the user presses the confirm button with at least one contact selected
 */
export function showUpdateImapCredentialsDialog(attrs: UpdateImapCredentialsDialogAttrs, okAction: (dialog: Dialog, updatedAccount?: ImapAccount) => unknown) {
	const viewModel: UpdateImapCredentialsDialogViewModel = new UpdateImapCredentialsDialogViewModel(m.redraw, attrs.syncState)
	const dialogHeaderBarAttrs: DialogHeaderBarAttrs = {
		left: [
			{
				type: ButtonType.Secondary,
				label: "close_alt",
				click: () => {
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
									const provider = parseInt(viewModel.imapAccountSyncState.provider) as ImapProvider
									const isOAuth = provider !== ImapProvider.Other
									if (isOAuth) {
										const oauthConfig = getImapConfigForProvider(provider)?.oauthConfig
										if (oauthConfig) {
											const oauthHandler = await attrs.oauthHandlerFactory(oauthConfig, mailLocator.serviceExecutor)
											const extraParams = { login_hint: viewModel.imapAccountSyncState.imapAccount.username }
											await oauthHandler.setupOauthLoginParams(extraParams)
											const responseUrl = await mailLocator
												.getImapImportController()
												.openOauthAuthenticationWindow(oauthHandler.buildAuthorizationUrl(), oauthConfig.redirectUri)
											if (responseUrl) {
												try {
													const updatedToken = await oauthHandler.getAuthTokens(responseUrl)
													viewModel.imapAccountSyncState.imapAccount.oAuthTokenEndpointResponse =
														tokenEndpointResponseToOAuthTokenEndpointResponse(updatedToken)
													okAction(dialog, viewModel.imapAccountSyncState.imapAccount)
												} catch (e) {
													console.log("Failed to refresh token", e)
												}
											}
										}
									} else {
										okAction(dialog, viewModel.imapAccountSyncState.imapAccount)
									}
								},
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
	const provider = parseInt(viewModel.imapAccountSyncState.provider) as ImapProvider
	const isOAuth = provider !== ImapProvider.Other
	const imapAccount = viewModel.imapAccountSyncState.imapAccount
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
			value: imapAccount.username,
			oninput: (value) => (imapAccount.username = value),
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
	const imapCredentials = viewModel.imapAccountSyncState.imapAccount
	return m("", [
		m(
			".flex.row.gap-16.mt-16",
			m(TextField, {
				label: "migrationImapAccountPassword_label",
				value: imapCredentials.password || "",
				oninput: (value) => (imapCredentials.password = value),
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
				value: imapCredentials.host,
				oninput: (value) => (imapCredentials.host = value),
				leadingIcon: {
					icon: Icons.ServerFilled,
					color: theme.on_surface_variant,
				},
			}),
			m(TextField, {
				label: "migrationImapAccountPort_label",
				class: "",
				value: imapCredentials.port.toString(),
				oninput: (value) => {
					const typedNumber = Number.parseInt(value)
					imapCredentials.port = Number.isNaN(typedNumber) ? "0" : typedNumber.toString()
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
	constructor(
		readonly updateUi: () => void,
		readonly imapAccountSyncState: ImapAccountSyncState,
	) {}
}
