import m, { Children } from "mithril"
import type { Editor } from "./Editor.js"
import { Icons } from "../base/icons/Icons.js"
import { IconButton } from "../base/IconButton.js"
import { ToggleButton } from "../base/buttons/ToggleButton.js"
import { ButtonSize } from "../base/ButtonSize.js"
import { lang, TranslationKey } from "../utils/LanguageViewModel.js"
import { theme } from "../theme.js"
import { px } from "../size.js"
import { ClientDetector } from "../../platform-kit/app-env/boot/ClientDetector.js"
import { showColorDialog } from "../base/RichTextToolbar.js"
import { buildGrid, columnCount, getCellBox, measureColumnWidths, setColumnWidths } from "./TableUtils.js"

/** below the dialogs/dropdowns (LayerType.Modal = 300 and up), above the editor */
const OVERLAY_Z_INDEX = 350

type EmojiEntry = readonly [name: string, emoji: string]

const EMOJI_SHORTCODES: ReadonlyArray<EmojiEntry> = [
	["smile", "😄"],
	["grin", "😁"],
	["laugh", "😆"],
	["joy", "😂"],
	["sweat", "😅"],
	["wink", "😉"],
	["blush", "😊"],
	["love", "😍"],
	["kiss", "😘"],
	["cool", "😎"],
	["thinking", "🤔"],
	["neutral", "😐"],
	["sleepy", "😴"],
	["sad", "😢"],
	["cry", "😭"],
	["angry", "😡"],
	["scream", "😱"],
	["thumbsup", "👍"],
	["thumbsdown", "👎"],
	["clap", "👏"],
	["pray", "🙏"],
	["wave", "👋"],
	["muscle", "💪"],
	["ok", "👌"],
	["eyes", "👀"],
	["heart", "❤️"],
	["brokenheart", "💔"],
	["fire", "🔥"],
	["star", "⭐"],
	["tada", "🎉"],
	["party", "🎉"],
	["gift", "🎁"],
	["cake", "🎂"],
	["rocket", "🚀"],
	["hundred", "💯"],
	["check", "✅"],
	["cross", "❌"],
	["warning", "⚠️"],
	["question", "❓"],
	["bulb", "💡"],
	["sun", "☀️"],
	["coffee", "☕"],
	["pizza", "🍕"],
	["phone", "📞"],
	["mail", "✉️"],
	["calendar", "📅"],
	["clip", "📎"],
]

interface Suggestion {
	label: string
	/** shown in front of the label */
	prefix?: string
	apply: () => unknown
}

interface SuggestionState {
	items: ReadonlyArray<Suggestion>
	index: number
	node: Text
	/** offset of the trigger character (/ or :) in the text node */
	start: number
	end: number
	anchor: DOMRect
}

/**
 * Floating helpers around the text the user is editing, rendered into a fixed host element on the document body:
 *  - a small formatting toolbar next to a text selection
 *  - a card with edit/remove actions when the cursor is in a link
 *  - resize handle and quick actions around a selected image
 *  - a bar with row/column actions when the cursor is in a table, and the grid to choose the size of a new table
 *  - a "/" command menu and ":" emoji suggestions
 */
export class EditorOverlays {
	private readonly host: HTMLElement
	private suggestion: SuggestionState | null = null
	private hoveredTable: HTMLTableElement | null = null
	private resizing = false
	private tablePicker: { anchor: DOMRect; rows: number; columns: number } | null = null
	private destroyed = false

	constructor(private readonly editor: Editor) {
		this.host = document.createElement("div")
		this.host.style.cssText = `position: fixed; top: 0; left: 0; width: 0; height: 0; z-index: ${OVERLAY_Z_INDEX};`
		document.body.appendChild(this.host)

		const squire = editor.squire!
		const dom = editor.domElement!
		for (const type of ["pathChange", "select", "input"] as const) {
			squire.addEventListener(type, () => this.onEditorChange(type === "input"))
		}
		dom.addEventListener("focus", () => this.update())
		dom.addEventListener("blur", () => setTimeout(() => this.update(), 0))
		dom.addEventListener("keydown", (e) => this.onKeyDown(e), { capture: true })
		dom.addEventListener("mousemove", (e) => this.onMouseMove(e))
		dom.addEventListener("mouseleave", (e) => {
			if (!this.resizing && !(e.relatedTarget instanceof Node && this.host.contains(e.relatedTarget))) this.setHoveredTable(null)
		})
		window.addEventListener("scroll", this.reposition, true)
		window.addEventListener("resize", this.reposition)
	}

