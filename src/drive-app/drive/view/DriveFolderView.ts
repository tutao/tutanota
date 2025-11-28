import m, { Children, Component, Vnode } from "mithril"
import { DriveViewModel, FolderItem } from "./DriveViewModel"
import { DriveFolderNav } from "./DriveFolderNav"
import { DriveFolderContent, DriveFolderContentAttrs } from "./DriveFolderContent"

export interface DriveFolderViewAttrs {
	onUploadClick: (dom: HTMLElement) => void
	items: readonly FolderItem[]
	onPaste: (() => unknown) | null
	driveViewModel: DriveViewModel
}

export class DriveFolderView implements Component<DriveFolderViewAttrs> {
	view({ attrs: { driveViewModel, items, onPaste, onUploadClick } }: Vnode<DriveFolderViewAttrs>): Children {
		return m(
			"div.col.flex",
			{ style: { gap: "15px" } },
			m(DriveFolderNav, { onPaste, onUploadClick }),
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
