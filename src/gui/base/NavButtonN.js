// @flow
import m from "mithril"
import {handleUncaughtError} from "../../misc/ErrorHandler"
import {lang} from "../../misc/LanguageViewModel"
import {size} from "../size"
import {removeFlash, addFlash} from "./Flash"
import {neverNull} from "../../api/common/utils/Utils"
import {Icon} from "./Icon"
import {theme} from "../theme"
import {styles} from "../styles"

const TRUE_CLOSURE = (): lazy<boolean> => true

export type NavButtonAttrs = {
	label: string | lazy<string>,
	icon: lazy<SVG>,
	href: string | lazy<string>,
	isSelectedPrefix?: string,
	click?: clickHandler,
	colors?: NavButtonColorEnum,
	isVisible?: lazy<boolean>,
	dropHandler?: dropHandler,
	hideLabel?: boolean,
}

class _NavButton {
	_isSelectedPrefix: ?string;
	_domButton: HTMLElement;
	_draggedOver: boolean;
	_dropHandler: ?dropHandler;
	_dropCounter: number; // we also get drag enter/leave events from subelements, so we need to count to know when the drag leaves this button


	constructor(vnode: Vnode<NavButtonAttrs>) {
		this._isSelectedPrefix = vnode.attrs.isSelectedPrefix ? vnode.attrs.isSelectedPrefix : vnode.attrs.href
		this._draggedOver = false
		this._dropCounter = 0
	}

	view(vnode: Vnode<NavButtonAttrs>) {
		const a = vnode.attrs
		// allow nav button without label for registration button on mobile devices
		return m("a.nav-button.noselect.flex-start.flex-no-shrink.items-center.click.plr-button.no-text-decoration.button-height", this.createButtonAttributes(a), [
			a.icon() ? m(Icon, {
				icon: a.icon(),
				class: this._getIconClass(a),
				style: {
					fill: (this.isSelected() || this._draggedOver) ?
						getColors(a.colors).button_selected : getColors(a.colors).button,
				}
			}) : null,
			(!a.hideLabel) ? m("span.label.click.text-ellipsis.pl-m.b", this.getLabel(a.label)) : null
		])
	}

	isSelected() {
		if (this._isSelectedPrefix) {
			let current = m.route.get()
			return this._isSelectedPrefix && (current === this._isSelectedPrefix
				|| (current.indexOf(this._isSelectedPrefix + "/") === 0))
		}
		return false
	}

	getLabel(label: string | lazy<string>) {
		return label instanceof Function ? label() : lang.get(label)
	}

	_getUrl(href: string | lazy<string>): string {
		return (href instanceof Function) ? href() : href
	}

	_getIconClass(a: NavButtonAttrs) {
		if (a.colors === NavButtonColors.Header && !styles.isDesktopLayout()) {
			return "flex-end items-center icon-xl" + (this.isSelected() ? " selected" : "")
		} else {
			return "flex-center items-center icon-large" + (this.isSelected() ? " selected" : "")
		}
	}

	_isExternalUrl(href: string | lazy<string>) {
		let url = this._getUrl(href)
		return url != null ? url.indexOf("http") === 0 : false
	}

	createButtonAttributes(a: NavButtonAttrs) {
		let attr: any = {
			href: this._getUrl(a.href),
			style: {
				color: (this.isSelected() || this._draggedOver) ?
					getColors(a.colors).button_selected : getColors(a.colors).button
			},
			title: this.getLabel(a.label),
			target: this._isExternalUrl(a.href) ? "_blank" : undefined,
			oncreate: (vnode: VirtualElement) => {
				this._domButton = vnode.dom
				// route.link adds the appropriate prefix to the href attribute and sets the domButton.onclick handler
				if (!this._isExternalUrl(a.href)) {
					m.route.link(vnode)
				}
				this._domButton.onclick = (event: MouseEvent) => this.click(event, a)
				addFlash(vnode.dom)
			},
			onupdate: (vnode: VirtualElement) => {
				if (!this._isExternalUrl(a.href)) {
					m.route.link(vnode)
				}
				this._domButton.onclick = (event: MouseEvent) => this.click(event, a)
			},
			onbeforeremove: (vnode) => {
				removeFlash(vnode.dom)
			}
		}
		if (this._dropHandler) {
			attr.ondragenter = (ev) => {
				this._dropCounter++
				this._draggedOver = true
				ev.preventDefault()
			}
			attr.ondragleave = (ev) => {
				this._dropCounter--
				if (this._dropCounter === 0) {
					this._draggedOver = false
				}
				ev.preventDefault()
			}
			attr.ondragover = (ev) => {
				// needed to allow dropping
				ev.preventDefault()
			}
			attr.ondrop = (ev) => {
				this._dropCounter = 0
				this._draggedOver = false
				ev.preventDefault()
				if (ev.dataTransfer.getData("text")) {
					neverNull(this._dropHandler)(ev.dataTransfer.getData("text"))
				}
			}
		}
		return attr
	}

	click(event: MouseEvent, a: NavButtonAttrs) {
		if (!this._isExternalUrl(a.href)) {
			m.route.set(this._getUrl(a.href))
			try {
				if (a.click != null) {
					a.click(event)
				}
				// in IE the activeElement might not be defined and blur might not exist
				if (document.activeElement && typeof document.activeElement.blur === "function") {
					document.activeElement.blur()
				}
				event.preventDefault()
			} catch (e) {
				handleUncaughtError(e)
			}
		}
	}

	getHeight(): number {
		return size.button_height
	}

}


export const NavButtonN: Class<MComponent<NavButtonAttrs>> = _NavButton

export const NavButtonColors = {
	Header: 'header',
	Nav: 'nav',
	Content: 'content',
}
type NavButtonColorEnum = $Values<typeof NavButtonColors>;

function getColors(buttonColors: ?NavButtonColorEnum) {
	switch (buttonColors) {
		case NavButtonColors.Header:
			return {
				button: styles.isDesktopLayout() ? theme.header_button : theme.content_accent,
				button_selected: styles.isDesktopLayout() ? theme.header_button_selected : theme.content_accent,
			}
		case NavButtonColors.Nav:
			return {
				button: theme.navigation_button,
				button_selected: theme.navigation_button_selected,
			}
		default:
			// for nav buttons in the more dropdown menu
			return {
				button: theme.content_button,
				button_selected: theme.content_button_selected,
			}
	}
}