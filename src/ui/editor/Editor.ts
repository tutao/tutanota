import m, { Children, Component } from "mithril"
import SquireEditor from "squire-rte"
import { defer, first, isMailAddress, isNotNull } from "../../platform-kit/utils"
import { px } from "../size"
import { Dialog } from "../base/Dialog"
import { TabIndex } from "../../platform-kit/app-env"
import { LegacyTextFieldType } from "../base/LegacyTextField.js"
import { EditorOverlays } from "./EditorOverlays.js"
import {
	buildGrid,
	CellGrid,
	columnCount,
	GridBox,
	getCellBox,
	getSelectionBox,
	insertCellAt,
	insertColumnWidth,
	mergeCells,
	removeColumnWidth,
	splitCell,
} from "./TableUtils.js"
import { HTML_EDITOR_LINE_HEIGHT } from "./HtmlEditor.js"
import { DialogType } from "../base/Dialog"
import { DialogHeaderBar, DialogHeaderBarAttrs } from "../base/DialogHeaderBar.js"
import { ButtonType } from "../base/Button.js"
import { ContentWithOptionsDialog } from "../dialogs/ContentWithOptionsDialog.js"
import { TextField } from "../base/TextField.js"

type SanitizerFn = (html: string, isPaste: boolean) => DocumentFragment
export type ImagePasteEvent = CustomEvent<{ clipboardData: DataTransfer }>
export type TextPasteEvent = CustomEvent<{ fragment: DocumentFragment }>
/** The bundled squire (libs/squire-raw.mjs) is patched and has indentation functions that the published typings do not declare. */
export type Squire = SquireEditor & {
	increaseIndentationLevel(range?: Range): Squire
	decreaseIndentationLevel(range?: Range): Squire
	removeIndentation(range?: Range): Squire
}

export type Style = "b" | "i" | "u" | "s" | "c" | "a"
export type Alignment = "left" | "center" | "right" | "justify"
export type Listing = "ol" | "ul"
type Styles = {
	[key in Style]: boolean
} & {
	alignment: Alignment
	listing: Listing | null
}

export interface ImageHandler {
	insertImage(srcAttr: string, attrs?: Record<string, string>): HTMLElement
}

const TABLE_STYLE = "border-collapse: collapse; width: 100%; table-layout: fixed;"
const TABLE_CELL_STYLE = "border: 1px solid #b0b0b0; padding: 6px 8px; vertical-align: top;"
const TABLE_HEADER_CELL_STYLE = `${TABLE_CELL_STYLE} font-weight: bold; text-align: left; border-bottom: 2px solid #8a8a8a;`
const CHECKBOX_UNCHECKED = "\u2610"
const CHECKBOX_CHECKED = "\u2611"
/** a checklist line starts with a box character and a space */
const CHECKBOX_PREFIX = /^[\u2610\u2611] /

const ALIGN_CLASS_SELECTOR_PREFIX = ".align-"

export class Editor implements ImageHandler, Component {
	squire: Squire | null = null
	initialized = defer<void>()
	domElement: HTMLElement | null = null
	private showOutline = false
	private enabled = true
	private overlays: EditorOverlays | null = null
	private readOnly = false
	private createsLists = true
	private userHasPasted = false
	private areRelativeLinksAllowed = false
	private styleActions = Object.freeze({
		b: [() => this.squire!.bold(), () => this.squire!.removeBold(), () => this.styles.b],
		i: [() => this.squire!.italic(), () => this.squire!.removeItalic(), () => this.styles.i],
		u: [() => this.squire!.underline(), () => this.squire!.removeUnderline(), () => this.styles.u],
		s: [() => this.squire!.strikethrough(), () => this.squire!.removeStrikethrough(), () => this.styles.s],
		c: [() => this.squire!.setFontFace("monospace"), () => this.squire!.setFontFace(null), () => this.styles.c],
		a: [() => this.makeLink(), () => this.squire!.removeLink(), () => this.styles.a],
	} as const)

	styles: Styles = {
		b: false,
		i: false,
		u: false,
		s: false,
		c: false,
		a: false,
		alignment: "left",
		listing: null,
	}

	/**
	 * squire 2.0 removed the isPaste argument from the sanitizeToDomFragment function.
	 * since sanitizeToDomFragment is called before squire's willPaste event is fired, we
	 * can't have our sanitization strategy depend on the willPaste event.
	 *
	 * we therefore add our own paste handler to the dom element squire uses and set a
	 * flag once we detect a paste and reset it when squire next fires the "input" event.
	 *
	 * * user pastes
	 * * "paste" event on dom sets flag
	 * * sanitizeToDomFragment is called by squire
	 * * "input" event on squire resets flag.
	 */
	private pasteListener: (e: ClipboardEvent) => void = (_: ClipboardEvent) => {
		this.userHasPasted = true
		if (this.afterPasteHandler != null) {
			this.imagesBeforePaste = new Set(this.getDOM().querySelectorAll("img"))
		}
	}
	private afterPasteHandler: ((imagesBeforePaste: ReadonlySet<Element>) => unknown) | null = null
	private imagesBeforePaste: ReadonlySet<Element> = new Set()

