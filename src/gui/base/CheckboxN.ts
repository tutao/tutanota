import m, {Children, Component, Vnode} from "mithril"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import {BootIcons} from "./icons/BootIcons"
import {Icon} from "./Icon"
import {addFlash, removeFlash} from "./Flash"
import type {TranslationKey} from "../../misc/LanguageViewModel"
import {lang} from "../../misc/LanguageViewModel"
import type {lazy} from "@tutao/tutanota-utils"

export type CheckboxAttrs = {
	label: lazy<string | Children>
	checked: Stream<boolean>
	helpLabel?: TranslationKey | lazy<string>
	disabled?: boolean
}

export class CheckboxN implements Component<CheckboxAttrs> {
	private readonly focused: Stream<boolean>
	private _domInput: HTMLElement | null = null
	private _domIcon: HTMLElement | null = null

	constructor() {
		this.focused = stream<boolean>(false)
	}

	view(vnode: Vnode<CheckboxAttrs>): Children {
		const a = vnode.attrs
		const helpLabel = a.helpLabel ? m("small.block.content-fg", lang.getMaybeLazy(a.helpLabel)) : []
		return m(
			".checkbox.click.pt",
			{
				onclick: (e: MouseEvent) => {
					if (e.target !== this._domInput) {
						this.toggle(e, a) // event is bubbling in IE besides we invoke e.stopPropagation()
					}
				},
			},
			[
				m(
					".wrapper.flex.items-center",
					{
						oncreate: vnode => addFlash(vnode.dom),
						onremove: vnode => removeFlash(vnode.dom),
					},
					[
						// the real checkbox is transparent and only used to allow keyboard focusing and selection
						m("input[type=checkbox]", {
							oncreate: vnode => (this._domInput = vnode.dom as HTMLElement),
							onchange: (e: Event) => this.toggle(e, a),
							checked: a.checked(),
							onfocus: () => this.focused(true),
							onblur: () => this.focused(false),
							onremove: e => {
								// workaround for chrome error on login with return shortcut "Error: Failed to execute 'removeChild' on 'Node': The node to be removed is no longer a child of this node. Perhaps it was moved in a 'blur' event handler?"
								// TODO test if still needed with mithril 1.1.1
								if (this._domInput) this._domInput.onblur = null
							},
							style: {
								opacity: 0,
								position: "absolute",
								cursor: "pointer",
								z_index: -1,
							},
						}),
						m(Icon, {
							icon: a.checked() ? BootIcons.CheckboxSelected : BootIcons.Checkbox,
							class: this.focused() ? "svg-content-accent-fg" : "svg-content-fg",
							oncreate: vnode => (this._domIcon = vnode.dom as HTMLElement),
						}),
						m(
							".pl",
							{
								class: this.focused() ? "content-accent-fg" : "content-fg",
								onclick: (e: MouseEvent) => {
									// if the label contains a link, then stop the event so that the checkbox doesnt get toggled upon clicking
									// we still allow it to be checked if they click on the non-link part of the label
									if (e.target instanceof HTMLElement && e.target.tagName.toUpperCase() === "A") {
										e.stopPropagation()
									}
								},
							},
							a.label(),
						),
					],
				),
				helpLabel,
			],
		)
	}

	toggle(event: Event, attrs: CheckboxAttrs) {
		if (!attrs.disabled) {
			attrs.checked(!attrs.checked())
		}

		event.stopPropagation()

		if (this._domInput) {
			this._domInput.focus()
		}
	}
}