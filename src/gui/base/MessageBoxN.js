// @flow
import m from "mithril"
import {lang} from "../../misc/LanguageViewModel"
import {assertMainOrNode} from "../../api/Env"
import {px} from "../size"
import type {TranslationKey} from "../../misc/LanguageViewModel"

assertMainOrNode()

export type MessageBoxAttrs = {|
	label: TranslationKey | lazy<string>,
	bgClass?: string,
	marginTop?: number,
	visible?: Stream<boolean>
|}

/**
 * A message box displaying a text. A message box can be displayed on the background of a column if the column is empty.
 */
class _MessageBoxN {
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
			m(".dialog-width-s.pt.pb.plr.mlr", {
				class: a.bgClass ? a.bgClass : "content-message-bg",
				style: {'margin-top': px(a.marginTop ? a.marginTop : 100), 'white-space': 'pre-wrap', 'text-align': 'center'}
			}, lang.getMaybeLazy(a.label))
		])
	}
}

export const MessageBoxN: Class<MComponent<MessageBoxAttrs>> = _MessageBoxN