	destroy() {
		this.destroyed = true
		window.removeEventListener("scroll", this.reposition, true)
		window.removeEventListener("resize", this.reposition)
		this.hideTablePicker()
		m.render(this.host, null)
		this.host.remove()
	}

	private readonly reposition = () => {
		if (!this.destroyed) this.update()
	}

	private onEditorChange(isInput: boolean) {
		if (isInput) this.detectSuggestion()
		else if (this.suggestion && !this.isCursorInSuggestion()) this.suggestion = null
		this.update()
	}

	private isEditable(): boolean {
		return this.editor.isEnabled() && !this.editor.isReadOnly() && this.editor.squire != null
	}

	private hasFocus(): boolean {
		const dom = this.editor.domElement
		return dom != null && dom.contains(document.activeElement)
	}

	/** Recomputes which overlay to show and renders it. */
	update() {
		if (this.destroyed) return
		let content: Children = null
		if (this.isEditable() && this.hasFocus()) {
			const image = this.editor.getSelectedImage()
			const range = this.editor.squire!.getSelection()
			if (this.suggestion) {
				content = this.renderSuggestions(this.suggestion)
			} else if (image) {
				content = this.renderImageOverlay(image)
			} else if (!range.collapsed) {
				// the OS already shows its own selection menu on touch devices
				if (this.editor.canMergeCells()) content = this.renderTableBar(range.getBoundingClientRect())
				else if (!ClientDetector.get().isTouchSupported()) content = this.renderSelectionToolbar(range)
			} else {
				const link = this.editor.getLinkAtSelection()
				const cell = this.editor.getTableCell()
				if (link) content = this.renderLinkCard(link)
				else if (cell) content = this.renderTableBar(cell.getBoundingClientRect())
			}
		}
		const handlesTable = this.isEditable() ? (this.hoveredTable ?? (this.hasFocus() ? (this.editor.getTableCell()?.closest("table") ?? null) : null)) : null
		m.render(this.host, [
			content,
			handlesTable?.isConnected ? this.renderResizeHandles(handlesTable) : null,
			this.tablePicker ? this.renderTablePicker(this.tablePicker) : null,
		])
	}

	// ---- selection toolbar

	private renderSelectionToolbar(range: Range): Children {
		const rect = range.getBoundingClientRect()
		if (rect.width === 0 && rect.height === 0) return null
		const editor = this.editor
		const toggle = (style: "b" | "i" | "u" | "s", title: TranslationKey, icon: Icons) =>
			m(ToggleButton, {
				title,
				icon,
				toggled: editor.hasStyle(style),
				size: ButtonSize.Compact,
				onToggled: () => {
					editor.setStyle(!editor.hasStyle(style), style)
					this.update()
				},
			})
		return this.floating(rect, [
			toggle("b", "formatTextBold_msg", Icons.Bold),
			toggle("i", "formatTextItalic_msg", Icons.Italic),
			toggle("u", "formatTextUnderline_msg", Icons.Underline),
			toggle("s", "formatTextStrikethrough_msg", Icons.Strikethrough),
			m(IconButton, { label: "makeLink_action", icon: Icons.Chainlink, size: ButtonSize.Compact, click: () => editor.makeLink() }),
			m(IconButton, {
				label: "formatTextColor_msg",
				icon: Icons.ColorpaletteOutline,
				size: ButtonSize.Compact,
				click: () => showColorDialog(editor, "formatTextColor_msg", (color) => editor.squire!.setTextColor(color), true),
			}),
		])
	}

	// ---- tables

