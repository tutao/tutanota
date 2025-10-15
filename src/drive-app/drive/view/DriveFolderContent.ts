import m, { Children, Component, Vnode } from "mithril"
import { DriveFolderContentEntry } from "./DriveFolderContentEntry"
import { File } from "../../../common/api/entities/tutanota/TypeRefs"
import { DriveViewModel } from "./DriveViewModel"

export interface DriveFolderContentAttrs {
	files: File[]
	driveViewModel: DriveViewModel
}

export class DriveFolderContent implements Component<DriveFolderContentAttrs> {
	view(vnode: Vnode<DriveFolderContentAttrs>): Children {
		return m("table", { style: { "border-spacing": "32px 0px", "text-align": "left", "table-layout": "fixed" } }, [
			m(
				"thead",
				m("tr", [
					// Checked or not
					m("th", []),
					// Icons...
					m("th", []),
					m("th", { style: { width: "300px" } }, "Name"),
					m("th", { style: { width: "100px" } }, "Type"),
					m("th", { style: { width: "50px" } }, "Size"),
					m("th", { style: { width: "300px" } }, "Date"),
					m("th", "Actions"),
				]),
			), // DriveFolderContentHeader
			m(
				"tbody",
				vnode.attrs.files.map((file: File) =>
					m(DriveFolderContentEntry, {
						file,
						onSelect: (f) => {},
						checked: false,
						driveViewModel: vnode.attrs.driveViewModel,
					}),
				),
			),
		])
	}
}