	constructor(
		private minHeight: number | null,
		private sanitizer: SanitizerFn,
		private staticLineAmount: number | null,
	) {
		this.onremove = this.onremove.bind(this)
		this.onbeforeupdate = this.onbeforeupdate.bind(this)
		this.view = this.view.bind(this)
	}

	onbeforeupdate(): boolean {
		// do not update the dom part managed by squire
		return this.squire == null
	}

	onremove() {
		this.domElement?.removeEventListener("paste", this.pasteListener)
		this.overlays?.destroy()
		this.overlays = null
		if (this.squire) {
			this.squire!.destroy()

			this.squire = null
			this.initialized = defer()
		}
	}

	view(): Children {
		return m(".selectable.text_editor", {
			role: "textbox",
			"aria-multiline": "true",
			"data-testid": "text_editor",
			tabindex: TabIndex.Default,
			oncreate: (vnode) => this.initSquire(vnode.dom as HTMLElement),
			class: `flex-grow ${this.showOutline ? "" : "hide-outline"}`,
			style: this.staticLineAmount
				? {
						"max-height": px(this.staticLineAmount * HTML_EDITOR_LINE_HEIGHT),
						"min-height:": px(this.staticLineAmount * HTML_EDITOR_LINE_HEIGHT),
						overflow: "scroll",
					}
				: this.minHeight
					? {
							"min-height": px(this.minHeight),
						}
					: {},
		})
	}

	isEmpty(): boolean {
		return !this.squire || this.squire!.getHTML() === "<div><br></div>"
	}

	getValue(): string {
		return this.isEmpty() ? "" : this.squire!.getHTML()
	}

	addChangeListener(callback: (...args: Array<any>) => any) {
		this.squire!.addEventListener("input", callback)
	}

	setMinHeight(minHeight: number): Editor {
		this.minHeight = minHeight
		return this
	}

	setShowOutline(show: boolean) {
		this.showOutline = show
	}

	setAreRelativeLinksAllowed(areRelativeLinksAllowed: boolean) {
		this.areRelativeLinksAllowed = areRelativeLinksAllowed
	}

	/**
	 * Sets a static amount 'n' of lines the Editor should always render/allow.
	 * When using n+1 lines, the editor will instead begin to be scrollable.
	 * Currently, this overwrites min-height.
	 */
	setStaticNumberOfLines(numberOfLines: number): Editor {
		this.staticLineAmount = numberOfLines
		return this
	}

	setCreatesLists(createsLists: boolean): Editor {
		this.createsLists = createsLists
		return this
	}

	initSquire(domElement: HTMLElement) {
		this.squire = new SquireEditor(domElement, {
			sanitizeToDOMFragment: (html: string) => this.sanitizer(html, this.userHasPasted),
			blockAttributes: {
				dir: "auto",
			},
		}) as Squire

		// Suppress paste events if pasting while disabled
		this.squire!.addEventListener("willPaste", (e: TextPasteEvent) => {
			if (!this.isEnabled()) {
				e.preventDefault()
			}
		})

		this.squire!.addEventListener("input", (_: CustomEvent<void>) => {
			const wasPaste = this.userHasPasted
			this.userHasPasted = false
			if (wasPaste) {
				this.afterPasteHandler?.(this.imagesBeforePaste)
			}
		})
		domElement.addEventListener("paste", this.pasteListener)
		domElement.addEventListener("keydown", (e) => this.handleMarkdownShortcut(e))
		domElement.addEventListener("keydown", (e) => this.handleTableTab(e), { capture: true })
		domElement.addEventListener("keydown", (e) => this.handleChecklistEnter(e), { capture: true })
		domElement.addEventListener("mousemove", (e) => {
			domElement.style.cursor = this.enabled && !this.readOnly && this.getCheckboxAt(e.clientX, e.clientY) ? "pointer" : ""
		})
		// Ctrl/Cmd + K opens the link dialog
		this.squire!.setKeyHandler(/Mac|iPhone|iPad/.test(navigator.userAgent) ? "Meta-k" : "Ctrl-k", (_, event) => {
			event.preventDefault()
			if (this.enabled && !this.readOnly) this.makeLink()
		})
		// clicking an image selects it, so that alignment (left/center/right) and deletion apply to it
		domElement.addEventListener("click", (e) => {
			if (this.toggleCheckboxAt(e)) return
			if (this.enabled && !this.readOnly && e.target instanceof HTMLImageElement) {
				const range = document.createRange()
				range.selectNode(e.target)
				this.squire!.setSelection(range)
			}
		})

		this.squire!.addEventListener("pathChange", () => {
			this.getStylesAtPath()
			m.redraw() // allow richtexttoolbar to redraw elements
		})

		this.domElement = domElement
		this.overlays = new EditorOverlays(this)
		// the _editor might have been disabled before the dom element was there
		this.setEnabled(this.enabled)
		this.initialized.resolve()
	}

