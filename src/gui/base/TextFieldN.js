//@flow
import m from "mithril"
import {px, size} from "../size"
import {animations, fontSize, transform} from "../animation/Animations"
import {ease} from "../animation/Easing"
import {theme} from "../theme"
import type {TranslationKey} from "../../misc/LanguageViewModel"
import {lang} from "../../misc/LanguageViewModel"
import {repeat} from "../../api/common/utils/StringUtils"
import type {keyHandler} from "../../misc/KeyManager"

export type TextFieldAttrs = {
	id?: string,
	label: TranslationKey | lazy<string>,
	value: Stream<string>,
	preventAutofill?: boolean,
	type?: TextFieldTypeEnum,
	helpLabel?: ?lazy<Children>,
	alignRight?: boolean,
	injectionsLeft?: lazy<Children>, // only used by the BubbleTextField to display bubbles
	injectionsRight?: lazy<Children>,
	keyHandler?: keyHandler, // interceptor used by the BubbleTextField to react on certain keys
	onfocus?: (dom: HTMLElement, input: HTMLInputElement) => mixed,
	onblur?: Function,
	maxWidth?: number,
	class?: string,
	disabled?: boolean,
	oninput?: (value: string, input: HTMLInputElement) => mixed,
	onclick?: clickHandler,
}

export const Type = Object.freeze({
	Text: "text",
	Email: "email",
	Password: "password",
	Area: "area",
	ExternalPassword: "externalpassword",
	Number: "number",
	Time: "time"
})
export type TextFieldTypeEnum = $Values<typeof Type>;

export const inputLineHeight: number = size.font_size_base + 8
const inputMarginTop = size.font_size_small + size.hpad_small + 3
export const baseLabelPosition = size.text_field_label_top

export class _TextField {
	active: boolean;
	webkitAutofill: boolean;
	onblur: ?Function;
	_domWrapper: HTMLElement;
	_domLabel: HTMLElement;
	_domInput: HTMLInputElement;
	_domInputWrapper: HTMLElement;

	constructor(vnode: Vnode<TextFieldAttrs>) {
		this.active = false
		this.webkitAutofill = false
	}

	view(vnode: Vnode<TextFieldAttrs>): Children {
		const a = vnode.attrs
		return m(".text-field.rel.overflow-hidden", {
			id: vnode.attrs.id,
			oncreate: (vnode) => this._domWrapper = vnode.dom,
			onclick: (e) => a.onclick ? a.onclick(e, this._domInputWrapper) : this.focus(e, a),
			class: a.class != null ? a.class : "text pt"
		}, [
			m("label.abs.text-ellipsis.noselect.backface_fix.z1.i.pr-s", {
				class: this.active ? "content-accent-fg" : "",
				oncreate: (vnode) => {
					this._domLabel = vnode.dom
					if (this.isEmpty(a.value()) && !a.disabled) { // if the text field is disabled do not show the label in base position.
						this._domLabel.style.fontSize = px(size.font_size_base)
						this._domLabel.style.transform = 'translateY(' + baseLabelPosition + "px)"
					} else {
						this._domLabel.style.fontSize = px(size.font_size_small)
						this._domLabel.style.transform = 'translateY(' + 0 + "px)"
					}
				},
			}, lang.getMaybeLazy(a.label)),
			m(".flex.flex-column", [ // another wrapper to fix IE 11 min-height bug https://github.com/philipwalton/flexbugs#3-min-height-on-a-flex-container-wont-apply-to-its-flex-items
				m(".flex.items-end.flex-wrap", {
					style: {
						'min-height': px(size.button_height + 2), // 2 px border
						'padding-bottom': this.active ? px(0) : px(1),
						'border-bottom': this.active ? `2px solid ${theme.content_accent}` : `1px solid ${theme.content_border}`,
					},
				}, [
					a.injectionsLeft ? a.injectionsLeft() : null,
					// additional wrapper element for bubble input field. input field should always be in one line with right injections
					m(".inputWrapper.flex-space-between.items-end", {
						oncreate: (vnode) => this._domInputWrapper = vnode.dom
					}, [
						a.type !== Type.Area ? this._getInputField(a) : this._getTextArea(a),
						a.injectionsRight ? m(".mr-negative-s.flex-end", a.injectionsRight()) : null
					])
				]),
			]),
			a.helpLabel ? m("small.noselect.click", {
				onclick: (e) => {
					e.stopPropagation()
				}
			}, a.helpLabel()) : []
		])
	}

