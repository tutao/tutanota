// @flow
import m from "mithril"
import type {ButtonAttrs} from "./ButtonN"
import {ButtonN} from "./ButtonN"


/**
 * An action bar is a bar that contains buttons (either on the left or on the right).
 */
export class DialogHeaderBarN {
	buttonId: number;
	right: ButtonAttrs[];
	middle: ?lazy<string>;
	left: ButtonAttrs[];
	view: Function;
	domButtonBar: ?HTMLElement;

	constructor() {
		this.buttonId = 0
		this.left = []
		this.middle = null
		this.right = []

		this.view = (): VirtualElement => {
			let columnClass = this.middle ? ".flex-third.overflow-hidden" : ".flex-half.overflow-hidden"
			return m(".flex-space-between.dialog-header-line-height", {
				oncreate: (vnode) => this._setDomButtonBar(vnode.dom)
			}, [
				m(columnClass + ".ml-negative-s", this.left.map(a => m(ButtonN, a))),
				// ellipsis is not working if the text is directly in the flex element, so create a child div for it
				this.middle ? m(".flex-third-middle.overflow-hidden.flex.justify-center.items-center.b", [m(".text-ellipsis", this.middle())]) : null,
				m(columnClass + ".mr-negative-s.flex.justify-end", this.right.map(a => m(ButtonN, a)))
			])
		}
	}


	addLeft(buttonAttrs: ButtonAttrs): DialogHeaderBarN {
		this.left.push(buttonAttrs)
		return this
	}

	addRight(buttonAttrs: ButtonAttrs): DialogHeaderBarN {
		this.right.push(buttonAttrs)
		return this
	}

	setMiddle(middle: lazy<string>): DialogHeaderBarN {
		this.middle = middle
		return this
	}

	_setDomButtonBar(domElement: HTMLElement) {
		this.domButtonBar = domElement
	}

}