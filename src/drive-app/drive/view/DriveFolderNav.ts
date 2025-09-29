import m, { Children, Component, Vnode } from "mithril"
import { DriveBreadcrumb } from "./DriveBreadcrumb"

export interface DriveFolderNavAttrs {
	placeholder: string
}

export class DriveFolderNav implements Component<DriveFolderNavAttrs> {
	view(vnode: Vnode<DriveFolderNavAttrs>): Children {
		return m(
			"div",
			"[DriveFolderNav]",
			// TODO: FilterBox
			m(DriveBreadcrumb, { path: [["root", ["SomeListID", "SomeElementID"]]] }), // FIXME: hardcoded path
			// TODO: ActionButtons
		)
	}
}
