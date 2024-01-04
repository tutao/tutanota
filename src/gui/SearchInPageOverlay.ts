import m, { Children, Component } from "mithril"
import type { PositionRect } from "./base/Overlay"
import { displayOverlay } from "./base/Overlay"
import { px, size } from "./size"
import { Icons } from "./base/icons/Icons"
import { assertMainOrNode } from "../api/common/Env"
import { lang } from "../misc/LanguageViewModel"
import { transform, TransformEnum } from "./animation/Animations"
import { Keys } from "../api/common/TutanotaConstants"
import { locator } from "../api/main/MainLocator"
import { ElectronResult } from "../native/common/generatedipc/ElectronResult.js"
import { isKeyPressed } from "../misc/KeyManager.js"
import { IconButton } from "./base/IconButton.js"
import { ToggleButton } from "./base/buttons/ToggleButton.js"

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
									if (isKeyPressed(e.key, Keys.ESC)) {
										this.close()
									}

									// prevent key from getting picked up by shortcuts etc.
									e.stopPropagation()
									return true
								},
							},
							[
								this._inputField(),
								m(IconButton, {
									title: "previous_action",
									icon: Icons.ArrowBackward,
									click: () => this._find(false, true),
								}),
								m(IconButton, {
									title: "next_action",
									icon: Icons.ArrowForward,
									click: () => this._find(true, true),
								}),
								m(ToggleButton, {
									title: "matchCase_alt",
									icon: Icons.MatchCase,
									toggled: this._matchCase,
									onToggled: () => {
										this._matchCase = !this._matchCase

										this._find(true, false)
									},
								}),
								m("div.pl-m", this._numberOfMatches > 0 ? `${this._currentMatch}/${this._numberOfMatches}` : lang.get("searchNoResults_msg")),
							],
						),
						m(IconButton, {
							title: "close_alt",
							icon: Icons.Cancel,
							click: () => this.close(),
						}),
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
