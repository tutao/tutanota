import { Dialog, DialogType } from "../../../common/gui/base/Dialog"
import m, { Children, Component } from "mithril"
import { theme } from "../../../common/gui/theme"
import { DriveBreadcrumbs, DriveBreadcrumbsAttrs } from "./DriveBreadcrumbs"
import { LoginButton, TertiaryButton, TertiaryButtonAttrs } from "../../../common/gui/base/buttons/LoginButton"
import { Icons } from "../../../common/gui/base/icons/Icons"
import { lang } from "../../../common/misc/LanguageViewModel"
import { DriveFolder, DriveFolderTypeRef } from "../../../common/api/entities/drive/TypeRefs"
import { DriveFolderBrowser } from "./DriveFolderBrowser"
import { EntityClient } from "../../../common/api/common/EntityClient"
import { DriveFacade } from "../../../common/api/worker/facades/lazy/DriveFacade"
import { assertNotNull } from "@tutao/tutanota-utils"
import { FolderItem, folderItemEntity, folderItemToId, moveItems, toFolderItems } from "./DriveUtils"
import { getElementId, isSameId } from "../../../common/api/common/utils/EntityUtils"

interface State {
	currentFolder: DriveFolder
	items: readonly FolderItem[]
	parents: readonly DriveFolder[]
	newFolderName: string | null
}

/**
 * Shows a dialog for interactively choosing a destination to move an item to.
 * It also enables the user to create a new destination folder.
 */
export async function showMoveDialog(entityClient: EntityClient, driveFacade: DriveFacade, itemToMove: FolderItem) {
	const parentFolderId = itemToMove.type === "file" ? itemToMove.file.folder : assertNotNull(itemToMove.folder.parent)
	// TODO: show a progress here?
	let state: State = await loadFolder(parentFolderId)
	const loadParents = async () => driveFacade.getFolderParents(state.currentFolder) // this.driveViewModel.getMoreParents()

	const itemName = itemToMove.type === "file" ? itemToMove.file.name : itemToMove.folder.name
	async function loadFolder(folderId: IdTuple): Promise<State> {
		const currentFolder = await entityClient.load(DriveFolderTypeRef, folderId)

		const contents = await driveFacade.getFolderContents(folderId)
		const items = toFolderItems(contents)
		const parents = currentFolder.parent ? [await entityClient.load(DriveFolderTypeRef, currentFolder.parent)] : []
		return { currentFolder, parents, items, newFolderName: null }
	}

	const moveDialog = new Dialog(
		DialogType.EditLarger,
		class DriveMoveDialog implements Component {
			view(): Children {
				const { currentFolder, parents, items: currentFolderItems, newFolderName } = state
				const disabledTargetIds = new Set([getElementId(folderItemEntity(itemToMove))])
				return m(
					".plr-24.pt-24.pb-24.flex.col.gap-16.border-radius-8",
					{
						style: { background: theme.surface_container, height: "600px" },
					},
					[
						m(
							".h5.b.uppercase.text-ellipsis",
							{ "data-testid": "dialog:movingItem_title" },
							lang.getTranslation("movingItem_title", { "{itemName}": itemName }).text,
						),
						m(".small.b.uppercase", lang.getTranslationText("chooseDestination_title")),
						m(
							"",
							m(DriveBreadcrumbs, {
								currentFolder,
								parents,
								loadParents,
								onClick: (f: DriveFolder, e: MouseEvent) => {
									e.preventDefault()
									this.onOpenFolder(f)
								},
							} satisfies DriveBreadcrumbsAttrs),
						),
						m(DriveFolderBrowser, {
							items: currentFolderItems,
							disabledTargetIds,
							newFolder:
								newFolderName != null
									? {
											newFolderName: newFolderName,
											onNewFolderNameInput: (name) => {
												state.newFolderName = name
											},
											onCreateFolder: () => this.onCreateFolder(newFolderName, currentFolder),
										}
									: null,
							onItemClicked: (item: FolderItem) => {
								if (item.type === "folder" && !isSameId(item.folder._id, folderItemEntity(itemToMove)._id)) {
									this.onOpenFolder(item.folder)
								}
							},
						}),
						m(".flex-grow"),
						m(
							".flex.row.gap-8",
							state.newFolderName == null
								? m(TertiaryButton, {
										icon: Icons.Add,
										width: "flex",
										label: "createFolder_action",
										onclick: () => {
											state.newFolderName = ""
										},
									} satisfies TertiaryButtonAttrs)
								: null,
							m(".flex-grow"),
							m(TertiaryButton, { label: "cancel_action", width: "flex", onclick: () => moveDialog.close() } satisfies TertiaryButtonAttrs),
							m(LoginButton, {
								label: "moveItemHere_action",
								width: "flex",
								onclick: () => {
									moveItems(entityClient, driveFacade, [folderItemToId(itemToMove)], state.currentFolder)
									moveDialog.close()
								},
							}),
						),
					],
				)
			}

			private async onCreateFolder(newFolderNameCaptured: string, currentFolder: DriveFolder) {
				state.newFolderName = null
				m.redraw()
				const newFolder = await driveFacade.createFolder(newFolderNameCaptured, currentFolder._id)
				state = await loadFolder(newFolder._id)
				m.redraw()
			}

			private async onOpenFolder(folder: DriveFolder) {
				state = await loadFolder(folder._id)
				m.redraw()
			}
		},
	).show()
}
