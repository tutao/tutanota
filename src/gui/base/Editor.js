// @flow
import m from "mithril"
import SquireEditor from "squire-rte"
import {defer} from "../../api/common/utils/Utils"
import {px} from "../size"

type SanitizerFn = (html: string, isPaste: boolean) => DocumentFragment

export class Editor {
	_squire: Squire;
	view: Function;
	onbeforeupdate: Function;
	onremove: Function;
	initialized: Object;
	_domElement: HTMLElement;
	_enabled: boolean;
	_active: boolean;
	_minHeight: ?number;
	_sanitizer: SanitizerFn;

	constructor(minHeight: ?number, sanitizer: SanitizerFn) {
		this._enabled = true
		this._active = false
		this._minHeight = minHeight
		this._sanitizer = sanitizer
		this.initialized = defer()
		this.onbeforeupdate = () => !(this._squire != null)  // do not update the dom part managed by squire
		this.onremove = () => {
			if (this._squire) this._squire.destroy()
		}

		this.view = () => {
			return m("", m(".hide-outline.selectable", {
				oncreate: vnode => this.initSquire(vnode.dom),
				style: this._minHeight ? {"min-height": px(this._minHeight)} : {},
			}))
		}
	}


	isEmpty(): boolean {
		return !this._squire || this._squire.getHTML() === "<div><br></div>"
	}

	getValue(): string {
		return this.isEmpty() ? "" : this._squire.getHTML()
	}

	addChangeListener(callback: Function) {
		this._squire.addEventListener("input", callback)
	}

	setMinHeight(minHeight: number): Editor {
		this._minHeight = minHeight
		return this
	}

	initSquire(domElement: HTMLElement) {
		let squire = new (SquireEditor: any)(domElement, {sanitizeToDOMFragment: this._sanitizer}).addEventListener('keyup', (e) => {
			if (e.which === 32) {
				let blocks = []
				squire.forEachBlock((block) => {
					blocks.push(block)
				})
				createList(blocks, /^1\.\s$/, true) // create an ordered list if a line is started with '1. '
				createList(blocks, /^\*\s$/, false) // create an ordered list if a line is started with '1. '
			}
		})

		this._squire = squire
		this._domElement = domElement
		// the _editor might have been disabled before the dom element was there
		this.setEnabled(this._enabled)
		this.initialized.resolve()

		function createList(blocks: HTMLElement[], regex: RegExp, ordered: boolean) {
			if (blocks.length === 1 && blocks[0].textContent.match(regex)) {
				squire.modifyBlocks(function (fragment) {
					if (fragment.firstChild && fragment.firstChild.firstChild) {
						let textNode = fragment.firstChild.firstChild
						if (textNode.nodeType === Node.TEXT_NODE) {
							textNode.textContent = textNode.textContent.replace(regex, '')
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
		this._enabled = enabled
		if (this._domElement) {
			this._domElement.setAttribute("contenteditable", String(enabled))
		}
	}

	setHTML(html: ?string) {
		this._squire.setHTML(html)
	}

	getHTML(): string {
		return this._squire.getHTML()
	}

	focus() {
		this._squire.focus()
	}

	isAttached() {
		return this._squire != null
	}
}
