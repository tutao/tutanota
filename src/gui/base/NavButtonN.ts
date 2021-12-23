// @flow
import m from "mithril"
import {handleUncaughtError} from "../../misc/ErrorHandler"
import {px, size} from "../size"
import {addFlash, removeFlash} from "./Flash"
import {neverNull} from "@tutao/tutanota-utils"
import type {lazyIcon} from "./Icon"
import {Icon} from "./Icon"
import {theme} from "../theme"
import {styles} from "../styles"
import {lazyStringValue} from "@tutao/tutanota-utils"
import type {TranslationKey} from "../../misc/LanguageViewModel"
import {lang} from "../../misc/LanguageViewModel"
import {Keys} from "../../api/common/TutanotaConstants"
import {isKeyPressed} from "../../misc/KeyManager"
import type {clickHandler, dropHandler} from "./GuiUtils"
import type {lazy} from "@tutao/tutanota-utils"
import {assertMainOrNode} from "../../api/common/Env"

assertMainOrNode()

export type NavButtonAttrs = {|
	label: TranslationKey | lazy<string>,
	icon?: lazyIcon,
	href: string | lazy<string>,
	isSelectedPrefix?: string | boolean,
	click?: clickHandler,
	colors?: NavButtonColorEnum,
	isVisible?: lazy<boolean>,
	dropHandler?: dropHandler,
	hideLabel?: boolean,
	vertical?: boolean,
	fontSize?: number,
	small?: boolean,
	centred?: boolean,
|}

const navButtonSelector = (vertical, centred) =>
	"a.nav-button.noselect.flex-no-shrink.items-center.click.plr-button.no-text-decoration.button-height"
	+ (vertical ? ".col" : "")
	+ (!centred ? ".flex-start" : ".flex-center")

export class NavButtonN implements MComponent<NavButtonAttrs> {
	_domButton: HTMLElement;
	_draggedOver: boolean;
	_dropCounter: number; // we also get drag enter/leave events from subelements, so we need to count to know when the drag leaves this button


	constructor() {
		this._draggedOver = false
		this._dropCounter = 0
	}


	view(vnode: Vnode<NavButtonAttrs>): Children {
		const a = vnode.attrs
		// allow nav button without label for registration button on mobile devices
		return m((this._isExternalUrl(a.href) ? navButtonSelector(vnode.attrs.vertical, vnode.attrs.centred === true) : m.route.Link),
			this.createButtonAttributes(a),
			[
				a.icon && a.icon() ? m(Icon, {
					icon: a.icon(),
					class: this._getIconClass(a),
					style: {
						fill: (isNavButtonSelected(vnode.attrs) || this._draggedOver) ?
							getColors(a.colors).button_selected : getColors(a.colors).button,
					}
				}) : null,
				(!a.hideLabel) ? m("span.label.click.text-ellipsis.b" + (a.vertical ? "" : ".pl-m"), this.getLabel(a.label)) : null
			]
		)
	}

	getLabel(label: TranslationKey | lazy<string>): string {
		return lang.getMaybeLazy(label)
	}

	_getUrl(href: string | lazy<string>): string {
		return lazyStringValue(href)
	}

	_getIconClass(a: NavButtonAttrs): string {
		const isSelected = isNavButtonSelected(a)
		if (a.colors === NavButtonColors.Header && !styles.isDesktopLayout()) {
			return "flex-end items-center icon-xl" + (isSelected ? " selected" : "")
		} else if (a.small === true) {
			return "flex-center items-center icon" + (isSelected ? " selected" : "")
		} else {
			return "flex-center items-center icon-large" + (isSelected ? " selected" : "")
		}
	}

	_isExternalUrl(href: string | lazy<string>): boolean {
		let url = this._getUrl(href)
		return url != null ? url.indexOf("http") === 0 : false
	}

	createButtonAttributes(a: NavButtonAttrs): any {
		let attr: any = {
			role: "button", // role button for screen readers
			href: this._getUrl(a.href),
			style: {
				color: (isNavButtonSelected(a) || this._draggedOver)
					? getColors(a.colors).button_selected
					: getColors(a.colors).button,
				"font-size": a.fontSize ? px(a.fontSize) : "",
			},
			title: this.getLabel(a.label),
			target: this._isExternalUrl(a.href) ? "_blank" : undefined,
			oncreate: (vnode: Vnode<*>) => {
				this._domButton = vnode.dom
				addFlash(vnode.dom)
			},
			onremove: (vnode) => {
				removeFlash(vnode.dom)
			},
			selector: navButtonSelector(a.vertical),
			onclick: (e) => this.click(e, a),
			onkeyup: (e) => {
				if (isKeyPressed(e.keyCode, Keys.SPACE)) {
					this.click(e, a)
				}
			}
		}
		if (a.dropHandler) {
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
					neverNull(a.dropHandler)(ev.dataTransfer.getData("text"))
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
					a.click(event, this._domButton)
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

export const NavButtonColors = Object.freeze({
	Header: 'header',
	Nav: 'nav',
	Content: 'content',
})
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

export function isNavButtonSelected(a: NavButtonAttrs): boolean {
	if (typeof a.isSelectedPrefix === "boolean") {
		return a.isSelectedPrefix
	}
	const selectedPrefix = a.isSelectedPrefix || lazyStringValue(a.href)
	return isSelectedPrefix(selectedPrefix)
}

export function isSelectedPrefix(href: string): boolean {
	const current = m.route.get()
	// don't just check current.indexOf(buttonHref) because other buttons may also start with this href
	return (href !== "") && (current === href || (current.indexOf(href + "/") === 0) || (current.indexOf(href + "?") === 0))
}