	setEnabled(enabled: boolean) {
		this.enabled = enabled
		this.updateContentEditableAttribute()
	}

	setReadOnly(readOnly: boolean) {
		this.readOnly = readOnly
		this.updateContentEditableAttribute()
	}

	isReadOnly(): boolean {
		return this.readOnly
	}

	isEnabled(): boolean {
		return this.enabled
	}

	setHTML(html: string) {
		this.squire!.setHTML(html)
	}

	getHTML(): string {
		return this.squire!.getHTML()
	}

	setStyle(state: boolean, style: Style) {
		;(state ? this.styleActions[style][0] : this.styleActions[style][1])()
	}

	hasStyle: (arg0: Style) => boolean = (style) => (this.squire ? this.styleActions[style][2]() : false)
	getStylesAtPath: () => void = () => {
		if (!this.squire) {
			return
		}

		let pathSegments: string[] = this.squire!.getPath().split(">")

		// lists
		const ulIndex = pathSegments.lastIndexOf("UL")
		const olIndex = pathSegments.lastIndexOf("OL")

		if (ulIndex === -1) {
			if (olIndex > -1) {
				this.styles.listing = "ol"
			} else {
				this.styles.listing = null
			}
		} else if (olIndex === -1) {
			if (ulIndex > -1) {
				this.styles.listing = "ul"
			} else {
				this.styles.listing = null
			}
		} else if (olIndex > ulIndex) {
			this.styles.listing = "ol"
		} else {
			this.styles.listing = "ul"
		}

		//links
		this.styles.a = pathSegments.includes("A")

		// alignment
		const alignment = pathSegments
			.map((f) => {
				const alignClassLocation = f.indexOf(ALIGN_CLASS_SELECTOR_PREFIX)
				if (alignClassLocation >= 0) {
					return first(f.substring(alignClassLocation + ALIGN_CLASS_SELECTOR_PREFIX.length).split(/[^a-z]/))
				} else {
					return null
				}
			})
			.find(isNotNull)
		switch (alignment) {
			case "right":
			case "justify":
			case "center":
			case "left":
				this.styles.alignment = alignment
				break

			default:
				// null (or otherwise invalid)
				this.styles.alignment = "left"
		}

		// font
		this.styles.c = pathSegments.some((f) => f.includes("monospace"))
		// decorations
		this.styles.b = this.squire!.hasFormat("b")
		this.styles.u = this.squire!.hasFormat("u")
		this.styles.i = this.squire!.hasFormat("i")
		this.styles.s = this.squire!.hasFormat("s")
	}

	/** Changes the block elements in the selection to the given tag (div, h1, ...) while keeping their content. */
	setBlockTag(tag: string) {
		this.squire!.modifyBlocks((fragment) => {
			const result = document.createDocumentFragment()
			for (const node of Array.from(fragment.childNodes)) {
				if (node instanceof HTMLElement && /^(DIV|P|H[1-6])$/.test(node.tagName)) {
					const replacement = document.createElement(tag)
					for (const attr of Array.from(node.attributes)) replacement.setAttribute(attr.name, attr.value)
					while (node.firstChild) replacement.appendChild(node.firstChild)
					result.appendChild(replacement)
				} else {
					result.appendChild(node)
				}
			}
			return result
		})
	}

