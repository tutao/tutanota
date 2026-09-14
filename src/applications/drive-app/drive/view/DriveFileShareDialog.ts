import m, { Children, Component } from "mithril"
import { Dialog, DialogType } from "../../../../ui/base/Dialog"
import { DialogHeaderBar } from "../../../../ui/base/DialogHeaderBar"
import { Button, ButtonType } from "../../../../ui/base/Button"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import { FileFolderItem } from "./DriveUtils"
import { TextField } from "../../../../ui/base/TextField"
import { getElementId, getListId } from "@tutao/meta"
import { assertNotNull, uint8ArrayToBase64 } from "@tutao/utils"
import { Icons } from "../../../../ui/base/icons/Icons"
import { IconButton } from "../../../../ui/base/IconButton"
import { px, size } from "../../../../ui/size"
import { PrimaryButton } from "../../../../ui/base/buttons/VariantButtons"
import { DriveFileShare } from "@tutao/entities/drive"
import { locator } from "../../../common/api/main/CommonLocator"

interface ShareInfo {
	share: DriveFileShare
	key: Uint8Array<ArrayBuffer>
}

export async function showFileShareDialog(item: FileFolderItem) {
	const cryptoFacade = locator.cryptoFacade
	const driveFacade = locator.driveFacade

	let shareStuff: ShareInfo | null = item.file.share
		? {
				share: item.file.share,
				key: assertNotNull(await cryptoFacade.resolveSessionKeyForInstanceBinary(item.file)),
			}
		: null

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
						shareStuff == null
							? [
									m(
										"",
										m(PrimaryButton, {
											style: {
												margin: "8px auto 0 auto",
											},
											width: "flex",
											// FIXME
											label: lang.makeTranslation("createLink_action", "Create a share link"),
											onclick: async () => {
												// FIXME: show progress
												const share = await driveFacade.createShareLink(item.file)
												shareStuff = {
													share,
													key: assertNotNull(await cryptoFacade.resolveSessionKeyForInstanceBinary(item.file)),
												}
												m.redraw()
											},
										}),
									),
								]
							: m(".flex.col", [
									m(".flex.gap-8.items-center", [
										m(TextField, {
											// isReadOnly: true,
											// FXIME
											label: lang.makeTranslation("shareLink_label", "Share link"),
											// FIXME: real link
											value: `http://localhost:9000/drivefile/${getListId(item.file)}/${getElementId(item.file)}#${uint8ArrayToBase64(shareStuff.key)}`,
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
											click: () => {
												// FIXME
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
											shareStuff = null
											m.redraw()
										},
									}),
								]),
					]),
				])
			}
		},
	)
	dialog.show()
}
