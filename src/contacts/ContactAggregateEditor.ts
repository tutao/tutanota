import type {TextFieldType} from "../gui/base/TextFieldN"
import {TextFieldN} from "../gui/base/TextFieldN"
import type {TranslationKey} from "../misc/LanguageViewModel"
import {lang} from "../misc/LanguageViewModel"
import m, {Children, Component, Vnode, VnodeDOM} from "mithril"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import {Icons} from "../gui/base/icons/Icons"
import {animations, height, opacity} from "../gui/animation/Animations"
import {attachDropdown} from "../gui/base/DropdownN"
import Stream from "mithril/stream";

export type AggregateEditorAttrs<AggregateType> = {
	value: string
	cancelAction: () => unknown
	key: string
	animateCreate?: boolean
	animateCancel?: boolean
	allowCancel?: boolean
	fieldType: TextFieldType
	onUpdate: (newValue: string) => unknown
	label: string
	helpLabel: TranslationKey
	typeLabels: ReadonlyArray<[AggregateType, TranslationKey]>
	onTypeSelected: (arg0: AggregateType) => unknown
}

export class ContactAggregateEditor implements Component<AggregateEditorAttrs<any>> {
	oncreate(vnode: VnodeDOM<AggregateEditorAttrs<any>>) {
		const animate = typeof vnode.attrs.animateCreate === "boolean" ? vnode.attrs.animateCreate : true
		if (animate) this.animate(vnode.dom as HTMLElement, true)
	}

	async onbeforeremove(vnode: VnodeDOM<AggregateEditorAttrs<any>>): Promise<void> {
		await this.animate(vnode.dom as HTMLElement, false)
	}

	view(vnode: Vnode<AggregateEditorAttrs<any>>): Children {
		const attrs = vnode.attrs
		return m(
			".wrapper.child-grow",
			m(TextFieldN, {
				value: attrs.value,
				label: () => attrs.label,
				type: attrs.fieldType,
				helpLabel: () => lang.get(attrs.helpLabel),
				injectionsRight: () => {
					return [this._moreButtonFor(attrs), this._cancelButtonFor(attrs)]
				},
				oninput: value => attrs.onUpdate(value),
			}),
		)
	}

	_doesAllowCancel(attrs: AggregateEditorAttrs<any>): boolean {
		return typeof attrs.allowCancel === "boolean" ? attrs.allowCancel : true
	}

	_cancelButtonFor(attrs: AggregateEditorAttrs<any>): Children {
		if (!this._doesAllowCancel(attrs)) return null
		return m(ButtonN, {
			label: "cancel_action",
			click: () => attrs.cancelAction(),
			icon: () => Icons.Cancel,
		})
	}

	_moreButtonFor(attrs: AggregateEditorAttrs<any>): Children {
		const moreButtonAttrs = attachDropdown({
			mainButtonAttrs: {
				label: "more_label",
				icon: () => Icons.More,
			},
			childAttrs: () =>
				attrs.typeLabels.map(([key, value]) => {
					return {
						label: value,
						click: () => attrs.onTypeSelected(key),
						type: ButtonType.Dropdown,
					}
				})
		})
		return m(ButtonN, moreButtonAttrs)
	}

	animate(domElement: HTMLElement, fadein: boolean): Promise<any> {
		let childHeight = domElement.offsetHeight

		if (fadein) {
			domElement.style.opacity = "0"
		}

		const opacityP = animations.add(
			domElement, fadein
				? opacity(0, 1, true)
				: opacity(1, 0, true)
		)
		const heightP = animations.add(domElement, fadein ? height(0, childHeight) : height(childHeight, 0))
		heightP.then(() => {
			domElement.style.height = ""
		})
		return Promise.all([opacityP, heightP])
	}
}