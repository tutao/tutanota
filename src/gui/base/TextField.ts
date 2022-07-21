import m, {Children, ClassComponent, Component, CVnode, Vnode} from "mithril"
import {px, size} from "../size"
import {DefaultAnimationTime} from "../animation/Animations"
import {theme} from "../theme"
import type {TranslationKey} from "../../misc/LanguageViewModel"
import {lang} from "../../misc/LanguageViewModel"
import type {lazy} from "@tutao/tutanota-utils"
import {repeat} from "@tutao/tutanota-utils"
import type {keyHandler} from "../../misc/KeyManager"
import {TabIndex} from "../../api/common/TutanotaConstants"
import type {clickHandler} from "./GuiUtils"

export type TextFieldAttrs = {
	id?: string
	label: TranslationKey | lazy<string>
	value: string
	preventAutofill?: boolean
	type?: TextFieldType
	helpLabel?: lazy<Children> | null
	alignRight?: boolean
	injectionsLeft?: lazy<Children>
	// only used by the BubbleTextField (-> uses old TextField) to display bubbles and out of office notification
	injectionsRight?: lazy<Children>
	keyHandler?: keyHandler
	onDomInputCreated?: (dom: HTMLInputElement) => void,
	// interceptor used by the BubbleTextField to react on certain keys
	onfocus?: (dom: HTMLElement, input: HTMLInputElement) => unknown
	onblur?: (...args: Array<any>) => any
	maxWidth?: number
	class?: string
	disabled?: boolean
	oninput?: (value: string, input: HTMLInputElement) => unknown
	onclick?: clickHandler
	doShowBorder?: boolean | null
}

export const enum TextFieldType {
	Text = "text",
	Email = "email",
	Password = "password",
	Area = "area",
	ExternalPassword = "externalpassword",
	Number = "number",
	Time = "time",
}

export const inputLineHeight: number = size.font_size_base + 8
const inputMarginTop = size.font_size_small + size.hpad_small + 3
export const baseLabelPosition = size.text_field_label_top

export class TextField implements ClassComponent<TextFieldAttrs> {
	active: boolean
	onblur: EventListener | null = null
	domInput!: HTMLInputElement
	private _domWrapper!: HTMLElement
	private _domLabel!: HTMLElement
	private _domInputWrapper!: HTMLElement
	private _didAutofill!: boolean

	constructor() {
		this.active = false
	}

	view(vnode: CVnode<TextFieldAttrs>): Children {
		const a = vnode.attrs
		const maxWidth = a.maxWidth
		const labelBase = !this.active && a.value === "" && !a.disabled && !this._didAutofill && !a.injectionsLeft
		const labelTransitionSpeed = DefaultAnimationTime / 2
		const doShowBorder = a.doShowBorder !== false
		const borderWidth = this.active ? "2px" : "1px"
		const borderColor = this.active ? theme.content_accent : theme.content_border
		return m(
			".text-field.rel.overflow-hidden",
			{
				id: vnode.attrs.id,
				oncreate: vnode => (this._domWrapper = vnode.dom as HTMLElement),
				onclick: (e: MouseEvent) => (a.onclick ? a.onclick(e, this._domInputWrapper) : this.focus(e, a)),
				class: a.class != null ? a.class : "text pt",
				style: maxWidth
					? {
						maxWidth: px(maxWidth),
					}
					: {},
			},
			[
				m(
					"label.abs.text-ellipsis.noselect.backface_fix.z1.i.pr-s",
					{
						class: this.active ? "content-accent-fg" : "",
						oncreate: vnode => {
							this._domLabel = vnode.dom as HTMLElement
						},
						style: {
							fontSize: `${labelBase ? size.font_size_base : size.font_size_small}px`,
							transform: `translateY(${labelBase ? baseLabelPosition : 0}px)`,
							transition: `transform ${labelTransitionSpeed}ms ease-out, font-size ${labelTransitionSpeed}ms  ease-out`,
						},
					},
					lang.getMaybeLazy(a.label),
				),
				m(".flex.flex-column", [
					// another wrapper to fix IE 11 min-height bug https://github.com/philipwalton/flexbugs#3-min-height-on-a-flex-container-wont-apply-to-its-flex-items
					m(
						".flex.items-end.flex-wrap",
						{
							// .flex-wrap
							style: {
								"min-height": px(size.button_height + 2),
								// 2 px border
								"padding-bottom": this.active ? px(0) : px(1),
								"border-bottom": doShowBorder ? `${borderWidth} solid ${borderColor}` : "",
							},
						},
						[
							a.injectionsLeft ? a.injectionsLeft() : null, // additional wrapper element for bubble input field. input field should always be in one line with right injections
							m(
								".inputWrapper.flex-space-between.items-end",
								{
									oncreate: vnode => (this._domInputWrapper = vnode.dom as HTMLElement),
								},
								[
									a.type !== TextFieldType.Area ? this._getInputField(a) : this._getTextArea(a),
									a.injectionsRight ? m(".mr-negative-s.flex-end", a.injectionsRight()) : null,
								],
							),
						],
					),
				]),
				a.helpLabel
					? m(
						"small.noselect",
						{
							onclick: (e: MouseEvent) => {
								e.stopPropagation()
							},
						},
						a.helpLabel(),
					)
					: [],
			],
		)
	}

