// @flow
import m from "mithril"
import {scaleToVisualPasswordStrength} from "../misc/PasswordUtils"
import type {lazy} from "@tutao/tutanota-utils"

export class PasswordIndicator {
	view: Function;

	constructor(strength: lazy<number>) {
		this.view = () => m(".password-indicator-border.mt-s", {style: {width: '100px', height: '10px'}},
			m(".password-indicator-bg", {style: {width: scaleToVisualPasswordStrength(strength()) + '%', height: '100%'}})
		)
	}

}