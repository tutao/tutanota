// @flow
import m from "mithril"
import type {TranslationKey} from "../../misc/LanguageViewModel"
import {lang} from "../../misc/LanguageViewModel"
import {px, size} from "../size"
import {assertMainOrNode} from "../../api/Env"
import {progressIcon} from "./Icon"
import type {ButtonAttrs} from "./ButtonN"
import {ButtonN} from "./ButtonN"
import {neverNull} from "../../api/common/utils/Utils"

assertMainOrNode()

export const ColumnWidth = Object.freeze({
	Small: 'column-width-small', // the column has a fixed small width
	Largest: 'column-width-largest', // all Largest columns equally share the rest of the available width
})
export type ColumnWidthEnum = $Values<typeof ColumnWidth>

/**
 * @param columnHeadingTextIds The texts that shall appear as headers of each column.
 * @param columnWidths The sizes of the columns in px. If 0 is specified the column shares the remaining space with all other '0' width columns.
 * @param showActionButtonColumn True if addButton is specified or the table lines may contain action buttons.
 * @param addButton If set, this button appears beside the expander button.
 * @param lines the lines of the table
 */
export type TableAttrs = {
	columnHeadingTextIds: TranslationKey[],
	columnWidths: ColumnWidthEnum[],
	showActionButtonColumn: boolean,
	addButtonAttrs: ?ButtonAttrs,
	lines: ?TableLineAttrs[]
}

export type TableLineAttrs = {
	cells: string[],
	actionButtonAttrs: ?ButtonAttrs
}

/**
 * Shows a table of TableLine entries. The last column of the table may show action buttons for each TableLine and/or an add button.
 * The table shows a loading spinner until updateEntries() is called the first time.
 */
class _Table {

	view(vnode: Vnode<LifecycleAttrs<TableAttrs>>): VirtualElement {
		const a = vnode.attrs
		const loading = !(a.lines)
		const lineAttrs = a.lines
			? a.lines.map(lineAttrs => this._createLine(lineAttrs, a.showActionButtonColumn, a.columnWidths, false))
			: []

		return m("", [
			m("table.table", [
				[
					this._createLine({
						cells: a.columnHeadingTextIds.map(textId => lang.get(textId)),
						actionButtonAttrs: (loading) ? null : a.addButtonAttrs
					}, a.showActionButtonColumn, a.columnWidths, true)
				].concat(lineAttrs)
			]),
			(loading)
				? m(".flex-center.items-center.button-height", progressIcon())
				: null,
			(!loading && neverNull(a.lines).length === 0)
				? m(".flex-center.items-center.button-height", lang.get("noEntries_msg"))
				: null
		])
	}

	_createLine(lineAttrs: TableLineAttrs, showActionButtonColumn: boolean, columnWidths: ColumnWidthEnum[], bold: boolean): VirtualElement {
		let cells = lineAttrs.cells.map((text, index) => m("td.text-ellipsis.pr.pt-s.pb-s." + columnWidths[index]
			+ ((bold) ? ".b" : ""), {
			title: text, // show the text as tooltip, so ellipsed lines can be shown
		}, text))
		if (showActionButtonColumn) {
			cells.push(m("td", {
				style: {
					width: px(size.button_height),
				}
			}, (lineAttrs.actionButtonAttrs) ? [
				m("", {
					style: {
						position: 'relative',
						right: px(-size.hpad_button) // same as .mr-negative-s
					}
				}, m(ButtonN, neverNull(lineAttrs.actionButtonAttrs)))
			] : []))
		}
		return m("tr.selectable", cells)
	}
}

export const TableN: Class<MComponent<TableAttrs>> = _Table
