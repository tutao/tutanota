import m, { Children, Component, Vnode } from "mithril"
import { DriveViewModel, FolderItem } from "./DriveViewModel"
import { DriveFolderNav } from "./DriveFolderNav"
import { DriveFolderContent, DriveFolderContentAttrs } from "./DriveFolderContent"

export interface DriveFolderViewAttrs {
	onUploadClick: (dom: HTMLElement) => void
	items: readonly FolderItem[]
	driveViewModel: DriveViewModel
}

export class DriveFolderView implements Component<DriveFolderViewAttrs> {
	view(vnode: Vnode<DriveFolderViewAttrs>): Children {
		const { driveViewModel, onUploadClick } = vnode.attrs
		return m(
			"div.col.flex",
			{ style: { gap: "15px" } },
			m(DriveFolderNav, { driveViewModel, onUploadClick }),
			m(DriveFolderContent, {
				items: vnode.attrs.items,
				sortOrder: driveViewModel.getCurrentColumnSortOrder(),
				onOpenItem: (item) => {
					if (item.type === "folder") {
						driveViewModel.navigateToFolder(item.folder._id)
					} else {
						driveViewModel.downloadFile(item.file)
					}
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
