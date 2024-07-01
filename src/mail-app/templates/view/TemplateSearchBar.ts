import m, { Children, ClassComponent, Component, Vnode } from "mithril"
import type { TranslationKey } from "../../../common/misc/LanguageViewModel"
import { lang } from "../../../common/misc/LanguageViewModel"
import { inputLineHeight, px } from "../../../common/gui/size"
import { keyboardEventToKeyPress, keyHandler } from "../../../common/misc/KeyManager"
import { theme } from "../../../common/gui/theme"
import type { lazy } from "@tutao/tutanota-utils"
import Stream from "mithril/stream"
import { assertNotNull } from "@tutao/tutanota-utils"

export type TemplateSearchBarAttrs = {
	value: Stream<string>
	placeholder?: TranslationKey | lazy<string>
	oninput?: (value: string, input: HTMLInputElement) => unknown
	keyHandler?: keyHandler
}

export class TemplateSearchBar implements ClassComponent<TemplateSearchBarAttrs> {
	domInput: HTMLInputElement | null = null

	view(vnode: Vnode<TemplateSearchBarAttrs>): Children {
		const a = vnode.attrs
		return m(
			".inputWrapper.pt-xs.pb-xs",
			{
				style: {
					"border-bottom": `1px solid ${theme.content_border}`,
				},
			},
			this._getInputField(a),
		)
	}

	_getInputField(a: TemplateSearchBarAttrs): Children {
		return m("input.input", {
			placeholder: a.placeholder && lang.getMaybeLazy(a.placeholder),
			oncreate: (vnode) => {
				this.domInput = vnode.dom as HTMLInputElement
				this.domInput.value = a.value()
				this.domInput.focus()
			},
			onkeydown: (e: KeyboardEvent) => {
				const key = keyboardEventToKeyPress(e)
				return a.keyHandler != null ? a.keyHandler(key) : true
			},
			oninput: () => {
				const domInput = assertNotNull(this.domInput)
				a.value(domInput.value)
				a.oninput && a.oninput(domInput.value, domInput)
			},
			style: {
				lineHeight: px(inputLineHeight),
			},
		})
	}
}
