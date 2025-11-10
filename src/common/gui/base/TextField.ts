import m, { Children, ClassComponent, CVnode } from "mithril"
import { font_size, px, size } from "../size"
import { DefaultAnimationTime } from "../animation/Animations"
import { theme } from "../theme"
import type { MaybeTranslation } from "../../misc/LanguageViewModel"
import { lang } from "../../misc/LanguageViewModel"
import type { lazy } from "@tutao/tutanota-utils"
import { isKeyPressed, keyHandler, useKeyHandler } from "../../misc/KeyManager"
import { Keys, TabIndex } from "../../api/common/TutanotaConstants"
import { ClickHandler, getOperatingClasses } from "./GuiUtils"
import { AriaPopupType } from "../AriaUtils.js"

export type TextFieldAttrs = {
	id?: string
	label: MaybeTranslation
	value: string
	autocompleteAs?: Autocomplete
	autocapitalize?: Autocapitalize
	type?: TextFieldType
	hasPopup?: AriaPopupType
	helpLabel?: lazy<Children> | null
	alignRight?: boolean
	injectionsLeft?: lazy<Children>
	// only used by the BubbleTextField (-> uses old TextField) to display bubbles and out of office notification
	injectionsRight?: lazy<Children>
	keyHandler?: keyHandler
	onDomInputCreated?: (dom: HTMLInputElement) => void
	// interceptor used by the BubbleTextField to react on certain keys
	onfocus?: (dom: HTMLElement, input: HTMLInputElement) => unknown
	onblur?: (...args: Array<any>) => any
	maxWidth?: number
	class?: string
	style?: Record<string, any> //Temporary, Do not use
	disabled?: boolean
	// Creates a dummy TextField without interactively & disabled styling
	isReadOnly?: boolean
	oninput?: (value: string, input: HTMLInputElement) => unknown
	onclick?: ClickHandler
	doShowBorder?: boolean | null
	fontSize?: string
	min?: number
	max?: number

	/** This is called whenever the return key is pressed; overrides keyHandler */
	onReturnKeyPressed?: () => unknown
}

export const enum TextFieldType {
	Text = "text",
	Email = "email",
	/** @deprecated Prefer the `PasswordField` component over using this type with `TextField` */
	Password = "password",
	Area = "area",
	Number = "number",
	Url = "url",
	Date = "date",
	Time = "time",
}

// relevant subset of possible values for the autocomplete html field
// https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete
export const enum Autocomplete {
	off = "off",
	email = "email",
	username = "username",
	newPassword = "new-password",
	currentPassword = "current-password",
	oneTimeCode = "one-time-code",
	ccNumber = "cc-number",
	ccCsc = "cc-csc",
	ccExp = "cc-exp",
}

// relevant subset of possible values for the autocapitalize html field
// https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/autocapitalize
export const enum Autocapitalize {
	none = "none",
}

const inputMarginTop = font_size.small + size.spacing_4 + 3

// this is not always correct because font size can be bigger/smaller, and we ideally should take that into account
const baseLabelPosition = 21
// it should fit
// compact button + 1 px border + 1 px padding to keep things centered = 32
// 24px line-height + 12px label + some space between them = 36 + ?
const minInputHeight = 46

export class TextField implements ClassComponent<TextFieldAttrs> {
	active: boolean
	onblur: EventListener | null = null
	domInput!: HTMLInputElement
	_domWrapper!: HTMLElement
	private _domLabel!: HTMLElement
	private _domInputWrapper!: HTMLElement
	private _didAutofill!: boolean

	constructor() {
		this.active = false
	}

