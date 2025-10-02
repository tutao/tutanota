import m, { Children, Component, Vnode } from "mithril"
import { DriveViewModel } from "./DriveViewModel"

export type BreadcrumbPath = Array<[string, IdTuple]>

export interface DriveBreadcrumbAttrs {
	driveViewModel: DriveViewModel
	path: BreadcrumbPath
}

export class DriveBreadcrumb implements Component<DriveBreadcrumbAttrs> {
	view(vnode: Vnode<DriveBreadcrumbAttrs>): Children {
		const isRoot = vnode.attrs.driveViewModel.currentFolderIsRoot()

		return m("div", isRoot ? "/" : `/${vnode.attrs.driveViewModel.getCurrentFolder().name}`)
	}
}
