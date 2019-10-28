// @flow
import {size} from "../size"
import m from "mithril"
import {lang} from "../../misc/LanguageViewModel"
import {addFlash, removeFlash} from "./Flash"
import type {PosRect} from "./Dropdown"
import {Dropdown} from "./Dropdown"
import {modal} from "./Modal"
import {assertMainOrNodeBoot} from "../../api/Env"
import type {AllIconsEnum, lazyIcon} from "./Icon"
import {Icon} from "./Icon"
import {getButtonIconBackground, theme} from "../theme"
import {asyncImport} from "../../api/common/utils/Utils"

assertMainOrNodeBoot()

export const ButtonType = Object.freeze({
	Action: 'action',
	ActionLarge: 'action-large', // action button with large icon
	Primary: 'primary',
	Secondary: 'secondary',
	Dropdown: 'dropdown',
	Login: 'login',
	Accent: 'accent',
	Floating: 'floating',
	Bubble: 'bubble',
	TextBubble: 'textBubble'
})
export type ButtonTypeEnum = $Values<typeof ButtonType>;

export const ButtonColors = Object.freeze({
	Nav: 'nav',
	Content: 'content',
	Elevated: 'elevated',
})
export type ButtonColorEnum = $Values<typeof ButtonColors>;

const TRUE_CLOSURE: lazy<boolean> = () => true

const FALSE_CLOSURE: lazy<boolean> = () => false

function getColors(buttonColors: ButtonColorEnum) {
	switch (buttonColors) {
		case ButtonColors.Nav:
			return {
				button: theme.navigation_button,
				button_selected: theme.navigation_button_selected,
				button_icon_bg: theme.navigation_button_icon_bg || theme.navigation_button,
				icon: theme.navigation_button_icon,
				icon_selected: theme.navigation_button_icon_selected,
			}
		case ButtonColors.Elevated:
			return {
				button: theme.content_button,
				button_selected: theme.content_button_selected,
				button_icon_bg: getButtonIconBackground(),
				icon: theme.content_button_icon,
				icon_selected: theme.content_button_icon_selected,
				border: theme.elevated_bg || theme.elevated_bg
			}
		case ButtonColors.Content:
			return {
				button: theme.content_button,
				button_icon_bg: getButtonIconBackground(),
				button_selected: theme.content_button_selected,
				icon: theme.content_button_icon,
				icon_selected: theme.content_button_icon_selected,
			}
		default:
			throw new Error("Illegal action button color: " + buttonColors)
	}
}

/**
 * A button.
 */
export class Button {
	_type: ButtonTypeEnum;
	clickHandler: clickHandler;
	propagateClickEvents: boolean;
	icon: ?lazyIcon;
	isVisible: lazy<boolean>;
	isActive: boolean;
	isSelected: lazy<boolean>;
	getLabel: lazy<string>;
	_domButton: HTMLElement;
	view: Function;
	_staticRightText: ?string;
	_colors: ButtonColorEnum;

	constructor(labelTextIdOrTextFunction: TranslationKey | lazy<string>, click: clickHandler, icon: ?lazyIcon) {
		this._type = ButtonType.Action
		this.clickHandler = click

		this.icon = icon
		this._colors = ButtonColors.Content
		this._staticRightText = null

		this.isVisible = TRUE_CLOSURE
		this.isActive = true
		this.isSelected = FALSE_CLOSURE
		this.propagateClickEvents = true
		this.getLabel = typeof labelTextIdOrTextFunction === "function"
			? labelTextIdOrTextFunction : lang.get.bind(lang, labelTextIdOrTextFunction)

		this.view = (): ?VirtualElement => {

			return m("button.limit-width.noselect" + ((this._type === ButtonType.Bubble) ? ".print" : ""), {
					class: this.getButtonClasses().join(' '),
					style: (this._type === ButtonType.Login || this._type === ButtonType.Accent) ? {
						'background-color': theme.content_accent,
					} : {},
					onclick: (event: MouseEvent) => this.click(event),
					title: (this._type === ButtonType.Action
						|| this._type === ButtonType.Bubble
						|| this._type === ButtonType.Dropdown
						|| this._type === ButtonType.Login
						|| this._type === ButtonType.Accent
						|| this._type === ButtonType.Floating)
						? this.getLabel()
						: "",
					oncreate: (vnode) => {
						this._domButton = vnode.dom
					},
					onbeforeremove: (vnode) => removeFlash(vnode.dom)
				}, m("", {// additional wrapper for flex box styling as safari does not support flex box on buttons.
					class: this.getWrapperClasses().join(' '),
					oncreate: (vnode) => {
						addFlash(vnode.dom)
					}
				}, [
					this.getIcon(),
					this._getLabelElement(),
					(this._staticRightText) ? m(".pl-s", {style: this._getLabelStyle()}, this._staticRightText) : null
				])
			)
		}
	}

