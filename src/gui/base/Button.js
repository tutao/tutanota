// @flow
import {size} from "../size"
import {noselect} from "../mixins"
import m from "mithril"
import {lang} from "../../misc/LanguageViewModel"
import {flash} from "./Ripple"
import {NavButton} from "./NavButton"
import {Dropdown} from "./Dropdown"
import {modal} from "./Modal"
import {assertMainOrNode} from "../../api/Env"
import {Icon} from "./Icon"
import {theme} from "../theme"
import {Dialog} from "./Dialog"

assertMainOrNode()

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

export const ButtonColors = {
	Header: 'header',
	Nav: 'nav',
	Content: 'content',
}

const TRUE_CLOSURE = (): lazy<boolean> => true

const FALSE_CLOSURE = (): lazy<boolean> => false

export function getColors(buttonColors: ButtonColorEnum) {
	switch (buttonColors) {
		case ButtonColors.Header:
			return {
				button: theme.navigation_button,
				button_selected: theme.navigation_button_selected,
				icon: theme.navigation_button_icon,
				icon_selected: theme.navigation_button_icon_selected,
			}
		case ButtonColors.Nav:
			return {
				button: theme.header_button,
				button_selected: theme.header_button_selected,
				icon: theme.header_button_icon,
				icon_selected: theme.header_button_icon_selected,
			}
		default:
			return {
				button: theme.content_button,
				button_selected: theme.content_button_selected,
				icon: theme.content_button_icon,
				icon_selected: theme.content_button_icon_selected,
			}
	}
}

/**
 * A button.
 */
export class Button {
	_type: ButtonTypeEnum;
	clickHandler: clickHandler;
	bubble: boolean;
	icon: ?lazy<Vnode<IconAttrs>>;
	isVisible: lazy<boolean>;
	isSelected: lazy<boolean>;
	getLabel: lazy<string>;
	_domButton: HTMLElement;
	view: Function;
	_staticRightText: ?string;
	_colors: ButtonColorEnum;

