import m, { Children, Component, Vnode } from "mithril"
import { DriveBreadcrumb } from "./DriveBreadcrumb"
import { DriveViewModel } from "./DriveViewModel"

export interface DriveFolderNavAttrs {
	driveViewModel: DriveViewModel
}

export class DriveFolderNav implements Component<DriveFolderNavAttrs> {
	view(vnode: Vnode<DriveFolderNavAttrs>): Children {
		const driveViewModel = vnode.attrs.driveViewModel

		return m(
			"",
			// TODO: FilterBox
			m(DriveBreadcrumb, { driveViewModel, path: [["root", ["SomeListID", "SomeElementID"]]] }), // FIXME: hardcoded path
			// TODO: ActionButtons
		)
	}
}
