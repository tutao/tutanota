// @flow
import m from "mithril"
import {lang} from "../../misc/LanguageViewModel"
import {addFlash, removeFlash} from "./Flash"
import {assertMainOrNodeBoot} from "../../api/Env"
import type {lazyIcon} from "./Icon"
import {Icon} from "./Icon"
import {theme} from "../theme"
import {styles} from "../styles"
import type {NavButtonAttrs} from "./NavButtonN"
import type {TranslationKey} from "../../misc/LanguageViewModel"

assertMainOrNodeBoot()

export const ButtonType = Object.freeze({
	Action: 'action',
	ActionLarge: 'action-large', // action button with large icon
	Primary: 'primary',
	Secondary: 'secondary',
	Dropdown: 'dropdown',
	Login: 'login',
	Floating: 'floating',
	Bubble: 'bubble',
	TextBubble: 'textBubble',
	Toggle: 'toggle'
})
export type ButtonTypeEnum = $Values<typeof ButtonType>;

export const ButtonColors = Object.freeze({
	Header: 'header',
	Nav: 'nav',
	Content: 'content',
})
export type ButtonColorEnum = $Values<typeof ButtonColors>;

function getColors(buttonColors: ?ButtonColorEnum) {
	switch (buttonColors) {
		case ButtonColors.Nav:
			return {
				button: theme.navigation_button,
				button_selected: theme.navigation_button_selected,
				icon: theme.navigation_button_icon,
				icon_selected: theme.navigation_button_icon_selected,
			}
		case ButtonColors.Content:
		default:
			return {
				button: theme.content_button,
				button_selected: theme.content_button_selected,
				icon: theme.content_button_icon,
				icon_selected: theme.content_button_icon_selected,
			}
	}
}

export type ButtonAttrs = {
	label: TranslationKey | lazy<string>,
	title?: TranslationKey | lazy<string>,
	click: clickHandler,
	icon?: lazyIcon,
	type?: ButtonTypeEnum,
	colors?: ButtonColorEnum,
	isVisible?: lazy<boolean>,
	isSelected?: lazy<boolean>,
	noBubble?: boolean,
	staticRightText?: string
}

/**
 * A button.
 */
class _Button {
	_domButton: HTMLElement;

	view(vnode: Vnode<LifecycleAttrs<ButtonAttrs>>) {
		const a = vnode.attrs
		const type = this.getType(a.type)
		const title = a.title !== undefined ? this.getTitle(a.title) : lang.getMaybeLazy(a.label)

		return m("button.limit-width.noselect",
			{
				class: this.getButtonClasses(a).join(' '),
				style: vnode.attrs.type === ButtonType.Login ? {
					'border-radius': '3px',
					'background-color': theme.content_accent,
				} : {},
				onclick: (event: MouseEvent) => this.click(event, a, this._domButton),
				title: (type === ButtonType.Action
					|| type === ButtonType.Dropdown
					|| type === ButtonType.Login
					|| type === ButtonType.Floating)
					? lang.getMaybeLazy(a.label)
					: title,
				oncreate: (vnode) => {
					this._domButton = vnode.dom
					if (type !== ButtonType.Toggle) {
						addFlash(vnode.dom)
					}
					a.oncreate && a.oncreate(vnode)
				},
				onbeforeremove: (vnode) => removeFlash(vnode.dom)
			}, m("", {// additional wrapper for flex box styling as safari does not support flex box on buttons.
				class: this.getWrapperClasses(a).join(' '),
			}, [
				this.getIcon(a),
				this._getLabelElement(a),
				(a.staticRightText) ? m(".pl-s", a.staticRightText) : null
			])
		)
	}

	getTitle(title: TranslationKey | lazy<string>): string {
		return lang.getMaybeLazy(title)
	}

	getType(type: ?ButtonTypeEnum) {
		return type ? type : ButtonType.Action
	}

	getIcon(a: ButtonAttrs) {
		return (a.icon instanceof Function && a.icon()) ? m(Icon, {
			icon: a.icon(),
			class: this.getIconClass(a),
			style: {
				fill: this.getIconColor(a),
				'background-color': this.getIconBackgroundColor(a)
			}
		}) : null
	}

	getIconColor(a: ButtonAttrs) {
		if (this.getType(a.type) === ButtonType.Bubble) {
			return theme.button_bubble_fg
		} else if (isSelected(a) || this.getType(a.type) === ButtonType.Floating) {
			return getColors(a.colors).icon_selected
		} else {
			return getColors(a.colors).icon
		}
	}

