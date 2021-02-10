// @flow
import m from 'mithril'
import {logins} from '../api/main/LoginController.js'
import {displayOverlay} from './base/Overlay'
import {px, size} from "./size"
import {Icons} from "./base/icons/Icons"
import {assertMainOrNode} from "../api/common/Env"
import {Request} from "../api/common/WorkerProtocol.js"
import {lang} from "../misc/LanguageViewModel"
import {transform} from "./animation/Animations"
import {nativeApp} from "../native/common/NativeWrapper.js"
import {ButtonN, ButtonType} from "./base/ButtonN"
import {Keys} from "../api/common/TutanotaConstants"

assertMainOrNode()

/**
 * search bar for the Ctrl+F in-page search of the Desktop client
 * gets loaded asynchronously, shouldn't be in the web bundle
 */
export class SearchInPageOverlay {
	_closeFunction: (() => void) | null;
	_domInput: HTMLInputElement;
	_matchCase: boolean = false;
	_numberOfMatches: number = 0;
	_currentMatch: number = 0;
	_skipNextBlur: boolean = false;

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
			} else { //already open, refocus
				console.log("refocusing")
				this._domInput.focus()
				this._domInput.select()
			}
			m.redraw()
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

	_getRect(): {|
		bottom?: ?string,
		height?: ?string,
		left?: ?string,
		right?: ?string,
		top?: ?string,
		width?: ?string,
	|} {
		return {
			height: px(size.navbar_height_mobile),
			bottom: px(0),
			right: px(0),
			left: px(0)
		}
	}

	_inputField: (() => Children) = () => {
		return m("input#search-overlay-input.dropdown-bar.elevated-bg.pl-l.button-height.inputWrapper", {
				placeholder: lang.get("searchPage_action"),
				oncreate: (vnode) => {
					this._domInput = vnode.dom
					this._domInput.focus()
				},
				onblur: e => {
					if (this._skipNextBlur) {
						this._skipNextBlur = false
						this._domInput.focus()
					} else {
						nativeApp.invokeNative(new Request("setSearchOverlayState", [false, false]))
					}
				},
				onfocus: e => nativeApp.invokeNative(new Request("setSearchOverlayState", [true, false])),
				oninput: e => this._find(true, true),
				style: {
					width: px(250),
					top: 0,
					height: px(size.button_height),
					left: 0,
				},
			},
			""
		)
	}

	_find: ((forward: boolean, findNext: boolean) => Promise<void>) = (forward, findNext) => {
		this._skipNextBlur = true
		return nativeApp.invokeNative(new Request("findInPage", [
			this._domInput.value, {
				forward,
				matchCase: this._matchCase,
				findNext,
			}
		])).then(r => this.applyNextResult(r.activeMatchOrdinal, r.matches))
	}

	applyNextResult(activeMatchOrdinal: number, matches: number): void {
		if (matches === 1) {
			/* the search bar loses focus without any events when there
			*  are no results except for the search bar itself. this enables
			*  us to retain focus. */
			this._domInput.blur()
			this._domInput.focus()
		}
		this._numberOfMatches = matches - 1
		this._currentMatch = activeMatchOrdinal - 1
		m.redraw()
	}

	/*
	* we're catching enter key events on the main thread while the search overlay is open to enable
	* next-result-via-enter behaviour.
	*
	* since losing focus on the overlay via issuing a search request seems to be indistinguishable
	* from losing it via click/tab we need to check if anything else was clicked and tell the main thread to
	* not search the next result for enter key events (otherwise we couldn't type newlines while the overlay is open)
	*/
	handleMouseUp(e: Event) {
		if (!(e.target instanceof Element && e.target.id === "search-overlay-input")) return
		nativeApp.invokeNative(new Request('setSearchOverlayState', [false, true]))
	}

	_getComponent(): VirtualElement {
		let caseButtonAttrs = {
			label: "matchCase_alt",
			icon: () => Icons.MatchCase,
			type: ButtonType.Action,
			noBubble: true,
			isSelected: () => this._matchCase,
			click: () => {
				this._matchCase = !this._matchCase
				this._find(true, false)
			},
		}

		let forwardButtonAttrs = {
			label: "next_action",
			icon: () => Icons.ArrowForward,
			type: ButtonType.Action,
			noBubble: true,
			click: () => this._find(true, true),
		}

		let backwardButtonAttrs = {
			label: "previous_action",
			icon: () => Icons.ArrowBackward,
			type: ButtonType.Action,
			noBubble: true,
			click: () => this._find(false, true),
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
					{
						oncreate: () => window.addEventListener('mouseup', this.handleMouseUp),
						onremove: () => window.removeEventListener('mouseup', this.handleMouseUp)
					},
					[
						m(".flex-start.center-vertically",
							{
								onkeydown: e => {
									let keyCode = e.which
									if (keyCode === Keys.ESC.code) {
										this.close()
									}
									// prevent key from getting picked up by shortcuts etc.
									e.stopPropagation()
									return true
								},
							},
							[
								this._inputField(),
								m(ButtonN, backwardButtonAttrs),
								m(ButtonN, forwardButtonAttrs),
								m(ButtonN, caseButtonAttrs),
								m("div.pl-m", this._numberOfMatches > 0
									? `${this._currentMatch}/${this._numberOfMatches}`
									: lang.get("searchNoResults_msg")
								)
							]),
						m(ButtonN, closeButtonAttrs)
					])
			}

		}
	}
}

export const searchInPageOverlay: SearchInPageOverlay = new SearchInPageOverlay()
