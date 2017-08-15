// @flow
import m from "mithril"
import SquireEditor from "squire-rte"
import {defer} from "../../api/common/utils/Utils"
import {px} from "../size"
import {lang} from "../../misc/LanguageViewModel"

export class Editor {
	squire: Squire;
	view: Function;
	onbeforeupdate: Function;
	onremove: Function;
	initialized: Object;
	_domElement: HTMLElement;
	_placeholderDomElement: HTMLElement;
	_enabled: boolean;
	_active: boolean;
	_showBorders: boolean;
	_minHeight: ?number;
	_placeholderId: ?string;

	constructor(showBorders: boolean, minHeight?: number, placeholderId?: string) {
		this._placeholderId = placeholderId
		this._enabled = true
		this._active = false
		this._showBorders = showBorders
		this._minHeight = minHeight
		this.initialized = defer()
		this.onbeforeupdate = () => !(this.squire != null)  // do not update the dom part managed by squire
		this.onremove = () => {
			if (this.squire) this.squire.destroy()
		}

		let focus = () => {
			this._domElement.focus()
			if (this._showBorders) {
				this._domElement.classList.add("editor-border-active")
				this._domElement.classList.remove("editor-border")
			}
			if (this._placeholderDomElement) {
				this._placeholderDomElement.style.display = "none"
			}
		}

		let blur = () => {
			if (this._placeholderDomElement && this.isEmpty()) {
				this._placeholderDomElement.style.display = "initial"
			}
			if (this._showBorders) {
				this._domElement.classList.remove("editor-border-active")
				this._domElement.classList.add("editor-border")
			}
		}

		this.view = () => {
			return m("", [this._getPlaceholder(), m(".hide-outline" + (this._showBorders ? ".editor-border" : ""), {
				oncreate: vnode => this.initSquire(vnode.dom),
				style: this._minHeight ? {"min-height": px(this._minHeight)} : {},
				onfocus: (e) => focus(),
				onblur: (e) => blur()
			})])
		}
	}

	_getPlaceholder(): ?VirtualElement {
		return m(".abs.text-ellipsis.noselect.backface_fix.z1.i.pr-s" + (this._showBorders ? ".pl.pt-s" : ""), {
			oncreate: vnode => this._placeholderDomElement = vnode.dom
		}, (this._placeholderId ? lang.get(this._placeholderId) : ""))
	}

	isEmpty(): boolean {
		return !this.squire || this.squire.getHTML() == "<div><br></div>"
	}


	initSquire(domElement: HTMLElement) {
		let squire = new (SquireEditor:any)(domElement, {}).addEventListener('keyup', (e) => {
			if (e.which === 32) {
				let blocks = []
				squire.forEachBlock((block) => {
					blocks.push(block)
				})
				createList(blocks, /^1\.\s$/, true) // create an ordered list if a line is started with '1. '
				createList(blocks, /^\*\s$/, false) // create an ordered list if a line is started with '1. '
			}

		})
		this.squire = squire
		this._domElement = domElement
		// the editor might have been disabled before the dom element was there
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
}
