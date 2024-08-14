import m, { Children, Component, RouteLinkAttrs, Vnode } from "mithril"
import { handleUncaughtError } from "../../misc/ErrorHandler"
import { px, size } from "../size"
import type { lazy } from "@tutao/tutanota-utils"
import { lazyStringValue, neverNull } from "@tutao/tutanota-utils"
import type { lazyIcon } from "./Icon"
import { Icon } from "./Icon"
import { theme } from "../theme"
import { styles } from "../styles"
import type { TranslationKey } from "../../misc/LanguageViewModel"
import { lang } from "../../misc/LanguageViewModel"
import { Keys } from "../../api/common/TutanotaConstants"
import { isKeyPressed } from "../../misc/KeyManager"
import type { dropHandler } from "./GuiUtils"
import { assertMainOrNode } from "../../api/common/Env"
import { stateBgHover } from "../builtinThemes.js"

assertMainOrNode()
export type NavButtonAttrs = {
	label: TranslationKey | lazy<string>
	icon?: lazyIcon
	href: string | lazy<string>
	isSelectedPrefix?: string | boolean
	click?: (event: Event, dom: HTMLElement) => unknown
	colors?: NavButtonColor
	dropHandler?: dropHandler
	hideLabel?: boolean
	vertical?: boolean
	fontSize?: number
	small?: boolean
	centred?: boolean
	leftInjection?: () => Children
	disableHoverBackground?: boolean
	disabled?: boolean
	persistentBackground?: boolean
	onfocus?: () => unknown
	onblur?: () => unknown
	onkeydown?: (event: KeyboardEvent) => unknown
	fillSpaceAround?: boolean
}

export class NavButton implements Component<NavButtonAttrs> {
	private _domButton!: HTMLElement
	private _draggedOver: boolean
	private _dropCounter: number // we also get drag enter/leave events from subelements, so we need to count to know when the drag leaves this button

	constructor() {
		this._draggedOver = false
		this._dropCounter = 0
	}

	view(vnode: Vnode<NavButtonAttrs>): Children {
		const a = vnode.attrs

		const linkAttrs = this.createButtonAttributes(a)
		const icon = a.icon?.()
		const children = [
			a.leftInjection?.() ?? null,
			icon
				? m(Icon, {
						icon,
						class: this._getIconClass(a),
						style: {
							fill: isNavButtonSelected(a) || this._draggedOver ? getColors(a.colors).button_selected : getColors(a.colors).button,
						},
				  })
				: null,
			!a.hideLabel ? m("span.label.click.text-ellipsis" + (!a.vertical && icon ? ".pl-m" : ""), this.getLabel(a.label)) : null,
		]

		// allow nav button without label for registration button on mobile devices
		if (this._isExternalUrl(a.href)) {
			return m(this._getNavButtonClass(a), linkAttrs, children)
		} else {
			return m(m.route.Link, linkAttrs, children)
		}
	}

	getLabel(label: TranslationKey | lazy<string>): string {
		return lang.getMaybeLazy(label)
	}

	_getUrl(href: string | lazy<string>): string {
		return lazyStringValue(href)
	}

	_getNavButtonClass(a: NavButtonAttrs): string {
		return (
			"a.nav-button.noselect.items-center.click.plr-button.no-text-decoration.button-height.border-radius" +
			(a.vertical ? ".col" : "") +
			(!a.centred ? ".flex-start" : ".flex-center") +
			(a.disableHoverBackground ? "" : ".state-bg") +
			(a.disabled ? ".no-hover" : "") +
			(a.fillSpaceAround ?? true ? ".flex-no-shrink" : "")
		)
	}

	_getIconClass(a: NavButtonAttrs): string {
		const isSelected = isNavButtonSelected(a)

		if (a.colors === NavButtonColor.Header && !styles.isDesktopLayout()) {
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

	createButtonAttributes(a: NavButtonAttrs): RouteLinkAttrs {
		let attr: RouteLinkAttrs = {
			role: "button",
			// role button for screen readers
			href: this._getUrl(a.href),
			style: {
				color: isNavButtonSelected(a) || this._draggedOver ? getColors(a.colors).button_selected : getColors(a.colors).button,
				"font-size": a.fontSize ? px(a.fontSize) : "",
				background: (isNavButtonSelected(a) && a.persistentBackground) || this._draggedOver ? stateBgHover : "",
			},
			title: this.getLabel(a.label),
			target: this._isExternalUrl(a.href) ? "_blank" : undefined,
			selector: this._getNavButtonClass(a),
			onclick: (e: MouseEvent) => this.click(e, a, e.target as HTMLElement),
			onkeyup: (e: KeyboardEvent, dom: HTMLElement) => {
				if (isKeyPressed(e.key, Keys.SPACE)) {
					this.click(e, a, dom)
				}
			},
			onfocus: a.onfocus,
			onblur: a.onblur,
			onkeydown: a.onkeydown,
		}

		if (a.dropHandler) {
			attr.ondragenter = (ev: DragEvent) => {
				this._dropCounter++
				this._draggedOver = true
				ev.preventDefault()
			}

			attr.ondragleave = (ev: DragEvent) => {
				this._dropCounter--

				if (this._dropCounter === 0) {
					this._draggedOver = false
				}

				ev.preventDefault()
			}

			attr.ondragover = (ev: DragEvent) => {
				// needed to allow dropping
				ev.preventDefault()
			}

			attr.ondrop = (ev: DragEvent) => {
				this._dropCounter = 0
				this._draggedOver = false
				ev.preventDefault()

				if (ev.dataTransfer?.getData("text")) {
					neverNull(a.dropHandler)(ev.dataTransfer.getData("text"))
				}
			}
		}

		return attr
	}

	click(event: Event, a: NavButtonAttrs, dom: HTMLElement) {
		if (!this._isExternalUrl(a.href)) {
			m.route.set(this._getUrl(a.href))

			try {
				if (a.click != null) {
					a.click(event, dom)
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

export const enum NavButtonColor {
	Header = "header",
	Nav = "nav",
	Content = "content",
}

function getColors(buttonColors: NavButtonColor | null | undefined) {
	switch (buttonColors) {
		case NavButtonColor.Header:
			return {
				button: styles.isDesktopLayout() ? theme.header_button : theme.content_accent,
				button_selected: styles.isDesktopLayout() ? theme.header_button_selected : theme.content_accent,
			}

		case NavButtonColor.Nav:
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
	return href !== "" && (current === href || current.indexOf(href + "/") === 0 || current.indexOf(href + "?") === 0)
}
