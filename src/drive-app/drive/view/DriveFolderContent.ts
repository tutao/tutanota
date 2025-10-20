import m, { Children, Component, Vnode } from "mithril"
import { File } from "../../../common/api/entities/tutanota/TypeRefs"
import { DriveViewModel } from "./DriveViewModel"
import { DriveFolderContentEntry } from "./DriveFolderContentEntry"
import { DriveSortArrow } from "./DriveSortArrow"

export interface DriveFolderContentAttrs {
	files: File[]
	driveViewModel: DriveViewModel
}

const columnStyle = {
	display: "flex",
	gap: "10px",
	"align-items": "center",
}

export const columnSizes = {
	select: "25px",
	icon: "50px",
	name: "300px",
	type: "100px",
	size: "100px",
	date: "300px",
}

function makeHeaderCell(columnName: string, sortColumnName: string, width: string, driveViewModel: DriveViewModel): Children {
	return m(
		"div",
		{
			style: { ...columnStyle, width },
			onclick: () => {
				driveViewModel.sort(sortColumnName)
				m.redraw()
			},
		},
		[columnName, m(DriveSortArrow, { driveViewModel, columnName: sortColumnName })],
	)
}

export class DriveFolderContent implements Component<DriveFolderContentAttrs> {
	view(vnode: Vnode<DriveFolderContentAttrs>): Children {
		const driveViewModel = vnode.attrs.driveViewModel

		return m("div.flex.col", [
			m("div.flex.row.folder-row", { style: { padding: "8px 24px" } }, [
				m("div", { style: { ...columnStyle, width: columnSizes.select } }, []),
				// Icons...
				m("div", { style: { ...columnStyle, width: columnSizes.icon } }, []),
				makeHeaderCell("Name", "name", columnSizes.name, driveViewModel),
				makeHeaderCell("Type", "mimeType", columnSizes.type, driveViewModel),
				makeHeaderCell("Size", "size", columnSizes.size, driveViewModel),
				makeHeaderCell("Date", "date", columnSizes.date, driveViewModel),
				// m("div", { style: { ...columnStyle, width: columnSizes.type } }, "Type"),
				// m("div", { style: { ...columnStyle, width: columnSizes.size } }, "Size"),
				// m("div", { style: { ...columnStyle, width: columnSizes.date } }, "Date"),
				m("div", { style: { ...columnStyle } }, "Actions"),
			]),

			vnode.attrs.files.map((file: File) =>
				m(DriveFolderContentEntry, {
					file,
					onSelect: (f) => {},
					checked: false,
					driveViewModel: driveViewModel,
				}),
			),
		])
	}
}
