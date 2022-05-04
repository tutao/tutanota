import m, {Children, Component, Vnode} from "mithril"
import type {TranslationKey} from "../../misc/LanguageViewModel"
import {lang} from "../../misc/LanguageViewModel"
import {addFlash, removeFlash} from "./Flash"
import type {lazyIcon} from "./Icon"
import {Icon} from "./Icon"
import {getContentButtonIconBackground, getElevatedBackground, getNavButtonIconBackground, getNavigationMenuIcon, theme} from "../theme"
import type {lazy} from "@tutao/tutanota-utils"
import type {clickHandler} from "./GuiUtils"
import {assertMainOrNode} from "../../api/common/Env"
import {assertNotNull} from "@tutao/tutanota-utils"

assertMainOrNode()

export const enum ButtonType {
	Action = "action",
	ActionLarge = "action-large",
	// action button with large icon
	Primary = "primary",
	Secondary = "secondary",
	Dropdown = "dropdown",
	Login = "login",
	Floating = "floating",
	Bubble = "bubble",
	TextBubble = "textBubble",
	Toggle = "toggle",
}

export const enum ButtonColor {
	Header = "header",
	Nav = "nav",
	Content = "content",
	Elevated = "elevated",
	DrawerNav = "drawernav",
}

export function getColors(
	buttonColors: ButtonColor | null | undefined,
): {
	border: string
	button: string
	button_icon_bg: string
	button_selected: string
	icon: string
	icon_selected: string
} {
	switch (buttonColors) {
		case ButtonColor.Nav:
			return {
				button: theme.navigation_button,
				button_selected: theme.navigation_button_selected,
				button_icon_bg: getNavButtonIconBackground(),
				icon: theme.navigation_button_icon,
				icon_selected: theme.navigation_button_icon_selected,
				border: theme.navigation_bg,
			}

		case ButtonColor.DrawerNav:
			return {
				button: theme.content_button,
				button_selected: theme.content_button_selected,
				button_icon_bg: "transparent",
				icon: getNavigationMenuIcon(),
				icon_selected: theme.content_button_icon_selected,
				border: getElevatedBackground(),
			}

		case ButtonColor.Elevated:
			return {
				button: theme.content_button,
				button_selected: theme.content_button_selected,
				button_icon_bg: getContentButtonIconBackground(),
				icon: theme.content_button_icon,
				icon_selected: theme.content_button_icon_selected,
				border: getElevatedBackground(),
			}

		case ButtonColor.Header:
			return {
				button: theme.content_button,
				button_selected: theme.content_button_selected,
				button_icon_bg: "transparent",
				icon: theme.header_button_selected,
				icon_selected: theme.content_button_icon_selected,
				border: theme.content_bg,
			}

		case ButtonColor.Content:
		default:
			return {
				button: theme.content_button,
				button_selected: theme.content_button_selected,
				button_icon_bg: getContentButtonIconBackground(),
				icon: theme.content_button_icon,
				icon_selected: theme.content_button_icon_selected,
				border: theme.content_bg,
			}
	}
}

export interface ButtonAttrs {
	label: TranslationKey | lazy<string>
	title?: TranslationKey | lazy<string>
	click?: clickHandler
	icon?: lazyIcon | null
	type?: ButtonType
	colors?: ButtonColor
	isSelected?: lazy<boolean>
	noBubble?: boolean
	staticRightText?: string,
	style?: Record<string, string>
}

/**
 * A button.
 */
export class ButtonN implements Component<ButtonAttrs> {
	private _domButton: HTMLElement | null = null

	view(vnode: Vnode<ButtonAttrs>): Children {
		const a = vnode.attrs
		const type = this.getType(a.type)
		const title = a.title !== undefined ? this.getTitle(a.title) : lang.getMaybeLazy(a.label)
		return m(
			"button.limit-width.noselect",
			{
				class: this.getButtonClasses(a).join(" "),
				style: this._getStyle(a),
				onclick: (event: MouseEvent) => this.click(event, a, assertNotNull(this._domButton)),
				title:
					type === ButtonType.Action || type === ButtonType.Dropdown || type === ButtonType.Login || type === ButtonType.Floating
						? lang.getMaybeLazy(a.label)
						: title,
				oncreate: vnode => {
					this._domButton = vnode.dom as HTMLButtonElement
				},
				onremove: vnode => removeFlash(vnode.dom),
			},
			m(
				"",
				{
					// additional wrapper for flex box styling as safari does not support flex box on buttons.
					class: this.getWrapperClasses(a).join(" "),
					style: {
						borderColor: getColors(a.colors).border,
					},
					oncreate: vnode => {
						if (type !== ButtonType.Toggle) {
							addFlash(vnode.dom)
						}
					},
					onremove: vnode => removeFlash(vnode.dom),
				},
				[
					this.getIcon(a),
					this._getLabelElement(a),
					a.staticRightText
						? m(
							".pl-s",
							{
								style: this._getLabelStyle(a),
							},
							a.staticRightText,
						)
						: null,
				],
			),
		)
	}

