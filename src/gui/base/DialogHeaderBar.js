// @flow
import m from "mithril"
import {Button} from "./Button"


/**
 * An action bar is a bar that contains buttons (either on the left or on the right).
 */
export class DialogHeaderBar {
	buttonId: number;
	right: Button[];
	middle: lazy<string>;
	left: Button[];
	view: Function;
	domButtonBar: ?HTMLElement;

	constructor() {
		this.buttonId = 0
		this.left = []
		this.middle = null
		this.right = []

		this.view = (): VirtualElement => {
			let columnClass = this.middle ? ".flex-third.overflow-hidden" : ".flex-half.overflow-hidden"
			return m(".flex-space-between", {
				oncreate: (vnode) => this._setDomButtonBar(vnode.dom)
			}, [
				m(columnClass + ".ml-negative-s", this.left.filter(b => b.isVisible()).map(b => m(b))),
				// ellipsis is not working if the text is directly in the flex element, so create a child div for it
				this.middle ? m(".flex-third-middle.overflow-hidden.flex.justify-center.items-center.b", [m(".text-ellipsis", this.middle())]) : null,
				m(columnClass + ".mr-negative-s.flex.justify-end", this.right.filter(b => b.isVisible()).map(b => m(b)))
			])
		}
	}


	addLeft(button: Button): DialogHeaderBar {
		this.left.push(button)
		return this
	}

	addRight(button: Button): DialogHeaderBar {
		this.right.push(button)
		return this
	}

	setMiddle(middle: lazy<string>): DialogHeaderBar {
		this.middle = middle
		return this
	}

	_setDomButtonBar(domElement: HTMLElement) {
		this.domButtonBar = domElement
	}

}