// @flow
import m from "mithril"
import {handleUncaughtError} from "../../misc/ErrorHandler"
import {px, size} from "../size"
import {addFlash, removeFlash} from "./Flash"
import {neverNull} from "../../api/common/utils/Utils"
import type {lazyIcon} from "./Icon"
import {Icon} from "./Icon"
import {theme} from "../theme"
import {styles} from "../styles"
import {lazyStringValue} from "../../api/common/utils/StringUtils"
import {assertMainOrNodeBoot} from "../../api/Env"
import type {TranslationKey} from "../../misc/LanguageViewModel"
import {lang} from "../../misc/LanguageViewModel"
import {Keys} from "../../api/common/TutanotaConstants"
import {isKeyPressed} from "../../misc/KeyManager"

assertMainOrNodeBoot()

export type NavButtonAttrs = {|
	label: TranslationKey | lazy<string>,
	icon: lazyIcon,
	href: string | lazy<string>,
	isSelectedPrefix?: string | boolean,
	click?: clickHandler,
	colors?: NavButtonColorEnum,
	isVisible?: lazy<boolean>,
	dropHandler?: dropHandler,
	hideLabel?: boolean,
	vertical?: boolean,
	fontSize?: number,
|}

const navButtonSelector = (vertical) =>
	"a.nav-button.noselect.flex-start.flex-no-shrink.items-center.click.plr-button.no-text-decoration.button-height"
	+ (vertical ? ".col" : "")

class _NavButton {
	_domButton: HTMLElement;
	_draggedOver: boolean;
	_dropCounter: number; // we also get drag enter/leave events from subelements, so we need to count to know when the drag leaves this button


	constructor() {
		this._draggedOver = false
		this._dropCounter = 0
	}


	view(vnode: Vnode<NavButtonAttrs>) {
		const a = vnode.attrs
		// allow nav button without label for registration button on mobile devices
		return m((this._isExternalUrl(a.href) ? navButtonSelector(vnode.attrs.vertical) : m.route.Link),
			this.createButtonAttributes(a),
			[
				a.icon() ? m(Icon, {
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

	getLabel(label: TranslationKey | lazy<string>) {
		return lang.getMaybeLazy(label)
	}

	_getUrl(href: string | lazy<string>): string {
		return lazyStringValue(href)
	}

	_getIconClass(a: NavButtonAttrs) {
		const isSelected = isNavButtonSelected(a)
		if (a.colors === NavButtonColors.Header && !styles.isDesktopLayout()) {
			return "flex-end items-center icon-xl" + (isSelected ? " selected" : "")
		} else {
			return "flex-center items-center icon-large" + (isSelected ? " selected" : "")
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
				color: (isNavButtonSelected(a) || this._draggedOver)
					? getColors(a.colors).button_selected
					: getColors(a.colors).button,
				"font-size": px(a.fontSize),
			},
			title: this.getLabel(a.label),
			target: this._isExternalUrl(a.href) ? "_blank" : undefined,
			oncreate: (vnode: VirtualElement) => {
				this._domButton = vnode.dom
				addFlash(vnode.dom)
			},
			onbeforeremove: (vnode) => {
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


export const NavButtonN: Class<MComponent<NavButtonAttrs>> = _NavButton

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
