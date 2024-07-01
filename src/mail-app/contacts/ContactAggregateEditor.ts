import { TextFieldAttrs, TextFieldType } from "../../common/gui/base/TextField.js"
import { TextField } from "../../common/gui/base/TextField.js"
import { TranslationKey, TranslationText } from "../../common/misc/LanguageViewModel"
import { lang } from "../../common/misc/LanguageViewModel"
import m, { Children, Component, Vnode, VnodeDOM } from "mithril"
import { Icons } from "../../common/gui/base/icons/Icons"
import { animations, height, opacity } from "../../common/gui/animation/Animations"
import { attachDropdown } from "../../common/gui/base/Dropdown.js"
import { IconButton } from "../../common/gui/base/IconButton.js"
import { BootIcons } from "../../common/gui/base/icons/BootIcons.js"
import { ButtonSize } from "../../common/gui/base/ButtonSize.js"
import { lazy } from "@tutao/tutanota-utils"
import type { TranslationKeyType } from "../../common/misc/TranslationKey.js"

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
	helpLabel: TranslationText
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
		const helpLabel = () => {
			if (typeof attrs.helpLabel === "function") {
				return attrs.helpLabel()
			}

			return lang.get(attrs.helpLabel)
		}
		return m(".flex.items-center.child-grow", [
			m(TextField, {
				value: attrs.value,
				label: () => attrs.label,
				type: attrs.fieldType,
				helpLabel: () => helpLabel(),
				injectionsRight: () => this._moreButtonFor(attrs),
				oninput: (value) => attrs.onUpdate(value),
			}),
			this._cancelButtonFor(attrs),
		])
	}

	_doesAllowCancel(attrs: AggregateEditorAttrs<any>): boolean {
		return typeof attrs.allowCancel === "boolean" ? attrs.allowCancel : true
	}

	_cancelButtonFor(attrs: AggregateEditorAttrs<unknown>): Children {
		if (this._doesAllowCancel(attrs)) {
			return m(IconButton, {
				title: "remove_action",
				click: () => attrs.cancelAction(),
				icon: Icons.Cancel,
			})
		} else {
			// placeholder so that the text field does not jump around
			return m(".icon-button")
		}
	}

	_moreButtonFor(attrs: AggregateEditorAttrs<any>): Children {
		return m(
			IconButton,
			attachDropdown({
				mainButtonAttrs: {
					title: "more_label",
					icon: BootIcons.Expand,
					size: ButtonSize.Compact,
				},
				childAttrs: () =>
					attrs.typeLabels.map(([key, value]) => {
						return {
							label: value,
							click: () => attrs.onTypeSelected(key),
						}
					}),
			}),
		)
	}

	animate(domElement: HTMLElement, fadein: boolean): Promise<any> {
		let childHeight = domElement.offsetHeight

		if (fadein) {
			domElement.style.opacity = "0"
		}

		const opacityP = animations.add(domElement, fadein ? opacity(0, 1, true) : opacity(1, 0, true))
		const heightP = animations.add(domElement, fadein ? height(0, childHeight) : height(childHeight, 0))
		heightP.then(() => {
			domElement.style.height = ""
		})
		return Promise.all([opacityP, heightP])
	}
}
