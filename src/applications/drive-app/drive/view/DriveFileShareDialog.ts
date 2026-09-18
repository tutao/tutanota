import m, { Children, Component } from "mithril"
import { Dialog, DialogType } from "../../../../ui/base/Dialog"
import { DialogHeaderBar } from "../../../../ui/base/DialogHeaderBar"
import { Button, ButtonType } from "../../../../ui/base/Button"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import { FileFolderItem } from "./DriveUtils"
import { TextField } from "../../../../ui/base/TextField"
import { isNotNull } from "@tutao/utils"
import { Icons } from "../../../../ui/base/icons/Icons"
import { IconButton } from "../../../../ui/base/IconButton"
import { px, size } from "../../../../ui/size"
import { PrimaryButton } from "../../../../ui/base/buttons/VariantButtons"
import { copyToClipboard } from "../../../../ui/utils/ClipboardUtils"
import { showInfoSnackbar } from "../../../../ui/base/SnackBar"
import { DriveFacade, DriveShareInfo } from "../../../common/api/worker/facades/lazy/DriveFacade"
import { progressIcon } from "../../../../ui/base/Icon"

type ShareDialogState = "busy" | "done"

export class DriveFileShareDialog {
	constructor(private readonly driveFacade: DriveFacade) {}

	show(item: FileFolderItem) {
		void showFileShareDialog(this.driveFacade, item)
	}
}

async function showFileShareDialog(driveFacade: DriveFacade, item: FileFolderItem) {
	let shareInfo: DriveShareInfo | null = item.file.share ? await driveFacade.getShareInfo(item.file) : null
	let state: ShareDialogState = "done"

	const dialog = new Dialog(
		DialogType.EditMedium,
		class DriveFileShareDialog implements Component {
			view(): Children {
				return m(".flex.col", {}, [
					m(DialogHeaderBar, {
						left: [{ label: `close_alt`, click: () => dialog.close(), type: ButtonType.Secondary }],
					}),
					m(".flex.col.mlr-16.mt-8.mb-16", [
						m(".b.text-ellipsis", item.file.name),
						shareInfo == null
							? [
									m(
										".flex.col.items-center",
										state === "busy"
											? progressIcon()
											: m(PrimaryButton, {
													style: {
														margin: "8px auto 0 auto",
													},
													width: "flex",
													// FIXME
													label: lang.makeTranslation("createLink_action", "Create a share link"),
													onclick: () => void this.createShareLink(),
												}),
									),
								]
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
									m(Button, {
										class: ["align-self-end"],
										type: ButtonType.Secondary,
										label: lang.makeTranslation("deleteLink_action", "Delete link"),
										click: () => {
											// FIXME show progress
											driveFacade.deleteShareLink(item.file)
											shareInfo = null
											m.redraw()
										},
									}),
								]),
					]),
				])
			}
			private async createShareLink() {
				state = "busy"
				try {
					shareInfo = await driveFacade.createShareLink(item.file)
				} finally {
					state = "done"
					m.redraw()
				}
			}
		},
	)
	dialog.show()
}
