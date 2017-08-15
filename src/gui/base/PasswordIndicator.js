// @flow
import m from "mithril"
import {assertMainOrNode} from "../../api/Env"

assertMainOrNode()

export class PasswordIndicator {
	view: Function;

	constructor(strength: lazy<number>) {

		this.view = () => m(".password-indicator-border.mt-s", {style: {width: '100px', height: '10px'}},
			m(".password-indicator-bg", {style: {width: strength() + '%', height: '100%'}})
		)
	}

}