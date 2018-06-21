//@flow
import m from "mithril"
import stream from "mithril/stream/stream.js"
import {size, px} from "../size"
import {animations, fontSize, transform} from "./../animation/Animations"
import {ease} from "../animation/Easing"
import {theme} from "../theme"
import {lang} from "../../misc/LanguageViewModel"
import {ButtonN} from "./ButtonN"
import {Dialog} from "./Dialog"
import {formatDate, parseDate} from "../../misc/Formatter"
import {Icons} from "./icons/Icons"

export type TextFieldAttrs = {
	label: string|lazy<string>,
	value: stream<string>,
	type?: TextFieldTypeEnum;
	helpLabel?: lazy<string>,
	style?: Object,
	injectionsLeft?: Function; // only used by the BubbleTextField to display bubbles
	injectionsRight?: Function;
	keyHandler?: keyHandler; // interceptor used by the BubbleTextField to react on certain keys
	onblur?: Function;
	class?: string,
	disabled?:boolean,
}

export const Type = {
	Text: "text",
	Email: "email",
	Password: "password",
	Area: "area",
	ExternalPassword: "externalpassword",
}
export type TextFieldTypeEnum = $Values<typeof Type>;

export const inputLineHeight = size.font_size_base + 8
const inputMarginTop = size.font_size_small + size.hpad_small + 3
export const baseLabelPosition = size.text_field_label_top

export class _TextField {
	active: boolean;
	webkitAutofill: boolean;
	onblur: ?Function;
	_domWrapper: HTMLElement;
	_domLabel: HTMLElement;
	_domInput: HTMLInputElement;

	constructor(vnode: Vnode<TextFieldAttrs>) {
		this.active = false
		this.webkitAutofill = false
		if (typeof vnode.attrs.value.map == "function") {
			vnode.attrs.value.map(value => {
				if (this._domInput) {
					if (value && !this.active) {
						this.animate(true)
					}
					if (vnode.attrs.type == Type.Area && value != this._domInput.value) {
						this._domInput.value = value
					}
				}
			})
		}
	}

