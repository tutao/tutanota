import m, { Children, Component, Vnode } from "mithril"
import { DriveViewModel } from "./DriveViewModel"
import { DriveFolderNav } from "./DriveFolderNav"
import { DriveFolderContent } from "./DriveFolderContent"

export interface DriveFolderViewAttrs {
	driveViewModel: DriveViewModel
}

export class DriveFolderView implements Component<DriveFolderViewAttrs> {
	view(vnode: Vnode<DriveFolderViewAttrs>): Children {
		const driveViewModel = vnode.attrs.driveViewModel
		const files = driveViewModel.currentFolderFiles
		return [m(DriveFolderNav, { driveViewModel }), m(DriveFolderContent, { files, driveViewModel })]
	}
}
