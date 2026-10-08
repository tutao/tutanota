import m, { Children, Component } from "mithril"
import { Dialog, DialogType } from "../../../../ui/base/Dialog"
import { DialogHeaderBar } from "../../../../ui/base/DialogHeaderBar"
import { Button, ButtonType } from "../../../../ui/base/Button"
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
import { PrimaryButton, SecondaryButton, SecondaryButtonAttrs } from "../../../../ui/base/buttons/VariantButtons"
import { Switch } from "../../../../ui/base/Switch"
import { PasswordFieldNew } from "../../../common/signup/components/PasswordFieldNew"
import { DatePicker } from "../../../calendar-app/calendar/gui/pickers/DatePicker"
import { DriveFile, DriveFileShare } from "@tutao/entities/drive"
import { showProgressDialog } from "../../../../ui/dialogs/ProgressDialog"
import { idToElementId } from "@tutao/meta"
import { isNull } from "../../../../platform-kit/utils/Utils"
import { DriveFileSharingFacade, DriveShareInfo } from "../../../common/api/worker/facades/lazy/DriveFileSharingFacade"

type ShareDialogState = "busy" | "done"

export class DriveFileShareDialog {
	constructor(private readonly driveFileSharingFacade: DriveFileSharingFacade) {}

	async show(item: FileFolderItem) {
		let file = item.file
		if (isNull(file.share)) {
			;[file] = await showProgressDialog(lang.getTranslation("creatingShare_msg"), this.driveFileSharingFacade.createShareLink(file, null, null))
		}

		showFileShareDialog(this.driveFileSharingFacade, file)
	}
}

async function showFileShareDialog(driveFileSharingFacade: DriveFileSharingFacade, file: DriveFile) {
	let shareInfo: DriveShareInfo | null = null
	let state: ShareDialogState = "busy"

	const shareId = idToElementId(assertNotNull(file.share))

	// reload file in case we just created the share
	driveFileSharingFacade.getShareInfo(shareId).then((info) => {
		shareInfo = info
		state = "done"
		m.redraw()
	})

	const dialog = new Dialog(
		DialogType.EditMedium,
		class DriveFileShareDialog implements Component {
			view(): Children {
				return m(".flex.col", {}, [
					m(DialogHeaderBar, {
						left: [{ label: `close_alt`, click: () => dialog.close(), type: ButtonType.Secondary }],
						middle: "share_action", // FIXME: Introduce translation key that says "Share a link"
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
							: m(".flex.col", [
									m(".flex.gap-8.items-center", [
										m(TextField, {
											// isReadOnly: true,
											// FXIME
											label: lang.getTranslation("shareALink_label"),
											value: shareInfo.publicLink,
											// FIXME: test with screen reader
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
									m(".flex.row.mt-16.justify-between", [
										m(SecondaryButton, {
											label: lang.getTranslation("setPasswordAndExpiration_label"),
											onclick: () => {
												showFileShareDetailsDialog(
													driveFileSharingFacade,
													async () => {
														state = "busy"
														m.redraw()
														shareInfo = await driveFileSharingFacade.getShareInfo(shareId)
														state = "done"
														m.redraw()
													},
													assertNotNull(shareInfo).share,
													file.name,
													shareInfo?.password ?? null,
												)
											},
											style: {
												border: `1px solid ${theme.outline}`,
												color: theme.on_surface_variant,
											},
											width: "flex",
										} satisfies SecondaryButtonAttrs),
										m(Button, {
											class: ["align-self-end"],
											type: ButtonType.Secondary,
											label: lang.getTranslation("deleteLink_action"),
											click: () => {
												// FIXME show progress
												driveFileSharingFacade.deleteShareLink(file)
												shareInfo = null
												dialog.close()
												const message = lang.getTranslation("shareDeleted_msg", { "{fileName}": file.name })
												showSnackBar({ message })
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

async function showFileShareDetailsDialog(
	driveFileSharingFacade: DriveFileSharingFacade,
	reloadShare: () => Promise<unknown>,
	share: DriveFileShare,
	fileName: string,
	password: string | null,
) {
	const dialog = new Dialog(
		DialogType.EditMedium,
		class DriveFileShareDialog implements Component {
			private doPassword: boolean = isNotNull(password)
			private doExpiry: boolean = isNotNull(share.expirationDate)
			private passwordValue: string = password ?? ""
			private expirationDate: Date | null = share.expirationDate

			async updateShareAndReload(password: string | null, expirationDate: Date | null): Promise<void> {
				await driveFileSharingFacade.updateShare(share, password, expirationDate)
				await reloadShare()
			}

			view(): Children {
				return m(".flex.col", {}, [
					m(DialogHeaderBar, {
						left: [{ label: `close_alt`, click: () => dialog.close(), type: ButtonType.Secondary }],
						middle: "shareALink_label",
					}),
					m(".flex.col.mlr-16.mt-16.mb-16.gap-16", [
						m(".flex.gap-12", [
							m(Icon, {
								icon: Icons.PersonAddFilled,
								size: IconSize.PX24,
								style: {
									fill: theme.on_surface_variant,
								},
							}),
							m(".b.uppercase.text-ellipsis", { "data-testid": "test:fileShareDetailsLabel" }, fileName),
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
								class: this.doPassword ? "" : "translucent",
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
								classes: this.doExpiry ? [] : ["translucent"],
								date: this.expirationDate,
								label: lang.getTranslation("selectExpiryDate_label"),
								onDateSelected: (selectedDate) => {
									this.expirationDate = normalizeShareExpirationDate(selectedDate)
								},
								startOfTheWeekOffset: 0, //FIXME
								noPadding: true,
								useNewTextField: true,
								disabled: !this.doExpiry,
							}),
						),

						m(
							".flex.row.align-self-end",
							m(PrimaryButton, {
								style: {
									margin: "8px auto 0 auto",
								},
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

									dialog.close()
									showProgressDialog(
										lang.getTranslation("updatingShare_msg"),
										this.updateShareAndReload(this.doPassword ? this.passwordValue : null, this.doExpiry ? this.expirationDate : null),
									)
								},
							}),
						),
					]),
				])
			}
		},
	)
	dialog.show()
}
