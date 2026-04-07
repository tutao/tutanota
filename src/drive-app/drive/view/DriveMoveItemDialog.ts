import { Dialog, DialogType } from "../../../common/gui/base/Dialog"
import m, { Children, Component, Vnode, VnodeDOM } from "mithril"
import { theme } from "../../../common/gui/theme"
import { DriveBreadcrumbs, DriveBreadcrumbsAttrs } from "./DriveBreadcrumbs"
import { PrimaryButton, TertiaryButton, TertiaryButtonAttrs } from "../../../common/gui/base/buttons/VariantButtons.js"
import { Icons } from "../../../common/gui/base/icons/Icons"
import { lang } from "../../../common/misc/LanguageViewModel"
import { driveTypeRefs } from "@tutao/typerefs"
import { DriveFolderBrowser, DriveFolderBrowserAttrs } from "./DriveFolderBrowser"
import { EntityClient } from "../../../common/api/common/EntityClient"
import { DriveFacade } from "../../../common/api/worker/facades/lazy/DriveFacade"
import { assertNotNull } from "@tutao/utils"
import { FolderItem, folderItemEntity, FolderItemId, folderItemToId, toFolderItems } from "./DriveUtils"
import { getElementId, isSameId } from "@tutao/typerefs"
import { DialogHeaderBar } from "../../../common/gui/base/DialogHeaderBar"
import { ButtonType } from "../../../common/gui/base/Button"
import { Icon, IconSize } from "../../../common/gui/base/Icon"
import { driveFolderName } from "./DriveGuiUtils"
import { LoginTextField } from "../../../common/gui/base/LoginTextField"
import { styles } from "../../../common/gui/styles"
import { component_size, size } from "../../../common/gui/size"

interface State {
	currentFolder: driveTypeRefs.DriveFolder
	items: readonly FolderItem[]
	parents: readonly driveTypeRefs.DriveFolder[]
	newFolderName: string | null
}

export type MoveItems = (items: readonly FolderItemId[], destinationFolder: driveTypeRefs.DriveFolder) => Promise<void>

/**
 * Shows a dialog for interactively choosing a destination to move an item to.
 * It also enables the user to create a new destination folder.
 */
