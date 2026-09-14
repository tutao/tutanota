import m, { Children, Component } from "mithril"
import { Dialog, DialogType } from "../../../../ui/base/Dialog"
import { DialogHeaderBar } from "../../../../ui/base/DialogHeaderBar"
import { ButtonType } from "../../../../ui/base/Button"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import { FileFolderItem, normalizeShareExpirationDate } from "./DriveUtils"
import { TextField } from "../../../../ui/base/TextField"
import { assertNotNull, isNotNull } from "@tutao/utils"
import { Icons } from "../../../../ui/base/icons/Icons"
import { IconButton } from "../../../../ui/base/IconButton"
import { px, size } from "../../../../ui/size"
import { copyToClipboard } from "../../../../ui/utils/ClipboardUtils"
import { showInfoSnackbar, showSnackBar } from "../../../../ui/base/SnackBar"
import { Icon, IconSize, progressIcon } from "../../../../ui/base/Icon"
import { UserError } from "../../../common/api/main/UserError"
import { theme } from "../../../../ui/theme"
import { PrimaryButton, SecondaryButton } from "../../../../ui/base/buttons/VariantButtons"
import { Switch } from "../../../../ui/base/Switch"
import { PasswordFieldNew } from "../../../common/signup/components/PasswordFieldNew"
import { DatePicker } from "../../../calendar-app/calendar/gui/pickers/DatePicker"
import { DriveFile } from "@tutao/entities/drive"
import { showProgressDialog } from "../../../../ui/dialogs/ProgressDialog"
import { idToElementId } from "@tutao/meta"
import { isNull } from "../../../../platform-kit/utils/Utils"
import { DriveFileSharingFacade, DriveShareInfo } from "../../../common/api/worker/facades/lazy/DriveFileSharingFacade"
import { Styles } from "../../../../ui/styles"
import { getStartOfTheWeekOffsetForUser } from "../../../common/misc/weekOffset"
import { LoginController } from "../../../common/api/main/LoginController"

type ShareDialogState = "busy" | "done"

export class DriveFileShareDialog {
	constructor(
		private readonly driveFileSharingFacade: DriveFileSharingFacade,
		private readonly logins: LoginController,
	) {}

	async show(item: FileFolderItem) {
		let file = item.file
		let shareInfo: DriveShareInfo
		if (isNull(file.share)) {
			;[file, shareInfo] = await showProgressDialog(
				lang.getTranslation("creatingShare_msg"),
				this.driveFileSharingFacade.createShareLink(file, null, null),
			)
		} else {
			shareInfo = await showProgressDialog("loading_msg", this.driveFileSharingFacade.getShareInfo(idToElementId(file.share)))
		}

		showFileShareDialog(this.driveFileSharingFacade, this.logins, file, shareInfo)
	}
}

