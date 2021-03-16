// @flow
import type {TextFieldTypeEnum} from "../gui/base/TextFieldN";
import {TextFieldN} from "../gui/base/TextFieldN";
import type {TranslationKey} from "../misc/LanguageViewModel";
import {lang} from "../misc/LanguageViewModel";
import m from "mithril";
import {ButtonN, ButtonType} from "../gui/base/ButtonN";
import {Icons} from "../gui/base/icons/Icons";
import type {AnimationPromise} from "../gui/animation/Animations";
import {animations, height, opacity} from "../gui/animation/Animations";
import {attachDropdown} from "../gui/base/DropdownN";


export type AggregateEditorAttrs<AggregateTypeEnum> = {
	value: Stream<string>,
	cancelAction: () => mixed,
	key: string,
	animateCreate?: boolean,
	animateCancel?: boolean,
	allowCancel?: boolean,
	fieldType: TextFieldTypeEnum,
	onUpdate: (newValue: string) => mixed,
	label: string,
	helpLabel: TranslationKey,
	typeLabels: $ReadOnlyArray<[AggregateTypeEnum, TranslationKey]>,
	onTypeSelected: (AggregateTypeEnum) => mixed,
}

export class ContactAggregateEditor implements MComponent<AggregateEditorAttrs<*>> {
	oncreate(vnode: Vnode<AggregateEditorAttrs<*>>) {
		const animate = typeof vnode.attrs.animateCreate === "boolean" ? vnode.attrs.animateCreate : true
		if (animate) this.animate(vnode.dom, true)
	}

	onbeforeremove(vnode: Vnode<AggregateEditorAttrs<*>>): Promise<*> {
		return this.animate(vnode.dom, false)
	}

	view(vnode: Vnode<AggregateEditorAttrs<*>>): Children {
		const attrs = vnode.attrs

		return m(".wrapper.child-grow", m(TextFieldN, {
			value: attrs.value,
			label: () => attrs.label,
			type: attrs.fieldType,
			helpLabel: () => lang.get(attrs.helpLabel),
			injectionsRight: () => {
				return [
					this._moreButtonFor(attrs),
					this._cancelButtonFor(attrs)
				]
			},
			oninput: (value) => attrs.onUpdate(value)
		}))
	}

	_doesAllowCancel(attrs: AggregateEditorAttrs<*>): boolean {
		return typeof attrs.allowCancel === "boolean" ? attrs.allowCancel : true
	}

	_cancelButtonFor(attrs: AggregateEditorAttrs<*>): Children {
		if (!this._doesAllowCancel(attrs)) return null

		return m(ButtonN, {
			label: "cancel_action",
			click: () => attrs.cancelAction(),
			icon: () => Icons.Cancel,
		})
	}

	_moreButtonFor(attrs: AggregateEditorAttrs<*>): Children {
		const moreButtonAttrs = attachDropdown({
				label: "more_label",
				icon: () => Icons.More,
			},
			() => attrs.typeLabels
			           .map(([key, value]) => {
				           return {
					           label: value,
					           click: () => attrs.onTypeSelected(key),
					           type: ButtonType.Dropdown,
				           }
			           }))
		return m(ButtonN, moreButtonAttrs)
	}

	animate(domElement: HTMLElement, fadein: boolean): Promise<Array<AnimationPromise>> {
		let childHeight = domElement.offsetHeight
		if (fadein) {
			domElement.style.opacity = "0"
		}

		return Promise.all([
			animations.add(domElement, fadein ? opacity(0, 1, true) : opacity(1, 0, true)),
			animations.add(domElement, fadein ? height(0, childHeight) : height(childHeight, 0)).tap(() => {
				domElement.style.height = ''
			})
		])
	}
}