import m, { Children, Component, Vnode } from "mithril"
import { File } from "../../../common/api/entities/tutanota/TypeRefs"
import { DriveViewModel } from "./DriveViewModel"
import { DriveFolderContentEntry } from "./DriveFolderContentEntry"

export interface DriveFolderContentAttrs {
	files: File[]
	driveViewModel: DriveViewModel
}

const columnStyle = {}

export const columnSizes = {
	select: "25px",
	icon: "50px",
	name: "300px",
	type: "100px",
	size: "100px",
	date: "300px",
}

export class DriveFolderContent implements Component<DriveFolderContentAttrs> {
	view(vnode: Vnode<DriveFolderContentAttrs>): Children {
		return m("div.flex.col", [
			// m(
			// 	"thead",
			// 	m("tr", [
			// 		// Checked or not
			// 		m("th", []),
			// 		// Icons...
			// 		m("th", []),
			// 		m("th", { style: { width: "300px" } }, "Name"),
			// 		m("th", { style: { width: "100px" } }, "Type"),
			// 		m("th", { style: { width: "50px" } }, "Size"),
			// 		m("th", { style: { width: "300px" } }, "Date"),
			// 		m("th", "Actions"),
			// 	]),
			// ), // DriveFolderContentHeader
			m("div.flex.row", { style: { "text-align": "center", "padding-left": "16px" } }, [
				m("div", { style: { ...columnStyle, width: columnSizes.select } }, []),
				// Icons...
				m("div", { style: { ...columnStyle, width: columnSizes.icon } }, []),
				m("div", { style: { ...columnStyle, width: columnSizes.name } }, "Name"),
				m("div", { style: { ...columnStyle, width: columnSizes.type } }, "Type"),
				m("div", { style: { ...columnStyle, width: columnSizes.size } }, "Size"),
				m("div", { style: { ...columnStyle, width: columnSizes.date } }, "Date"),
				m("div", { style: { ...columnStyle } }, "Actions"),
			]),

			vnode.attrs.files.map((file: File) =>
				m(DriveFolderContentEntry, {
					file,
					onSelect: (f) => {},
					checked: false,
					driveViewModel: vnode.attrs.driveViewModel,
				}),
			),
		])
	}
}
