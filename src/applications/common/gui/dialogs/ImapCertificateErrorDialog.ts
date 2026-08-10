import { ContentWithOptionsDialog } from "../../../../ui/dialogs/ContentWithOptionsDialog"
import { TitleSection, TitleSectionAttrs } from "../../../../ui/TitleSection"
import { px, size } from "../../../../ui/size"
import { Dialog, DialogType } from "../../../../ui/base/Dialog.js"
import { DialogHeaderBar, DialogHeaderBarAttrs } from "../../../../ui/base/DialogHeaderBar.js"
import { ButtonType } from "../../../../ui/base/Button.js"
import { theme } from "../../../../ui/theme"
import { Icons } from "../../../../ui/base/icons/Icons"
import { Keys } from "../../../../platform-kit/app-env"
import m from "mithril"
import { lang } from "../../../../ui/utils/LanguageViewModel"

/**
 * Shows a dialog that lets the user choose how to handle a certificate error during IMAP Migration Wizard.
 * @returns 'ignore', 'upload', or null if the dialog was cancelled/closed.
 */
export function showImapCertificateErrorDialog(): Promise<"ignore" | "upload" | null> {
	return new Promise((resolve) => {
		let dialog: Dialog
		const closeAction = (choice: "ignore" | "upload" | null) => {
			dialog.close()
			resolve(choice)
		}

		const dialogHeaderBarAttrs: DialogHeaderBarAttrs = {
			left: [
				{
					type: ButtonType.Secondary,
					label: "close_alt",
					click: () => closeAction(null),
				},
			],
			middle: "migrationCertificateSecurityWarning_title",
		}

		dialog = new Dialog(DialogType.EditMedium, {
			view: () =>
				m(
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
							".plr-24.flex-grow",
							m(
								ContentWithOptionsDialog,
								{
									mainActionText: "migrationUploadCustomCertificate_action",
									mainActionClick: () => closeAction("upload"),
									subActionText: "migrationIgnoreCertificateErrors_action",
									subActionClick: () => closeAction("ignore"),
								},
								m(".mt-24", [
									m(TitleSection, {
										icon: Icons.SyncProblem,
										iconOptions: { color: theme.error },
										subTitle: lang.getTranslationText("migrationCertificateError_msg"),
										title: "",
										style: {
											marginTop: px(size.spacing_16),
											borderRadius: px(size.radius_16),
										},
									} as TitleSectionAttrs),
								]),
							),
						),
					],
				),
		})
			.setCloseHandler(() => closeAction(null))
			.addShortcut({ key: Keys.ESC, exec: () => closeAction(null), help: "close_alt" })
			.show()
	})
}
