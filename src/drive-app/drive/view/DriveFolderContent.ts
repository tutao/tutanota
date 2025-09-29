import m, { Children, Component, Vnode } from "mithril"
import { DriveFolderContentEntry } from "./DriveFolderContentEntry"
import { File } from "../../../common/api/entities/tutanota/TypeRefs"

export interface DriveFolderContentAttrs {
	files: File[]
}

export class DriveFolderContent implements Component<DriveFolderContentAttrs> {
	view(vnode: Vnode<DriveFolderContentAttrs>): Children {
		// TODO: render table with FolderContentHeader and FolderContentEntry
		return m("table", [
			m(
				"thead",
				m("tr", [
					// checked
					m("th", []),
					m("th", "Name"),
					m("th", "Type"),
					m("th", "Size"),
					m("th", "Date"),
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
					}),
				),
			),
		])
	}
}
