import m, { Children, ClassComponent, Vnode } from "mithril"
import type { MaybeTranslation } from "../../../../ui/utils/LanguageViewModel"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import { font_size, px } from "../../../../ui/size"
import { keyboardEventToKeyPress, keyHandler } from "../../../../ui/utils/KeyManager"
import { theme } from "../../../../ui/theme"
import { assertNotNull } from "../../../../platform-kits/utils"
import Stream from "mithril/stream"

export type TemplateSearchBarAttrs = {
	value: Stream<string>
	placeholder?: MaybeTranslation
	oninput?: (value: string, input: HTMLInputElement) => unknown
	keyHandler?: keyHandler
}

export class TemplateSearchBar implements ClassComponent<TemplateSearchBarAttrs> {
	domInput: HTMLInputElement | null = null

	view(vnode: Vnode<TemplateSearchBarAttrs>): Children {
		const a = vnode.attrs
		return m(
			".inputWrapper.pt-4.pb-4",
			{
				style: {
					"border-bottom": `1px solid ${theme.outline}`,
				},
			},
			this._getInputField(a),
		)
	}

	_getInputField(a: TemplateSearchBarAttrs): Children {
		return m("input.input", {
			placeholder: a.placeholder && lang.getTranslationText(a.placeholder),
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
				a.oninput?.(domInput.value, domInput)
			},
			style: {
				lineHeight: px(font_size.line_height_input),
			},
		})
	}
}
