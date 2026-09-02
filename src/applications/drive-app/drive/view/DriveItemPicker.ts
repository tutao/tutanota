import { Dialog, DialogType } from "../../../../ui/base/Dialog"
import m, { Children, Component, Vnode, VnodeDOM } from "mithril"
import { theme } from "../../../../ui/theme"
import { DriveBreadcrumbs, DriveBreadcrumbsAttrs } from "./DriveBreadcrumbs"
import { PrimaryButton, TertiaryButton, TertiaryButtonAttrs } from "../../../../ui/base/buttons/VariantButtons.js"
import { Icons } from "../../../../ui/base/icons/Icons"
import { lang, TranslationKey } from "../../../../ui/utils/LanguageViewModel"
import { DriveFolderBrowser, DriveFolderBrowserAttrs } from "./DriveFolderBrowser"
import { EntityClient } from "../../../../platform-kit/network/EntityClient"
import { DriveFacade } from "../../../common/api/worker/facades/lazy/DriveFacade"
import { getElementId, isSameId, isSameSingleId } from "../../../../platform-kit/meta"
import { FolderFolderItem, FolderItem, folderItemEntity, FolderItemId, folderItemToId, isFolderFolderItem, toFolderItem, toFolderItems } from "./DriveUtils"
import { DialogHeaderBar } from "../../../../ui/base/DialogHeaderBar"
import { ButtonType } from "../../../../ui/base/Button"
import { Icon, IconSize } from "../../../../ui/base/Icon"
import { driveFolderName } from "./DriveGuiUtils"
import { TextField } from "../../../../ui/base/TextField"
import { Styles } from "../../../../ui/styles"
import { component_size, size } from "../../../../ui/size"
import { DriveFolder, DriveFolderTypeRef } from "@tutao/entities/drive"
import { filterInt } from "@tutao/utils"
import { FileReference, MAX_ATTACHMENT_SIZE, WebFile } from "../../../../entities/tutanota/Utils"
import { ListModel } from "../../../common/misc/ListModel"
import { ListAutoSelectBehavior } from "../../../common/misc/DeviceConfig"
import { DataFile } from "../../../../entities/tutanota/MailBundle"

interface State {
	currentFolder: FolderFolderItem
	filesElementIds: readonly string[]
	nonAttachableFileIds: readonly string[]
	parents: readonly FolderFolderItem[]
	newFolderName: string | null
	listModel: ListModel<FolderItem, Id>
}

export type PickedDestinationAction = (items: readonly FolderItemId[], destinationFolder: DriveFolder) => Promise<void>
export type PickedDestinationUploadAction = (items: readonly (DataFile | FileReference | WebFile)[], destinationFolder: DriveFolder) => unknown
export type PickedItemAction = (item: readonly FolderItemId[]) => Promise<void>

export enum DriveItemPickerBehavior {
	PickDestination,
	PickItems,
	PickDestinationForUpload,
}

export type DriveItemPickerAttrs =
	// attributes for picking a destination for a set of files
	| {
			mode: DriveItemPickerBehavior.PickDestination
			canCreateFolders: true
			files: FolderItem[]
			action: PickedDestinationAction
			title: TranslationKey
			actionLabel: TranslationKey
			descriptionLabel: string
			descriptionTestId: string
			startFolderId: IdTuple
			icon: Icons
	  }
	// attributes for picking a destination for a set of files to upload
	| {
			mode: DriveItemPickerBehavior.PickDestinationForUpload
			canCreateFolders: true
			files: (DataFile | WebFile | FileReference)[]
			action: PickedDestinationUploadAction
			title: TranslationKey
			actionLabel: TranslationKey
			descriptionLabel: string
			descriptionTestId: string
			startFolderId: IdTuple
			icon: Icons
	  }
	// attributes for picking a file
	| {
			mode: DriveItemPickerBehavior.PickItems
			canCreateFolders: false
			action: PickedItemAction
			title: TranslationKey
			actionLabel: TranslationKey
			descriptionLabel: string
			descriptionTestId: string
			startFolderId: IdTuple
			icon: Icons
	  }

/**
 * Shows a dialog for interactively choosing a destination for a user action.
 * It also enables the user to create new folders.
 */