	view(vnode: CVnode<TextFieldAttrs>): Children {
		const a = vnode.attrs
		const maxWidth = a.maxWidth
		const labelBase = !this.active && a.value === "" && !a.isReadOnly && !this._didAutofill && !a.injectionsLeft
		const labelTransitionSpeed = DefaultAnimationTime / 2
		const doShowBorder = a.doShowBorder !== false
		const borderWidth = this.active ? "2px" : "1px"
		const borderColor = this.active ? theme.primary : theme.outline_variant
		return m(
			".text-field.rel.overflow-hidden",
			{
				id: vnode.attrs.id,
				oncreate: (vnode) => (this._domWrapper = vnode.dom as HTMLElement),
				onclick: (e: MouseEvent) => (a.onclick ? a.onclick(e, this._domInputWrapper) : this.focus(e, a)),
				"aria-haspopup": a.hasPopup,
				"data-testid": `tf:${lang.getTestId(a.label)}`,
				class: a.class != null ? a.class : "pt-16" + " " + getOperatingClasses(a.disabled),
				style: maxWidth
					? {
							maxWidth: px(maxWidth),
							...a.style,
						}
					: { ...a.style },
			},
			[
				m(
					"label.abs.text-ellipsis.noselect.z1.i.pr-4",
					{
						"aria-hidden": "true",
						class: this.active ? "content-accent-fg" : "" + " " + getOperatingClasses(a.disabled),
						oncreate: (vnode) => {
							this._domLabel = vnode.dom as HTMLElement
						},
						style: {
							fontSize: `${labelBase ? font_size.base : font_size.small}px`,
							transform: `translateY(${labelBase ? baseLabelPosition : 0}px)`,
							transition: `transform ${labelTransitionSpeed}ms ease-out, font-size ${labelTransitionSpeed}ms  ease-out`,
						},
					},
					lang.getTranslationText(a.label),
				),
				m(".flex.flex-column", [
					// another wrapper to fix IE 11 min-height bug https://github.com/philipwalton/flexbugs#3-min-height-on-a-flex-container-wont-apply-to-its-flex-items
					m(
						".flex.items-end.flex-wrap",
						{
							// .flex-wrap
							style: {
								"min-height": px(minInputHeight),
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
									style: {
										minHeight: px(minInputHeight - 2), // minus padding
									},
									oncreate: (vnode) => (this._domInputWrapper = vnode.dom as HTMLElement),
								},
								[
									a.type !== TextFieldType.Area ? this._getInputField(a) : this._getTextArea(a),
									a.injectionsRight
										? m(
												".flex-end.items-center",
												{
													style: { minHeight: px(minInputHeight - 2) },
												},
												a.injectionsRight(),
											)
										: null,
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
		if (a.isReadOnly) {
			return m(
				".text-break.selectable",
				{
					style: {
						marginTop: px(inputMarginTop),
						lineHeight: px(font_size.line_height_input),
					},
					"data-testid": `tfi:${lang.getTestId(a.label)}`,
				},
				a.value,
			)
		} else {
			// Due to modern browser's 'smart' password managers that try to autofill everything
			// that remotely resembles a password field, we prepend invisible inputs to password fields
			// that shouldn't be autofilled.
			// since the autofill algorithm looks at inputs that come before and after the password field we need
			// three dummies.
			const autofillGuard: Children =
				a.autocompleteAs === Autocomplete.off
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
						autocomplete: a.autocompleteAs ?? "",
						autocapitalize: a.autocapitalize,
						type: a.type,
						min: a.min,
						max: a.max,
						"aria-label": lang.getTranslationText(a.label),
						disabled: a.disabled,
						class: getOperatingClasses(a.disabled) + " text",
						oncreate: (vnode) => {
							this.domInput = vnode.dom as HTMLInputElement
							a.onDomInputCreated?.(this.domInput)
							this.domInput.value = a.value
							if (a.type !== TextFieldType.Area) {
								;(vnode.dom as HTMLElement).addEventListener("animationstart", (e: AnimationEvent) => {
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
							a.onfocus?.(this._domWrapper, this.domInput)
						},
						onblur: (e: FocusEvent) => this.blur(e, a),
						onkeydown: (e: KeyboardEvent) => {
							if (a.onReturnKeyPressed != null && e.key?.toLowerCase() === Keys.RETURN.code) {
								a.onReturnKeyPressed()
								return false
							}

							const handled = useKeyHandler(e, a.keyHandler)
							if (!isKeyPressed(e.key, Keys.F1, Keys.TAB, Keys.ESC) && !(e.ctrlKey || e.metaKey)) {
								// When we are in a text field we don't want keys propagated up to act as hotkeys
								e.stopPropagation()
							}
							return handled
						},
						onupdate: () => {
							// only change the value if the value has changed otherwise the cursor in Safari and in the iOS App cannot be positioned.
							if (this.domInput.value !== a.value) {
								this.domInput.value = a.value
							}
						},
						oninput: () => {
							a.oninput?.(this.domInput.value, this.domInput)
						},
						onremove: () => {
							// We clean up any value that might still be in DOM e.g. password
							if (this.domInput) this.domInput.value = ""
						},
						style: {
							maxWidth: a.maxWidth,
							minWidth: px(20),
							// fix for edge browser. buttons are cut off in small windows otherwise
							lineHeight: px(font_size.line_height_input),
							fontSize: a.fontSize,
						},
						"data-testid": `tfi:${lang.getTestId(a.label)}`,
					}),
				]),
			)
		}
	}

	_getTextArea(a: TextFieldAttrs): Children {
		if (a.isReadOnly) {
			return m(
				".text-prewrap.text-break.selectable",
				{
					style: {
						marginTop: px(inputMarginTop),
						lineHeight: px(font_size.line_height_input),
					},
				},
				a.value,
			)
		} else {
			return m("textarea.input-area.text-pre", {
				"aria-label": lang.getTranslationText(a.label),
				disabled: a.disabled,
				autocapitalize: a.autocapitalize,
				class: getOperatingClasses(a.disabled) + " text",
				oncreate: (vnode) => {
					this.domInput = vnode.dom as HTMLInputElement
					this.domInput.value = a.value
					this.domInput.style.height = px(Math.max(a.value.split("\n").length, 1) * font_size.line_height_input) // display all lines on creation of text area
				},
				onfocus: (e: FocusEvent) => this.focus(e, a),
				onblur: (e: FocusEvent) => this.blur(e, a),
				onkeydown: (e: KeyboardEvent) => useKeyHandler(e, a.keyHandler),
				oninput: () => {
					this.domInput.style.height = "0px"
					this.domInput.style.height = px(this.domInput.scrollHeight)
					a.oninput?.(this.domInput.value, this.domInput)
				},
				onupdate: () => {
					// only change the value if the value has changed otherwise the cursor in Safari and in the iOS App cannot be positioned.
					if (this.domInput.value !== a.value) {
						this.domInput.value = a.value
					}
				},
				style: {
					marginTop: px(inputMarginTop),
					lineHeight: px(font_size.line_height_input),
					minWidth: px(20), // fix for edge browser. buttons are cut off in small windows otherwise
					fontSize: a.fontSize,
				},
			})
		}
	}

	focus(e: Event, a: TextFieldAttrs) {
		if (!this.active && !a.disabled && !a.isReadOnly) {
			this.active = true
			this.domInput.focus()

			this._domWrapper.classList.add("active")
		}
	}

	blur(e: Event, a: TextFieldAttrs) {
		this._domWrapper.classList.remove("active")
		this.active = false
		if (a.onblur instanceof Function) a.onblur(e)
	}

	isEmpty(value: string): boolean {
		return value === ""
	}
}
