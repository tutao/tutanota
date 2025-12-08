import m, { Children, Component, Vnode } from "mithril"
import { FolderItem, SortColumn, SortingPreference } from "./DriveViewModel"
import { DriveFolderContentEntry, FileActions } from "./DriveFolderContentEntry"
import { DriveSortArrow } from "./DriveSortArrow"
import { lang, Translation } from "../../../common/misc/LanguageViewModel"
import { component_size, px, size } from "../../../common/gui/size"
import { ListState } from "../../../common/gui/base/List"

export type SelectionState = { type: "multiselect"; selectedItemCount: number; selectedAll: boolean } | { type: "none" }

export interface DriveFolderSelectionEvents {
	onSingleExclusiveSelection: (item: FolderItem) => unknown
	onSingleInclusiveSelection: (item: FolderItem) => unknown
	onSelectPrevious: (item: FolderItem) => unknown
	onSelectNext: (item: FolderItem) => unknown
	onSelectAll: () => unknown
}

export interface DriveFolderContentAttrs {
	selection: SelectionState
	sortOrder: SortingPreference
	fileActions: FileActions
	onSort: (column: SortColumn) => unknown
	listState: ListState<FolderItem>
	selectionEvents: DriveFolderSelectionEvents
}

const columnStyle = {
	display: "flex",
	"align-items": "center",
	cursor: "pointer",
}

function renderHeaderCell(
	columnName: Translation,
	columnId: SortColumn,
	{ column, order }: SortingPreference,
	onSort: DriveFolderContentAttrs["onSort"],
): Children {
	return m(
		"div",
		{
			style: { ...columnStyle },
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
	view({ attrs: { selection, sortOrder, onSort, fileActions, selectionEvents, listState } }: Vnode<DriveFolderContentAttrs>): Children {
		return m(
			"div.flex.col.overflow-hidden.column-gap-12",
			{
				style: {
					display: "grid",
					"grid-template-columns": "calc(25px + 24px) 50px auto 100px 100px 300px calc(44px + 12px)",
				},
			},
			[
				this.renderHeader(selection, sortOrder, onSort, selectionEvents.onSelectAll),

				m(
					".flex.col.scroll.scrollbar-gutter-stable-or-fallback",
					{
						style: {
							"grid-column-start": "1",
							"grid-column-end": "8",
							display: "grid",
							"grid-template-columns": "subgrid",
						},
					},
					listState.items.map((item) =>
						// FIXME: give them an id
						m(DriveFolderContentEntry, {
							item: item,
							selected: listState.selectedItems.has(item),
							onSelect: selectionEvents.onSingleInclusiveSelection,
							checked: listState.inMultiselect && listState.selectedItems.has(item),
							fileActions,
						}),
					),
				),
			],
		)
	}
	private renderHeader(selection: SelectionState, sortOrder: SortingPreference, onSort: (column: SortColumn) => unknown, onSelectAll: () => unknown) {
		return m(
			"div.flex.row.folder-row",
			{
				style: {
					padding: `${size.core_8}px ${size.core_16}px ${size.core_8}px ${size.core_24}px`,
					// ensure that the bar does not shrink too much if we have only text
					minHeight: px(component_size.button_height + 2 * size.core_8),
					"grid-column-start": "1",
					"grid-column-end": "8",
					display: "grid",
					"grid-template-columns": "subgrid",
				},
			},
			[
				m(
					"div",
					{ style: { ...columnStyle } },
					m("input.checkbox", { type: "checkbox", checked: selection.type === "multiselect" && selection.selectedAll, onchange: onSelectAll }),
				),
				selection.type === "multiselect"
					? [
							m(""),
							// FIXME translate
							m(".b", `${selection.selectedItemCount} items selected`),
						]
					: [
							m("div", { style: { ...columnStyle } }, []),
							// FIXME: translations
							renderHeaderCell(lang.makeTranslation("name", "Name"), SortColumn.name, sortOrder, onSort),
							renderHeaderCell(lang.makeTranslation("type", "Type"), SortColumn.mimeType, sortOrder, onSort),
							renderHeaderCell(lang.makeTranslation("size", "Size"), SortColumn.size, sortOrder, onSort),
							renderHeaderCell(lang.makeTranslation("date", "Date"), SortColumn.date, sortOrder, onSort),
							// m("div", { style: { ...columnStyle, width: columnSizes.type } }, "Type"),
							// m("div", { style: { ...columnStyle, width: columnSizes.size } }, "Size"),
							// m("div", { style: { ...columnStyle, width: columnSizes.date } }, "Date"),
							m("div", { style: { ...columnStyle, width: px(component_size.button_height) } }, null),
						],
			],
		)
	}
}