	getIcon() {
		return (this.icon instanceof Function && this.icon()) ? m(Icon, {
			icon: this.icon(),
			class: this.getIconClass(),
			style: {
				fill: this.getIconColor(),
				'background-color': this.getIconBackgroundColor()
			}
		}) : null
	}

	getIconColor() {
		if (this._type === ButtonType.Bubble) {
			return theme.button_bubble_fg
		} else if (this.isSelected() || this._type === ButtonType.Floating) {
			return getColors(this._colors).icon_selected
		} else {
			return getColors(this._colors).icon
		}
	}

	getIconBackgroundColor() {
		if (this._type === ButtonType.Bubble) {
			return 'initial'
		} else if (this.isSelected() || this._type === ButtonType.Floating) {
			return getColors(this._colors).button_selected
		} else if (this._type === ButtonType.Action || this._type === ButtonType.Dropdown) {
			return getColors(this._colors).button_icon_bg
		} else {
			return getColors(this._colors).button
		}
	}

	getIconClass() {
		if (this._type === ButtonType.ActionLarge) {
			return "flex-center items-center button-icon icon-large"
		} else if (this._type === ButtonType.Floating) {
			return "flex-center items-center button-icon floating icon-large"
		} else if (this._type === ButtonType.Bubble) {
			return "pr-s"
		} else {
			return "flex-center items-center button-icon"
		}
	}

	getButtonClasses() {
		let buttonClasses = ["bg-transparent"]
		if (this._type === ButtonType.Floating) {
			buttonClasses.push("fixed-bottom-right")
			buttonClasses.push("large-button-height")
			buttonClasses.push("large-button-width")
			buttonClasses.push("floating")
		} else if (this._type === ButtonType.Action || this._type === ButtonType.ActionLarge) {
			buttonClasses.push("button-width-fixed") // set the button width for firefox browser
			buttonClasses.push("button-height") // set the button height for firefox browser
		} else if (this._type === ButtonType.Accent) {
			buttonClasses.push("button-height-accent")
		} else {
			buttonClasses.push("button-height") // set the button height for firefox browser
		}
		if (this._type === ButtonType.Login) {
			buttonClasses.push("full-width")
		}
		return buttonClasses
	}

	getWrapperClasses() {
		let wrapperClasses = ["button-content", "flex", "items-center", this._type]
		if (this._type !== ButtonType.Floating && this._type !== ButtonType.TextBubble) {
			wrapperClasses.push("plr-button")
		}
		if (this._type === ButtonType.Dropdown) {
			wrapperClasses.push("justify-start")
		} else if (this._type === ButtonType.Accent) {
			wrapperClasses.push("button-height-accent")
			wrapperClasses.push("mlr")
		} else {
			wrapperClasses.push("justify-center")
		}
		return wrapperClasses
	}

	_getLabelElement() {
		let classes = ["text-ellipsis"]
		if (this._type === ButtonType.Dropdown) {
			classes.push("pl-m")
		}
		if ([ButtonType.Action, ButtonType.Floating].indexOf(this._type) === -1) {

			return m("", {
				class: classes.join(' '),
				style: this._getLabelStyle()
			}, this.getLabel())
		} else {
			return null
		}
	}

