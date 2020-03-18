// @flow
import m from "mithril"
import {windowFacade} from "../../misc/WindowFacade"
import {assertMainOrNodeBoot, isAdminClient} from "../../api/Env"
import {size} from "../size"
import {styles} from "../styles"
import type {SearchBar} from "../../search/SearchBar"
import {asyncImport} from "../../api/common/utils/Utils"
import {logins} from "../../api/main/LoginController"
import type {MainLocatorType} from "../../api/main/MainLocator"
import {lang} from "../../misc/LanguageViewModel"
import type {NavButtonAttrs} from "./NavButtonN"
import {NavButtonColors, NavButtonN} from "./NavButtonN"
import {createDropdown} from "./DropdownN"
import {BootIcons} from "./icons/BootIcons"
import {CONTACTS_PREFIX, MAIL_PREFIX, SEARCH_PREFIX} from "../../misc/RouteChange"
import {AriaLandmarks} from "../../api/common/TutanotaConstants"

assertMainOrNodeBoot()

type ButtonWrapper = {id: number, priority: number; button: NavButtonAttrs, prefixComponent?: Component, width: number, hideLabelDefault: boolean}

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
			button: {
				label: () => lang.get("more_label"),
				click: (e, dom) => {
					const dropdownFn = createDropdown(() => this.getVisibleButtons().hidden.map(wrapper => wrapper.button))
					dropdownFn(e, dom)
				},
				href: () => m.route.get(),
				icon: () => BootIcons.MoreVertical,
				colors: NavButtonColors.Header,
				hideLabel: true,
				isSelectedPrefix: false,
			},
			prefixComponent: styles.isDesktopLayout() ? {
				view: () => m(".nav-bar-spacer"),
			} : undefined,
			width: size.button_height + styles.isDesktopLayout() ? 4 : 0, // spacer width is 4px
			hideLabelDefault: true
		}

		if (!isAdminClient()) {
			asyncImport(typeof module !== "undefined" ? module.id : __moduleName,
				`${env.rootPathPrefix}src/search/SearchBar.js`)
				.then((searchBarModule) => {
					this.searchBar = new searchBarModule.SearchBar()
				})
		}

		this.maxWidth = 0;
		this.resizeListener = (width, height) => {
			this._setButtonBarWidth()
		}

		windowFacade.addResizeListener(this.resizeListener)

		this.controller = function () {
			return this
		}

		this.view = (): Children => {
			let buttons = this.getVisibleButtons()
			return m("nav.nav-bar.flex-end", {
					"aria-label": "top",
					role: AriaLandmarks.Navigation,
					tabindex: "-1",
					oncreate: (vnode) => this._setDomNavBar(vnode.dom)
				},
				[this._searchBar()].concat(buttons.visible.map((wrapper: ButtonWrapper) =>
					[
						wrapper.prefixComponent ? m(wrapper.prefixComponent) : null,
						m(".plr-nav-button", {
							oncreate: vnode => {
								wrapper.width = vnode.dom.getBoundingClientRect().width
							},
						}, m(NavButtonN, wrapper.button))
					])))
		}
	}

	_searchBar(): Child {
		return this._searchBarVisible() ? m(this.searchBar, {
				spacer: true,
				placeholder: this._searchPlaceholder(),
			}) :
			null
	}

	_searchPlaceholder(): ?string {
		const route = m.route.get()
		if (route.startsWith(MAIL_PREFIX) || route.startsWith("/search/mail")) {
			return lang.get("searchEmails_placeholder")
		} else if (route.startsWith(CONTACTS_PREFIX) || route.startsWith("/search/contact")) {
			return lang.get("searchContacts_placeholder")
		} else if (route.startsWith("/settings/users")) {
			return lang.get("searchUsers_placeholder")
		} else if (route.startsWith("/settings/groups")) {
			return lang.get("searchGroups_placeholder")
		} else {
			return null
		}
	}

	_searchBarVisible(): boolean {
		let route = m.route.get()
		let locator: ?MainLocatorType = window.tutao.locator
		return this.searchBar != null && locator != null && !locator.search.indexState().initializing
			&& styles.isDesktopLayout()
			&& logins.isInternalUserLoggedIn()
			&& (route.startsWith(SEARCH_PREFIX)
				|| route.startsWith(MAIL_PREFIX)
				|| route.startsWith(CONTACTS_PREFIX)
				|| route.startsWith("/settings/users")
				|| route.startsWith("/settings/groups")
				|| route.startsWith("/settings/whitelabelaccounts"))
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
	addButton(button: NavButtonAttrs, priority: number = 0, moreOnly: boolean = false): NavBar {
		if (priority > MAX_PRIO) {
			throw new Error("prio > " + MAX_PRIO);
		}
		let wrapper = {
			id: this.buttonId++,
			priority,
			button,
			width: 0,
			hideLabelDefault: button.hideLabel || false,
			prefixComponent: undefined
		}
		if (moreOnly) {
			this.moreButtons.push(wrapper)
		} else {
			this.buttons.push(wrapper)
		}
		return this
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
		let visible = this.buttons.filter((b: ButtonWrapper) => b.button.isVisible ? b.button.isVisible() : true)
		let hidden = this.moreButtons.filter((b: ButtonWrapper) => b.button.isVisible ? b.button.isVisible() : true)
		let remainingSpace = this.maxWidth

		if (this._searchBarVisible()) {
			remainingSpace = remainingSpace - this.searchBar.getMaxWidth() // reserve space for expanded search bar
		}

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
			if (visible.indexOf(this.more) === -1) {
				visible.unshift(this.more)
			}
			do {
				remainingSpace -= visible[0].width
				let move = visible.splice(0, 1)[0]
				buttons.visible.push(move)
			} while (visible.length > 0 && (remainingSpace - visible[0].width >= 0))

			buttons.hidden = hidden.concat(visible).sort((a: ButtonWrapper, b: ButtonWrapper) => a.id - b.id)
			buttons.visible.sort((a: ButtonWrapper, b: ButtonWrapper) => a.id - b.id)
		}
		buttons.hidden.forEach(b => {
			b.button.colors = NavButtonColors.Content
			b.button.hideLabel = false
		})
		buttons.visible.forEach(b => {
			b.button.colors = NavButtonColors.Header
			b.button.hideLabel = b.hideLabelDefault
		})
		return buttons
	}

	_setDomNavBar(domElement: HTMLElement) {
		this._domNavBar = domElement
		this._setButtonBarWidth()
		// we have to trigger a redraw after the first draw in order to get the width of the button bar
		window.requestAnimationFrame(m.redraw)
	}
}
