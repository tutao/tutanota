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
import { ToggleButton } from "../../../../ui/base/buttons/ToggleButton"
import { ButtonSize } from "../../../../ui/base/ButtonSize"
import { ImapAccount, ImapAccountSyncState } from "@tutao/entities/tutanota"
import { OAuthHandlerFactory } from "../../../mail-app/settings/imapimport/oauth/OAuthHandler"

export interface ImapPasswordInputDialogAttrs {
	syncState: ImapAccountSyncState
	oauthHandlerFactory?: OAuthHandlerFactory
}

/**
 * Show a dialog where the user enters their IMAP password.
 * All other connection details are displayed as read‑only.
 *
 * @param attrs    The dialog attributes (contains the syncState with connection details).
 * @param okAction Called with the entered password when the user confirms.
 * @param onClose  Called when the dialog is closed without confirming (or after okAction).
 */
export function showInitialImapCredentialsDialog(
	attrs: ImapPasswordInputDialogAttrs,
	okAction: (dialog: Dialog, updatedAccount?: ImapAccount) => unknown,
	onClose: () => void,
) {
	const imapAccount = attrs.syncState.imapAccount
	let password = ""
	let showPassword = false
	let disableConfirmButton = false

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
					m(DialogHeaderBar, headerBarAttrs),
					m(
						".plr-24.flex-grow",
						m(
							ContentWithOptionsDialog,
							{
								mainActionText: "migrationStart_action",
								mainActionClick: async () => {
									if (!password || password.trim() === "") {
										Dialog.message("migrationGenericError_msg")
										return
									}
									disableConfirmButton = true
									try {
										imapAccount.password = password
										okAction(dialog, imapAccount)
									} catch (e) {
										Dialog.message("migrationGenericError_msg")
									} finally {
										disableConfirmButton = false
										dialog.close()
									}
								},
								disableMainActionButton: disableConfirmButton,
								subActionText: null,
								subActionClick: () => {},
							},
							renderContent(
								imapAccount,
								password,
								showPassword,
								(newVal) => {
									password = newVal
								},
								() => {
									showPassword = !showPassword
								},
							),
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
	password: string,
	showPassword: boolean,
	onPasswordChange: (newVal: string) => void,
	onToggleVisibility: () => void,
) {
	return m(".mt-24", [
		m(TitleSection, {
			icon: Icons.ServerFilled,
			iconOptions: { color: theme.primary },
			subTitle: lang.getTranslationText("migrationUpdateCredentialsInfo_msg"),
			title: "",
			style: {
				marginTop: px(size.spacing_16),
				borderRadius: px(size.radius_16),
			},
		} as TitleSectionAttrs),
		m(".mt-24", [
			// Username (disabled)
			m(TextField, {
				label: "migrationAccountUsername_label",
				disabled: true,
				value: imapAccount.username,
				leadingIcon: { icon: Icons.MailFilled, color: theme.on_surface_variant },
			}),
			// Host (disabled)
			m(TextField, {
				label: "migrationImapAccountHost_label",
				disabled: true,
				value: imapAccount.host,
				leadingIcon: { icon: Icons.ServerFilled, color: theme.on_surface_variant },
			}),
			// Port (disabled)
			m(TextField, {
				label: "migrationImapAccountPort_label",
				disabled: true,
				value: imapAccount.port,
				leadingIcon: { icon: Icons.KeyFilled, color: theme.on_surface_variant },
			}),
			// Password (editable, with toggle)
			m(TextField, {
				label: "migrationImapAccountPassword_label",
				value: password,
				oninput: onPasswordChange,
				type: showPassword ? LegacyTextFieldType.Text : LegacyTextFieldType.Password,
				leadingIcon: { icon: Icons.GenericLockFilled, color: theme.on_surface_variant },
				injectionsRight: () => {
					return m(ToggleButton, {
						title: showPassword ? "concealPassword_action" : "revealPassword_action",
						toggled: showPassword,
						onToggled: (_, e) => {
							onToggleVisibility()
							e.stopPropagation()
						},
						icon: showPassword ? Icons.EyeCrossedFilled : Icons.EyeFilled,
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
