import m, { Children, Component, Vnode } from "mithril"
import { File } from "../../../common/api/entities/tutanota/TypeRefs"
import { DriveViewModel } from "./DriveViewModel"
import { DriveFolderNav } from "./DriveFolderNav"
import { DriveFolderContent } from "./DriveFolderContent"

export interface DriveFolderViewAttrs {
	onUploadClick: (dom: HTMLElement) => void
	files: File[]
	driveViewModel: DriveViewModel
}

export class DriveFolderView implements Component<DriveFolderViewAttrs> {
	view(vnode: Vnode<DriveFolderViewAttrs>): Children {
		const { driveViewModel, onUploadClick } = vnode.attrs
		return [m(DriveFolderNav, { driveViewModel, onUploadClick }), m(DriveFolderContent, { files: vnode.attrs.files, driveViewModel })]
	}
}
