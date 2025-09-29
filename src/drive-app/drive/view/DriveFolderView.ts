import m, { Children, Component, Vnode } from "mithril"
import { DriveFolderViewModel } from "./DriveFolderViewModel"
import { DriveFolderNav } from "./DriveFolderNav"
import { DriveFolderContent } from "./DriveFolderContent"

export interface DriveFolderViewAttrs {
	driveFolderViewModel: DriveFolderViewModel
}

export class DriveFolderView implements Component<DriveFolderViewAttrs> {
	view(vnode: Vnode<DriveFolderViewAttrs>): Children {
		const files = vnode.attrs.driveFolderViewModel.currentFolderFiles
		return [m(DriveFolderNav), m(DriveFolderContent, { files })]
	}
}
