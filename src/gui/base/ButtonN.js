// @flow
import m from "mithril"
import {lang} from "../../misc/LanguageViewModel"
import {addFlash, removeFlash} from "./Flash"
import {assertMainOrNodeBoot} from "../../api/Env"
import type {lazyIcon} from "./Icon"
import {Icon} from "./Icon"
import {theme} from "../theme"
import {styles} from "../styles"
import {modal} from "./Modal"
import type {NavButtonAttrs} from "./NavButtonN"
import {DropdownN} from "./DropdownN"
import {asyncImport} from "../../api/common/utils/Utils"

assertMainOrNodeBoot()

export const ButtonType = {
	Action: 'action',
	ActionLarge: 'action-large', // action button with large icon
	Primary: 'primary',
	Secondary: 'secondary',
	Dropdown: 'dropdown',
	Login: 'login',
	Floating: 'floating',
	Bubble: 'bubble',
	TextBubble: 'textBubble'
}
export type ButtonTypeEnum = $Values<typeof ButtonType>;

export const ButtonColors = {
	Header: 'header',
	Nav: 'nav',
	Content: 'content',
}
export type ButtonColorEnum = $Values<typeof ButtonColors>;

const TRUE_CLOSURE = (): lazy<boolean> => true

const FALSE_CLOSURE = (): lazy<boolean> => false

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

export type ButtonAttrs = {|
	label: string | lazy<string>,
	click: clickHandler,
	icon?: lazyIcon,
	type?: ButtonTypeEnum,
	colors?: ButtonColorEnum,
	isVisible?: lazy<boolean>,
	isSelected?: lazy<boolean>,
	noBubble?: boolean,
	staticRightText?: string
|}

/**
 * A button.
 */
class _Button {
	_domButton: HTMLElement;

	view(vnode: Vnode<ButtonAttrs>) {
		const a = vnode.attrs
		return m("button.limit-width.noselect", {
				class: this.getButtonClasses(a).join(' '),
				style: vnode.attrs.type === ButtonType.Login ? {
					'background-color': theme.content_accent,
				} : {},
				onclick: (event: MouseEvent) => this.click(event, a),
				title: (vnode.attrs.type === ButtonType.Action || vnode.attrs.type === ButtonType.Bubble
					|| vnode.attrs.type === ButtonType.Dropdown)
				|| vnode.attrs.type === ButtonType.Login ? this.getLabel() : "",
				oncreate: (vnode) => {
					this._domButton = vnode.dom
					addFlash(vnode.dom)
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

	getLabel(label: string | lazy<string>): string {
		return label instanceof Function ? label() : lang.get(label)
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
		} else if (this.isSelected(a) || this.getType(a.type) === ButtonType.Floating) {
			return getColors(a.colors).icon_selected
		} else {
			return getColors(a.colors).icon
		}
	}

	getIconBackgroundColor(a: ButtonAttrs) {
		const type = this.getType(a.type)
		if (type === ButtonType.Bubble) {
			return 'initial'
		} else if (this.isSelected(a) || type === ButtonType.Floating) {
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
		} else if (type === ButtonType.Bubble) {
			return "pr-s"
		} else if (a.colors === ButtonColors.Header && !styles.isDesktopLayout()) {
			return "flex-end items-center button-icon icon-xl"
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
		} else if (type === ButtonType.Action || type === ButtonType.ActionLarge) {
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
		if (type !== ButtonType.Floating && type !== ButtonType.TextBubble) {
			wrapperClasses.push("plr-button")
		}
		if (type === ButtonType.Dropdown) {
			wrapperClasses.push("justify-start")
		} else {
			wrapperClasses.push("justify-center")
		}
		return wrapperClasses
	}

	_getLabelElement(a: ButtonAttrs) {
		const type = this.getType(a.type)
		let classes = ["text-ellipsis"]
		if (type === ButtonType.Dropdown) {
			classes.push("pl-m")
		}
		if ([ButtonType.Action, ButtonType.Floating].indexOf(type) === -1) {

			return m("", {
				class: classes.join(' '),
				style: this._getLabelStyle(a)
			}, this.getLabel(a.label))
		} else {
			return null
		}
	}

	_getLabelStyle(a: ButtonAttrs) {
		const type = this.getType(a.type)
		let color
		if (type === ButtonType.Primary || type === ButtonType.Secondary) {
			color = theme.content_accent
		} else if (type === ButtonType.Login) {
			color = theme.content_button_icon
		} else if (type === ButtonType.Bubble || type === ButtonType.TextBubble) {
			color = theme.content_fg
		} else {
			color = this.isSelected(a) ? getColors(a.colors).button_selected : getColors(a.colors).button
		}
		return {
			color,
			'font-weight': (type === ButtonType.Primary) ? 'bold' : 'normal'
		}
	}

	click(event: MouseEvent, a: ButtonAttrs) {
		a.click(event)
		// in IE the activeElement might not be defined and blur might not exist
		if (document.activeElement && typeof document.activeElement.blur === "function") {
			document.activeElement.blur()
		}
		if (a.noBubble) {
			event.stopPropagation()
		}
	}

	isSelected(a: ButtonAttrs) {
		return typeof a.isSelected === "function" ? a.isSelected() : false
	}
}

export const ButtonN: Class<MComponent<ButtonAttrs>> = _Button

export function createDropDown(lazyButtons: lazy<Array<string | NavButtonAttrs | ButtonAttrs>>, width: number = 200): clickHandler {
	return createAsyncDropDown(() => Promise.resolve(lazyButtons()), width)
}

export function createAsyncDropDown(lazyButtons: lazyAsync<Array<string | NavButtonAttrs | ButtonAttrs>>, width: number = 200): clickHandler {
	return ((e) => {
		let buttonPromise = lazyButtons()
		if (!buttonPromise.isFulfilled()) {
			buttonPromise = asyncImport(typeof module !== "undefined" ? module.id : __moduleName,
				`${env.rootPathPrefix}src/gui/base/ProgressDialog.js`)
				.then(module => {
					return module.showProgressDialog("loading_msg", buttonPromise)
				})
		}
		buttonPromise.then(buttons => {
			let dropdown = new DropdownN(() => buttons, width)
			if (e.currentTarget) {
				let buttonRect: ClientRect = e.currentTarget.getBoundingClientRect()
				dropdown.setOrigin(buttonRect)
				modal.display(dropdown)
			}
		})
	}: clickHandler)
}

export function isVisible(a: NavButtonAttrs | ButtonAttrs) {
	return a.isVisible ? a.isVisible() : true
}