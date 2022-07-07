import m, {Children, Component, Vnode} from "mithril"
import type {TranslationKey} from "../../misc/LanguageViewModel"
import {lang} from "../../misc/LanguageViewModel"
import {px, size} from "../size"
import {progressIcon} from "./Icon"
import type {ButtonAttrs} from "./Button.js"
import {Button, ButtonType} from "./Button.js"
import type {lazy} from "@tutao/tutanota-utils"
import {downcast, neverNull} from "@tutao/tutanota-utils"
import {createDropdown} from "./Dropdown.js"
import {Icons} from "./icons/Icons"
import type {clickHandler} from "./GuiUtils"
import {assertMainOrNode} from "../../api/common/Env"

assertMainOrNode()

export const enum ColumnWidth {
	// the column has a fixed small width
	Small = ".column-width-small",
	// all Largest columns equally share the rest of the available width
	Largest = ".column-width-largest",
}

/**
 * @param columnHeading The texts that shall appear as headers of each column. Either a textId or function that returns the translation
 * @param columnWidths The sizes of the columns in px. If 0 is specified the column shares the remaining space with all other '0' width columns.
 * @param showActionButtonColumn True if addButton is specified or the table lines may contain action buttons.
 * @param addButton If set, this button appears beside the expander button.
 * @param lines the lines of the table
 */
export type TableAttrs = {
	columnHeading?: Array<lazy<string> | TranslationKey>
	columnWidths: ReadonlyArray<ColumnWidth>
	columnAlignments?: Array<boolean>
	showActionButtonColumn: boolean
	addButtonAttrs?: ButtonAttrs | null
	lines: ReadonlyArray<TableLineAttrs> | null
}
export type CellTextData = {
	main: string
	info?: string[]
	click?: clickHandler
	mainStyle?: string
}
export type TableLineAttrs = {
	cells: string[] | (() => CellTextData[])
	actionButtonAttrs?: ButtonAttrs | null
}

/**
 * Shows a table of TableLine entries. The last column of the table may show action buttons for each TableLine and/or an add button.
 * The table shows a loading spinner until updateEntries() is called the first time.
 */
export class Table implements Component<TableAttrs> {
	view(vnode: Vnode<TableAttrs>): Children {
		const a = vnode.attrs
		const loading = !a.lines
		const alignments = a.columnAlignments || []
		const lineAttrs = a.lines ? a.lines.map(lineAttrs => this._createLine(lineAttrs, a.showActionButtonColumn, a.columnWidths, false, alignments)) : []
		return m("", [
			m(`table.table${a.columnHeading ? ".table-header-border" : ""}`, [
				(a.columnHeading
						? [
							this._createLine(
								{
									cells: a.columnHeading.map(textIdOrFunction => lang.getMaybeLazy(textIdOrFunction)),
									actionButtonAttrs: loading ? null : a.addButtonAttrs,
								},
								a.showActionButtonColumn,
								a.columnWidths,
								true,
								alignments,
							),
						]
						: []
				).concat(lineAttrs),
			]),
			loading ? m(".flex-center.items-center.button-height", progressIcon()) : null,
			!loading && neverNull(a.lines).length === 0 ? m(".flex-center.items-center.button-height", lang.get("noEntries_msg")) : null,
		])
	}

	_createLine(
		lineAttrs: TableLineAttrs,
		showActionButtonColumn: boolean,
		columnWidths: ReadonlyArray<ColumnWidth>,
		bold: boolean,
		columnAlignments: Array<boolean>,
	): Children {
		let cells

		if (typeof lineAttrs.cells == "function") {
			cells = lineAttrs.cells().map((cellTextData, index) =>
				m("td", [
					m(
						".text-ellipsis.pr.pt-s" +
						columnWidths[index] +
						(bold ? ".b" : "") +
						(cellTextData.click ? ".click" : "" + (cellTextData.mainStyle ? cellTextData.mainStyle : "")) +
						(columnAlignments[index] ? ".right" : ""),
						{
							title: cellTextData.main,
							// show the text as tooltip, so ellipsed lines can be shown
							onclick: (event: MouseEvent) => {
								const dom = downcast(event.target)
								cellTextData.click ? cellTextData.click(event, dom) : null
							},
						},
						cellTextData.main,
					),
					m(
						".small.text-ellipsis.pr" + (cellTextData.click ? ".click" : ""),
						{
							onclick: (event: MouseEvent) => {
								const dom = downcast(event.target)
								cellTextData.click ? cellTextData.click(event, dom) : null
							},
						},
						cellTextData.info ? cellTextData.info.map(line => m("", line)) : null,
					),
				]),
			)
		} else {
			cells = lineAttrs.cells.map((text, index) =>
				m(
					"td.text-ellipsis.pr.pt-s.pb-s." + columnWidths[index] + (bold ? ".b" : "") + (columnAlignments[index] ? ".right" : ""),
					{
						title: text, // show the text as tooltip, so ellipsed lines can be shown
					},
					text,
				),
			)
		}

		if (showActionButtonColumn) {
			cells.push(
				m("td",
					{
						style: {
							width: px(size.button_height),
						},
					},
					lineAttrs.actionButtonAttrs
						? [
							m(
								"",
								{
									style: {
										position: "relative",
										right: px(-size.hpad_button), // same as .mr-negative-s
									},
								},
								m(Button, lineAttrs.actionButtonAttrs),
							),
						]
						: [],
				),
			)
		}

		return m("tr.selectable", cells)
	}
}

interface UpdateableInstanceWithArray<T> {
	getArray: () => Array<T>
	updateInstance: () => Promise<void>
}

export function createRowActions<T>(
	instance: UpdateableInstanceWithArray<T>,
	currentElement: T,
	indexOfElement: number,
	prefixActions: ReadonlyArray<ButtonAttrs> = [],
): ButtonAttrs {
	const elements = instance.getArray()
	const makeButtonAttrs: () => ReadonlyArray<ButtonAttrs | null> = () => [
		...prefixActions,
		indexOfElement > 1
			? {
				label: "moveToTop_action",
				type: ButtonType.Dropdown,
				click: () => {
					elements.splice(indexOfElement, 1)
					elements.unshift(currentElement)
					instance.updateInstance()
				},
			}
			: null,
		indexOfElement > 0
			? {
				label: "moveUp_action",
				type: ButtonType.Dropdown,
				click: () => {
					let prev = elements[indexOfElement - 1]
					elements[indexOfElement - 1] = currentElement
					elements[indexOfElement] = prev
					instance.updateInstance()
				},
			}
			: null,
		indexOfElement < instance.getArray().length - 1
			? {
				label: "moveDown_action",
				type: ButtonType.Dropdown,
				click: () => {
					let next = elements[indexOfElement + 1]
					elements[indexOfElement + 1] = currentElement
					elements[indexOfElement] = next
					instance.updateInstance()
				},
			}
			: null,
		indexOfElement < instance.getArray().length - 2
			? {
				label: "moveToBottom_action",
				type: ButtonType.Dropdown,
				click: () => {
					elements.splice(indexOfElement, 1)
					elements.push(currentElement)
					instance.updateInstance()
				},
			}
			: null,
		{
			label: "delete_action",
			type: ButtonType.Dropdown,
			click: () => {
				elements.splice(indexOfElement, 1)
				instance.updateInstance()
			},
		},
	]
	return {
		label: "edit_action",
		click: createDropdown({lazyButtons: makeButtonAttrs, width: 260}),
		icon: () => Icons.Edit,
	}
}