	private renderTableBar(anchor: DOMRect): Children {
		const editor = this.editor
		const textButton = (text: string, title: string, run: () => unknown, pressed?: boolean) =>
			m(
				"button.state-bg.border-radius.small.plr-8",
				{
					title,
					"aria-pressed": pressed == null ? undefined : String(pressed),
					style: {
						height: px(32),
						border: "none",
						cursor: "pointer",
						whiteSpace: "nowrap",
						color: theme.on_surface,
						fontWeight: pressed ? "bold" : "normal",
						backgroundColor: pressed ? theme.surface_container_highest : "transparent",
					},
					onclick: () => {
						run()
						this.update()
					},
				},
				text,
			)
		const row = lang.get("tableRow_label")
		const column = lang.get("tableColumn_label")
		return this.floating(anchor, [
			textButton(`+ ${row}`, `+ ${row}`, () => editor.addTableRow()),
			textButton(`+ ${column}`, `+ ${column}`, () => editor.addTableColumn()),
			textButton(`− ${row}`, `− ${row}`, () => editor.deleteTableRow()),
			textButton(`− ${column}`, `− ${column}`, () => editor.deleteTableColumn()),
			editor.canMergeCells()
				? textButton(lang.get("tableMergeCells_action"), lang.get("tableMergeCells_action"), () => editor.mergeSelectedCells())
				: null,
			editor.canSplitCell() ? textButton(lang.get("tableSplitCell_action"), lang.get("tableSplitCell_action"), () => editor.splitSelectedCell()) : null,
			textButton(lang.get("tableHeaderRow_label"), lang.get("tableHeaderRow_label"), () => editor.toggleTableHeader(), editor.hasTableHeader()),
			m(IconButton, {
				label: "tableDelete_action",
				icon: Icons.TrashOutline,
				size: ButtonSize.Compact,
				click: () => {
					editor.deleteTable()
					this.update()
				},
			}),
		])
	}

	// ---- resizing columns and rows

	private onMouseMove(e: MouseEvent) {
		if (this.resizing) return
		const target = e.target instanceof Element ? e.target.closest("table") : null
		this.setHoveredTable(target && this.editor.domElement?.contains(target) ? target : null)
	}

	private setHoveredTable(table: HTMLTableElement | null) {
		if (table !== this.hoveredTable) {
			this.hoveredTable = table
			this.update()
		}
	}

	/** thin strips on the borders between the columns and rows that can be dragged */
	private renderResizeHandles(table: HTMLTableElement): Children {
		const grid = buildGrid(table)
		const tableRect = table.getBoundingClientRect()
		const columns = columnCount(grid)
		const strip = (kind: "col" | "row", index: number, position: number) =>
			m("", {
				key: `${kind}${index}`,
				"aria-hidden": "true",
				style: {
					position: "fixed",
					pointerEvents: "auto",
					touchAction: "none",
					cursor: kind === "col" ? "col-resize" : "row-resize",
					left: px(kind === "col" ? position - 3 : tableRect.left),
					top: px(kind === "col" ? tableRect.top : position - 3),
					width: px(kind === "col" ? 6 : tableRect.width),
					height: px(kind === "col" ? tableRect.height : 6),
				},
				onmouseenter: (e: MouseEvent) => ((e.currentTarget as HTMLElement).style.backgroundColor = theme.primary),
				onmouseleave: (e: MouseEvent) => {
					if (this.resizing) return
					;(e.currentTarget as HTMLElement).style.backgroundColor = ""
					// leaving towards something that is not the table: the handles are not needed any more
					if (!(e.relatedTarget instanceof Node && this.editor.domElement?.contains(e.relatedTarget))) this.setHoveredTable(null)
				},
				onpointerdown: (e: PointerEvent) => (kind === "col" ? this.startColumnResize(e, table, index) : this.startRowResize(e, table, index)),
			})
		const handles: Children[] = []
		// a boundary is where a cell ends, merged cells have no handle inside of them
		for (let c = 0; c < columns - 1; c++) {
			const edge = this.findEdge(grid, (box) => box.right === c, "right")
			if (edge != null) handles.push(strip("col", c, edge))
		}
		for (let r = 0; r < grid.length; r++) {
			const edge = this.findEdge(grid, (box) => box.bottom === r, "bottom")
			if (edge != null) handles.push(strip("row", r, edge))
		}
		return handles
	}

