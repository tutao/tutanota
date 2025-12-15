import m, { Children, Component, Vnode } from "mithril"
import { DriveViewModel, FolderItem } from "./DriveViewModel"
import { DriveFolderNav } from "./DriveFolderNav"
import { DriveFolderContent, DriveFolderContentAttrs, DriveFolderSelectionEvents, SelectionState } from "./DriveFolderContent"
import { DriveFolder } from "../../../common/api/entities/drive/TypeRefs"
import { Dialog } from "../../../common/gui/base/Dialog"
import { lang } from "../../../common/misc/LanguageViewModel"
import { ListLoadingState, ListState } from "../../../common/gui/base/List"
import { px, size } from "../../../common/gui/size"
import { assertNotNull, isEmpty } from "@tutao/tutanota-utils"
import { Icons } from "../../../common/gui/base/icons/Icons"
import { theme } from "../../../common/gui/theme"
import { IconMessageBox } from "../../../common/gui/base/ColumnEmptyMessageBox"
import { LayerType } from "../../../RootView"
import { Icon, IconSize } from "../../../common/gui/base/Icon"
import { DropType } from "../../../common/gui/base/GuiUtils"

export interface DriveFolderViewAttrs {
	onUploadClick: (dom: HTMLElement) => void
	selection: SelectionState
	onTrash: (() => unknown) | null
	onDelete: (() => unknown) | null
	onRestore: (() => unknown) | null
	onCopy: (() => unknown) | null
	onCut: (() => unknown) | null
	onPaste: (() => unknown) | null
	driveViewModel: DriveViewModel
	currentFolder: DriveFolder | null
	parents: readonly DriveFolder[]
	listState: ListState<FolderItem>
	selectionEvents: DriveFolderSelectionEvents
	onDropFiles: (files: File[]) => unknown
}

export class DriveFolderView implements Component<DriveFolderViewAttrs> {
	private draggedOver: boolean = false

	view({
		attrs: {
			driveViewModel,
			onTrash,
			onDelete,
			onRestore,
			onCopy,
			onCut,
			onPaste,
			onUploadClick,
			onDropFiles,
			currentFolder,
			parents,
			selection,
			selectionEvents,
			listState,
		},
	}: Vnode<DriveFolderViewAttrs>): Children {
		return m(
			"div.col.flex.plr-8.fill-absolute",
			{
				style: { gap: px(size.spacing_12) },
				ondragover: (event: DragEvent) => {
					event.preventDefault()
					const driveFile = event.dataTransfer?.getData(DropType.DriveFile)
					const driveFolder = event.dataTransfer?.getData(DropType.DriveItems)
					console.log("dragover", driveFile, event, event.dataTransfer)
					if (event.dataTransfer && driveFile === "" && driveFolder === "") {
						this.draggedOver = true
					}
				},
				ondrop: (event: DragEvent) => {
					event.preventDefault()
					this.draggedOver = false

					if (event.dataTransfer) {
						// We need some fancier code to read the directories.
						const definitelyFileItems = Array.from(event.dataTransfer.items).filter((item) => item.webkitGetAsEntry()?.isFile)
						onDropFiles(definitelyFileItems.map((item) => assertNotNull(item.getAsFile())))
					}
				},
				ondragleave: (event: DragEvent) => {
					this.draggedOver = false
				},
			},
			this.draggedOver ? this.renderDropView() : null,
			m(DriveFolderNav, {
				onTrash,
				onDelete,
				onRestore,
				onCopy,
				onCut,
				onPaste,
				onUploadClick,
				currentFolder,
				parents,
				onNavigateToFolder: (folder) => {
					driveViewModel.navigateToFolder(folder._id)
				},
			}),
			listState.loadingStatus === ListLoadingState.Done && isEmpty(listState.items)
				? m(
						"",
						{
							style: {
								// FIXME: better positioning once we figure out the layout more
								marginTop: "6.4rem",
							},
						},
						m(IconMessageBox, {
							// FIXME: translate
							message: lang.makeTranslation("", "Drop files or folders here"),
							icon: Icons.Drive,
							color: theme.on_surface_variant,
							bottomContent: "Or use 'new' button",
						}),
					)
				: m(DriveFolderContent, {
						sortOrder: driveViewModel.getCurrentColumnSortOrder(),
						fileActions: {
							onOpenItem: (item) => {
								if (item.type === "folder") {
									driveViewModel.navigateToFolder(item.folder._id)
								} else {
									driveViewModel.downloadFile(item.file)
								}
							},
							onCopy: (item) => {
								driveViewModel.copy([item])
							},
							onCut: (item) => {
								driveViewModel.cut([item])
							},
							onDelete: (item) => {
								driveViewModel.moveToTrash([item])
							},
							onRestore: (item) => {
								driveViewModel.restoreFromTrash([item])
							},
							onRename: (item) => {
								Dialog.showProcessTextInputDialog(
									{
										title: lang.makeTranslation("asdf", "Rename item"), // FIXME,
										label: lang.makeTranslation("asdf2", "Enter new name:"), // FIXME
										defaultValue: item.type === "file" ? item.file.name : item.folder.name,
									},
									async (newName: string) => {
										driveViewModel.rename(item, newName)
									},
								)
							},
							// onMove: (fileId, folder) => {
							// 	driveViewModel.move(fileId, folder)
							// },
						},
						onSort: (newSortingOrder) => {
							driveViewModel.sort(newSortingOrder)
						},
						selection,
						listState,
						selectionEvents,
					} satisfies DriveFolderContentAttrs),
		)
	}
	private renderDropView() {
		return m(
			".fill-absolute.flex.items-center.justify-center",
			{
				style: { backgroundColor: "#00000080", zIndex: LayerType.Overlay },
			},
			m(
				".center.flex.col.items-center.justify-center.border-radius-12",
				{
					style: {
						backgroundColor: theme.surface,
						color: theme.on_surface,
						padding: `${size.spacing_32}px ${size.spacing_16}px`,
						fontSize: "1.4em",
						gap: px(size.core_16),
					},
				},
				[
					m(Icon, {
						icon: Icons.Upload,
						size: IconSize.PX64,
						style: {
							fill: theme.outline,
						},
					}),
					// FIXME: change this text, please
					"Drop files here or something idk",
				],
			),
		)
	}
}
