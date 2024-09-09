import m, { Children, Component, Vnode } from "mithril"
import { lang, TranslationText } from "../../misc/LanguageViewModel"
import { progressIcon } from "./Icon"
import { downcast, neverNull } from "@tutao/tutanota-utils"
import { createDropdown, DropdownButtonAttrs } from "./Dropdown.js"
import { Icons } from "./icons/Icons"
import type { ClickHandler } from "./GuiUtils"
import { assertMainOrNode } from "../../api/common/Env"
import { IconButton, IconButtonAttrs } from "./IconButton.js"
import { ButtonSize } from "./ButtonSize.js"
import { px, size } from "../size.js"
import { InfoIcon } from "./InfoIcon.js"

assertMainOrNode()

export const enum ColumnWidth {
	// the column has a fixed small width
	Small = ".column-width-small",
	// all Largest columns equally share the rest of the available width
	Largest = ".column-width-largest",
}

export type TableHeading = {
	text: TranslationText
	helpText?: TranslationText
}

/**
 * @param columnHeading The texts that shall appear as headers of each column. Either a textId or function that returns the translation
 * @param columnWidths The sizes of the columns in px. If 0 is specified the column shares the remaining space with all other '0' width columns.
 * @param columnAlignments true for a column that's aligned opposite the default, false for one with the default alignment.
 * @param showActionButtonColumn True if addButton is specified or the table lines may contain action buttons.
 * @param addButton If set, this button appears beside the expander button.
 * @param lines the lines of the table
 */
export type TableAttrs = {
	columnHeading?: Array<TableHeading | TranslationText>
	columnWidths: ReadonlyArray<ColumnWidth>
	columnAlignments?: Array<boolean>
	verticalColumnHeadings?: boolean
	showActionButtonColumn: boolean
	addButtonAttrs?: IconButtonAttrs | null
	lines: ReadonlyArray<TableLineAttrs> | null
	class?: string
}
export type CellTextData = {
	main: string
	info?: string[]
	click?: ClickHandler
	mainStyle?: string
}
export type TableLineAttrs = {
	cells: string[] | (() => CellTextData[])
	actionButtonAttrs?: IconButtonAttrs | null
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
		const lineAttrs = a.lines
			? a.lines.map((lineAttrs) => this.createLine(lineAttrs, a.showActionButtonColumn, a.columnWidths, false, alignments, false))
			: []

		return m("", { class: a.class }, [
			m(`table.table${a.columnHeading ? ".table-header-border" : ""}`, [
				(a.columnHeading
					? [
							this.createLine(
								{
									cells: () =>
										a.columnHeading!.map((header) => {
											const text = this.isTableHeading(header) ? header.text : header
											const info = this.isTableHeading(header) && header.helpText ? [lang.getMaybeLazy(header.helpText)] : undefined
											return {
												main: lang.getMaybeLazy(text),
												info: info,
											} satisfies CellTextData
										}),
									actionButtonAttrs: loading ? null : a.addButtonAttrs,
								},
								a.showActionButtonColumn,
								a.columnWidths,
								true,
								alignments,
								a.verticalColumnHeadings ?? false,
								true,
							),
					  ]
					: []
				).concat(lineAttrs),
			]),
			loading ? m(".flex-center.items-center.button-height", progressIcon()) : null,
			!loading && neverNull(a.lines).length === 0 ? m(".flex-center.items-center.button-height", lang.get("noEntries_msg")) : null,
		])
	}

	private isTableHeading(textIdOrFunction: TableHeading | TranslationText): textIdOrFunction is TableHeading {
		return (textIdOrFunction as TableHeading).text !== undefined
	}

	private createLine(
		lineAttrs: TableLineAttrs,
		showActionButtonColumn: boolean,
		columnWidths: ReadonlyArray<ColumnWidth>,
		bold: boolean,
		columnAlignments: Array<boolean>,
		verticalText: boolean,
		useHelpButton: boolean = false,
	): Children {
		let cells

		if (typeof lineAttrs.cells == "function") {
			cells = lineAttrs.cells().map((cellTextData, index) =>
				m(
					"td",
					m(
						"",
						{ class: useHelpButton ? "flex items-center height-100p full-width" : "" },
						m(
							".text-ellipsis.pr.pt-s" +
								columnWidths[index] +
								(bold ? ".b" : "") +
								(cellTextData.click ? ".click" : "" + (cellTextData.mainStyle ? cellTextData.mainStyle : "")) +
								(columnAlignments[index] ? ".right" : ""),
							{
								title: cellTextData.main,
								// show the text as tooltip, so ellipsed lines can be shown
								onclick: cellTextData.click
									? (event: MouseEvent) => {
											const dom = downcast(event.target)
											cellTextData.click!(event, dom)
									  }
									: undefined,
							},
							verticalText ? m("span.vertical-text", cellTextData.main) : cellTextData.main,
						),
						Table.renderHelpText(cellTextData, useHelpButton),
					),
				),
			)
		} else {
			cells = lineAttrs.cells.map((text, index) =>
				m(
					"td.text-ellipsis.pr.pt-s.pb-s." + columnWidths[index] + (bold ? ".b" : "") + (columnAlignments[index] ? ".right" : ""),
					{
						title: text, // show the text as tooltip, so ellipsed lines can be shown
					},
					verticalText ? m("span.vertical-text", text) : text,
				),
			)
		}

		if (showActionButtonColumn) {
			cells.push(
				m(
					"td",
					{
						style: {
							width: px(size.button_height_compact),
						},
					},
					lineAttrs.actionButtonAttrs ? m(IconButton, lineAttrs.actionButtonAttrs) : [],
				),
			)
		}

		return m("tr.selectable", cells)
	}

	private static renderHelpText(cellTextData: CellTextData, useHelpButton: boolean): Children {
		const info = cellTextData.info
		if (info == null) {
			return undefined
		}

		if (useHelpButton) {
			return m(InfoIcon, { text: info.join("\n") })
		} else {
			return m(
				".small.text-ellipsis.pr" + (cellTextData.click ? ".click" : ""),
				{
					onclick: cellTextData.click
						? (event: MouseEvent) => {
								const dom = downcast(event.target)
								cellTextData.click!(event, dom)
						  }
						: undefined,
				},
				info.map((line) => m("", line)),
			)
		}
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
	prefixActions: ReadonlyArray<DropdownButtonAttrs> = [],
): IconButtonAttrs {
	const elements = instance.getArray()
	const makeButtonAttrs: () => ReadonlyArray<DropdownButtonAttrs | null> = () => [
		...prefixActions,
		indexOfElement > 1
			? {
					label: "moveToTop_action",
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
					click: () => {
						elements.splice(indexOfElement, 1)
						elements.push(currentElement)
						instance.updateInstance()
					},
			  }
			: null,
		{
			label: "delete_action",
			click: () => {
				elements.splice(indexOfElement, 1)
				instance.updateInstance()
			},
		},
	]
	return {
		title: "edit_action",
		click: createDropdown({ lazyButtons: makeButtonAttrs, width: 260 }),
		icon: Icons.More,
		size: ButtonSize.Compact,
	}
}