	private findEdge(grid: ReturnType<typeof buildGrid>, ends: (box: { right: number; bottom: number }) => boolean, side: "right" | "bottom"): number | null {
		for (const row of grid) {
			for (const cell of row) {
				const box = cell && getCellBox(grid, cell)
				if (cell && box && ends(box)) return cell.getBoundingClientRect()[side]
			}
		}
		return null
	}

	private startColumnResize(e: PointerEvent, table: HTMLTableElement, index: number) {
		const widths = measureColumnWidths(table, buildGrid(table))
		const total = table.getBoundingClientRect().width
		if (widths.length < 2 || total <= 0) return
		const minWidth = 30
		this.editor.squire!.saveUndoState()
		table.style.tableLayout = "fixed"
		if (!table.style.width) table.style.width = `${Math.round(total)}px`
		this.trackDrag(e, (dx, dy) => {
			const shift = Math.min(Math.max(dx, minWidth - widths[index]), widths[index + 1] - minWidth)
			const next = widths.slice()
			next[index] += shift
			next[index + 1] -= shift
			setColumnWidths(
				table,
				next.map((width) => (width / total) * 100),
			)
		})
	}

	private startRowResize(e: PointerEvent, table: HTMLTableElement, index: number) {
		const row = table.rows[index]
		if (!row) return
		const startHeight = row.getBoundingClientRect().height
		this.editor.squire!.saveUndoState()
		this.trackDrag(e, (dx, dy) => {
			row.style.height = `${Math.max(24, Math.round(startHeight + dy))}px`
		})
	}

	/** calls the callback with the distance from the start while the pointer is dragged */
	private trackDrag(start: PointerEvent, onMove: (dx: number, dy: number) => void) {
		start.preventDefault()
		const handle = start.currentTarget as HTMLElement
		handle.setPointerCapture(start.pointerId)
		this.resizing = true
		const move = (e: PointerEvent) => {
			onMove(e.clientX - start.clientX, e.clientY - start.clientY)
			this.update()
		}
		const end = () => {
			handle.removeEventListener("pointermove", move)
			handle.removeEventListener("pointerup", end)
			handle.removeEventListener("pointercancel", end)
			this.resizing = false
			handle.style.backgroundColor = ""
			this.update()
		}
		handle.addEventListener("pointermove", move)
		handle.addEventListener("pointerup", end)
		handle.addEventListener("pointercancel", end)
	}

	/** Shows a grid below the anchor; hovering selects rows x columns like in other word processors, clicking inserts the table. */
	showTablePicker(anchor: DOMRect) {
		this.tablePicker = { anchor, rows: 0, columns: 0 }
		document.addEventListener("pointerdown", this.onOutsidePointerDown, true)
		document.addEventListener("keydown", this.onPickerKeyDown, true)
		this.update()
	}

	private hideTablePicker() {
		this.tablePicker = null
		document.removeEventListener("pointerdown", this.onOutsidePointerDown, true)
		document.removeEventListener("keydown", this.onPickerKeyDown, true)
	}

	private readonly onOutsidePointerDown = (e: PointerEvent) => {
		if (!(e.target instanceof Node) || !this.host.contains(e.target)) {
			this.hideTablePicker()
			this.update()
		}
	}

	private readonly onPickerKeyDown = (e: KeyboardEvent) => {
		if (e.key === "Escape") {
			e.preventDefault()
			e.stopPropagation()
			this.hideTablePicker()
			this.update()
		}
	}

