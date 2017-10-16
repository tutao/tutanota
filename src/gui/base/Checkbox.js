// @flow
import m from "mithril"
import stream from "mithril/stream/stream.js"
import {lang} from "../../misc/LanguageViewModel"
import {removeFlash, addFlash} from "./Flash"
import {assertMainOrNodeBoot} from "../../api/Env"
import {Icon} from "./Icon"
import {BootIcons} from "./icons/BootIcons"

assertMainOrNodeBoot()

const FALSE_CLOSURE = () => {
	return false
}

export class Checkbox {
	getLabel: lazy<string>;
	helpLabel: ?lazy<String>;
	checked: stream<boolean>;
	focused: stream<boolean>;
	_domInput: HTMLElement;
	view: Function;

	constructor(labelTextIdOrTextFunction: string|lazy<string>, helpLabel: lazy<String>) {
		this.getLabel = labelTextIdOrTextFunction instanceof Function ? labelTextIdOrTextFunction : lang.get.bind(lang, labelTextIdOrTextFunction)
		this.helpLabel = helpLabel
		this.checked = stream(false)
		this.focused = stream(false)


		this.view = (): VirtualElement => {
			return m(".checkbox.click.pt", {
				onclick: (e: MouseEvent) => {
					if (e.target !== this._domInput) {
						this.toggle(e) // event is bubbling in IE besides we invoke e.stopPropagation()
					}
				},
			}, [
				m(".wrapper.flex.items-center", {
					oncreate: (vnode) => addFlash(vnode.dom),
					onbeforeremove: (vnode) => removeFlash(vnode.dom),
				}, [
					// the real checkbox is transparent and only used to allow keyboard focusing and selection
					m("input[type=checkbox]", {
						oncreate: (vnode) => this._domInput = vnode.dom,
						onchange: (e) => this.toggle(e),
						checked: this.checked(),
						onfocus: () => this.focused(true),
						onblur: () => this.focused(false),
						onremove: e => {
							// workaround for chrome error on login with return shortcut "Error: Failed to execute 'removeChild' on 'Node': The node to be removed is no longer a child of this node. Perhaps it was moved in a 'blur' event handler?"
							// TODO test if still needed with mithril 1.1.1
							this._domInput.onblur = null
						},
						style: {
							opacity: 0,
							position: 'absolute',
							cursor: 'pointer',
							z_index: -1
						}
					}),
					m(Icon, {
						icon: this.checked() ? BootIcons.CheckboxSelected : BootIcons.Checkbox,
						class: this.focused() ? "svg-content-accent-fg" : "svg-content-fg",
						onclick: (e) => this.toggle(e),
					}),
					m(".pl", {
						class: this.focused() ? "content-accent-fg" : "content-fg",
					}, this.getLabel()),
				]),
				this.helpLabel ? m("small.block.content-fg", this.helpLabel()) : [],
			])
		}
	}

	toggle(event: MouseEvent) {
		this.checked(!this.checked())
		event.stopPropagation()
		if (this._domInput) {
			this._domInput.focus()
		}
	}
}