	/**
	 * Typing a markdown-like prefix at the start of a line followed by a space turns the line into a list, quote or heading:
	 * "- " or "* " (bullet list), "1. " (numbered list), "> " (quote), "# ", "## ", "### " (headings).
	 */
	private handleMarkdownShortcut(e: KeyboardEvent) {
		if (e.key !== " " || e.isComposing || e.ctrlKey || e.metaKey || e.altKey || !this.enabled || this.readOnly || !this.squire || !this.domElement) return
		const range = this.squire.getSelection()
		if (!range.collapsed) return
		let block: Node | null = range.startContainer
		while (block && block.parentNode !== this.domElement) block = block.parentNode
		if (!(block instanceof HTMLElement) || block.tagName !== "DIV") return // lists, quotes, headings and code are not converted again
		const prefix = document.createRange()
		prefix.setStart(block, 0)
		prefix.setEnd(range.startContainer, range.startOffset)
		const text = prefix.toString()
		let action: (() => unknown) | null = null
		if (this.createsLists && (text === "-" || text === "*")) action = () => this.squire!.makeUnorderedList()
		else if (this.createsLists && /^\d{1,3}\.$/.test(text)) action = () => this.squire!.makeOrderedList()
		else if (text === ">") action = () => this.addQuoteLevel()
		else if (/^#{1,3}$/.test(text)) action = () => this.setBlockTag(`h${text.length}`)
		if (action == null) return
		e.preventDefault()
		this.squire.saveUndoState()
		prefix.deleteContents()
		this.squire.setSelection(prefix)
		action()
	}

	/** @return the hyperlink the selection/cursor is currently in, if any */
	getLinkAtSelection(): HTMLAnchorElement | null {
		const range = this.squire?.getSelection()
		let node: Node | null = range?.commonAncestorContainer ?? null
		while (node && node !== this.domElement) {
			if (node instanceof HTMLAnchorElement) return node
			node = node.parentNode
		}
		return null
	}

	/**
	 * Prompts the user to input a URL and creates a link at the current cursor position in the editor.
	 * If the cursor is inside an existing link, the link is edited instead and can also be removed.
	 */
	makeLink() {
		const existing = this.getLinkAtSelection()
		let url = existing?.getAttribute("href") ?? ""
		const selectedText = existing ? (existing.textContent ?? "") : (this.squire?.getSelectedText() ?? "")
		let text = selectedText
		const apply = () => {
			let value = url.trim()
			if (value === "") return
			if (isMailAddress(value, false)) {
				value = "mailto:" + value
			} else if (
				!this.areRelativeLinksAllowed &&
				!value.startsWith("http://") &&
				!value.startsWith("https://") &&
				!value.startsWith("mailto:") &&
				!value.startsWith("{")
			) {
				value = "https://" + value
			}
			dialog.close()
			const newText = text.trim()
			if (existing) {
				this.squire!.modifyDocument(() => {
					existing.setAttribute("href", value)
					if (newText !== "" && newText !== selectedText) {
						existing.textContent = newText
					}
				})
			} else if (newText !== "" && newText !== selectedText) {
				// the link text differs from the selection (or there is none): insert a new link with the given text
				const anchor = document.createElement("a")
				anchor.setAttribute("href", value)
				anchor.textContent = newText
				this.squire!.insertHTML(anchor.outerHTML)
			} else {
				this.squire!.makeLink(value)
			}
			setTimeout(() => this.squire!.focus(), 100)
		}
		const headerBarAttrs: DialogHeaderBarAttrs = {
			left: [{ type: ButtonType.Secondary, label: "close_alt", click: () => dialog.close() }],
			middle: existing ? "editLink_action" : "makeLink_action",
		}
		const dialog = new Dialog(DialogType.Popup_S, {
			view: () =>
				m(".flex.col.border-radius", { style: { height: "100%" } }, [
					m(DialogHeaderBar, headerBarAttrs),
					m(
						".plr-24.flex-grow",
						m(
							ContentWithOptionsDialog,
							{
								mainActionText: "ok_action",
								mainActionClick: apply,
								subActionText: existing ? "breakLink_action" : null,
								subActionClick: () => {
									dialog.close()
									this.squire!.removeLink()
									setTimeout(() => this.squire!.focus(), 100)
								},
							},
							[
								m(TextField, {
									label: "linkText_label",
									value: text,
									oninput: (value) => (text = value),
									onReturnKeyPressed: apply,
								}),
								m(TextField, {
									label: "url_label",
									value: url,
									type: LegacyTextFieldType.Url,
									oninput: (value) => (url = value),
									onReturnKeyPressed: apply,
								}),
							],
						),
					),
				]),
		})
		dialog.show()
	}

	/** @return the image that is currently selected as a whole (e.g. by clicking it), if any */
	getSelectedImage(): HTMLImageElement | null {
		const range = this.squire?.getSelection()
		if (range && range.startContainer === range.endContainer && range.endOffset - range.startOffset === 1) {
			const node = range.startContainer.childNodes[range.startOffset]
			if (node instanceof HTMLImageElement) return node
		}
		return null
	}

	async editImageAltText(image: HTMLImageElement) {
		const alt = await Dialog.showTextInputDialog({
			title: "imageAltText_label",
			label: "imageAltText_label",
			infoMsgId: "imageAltTextInfo_msg",
			defaultValue: image.getAttribute("alt") ?? "",
		})
		this.squire!.saveUndoState()
		image.setAttribute("alt", alt.trim())
	}

	setImageWidth(image: HTMLImageElement, widthPx: number) {
		this.squire!.saveUndoState()
		image.style.width = `${Math.max(24, widthPx)}px`
		image.style.height = "auto"
		image.style.maxWidth = "100%"
	}

	/** Scales the image to the given fraction of its natural width. */
	setImageScale(image: HTMLImageElement, fraction: number) {
		if (image.naturalWidth === 0) return
		this.setImageWidth(image, Math.round(image.naturalWidth * fraction))
	}

	/** Indents or outdents the selected blocks, or changes the list level when in a list. */
	changeIndent(delta: 1 | -1) {
		const squire = this.squire!
		if (this.styles.listing) {
			delta > 0 ? squire.increaseListLevel() : squire.decreaseListLevel()
		} else {
			delta > 0 ? squire.increaseIndentationLevel() : squire.decreaseIndentationLevel()
		}
	}

	isInQuote(): boolean {
		return this.getQuoteAtSelection() != null
	}

	toggleQuote() {
		this.isInQuote() ? this.removeQuoteLevel() : this.addQuoteLevel()
		m.redraw()
	}

	/** Wraps the selected blocks in a quote, the same element and style the app uses for quoted mails. */
	addQuoteLevel() {
		const squire = this.squire!
		squire.modifyBlocks((fragment) => {
			const quote = document.createElement("blockquote")
			quote.className = "tutanota_quote"
			quote.appendChild(fragment)
			return quote
		})
		squire.focus()
	}

	/** @return the innermost blockquote around the selection, if any */
	private getQuoteAtSelection(): HTMLElement | null {
		const root = this.domElement
		if (!this.squire || !root) return null
		const range = this.squire.getSelection()
		// right after quoting, squire may leave the range on the root itself, pointing at the blockquote
		let node: Node | null = range.startContainer === root ? (root.childNodes[range.startOffset] ?? null) : range.startContainer
		while (node && node !== root && node.nodeName !== "BLOCKQUOTE") node = node.parentNode
		return node instanceof HTMLElement && node !== root ? node : null
	}

	/** Removes the innermost blockquote around the selection by unwrapping it. */
	private removeQuoteLevel() {
		const squire = this.squire!
		const range = squire.getSelection()
		const root = this.domElement!
		const quote = this.getQuoteAtSelection()
		if (quote == null || !quote.parentNode) return
		const parent = quote.parentNode
		const { startContainer, startOffset, endContainer, endOffset } = range
		const first = quote.firstChild
		squire.saveUndoState(range)
		squire.modifyDocument(() => {
			for (const child of Array.from(quote.childNodes)) parent.insertBefore(child, quote)
			quote.remove()
		})
		const restored = document.createRange()
		if (startContainer === quote || endContainer === quote || startContainer === root || endContainer === root) {
			restored.setStart(first ?? parent, 0)
			restored.collapse(true)
		} else {
			restored.setStart(startContainer, startOffset)
			restored.setEnd(endContainer, endOffset)
		}
		squire.setSelection(restored)
		squire.focus()
	}

	/**
	 * Toggles a checkbox in front of the selected lines. The boxes are plain characters, so they survive sanitizing and render in
	 * every email client; clicking one in the editor flips it, see {@link toggleCheckboxAt}.
	 */
	addChecklist() {
		const squire = this.squire!
		const blocks: HTMLElement[] = []
		squire.forEachBlock((block) => {
			blocks.push(block)
			return false
		}, false)
		const allHaveBox = blocks.every((block) => CHECKBOX_PREFIX.test(block.textContent ?? ""))
		squire.saveUndoState()
		for (const block of blocks) {
			const first = block.firstChild
			if (allHaveBox) {
				if (first instanceof Text && CHECKBOX_PREFIX.test(first.data)) first.deleteData(0, 2)
			} else if (!CHECKBOX_PREFIX.test(block.textContent ?? "")) {
				block.insertBefore(document.createTextNode(`${CHECKBOX_UNCHECKED} `), first)
			}
		}
	}

	/** @return the text node holding the checkbox that is under the given point, if any */
	private getCheckboxAt(x: number, y: number): Text | null {
		const doc = document as Document & { caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node } | null }
		const node = doc.caretPositionFromPoint ? doc.caretPositionFromPoint(x, y)?.offsetNode : document.caretRangeFromPoint?.(x, y)?.startContainer
		if (!(node instanceof Text) || !CHECKBOX_PREFIX.test(node.data) || node.previousSibling != null) return null
		if (!node.parentElement || !this.domElement?.contains(node.parentElement) || !/^(DIV|LI|P|H[1-6]|TD|TH)$/.test(node.parentElement.tagName)) return null
		const glyph = document.createRange()
		glyph.setStart(node, 0)
		glyph.setEnd(node, 1)
		const rect = glyph.getBoundingClientRect()
		const slack = 4
		return x >= rect.left - slack && x <= rect.right + slack && y >= rect.top - slack && y <= rect.bottom + slack ? node : null
	}