	private renderTablePicker(picker: { anchor: DOMRect; rows: number; columns: number }): Children {
		const size = 8
		const cell = 22
		const choose = (rows: number, columns: number) => {
			this.hideTablePicker()
			this.update()
			this.editor.insertTable(rows, columns)
			setTimeout(() => this.editor.squire?.focus(), 0)
		}
		return m(
			".elevated-bg.dropdown-shadow.border-radius-8.p-8",
			{
				style: {
					position: "fixed",
					left: px(Math.min(Math.max(8, picker.anchor.left), window.innerWidth - (size * cell + 24))),
					top: px(picker.anchor.bottom + 4),
					pointerEvents: "auto",
				},
				onmousedown: (e: MouseEvent) => e.preventDefault(),
			},
			[
				m(
					"",
					{
						style: { display: "grid", gridTemplateColumns: `repeat(${size}, ${px(cell)})`, gap: px(2) },
						onmouseleave: () => this.setPickerSize(0, 0),
					},
					Array.from({ length: size * size }, (_, index) => {
						const row = Math.floor(index / size) + 1
						const column = (index % size) + 1
						const selected = row <= picker.rows && column <= picker.columns
						return m("button", {
							"aria-label": `${row} × ${column}`,
							style: {
								width: px(cell),
								height: px(cell),
								padding: "0",
								cursor: "pointer",
								border: `1px solid ${selected ? theme.primary : theme.outline}`,
								backgroundColor: selected ? theme.primary : "transparent",
								opacity: selected ? "0.6" : "1",
							},
							onmouseenter: () => this.setPickerSize(row, column),
							onfocus: () => this.setPickerSize(row, column),
							onclick: () => choose(row, column),
						})
					}),
				),
				m(".center.small.mt-8", picker.rows > 0 ? `${picker.rows} × ${picker.columns}` : lang.get("insertTable_action")),
			],
		)
	}

	private setPickerSize(rows: number, columns: number) {
		if (this.tablePicker) {
			this.tablePicker.rows = rows
			this.tablePicker.columns = columns
			this.update()
		}
	}

	// ---- link card

	private renderLinkCard(link: HTMLAnchorElement): Children {
		const editor = this.editor
		const href = link.getAttribute("href") ?? ""
		return this.floating(
			link.getBoundingClientRect(),
			[
				m(".small.text-ellipsis.plr-8", { style: { maxWidth: px(240) }, title: href }, href),
				m(IconButton, { label: "editLink_action", icon: Icons.PenOutline, size: ButtonSize.Compact, click: () => editor.makeLink() }),
				m(IconButton, {
					label: "breakLink_action",
					icon: Icons.TrashOutline,
					size: ButtonSize.Compact,
					click: () => {
						editor.squire!.removeLink()
						this.update()
					},
				}),
			],
			"below",
		)
	}

	// ---- images

	private renderImageOverlay(image: HTMLImageElement): Children {
		const editor = this.editor
		const rect = image.getBoundingClientRect()
		if (rect.width === 0) return null
		const align = (alignment: "left" | "center" | "right", label: TranslationKey, icon: Icons) =>
			m(IconButton, {
				label,
				icon,
				size: ButtonSize.Compact,
				click: () => {
					editor.squire!.setTextAlignment(alignment)
					this.update()
				},
			})
		const sizeButton = (fraction: number) =>
			m(
				"button.state-bg.border-radius.small.b.plr-8",
				{
					style: { height: px(32), border: "none", background: "none", color: theme.on_surface, cursor: "pointer" },
					title: lang.get("imageSize_label"),
					onclick: () => {
						editor.setImageScale(image, fraction)
						this.update()
					},
				},
				`${fraction * 100}%`,
			)
		return [
			// outline around the image
			m("", {
				style: {
					position: "fixed",
					left: px(rect.left),
					top: px(rect.top),
					width: px(rect.width),
					height: px(rect.height),
					outline: `2px solid ${theme.primary}`,
					pointerEvents: "none",
				},
			}),
			// resize handle
			m("", {
				role: "slider",
				"aria-label": lang.get("imageSize_label"),
				style: {
					position: "fixed",
					left: px(rect.right - 8),
					top: px(rect.bottom - 8),
					width: px(16),
					height: px(16),
					borderRadius: px(8),
					backgroundColor: theme.primary,
					border: `2px solid ${theme.on_primary}`,
					cursor: "nwse-resize",
					pointerEvents: "auto",
					touchAction: "none",
				},
				onpointerdown: (e: PointerEvent) => this.startResize(e, image),
			}),
			this.floating(rect, [
				align("left", "formatTextLeft_msg", Icons.TextAlignLeft),
				align("center", "formatTextCenter_msg", Icons.TextAlignCenter),
				align("right", "formatTextRight_msg", Icons.TextAlignRight),
				[0.25, 0.5, 1].map(sizeButton),
				m(IconButton, { label: "imageAltText_label", icon: Icons.InfoOutline, size: ButtonSize.Compact, click: () => editor.editImageAltText(image) }),
				m(IconButton, {
					label: "delete_action",
					icon: Icons.TrashOutline,
					size: ButtonSize.Compact,
					click: () => {
						editor.squire!.saveUndoState()
						image.remove()
						this.update()
					},
				}),
			]),
		]
	}

