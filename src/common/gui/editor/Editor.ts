import m, { Children, Component } from "mithril"
import SquireEditor from "squire-rte"
import { defer } from "@tutao/tutanota-utils"
import { px } from "../size"
import { Dialog } from "../base/Dialog"
import { isMailAddress } from "../../misc/FormatValidator"
import { TabIndex } from "../../api/common/TutanotaConstants"
import { TextFieldType } from "../base/TextField.js"
import { HTML_EDITOR_LINE_HEIGHT } from "./HtmlEditor.js"
import type { ImageHandler } from "../../mailFunctionality/SharedMailUtils.js"

type SanitizerFn = (html: string, isPaste: boolean) => DocumentFragment
export type ImagePasteEvent = CustomEvent<{ clipboardData: DataTransfer }>
export type TextPasteEvent = CustomEvent<{ fragment: DocumentFragment }>
export type Style = "b" | "i" | "u" | "c" | "a"
export type Alignment = "left" | "center" | "right" | "justify"
export type Listing = "ol" | "ul"
type Styles = {
	[key in Style]: boolean
} & {
	alignment: Alignment
	listing: Listing | null
}

export class Editor implements ImageHandler, Component {
	squire: SquireEditor | null
	initialized = defer<void>()
	domElement: HTMLElement | null = null
	private enabled = true
	private readOnly = false
	private createsLists = true
	private userHasPasted = false
	private styleActions = Object.freeze({
		b: [() => this.squire.bold(), () => this.squire.removeBold(), () => this.styles.b],
		i: [() => this.squire.italic(), () => this.squire.removeItalic(), () => this.styles.i],
		u: [() => this.squire.underline(), () => this.squire.removeUnderline(), () => this.styles.u],
		c: [() => this.squire.setFontFace("monospace"), () => this.squire.setFontFace(null), () => this.styles.c],
		a: [() => this.makeLink(), () => this.squire.removeLink(), () => this.styles.a],
	} as const)

	styles: Styles = {
		b: false,
		i: false,
		u: false,
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
	private pasteListener: (e: ClipboardEvent) => void = (_: ClipboardEvent) => (this.userHasPasted = true)

	constructor(private minHeight: number | null, private sanitizer: SanitizerFn, private staticLineAmount: number | null) {
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
		if (this.squire) {
			this.squire.destroy()

			this.squire = null
			this.initialized = defer()
		}
	}

	view(): Children {
		return m(".hide-outline.selectable", {
			role: "textbox",
			"aria-multiline": "true",
			tabindex: TabIndex.Default,
			oncreate: (vnode) => this.initSquire(vnode.dom as HTMLElement),
			class: "flex-grow",
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
		return !this.squire || this.squire.getHTML() === "<div><br></div>"
	}

	getValue(): string {
		return this.isEmpty() ? "" : this.squire.getHTML()
	}

	addChangeListener(callback: (...args: Array<any>) => any) {
		this.squire.addEventListener("input", callback)
	}

	setMinHeight(minHeight: number): Editor {
		this.minHeight = minHeight
		return this
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
		})

		// Suppress paste events if pasting while disabled
		this.squire.addEventListener("willPaste", (e: TextPasteEvent) => {
			if (!this.isEnabled()) {
				e.preventDefault()
			}
		})

		this.squire.addEventListener("input", (_: CustomEvent<void>) => (this.userHasPasted = false))
		domElement.addEventListener("paste", this.pasteListener)

		this.squire.addEventListener("pathChange", () => {
			this.getStylesAtPath()
			m.redraw() // allow richtexttoolbar to redraw elements
		})

		this.domElement = domElement
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

	setHTML(html: string | null) {
		this.squire.setHTML(html)
	}

	getHTML(): string {
		return this.squire.getHTML()
	}

	setStyle(state: boolean, style: Style) {
		;(state ? this.styleActions[style][0] : this.styleActions[style][1])()
	}

	hasStyle: (arg0: Style) => boolean = (style) => (this.squire ? this.styleActions[style][2]() : false)
	getStylesAtPath: () => void = () => {
		if (!this.squire) {
			return
		}

		let pathSegments: string[] = this.squire.getPath().split(">")

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
		let alignment = pathSegments.find((f) => f.includes("align"))

		if (alignment !== undefined) {
			switch (alignment.split(".")[1].substring(6)) {
				case "left":
					this.styles.alignment = "left"
					break

				case "right":
					this.styles.alignment = "right"
					break

				case "center":
					this.styles.alignment = "center"
					break

				default:
					this.styles.alignment = "justify"
			}
		} else {
			this.styles.alignment = "left"
		}

		// font
		this.styles.c = pathSegments.some((f) => f.includes("monospace"))
		// decorations
		this.styles.b = this.squire.hasFormat("b")
		this.styles.u = this.squire.hasFormat("u")
		this.styles.i = this.squire.hasFormat("i")
	}

	makeLink() {
		Dialog.showTextInputDialog({
			title: "makeLink_action",
			label: "url_label",
			textFieldType: TextFieldType.Url,
		}).then((url) => {
			if (isMailAddress(url, false)) {
				url = "mailto:" + url
			} else if (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("mailto:") && !url.startsWith("{")) {
				url = "https://" + url
			}

			this.squire.makeLink(url)
		})
	}

	insertImage(srcAttr: string, attrs?: Record<string, string>): HTMLElement {
		return this.squire.insertImage(srcAttr, attrs)
	}

	/**
	 * Inserts the given html content at the current cursor position.
	 */
	insertHTML(html: string) {
		this.squire.insertHTML(html)
	}

	getDOM(): HTMLElement {
		return this.squire.getRoot()
	}

	getCursorPosition(): ClientRect {
		return this.squire.getCursorPosition()
	}

	focus(): void {
		this.squire.focus()

		this.getStylesAtPath()
	}

	isAttached(): boolean {
		return this.squire != null
	}

	getSelectedText(): string {
		return this.squire.getSelectedText()
	}

	addEventListener(type: string, handler: (arg0: Event) => void) {
		this.squire.addEventListener(type, handler)
	}

	setSelection(range: Range) {
		this.squire.setSelection(range)
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