	_getInputField(a: TextFieldAttrs): Children {
		if (a.disabled) {
			return m(".text-break.selectable", {
				style: {
					marginTop: px(inputMarginTop),
					lineHeight: px(inputLineHeight),
				}
			}, a.value())
		} else {
			// Due to modern browser's 'smart' password managers that try to autofill everything
			// that remotely resembles a password field, we prepend invisible inputs to password fields
			// that shouldn't be autofilled.
			// since the autofill algorithm looks at inputs that come before and after the password field we need
			// three dummies.
			//
			// If it is ExternalPassword type, we hide input and show substitute element when the field is not active.
			// This is mostly done to prevent autofill which happens if the field type="password".
			const autofillGuard = a.preventAutofill ? [
				m("input.abs", {style: {opacity: '0', height: '0'}, type: Type.Text}),
				m("input.abs", {style: {opacity: '0', height: '0'}, type: Type.Password}),
				m("input.abs", {style: {opacity: '0', height: '0'}, type: Type.Text})
			] : []

			return m('.flex-grow.rel', autofillGuard.concat([
				m("input.input" + (a.alignRight ? ".right" : ""), {
					autocomplete: a.preventAutofill ? "off" : "",
					type: (a.type === Type.ExternalPassword) ? Type.Text : a.type,
					"aria-label": lang.getMaybeLazy(a.label),
					oncreate: (vnode) => {
						this._domInput = vnode.dom
						this._domInput.style.opacity = this._shouldShowPasswordOverlay(a) ? "0" : "1"
						this._domInput.value = a.value()
						if (a.type === Type.ExternalPassword) {
							vnode.dom.style.opacity = '0' // Setting it in style block doesn't work somehow
						} else if (a.type === Type.Password) {
							vnode.dom.addEventListener('animationstart', e => {
								if (e.animationName === "onAutoFillStart") {
									this.animate(true)
									this.webkitAutofill = true
								} else if (e.animationName === "onAutoFillCancel") {
									this.webkitAutofill = false
								}
							})
						}
					},
					onfocus: (e) => {
						this.focus(e, a)
						a.onfocus && a.onfocus(this._domWrapper, this._domInput)
					},
					onblur: e => this.blur(e, a),
					onkeydown: e => {
						// keydown is used to cancel certain keypresses of the user (mainly needed for the BubbleTextField)
						let key = {keyCode: e.which, ctrl: e.ctrlKey, shift: e.shiftKey}
						return a.keyHandler != null ? a.keyHandler(key) : true
					},
					onremove: e => {
						// fix for mithril bug that occurs on login, if the cursor is positioned in the password field and enter is pressed to invoke the login action ("Failed to execute 'removeChild' on 'Node': The node to be removed is no longer a child of this node. Perhaps it was moved in a 'blur' event handler?")
						// TODO test if still needed with newer mithril releases
						this._domInput.onblur = null
					},
					onupdate: () => {
						this._domInput.style.opacity = this._shouldShowPasswordOverlay(a) ? "0" : "1"
						if (this._domInput.value !== a.value()) { // only change the value if the value has changed otherwise the cursor in Safari and in the iOS App cannot be positioned.
							this._domInput.value = a.value()
							if (a.value() && !this.active) { // animate in case the value of the stream has changed, we prefer to animate in onupdate instead of subscribing to the stream.
								this.animate(true)
							}
						}
					},
					oninput: () => {
						if (this.isEmpty(a.value()) && this._domInput.value !== "" && !this.active
							&& !this.webkitAutofill) {
							this.animate(true) // animate in case of browser autocompletion (non-webkit)
						}
						a.value(this._domInput.value) // update the input on each change
						a.oninput && a.oninput(this._domInput.value, this._domInput)
					},
					style: {
						minWidth: px(20), // fix for edge browser. buttons are cut off in small windows otherwise
						lineHeight: px(inputLineHeight),
					}
				}),
				this._shouldShowPasswordOverlay(a)
					? m(".abs", {
						style: {
							bottom: 0,
							left: 0,
							lineHeight: size.line_height
						},
					}, repeat("•", a.value().length))
					: null
			]))
		}
	}

