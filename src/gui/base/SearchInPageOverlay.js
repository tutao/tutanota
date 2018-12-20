// @flow
import m from 'mithril'
import {logins} from '../../api/main/LoginController.js'
import {displayOverlay} from './Overlay'
import {px, size} from "../size"
import {Icons} from "./icons/Icons"
import {Keys} from "../../misc/KeyManager"
import {assertMainOrNode} from "../../api/Env"
import {Request} from "../../api/common/WorkerProtocol.js"
import {lang} from "../../misc/LanguageViewModel"
import {transform} from "../animation/Animations"
import {nativeApp} from "../../native/NativeWrapper.js"
import {ButtonN, ButtonType} from "./ButtonN"

assertMainOrNode()

/**
 * search bar for the Ctrl+F in-page search of the Desktop client
 * gets loaded asynchronously, shouldn't be in the web bundle
 */
export class SearchInPageOverlay {
	_closeFunction: (() => void) | null;
	_domInput: HTMLInputElement;
	_matchCase = false;

	constructor() {
		this._closeFunction = null
	}

	open() {
		if (logins.isUserLoggedIn()) {
			if (!this._closeFunction) {
				this._closeFunction = displayOverlay(
					this._getRect(),
					this._getComponent(),
					(dom) => transform(transform.type.translateY, dom.offsetHeight, 0),
					(dom) => transform(transform.type.translateY, 0, dom.offsetHeight)
				)
			}
			m.redraw()
			this._domInput.focus()
		}
	}

	close() {
		if (this._closeFunction) {
			this._closeFunction()
			nativeApp.invokeNative(new Request("stopFindInPage", []))
			this._closeFunction = null
		}
		m.redraw()
	}

	_getRect() {
		return {
			height: px(size.navbar_height_mobile),
			bottom: px(0),
			right: px(0),
			left: px(0)
		}
	}

	_inputField = (): VirtualElement | null => {
		return m("input.dropdown-bar.pl-l.button-height.inputWrapper", {
				placeholder: lang.get("searchPage_action"),
				oncreate: (vnode) => {
					this._domInput = vnode.dom
				},
				oninput: e => {
					nativeApp.invokeNative(new Request("findInPage", [this._domInput.value, {foward: true, matchCase: this._matchCase}]))
				},
				onchange: e => {
					this._domInput.focus()
				},
				style: {
					width: px(250),
					top: 0,
					height: px(size.button_height),
					left: 0,
				}
			},
			""
		)
	}

	_getComponent(): VirtualElement {

		let caseButtonAttrs = {
			label: "matchCase_alt",
			icon: () => Icons.MatchCase,
			type: ButtonType.Action,
			noBubble: true,
			isSelected: () => this._matchCase,
			click: () => {
				this._matchCase = true
				nativeApp.invokeNative(new Request("findInPage", [this._domInput.value, {forward: true, matchCase: this._matchCase}]))
				this._domInput.focus()
			},
		}

		let forwardButtonAttrs = {
			label: "next_action",
			icon: () => Icons.ArrowForward,
			type: ButtonType.Action,
			noBubble: true,
			click: () => nativeApp.invokeNative(new Request("findInPage", [this._domInput.value, {forward: true, matchCase: this._matchCase}])),
		}

		let backwardButtonAttrs = {
			label: "previous_action",
			icon: () => Icons.ArrowBackward,
			type: ButtonType.Action,
			noBubble: true,
			click: () => nativeApp.invokeNative(new Request("findInPage", [this._domInput.value, {forward: false, matchCase: this._matchCase}])),
		}

		let closeButtonAttrs = {
			label: "close_alt",
			icon: () => Icons.Cancel,
			type: ButtonType.Action,
			click: () => this.close(),
		}

		return {
			view: (vnode: Object) => {
				return m(".flex.flex-space-between",
					[
						m(".flex-start",
							{
								onkeydown: e => {
									let keyCode = e.which
									if (keyCode === Keys.ESC.code) {
										this.close()
									}
									e.stopPropagation()
									return true
								},
							},
							[
								this._inputField(),
								m(ButtonN, backwardButtonAttrs),
								m(ButtonN, forwardButtonAttrs),
								m(ButtonN, caseButtonAttrs)
							]),
						m(ButtonN, closeButtonAttrs)
					])
			}
		}
	}
}

export const searchInPageOverlay = new SearchInPageOverlay()