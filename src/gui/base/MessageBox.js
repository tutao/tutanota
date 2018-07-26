// @flow
import m from "mithril"
import {lang} from "../../misc/LanguageViewModel"
import {assertMainOrNode} from "../../api/Env"
import {px} from "../size"

assertMainOrNode()

/**
 * A message box displaying a text. A message box can be displayed on the background of a column if the column is empty.
 */
export default class MessageBox {
	view: Function;
	_messageNode: HTMLElement;
	_visible: boolean;

	constructor(messageIdOrMessageFunction: string | lazy<string>, bgClass: string = "content-message-bg", marginTop: number = 100) {
		this._visible = true

		this.view = (): VirtualElement => {
			return m("#error-dialog.justify-center.items-start", {
				oncreate: (vnode) => this._messageNode = vnode.dom,
				style: {display: (this._visible) ? 'flex' : 'none'}
			}, [
				m(".dialog-width-s.pt.pb.plr.mlr", {
					class: bgClass,
					style: {'margin-top': px(marginTop), 'white-space': 'pre-wrap', 'text-align': 'center'}
				}, (messageIdOrMessageFunction instanceof Function) ?
					messageIdOrMessageFunction() : lang.get(messageIdOrMessageFunction))
			])
		}
	}

	setVisible(visible: boolean) {
		if (this._visible !== visible) {
			this._visible = visible
			if (this._messageNode) {
				// the message box is used in the List, so we do not get redraw() calls and have to set the style display manually
				this._messageNode.style.display = (visible) ? 'flex' : 'none'
			}
		}
		return this
	}
}