import m, { Children, Component, Vnode } from "mithril"
import { DriveViewModel, FolderItem } from "./DriveViewModel"
import { DriveFolderNav } from "./DriveFolderNav"
import { DriveFolderContent, DriveFolderContentAttrs, DriveFolderSelectionEvents, SelectionState } from "./DriveFolderContent"
import { DriveFolder } from "../../../common/api/entities/drive/TypeRefs"
import { Dialog } from "../../../common/gui/base/Dialog"
import { lang } from "../../../common/misc/LanguageViewModel"
import { ListState } from "../../../common/gui/base/List"
import { px, size } from "../../../common/gui/size"

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
}

export class DriveFolderView implements Component<DriveFolderViewAttrs> {
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
			currentFolder,
			parents,
			selection,
			selectionEvents,
			listState,
		},
	}: Vnode<DriveFolderViewAttrs>): Children {
		return m(
			"div.col.flex.plr-8.fill-absolute",
			{ style: { gap: px(size.spacing_12) } },
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
			m(DriveFolderContent, {
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
}