	constructor(labelTextIdOrTextFunction: string|lazy<string>, click: clickHandler, icon: ?lazy<SVG>) {
		this._type = ButtonType.Action
		this.clickHandler = click

		this.icon = icon
		this._colors = ButtonColors.Content
		this._staticRightText = null

		this.isVisible = TRUE_CLOSURE
		this.isSelected = FALSE_CLOSURE
		this.bubble = true
		this.getLabel = labelTextIdOrTextFunction instanceof Function ? labelTextIdOrTextFunction : lang.get.bind(lang, labelTextIdOrTextFunction)

		this.view = (): ?VirtualElement => {

			return m("button.limit-width.noselect", {
					class: this.getButtonClasses().join(' '),
					style: this._type === ButtonType.Login ? {
							'background-color': theme.content_accent,
						} : {},
					onclick: (event: MouseEvent) => this.click(event),
					title: (this._type === ButtonType.Action || this._type == ButtonType.Bubble || this._type == ButtonType.Dropdown) || this._type == ButtonType.Login ? this.getLabel() : "",
					oncreate: (vnode) => this._domButton = vnode.dom
				}, m("", {// additional wrapper for flex box styling as safari does not support flex box on buttons.
					class: this.getWrapperClasses().join(' '),
				}, [
					this.getIcon(),
					this._getLabelElement(),
					(this._staticRightText) ? m(".pl-s", this._staticRightText) : null
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
		if (this._type == ButtonType.Bubble) {
			return theme.button_bubble_fg
		} else if (this.isSelected() || this._type === ButtonType.Floating) {
			return getColors(this._colors).icon_selected
		} else {
			return getColors(this._colors).icon
		}
	}

	getIconBackgroundColor() {
		if (this._type == ButtonType.Bubble) {
			return 'initial'
		} else if (this.isSelected() || this._type === ButtonType.Floating) {
			return getColors(this._colors).button_selected
		} else {
			return getColors(this._colors).button
		}
	}

	getIconClass() {
		if (this._type == ButtonType.ActionLarge) {
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

		if (this._type == ButtonType.Floating) {
			buttonClasses.push("fixed-bottom-right")
			buttonClasses.push("large-button-height")
			buttonClasses.push("large-button-width")
		} else if (this._type == ButtonType.Action || this._type == ButtonType.ActionLarge) {
			buttonClasses.push("button-width-fixed") // set the button width for firefox browser
			buttonClasses.push("button-height") // set the button height for firefox browser
		} else {
			buttonClasses.push("button-height") // set the button height for firefox browser
		}
		if (this._type == ButtonType.Login) {
			buttonClasses.push("full-width")
		}
		return buttonClasses
	}

	getWrapperClasses() {
		let wrapperClasses = ["button-content", "flex", "items-center", this._type]
		if (this._type != ButtonType.Floating && this._type != ButtonType.TextBubble) {
			wrapperClasses.push("plr-button")
		}
		if (this._type == ButtonType.Dropdown) {
			wrapperClasses.push("justify-start")
		} else {
			wrapperClasses.push("justify-center")
		}
		return wrapperClasses
	}

	_getLabelElement(): ?VirtualElement {
		let classes = ["text-ellipsis"]
		if (this._type == ButtonType.Dropdown) {
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
		} else if (this._type === ButtonType.Login) {
			color = theme.content_button_icon
		} else if (this._type === ButtonType.Bubble) {
			color = theme.button_bubble_fg
		} else {
			color = this.isSelected() ? getColors(this._colors).button_selected : getColors(this._colors).button
		}
		return {
			color,
			'font-weight': (this._type == ButtonType.Primary) ? 'bold' : 'normal'
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
		this.bubble = false
		return this
	}

	getWidth(): number {
		if (this._type != ButtonType.Action) throw new Error("width is not defined for buttons with type != action")
		return size.button_height
	}

	getHeight(): number {
		return size.button_height
	}

	click(event: MouseEvent) {
		if (this._domButton) {
			flash(this._domButton)
		}
		this.clickHandler(event)
		// in IE the activeElement might not be defined and blur might not exist
		if (document.activeElement && document.activeElement.blur instanceof Function) {
			document.activeElement.blur()
		}
		if (!this.bubble) {
			event.stopPropagation()
		}
	}
}

export function createDropDownButton(labelTextIdOrTextFunction: string|lazy<string>, icon: ?lazy<SVG>, lazyButtons: lazy<Array<string|NavButton|Button>>, width: number = 200): Button {
	return createAsyncDropDownButton(labelTextIdOrTextFunction, icon, () => Promise.resolve(lazyButtons()), width)
}

export function createAsyncDropDownButton(labelTextIdOrTextFunction: string|lazy<string>, icon: ?lazy<SVG>, lazyButtons: lazyAsync<Array<string|NavButton|Button>>, width: number = 200): Button {
	let mainButton = new Button(labelTextIdOrTextFunction, (() => {
		let buttonPromise = lazyButtons()
		if (!buttonPromise.isFulfilled()) {
			buttonPromise = Dialog.progress("loading_msg", buttonPromise)
		}
		buttonPromise.then(buttons => {
			let dropdown = new Dropdown(() => buttons, width)
			if (mainButton._domButton) {
				let buttonRect: ClientRect = mainButton._domButton.getBoundingClientRect()
				dropdown.setOrigin(buttonRect)
				modal.display(dropdown)
				let valueStream = modal.onclick.map(e => {
					if (valueStream && !mainButton._domButton.contains(e.target) && dropdown.closeOnClickAllowed(e.target)) {
						valueStream.end(true)
						modal.remove(dropdown)
					}
				})
			}
		})
	}:clickHandler), icon)
	return mainButton
}

export function createDropDownNavButton(labelTextIdOrTextFunction: string|lazy<string>, icon: ?lazy<SVG>, lazyButtons: lazy<Array<string|NavButton|Button>>, width: number = 200): NavButton {
	let dropdown = new Dropdown(lazyButtons, width)
	let mainButton = new NavButton(labelTextIdOrTextFunction, icon, () => m.route.get())
		.setClickHandler((() => {
			if (mainButton._domButton) {
				let buttonRect: ClientRect = mainButton._domButton.getBoundingClientRect()
				dropdown.setOrigin(buttonRect)
				modal.display(dropdown)
				let valueStream = modal.onclick.map(e => {
					if (valueStream && !mainButton._domButton.contains(e.target) && dropdown.closeOnClickAllowed(e.target)) {
						valueStream.end(true)
						modal.remove(dropdown)
					}
				})
			}
		}:clickHandler))
	return mainButton
}