export async function showItemPicker(entityClient: EntityClient, driveFacade: DriveFacade, attrs: DriveItemPickerAttrs) {
	const parentFolderId = attrs.startFolderId
	// TODO: show a progress here?
	let state: State = await loadFolder(parentFolderId)
	//We do not need a parent here so we don't provide it
	const loadParents = async () => driveFacade.getFolderParents(state.currentFolder.folder._id).then((parents) => parents.map((p) => toFolderItem(p, null)))

	async function loadFolder(folderId: IdTuple): Promise<State> {
		const currentFolder = toFolderItem(await entityClient.load(DriveFolderTypeRef, folderId), null)

		const contents = await driveFacade.getFolderContents(folderId)
		const items = toFolderItems(contents)
		const filesElementIds = items
			.filter((item) => !isFolderFolderItem(item))
			.map(folderItemEntity)
			.map(getElementId)
		const nonAttachableFileIds = items
			.filter((item) => !isFolderFolderItem(item) && filterInt(item.file.size) > MAX_ATTACHMENT_SIZE)
			.map(folderItemEntity)
			.map(getElementId)
		const parents = currentFolder.folder.parent ? [toFolderItem(await entityClient.load(DriveFolderTypeRef, currentFolder.folder.parent), null)] : []

		const listModel = new ListModel<FolderItem, Id>({
			fetch: async (lastFetchedItem) => {
				if (lastFetchedItem == null) {
					return { items, complete: true }
				} else {
					return { items: [] satisfies FolderItem[], complete: true }
				}
			},
			getItemId(item: FolderItem): Id {
				return getElementId(folderItemEntity(item))
			},
			sortCompare: (item1: FolderItem, item2: FolderItem): number => {
				return 0 // FIXME: Does this make sense?
			},
			isSameId: isSameSingleId,
			autoSelectBehavior: () => ListAutoSelectBehavior.OLDER,
		})
		await listModel.loadInitial()

		return { currentFolder, filesElementIds, nonAttachableFileIds, parents, newFolderName: null, listModel }
	}

	let folderBrowserDom: HTMLElement | null = null

	const pickerDialog = new Dialog(
		DialogType.EditLarger,
		class DriveItemPicker implements Component {
			view(): Children {
				const { listModel, currentFolder, parents, newFolderName, filesElementIds, nonAttachableFileIds } = state
				const disabledTargetIds: Set<string> =
					attrs.mode === DriveItemPickerBehavior.PickDestination
						? new Set([...attrs.files.map(folderItemEntity).map(getElementId), ...filesElementIds])
						: attrs.mode === DriveItemPickerBehavior.PickDestinationForUpload
							? new Set([...filesElementIds])
							: new Set([...nonAttachableFileIds])
				return [
					m(DialogHeaderBar, {
						left: [{ label: `close_alt`, click: () => pickerDialog.close(), type: ButtonType.Secondary }],
						middle: attrs.title,
						right: [
							{
								label: attrs.actionLabel,
								click: () => {
									if (attrs.mode === DriveItemPickerBehavior.PickDestination) {
										attrs.action(attrs.files.map(folderItemToId), state.currentFolder.folder)
									} else if (attrs.mode === DriveItemPickerBehavior.PickItems) {
										const folderItemsId = listModel.getSelectedAsArray().map(folderItemToId)
										attrs.action(folderItemsId)
									}
									pickerDialog.close()
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
									icon: attrs.icon,
									size: IconSize.PX24,
									style: {
										fill: theme.on_surface_variant,
									},
								}),
								m(".b.uppercase.text-ellipsis", { "data-testid": attrs.descriptionTestId }, attrs.descriptionLabel),
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
									onClick: (f: DriveFolder, e: MouseEvent) => {
										e.preventDefault()
										this.onOpenFolder(f)
									},
								} satisfies DriveBreadcrumbsAttrs),
							),
							m(".flex.col.gap-8.min-height-0", [
								m(".small.uppercase.font-weight-700", lang.getTranslationText("folderContent_label")),
								[
									m(DriveFolderBrowser, {
										key: getElementId(currentFolder.folder),
										listState: listModel.state,
										disabledTargetIds,
										onSingleSelection: (item: FolderItem) => {
											if (isFolderFolderItem(item)) {
												if (attrs.mode === DriveItemPickerBehavior.PickDestination) {
													if (attrs.files.some((targetitem) => isSameId(item.folder._id, folderItemEntity(targetitem)._id))) {
														return
													}
												}

												this.onOpenFolder(item.folder)
											} else if (attrs.mode === DriveItemPickerBehavior.PickItems) {
												listModel.onSingleSelection(item)
											}
										},
										onSingleInclusiveSelection: (item: FolderItem) => {
											if (attrs.mode === DriveItemPickerBehavior.PickItems) {
												listModel.onSingleInclusiveSelection(item)
											}
										},
										onRangeSelectionTowards: (item: FolderItem) => {
											if (attrs.mode === DriveItemPickerBehavior.PickItems) {
												listModel.selectRangeTowards(item)
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
												lang.getTranslation(`createNewFolderIn_label`, { "{folderName}": driveFolderName(currentFolder.folder).text })
													.text,
											),
											m(DriveFolderBrowserNewFolderEntry, {
												newFolderName: newFolderName,
												onNewFolderNameInput: (name) => {
													state.newFolderName = name
												},
												onCreateFolder: () => this.onCreateFolder(newFolderName, currentFolder.folder),
											}),
										],
							]),
						],
					),
				]
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
					flexDirection: Styles.get().isDesktopLayout() ? "row" : "column",
				},
			},
			[
				m(TextField, {
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
					width: Styles.get().isDesktopLayout() ? "flex" : "full",
					onclick: onCreateFolder,
				}),
			],
		)
	}
}