	getIconBackgroundColor(a: ButtonAttrs) {
		const type = this.getType(a.type)
		if ([ButtonType.Toggle, ButtonType.Bubble].includes(type)) {
			return 'initial'
		} else if (isSelected(a) || type === ButtonType.Floating) {
			return getColors(a.colors).button_selected
		} else {
			return getColors(a.colors).button
		}
	}

	getIconClass(a: ButtonAttrs) {
		const type = this.getType(a.type)
		if (type === ButtonType.ActionLarge) {
			return "flex-center items-center button-icon icon-large"
		} else if (type === ButtonType.Floating) {
			return "flex-center items-center button-icon floating icon-large"
		} else if (a.colors === ButtonColors.Header && !styles.isDesktopLayout()) {
			return "flex-end items-center button-icon icon-xl"
		} else if (type === ButtonType.Bubble) {
			return "pr-s"
		} else {
			return "flex-center items-center button-icon"
		}
	}

	getButtonClasses(a: ButtonAttrs) {
		const type = this.getType(a.type)
		let buttonClasses = ["bg-transparent"]
		if (type === ButtonType.Floating) {
			buttonClasses.push("fixed-bottom-right")
			buttonClasses.push("large-button-height")
			buttonClasses.push("large-button-width")
		} else if ([ButtonType.Action, ButtonType.ActionLarge].includes(type)) {
			buttonClasses.push("button-width-fixed") // set the button width for firefox browser
			buttonClasses.push("button-height") // set the button height for firefox browser
		} else {
			buttonClasses.push("button-height") // set the button height for firefox browser
		}
		if (type === ButtonType.Login) {
			buttonClasses.push("full-width")
		}
		return buttonClasses
	}

	getWrapperClasses(a: ButtonAttrs) {
		const type = this.getType(a.type)
		let wrapperClasses = ["button-content", "flex", "items-center", type]
		if (![ButtonType.Floating, ButtonType.TextBubble, ButtonType.Toggle].includes(type)) {
			wrapperClasses.push("plr-button")
		}
		if (type === ButtonType.Dropdown) {
			wrapperClasses.push("justify-start")
		} else {
			wrapperClasses.push("justify-center")
		}
		if (type === ButtonType.Toggle) {
			wrapperClasses.push(isSelected(a) ? "on" : "off")
		}
		return wrapperClasses
	}

	_getLabelElement(a: ButtonAttrs) {
		const type = this.getType(a.type)
		const label = lang.getMaybeLazy(a.label)
		if (label.trim() === '' || [ButtonType.Action, ButtonType.Floating].includes(type)) {
			return null
		}
		let classes = ["text-ellipsis"]
		if (type === ButtonType.Dropdown) {
			classes.push("pl-m")
		}
		if (type === ButtonType.Toggle) {
			classes.push("pr-s pb-2")
		}

		return m("", {
			class: classes.join(' '),
			style: this._getLabelStyle(a)
		}, label)
	}

	_getLabelStyle(a: ButtonAttrs) {
		const type = this.getType(a.type)
		let color
		if (type === ButtonType.Primary || type === ButtonType.Secondary) {
			color = theme.content_accent
		} else if ([ButtonType.Login, ButtonType.Toggle].includes(type)) {
			color = theme.content_button_icon
		} else if (type === ButtonType.Bubble || type === ButtonType.TextBubble) {
			color = theme.content_fg
		} else {
			color = isSelected(a)
				? getColors(a.colors).button_selected
				: getColors(a.colors).button
		}
		return {
			color,
			'font-weight': (type === ButtonType.Primary) ? 'bold' : 'normal'
		}
	}

	click(event: MouseEvent, a: ButtonAttrs, dom: HTMLElement) {
		a.click(event, dom)
		// in IE the activeElement might not be defined and blur might not exist
		if (!a.noBubble && document.activeElement && typeof document.activeElement.blur === "function") {
			document.activeElement.blur()
		} else if (a.noBubble) {
			event.stopPropagation()
		}
	}
}

export const ButtonN: Class<MComponent<ButtonAttrs>> = _Button

export function isVisible(a: NavButtonAttrs | ButtonAttrs) {
	return (typeof a.isVisible !== "function") || a.isVisible()
}

export function isSelected(a: NavButtonAttrs | ButtonAttrs) {
	return typeof a.isSelected === "function" ? a.isSelected() : false
}