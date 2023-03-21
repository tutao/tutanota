import m, { Children, Component } from "mithril"
import type { PositionRect } from "./base/Overlay"
import { displayOverlay } from "./base/Overlay"
import { px, size } from "./size"
import { Icons } from "./base/icons/Icons"
import { assertMainOrNode } from "../api/common/Env"
import { lang } from "../misc/LanguageViewModel"
import { transform, TransformEnum } from "./animation/Animations"
import { Button, ButtonType } from "./base/Button.js"
import { Keys } from "../api/common/TutanotaConstants"
import { locator } from "../api/main/MainLocator"
import { ElectronResult } from "../native/common/generatedipc/ElectronResult.js"

assertMainOrNode()

/**
 * search bar for the Ctrl+F in-page search of the Desktop client
 * gets loaded asynchronously, shouldn't be in the web bundle
 */
export class SearchInPageOverlay {
	private _closeFunction: (() => Promise<void>) | null
	private _domInput!: HTMLInputElement
	private _matchCase: boolean = false
	private _numberOfMatches: number = 0
	private _currentMatch: number = 0
	private _skipNextBlur: boolean = false

	constructor() {
		this._closeFunction = null
	}

	open() {
		if (locator.logins.isUserLoggedIn()) {
			if (!this._closeFunction) {
				this._closeFunction = displayOverlay(
					() => this._getRect(),
					this._getComponent(),
					(dom) => transform(TransformEnum.TranslateY, dom.offsetHeight, 0),
					(dom) => transform(TransformEnum.TranslateY, 0, dom.offsetHeight),
				)
			} else {
				//already open, refocus
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
			locator.searchTextFacade.stopFindInPage()
			this._closeFunction = null
		}

		m.redraw()
	}

	_getRect(): PositionRect {
		return {
			height: px(size.navbar_height_mobile),
			bottom: px(0),
			right: px(0),
			left: px(0),
		}
	}

	_inputField: () => Children = () => {
		return m(
			"input#search-overlay-input.dropdown-bar.elevated-bg.pl-l.button-height.inputWrapper",
			{
				placeholder: lang.get("searchPage_action"),
				oncreate: (vnode) => {
					this._domInput = vnode.dom as HTMLInputElement

					this._domInput.focus()
				},
				onblur: () => {
					if (this._skipNextBlur) {
						this._skipNextBlur = false

						this._domInput.focus()
					} else {
						locator.searchTextFacade.setSearchOverlayState(false, false)
					}
				},
				onfocus: () => locator.searchTextFacade.setSearchOverlayState(true, false),
				oninput: () => this._find(true, true),
				style: {
					width: px(250),
					top: 0,
					height: px(size.button_height),
					left: 0,
				},
			},
			"",
		)
	}
	_find: (forward: boolean, findNext: boolean) => Promise<void> = async (forward, findNext) => {
		this._skipNextBlur = true
		const r = await locator.searchTextFacade.findInPage(this._domInput.value, forward, this._matchCase, findNext)
		this.applyNextResult(r)
	}

	applyNextResult(result: ElectronResult | null): void {
		if (result == null) {
			this._numberOfMatches = 0
			this._currentMatch = 0
		} else {
			const { activeMatchOrdinal, matches } = result

			if (matches === 1) {
				/* the search bar loses focus without any events when there
				 *  are no results except for the search bar itself. this enables
				 *  us to retain focus. */
				this._domInput.blur()

				this._domInput.focus()
			}

			this._numberOfMatches = matches - 1
			this._currentMatch = activeMatchOrdinal - 1
		}

		m.redraw()
	}

	_getComponent(): Component {
		const caseButtonAttrs = {
			label: "matchCase_alt",
			icon: () => Icons.MatchCase,
			type: ButtonType.Action,
			noBubble: true,
			isSelected: () => this._matchCase,
			click: () => {
				this._matchCase = !this._matchCase

				this._find(true, false)
			},
		} as const
		const forwardButtonAttrs = {
			label: "next_action",
			icon: () => Icons.ArrowForward,
			type: ButtonType.Action,
			noBubble: true,
			click: () => this._find(true, true),
		} as const
		const backwardButtonAttrs = {
			label: "previous_action",
			icon: () => Icons.ArrowBackward,
			type: ButtonType.Action,
			noBubble: true,
			click: () => this._find(false, true),
		} as const
		const closeButtonAttrs = {
			label: "close_alt",
			icon: () => Icons.Cancel,
			type: ButtonType.Action,
			click: () => this.close(),
		} as const

		const handleMouseUp = (event: MouseEvent) => this.handleMouseUp(event)

		return {
			view: (_) => {
				return m(
					".flex.flex-space-between",
					{
						oncreate: () => window.addEventListener("mouseup", handleMouseUp),
						onremove: () => window.removeEventListener("mouseup", handleMouseUp),
					},
					[
						m(
							".flex-start.center-vertically",
							{
								onkeydown: (e: KeyboardEvent) => {
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
								m(Button, backwardButtonAttrs),
								m(Button, forwardButtonAttrs),
								m(Button, caseButtonAttrs),
								m("div.pl-m", this._numberOfMatches > 0 ? `${this._currentMatch}/${this._numberOfMatches}` : lang.get("searchNoResults_msg")),
							],
						),
						m(Button, closeButtonAttrs),
					],
				)
			},
		}
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
		if (!(e.target instanceof Element && e.target.id !== "search-overlay-input")) return
		locator.searchTextFacade.setSearchOverlayState(false, true)
	}
}

export const searchInPageOverlay: SearchInPageOverlay = new SearchInPageOverlay()
