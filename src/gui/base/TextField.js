// @flow
import {size, px, inputLineHeight} from "../size"
import m from "mithril"
import stream from "mithril/stream/stream.js"
import {lang} from "../../misc/LanguageViewModel"
import {animations, fontSize, transform} from "./../animation/Animations"
import {ease} from "../animation/Easing"
import {assertMainOrNodeBoot} from "../../api/Env"
import {theme} from "../theme"

assertMainOrNodeBoot()

const FALSE_CLOSURE = () => {
	return false
}

export const Type = {
	Text: "text",
	Email: "email",
	Password: "password",
	Area: "area",
	ExternalPassword: "externalpassword",
}
export type TextFieldTypeEnum = $Values<typeof Type>;


const inputMarginTop = size.font_size_small + size.hpad_small + 3

/**
 * A text input field.
 */
export class TextField {
	label: string | lazy<string>; // The labelId visible on the button. The labelId is not shown, if it is not provided.
	helpLabel: ?lazy<string>; // returns the translated and formatted help labelId
	value: Stream<string>;
	type: TextFieldTypeEnum;
	baseLabelPosition: number;
	_baseLabel: boolean;
	active: boolean;
	webkitAutofill: boolean;
	disabled: boolean;
	_injectionsLeft: ?Function; // only used by the BubbleTextField to display bubbles
	_injectionsRight: ?Function;
	_domWrapper: HTMLElement;
	_domLabel: HTMLElement;
	_domInput: HTMLInputElement;
	view: Function;
	onblur: stream<void>;
	skipNextBlur: boolean;
	_keyHandler: keyHandler; // interceptor used by the BubbleTextField to react on certain keys
	_alignRight: boolean;

	isEmpty: Function;

	constructor(labelIdOrLabelTextFunction: string | lazy<string>, helpLabel: ?lazy<string>) {
		this.label = labelIdOrLabelTextFunction
		this.active = false
		this.webkitAutofill = false
		this.disabled = false
		this.helpLabel = helpLabel
		this.value = stream("")
		this.value.map(v => {
			if (this._domInput) {
				if (this.value !== this._domInput.value) {
					this._domInput.value = this.value()
				}
			}
		})
		this.type = Type.Text
		this.baseLabelPosition = size.text_field_label_top
		this._baseLabel = true
		this.onblur = stream()
		this.skipNextBlur = false
		this._keyHandler = null

		this.view = (): VirtualElement => {
			return m(".text-field.rel.overflow-hidden.pt", {
				oncreate: (vnode) => this._domWrapper = vnode.dom,
				onclick: (e) => this.focus(),
				class: !this.disabled ? "text" : null
			}, [
				m("label.abs.text-ellipsis.noselect.backface_fix.z1.i.pr-s", {
					class: this.active ? "content-accent-fg" : "",
					oncreate: (vnode) => {
						this._domLabel = vnode.dom
						this._baseLabel = this.isEmpty() && !this.disabled // needed for BubbleTextField in Firefox. BubbleTextField overwrites isEmpty() so it must be called initially
						if (this._baseLabel) { // if the text field is disabled do not show the label in base position.
							this._domLabel.style.fontSize = px(size.font_size_base)
							this._domLabel.style.transform = 'translateY(' + this.baseLabelPosition + "px)"
						} else {
							this._domLabel.style.fontSize = px(size.font_size_small)
							this._domLabel.style.transform = 'translateY(' + 0 + "px)"
						}
					},
				}, this.label instanceof Function ? this.label() : lang.get(this.label)),
				m(".flex.flex-column", [ // another wrapper to fix IE 11 min-height bug https://github.com/philipwalton/flexbugs#3-min-height-on-a-flex-container-wont-apply-to-its-flex-items
					m(".flex.items-end.flex-wrap", {
						style: {
							'min-height': px(size.button_height + 2), // 2 px border
							'padding-bottom': this.active ? px(0) : px(1),
							'border-bottom': this.active ? `2px solid ${theme.content_accent}` : `1px solid ${theme.content_border}`,
						},
					}, [
						this._injectionsLeft ? this._injectionsLeft() : null,
						m(".inputWrapper.flex-space-between.items-end", {}, [ // additional wrapper element for bubble input field. input field should always be in one line with right injections
							this.type !== Type.Area ? this._getInputField() : this._getTextArea(),
							this._injectionsRight ? m(".mr-negative-s.flex-end.flex-fixed", this._injectionsRight()) : null
						])
					]),
				]),
				this.helpLabel ? m("div.small.noselect.click", {
					onclick: () => {
						if (this._domInput) this._domInput.focus()
					}
				}, this.helpLabel()) : []
			])
		}

		this.isEmpty = (): boolean => {
			return this.value() === ''
		}
	}

