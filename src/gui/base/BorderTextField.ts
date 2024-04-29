import m, { Children, ClassComponent, CVnode } from "mithril"
import { px, size } from "../size"
import { DefaultAnimationTime } from "../animation/Animations"
import { theme } from "../theme"
import type { TranslationKey } from "../../misc/LanguageViewModel"
import { lang } from "../../misc/LanguageViewModel"
import type { lazy } from "@tutao/tutanota-utils"
import type { keyHandler } from "../../misc/KeyManager"
import { TabIndex } from "../../api/common/TutanotaConstants"
import { ClickHandler, getOperatingClasses } from "./GuiUtils"

export type BorderTextFieldAttrs = {
	id?: string
	label: TranslationKey | lazy<string>
	value: string
	autocompleteAs?: Autocomplete
	type?: BorderTextFieldType
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
	disabled?: boolean
	// Creates a dummy TextField without interactively & disabled styling
	isReadOnly?: boolean
	oninput?: (value: string, input: HTMLInputElement) => unknown
	onclick?: ClickHandler
	doShowBorder?: boolean | null
	fontSize?: string
	min?: number
	max?: number
	labelBgColorOverwrite?: string
	// overwrites the bg color of label, only in use to fix login in dark mode
	areaTextFieldLines?: number
}

export const enum BorderTextFieldType {
	Text = "text",
	Email = "email",
	Password = "password",
	Area = "area",
	Number = "number",
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

export const inputLineHeight: number = size.font_size_base + 8

// this is not always correct because font size can be biggger/smaller and we ideally should take that into account
// it should fit
// compact button + 1 px border + 1 px padding to keep things centered = 32
// 24px line-height + 12px label + some space between them = 36 + ?
const minInputHeight = 30

export class BorderTextField implements ClassComponent<BorderTextFieldAttrs> {
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

	view(vnode: CVnode<BorderTextFieldAttrs>): Children {
		const a = vnode.attrs
		const maxWidth = a.maxWidth
		const labelBase = !this.active && a.value === "" && !a.isReadOnly && !this._didAutofill && !a.injectionsLeft
		const labelTransitionSpeed = DefaultAnimationTime / 2
		const doShowBorder = a.doShowBorder !== false
		const borderWidth = this.active ? "2px" : "1px"
		const borderColor = this.active ? theme.content_accent : theme.content_border
		return m(
			".text-field.rel.overflow-hidden",
			{
				id: vnode.attrs.id,
				oncreate: (vnode) => (this._domWrapper = vnode.dom as HTMLElement),
				onclick: (e: MouseEvent) => (a.onclick ? a.onclick(e, this._domInputWrapper) : this.focus(e, a)),
				class: a.class != null ? a.class : "pt" + " " + getOperatingClasses(a.disabled),
				style: maxWidth
					? {
							maxWidth: px(maxWidth),
					  }
					: {
							"margin-bottom": vnode.attrs.helpLabel ? "" : "21px",
					  },
			},
			[
				m(
					"label.abs.text-ellipsis.noselect.z1.i.pr-s",
					{
						class: this.active ? "content-accent-fg" : "" + " " + getOperatingClasses(a.disabled),
						oncreate: (vnode) => {
							this._domLabel = vnode.dom as HTMLElement
						},
						style: {
							fontSize: px(size.font_size_base), //`${this.active || vnode.attrs.value ? size.font_size_small : size.font_size_base}px`,
							transform: `translateY(-${this.active || vnode.attrs.value ? 30 : 0}px)`,
							transition: `transform ${labelTransitionSpeed}ms`, // , font-size ${labelTransitionSpeed / 2}ms
							margin: "11px 10px",
							padding: "6px",
							lineHeight: px(size.md_default_line_height),
							"font-style": "normal",
							"background-color": a.labelBgColorOverwrite || theme.elevated_bg,
							//"backdrop-filter": "blur(100px)",
						},
					},
					lang.getMaybeLazy(a.label),
				),
				m(
					".flex.flex-column",
					{
						style: {},
					},
					[
						// another wrapper to fix IE 11 min-height bug https://github.com/philipwalton/flexbugs#3-min-height-on-a-flex-container-wont-apply-to-its-flex-items
						m(
							".flex.items-end.flex-wrap",
							{
								// .flex-wrap
								style: {
									"min-height": px(minInputHeight),
									// border: 2px when active; 1px whe inactive
									border: doShowBorder ? `${borderWidth} solid ${borderColor}` : "",
									"border-radius": "8px",
									margin: this.active ? "0px" : "1px", // reserve space for border to not move other elements on focus change
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
										a.type !== BorderTextFieldType.Area ? this._getInputField(a) : this._getTextArea(a),
										a.injectionsRight
											? m(
													".flex-end.items-center",
													{
														style: {
															// use minHeight to allow svgs to be rendered correctly
															minHeight: px(size.md_default_line_height),
															lineHeight: px(size.md_default_line_height),
															// 13px because 56 (md field height) - 30 (svg size) = 26 -> 26/2 = 13
															margin: `13px ${size.md_default_margin - 6}px 13px ${size.md_default_margin}px`,
														},
													},
													a.injectionsRight(),
											  )
											: null,
									],
								),
							],
						),
					],
				),
				a.helpLabel
					? m(
							"div.noselect",
							{
								onclick: (e: MouseEvent) => {
									e.stopPropagation()
								},
								style: {
									padding: `${size.md_default_margin / 4}px ${size.md_default_margin}px 0px`,
								},
							},
							a.helpLabel(),
					  )
					: [],
			],
		)
	}

	_getInputField(a: BorderTextFieldAttrs): Children {
		if (a.isReadOnly) {
			return m(
				".text-break.selectable",
				{
					style: {
						padding: px(size.md_default_margin),
						lineHeight: px(size.md_default_line_height),
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
			const autofillGuard: Children =
				a.autocompleteAs === Autocomplete.off
					? [
							m("input.abs", {
								style: {
									opacity: "0",
									height: "0",
								},
								tabIndex: TabIndex.Programmatic,
								type: BorderTextFieldType.Text,
							}),
							m("input.abs", {
								style: {
									opacity: "0",
									height: "0",
								},
								tabIndex: TabIndex.Programmatic,
								type: BorderTextFieldType.Password,
							}),
							m("input.abs", {
								style: {
									opacity: "0",
									height: "0",
								},
								tabIndex: TabIndex.Programmatic,
								type: BorderTextFieldType.Text,
							}),
					  ]
					: []
			return m(
				".flex-grow.rel",
				autofillGuard.concat([
					m("input.input" + (a.alignRight ? ".right" : ""), {
						autocomplete: a.autocompleteAs ?? "",
						type: a.type,
						min: a.min,
						max: a.max,
						"aria-label": lang.getMaybeLazy(a.label),
						disabled: a.disabled,
						class: getOperatingClasses(a.disabled) + " text",

						oncreate: (vnode) => {
							this.domInput = vnode.dom as HTMLInputElement
							a.onDomInputCreated?.(this.domInput)
							this.domInput.value = a.value
							if (a.type !== BorderTextFieldType.Area) {
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
						setValue: (value: string) => {
							a.value = value
							this.domInput.value = value
						},
						onfocus: (e: FocusEvent) => {
							this.focus(e, a)
							a.onfocus && a.onfocus(this._domWrapper, this.domInput)
						},
						onblur: (e: FocusEvent) => this.blur(e, a),
						onkeydown: (e: KeyboardEvent) => {
							// keydown is used to cancel certain keypresses of the user (mainly needed for the BubbleTextField)
							let key = {
								key: e.key,
								ctrl: e.ctrlKey,
								shift: e.shiftKey,
							}
							return a.keyHandler != null ? a.keyHandler(key) : true
						},
						onupdate: () => {
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
							// needs to be padding instead of margin to stay within parent element
							padding: px(size.md_default_margin),
							maxWidth: a.maxWidth,
							minWidth: px(20),
							// fix for edge browser. buttons are cut off in small windows otherwise
							lineHeight: px(size.md_default_line_height),
							fontSize: a.fontSize,
						},
					}),
				]),
			)
		}
	}

	_getTextArea(a: BorderTextFieldAttrs): Children {
		if (a.isReadOnly) {
			return m(
				".text-prewrap.text-break.selectable",
				{
					style: {
						margin: px(size.md_default_margin),
						lineHeight: px(size.md_default_line_height),
					},
				},
				a.value,
			)
		} else {
			return m("textarea.input-area.text-pre", {
				"aria-label": lang.getMaybeLazy(a.label),
				disabled: a.disabled,
				class: getOperatingClasses(a.disabled) + " text",
				oncreate: (vnode) => {
					this.domInput = vnode.dom as HTMLInputElement
					this.domInput.value = a.value
					this.domInput.style.height = px(Math.max(a.value.split("\n").length, 1) * inputLineHeight) // display all lines on creation of text area
				},
				onfocus: (e: FocusEvent) => this.focus(e, a),
				onblur: (e: FocusEvent) => this.blur(e, a),
				onkeydown: (e: KeyboardEvent) => {
					let key = {
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
					margin: px(size.md_default_margin),
					lineHeight: px(size.md_default_line_height),
					minHeight: a.areaTextFieldLines ? px(size.md_default_line_height * a.areaTextFieldLines) : px(size.md_default_line_height * 2),
					minWidth: px(20), // fix for edge browser. buttons are cut off in small windows otherwise
					fontSize: a.fontSize,
					"white-space": "normal",
				},
			})
		}
	}

	focus(e: Event, a: BorderTextFieldAttrs) {
		if (!this.active && !a.disabled && !a.isReadOnly) {
			this.active = true
			this.domInput.focus()

			this._domWrapper.classList.add("active")
		}
	}

	blur(e: Event, a: BorderTextFieldAttrs) {
		this._domWrapper.classList.remove("active")
		this.active = false
		if (a.onblur instanceof Function) a.onblur(e)
	}

	isEmpty(value: string): boolean {
		return value === ""
	}
}