	_getInputField(a: TextFieldAttrs): Children {
		if (a.disabled) {
			return m(
				".text-break.selectable",
				{
					style: {
						marginTop: px(inputMarginTop),
						lineHeight: px(inputLineHeight),
					},
				},
				a.value,
			)
		} else {
			// Due to modern browser's 'smart' password managers that try to autofill everything
			// that remotely resembles a password field, we prepend invisible inputs to password fields
			// that shouldn't be autofilled.
			// since the autofill algorithm looks at inputs that come before and after the password field we need
			// three dummies.
			//
			// If it is ExternalPassword type, we hide input and show substitute element when the field is not active.
			// This is mostly done to prevent autofill which happens if the field type="password".
			const autofillGuard: Children = a.preventAutofill
				? [
					m("input.abs", {
						style: {
							opacity: "0",
							height: "0",
						},
						tabIndex: TabIndex.Programmatic,
						type: TextFieldType.Text,
					}),
					m("input.abs", {
						style: {
							opacity: "0",
							height: "0",
						},
						tabIndex: TabIndex.Programmatic,
						type: TextFieldType.Password,
					}),
					m("input.abs", {
						style: {
							opacity: "0",
							height: "0",
						},
						tabIndex: TabIndex.Programmatic,
						type: TextFieldType.Text,
					}),
				]
				: []
			return m(
				".flex-grow.rel",
				autofillGuard.concat([
					m("input.input" + (a.alignRight ? ".right" : ""), {
						autocomplete: a.preventAutofill ? "off" : "",
						type: a.type === TextFieldType.ExternalPassword ? TextFieldType.Text : a.type,
						"aria-label": lang.getMaybeLazy(a.label),
						oncreate: vnode => {
							this.domInput = vnode.dom as HTMLInputElement
							vnode.attrs.onDomInputCreated?.(this.domInput)
							this.domInput.style.opacity = this._shouldShowPasswordOverlay(a) ? "0" : "1"
							this.domInput.value = a.value

							if (a.type !== TextFieldType.Area) {
								(vnode.dom as HTMLElement).addEventListener("animationstart", (e: AnimationEvent) => {
									if (e.animationName === "onAutoFillStart") {
										this._didAutofill = true
										m.redraw()
									} else if (e.animationName === "onAutoFillCancel") {
										this._didAutofill = false
										m.redraw()
									}
								})
							}
						},
						onfocus: (e: FocusEvent) => {
							this.focus(e, a)
							a.onfocus && a.onfocus(this._domWrapper, this.domInput)
						},
						onblur: (e: FocusEvent) => this.blur(e, a),
						onkeydown: (e: KeyboardEvent) => {
							// keydown is used to cancel certain keypresses of the user (mainly needed for the BubbleTextField)
							let key = {
								keyCode: e.which,
								key: e.key,
								ctrl: e.ctrlKey,
								shift: e.shiftKey,
							}
							return a.keyHandler != null ? a.keyHandler(key) : true
						},
						onupdate: () => {
							this.domInput.style.opacity = this._shouldShowPasswordOverlay(a) ? "0" : "1"

							// only change the value if the value has changed otherwise the cursor in Safari and in the iOS App cannot be positioned.
							if (this.domInput.value !== a.value) {
								this.domInput.value = a.value
							}
						},
						oninput: () => {
							a.oninput && a.oninput(this.domInput.value, this.domInput)
						},
						onremove: () => {
							// We clean up any value that might still be in DOM e.g. password
							if (this.domInput) this.domInput.value = ""
						},
						style: {
							maxWidth: a.maxWidth,
							minWidth: px(20),
							// fix for edge browser. buttons are cut off in small windows otherwise
							lineHeight: px(inputLineHeight),
						},
					}),
					this._shouldShowPasswordOverlay(a)
						? m(
							".abs",
							{
								style: {
									bottom: 0,
									left: 0,
									lineHeight: size.line_height,
								},
							},
							repeat("•", a.value.length),
						)
						: null,
				]),
			)
		}
	}

