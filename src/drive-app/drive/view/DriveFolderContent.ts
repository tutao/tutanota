import m, { Children, Component, Vnode } from "mithril"
import { FolderItem, SortColumn, SortingPreference } from "./DriveViewModel"
import { DriveFolderContentEntry, FileActions } from "./DriveFolderContentEntry"
import { DriveSortArrow } from "./DriveSortArrow"
import { lang, Translation } from "../../../common/misc/LanguageViewModel"

export interface DriveFolderContentAttrs {
	items: readonly FolderItem[]
	sortOrder: SortingPreference
	fileActions: FileActions
	onSort: (column: SortColumn) => unknown
}

const columnStyle = {
	display: "flex",
	gap: "10px",
	"align-items": "center",
	cursor: "pointer",
}

export const columnSizes = {
	select: "25px",
	icon: "50px",
	name: "300px",
	type: "100px",
	size: "100px",
	date: "300px",
}

function renderHeaderCell(
	columnName: Translation,
	columnId: SortColumn,
	{ column, order }: SortingPreference,
	width: string,
	onSort: DriveFolderContentAttrs["onSort"],
): Children {
	return m(
		"div",
		{
			style: { ...columnStyle, width },
			onclick: () => {
				onSort(columnId)
			},
		},
		[
			columnName.text,
			m(DriveSortArrow, {
				sortOrder: columnId === column ? order : null,
			}),
		],
	)
}

export class DriveFolderContent implements Component<DriveFolderContentAttrs> {
	view({ attrs: { sortOrder, onSort, items, fileActions } }: Vnode<DriveFolderContentAttrs>): Children {
		return m("div.flex.col", [
			m("div.flex.row.folder-row", { style: { padding: "8px 24px" } }, [
				m("div", { style: { ...columnStyle, width: columnSizes.select } }, []),
				// Icons...
				m("div", { style: { ...columnStyle, width: columnSizes.icon } }, []),
				// FIXME: translations
				renderHeaderCell(lang.makeTranslation("name", "Name"), SortColumn.name, sortOrder, columnSizes.name, onSort),
				renderHeaderCell(lang.makeTranslation("type", "Type"), SortColumn.mimeType, sortOrder, columnSizes.type, onSort),
				renderHeaderCell(lang.makeTranslation("size", "Size"), SortColumn.size, sortOrder, columnSizes.size, onSort),
				renderHeaderCell(lang.makeTranslation("date", "Date"), SortColumn.date, sortOrder, columnSizes.date, onSort),
				// m("div", { style: { ...columnStyle, width: columnSizes.type } }, "Type"),
				// m("div", { style: { ...columnStyle, width: columnSizes.size } }, "Size"),
				// m("div", { style: { ...columnStyle, width: columnSizes.date } }, "Date"),
				m("div", { style: { ...columnStyle } }, "Actions"),
			]),

			items.map((item) =>
				m(DriveFolderContentEntry, {
					item: item,
					onSelect: (f) => {},
					checked: false,
					fileActions,
				}),
			),
		])
	}
}