	_getInputField(): VirtualElement {
		if (this.disabled) {
			return m(".text-break.selectable" + (this._alignRight ? ".right" : ""), {
				style: {
					marginTop: px(inputMarginTop),
					lineHeight: px(inputLineHeight),
				}
			}, this.value())
		} else {
			return m("input.input" + (this._alignRight ? ".right" : ""), {
				type: (this.type === Type.ExternalPassword) ? (this.isActive() ? Type.Text : Type.Password) : this.type,
				oncreate: (vnode) => {
					this._domInput = vnode.dom
					if (this.type !== Type.Area) {
						vnode.dom.addEventListener('animationstart', e => {
							if (e.animationName === "onAutoFillStart") {
								this.webkitAutofill = true
								this.animate()
							} else if (e.animationName === "onAutoFillCancel") {
								this.webkitAutofill = false
								this.animate()
							}
						})
					}
					if (this.type !== Type.Password) {
						this._domInput.value = this.value() // chrome autofill does not work on password fields if the value has been set before
					}
				},
				onfocus: (e) => this.focus(),
				onblur: e => this.blur(e),
				onkeydown: e => {
					// keydown is used to cancel certain keypresses of the user (mainly needed for the BubbleTextField)
					let key = {keyCode: e.which, ctrl: e.ctrlKey}
					if (this._domInput.value !== this.value()) {
						this.value(this._domInput.value) // password managers like CKPX set the value directly and only send a key event (oninput is not invoked), e.g. https://github.com/subdavis/Tusk/blob/9eecda720c1ecfe5d44af89fb96125cfd9921f2a/background/inject.js#L191
						if (this._domInput.value !== "" && !this.active) {
							this.animate()
						}
					}
					return this._keyHandler != null ? this._keyHandler(key) : true
				},
				onremove: e => {
					// fix for mithril bug that occurs on login, if the cursor is positioned in the password field and enter is pressed to invoke the login action ("Failed to execute 'removeChild' on 'Node': The node to be removed is no longer a child of this node. Perhaps it was moved in a 'blur' event handler?")
					// TODO test if still needed with newer mithril releases
					this._domInput.onblur = null
				},
				oninput: e => {
					if (this.isEmpty() && this._domInput.value !== "" && !this.active && !this.webkitAutofill) {
						this.animate() // animate in case of browser autocompletion (non-webkit)
					}
					this.value(this._domInput.value) // update the input on each change
				},
				style: {
					"min-width": px(20), // fix for edge browser. buttons are cut off in small windows otherwise
					"line-height": px(inputLineHeight),
					"min-height": px(inputLineHeight),
				}
			})
		}
	}

	_getTextArea(): VirtualElement {
		if (this.disabled) {
			return m(".text-prewrap.text-break.selectable", {
				style: {
					marginTop: px(inputMarginTop),
					lineHeight: px(inputLineHeight),
				}
			}, this.value())
		} else {
			return m("textarea.input-area.text-pre", {
				oncreate: (vnode) => {
					this._domInput = vnode.dom
					this._domInput.value = this.value()
					this._domInput.style.height = px(Math.max(this.value().split("\n").length, 1) * inputLineHeight) // display all lines on creation of text area
				},
				onfocus: (e) => this.focus(),
				onblur: e => this.blur(e),
				onkeydown: e => {
					let key = {keyCode: e.which, ctrl: e.ctrlKey, shift: e.shiftKey}
					return this._keyHandler != null ? this._keyHandler(key) : true
				},
				oninput: e => {
					if (this.isEmpty() && this._domInput.value !== "" && !this.active) {
						this.animate() // animate in case of browser autocompletion
					}
					this._domInput.style.height = '0px'
					this._domInput.style.height = px(this._domInput.scrollHeight)
					this.value(this._domInput.value) // update the input on each change
				},
				style: {
					marginTop: px(inputMarginTop),
					lineHeight: px(inputLineHeight),
					minWidth: px(20) // fix for edge browser. buttons are cut off in small windows otherwise
				}
			})
		}
	}

	setType(type: TextFieldTypeEnum): TextField {
		this.type = type
		return this
	}

	setValue(value: ?string): TextField {
		this.value(value ? value : "")
		return this
	}

	onUpdate(updateHandler: handler<string>): TextField {
		this.value.map(updateHandler)
		return this
	}

	setDisabled(): TextField {
		this.disabled = true
		this._baseLabel = false
		return this
	}

	alignRight(): TextField {
		this._alignRight = true
		return this
	}

	focus() {
		if (!this.isActive() && !this.disabled) {
			this.active = true
			if (this._domInput) {
				this._domInput.focus()
				this._domWrapper.classList.add("active")
				this.animate()
			}
		}
	}

	blur(e: MouseEvent) {
		if (this.skipNextBlur) {
			this._domInput.focus()
		} else {
			this._domWrapper.classList.remove("active")
			this.animate()
			this.active = false
			this.onblur(e)
		}
		this.skipNextBlur = false
	}

	animate() {
		window.requestAnimationFrame(() => {
			if (this._baseLabel && ((!this.isEmpty() && !this.disabled) || this.webkitAutofill || this.active)) {
				let fontSizes = [size.font_size_base, size.font_size_small]
				let top = [this.baseLabelPosition, 0]
				this._baseLabel = false
				return animations.add(this._domLabel, [
					fontSize(fontSizes[0], fontSizes[1]),
					transform(transform.type.translateY, top[0], top[1])
				], {easing: ease.out})
			} else if (!this._baseLabel && (this.isEmpty() && !this.disabled && !this.webkitAutofill && !this.active)) {
				let fontSizes = [size.font_size_small, size.font_size_base]
				let top = [0, this.baseLabelPosition]
				this._baseLabel = true
				return animations.add(this._domLabel, [
					fontSize(fontSizes[0], fontSizes[1]),
					transform(transform.type.translateY, top[0], top[1])
				], {easing: ease.out})
			}
		})
	}

	isActive(): boolean {
		return this.active
	}

}