	private toggleCheckboxAt(e: MouseEvent): boolean {
		if (!this.enabled || this.readOnly || !this.squire) return false
		const node = this.getCheckboxAt(e.clientX, e.clientY)
		if (node == null) return false
		this.squire.saveUndoState()
		node.replaceData(0, 1, node.data[0] === CHECKBOX_UNCHECKED ? CHECKBOX_CHECKED : CHECKBOX_UNCHECKED)
		return true
	}

	/** Pressing Enter in a checklist item starts a new item, pressing it in an empty item ends the list. */
	private handleChecklistEnter(e: KeyboardEvent) {
		if (e.key !== "Enter" || e.shiftKey || e.isComposing || !this.enabled || this.readOnly || !this.squire) return
		const squire = this.squire
		const range = squire.getSelection()
		const block = range.collapsed ? this.getBlock(range.startContainer) : null
		const text = block?.textContent ?? ""
		const isEmptyItem = /^[\u2610\u2611]\s*$/.test(text)
		if (!block || !(CHECKBOX_PREFIX.test(text) || isEmptyItem)) return
		if (isEmptyItem) {
			// empty item: remove the box instead of adding another line
			e.preventDefault()
			e.stopImmediatePropagation()
			squire.saveUndoState()
			if (block.firstChild instanceof Text) block.firstChild.deleteData(0, block.firstChild.length)
			return
		}
		// squire splits the block after this event, afterwards the new block gets its own box
		setTimeout(() => {
			const current = this.getBlock(squire.getSelection().startContainer)
			if (!current || current === block || CHECKBOX_PREFIX.test(current.textContent ?? "")) return
			const box = document.createTextNode(`${CHECKBOX_UNCHECKED} `)
			current.insertBefore(box, current.firstChild)
			const caret = document.createRange()
			caret.setStart(box, box.length)
			caret.collapse(true)
			squire.setSelection(caret)
		}, 0)
	}

