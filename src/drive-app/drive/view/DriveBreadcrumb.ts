import m, { Children, Component, Vnode } from "mithril"

export type BreadcrumbPath = Array<[string, IdTuple]>

export interface DriveBreadcrumbAttrs {
	path: BreadcrumbPath
}

export class DriveBreadcrumb implements Component<DriveBreadcrumbAttrs> {
	view(vnode: Vnode<DriveBreadcrumbAttrs>): Children {
		return m("div", "[DriveBreadcrumb]")
	}
}
