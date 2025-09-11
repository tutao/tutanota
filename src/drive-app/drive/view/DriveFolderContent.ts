import m, { Children, Component, Vnode } from "mithril"
import { SortColumn, SortingPreference } from "./DriveViewModel"
import { DriveFolderContentEntry, FileActions } from "./DriveFolderContentEntry"
import { DriveSortArrow } from "./DriveSortArrow"
import { lang, Translation } from "../../../common/misc/LanguageViewModel"
import { px, size } from "../../../common/gui/size"
import { SelectableFolderItem } from "./DriveView"

export type SelectionState = { type: "multiselect"; selectedItemCount: number; selectedAll: boolean } | { type: "none" }

export interface DriveFolderContentAttrs {
	selection: SelectionState
	items: readonly SelectableFolderItem[]
	sortOrder: SortingPreference
	fileActions: FileActions
	onSort: (column: SortColumn) => unknown
	onSelectAll: () => unknown
}

const columnStyle = {
	display: "flex",
	gap: "10px",
	"align-items": "center",
	cursor: "pointer",
}

export const columnStyles = {
	select: { width: "25px" },
	icon: { width: "50px" },
	name: { flex: "1" },
	type: { width: "100px" },
	size: { width: "100px" },
	date: { width: "300px" },
} as const

function renderHeaderCell(
	columnName: Translation,
	columnId: SortColumn,
	{ column, order }: SortingPreference,
	style: Record<string, unknown>,
	onSort: DriveFolderContentAttrs["onSort"],
): Children {
	return m(
		"div",
		{
			style: { ...columnStyle, ...style },
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
	view({ attrs: { selection, sortOrder, onSort, items, fileActions, onSelectAll } }: Vnode<DriveFolderContentAttrs>): Children {
		return m("div.flex.col.overflow-hidden", [
			this.renderHeader(selection, sortOrder, onSort, onSelectAll),

			m(
				".flex.col.scroll",
				items.map((item) =>
					m(DriveFolderContentEntry, {
						item: item,
						onSelect: (f) => {},
						checked: false,
						fileActions,
					}),
				),
			),
		])
	}
	private renderHeader(selection: SelectionState, sortOrder: SortingPreference, onSort: (column: SortColumn) => unknown, onSelectAll: () => unknown) {
		return m(
			"div.flex.row.folder-row",
			{
				style: {
					padding: "8px 16px 8px 24px",
					gap: "16px",
					// ensure that the bar does not shrink too much if we have only text
					minHeight: px(size.button_height + 2 * 8),
				},
			},
			[
				m(
					"div",
					{ style: { ...columnStyle, ...columnStyles.select } },
					m("input.checkbox", { type: "checkbox", checked: selection.type === "multiselect" && selection.selectedAll, onchange: onSelectAll }),
				),
				selection.type === "multiselect"
					? [
							m(""),
							// FIXME translate
							m(".b", `${selection.selectedItemCount} items selected`),
						]
					: [
							m("div", { style: { ...columnStyle, ...columnStyles.icon } }, []),
							// FIXME: translations
							renderHeaderCell(lang.makeTranslation("name", "Name"), SortColumn.name, sortOrder, columnStyles.name, onSort),
							renderHeaderCell(lang.makeTranslation("type", "Type"), SortColumn.mimeType, sortOrder, columnStyles.type, onSort),
							renderHeaderCell(lang.makeTranslation("size", "Size"), SortColumn.size, sortOrder, columnStyles.size, onSort),
							renderHeaderCell(lang.makeTranslation("date", "Date"), SortColumn.date, sortOrder, columnStyles.date, onSort),
							// m("div", { style: { ...columnStyle, width: columnSizes.type } }, "Type"),
							// m("div", { style: { ...columnStyle, width: columnSizes.size } }, "Size"),
							// m("div", { style: { ...columnStyle, width: columnSizes.date } }, "Date"),
							m("div", { style: { ...columnStyle, width: px(size.button_height) } }, null),
						],
			],
		)
	}
}
