// @flow
import m from "mithril"
import {size, px} from "../size"
import {inputLineHeight} from "./TextFieldN"
import {lang} from "../../misc/LanguageViewModel"

export type LabelAttrs = {
	label: string | lazy<string>,
}

class _LabelN {
	view(vnode: Vnode<LabelAttrs>) {
		return m(".rel.pt", [
			m("label.abs.text-ellipsis.noselect.backface_fix.z1.i.pr-s.small", vnode.attrs.label
			instanceof Function ? vnode.attrs.label() : lang.get(vnode.attrs.label)),
			m(".flex.flex-column.flex-end", {
				style: {'min-height': px(size.button_height + 2)}
			}, [
				m(".mt-form", {
					style: {
						lineHeight: px(inputLineHeight),
						'padding-bottom': "2px"
					}
				}, vnode.children)
			]),

		])
	}
}

export const LabelN: Class<MComponent<LabelAttrs>> = _LabelN