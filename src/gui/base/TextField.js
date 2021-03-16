// @flow
import {inputLineHeight, px, size} from "../size"
import m from "mithril"
import stream from "mithril/stream/stream.js"
import type {TranslationKey} from "../../misc/LanguageViewModel"
import {lang} from "../../misc/LanguageViewModel"
import {animations, fontSize, transform} from "../animation/Animations"
import {ease} from "../animation/Easing"
import {assertMainOrNode} from "../../api/common/Env"
import {theme} from "../theme"
import type {keyHandler} from "../../misc/KeyManager"
import {TabIndex} from "../../api/common/TutanotaConstants"

assertMainOrNode()

export const Type = Object.freeze({
	Text: "text",
	Email: "email",
	Password: "password",
	Area: "area",
})

export type TextFieldTypeEnum = $Values<typeof Type>;


export const inputMarginTop: number = size.font_size_small + size.hpad_small + 3

/**
 * A text input field.
 */
export class TextField {
	label: TranslationKey | lazy<string>; // The labelId visible on the button. The labelId is not shown, if it is not provided.
	helpLabel: ?lazy<Children>; // returns the translated and formatted help labelId
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
	_domInput: ?HTMLInputElement;
	view: Function;
	onblur: Stream<*>;
	skipNextBlur: boolean;
	_keyHandler: ?keyHandler; // interceptor used by the BubbleTextField to react on certain keys
	_alignRight: boolean;
	_preventAutofill: boolean;
	autocomplete: string;

	isEmpty: Function;

