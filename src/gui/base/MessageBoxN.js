// @flow
import m from "mithril"
import type {TranslationKey} from "../../misc/LanguageViewModel"
import {lang} from "../../misc/LanguageViewModel"
import {assertMainOrNode} from "../../api/Env"
import {px} from "../size"
import {theme} from "../theme"

assertMainOrNode()

export type MessageBoxAttrs = {|
	label: TranslationKey | lazy<string>,
	marginTop?: number,
	visible?: Stream<boolean>
|}

/**
 * A message box displaying a text. A message box can be displayed on the background of a column if the column is empty.
 */
export class MessageBoxN implements MComponent<MessageBoxAttrs> {
	_messageNode: HTMLElement;

	view(vnode: Vnode<MessageBoxAttrs>) {
		const a = vnode.attrs
		return m("#error-dialog.justify-center.items-start", {
			oncreate: (vnode) => {
				this._messageNode = vnode.dom
				if (vnode.attrs.visible) {
					vnode.attrs.visible.map(show => {
						// the message box is used in the List, so we do not get redraw() calls and have to set the style display manually
						this._messageNode.style.display = (show) ? 'flex' : 'none'
					})
				}
			},
		}, [
			m(".dialog-width-s.pt.pb.plr.border-radius", {
				style: {
					'margin-top': px(a.marginTop ? a.marginTop : 100),
					'white-space': 'pre-wrap',
					'text-align': 'center',
					border: `2px solid ${theme.content_border}`,
				}
			}, lang.getMaybeLazy(a.label))
		])
	}
}
