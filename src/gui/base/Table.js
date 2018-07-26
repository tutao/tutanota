// @flow
import m from "mithril"
import TableLine from "./TableLine"
import {lang} from "../../misc/LanguageViewModel"
import {Button} from "./Button"
import {px, size} from "../size"
import {assertMainOrNode} from "../../api/Env"
import {progressIcon} from "./Icon"

assertMainOrNode()

export const ColumnWidth = {
	Small: 'column-width-small', // the column has a fixed small width
	Largest: 'column-width-largest', // all Largest columns equally share the rest of the available width
}
export type ColumnWidthEnum = $Values<typeof ColumnWidth>;

/**
 * Shows a table of TableLine entries. The last column of the table may show action buttons for each TableLine and/or an add button.
 * The table shows a loading spinner until updateEntries() is called the first time.
 */
export class Table {
	_lines: TableLine[];
	_loading: boolean;
	view: Function;

	/**
	 * @param columnHeadingTextIds The texts that shall appear as headers of each column.
	 * @param columnWidths The sizes of the columns in px. If 0 is specified the column shares the remaining space with all other '0' width columns.
	 * @param showActionButtonColumn True if addButton is specified or the table lines may contain action buttons.
	 * @param addButton If set, this button appears beside the expander button.
	 */
	constructor(columnHeadingTextIds: string[], columnWidths: ColumnWidthEnum[], showActionButtonColumn: boolean, addButton: ?Button) {
		this._lines = []
		this._loading = true

		this.view = (): VirtualElement => {
			return m("", [
				m("table.table", [
					[this._createLine(columnHeadingTextIds.map(textId => lang.get(textId)), showActionButtonColumn, (this._loading) ? null : addButton, columnWidths, true)].concat(
						this._createContentLines(showActionButtonColumn, columnWidths)
					)
				]),
				(this._loading) ? m(".flex-center.items-center.button-height", progressIcon()) : null,
				(!this._loading && this._lines.length
					=== 0) ? m(".flex-center.items-center.button-height", lang.get("noEntries_msg")) : null
			])
		}
	}

	_createContentLines(showActionButtonColumn: boolean, columnWidths: ColumnWidthEnum[]): VirtualElement[] {
		return this._lines.map(line => {
			return this._createLine(line.cells, showActionButtonColumn, (showActionButtonColumn) ? line.actionButton : null, columnWidths, false)
		})
	}

	_createLine(texts: string[], showActionButtonColumn: boolean, actionButton: ?Button, columnWidths: ColumnWidthEnum[], bold: boolean): VirtualElement {
		let cells = texts.map((text, index) => m("td.text-ellipsis.pr.pt-s.pb-s." + columnWidths[index]
			+ ((bold) ? ".b" : ""), {
			title: text, // show the text as tooltip, so ellipsed lines can be shown
		}, text))
		if (showActionButtonColumn) {
			cells.push(m("td", {
				style: {
					width: px(size.button_height),
					position: 'relative',
					'right': px(-size.hpad_button) // same as .mr-negative-s
				}
			}, (actionButton) ? [m(actionButton)] : []))
		}
		return m("tr", cells)
	}

	updateEntries(lines: TableLine[]) {
		this._lines = lines
		this._loading = false
		// wait for the animation frame, otherwise there is a problem when this function is called before the containing view is rendered
		window.requestAnimationFrame(() => m.redraw())
	}
}
