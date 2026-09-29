import m, { Children, Component } from "mithril"
import { Dialog, DialogType } from "../../../../ui/base/Dialog"
import { DialogHeaderBar } from "../../../../ui/base/DialogHeaderBar"
import { Button, ButtonType } from "../../../../ui/base/Button"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import { FileFolderItem } from "./DriveUtils"
import { TextField } from "../../../../ui/base/TextField"
import { assertNotNull, isNotNull } from "@tutao/utils"
import { Icons } from "../../../../ui/base/icons/Icons"
import { IconButton } from "../../../../ui/base/IconButton"
import { px, size } from "../../../../ui/size"
import { copyToClipboard } from "../../../../ui/utils/ClipboardUtils"
import { showInfoSnackbar, showSnackBar } from "../../../../ui/base/SnackBar"
import { DriveFacade, DriveShareInfo } from "../../../common/api/worker/facades/lazy/DriveFacade"
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

type ShareDialogState = "busy" | "done"

export class DriveFileShareDialog {
	constructor(private readonly driveFacade: DriveFacade) {}

	async show(item: FileFolderItem) {
		let file = item.file
		if (isNull(file.share)) {
			;[file] = await showProgressDialog(
				lang.makeTranslation("", "Creating share link"), //FIXME
				this.driveFacade.createShareLink(file, null, null),
			)
		}

		showFileShareDialog(this.driveFacade, file)
	}
}

async function showFileShareDialog(driveFacade: DriveFacade, file: DriveFile) {
	let shareInfo: DriveShareInfo | null = null
	let state: ShareDialogState = "busy"

	const shareId = idToElementId(assertNotNull(file.share))

	// reload file in case we just created the share
	driveFacade.getShareInfo(shareId).then((info) => {
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
											label: lang.makeTranslation("shareLink_label", "Share link"),
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
											label: lang.makeTranslation("", "Set password and expiration date"), // FIXME
											onclick: () => {
												showFileShareDetailsDialog(
													driveFacade,
													async () => {
														state = "busy"
														m.redraw()
														shareInfo = await driveFacade.getShareInfo(shareId)
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
											label: lang.makeTranslation("deleteLink_action", "Delete link"), // FIXME
											click: () => {
												// FIXME show progress
												driveFacade.deleteShareLink(file)
												shareInfo = null
												dialog.close()
												const message = lang.makeTranslation("", `Share link for ${file.name} has been deleted`) //FIXME
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
	driveFacade: DriveFacade,
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
				await driveFacade.updateShare(share, password, expirationDate)
				await reloadShare()
			}

			view(): Children {
				return m(".flex.col", {}, [
					m(DialogHeaderBar, {
						left: [{ label: `close_alt`, click: () => dialog.close(), type: ButtonType.Secondary }],
						middle: "share_action", // FIXME: Introduce translation key that says "Share a link"
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
									ariaLabel: "Secure the file with a password", // FIXME
									onclick: (toggled) => {
										this.doPassword = toggled
									},
									togglePillPosition: "left",
								},
								"Secure the file with a password",
							),
							this.doPassword
								? m(PasswordFieldNew, {
										class: "",
										value: this.passwordValue,
										oninput: (passwordValue) => (this.passwordValue = passwordValue),
									})
								: null,
						),

						m(
							".flex.col.gap-8",
							m(
								Switch,
								{
									checked: this.doExpiry,
									ariaLabel: "Set an expiration date for the link", //FIXME
									onclick: (toggled) => (this.doExpiry = toggled),
									togglePillPosition: "left",
								},
								"Set an expiration date for the link",
							),
							this.doExpiry
								? m(DatePicker, {
										date: this.expirationDate,
										label: lang.makeTranslation("", "Select expiry date"),
										onDateSelected: (selectedDate) => {
											this.expirationDate = selectedDate
										},
										startOfTheWeekOffset: 0, //FIXME
										noPadding: true,
										useNewTextField: true,
									})
								: null,
						),

						m(
							".flex.row.align-self-end",
							m(PrimaryButton, {
								style: {
									margin: "8px auto 0 auto",
								},
								width: "flex",
								// FIXME
								label: lang.makeTranslation("updateLink_action", "Update share link"),
								onclick: () => {
									if (this.doPassword && this.passwordValue.trim() === "") {
										throw new UserError(lang.makeTranslation("", "Password cannot be empty"))
									}
									if (this.doExpiry && isNull(this.expirationDate)) {
										throw new UserError(lang.makeTranslation("", "Expiration date must be set"))
									}
									if (this.doExpiry && assertNotNull(this.expirationDate).getTime() < new Date().getTime()) {
										throw new UserError(lang.makeTranslation("", "Expiration date cannot be in the past"))
									}

									dialog.close()
									showProgressDialog(
										lang.makeTranslation("", "Updating share link"), //FIXME
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
