// @flow
import m from "mithril"
import {windowFacade} from "../../misc/WindowFacade"
import {NavButton, NavButtonColors, createDropDownNavButton} from "./NavButton"
import {assertMainOrNodeBoot} from "../../api/Env"
import {size} from "../size"
import {styles} from "../styles"
import {BootIcons} from "./icons/BootIcons"
import type {SearchBar} from "../../search/SearchBar"
import {asyncImport} from "../../api/common/utils/Utils"

assertMainOrNodeBoot()

type ButtonWrapper = {id: number, priority: number; button: NavButton, prefixComponent?: Component, width:number, hideLabelDefault:boolean}

type SortedButtons = {visible: ButtonWrapper[], hidden: ButtonWrapper[]}

/**
 * The highest possible priority for a button. Buttons of this priority will be shown always.
 */
export const MAX_PRIO: number = 100


/**
 * An advanced button bar that hides buttons behind a 'more' button if they do not fit
 */
export class NavBar {
	buttonId: number;
	buttons: ButtonWrapper[];
	moreButtons: ButtonWrapper[];
	more: ButtonWrapper;
	maxWidth: number;
	resizeListener: windowSizeListener;
	controller: Function;
	view: Function;
	_domNavBar: ?HTMLElement;
	searchBar: SearchBar;

	/**
	 * @param buttonType determines how the buttons are displayed and how the width of each button is calculated
	 */
	constructor() {
		this.buttonId = 0
		this.buttons = []
		this.moreButtons = []

		this.more = {
			id: Number.MAX_VALUE,
			priority: MAX_PRIO,
			button: createDropDownNavButton("more_label", () => BootIcons.MoreVertical, () => {
				let buttons = this.getVisibleButtons().hidden.map(wrapper => wrapper.button)
				return buttons
			}),
			prefixComponent: styles.isDesktopLayout() ? {
					view: () => m(".nav-bar-spacer")
				} : undefined,
			width: size.button_height + styles.isDesktopLayout() ? 4 : 0, // spacer width is 4px
			hideLabelDefault: true
		}
		this.more.button.setColors(NavButtonColors.Header)

		asyncImport(typeof module != "undefined" ? module.id : __moduleName, `${env.rootPathPrefix}src/search/SearchBar.js`).then((searchBarModule) => {
			this.searchBar = new searchBarModule.SearchBar()
		})

		this.maxWidth = 0;
		this.resizeListener = (width, height) => {
			this._setButtonBarWidth()
		}

		windowFacade.addResizeListener(this.resizeListener)

		let self = this
		this.controller = function () {
			return this
		}

		this.view = (): VirtualElement => {
			let buttons = this.getVisibleButtons()
			return m("nav.nav-bar.flex-end", {
				oncreate: (vnode) => this._setDomNavBar(vnode.dom)
			}, [this.searchBar ? m(this.searchBar) : null].concat(buttons.visible.map((wrapper: ButtonWrapper) => [wrapper.prefixComponent ? m(wrapper.prefixComponent) : null, m(".plr-nav-button", {
				key: wrapper.id,
				oncreate: vnode => {
					wrapper.width = vnode.dom.getBoundingClientRect().width
				},
				style: wrapper.width == 0 ? {visibility: 'hidden'} : {}
			}, m(wrapper.button))])))
		}
	}

	/**
	 * Removes the registered event listener as soon as this component is unloaded (invoked by mithril)
	 */
	onunload() {
		windowFacade.removeResizeListener(this.resizeListener)
	}

	/**
	 * @param button The button to add to the buttonBar
	 * @param priority The higher the value the higher the priority. Values from 0 to MAX_PRIO are allowed.
	 * @param moreOnly this button should only be visible, when the more button dropdown is visible
	 */
	addButton(button: NavButton, priority: number = 0, moreOnly: boolean = false, showSpacer: boolean = false): NavBar {
		if (priority > MAX_PRIO) {
			throw new Error("prio > " + MAX_PRIO);
		}
		let wrapper = {
			id: this.buttonId++,
			priority,
			button,
			width: 0,
			hideLabelDefault: button._hideLabel,
			prefixComponent: undefined
		}
		if (moreOnly) {
			this.moreButtons.push(wrapper)
		} else {
			this.buttons.push(wrapper)
		}

		if (showSpacer) {
			wrapper.prefixComponent = {
				view: () => m(".nav-bar-spacer")
			}
		}
		return this
	}

	_setButtonBarWidth() {
		if (this._domNavBar) {
			let newMaxWidth = Math.floor(this._domNavBar.getBoundingClientRect().width)
			if (this.maxWidth != newMaxWidth) {
				this.maxWidth = newMaxWidth
			}
		}
	}

	getButtonsWidth(wrappers: ButtonWrapper[]): number {
		return wrappers
			.map((w: ButtonWrapper) => w.width)
			.reduce((sum, current) => sum + current, 0)
	}

	getVisibleButtons(): SortedButtons {
		let visible = this.buttons.filter((b: ButtonWrapper) => b.button.isVisible())
		let hidden = this.moreButtons.filter((b: ButtonWrapper) => b.button.isVisible())
		let remainingSpace = this.maxWidth

		let buttons: SortedButtons = {
			visible,
			hidden
		}
		if (hidden.length > 0) {
			visible.push(this.more)
		}
		if (remainingSpace < this.getButtonsWidth(visible)) {
			buttons.visible = []
			visible.sort((a: ButtonWrapper, b: ButtonWrapper) => b.priority - a.priority)
			if (visible.indexOf(this.more) == -1) {
				visible.unshift(this.more)
			}
			while (remainingSpace - visible[0].width >= 0) {
				remainingSpace -= visible[0].width
				let move = visible.splice(0, 1)[0]
				buttons.visible.push(move)
			}
			buttons.hidden = hidden.concat(visible).sort((a: ButtonWrapper, b: ButtonWrapper) => a.id - b.id)
			buttons.visible.sort((a: ButtonWrapper, b: ButtonWrapper) => a.id - b.id)
		}
		buttons.hidden.forEach(b => b.button.setColors(NavButtonColors.Content).setHideLabel(false))
		buttons.visible.forEach(b => b.button.setColors(NavButtonColors.Header).setHideLabel(b.hideLabelDefault))
		return buttons
	}

	_setDomNavBar(domElement: HTMLElement) {
		this._domNavBar = domElement
		this._setButtonBarWidth()
		// we have to trigger a redraw after the first draw in order to get the width of the button bar
		window.requestAnimationFrame(m.redraw)
	}
}
