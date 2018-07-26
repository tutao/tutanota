// @flow
import {size} from "../size"
import {noselect} from "../mixins"
import m from "mithril"
import {lang} from "../../misc/LanguageViewModel"
import {removeFlash, addFlash} from "./Flash"
import {NavButton} from "./NavButton"
import {Dropdown} from "./Dropdown"
import {modal} from "./Modal"
import {assertMainOrNodeBoot} from "../../api/Env"
import {Icon} from "./Icon"
import {theme} from "../theme"
import {asyncImport} from "../../api/common/utils/Utils"

assertMainOrNodeBoot()

export const ButtonType = {
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
}
export type ButtonTypeEnum = $Values<typeof ButtonType>;

export const ButtonColors = {
	Nav: 'nav',
	Content: 'content',
}
export type ButtonColorEnum = $Values<typeof ButtonColors>;

const TRUE_CLOSURE = (): lazy<boolean> => true

const FALSE_CLOSURE = (): lazy<boolean> => false

function getColors(buttonColors: ButtonColorEnum) {
	switch (buttonColors) {
		case ButtonColors.Nav:
			return {
				button: theme.navigation_button,
				button_selected: theme.navigation_button_selected,
				icon: theme.navigation_button_icon,
				icon_selected: theme.navigation_button_icon_selected,
			}
		case ButtonColors.Content:
			return {
				button: theme.content_button,
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
	icon: ?lazy<Vnode<IconAttrs>>;
	isVisible: lazy<boolean>;
	isSelected: lazy<boolean>;
	getLabel: lazy<string>;
	_domButton: HTMLElement;
	view: Function;
	_staticRightText: ?string;
	_colors: ButtonColorEnum;

	constructor(labelTextIdOrTextFunction: string | lazy<string>, click: clickHandler, icon: ?lazy<SVG>) {
		this._type = ButtonType.Action
		this.clickHandler = click

		this.icon = icon
		this._colors = ButtonColors.Content
		this._staticRightText = null

		this.isVisible = TRUE_CLOSURE
		this.isSelected = FALSE_CLOSURE
		this.propagateClickEvents = true
		this.getLabel = labelTextIdOrTextFunction instanceof Function
			? labelTextIdOrTextFunction : lang.get.bind(lang, labelTextIdOrTextFunction)

		this.view = (): ?VirtualElement => {

			return m("button.limit-width.noselect" + ((this._type === ButtonType.Bubble) ? ".print" : ""), {
					class: this.getButtonClasses().join(' '),
					style: (this._type === ButtonType.Login || this._type === ButtonType.Accent) ? {
						'background-color': theme.content_accent,
					} : {},
					onclick: (event: MouseEvent) => this.click(event),
					title: (this._type === ButtonType.Action || this._type === ButtonType.Bubble
						|| this._type === ButtonType.Dropdown) || this._type === ButtonType.Login
					|| this._type === ButtonType.Accent ? this.getLabel() : "",
					oncreate: (vnode) => {
						this._domButton = vnode.dom
						addFlash(vnode.dom)
					},
					onbeforeremove: (vnode) => removeFlash(vnode.dom)
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
			color = theme.content_button_icon
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

export function createDropDownButton(labelTextIdOrTextFunction: string | lazy<string>, icon: ?lazy<SVG>, lazyButtons: lazy<Array<string | NavButton | Button>>, width: number = 200): Button {
	return createAsyncDropDownButton(labelTextIdOrTextFunction, icon, () => Promise.resolve(lazyButtons()), width)
}

export function createAsyncDropDownButton(labelTextIdOrTextFunction: string | lazy<string>, icon: ?lazy<SVG>, lazyButtons: lazyAsync<Array<string | NavButton | Button>>, width: number = 200): Button {
	let mainButton = new Button(labelTextIdOrTextFunction, (() => {
		let buttonPromise = lazyButtons()
		let resultPromise = buttonPromise
		if (!resultPromise.isFulfilled()) {
			resultPromise = asyncImport(typeof module !== "undefined" ? module.id : __moduleName,
				`${env.rootPathPrefix}src/gui/base/ProgressDialog.js`)
				.then(module => {
					return module.showProgressDialog("loading_msg", buttonPromise)
				})
		}
		resultPromise.then(buttons => {
			if (buttons.length === 0) {
				asyncImport(typeof module !== "undefined" ? module.id : __moduleName,
					`${env.rootPathPrefix}src/gui/base/Dialog.js`)
					.then(module => {
						return module.Dialog.error("selectionNotAvailable_msg")
					})
			} else {
				let dropdown = new Dropdown(() => buttons, width)
				if (mainButton._domButton) {
					let buttonRect: ClientRect = mainButton._domButton.getBoundingClientRect()
					dropdown.setOrigin(buttonRect)
					modal.display(dropdown)
				}
			}
		})
	}: clickHandler), icon)
	return mainButton
}