	constructor(labelIdOrLabelTextFunction: TranslationKey | lazy<string>, helpLabel: ?lazy<Children>) {
		this.label = labelIdOrLabelTextFunction
		this.active = false
		this.webkitAutofill = false
		this.disabled = false
		this.helpLabel = helpLabel
		this.value = stream("")
		this.autocomplete = ""
		this.value.map(v => {
			if (this._domInput) {
				const input = this._domInput
				if (this.value() !== input.value) {
					input.value = this.value()
				}
			}
		})
		this.type = Type.Text
		this.baseLabelPosition = size.text_field_label_top
		this._baseLabel = true
		this.onblur = stream()
		this.skipNextBlur = false
		this._keyHandler = null
		this._preventAutofill = false

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
				}, lang.getMaybeLazy(this.label)),
				m(".flex.flex-column", [ // another wrapper to fix IE 11 min-height bug https://github.com/philipwalton/flexbugs#3-min-height-on-a-flex-container-wont-apply-to-its-flex-items
					m(".flex.items-end.flex-wrap", {
						style: {
							'min-height': px(size.button_height + 2), // 2 px border
							'padding-bottom': this.active ? px(0) : px(1),
							'border-bottom': this.active ? `2px solid ${theme.content_accent}` : `1px solid ${theme.content_border}`,
						},
					}, [
						this._injectionsLeft ? this._injectionsLeft() : null,
						m(".inputWrapper.flex-space-between.items-end", [ // additional wrapper element for bubble input field. input field should always be in one line with right injections
							this.type !== Type.Area ? this._getInputField() : this._getTextArea(),
							this._injectionsRight ? m(".mr-negative-s.flex-end.flex-fixed", this._injectionsRight()) : null
						])
					]),
				]),
				this.helpLabel
					? m("div.small.noselect.click", {
						onclick: () => {
							if (this._domInput) this._domInput.focus()
						}
					}, this.helpLabel())
					: []
			])
		}

		this.isEmpty = (): boolean => {
			return this.value() === ''
		}
	}

	updateValue() {
		const input = this._domInput
		if (input) {
			const inputValue = input.value
			if (this.value() !== inputValue) {
				const oldValue = this.value()
				this.value(inputValue)
				if ((oldValue == null || oldValue === "") && inputValue !== "" && !this.active) {
					this.animate() // animate in case of browser autocompletion (non-webkit)
				}
			}
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
			const typeAttr = this.type
			// Due to modern browser's 'smart' password managers that try to autofill everything
			// that remotely resembles a password field, we prepend invisible inputs to password fields
			// that shouldn't be autofilled.
			// since the autofill algorithm looks at inputs that come before and after the password field we need
			// three dummies.
			//
			// If it is ExternalPassword type, we hide input and show substitute element when the field is not active.
			// This is mostly done to prevent autofill which happens if the field type="password".
			const autofillGuard = this._preventAutofill ? [
				m("input.abs", {style: {opacity: '0', height: '0'}, tabIndex: TabIndex.Programmatic, type: Type.Text}),
				m("input.abs", {style: {opacity: '0', height: '0'}, tabIndex: TabIndex.Programmatic, type: Type.Password}),
				m("input.abs", {style: {opacity: '0', height: '0'}, tabIndex: TabIndex.Programmatic, type: Type.Text})
			] : []

			return m('.flex-grow', autofillGuard.concat(
				m("input.input[tabindex=0]" + (this._alignRight ? ".right" : ""), {
					autocomplete: this._preventAutofill ? "off" : this.autocomplete,
					type: typeAttr,
					"aria-label": lang.getMaybeLazy(this.label),
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
							vnode.dom.value = this.value() // chrome autofill does not work on password fields if the value has been set before
						}
					},
					onfocus: (e) => this.focus(),
					onblur: e => this.blur(e),
					onkeydown: e => {
						// keydown is used to cancel certain keypresses of the user (mainly needed for the BubbleTextField)
						let key = {keyCode: e.which, key: e.key, ctrl: e.ctrlKey, shift: e.shiftKey}
						const input = this._domInput
						if (input && input.value !== this.value()) {
							this.value(input.value) // password managers like CKPX set the value directly and only send a key event (oninput is not invoked), e.g. https://github.com/subdavis/Tusk/blob/9eecda720c1ecfe5d44af89fb96125cfd9921f2a/background/inject.js#L191
							if (input.value !== "" && !this.active) {
								this.animate()
							}
						}
						return this._keyHandler != null ? this._keyHandler(key) : true
					},
					onremove: e => {
						// fix for mithril bug that occurs on login, if the cursor is positioned in the password
						// field and enter is pressed to invoke the login action
						// ("Failed to execute 'removeChild' on 'Node': The node to be removed is no longer
						// a child of this node. Perhaps it was moved in a 'blur' event handler?")
						// TODO test if still needed with newer mithril releases
						if (this._domInput) {
							this._domInput.onblur = null
						}
						this._domInput = null
					},
					oninput: e => {
						const input = this._domInput
						if (input) {
							if (this.isEmpty() && input.value !== "" && !this.active && !this.webkitAutofill) {
								this.animate() // animate in case of browser autocompletion (non-webkit)
							}
							this.value(input.value) // update the input on each change
						}
					},
					style: {
						"min-width": px(20), // fix for edge browser. buttons are cut off in small windows otherwise
						"line-height": px(inputLineHeight),
						"min-height": px(inputLineHeight),
					}
				})
				)
			)
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
				"aria-label": lang.getMaybeLazy(this.label),
				oncreate: (vnode) => {
					this._domInput = vnode.dom
					vnode.dom.value = this.value()
					vnode.dom.style.height = px(Math.max(this.value().split("\n").length, 1) * inputLineHeight) // display all lines on creation of text area
				},
				onfocus: (e) => this.focus(),
				onblur: e => this.blur(e),
				onkeydown: e => {
					let key = {keyCode: e.which, key: e.key, ctrl: e.ctrlKey, shift: e.shiftKey}
					return this._keyHandler != null ? this._keyHandler(key) : true
				},
				oninput: e => {
					const input = this._domInput
					if (input) {
						if (this.isEmpty() && input.value !== "" && !this.active) {
							this.animate() // animate in case of browser autocompletion
						}
						input.style.height = '0px'
						input.style.height = px(input.scrollHeight)
						this.value(input.value) // update the input on each change
					}

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

	setPreventAutofill(prevent: boolean): TextField {
		this._preventAutofill = prevent
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
			if (this._domInput) {
				this._domInput.focus()
			}
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
