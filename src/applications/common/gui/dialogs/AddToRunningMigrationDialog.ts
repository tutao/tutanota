import m from "mithril"
import { ContentWithOptionsDialog } from "../../../../ui/dialogs/ContentWithOptionsDialog"
import { TitleSection, TitleSectionAttrs } from "../../../../ui/TitleSection"
import { TextField } from "../../../../ui/base/TextField"
import { px, size } from "../../../../ui/size"
import { Dialog, DialogType } from "../../../../ui/base/Dialog.js"
import { DialogHeaderBar, DialogHeaderBarAttrs } from "../../../../ui/base/DialogHeaderBar.js"
import { ButtonType } from "../../../../ui/base/Button.js"
import { theme } from "../../../../ui/theme"
import { Icons } from "../../../../ui/base/icons/Icons"
import { showProgressDialog } from "../../../../ui/dialogs/ProgressDialog"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import { isMailAddress } from "@tutao/utils"
import { CustomerMigrationInformation, GroupInfo, User } from "@tutao/entities/sys"
import { mailLocator } from "../../../mail-app/mailLocator"

export type AddToMigrationTarget = { kind: "user"; user: User } | { kind: "sharedMailbox"; groupInfo: GroupInfo }

/**
 * Shows a dialog for adding an existing user or shared mailbox to an already-running admin multi-user
 * migration batch: the admin enters the mailbox's old (source) IMAP address, and a mailbox migration is
 * scheduled for it using the running batch's IMAP configuration.
 */
// fixme move this and other migration related errors to mail-app after discussing with the others.
export function showAddToRunningMigrationDialog(target: AddToMigrationTarget, customerMigrationInformation: CustomerMigrationInformation): void {
	const viewModel = { oldMailAddress: "" }

	const headerBarAttrs: DialogHeaderBarAttrs = {
		left: [
			{
				type: ButtonType.Secondary,
				label: "close_alt",
				click: () => dialog.close(),
			},
		],
		middle: "migration_title",
	}

	const dialog = new Dialog(DialogType.EditMedium, {
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
					m(DialogHeaderBar, headerBarAttrs),
					m(
						".plr-24.flex-grow",
						m(
							ContentWithOptionsDialog,
							{
								mainActionText: "migrationStart_action",
								mainActionClick: async () => {
									try {
										if (target.kind === "user") {
											await showProgressDialog(
												"startingMigration_msg",
												mailLocator
													.getCustomerMigrationController()
													.addUserToExistingMigration(target.user, customerMigrationInformation, viewModel.oldMailAddress),
											)
										} else {
											await showProgressDialog(
												"startingMigration_msg",
												mailLocator
													.getCustomerMigrationController()
													.addMailboxToExistingMigration(target.groupInfo, customerMigrationInformation, viewModel.oldMailAddress),
											)
										}
										dialog.close()
									} catch (e) {
										console.error("IMAP import failed", e)
										Dialog.message("migrationGenericError_msg")
									}
								},
								disableMainActionButton: !isMailAddress(viewModel.oldMailAddress, true),
								subActionText: null,
								subActionClick: () => {},
							},
							m(".mt-24", [
								m(TitleSection, {
									icon: Icons.SimpleArrowRight,
									iconOptions: { color: theme.on_surface_variant },
									subTitle: lang.getTranslationText(
										target.kind === "user" ? "migrationAddUserExplanation_msg" : "migrationAddMailboxExplanation_msg",
									),
									title: "",
									style: {
										marginTop: px(size.spacing_16),
										borderRadius: px(size.radius_16),
									},
								} as TitleSectionAttrs),
								m(TextField, {
									label: "migrationAccountUsername_label",
									value: viewModel.oldMailAddress,
									oninput: (v) => (viewModel.oldMailAddress = v),
									leadingIcon: { icon: Icons.MailFilled, color: theme.on_surface_variant },
								}),
							]),
						),
					),
				],
			),
	})

	dialog.show()
}