	/** @return the innermost block element (div, li, ...) containing the node */
	private getBlock(node: Node): HTMLElement | null {
		let current: Node | null = node
		while (current && current !== this.domElement) {
			if (current instanceof HTMLElement && /^(DIV|LI|P|H[1-6]|TD|TH)$/.test(current.tagName)) return current
			current = current.parentNode
		}
		return null
	}

	/** Shows the grid that lets the user pick the size of the table to insert, below the given anchor. */
	openTablePicker(anchor: DOMRect) {
		this.overlays?.showTablePicker(anchor)
	}

	/** Inserts a table with a header row, spanning the width of the editor. The cursor is put into the first cell. */
	insertTable(rows: number, columns: number) {
		const squire = this.squire!
		const existing = new Set(Array.from(squire.getRoot().querySelectorAll("table")))
		const headerCell = `<th style="${TABLE_HEADER_CELL_STYLE}"><div><br></div></th>`
		const cell = `<td style="${TABLE_CELL_STYLE}"><div><br></div></td>`
		const headerRow = `<tr>${headerCell.repeat(columns)}</tr>`
		const bodyRows = `<tr>${cell.repeat(columns)}</tr>`.repeat(Math.max(0, rows - 1))
		squire.insertHTML(`<table style="${TABLE_STYLE}"><tbody>${headerRow}${bodyRows}</tbody></table><div><br></div>`)
		const inserted = Array.from(squire.getRoot().querySelectorAll("table")).find((table) => !existing.has(table))
		if (inserted?.rows[0]?.cells[0]) this.moveCaretToCell(inserted.rows[0].cells[0])
	}

	/** Switches the first row of the table the cursor is in between header cells and normal cells. */
	toggleTableHeader() {
		const cell = this.getTableCell()
		const table = cell?.closest("table")
		const firstRow = table?.rows[0]
		if (!cell || !table || !firstRow) return
		const makeHeader = !this.hasTableHeader()
		this.squire!.saveUndoState()
		let caretCell: Element | null = null
		for (const existing of Array.from(firstRow.cells)) {
			const replacement = document.createElement(makeHeader ? "th" : "td")
			for (const attr of Array.from(existing.attributes)) replacement.setAttribute(attr.name, attr.value)
			replacement.setAttribute("style", makeHeader ? TABLE_HEADER_CELL_STYLE : TABLE_CELL_STYLE)
			while (existing.firstChild) replacement.appendChild(existing.firstChild)
			if (existing === cell) caretCell = replacement
			existing.replaceWith(replacement)
		}
		if (caretCell) this.moveCaretToCell(caretCell)
	}

