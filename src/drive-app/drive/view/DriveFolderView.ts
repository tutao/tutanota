import m, { Children, Component, Vnode } from "mithril"
import { DriveViewModel } from "./DriveViewModel"
import { DriveFolderNav } from "./DriveFolderNav"
import { DriveFolderContent, DriveFolderContentAttrs, SelectionState } from "./DriveFolderContent"
import { DriveFolder } from "../../../common/api/entities/drive/TypeRefs"
import { Dialog } from "../../../common/gui/base/Dialog"
import { lang } from "../../../common/misc/LanguageViewModel"
import { SelectableFolderItem } from "./DriveView"

export interface DriveFolderViewAttrs {
	onUploadClick: (dom: HTMLElement) => void
	items: readonly SelectableFolderItem[]
	selection: SelectionState
	onSelectAll: () => unknown
	onPaste: (() => unknown) | null
	driveViewModel: DriveViewModel
	currentFolder: DriveFolder | null
	parents: readonly DriveFolder[]
}

export class DriveFolderView implements Component<DriveFolderViewAttrs> {
	view({ attrs: { driveViewModel, items, onPaste, onUploadClick, currentFolder, parents, selection, onSelectAll } }: Vnode<DriveFolderViewAttrs>): Children {
		return m(
			"div.col.flex.plr-button",
			{ style: { gap: "15px" } },
			m(DriveFolderNav, {
				onPaste,
				onUploadClick,
				currentFolder,
				parents,
				onNavigateToFolder: (folder) => {
					driveViewModel.navigateToFolder(folder._id)
				},
			}),
			m(DriveFolderContent, {
				items: items,
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
						driveViewModel.copy(item)
					},
					onCut: (item) => {
						driveViewModel.cut(item)
					},
					onDelete: (item) => {
						driveViewModel.moveToTrash(item)
					},
					onRestore: (item) => {
						driveViewModel.restoreFromTrash(item)
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
					onSelect: (item) => {
						driveViewModel.onSingleSelection(item)
					},
				},
				onSort: (newSortingOrder) => {
					driveViewModel.sort(newSortingOrder)
				},
				onSelectAll,
				selection,
			} satisfies DriveFolderContentAttrs),
		)
	}
}