	_shouldShowPasswordOverlay(a: TextFieldAttrs): boolean {
		return a.type === TextFieldType.ExternalPassword && !this.active
	}

	_getTextArea(a: TextFieldAttrs): Children {
		if (a.disabled) {
			return m(
				".text-prewrap.text-break.selectable",
				{
					style: {
						marginTop: px(inputMarginTop),
						lineHeight: px(inputLineHeight),
					},
				},
				a.value,
			)
		} else {
			return m("textarea.input-area.text-pre", {
				"aria-label": lang.getMaybeLazy(a.label),
				oncreate: vnode => {
					this.domInput = vnode.dom as HTMLInputElement
					this.domInput.value = a.value
					this.domInput.style.height = px(Math.max(a.value.split("\n").length, 1) * inputLineHeight) // display all lines on creation of text area
				},
				onfocus: (e: FocusEvent) => this.focus(e, a),
				onblur: (e: FocusEvent) => this.blur(e, a),
				onkeydown: (e: KeyboardEvent) => {
					let key = {
						keyCode: e.which,
						key: e.key,
						ctrl: e.ctrlKey,
						shift: e.shiftKey,
					}
					return a.keyHandler != null ? a.keyHandler(key) : true
				},
				oninput: () => {
					this.domInput.style.height = "0px"
					this.domInput.style.height = px(this.domInput.scrollHeight)
					a.oninput && a.oninput(this.domInput.value, this.domInput)
				},
				onupdate: () => {
					// only change the value if the value has changed otherwise the cursor in Safari and in the iOS App cannot be positioned.
					if (this.domInput.value !== a.value) {
						this.domInput.value = a.value
					}
				},
				style: {
					marginTop: px(inputMarginTop),
					lineHeight: px(inputLineHeight),
					minWidth: px(20), // fix for edge browser. buttons are cut off in small windows otherwise
				},
			})
		}
	}

	focus(e: Event, a: TextFieldAttrs) {
		if (!this.active && !a.disabled) {
			this.active = true
			this.domInput.focus()

			this._domWrapper.classList.add("active")
		}
	}

	blur(e: Event, a: TextFieldAttrs) {
		/*if (this.skipNextBlur) {
	 this.domInput.focus()
	 } else {
	 */
		this._domWrapper.classList.remove("active")

		this.active = false
		if (a.onblur instanceof Function) a.onblur(e)
		/*}
	 this.skipNextBlur = false
	 */
	}

	isEmpty(value: string): boolean {
		return value === ""
	}
}