	_shouldShowPasswordOverlay(a: TextFieldAttrs): boolean {
		return a.type === Type.ExternalPassword && !this.active
	}

	_getTextArea(a: TextFieldAttrs): VirtualElement {
		if (a.disabled) {
			return m(".text-prewrap.text-break.selectable", {
				style: {
					marginTop: px(inputMarginTop),
					lineHeight: px(inputLineHeight),
				}
			}, a.value())
		} else {
			return m("textarea.input-area.text-pre", {
				"aria-label": lang.getMaybeLazy(a.label),
				oncreate: (vnode) => {
					this._domInput = vnode.dom
					this._domInput.value = a.value()
					this._domInput.style.height = px(Math.max(a.value().split("\n").length, 1) * inputLineHeight) // display all lines on creation of text area
				},
				onfocus: (e) => this.focus(e, a),
				onblur: e => this.blur(e, a),
				onkeydown: e => {
					let key = {keyCode: e.which, ctrl: e.ctrlKey, shift: e.shiftKey}
					return a.keyHandler != null ? a.keyHandler(key) : true
				},
				oninput: e => {
					if (this.isEmpty(a.value()) && this._domInput.value !== "" && !this.active) {
						this.animate(true) // animate in case of browser autocompletion
					}
					this._domInput.style.height = '0px'
					this._domInput.style.height = px(this._domInput.scrollHeight)
					a.value(this._domInput.value) // update the input on each change
				},
				onupdate: () => {
					if (this._domInput.value !== a.value()) { // only change the value if the value has changed otherwise the cursor in Safari and in the iOS App cannot be positioned.
						this._domInput.value = a.value()
						if (a.value() && !this.active) { // animate in case the value of the stream has changed, we prefer to animate in onupdate instead of subscribing to the stream.
							this.animate(true)
						}
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

	focus(e: MouseEvent, a: TextFieldAttrs) {
		if (!this.active && !a.disabled) {
			this.active = true
			this._domInput.focus()
			this._domWrapper.classList.add("active")
			if (this.isEmpty(a.value())) {
				this.animate(true)
			}
		}
	}

	blur(e: MouseEvent, a: TextFieldAttrs) {
		/*if (this.skipNextBlur) {
		 this._domInput.focus()
		 } else {
		 */
		this._domWrapper.classList.remove("active")
		if (this.isEmpty(a.value())) {
			this.animate(false)
		}
		this.active = false
		if (a.onblur instanceof Function) a.onblur(e)
		/*}
		 this.skipNextBlur = false
		 */
	}

	isEmpty(value: string): boolean {
		return value === ''
	}

	animate(fadeIn: boolean): Promise<void> {
		let fontSizes = [size.font_size_base, size.font_size_small]
		let top = [baseLabelPosition, 0]
		if (!fadeIn) {
			fontSizes.reverse()
			top.reverse()
		}
		return animations.add(this._domLabel, [
			fontSize(fontSizes[0], fontSizes[1]),
			transform(transform.type.translateY, top[0], top[1])
		], {easing: ease.out})
	}
}

export const TextFieldN: Class<MComponent<TextFieldAttrs>> = _TextField
