// @flow
import m from "mithril"
import stream from "mithril/stream/stream.js"
import type {TranslationKey} from "../../misc/LanguageViewModel"
import {lang} from "../../misc/LanguageViewModel"
import {addFlash, removeFlash} from "./Flash"
import {assertMainOrNodeBoot} from "../../api/Env"
import {Icon} from "./Icon"
import {BootIcons} from "./icons/BootIcons"

assertMainOrNodeBoot()


export class Checkbox {
	getChildren: lazy<Children>;
	helpLabel: ?lazy<string>;
	checked: Stream<boolean>;
	focused: Stream<boolean>;
	enabled: boolean;
	_domInput: HTMLElement;
	view: Function;
	_disabledTextId: TranslationKey;


	constructor(lazyChildren: lazy<Children>, helpLabel?: lazy<string>) {
		this.getChildren = lazyChildren
		this.helpLabel = helpLabel
		this.checked = stream(false)
		this.focused = stream(false)
		this.enabled = true
		this._disabledTextId = "emptyString_msg"


		this.view = (): VirtualElement => {
			return m(".checkbox.pt" + (this.enabled ? ".click" : ".click-disabled"), {
				onclick: (e: MouseEvent) => {
					if (e.target !== this._domInput) {
						this.toggle(e) // event is bubbling in IE besides we invoke e.stopPropagation()
					}
				},
			}, [
				m(".wrapper.flex.items-center", {
					oncreate: (vnode) => this.enabled ? addFlash(vnode.dom) : null,
					onremove: (vnode) => removeFlash(vnode.dom),
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
						disabled: !this.enabled,
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
					}, this.getChildren()),
				]),
				this.helpLabel ? m("small.block.content-fg", this.enabled ? this.helpLabel() : lang.get(this._disabledTextId)) : [],
			])
		}
	}

	toggle(event: MouseEvent) {
		if (this.enabled) {
			this.checked(!this.checked())
			m.redraw()
			if (this._domInput) {
				this._domInput.focus()
			}
		}
		event.stopPropagation()
	}

	setDisabled(disabledTextId: TranslationKey) {
		this.enabled = false
		this._disabledTextId = disabledTextId
	}
}