	hasTableHeader(): boolean {
		const firstRow = this.getTableCell()?.closest("table")?.rows[0]
		return firstRow != null && firstRow.cells.length > 0 && Array.from(firstRow.cells).every((cell) => cell.tagName === "TH")
	}

	/** @return the table cell containing the node, if any */
	private getCellOf(node: Node | null): HTMLTableCellElement | null {
		const root = this.domElement
		while (node && node !== root && node.nodeName !== "TD" && node.nodeName !== "TH") node = node.parentNode
		return node instanceof HTMLTableCellElement ? node : null
	}

	/** @return the table cell the selection starts in, if any */
	getTableCell(): HTMLTableCellElement | null {
		const root = this.domElement
		if (!this.squire || !root) return null
		const range = this.squire.getSelection()
		return this.getCellOf(range.startContainer === root ? (root.childNodes[range.startOffset] ?? null) : range.startContainer)
	}

	/** @return the table, its grid and the rectangle of cells that the selection covers (more than one cell when it spans several) */
	getSelectedCells(): { table: HTMLTableElement; grid: CellGrid; box: GridBox } | null {
		const root = this.domElement
		const start = this.getTableCell()
		const table = start?.closest("table")
		if (!this.squire || !root || !start || !table) return null
		const range = this.squire.getSelection()
		const endNode = range.endContainer === root ? (root.childNodes[Math.max(0, range.endOffset - 1)] ?? null) : range.endContainer
		let end = this.getCellOf(endNode)
		if (!end || end.closest("table") !== table) end = start
		const grid = buildGrid(table)
		const box = getSelectionBox(grid, start, end)
		return box ? { table, grid, box } : null
	}

	canMergeCells(): boolean {
		const selected = this.getSelectedCells()
		return selected != null && (selected.box.top !== selected.box.bottom || selected.box.left !== selected.box.right)
	}

	canSplitCell(): boolean {
		const cell = this.getTableCell()
		return cell != null && (cell.colSpan > 1 || cell.rowSpan > 1)
	}

	/** Merges the selected cells into one, which spans all the rows and columns they covered. */
	mergeSelectedCells() {
		const selected = this.getSelectedCells()
		if (!selected) return
		this.squire!.saveUndoState()
		const merged = mergeCells(selected.grid, selected.box)
		if (merged) this.moveCaretToCell(merged)
	}

	/** Splits a merged cell into single cells again. */
	splitSelectedCell() {
		const cell = this.getTableCell()
		const table = cell?.closest("table")
		if (!cell || !table) return
		this.squire!.saveUndoState()
		splitCell(buildGrid(table), table, cell, () => this.createEmptyCellLike(cell))
		this.moveCaretToCell(cell)
	}

	private moveCaretToCell(cell: Element) {
		const range = document.createRange()
		range.selectNodeContents(cell.firstElementChild ?? cell)
		range.collapse(true)
		this.squire!.setSelection(range)
	}

	private createEmptyCellLike(cell: HTMLTableCellElement): HTMLTableCellElement {
		const copy = document.createElement("td")
		copy.setAttribute("style", cell.tagName === "TH" ? TABLE_CELL_STYLE : (cell.getAttribute("style") ?? TABLE_CELL_STYLE))
		copy.innerHTML = "<div><br></div>"
		return copy
	}

	/** Adds a row below the selected cell, rows that are merged across the border just get taller. */
	addTableRow() {
		const cell = this.getTableCell()
		const table = cell?.closest("table")
		if (!cell || !table) return
		const grid = buildGrid(table)
		const box = getCellBox(grid, cell)
		if (!box) return
		this.squire!.saveUndoState()
		const newRow = document.createElement("tr")
		const stretched = new Set<HTMLTableCellElement>()
		for (let c = 0; c < columnCount(grid); c++) {
			const above = grid[box.bottom][c]
			if (above && grid[box.bottom + 1]?.[c] === above) {
				if (!stretched.has(above)) above.rowSpan += 1
				stretched.add(above)
			} else {
				newRow.appendChild(this.createEmptyCellLike(above ?? cell))
			}
		}
		table.rows[box.bottom].after(newRow)
		this.moveCaretToCell(newRow.cells[0] ?? cell)
	}

	/** Adds a column to the right of the selected cell, columns that are merged across the border just get wider. */
	addTableColumn() {
		const cell = this.getTableCell()
		const table = cell?.closest("table")
		if (!cell || !table) return
		const grid = buildGrid(table)
		const box = getCellBox(grid, cell)
		if (!box) return
		this.squire!.saveUndoState()
		const stretched = new Set<HTMLTableCellElement>()
		let focus: HTMLTableCellElement = cell
		for (let r = 0; r < grid.length; r++) {
			const current = grid[r][box.right]
			if (current && grid[r][box.right + 1] === current) {
				if (!stretched.has(current)) current.colSpan += 1
				stretched.add(current)
			} else {
				const created = this.createEmptyCellLike(current ?? cell)
				insertCellAt(grid, table, r, box.right, created)
				if (r === box.top) focus = created
			}
		}
		insertColumnWidth(table, grid, box.right)
		this.moveCaretToCell(focus)
	}

