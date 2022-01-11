// @flow
import m from "mithril"
import {AriaLandmarks, landmarkAttrs} from "../AriaUtils"
import type {KeyManager, Shortcut} from "../../misc/KeyManager"
import {getKeyPress, isKeyPressed} from "../../misc/KeyManager"
import {inputLineHeight, px, size} from "../size"
import {styles} from "../styles"
import {theme} from "../theme"
import {Keys, TabIndex} from "../../api/common/TutanotaConstants"
import {lang} from "../../misc/LanguageViewModel"
import {Icon} from "./Icon"
import {BootIcons} from "./icons/BootIcons"
import {DefaultAnimationTime} from "../animation/Animations"
import {Icons} from "./icons/Icons"
import {client} from "../../misc/ClientDetector"
import {BrowserType} from "../../misc/ClientConstants"
import {Type} from "./TextFieldN"
import stream from "mithril/stream/stream.js"
import {assertMainOrNode} from "../../api/common/Env"
import type {SearchHandler} from "./Header"
import {noOp} from "@tutao/tutanota-utils"

assertMainOrNode()
export const SearchBarMode = Object.freeze({
	Collapsable: "0",
	AlwaysExpanded: "1"
})
export type SearchBarModeEnum = $Values<typeof SearchBarMode>

export type SearchBarNAttrs = {
	keyManager: KeyManager,
	mode: SearchBarModeEnum,
	searchHandler: SearchHandler
}

/**
 * A search bar component which provides an input field for entering search words. It has two different layout styles depending on the available screen size, expanded and collapsed.
 * In collapsed state the input field is not visible and the user cannot enter search words. By clicking on the magnifying icon the user can change the state from collapsed to expanded.
 * In expanded state every user input triggers a search function call which then do the actual search operation with the given words.
 * - TODO: Ensures that not every input character leads to a search call by delaying the actual search call by a fixed timeout. We like to search for whole words instead searching for single characters.
 * - TODO: Ensure that search calls are not executed in parallel.
 *
 * The collapsed state is default in desktop layout (enough space to show all three columns). On smaller screens there is no collapsed state and the search bar is always in expanded state.
 *
 */
export class SearchBarN implements MComponent<SearchBarNAttrs> {

	expanded: boolean
	focused: boolean
	shortcuts: Array<Shortcut>
	inputFieldKeyHandlers: Array<Shortcut>
	skipNextBlur: boolean
	inputStream: Stream<string>
	domInput: HTMLInputElement


	constructor(vnode: Vnode<SearchBarNAttrs>) {
		this.expanded = false
		this.shortcuts = this._setupShortcuts()
		this.inputFieldKeyHandlers = this._setupInputFieldKeyHandler(vnode.attrs.searchHandler)
		this.inputStream = stream("")
	}


	oncreate(vnode: Vnode<SearchBarNAttrs>) {
		vnode.attrs.keyManager.registerShortcuts(this.shortcuts)
	}

	onremove(vnode: Vnode<SearchBarNAttrs>) {
		vnode.attrs.keyManager.unregisterShortcuts(this.shortcuts)
	}

	view(vnode: Vnode<SearchBarNAttrs>): Children {
		const keyManager = vnode.attrs.keyManager
		return m(".flex", [
			m(".search-bar.flex-end.items-center" + landmarkAttrs(AriaLandmarks.Search), {

				style: this.getSearchBarStyle()
			}, [
				this.renderSearchIcon(),
				m(".searchInputWrapper.flex.items-center", {
						"aria-hidden": String(!this.isExpanded()),
						tabindex: this.isExpanded() ? TabIndex.Default : TabIndex.Programmatic,
						style: this.getSearchInputWrapperStyle()
					},
					[
						this._getInputField(vnode.attrs.searchHandler),

						m("button.closeIconWrapper", {
								onclick: (e) => this.close(vnode.attrs.searchHandler),
								style: {width: size.icon_size_large},
								title: lang.get("close_alt"),
								tabindex: this.expanded ? TabIndex.Default : TabIndex.Programmatic,
							},
							// this.busy // wahrscheinlich nicht notwenig wegen fehlender serverabfrage
							// ? m(Icon, {
							// 	icon: BootIcons.Progress,
							// 	class: 'flex-center items-center icon-progress-search icon-progress'
							// })
							// :
							m(Icon, {
								icon: Icons.Close,
								class: "flex-center items-center icon-large",
								style: {fill: theme.header_button}
							}))
					]
				),
			]),
		])
	}

	getSearchBarStyle(): {[string]: string} {
		return {
			'min-height': px(inputLineHeight + 2), // 2 px border
			'padding-bottom': this.isExpanded() ? (this.focused ? px(0) : px(1)) : px(2),
			'padding-top': px(2), // center input field
			'margin-right': px(styles.isDesktopLayout() ? 15 : 8),
			'border-bottom': this.isExpanded()
				? (this.focused ? `2px solid ${theme.content_accent}` : `1px solid ${theme.content_border}`)
				: "0px",
			'align-self': "center",
			'max-width': px(400),
			'flex': "1"
		}
	}

