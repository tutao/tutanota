// @flow
import m from "mithril"
import {Button} from "./Button"
import {assertMainOrNode} from "../../api/Env"

assertMainOrNode()

/**
 * An action bar is a bar that contains buttons (either on the left or on the right).
 */
export class ActionBar {
	_buttons: Button[];
	view: Function;

	constructor() {
		this._buttons = []

		this.view = (): VirtualElement => {
			return m(".action-bar.flex-end.items-center", this._buttons.filter(b => b.isVisible()).map(b => m(b)))
		}
	}

	add(button: Button): ActionBar {
		this._buttons.push(button)
		return this
	}
}