	_getLabelStyle() {
		let color
		if (this._type === ButtonType.Primary || this._type === ButtonType.Secondary) {
			color = theme.content_accent
		} else if (this._type === ButtonType.Login || this._type === ButtonType.Accent) {
			color = theme.content_bg
		} else if (this._type === ButtonType.Bubble || this._type === ButtonType.TextBubble) {
			color = this.isSelected() ? getColors(this._colors).button_selected : theme.content_fg
		} else {
			color = this.isSelected() ? getColors(this._colors).button_selected : getColors(this._colors).button
		}
		return {
			color,
			'font-weight': (this._type === ButtonType.Primary) ? 'bold' : 'normal'
		}
	}

	/**
	 * This text is shown on the right of the main button label and never cut off (no ellipsis)
	 */
	setStaticRightText(text: string) {
		this._staticRightText = text
		m.redraw()
		return this
	}

	/**
	 * Only to be invoked by the DialogHeaderBar!
	 * @param {ButtonType} type
	 */
	setType(type: ButtonTypeEnum): Button {
		this._type = type
		return this
	}

	setColors(colors: ButtonColorEnum): Button {
		this._colors = colors
		return this
	}

	setSelected(selected: lazy<boolean>): Button {
		this.isSelected = selected
		return this
	}

	/**
	 * @param {function: boolean} isVisible The button is displayed, if this function returns true
	 * @returns {Button}
	 */
	setIsVisibleHandler(isVisible: lazy<boolean>): Button {
		this.isVisible = isVisible
		return this;
	}

	disableBubbling() {
		this.propagateClickEvents = false
		return this
	}

	getWidth(): number {
		if (this._type !== ButtonType.Action) throw new Error("width is not defined for buttons with type != action")
		return size.button_height
	}

	getHeight(): number {
		return size.button_height
	}

	click(event: MouseEvent) {
		this.clickHandler(event)
		// in IE the activeElement might not be defined and blur might not exist
		if (document.activeElement && typeof document.activeElement.blur === "function") {
			document.activeElement.blur()
		}
		if (!this.propagateClickEvents) {
			event.stopPropagation()
		}
	}
}

export function createDropDownButton(labelTextIdOrTextFunction: string | lazy<string>, icon: ?lazy<AllIconsEnum>,
                                     lazyButtons: lazy<$ReadOnlyArray<string | Button>>, width: number = 200,
                                     originOverride: ?(() => PosRect)): Button {
	return createAsyncDropDownButton(labelTextIdOrTextFunction, icon, () => Promise.resolve(lazyButtons()), width,
		originOverride)
}

export function createAsyncDropDownButton(labelTextIdOrTextFunction: string | lazy<string>, icon: ?lazyIcon,
                                          lazyButtons: lazyAsync<$ReadOnlyArray<string | Button>>,
                                          width: number = 200, originOverride: ?(() => PosRect))
	: Button {
	let mainButton = new Button(labelTextIdOrTextFunction, (() => {
		if (!mainButton.isActive) {
			return
		}
		let buttonPromise = lazyButtons()
		let resultPromise = buttonPromise
		if (!resultPromise.isFulfilled()) {
			resultPromise = asyncImport(typeof module !== "undefined" ? module.id : __moduleName,
				`${env.rootPathPrefix}src/gui/base/ProgressDialog.js`)
				.then(module => {
					return module.showProgressDialog("loading_msg", buttonPromise)
				})
		}
		const initialButtonRect: PosRect = mainButton._domButton.getBoundingClientRect()
		resultPromise.then(buttons => {
			if (buttons.length === 0) {
				asyncImport(typeof module !== "undefined" ? module.id : __moduleName,
					`${env.rootPathPrefix}src/gui/base/Dialog.js`)
					.then(module => {
						return module.Dialog.error("selectionNotAvailable_msg")
					})
			} else {
				mainButton.isActive = false
				let dropdown = new Dropdown(() => buttons, width)
				dropdown.closeHandler = () => {
					mainButton.isActive = true
				}
				if (mainButton._domButton) {
					let buttonRect: PosRect = mainButton._domButton.getBoundingClientRect()
					if (originOverride) {
						buttonRect = originOverride()
					} else if (buttonRect.width === 0 && buttonRect.height === 0) {
						// When new instance is created and the old DOM is detached we may have incorrect positioning
						buttonRect = initialButtonRect
					}
					dropdown.setOrigin(buttonRect)
					modal.display(dropdown)
				}
			}
		})
	}: clickHandler), icon)
	return mainButton
}

