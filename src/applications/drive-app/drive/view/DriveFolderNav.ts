import m, { Children, Component, Vnode } from "mithril"
import { DriveBreadcrumbs } from "./DriveBreadcrumbs"
import { FolderFolderItem, FolderItem } from "./DriveUtils"
import { DriveActionBar } from "./DriveActionBar"

export interface DriveFolderNavAttrs {
	currentFolder: FolderFolderItem | null
	parents: readonly FolderFolderItem[]
	loadParents: () => Promise<FolderFolderItem[]>
	onDropInto: (f: FolderItem, event: DragEvent) => unknown
	selectedItemsActions: DriveSelectedItemsActions
}

export interface DriveSelectedItemsActions {
	onTrash: (() => unknown) | null
	onDelete: (() => unknown) | null
	onRestore: (() => unknown) | null
	onCopy: (() => unknown) | null
	onCut: (() => unknown) | null
	onPaste: (() => unknown) | null
	onMove: (() => unknown) | null
	onDownload: (() => unknown) | null
}

export class DriveFolderNav implements Component<DriveFolderNavAttrs> {
	view({ attrs: { currentFolder, parents, loadParents, onDropInto, selectedItemsActions } }: Vnode<DriveFolderNavAttrs>): Children {
		return m(DriveActionBar, selectedItemsActions, m(DriveBreadcrumbs, { currentFolder, parents, loadParents, onDropInto }))
	}
}