async function showFileShareDialog(driveFileSharingFacade: DriveFileSharingFacade, logins: LoginController, file: DriveFile, shareInfo: DriveShareInfo | null) {
	let state: ShareDialogState = "done"

	const shareId = idToElementId(assertNotNull(file.share))

	// reload file in case we just created the share
	const dialog = new Dialog(
		DialogType.EditMedium,
		class DriveFileShareDialog implements Component {
			private doPassword: boolean = isNotNull(shareInfo?.password)
			private doExpiry: boolean = isNotNull(shareInfo?.share.expirationDate)
			private passwordValue: string = shareInfo?.password ?? ""
			private expirationDate: Date | null = shareInfo?.share.expirationDate ?? null

			async reloadShare() {
				state = "busy"
				m.redraw()
				shareInfo = await driveFileSharingFacade.getShareInfo(shareId)
				state = "done"
				m.redraw()
			}
			async updateShareAndReload(password: string | null, expirationDate: Date | null): Promise<void> {
				await driveFileSharingFacade.updateShare(assertNotNull(shareInfo?.share), password, expirationDate)
				await this.reloadShare()
			}

			resolveInputFieldClasses(fieldIsActive: boolean): string[] {
				const classes: string[] = []
				if (!fieldIsActive) classes.push("translucent")
				classes.push(Styles.get().isMobileLayout() ? "full-width" : "three-quarter-width")
				return classes
			}

			view(): Children {
				return m(".flex.col", {}, [
					m(DialogHeaderBar, {
						left: [{ label: `close_alt`, click: () => dialog.close(), type: ButtonType.Secondary }],
						middle: "share_action",
					}),
					m(".flex.col.mlr-16.mt-16.mb-16", [
						m(".flex.gap-12", [
							m(Icon, {
								icon: Icons.PersonAddFilled,
								size: IconSize.PX24,
								style: {
									fill: theme.on_surface_variant,
								},
							}),
							m(".b.uppercase.text-ellipsis", { "data-testid": "test:fileShareDetailsLabel" }, file.name),
						]),
						shareInfo == null
							? [m(".flex.col.items-center.gap-8", state === "busy" ? progressIcon() : null)]
							: m(".flex.col.gap-16", [
									m(".flex.gap-8.items-center", [
										m(TextField, {
											// isReadOnly: true,
											// FXIME
											label: lang.getTranslation("shareALink_label"),
											value: shareInfo.publicLink,
											onfocus: (_, input) => {
												input.select()
											},
										}),
										m(IconButton, {
											// compensate for label spacing on text field
											style: { marginTop: px(size.spacing_12) },
											icon: Icons.CopyOutline,
											label: "copy_action",
											click: async () => {
												if (isNotNull(shareInfo)) {
													await copyToClipboard(shareInfo.publicLink)
													showInfoSnackbar("copied_msg")
												}
											},
										}),
									]),
									m(
										".flex.col.gap-8",
										m(
											Switch,
											{
												checked: this.doPassword,
												ariaLabel: lang.getTranslationText("secureWithPassword_label"),
												onclick: (toggled) => {
													this.doPassword = toggled
												},
												togglePillPosition: "left",
											},
											lang.getTranslationText("secureWithPassword_label"),
										),
										m(PasswordFieldNew, {
											class: this.resolveInputFieldClasses(this.doPassword).join(" "),
											value: this.passwordValue,
											disabled: !this.doPassword,
											oninput: (passwordValue) => (this.passwordValue = passwordValue),
										}),
									),

									m(
										".flex.col.gap-8",
										m(
											Switch,
											{
												checked: this.doExpiry,
												ariaLabel: lang.getTranslationText("setExpirationDate_label"),
												onclick: (toggled) => (this.doExpiry = toggled),
												togglePillPosition: "left",
											},
											lang.getTranslationText("setExpirationDate_label"),
										),
										m(DatePicker, {
											classes: this.resolveInputFieldClasses(this.doExpiry),
											date: this.expirationDate,
											label: lang.getTranslation("selectExpiryDate_label"),
											onDateSelected: (selectedDate) => {
												this.expirationDate = normalizeShareExpirationDate(selectedDate)
											},
											startOfTheWeekOffset: getStartOfTheWeekOffsetForUser(logins.getUserController().userSettingsGroupRoot),
											noPadding: true,
											useNewTextField: true,
											disabled: !this.doExpiry,
										}),
									),
									m(".flex.row.gap-16.justify-between.flex-grow", [
										m(SecondaryButton, {
											width: "flex",
											label: lang.getTranslation("deleteLink_action"),
											onclick: async () => {
												dialog.close()
												await showProgressDialog("progressDeleting_msg", driveFileSharingFacade.deleteShareLink(file))
												const message = lang.getTranslation("shareDeleted_msg", { "{fileName}": file.name })
												showSnackBar({ message })
											},
										}),
										m(PrimaryButton, {
											class: "align-self-end",
											width: "flex",
											label: lang.getTranslation("updateLink_action"),
											onclick: () => {
												if (this.doPassword && this.passwordValue.trim() === "") {
													throw new UserError(lang.getTranslation("invalidPassword_msg"))
												}
												if (this.doExpiry && isNull(this.expirationDate)) {
													throw new UserError(lang.getTranslation("expirationDateEmpty_msg"))
												}
												if (this.doExpiry && assertNotNull(this.expirationDate).getTime() < new Date().getTime()) {
													throw new UserError(lang.getTranslation("expirationDateInPast_msg"))
												}

												showProgressDialog(
													lang.getTranslation("updatingShare_msg"),
													this.updateShareAndReload(
														this.doPassword ? this.passwordValue : null,
														this.doExpiry ? this.expirationDate : null,
													),
												)
											},
										}),
									]),
								]),
					]),
				])
			}
		},
	)
	dialog.show()
}