	getSearchInputWrapperStyle(): {[string]: string} {
		let paddingLeft: string
		if (this.isExpanded()) {
			if (styles.isDesktopLayout()) {
				paddingLeft = px(10)
			} else {
				paddingLeft = px(6)
			}
		} else {
			paddingLeft = px(0)
		}
		return {
			"width": this.expanded ? "100%" : px(0),
			"transition": `width ${DefaultAnimationTime}ms`,
			'padding-left': paddingLeft,
			'padding-top': '3px',
			'padding-bottom': '3px',
			'overflow-x': 'hidden',
		}
	}

	/**
	 * Search icon for expanding or hiding the search bar. We only have this behavior when we all three columns are visible in desktop layout.
	 */
	renderSearchIcon(): Children {
		return styles.isDesktopLayout()
			? m("button.ml-negative-xs.click", {
				tabindex: TabIndex.Default,
				title: lang.get("search_label"),
				onmousedown: (e) => {
					if (this.focused) {
						this.skipNextBlur = true // avoid closing of overlay when clicking search icon
					}
				},
				onclick: (e) => {
					e.preventDefault()
					// A click on the search icon should focus and expand the input field.
					if (!this.focused) {
						this.focus()
					}
				}
			}, m(Icon, {
				icon: BootIcons.Search,
				class: "flex-center items-center icon-large",
				style: {
					fill: this.focused ? theme.header_button_selected : theme.header_button,
				}
			}))
			: null
	}

	_setupShortcuts(): Shortcut[] {
		return [
			{
				key: Keys.F,
				enabled: () => true,
				exec: key => {
					this.focus()
					m.redraw()
				},
				help: "search_label"
			},
		]
	}


	_setupInputFieldKeyHandler(handler: SearchHandler): Shortcut[] {
		return [
			{
				key: Keys.F1,
				exec: () => noOp(),//keyManager.openF1Help(),
				help: "help_label"
			},
			{
				key: Keys.ESC,
				exec: () => this.close(handler),
				help: "cancel_action"
			},
			{
				key: Keys.UP,
				exec: () => handler.onKeyUpPressed(),
				help: "moveUp_action"
			}, {
				key: Keys.DOWN,
				exec: () => handler.onKeyDownPressed(),
				help: "moveDown_action"
			}
		]
	}

	focus() {
		if (!this.expanded) {
			this.focused = true
			this.expanded = true
			// setTimeout to fix bug in current Safari with losing focus
			setTimeout(() => {
				this.domInput.select()
				this.domInput.focus()
			}, client.browser === BrowserType.SAFARI ? 200 : 0)
		}
	}

	blur(handler: SearchHandler) {
		this.focused = false
		if (this.inputStream() === "") {
			this.expanded = false
		}
		handler.onBlur()
	}

	// We only show the minimized version of the search bar when having all coloums visible (desktop layout.)
	isExpanded(): boolean {
		return !styles.isDesktopLayout() || this.expanded
	}

	_getInputField(handler: SearchHandler): Children {
		return m("input.input.input-no-clear", {
			"aria-autocomplete": "list",
			tabindex: this.expanded ? TabIndex.Default : TabIndex.Programmatic,
			role: "combobox",
			placeholder: lang.getMaybeLazy(handler.placeholder),
			type: Type.Text,
			value: this.inputStream(),
			oncreate: (vnode) => {
				this.domInput = vnode.dom
			},
			onclick: () => this.focus(),
			onfocus: () => {
				// to highlight elements correctly when focused via keyboard
				this.focused = true
			},
			onblur: e => {
				if (this.skipNextBlur) {
					setTimeout(() => this.domInput.focus(), 0) // setTimeout needed in Firefox to keep focus
				} else {
					this.blur(handler)
				}
				this.skipNextBlur = false
			},
			onremove: () => {
				this.domInput.onblur = null
			},
			oninput: e => {
				const domValue = this.domInput.value
				if (this.inputStream() !== domValue) {
					// update the input on each change
					this.inputStream(domValue)
					handler.onSearch(domValue)
				}
			},
			onkeydown: (e: KeyboardEvent) => {
				const keyPressed = this.inputFieldKeyHandlers.find(keyHandler => isKeyPressed(e.keyCode, keyHandler.key))
				if (keyPressed) {
					keyPressed.exec(getKeyPress(e))
				}
				// e.preventDefault()
				e.stopPropagation()
			},
			style: {
				"line-height": px(inputLineHeight)
			}
		})
	}

	close(handler: SearchHandler) {
		if (this.expanded) {
			this.expanded = false
			this.inputStream("")
			handler.onSearch("")
			this.domInput.blur() // remove focus from the input field if ESC was pressed
			handler.onBlur()
		}
	}

}