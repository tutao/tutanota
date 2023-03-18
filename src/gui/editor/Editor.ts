import m, { Children, Component } from "mithril"
import SquireEditor from "squire-rte"
import { defer } from "@tutao/tutanota-utils"
import { px } from "../size"
import { Dialog } from "../base/Dialog"
import { isMailAddress } from "../../misc/FormatValidator"
import type { ImageHandler } from "../../mail/model/MailUtils"
import { Keys, TabIndex } from "../../api/common/TutanotaConstants"
import { isKeyPressed } from "../../misc/KeyManager"

type SanitizerFn = (html: string, isPaste: boolean) => DocumentFragment
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
	squire: SquireEditor
	initialized = defer<void>()
	domElement: HTMLElement | null = null
	enabled = true
	private createsLists = true
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

	constructor(private minHeight: number | null, private sanitizer: SanitizerFn) {
		this.onremove = this.onremove.bind(this)
		this.onbeforeupdate = this.onbeforeupdate.bind(this)
		this.view = this.view.bind(this)
	}

	onbeforeupdate(): boolean {
		// do not update the dom part managed by squire
		return this.squire == null
	}

	onremove() {
		if (this.squire) {
			this.squire.destroy()

			this.squire = null
			this.initialized = defer()
		}
	}

	/**
	 * @param dataTransfer Image data from the clipboard.
	 */
	onPasteImage(dataTransfer: any) {
		const items = [...dataTransfer.detail.clipboardData.items]
		const imageItems = items.filter((item) => /image/.test(item.type))

		if (!imageItems.length) {
			return false
		}

		const reader = new FileReader()

		reader.onload = (loadEvent: ProgressEvent) => {
			const target: any = loadEvent.target
			this.insertImage(target.result)
		}

		reader.readAsDataURL(imageItems[0].getAsFile())
	}

	view(): Children {
		return m(".hide-outline.selectable", {
			role: "textbox",
			"aria-multiline": "true",
			tabindex: TabIndex.Default,
			oncreate: (vnode) => this.initSquire(vnode.dom as HTMLElement),
			class: "flex-grow",
			style: this.minHeight
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

	setCreatesLists(createsLists: boolean): Editor {
		this.createsLists = createsLists
		return this
	}

	initSquire(domElement: HTMLElement) {
		let squire = new SquireEditor(domElement, {
			sanitizeToDOMFragment: this.sanitizer,
			blockAttributes: {
				dir: "auto",
			},
		})
			.addEventListener("keyup", (e: KeyboardEvent) => {
				if (this.createsLists && isKeyPressed(e.keyCode, Keys.SPACE)) {
					let blocks: HTMLElement[] = []
					squire.forEachBlock((block: HTMLElement) => {
						blocks.push(block)
					})
					createList(blocks, /^1\.\s$/, true) // create an ordered list if a line is started with '1. '

					createList(blocks, /^\*\s$/, false) // create an unordered list if a line is started with '* '
				}
			})
			.addEventListener("pasteImage", this.onPasteImage)
		this.squire = squire

		// Suppress paste events if pasting while disabled
		this.squire.addEventListener("willPaste", (e: Event) => {
			if (!this.isEnabled()) {
				e.preventDefault()
			}
		})

		this.squire.addEventListener("pathChange", () => {
			this.getStylesAtPath()
			m.redraw() // allow richtexttoolbar to redraw elements
		})

		this.domElement = domElement
		// the _editor might have been disabled before the dom element was there
		this.setEnabled(this.enabled)
		this.initialized.resolve()

		function createList(blocks: HTMLElement[], regex: RegExp, ordered: boolean) {
			if (blocks.length === 1 && blocks[0].textContent?.match(regex)) {
				squire.modifyBlocks(function (fragment: DocumentFragment) {
					if (fragment.firstChild && fragment.firstChild.firstChild) {
						let textNode = fragment.firstChild.firstChild

						while (textNode.nodeType !== Node.TEXT_NODE && textNode.firstChild !== null && textNode.nodeName.toLowerCase() !== "li") {
							textNode = textNode.firstChild
						}

						if (textNode.nodeType === Node.TEXT_NODE) {
							textNode.textContent = textNode.textContent?.replace(regex, "") ?? null
						}
					}

					return fragment
				})

				if (ordered) {
					squire.makeOrderedList()
				} else {
					squire.makeUnorderedList()
				}
			}
		}
	}

	setEnabled(enabled: boolean) {
		this.enabled = enabled
		if (this.domElement) {
			this.domElement.setAttribute("contenteditable", String(enabled))
		}
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
		this.styles.c = pathSegments.find((f) => f.includes("monospace")) !== undefined
		// decorations
		this.styles.b = this.squire.hasFormat("b")
		this.styles.u = this.squire.hasFormat("u")
		this.styles.i = this.squire.hasFormat("i")
	}

	makeLink() {
		Dialog.showTextInputDialog("makeLink_action", "url_label", null, "").then((url) => {
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

	removeAllFormatting(): void {
		// Create a range which contains the whole editor
		const range = document.createRange()
		range.selectNode(this.squire.getRoot())

		this.squire.removeAllFormatting(range)
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
}
