import m, { Children, Component, Vnode } from "mithril"
import { DriveBreadcrumb } from "./DriveBreadcrumb"
import { DriveViewModel } from "./DriveViewModel"

export interface DriveFolderNavAttrs {
	driveViewModel: DriveViewModel
}

const driveFolderNavStyle = {
	background: "white",
	padding: "16px 24px",
	"border-radius": "10px",
	width: "955px",
}

export class DriveFolderNav implements Component<DriveFolderNavAttrs> {
	view(vnode: Vnode<DriveFolderNavAttrs>): Children {
		const driveViewModel = vnode.attrs.driveViewModel

		return m(
			"",
			{ style: driveFolderNavStyle },
			// TODO: FilterBox
			m(DriveBreadcrumb, { driveViewModel, path: [["root", ["SomeListID", "SomeElementID"]]] }), // FIXME: hardcoded path
			// TODO: ActionButtons
		)
	}
}