	private startResize(e: PointerEvent, image: HTMLImageElement) {
		e.preventDefault()
		const handle = e.currentTarget as HTMLElement
		handle.setPointerCapture(e.pointerId)
		const startX = e.clientX
		const startWidth = image.getBoundingClientRect().width
		let undoStateSaved = false
		const onMove = (ev: PointerEvent) => {
			if (!undoStateSaved) {
				// remember the original size, then only change the style until the drag is over
				this.editor.squire!.saveUndoState()
				undoStateSaved = true
			}
			image.style.width = `${Math.max(24, Math.round(startWidth + ev.clientX - startX))}px`
			image.style.height = "auto"
			image.style.maxWidth = "100%"
			this.update()
		}
		const onUp = () => {
			handle.removeEventListener("pointermove", onMove)
			handle.removeEventListener("pointerup", onUp)
			handle.removeEventListener("pointercancel", onUp)
			this.update()
		}
		handle.addEventListener("pointermove", onMove)
		handle.addEventListener("pointerup", onUp)
		handle.addEventListener("pointercancel", onUp)
	}

	// ---- "/" commands and ":" emoji

	private commands(): ReadonlyArray<{ label: TranslationKey; apply: () => unknown }> {
		const squire = this.editor.squire!
		return [
			{ label: "formatTextHeading1_msg", apply: () => this.editor.setBlockTag("h1") },
			{ label: "formatTextHeading2_msg", apply: () => this.editor.setBlockTag("h2") },
			{ label: "formatTextHeading3_msg", apply: () => this.editor.setBlockTag("h3") },
			{ label: "formatTextUl_msg", apply: () => squire.makeUnorderedList() },
			{ label: "formatTextOl_msg", apply: () => squire.makeOrderedList() },
			{ label: "formatTextQuote_msg", apply: () => this.editor.addQuoteLevel() },
			{ label: "formatTextCodeBlock_msg", apply: () => squire.toggleCode() },
			{ label: "formatTextHorizontalRule_msg", apply: () => squire.insertHTML("<hr>") },
			{ label: "insertTable_action", apply: () => this.editor.insertTable(3, 3) },
			{ label: "formatTextChecklist_msg", apply: () => this.editor.addChecklist() },
		]
	}

	private detectSuggestion() {
		this.suggestion = null
		if (!this.isEditable()) return
		const squire = this.editor.squire!
		const range = squire.getSelection()
		const node = range.startContainer
		if (!range.collapsed || !(node instanceof Text)) return
		const offset = range.startOffset
		const before = node.data.slice(0, offset)

		let items: Suggestion[] = []
		let start = -1
		const emojiMatch = /(?:^|\s):([a-z0-9_]{2,20})$/i.exec(before)
		const block = node.parentElement
		if (emojiMatch) {
			const query = emojiMatch[1].toLowerCase()
			start = offset - emojiMatch[1].length - 1
			items = EMOJI_SHORTCODES.filter(([name]) => name.includes(query))
				.slice(0, 8)
				.map(([name, emoji]) => ({ label: name, prefix: emoji, apply: () => squire.insertHTML(emoji) }))
		} else if (
			/^\/[a-z0-9 ]{0,20}$/i.test(before) &&
			block?.tagName === "DIV" &&
			block.parentNode === this.editor.domElement &&
			node === block.firstChild
		) {
			const query = before.slice(1).trim().toLowerCase()
			start = 0
			items = this.commands()
				.map((command) => ({ label: lang.get(command.label), apply: command.apply }))
				.filter((item) => item.label.toLowerCase().includes(query))
		}
		if (start < 0 || items.length === 0) return
		const rects = range.getClientRects()
		const anchor = rects.length > 0 ? rects[0] : (block ?? node.parentElement!).getBoundingClientRect()
		this.suggestion = { items, index: 0, node, start, end: offset, anchor }
	}