export async function showMoveDialog(entityClient: EntityClient, driveFacade: DriveFacade, itemsToMove: FolderItem[], moveItems: MoveItems) {
	const firstItem = assertNotNull(itemsToMove.at(0))
	const parentFolderId = firstItem.type === "file" ? firstItem.file.folder : assertNotNull(firstItem.folder.parent)
	// TODO: show a progress here?
	let state: State = await loadFolder(parentFolderId)
	const loadParents = async () => driveFacade.getFolderParents(state.currentFolder._id) // this.driveViewModel.getMoreParents()
	let itemLabel: string
	if (itemsToMove.length === 1) {
		itemLabel = firstItem.type === "file" ? firstItem.file.name : firstItem.folder.name
	} else {
		itemLabel = lang.getTranslation("movingItemCount_label", { "{count}": itemsToMove.length }).text
	}

	async function loadFolder(folderId: IdTuple): Promise<State> {
		const currentFolder = await entityClient.load(driveTypeRefs.DriveFolderTypeRef, folderId)

		const contents = await driveFacade.getFolderContents(folderId)
		const items = toFolderItems(contents)
		const parents = currentFolder.parent ? [await entityClient.load(driveTypeRefs.DriveFolderTypeRef, currentFolder.parent)] : []
		return { currentFolder, parents, items, newFolderName: null }
	}

	let folderBrowserDom: HTMLElement | null = null

	const moveDialog = new Dialog(
		DialogType.EditLarger,
		class DriveMoveDialog implements Component {
			view(): Children {
				const { currentFolder, parents, items: currentFolderItems, newFolderName } = state
				const disabledTargetIds = new Set(itemsToMove.map(folderItemEntity).map(getElementId))
				return [
					m(DialogHeaderBar, {
						left: [{ label: `close_alt`, click: () => moveDialog.close(), type: ButtonType.Secondary }],
						middle: "move_action",
						right: [
							{
								label: "moveItemHere_action",
								click: () => {
									moveItems(itemsToMove.map(folderItemToId), state.currentFolder)
									moveDialog.close()
								},
								type: ButtonType.Secondary,
							},
						],
					}),
					m(
						".plr-16.pt-16.pb-16.flex.col.gap-24.border-radius-8",
						{
							style: {
								background: theme.surface_container,
								// Limit the dialog height. The dialog itself is trying to shrink to the content so
								// we have to define the height somehow. We take the smallest out of 600px, 90vh and
								// the parent dialog size (minus the header) for the case when the window is shorter
								// than 600px.
								// We can't use 100% to get the parent height because it forces dialog to grow full
								// height so instead we use the known dialog margin to calculate it.
								height: `min(600px, 90vh, calc(100vh - (${size.spacing_12}px * 2) - ${component_size.button_height}px)`,
							},
						},
						[
							m(".flex.gap-12", [
								m(Icon, {
									icon: Icons.Move,
									size: IconSize.PX24,
									style: {
										fill: theme.on_surface_variant,
									},
								}),
								m(".b.uppercase.text-ellipsis", { "data-testid": "dialog:movingItem_title" }, itemLabel),
							]),
							m(
								".border-radius-6.plr-16.pt-12.pb-12",
								{
									style: {
										background: theme.surface,
									},
								},
								m(DriveBreadcrumbs, {
									currentFolder,
									parents,
									loadParents,
									onClick: (f: driveTypeRefs.DriveFolder, e: MouseEvent) => {
										e.preventDefault()
										this.onOpenFolder(f)
									},
								} satisfies DriveBreadcrumbsAttrs),
							),
							m(".flex.col.gap-8.min-height-0", [
								m(".small.uppercase.font-weight-700", lang.getTranslationText("folderContent_label")),
								[
									m(DriveFolderBrowser, {
										key: getElementId(currentFolder),
										items: currentFolderItems,
										disabledTargetIds,
										onItemClicked: (item: FolderItem) => {
											if (
												item.type === "folder" &&
												!itemsToMove.some((itemToMove) => isSameId(item.folder._id, folderItemEntity(itemToMove)._id))
											) {
												this.onOpenFolder(item.folder)
											}
										},
										oncreate: ({ dom }: VnodeDOM<DriveFolderBrowserAttrs>) => {
											folderBrowserDom = dom as HTMLElement
										},
									}),
								],
							]),
							m(".flex-grow.flex.col.gap-16.justify-end", [
								m("hr.hr.mt-8"),
								newFolderName == null
									? m(
											".flex.row",

											m(TertiaryButton, {
												icon: Icons.Plus,
												width: "flex",
												label: "createFolder_action",
												onclick: () => {
													state.newFolderName = ""
												},
											} satisfies TertiaryButtonAttrs),
										)
									: [
											m(
												".small.uppercase.font-weight-700",
												lang.getTranslation(`createNewFolderIn_label`, { "{folderName}": driveFolderName(currentFolder).text }).text,
											),
											m(DriveFolderBrowserNewFolderEntry, {
												newFolderName: newFolderName,
												onNewFolderNameInput: (name) => {
													state.newFolderName = name
												},
												onCreateFolder: () => this.onCreateFolder(newFolderName, currentFolder),
											}),
										],
							]),
						],
					),
				]
			}

			private async onCreateFolder(newFolderNameCaptured: string, currentFolder: driveTypeRefs.DriveFolder) {
				state.newFolderName = null
				m.redraw()
				const newFolder = await driveFacade.createFolder(newFolderNameCaptured, currentFolder._id)
				state = await loadFolder(newFolder._id)
				m.redraw()
			}

			private async onOpenFolder(folder: driveTypeRefs.DriveFolder) {
				state = await loadFolder(folder._id)
				m.redraw()
			}
		},
	)
		.setFocusOnLoadFunction(() => {
			// right now assumes that the children been already loaded and rendered. Probably need to change this
			// when we show the dialog while loading the contents

			// keeping this one in addition to the focus in DriveFolderBrowser to make sure that we focus when it's
			// possible
			const firstListItem = folderBrowserDom?.querySelector("[role=row]") as HTMLElement | null
			firstListItem?.focus()
		})
		.show()
}

interface DriveFolderBrowserNewFolderEntryAttrs {
	newFolderName: string
	onNewFolderNameInput: (name: string) => unknown
	onCreateFolder: () => unknown
}

export class DriveFolderBrowserNewFolderEntry implements Component<DriveFolderBrowserNewFolderEntryAttrs> {
	view({ attrs: { newFolderName, onNewFolderNameInput, onCreateFolder } }: Vnode<DriveFolderBrowserNewFolderEntryAttrs>): Children {
		return m(
			".flex.row.items-center.gap-12",
			{
				style: {
					flexDirection: styles.isDesktopLayout() ? "row" : "column",
				},
			},
			[
				m(LoginTextField, {
					class: "flex-grow",
					label: "folderName_label",
					value: newFolderName,
					oninput: onNewFolderNameInput,
					onReturnKeyPressed: onCreateFolder,
					onDomInputCreated: (dom) => dom.focus(),
					leadingIcon: {
						icon: Icons.FolderFilled,
						color: theme.on_surface_variant,
					},
				}),
				m(PrimaryButton, {
					size: "md",
					label: "createFolder_action",
					width: styles.isDesktopLayout() ? "flex" : "full",
					onclick: onCreateFolder,
				}),
			],
		)
	}
}