	/** Deletes the rows of the selected cells. */
	deleteTableRow() {
		const selected = this.getSelectedCells()
		if (!selected) return
		const { table, box } = selected
		if (table.rows.length <= box.bottom - box.top + 1) return this.deleteTable()
		this.squire!.saveUndoState()
		for (let r = box.bottom; r >= box.top; r--) this.removeGridRow(table, r)
		const row = table.rows[Math.min(box.top, table.rows.length - 1)]
		if (row?.cells[0]) this.moveCaretToCell(row.cells[0])
	}

	private removeGridRow(table: HTMLTableElement, r: number) {
		const grid = buildGrid(table)
		const row = table.rows[r]
		for (const cell of new Set(grid[r])) {
			const box = cell && getCellBox(grid, cell)
			if (!cell || !box) continue
			if (box.top < r) {
				cell.rowSpan -= 1 // merged from above, just gets shorter
			} else if (cell.rowSpan > 1) {
				// merged downwards: the remaining part moves to the next row
				cell.rowSpan -= 1
				insertCellAt(grid, table, r + 1, box.left, cell, cell)
			}
		}
		row.remove()
	}

	/** Deletes the columns of the selected cells. */
	deleteTableColumn() {
		const selected = this.getSelectedCells()
		if (!selected) return
		const { table, box } = selected
		if (columnCount(selected.grid) <= box.right - box.left + 1) return this.deleteTable()
		this.squire!.saveUndoState()
		for (let c = box.right; c >= box.left; c--) {
			const grid = buildGrid(table)
			for (const cell of new Set(grid.map((row) => row[c]))) {
				if (!cell) continue
				if (cell.colSpan > 1) cell.colSpan -= 1
				else cell.remove()
			}
			removeColumnWidth(table, c)
		}
		const grid = buildGrid(table)
		const focus = grid[Math.min(box.top, grid.length - 1)]?.[Math.min(box.left, columnCount(grid) - 1)]
		if (focus) this.moveCaretToCell(focus)
	}

	deleteTable() {
		const table = this.getTableCell()?.closest("table")
		if (!table) return
		this.squire!.saveUndoState()
		table.remove()
		this.squire!._ensureBottomLine()
	}

	/** Tab / Shift+Tab move between cells and add a row after the last one, so it never traps keyboard focus outside tables. */
	private handleTableTab(e: KeyboardEvent) {
		if (e.key !== "Tab" || !this.enabled || this.readOnly) return
		const cell = this.getTableCell()
		const table = cell?.closest("table")
		if (!cell || !table) return
		e.preventDefault()
		e.stopImmediatePropagation()
		const cells = Array.from(table.querySelectorAll("td, th"))
		const index = cells.indexOf(cell) + (e.shiftKey ? -1 : 1)
		if (index < 0) return
		if (index >= cells.length) this.addTableRow()
		else this.moveCaretToCell(cells[index])
	}

	setAfterPasteHandler(handler: ((imagesBeforePaste: ReadonlySet<Element>) => unknown) | null) {
		this.afterPasteHandler = handler
	}

	insertImage(srcAttr: string, attrs: Record<string, string>): HTMLElement {
		return this.squire!.insertImage(srcAttr, attrs)
	}

	/**
	 * Inserts the given html content at the current cursor position.
	 */
	insertHTML(html: string) {
		this.squire!.insertHTML(html)
	}

	getDOM(): HTMLElement {
		return this.squire!.getRoot()
	}

	getCursorPosition(): ClientRect {
		return this.squire!.getCursorPosition()
	}

	focus(): void {
		this.squire!.focus()

		this.getStylesAtPath()
	}

	isAttached(): boolean {
		return this.squire != null
	}

	getSelectedText(): string {
		return this.squire!.getSelectedText()
	}

	addEventListener(type: string, handler: (arg0: Event) => void) {
		this.squire!.addEventListener(type, handler)
	}

	setSelection(range: Range) {
		this.squire!.setSelection(range)
	}

	/**
	 * Convenience function for this.isEnabled() && !this.isReadOnly()
	 */
	isEditable(): boolean {
		return this.isEnabled() && !this.isReadOnly()
	}

	private updateContentEditableAttribute() {
		if (this.domElement) {
			this.domElement.setAttribute("contenteditable", String(this.isEditable()))
		}
	}
}
