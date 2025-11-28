import m, { Children, Component, Vnode } from "mithril"
import { DriveViewModel, FolderItem } from "./DriveViewModel"
import { DriveFolderNav } from "./DriveFolderNav"
import { DriveFolderContent, DriveFolderContentAttrs } from "./DriveFolderContent"
import { DriveFolder } from "../../../common/api/entities/drive/TypeRefs"

export interface DriveFolderViewAttrs {
	onUploadClick: (dom: HTMLElement) => void
	items: readonly FolderItem[]
	onPaste: (() => unknown) | null
	driveViewModel: DriveViewModel
	currentFolder: DriveFolder | null
	parents: readonly DriveFolder[]
}

export class DriveFolderView implements Component<DriveFolderViewAttrs> {
	view({ attrs: { driveViewModel, items, onPaste, onUploadClick, currentFolder, parents } }: Vnode<DriveFolderViewAttrs>): Children {
		return m(
			"div.col.flex",
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
				onSort: (newSortingOrder) => {
					driveViewModel.sort(newSortingOrder)
				},
			} satisfies DriveFolderContentAttrs),
		)
	}
}