	private isCursorInSuggestion(): boolean {
		const range = this.editor.squire!.getSelection()
		const s = this.suggestion!
		return range.collapsed && range.startContainer === s.node && range.startOffset >= s.start + 1 && range.startOffset <= s.end
	}

	private applySuggestion(item: Suggestion) {
		const s = this.suggestion
		if (!s) return
		this.suggestion = null
		const squire = this.editor.squire!
		const range = document.createRange()
		range.setStart(s.node, s.start)
		range.setEnd(s.node, Math.min(s.end, s.node.length))
		squire.saveUndoState()
		range.deleteContents()
		squire.setSelection(range)
		item.apply()
		this.update()
		setTimeout(() => squire.focus(), 0)
	}

	private onKeyDown(e: KeyboardEvent) {
		const s = this.suggestion
		if (!s) return
		const stop = () => {
			e.preventDefault()
			e.stopImmediatePropagation()
		}
		switch (e.key) {
			case "ArrowDown":
				stop()
				s.index = (s.index + 1) % s.items.length
				break
			case "ArrowUp":
				stop()
				s.index = (s.index - 1 + s.items.length) % s.items.length
				break
			case "Enter":
			case "Tab":
				stop()
				this.applySuggestion(s.items[s.index])
				return
			case "Escape":
				stop()
				this.suggestion = null
				break
			default:
				return
		}
		this.update()
	}

	private renderSuggestions(s: SuggestionState): Children {
		return m(
			".elevated-bg.dropdown-shadow.border-radius-8.flex.col.pt-4.pb-4",
			{
				role: "listbox",
				style: { position: "fixed", left: px(Math.max(8, s.anchor.left)), top: px(s.anchor.bottom + 4), minWidth: px(180), pointerEvents: "auto" },
				onmousedown: (e: MouseEvent) => e.preventDefault(),
			},
			s.items.map((item, i) =>
				m(
					"button.flex.items-center.gap-8.plr-12.state-bg",
					{
						role: "option",
						"aria-selected": String(i === s.index),
						style: {
							height: px(36),
							border: "none",
							textAlign: "left",
							cursor: "pointer",
							color: theme.on_surface,
							backgroundColor: i === s.index ? theme.surface_container_highest : "transparent",
						},
						onclick: () => this.applySuggestion(item),
					},
					[item.prefix ? m("span", { style: { fontSize: px(18) } }, item.prefix) : null, m("span", item.label)],
				),
			),
		)
	}

	// ---- layout helper

	/** a small bar centered above (or below) the given rectangle; clicks do not take the focus away from the editor */
	private floating(rect: DOMRect, children: Children, placement: "above" | "below" = "above"): Children {
		const above = placement === "above" && rect.top > 56
		return m(
			".elevated-bg.dropdown-shadow.border-radius-8.flex.items-center.pl-4.pr-4",
			{
				style: {
					position: "fixed",
					left: px(Math.min(Math.max(rect.left + rect.width / 2, 120), window.innerWidth - 120)),
					top: px(above ? rect.top - 8 : rect.bottom + 8),
					transform: above ? "translate(-50%, -100%)" : "translate(-50%, 0)",
					pointerEvents: "auto",
				},
				onmousedown: (e: MouseEvent) => e.preventDefault(),
			},
			children,
		)
	}
}
