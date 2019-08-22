// @flow
import m from "mithril"
import {windowFacade} from "../../misc/WindowFacade"
import {ButtonColors, isVisible} from "./ButtonN"
import {createDropdown} from "./DropdownN.js"
import {assertMainOrNodeBoot} from "../../api/Env"
import {size} from "../size"
import type {NavButtonAttrs} from "./NavButtonN"
import {NavButtonN} from "./NavButtonN"
import {BootIcons} from "./icons/BootIcons"

assertMainOrNodeBoot()

let buttonId = 0

export class ButtonWrapper {
	id: number;
	priority: number; // The higher the value the higher the priority. Values from 0 to MAX_PRIO are allowed.
	buttonAttrs: NavButtonAttrs;
	width: number;

	constructor(buttonAttrs: NavButtonAttrs, priority: number = 0, width: number = 0) {
		this.id = buttonId++
		this.priority = priority // The higher the value the higher the priority. Values from 0 to MAX_PRIO are allowed.
		this.buttonAttrs = buttonAttrs
		this.width = width
	}

	setId(id: number): this {
		this.id = id
		return this
	}
}

type SortedButtons = {visible: ButtonWrapper[], hidden: ButtonWrapper[]}

/**
 * The highest possible priority for a button. Buttons of this priority will be shown always.
 */
export const MAX_PRIO: number = 100

export type NavBarAttrs = {
	buttons: ButtonWrapper[],
	moreButtons?: ButtonWrapper[], // buttons that should only be visible, when the more button dropdown is visible
}

/**
 * An advanced button bar that hides buttons behind a 'more' button if they do not fit
 */
class _NavBar {
	buttonId: number;
	buttons: ButtonWrapper[];
	moreButtons: ButtonWrapper[]; // this button should only be visible, when the more button dropdown is visible
	more: ButtonWrapper;
	maxWidth: number;
	resizeListener: windowSizeListener;
	_domNavBar: ?HTMLElement;

	/**
	 * @param buttonType determines how the buttons are displayed and how the width of each button is calculated
	 */
	constructor(vnode: Vnode<NavBarAttrs>) {
		this.buttonId = 0
		this.buttons = vnode.attrs.buttons
		this.moreButtons = vnode.attrs.moreButtons ? vnode.attrs.moreButtons : []

		let moreButtonAttrs = {
			label: "more_label",
			href: () => m.route.get(),
			icon: () => BootIcons.MoreVertical,
			click: createDropdown(() => this.getVisibleButtons().hidden.map(wrapper => wrapper.buttonAttrs)),
			colors: ButtonColors.Header,
			hideLabel: true,
		}
		this.more = new ButtonWrapper(moreButtonAttrs, MAX_PRIO, size.button_height).setId(Number.MAX_VALUE)

		this.maxWidth = 0;
		this.resizeListener = (width, height) => {
			this._setButtonBarWidth()
		}

		windowFacade.addResizeListener(this.resizeListener)

		let self = this
	}

	view(vnode: Vnode<NavBarAttrs>) {
		let buttons = this.getVisibleButtons()
		return m("nav.nav-bar.flex-end", {
			oncreate: (vnode) => this._setDomNavBar(vnode.dom)
		}, buttons.visible.map((wrapper: ButtonWrapper) => m(".plr-nav-button", {
			key: wrapper.id,
			oncreate: vnode => {
				wrapper.width = vnode.dom.getBoundingClientRect().width
			},
			style: wrapper.width === 0 ? {visibility: 'hidden'} : {}
		}, this.createButton(wrapper))))
	}

	createButton(wrapper) {
		return m(NavButtonN, ((wrapper.buttonAttrs: any): NavButtonAttrs))
	}

	/**
	 * Removes the registered event listener as soon as this component is unloaded (invoked by mithril)
	 */
	onunload() {
		windowFacade.removeResizeListener(this.resizeListener)
	}

	_setButtonBarWidth() {
		if (this._domNavBar) {
			let newMaxWidth = Math.floor(this._domNavBar.getBoundingClientRect().width)
			if (this.maxWidth !== newMaxWidth) {
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
		let visible = this.buttons.filter((b: ButtonWrapper) => isVisible(b.buttonAttrs))
		let hidden = this.moreButtons.filter((b: ButtonWrapper) => isVisible(b.buttonAttrs))
		let remainingSpace = this._domNavBar ? this._domNavBar.scrollWidth : 0

		let buttons: SortedButtons = {
			visible,
			hidden
		}
		if (remainingSpace < this.getButtonsWidth(visible)) {
			buttons.visible = []
			visible.sort((a: ButtonWrapper, b: ButtonWrapper) => b.priority - a.priority)
			visible.unshift(this.more)
			do {
				remainingSpace -= visible[0].width
				let move = visible.splice(0, 1)[0]
				buttons.visible.push(move)
			} while (visible.length > 0 && (remainingSpace - visible[0].width >= 0))

			buttons.hidden = hidden.concat(visible).sort((a: ButtonWrapper, b: ButtonWrapper) => a.id - b.id)
			buttons.visible.sort((a: ButtonWrapper, b: ButtonWrapper) => a.id - b.id)
		}
		buttons.hidden.forEach(b => b.buttonAttrs.colors = ButtonColors.Content)
		buttons.visible.forEach(b => b.buttonAttrs.colors = ButtonColors.Header)
		return buttons
	}

	_setDomNavBar(domElement: HTMLElement) {
		this._domNavBar = domElement
		this._setButtonBarWidth()
		// we have to trigger a redraw after the first draw in order to get the width of the button bar
		window.requestAnimationFrame(m.redraw)
	}
}


export const NavBarN: Class<MComponent<NavBarAttrs>> = _NavBar