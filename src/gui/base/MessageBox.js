// @flow
import m from "mithril"
import {lang} from "../../misc/LanguageViewModel"
import {assertMainOrNode} from "../../api/Env"

assertMainOrNode()

/**
 * A message box displaying a text. A message box can be displayed on the background of a column if the column is empty.
 */
export default class MessageBox {
	view: Function;
	_messageNode: HTMLElement;

	constructor(messageIdOrMessageFunction: string|lazy<string>, bgClass: string="content-message-bg") {
		this.view = (): VirtualElement => {
			return m(".fill-absolute.justify-center.justify-center.items-center", {
				oncreate: (vnode) => {
					this._messageNode = vnode.dom
					this._messageNode.style.display = 'flex'
				},
			}, [
				m(".dialog-width-s.pt.pb.plr.mlr", {
					class: bgClass
				}, (messageIdOrMessageFunction instanceof Function) ? messageIdOrMessageFunction() : lang.get(messageIdOrMessageFunction))
			])
		}
	}

	setVisible(visible: boolean) {
		if (this._messageNode) {
			// the message box is used in the List, so we do not get redraw() calls and have to set the style display manually
			this._messageNode.style.display = (visible) ? 'flex' : 'none'
		}
	}
}