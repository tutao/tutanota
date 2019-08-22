//@flow
import m from "mithril"
import stream from "mithril/stream/stream.js"
import {BootIcons} from "./icons/BootIcons"
import {Icon} from "./Icon"
import {addFlash, removeFlash} from "./Flash"

export type CheckboxAttrs = {
	label: lazy<string | VirtualElement>,
	checked: Stream<boolean>,
	helpLabel?: lazy<string>,
	disabled?: boolean,
}

export class _Checkbox {
	focused: Stream<boolean>;
	_domInput: HTMLElement;
	_domIcon: ?HTMLElement;

	constructor() {
		this.focused = stream(false)
	}

	view(vnode: Vnode<CheckboxAttrs>): Children {
		const a = vnode.attrs
		return m(".checkbox.click", {
			onclick: (e: MouseEvent) => {
				if (e.target !== this._domInput) {
					this.toggle(e, a) // event is bubbling in IE besides we invoke e.stopPropagation()
				}
			},
		}, [
			m(".wrapper.flex.items-center", {
				oncreate: (vnode) => addFlash(vnode.dom),
				onremove: (vnode) => removeFlash(vnode.dom),
			}, [
				// the real checkbox is transparent and only used to allow keyboard focusing and selection
				m("input[type=checkbox]", {
					oncreate: (vnode) => this._domInput = vnode.dom,
					onchange: (e) => this.toggle(e, a),
					checked: a.checked(),
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
					icon: a.checked() ? BootIcons.CheckboxSelected : BootIcons.Checkbox,
					class: this.focused() ? "svg-content-accent-fg" : "svg-content-fg",
					oncreate: (vnode) => this._domIcon = vnode.dom,
					onclick: (e) => this.toggle(e, a)
				}),
				m(".pl", {
					class: this.focused() ? "content-accent-fg" : "content-fg",
				}, a.label()),
			]),
			a.helpLabel ? m("small.block.content-fg", a.helpLabel()) : [],
		])
	}

	toggle(event: MouseEvent, attrs: CheckboxAttrs) {
		if (!attrs.disabled) {
			attrs.checked(!attrs.checked())
		}
		event.stopPropagation()
		if (this._domInput) {
			this._domInput.focus()
		}
	}
}

export const CheckboxN: Class<MComponent<CheckboxAttrs>> = _Checkbox