	_getStyle(a: ButtonAttrs): {} {
		return a.type === ButtonType.Login
			? {
				"border-radius": "3px",
				"background-color": theme.content_accent,
			}
			: {}
	}

	getTitle(title: TranslationKey | lazy<string>): string {
		return lang.getMaybeLazy(title)
	}

	getType(type: ButtonType | null | undefined): ButtonType {
		return type ? type : ButtonType.Action
	}

	getIcon(a: ButtonAttrs): Children {
		const icon = a.icon?.()
		return icon
			? m(Icon, {
				icon,
				class: this.getIconClass(a),
				style: {
					fill: this.getIconColor(a),
					"background-color": this.getIconBackgroundColor(a),
				},
			})
			: null
	}

	getIconColor(a: ButtonAttrs): string {
		const type = this.getType(a.type)

		if (type === ButtonType.Bubble) {
			return theme.button_bubble_fg
		} else if (type === ButtonType.Login) {
			return theme.content_button_icon_selected
		} else if (a.isSelected?.() || type === ButtonType.Floating) {
			return getColors(a.colors).icon_selected
		} else {
			return getColors(a.colors).icon
		}
	}

	getIconBackgroundColor(a: ButtonAttrs): string {
		const type = this.getType(a.type)

		if ([ButtonType.Toggle, ButtonType.Bubble, ButtonType.Login].includes(type)) {
			return "initial"
		} else if (a.isSelected?.() || type === ButtonType.Floating) {
			return getColors(a.colors).button_selected
		} else if (type === ButtonType.Action || type === ButtonType.Dropdown || type === ButtonType.ActionLarge) {
			return getColors(a.colors).button_icon_bg
		} else {
			return getColors(a.colors).button
		}
	}

	getIconClass(a: ButtonAttrs): string {
		const type = this.getType(a.type)

		if (type === ButtonType.Login) {
			return "flex-center items-center button-icon icon-xl pr-s"
		}

		if (type === ButtonType.ActionLarge) {
			return "flex-center items-center button-icon icon-large"
		} else if (type === ButtonType.Floating) {
			return "flex-center items-center button-icon floating icon-large"
		} else if (a.colors === ButtonColor.Header) {
			return "flex-end items-center button-icon icon-xl"
		} else if (a.colors === ButtonColor.DrawerNav) {
			return "flex-end items-end button-icon"
		} else if (type === ButtonType.Bubble) {
			return "pr-s"
		} else {
			return "flex-center items-center button-icon"
		}
	}

	getButtonClasses(a: ButtonAttrs): Array<string> {
		const type = this.getType(a.type)
		let buttonClasses = ["bg-transparent"]

		if (type === ButtonType.Floating) {
			buttonClasses.push("fixed-bottom-right")
			buttonClasses.push("large-button-height")
			buttonClasses.push("large-button-width")
			buttonClasses.push("floating")
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

	getWrapperClasses(a: ButtonAttrs): Array<string> {
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
			wrapperClasses.push(a.isSelected?.() ? "on" : "off")
		}

		return wrapperClasses
	}

	_getLabelElement(a: ButtonAttrs): Children {
		const type = this.getType(a.type)
		const label = lang.getMaybeLazy(a.label)

		if (label.trim() === "" || [ButtonType.Action, ButtonType.Floating].includes(type)) {
			return null
		}

		let classes = ["text-ellipsis"]

		if (type === ButtonType.Dropdown) {
			classes.push("pl-m")
		}

		if (type === ButtonType.Toggle) {
			classes.push("pr-s pb-2")

			if (!a.icon) {
				classes.push("pl-s")
			}
		}

		return m(
			"",
			{
				class: classes.join(" "),
				style: this._getLabelStyle(a),
			},
			label,
		)
	}

	_getLabelStyle(a: ButtonAttrs): {} {
		const type = this.getType(a.type)
		let color

		switch (type) {
			case ButtonType.Primary:
			case ButtonType.Secondary:
				color = theme.content_accent
				break

			case ButtonType.Toggle:
				color = theme.content_button_icon
				break

			case ButtonType.Login:
				color = theme.content_button_icon_selected
				break

			case ButtonType.Bubble:
			case ButtonType.TextBubble:
				color = theme.content_fg
				break

			default:
				color = a.isSelected?.() ? getColors(a.colors).button_selected : getColors(a.colors).button
		}

		return {
			color,
			"font-weight": type === ButtonType.Primary ? "bold" : "normal",
		}
	}

	click(event: MouseEvent, a: ButtonAttrs, dom: HTMLElement) {
		a.click?.(event, dom)

		if (a.noBubble) {
			event.stopPropagation()
		}
	}
}