	view(vnode: Vnode<TextFieldAttrs>) {
		const a = vnode.attrs
		return m(".text-field.rel.overflow-hidden.text", {
			oncreate: (vnode) => this._domWrapper = vnode.dom,
			onclick: (e) => this.focus(e, a),
			class: a.class != null ? a.class : "pt"
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
			}, a.label instanceof Function ? a.label() : lang.get(a.label)),
			m(".flex.flex-column", [ // another wrapper to fix IE 11 min-height bug https://github.com/philipwalton/flexbugs#3-min-height-on-a-flex-container-wont-apply-to-its-flex-items
				m(".flex.items-end.flex-wrap", {
					style: {
						'min-height': px(size.button_height + 2), // 2 px border
						'padding-bottom': this.active ? px(0) : px(1),
						'border-bottom': a.disabled ? '1px solid transparent' : this.active ? `2px solid ${theme.content_accent}` : `1px solid ${theme.content_border}`,
					},
				}, [
					a.injectionsLeft ? a.injectionsLeft() : null,
					m(".inputWrapper.flex-space-between.items-end", {}, [ // additional wrapper element for bubble input field. input field should always be in one line with right injections
						a.type !== Type.Area ? this._getInputField(a) : this._getTextArea(a),
						a.injectionsRight ? m(".mr-negative-s.flex-end.flex-no-shrink", a.injectionsRight()) : null
					])
				]),
			]),
			a.helpLabel ? m("small.noselect.click", {
					onclick: () => {
						if (this._domInput) this._domInput.focus()
					}
				}, a.helpLabel()) : []
		])
	}

	_getInputField(a: TextFieldAttrs): VirtualElement {
		if (a.disabled) {
			return m(".text-break" + (this._alignRight ? ".right" : ""), {
				style: {
					marginTop: px(inputMarginTop),
					lineHeight: px(inputLineHeight),
				}
			}, a.value())
		} else {
			return m("input.input" + (this._alignRight ? ".right" : ""), {
				type: (a.type == Type.ExternalPassword) ? (this.active ? Type.Text : Type.Password) : a.type,
				value: a.value(),
				oncreate: (vnode) => {
					this._domInput = vnode.dom
					this._domInput.value = a.value()
					if (a.type == Type.Password) {
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
				onfocus: (e) => this.focus(e, a),
				onblur: e => this.blur(e, a),
				onkeydown: e => {
					// keydown is used to cancel certain keypresses of the user (mainly needed for the BubbleTextField)
					let key = {keyCode: e.which, ctrl: e.ctrlKey}
					return a.keyHandler != null ? a.keyHandler(key) : true
				},
				onremove: e => {
					// fix for mithril bug that occurs on login, if the cursor is positioned in the password field and enter is pressed to invoke the login action ("Failed to execute 'removeChild' on 'Node': The node to be removed is no longer a child of this node. Perhaps it was moved in a 'blur' event handler?")
					// TODO test if still needed with newer mithril releases
					this._domInput.onblur = null
				},
				oninput: e => {
					if (this.isEmpty(a.value()) && this._domInput.value !== "" && !this.active && !this.webkitAutofill) {
						this.animate(true) // animate in case of browser autocompletion (non-webkit)
					}
					a.value(this._domInput.value) // update the input on each change
				},
				style: {
					minWidth: px(20), // fix for edge browser. buttons are cut off in small windows otherwise
					lineHeight: px(inputLineHeight),
				}
			})
		}
	}

	_getTextArea(a: TextFieldAttrs): VirtualElement {
		if (a.disabled) {
			return m(".text-prewrap.text-break", {
				style: {
					marginTop: px(inputMarginTop),
					lineHeight: px(inputLineHeight),
				}
			}, a.value())
		} else {
			return m("textarea.input-area.text-pre", {
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

	animate(fadeIn: boolean) {
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

export function editableTextField(label: string, value: ?string, updateHandler: handler<string>, area: ?boolean = false) {
	return m(TextFieldN, {
		label: () => label,
		value: () => value,
		type: area ? Type.Area : Type.Text,
		disabled: true,
		injectionsRight: () => m(ButtonN, {
			label: () => "update",
			icon: () => Icons.Edit,
			click: () => (area ? Dialog.showTextAreaInputDialog : Dialog.showTextInputDialog)("edit_action", () => label, null, value ? value : "").then(value => updateHandler(value).catch(e => {
				Dialog.error(() => `Could not update "${label}" with value ${value}`)
				console.log(e)
			}))
		})
	})
}

export function editableDateField(label: string, value: ?Date, updateHandler: handler<Date>) {
	return m(TextFieldN, {
		label: () => label,
		value: () => value ? formatDate(value) : "",
		disabled: true,
		injectionsRight: () => m(ButtonN, {
			label: () => "update",
			icon: () => Icons.Edit,
			click: () => {
				let invalidDate = false
				let dateValue = stream(value ? formatDate(value) : "")
				dateValue.map(newDate => {
					try {
						if (newDate.trim().length > 0) {
							let timestamp = parseDate(newDate)
							isNaN(timestamp) ? null : new Date(timestamp)
						}
						invalidDate = false
					} catch (e) {
						invalidDate = true
					}
				})
				const helpText = () => invalidDate ? lang.get("invalidDateFormat_msg", {"{1}": formatDate(new Date())}) : null
				let dialog = Dialog.smallActionDialog(lang.get("edit_action"), {
					view: () => m(TextFieldN, {
						label: () => label,
						value: dateValue,
						helpLabel: helpText
					})
				}, () => {
					try {
						let date = null
						if (dateValue().trim() != "") {
							date = new Date(parseDate(dateValue()))
						}
						updateHandler(date).then(() => dialog.close())
							.catch(e => {
								Dialog.error(() => `Could not update "${label}" with value ${dateValue()}`)
								console.log(e)
							})
					} catch (e) {
						Dialog.error(() => helpText())
					}
				})
			}
		})
	})
}