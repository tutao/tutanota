// @flow
import {inputLineHeight, px, size} from "../size"
import m from "mithril"
import {animations, fontSize, height, transform} from "./../animation/Animations"
import {assertMainOrNode} from "../../api/common/Env"
import {progressIcon} from "./Icon"
import type {ButtonAttrs} from "./ButtonN"
import {ButtonN, isSelected} from "./ButtonN"
import type {keyHandler, KeyPress} from "../../misc/KeyManager"
import type {TranslationKey} from "../../misc/LanguageViewModel"
import {lang} from "../../misc/LanguageViewModel"
import stream from "mithril/stream/stream.js"
import {theme} from "../theme"
import {TabIndex} from "../../api/common/TutanotaConstants"
import {ease} from "../animation/Easing"
import type {TextFieldTypeEnum} from "./TextFieldN"

assertMainOrNode()

/**
 * The BubbleInputField delegates certain tasks like retrieving suggestions and creating bubbles
 * to the BubbleHandler.
 */
export interface BubbleHandler<T, S:Suggestion> {
	/**
	 * @param text The text to filter for.
	 * @return A list of suggestions.
	 */
	getSuggestions(text: string): Promise<S[]>;

	/**
	 * Creates a new bubble for a suggestion.
	 * @param suggestion The suggestion.
	 * @return Returns the new bubble or null if none could be created.
	 */
	createBubbleFromSuggestion(suggestion: S): ?Bubble<T>;

	/**
	 * Creates a list of bubbles from the provided text.
	 * @param text
	 * @return Returns the new bubble or null if none could be created.
	 */
	createBubblesFromText(text: string): Bubble<T>[];

	/**
	 * Notifies the BubbleHandler that the given bubble was deleted.
	 * @param bubble The bubble that was deleted.
	 */
	bubbleDeleted(bubble: Bubble<T>): void;

	/**
	 * Height of a suggestion in pixels
	 */
	suggestionHeight: number;
}

/**
 * Suggestions are provided to the user whenever he writes text to the input field.
 */
export interface Suggestion {
	view: Function;
	selected: boolean;
}

export class BubbleTextField<T> {
	loading: ?Promise<void>;
	bubbles: Bubble<T>[];
	previousQuery: string;
	originalIsEmpty: Function;
	suggestions: Suggestion[];
	selectedSuggestion: ?Suggestion;
	suggestionAnimation: Promise<void>;
	bubbleHandler: BubbleHandler<T, Suggestion>;
	view: Function;

	_textField: TextField;
	_domSuggestions: HTMLElement;

	constructor(labelIdOrLabelTextFunction: TranslationKey | lazy<string>, bubbleHandler: BubbleHandler<T, any>,
	            suggestionStyle: {[string]: any} = {}, injectionsRight: ?lazy<Children> = () => {return null}, disabled: ?boolean = false) {
		this.loading = null
		this.suggestions = []
		this.selectedSuggestion = null
		this.suggestionAnimation = Promise.resolve()
		this.previousQuery = ""
		this._textField = new TextField(labelIdOrLabelTextFunction)
		this._textField.value.map(value => {
			this._updateSuggestions()
		})

		if (disabled) {
			this._textField.setDisabled()
		}

		this.bubbles = []

		// ATTENTION (When refactoring BubbleTextField to BubbleTextFieldN): The class.flex-wrap was removed in TextFieldN for injectionsLeft
		// and needs to be reinserted for the BubbleTextField exclusively.
		this._textField._injectionsLeft = () => this.bubbles.map((b, i) => {
			// We need overflow: hidden on both so that ellipsis on button works.
			// flex is for reserving space for the comma. align-items: end so that comma is pushed to the bottom.
			return m(".flex.overflow-hidden.items-end", [
				m(".flex-no-grow-shrink-auto.overflow-hidden", m(ButtonN, b.buttonAttrs)),
				// Comma is shown when there's another recipient afterwards or if the field is active
				(this._textField.isActive() || i < this.bubbles.length - 1) ? m("span.pr", ",") : null
			])
		})
		this._textField._injectionsRight = () => {
			return this.loading != null ? m(".align-right.mr-s", progressIcon()) : injectionsRight && injectionsRight()
		}
		this.originalIsEmpty = this._textField.isEmpty.bind(this._textField)
		this._textField.isEmpty = () => this.originalIsEmpty() && this.bubbles.length === 0
		this._textField.baseLabelPosition = size.text_field_label_top
		this._textField.onblur.map(() => this.createBubbles())
		this._textField._keyHandler = key => this.handleKey(key)

		this.bubbleHandler = bubbleHandler

		this.view = () => {
			return m('.bubble-text-field', [
				m(this._textField, {
					oncreate: () => {
						// If the field is initialized with bubbles but the user did not edit it yet then field will not have correct size
						// and last bubble will not be on the same line with right injections (like "show" button). It is fixed after user
						// edits the field and autocompletion changes the field but before that it's broken. To avoid it we set the size
						// manually.
						//
						// This oncreate is run before the dom input's oncreate is run and sets the field so we have to access input on the
						// next frame. There's no other callback to use without requesting redraw.
						requestAnimationFrame(() => {
							if (this._textField._domInput) this._textField._domInput.size = 1
						})
					}
				}),
				m(".suggestions.text-ellipsis.ml-negative-l", {
					oncreate: vnode => this._domSuggestions = vnode.dom,
					onmousedown: e => this._textField.skipNextBlur = true,
					style: suggestionStyle,
				}, this.suggestions.map(s => m(s, {
					mouseDownHandler: e => {
						this.selectedSuggestion = s
						this.createBubbles()
					}
				})))
			])
		}
	}

	_updateSuggestions() {
		let value = this._textField.value()
		if (this._textField._domInput) {
			this._textField._domInput.size = value.length + 3
		}
		let query = value.trim()
		if (this.loading != null) {

		} else if (query.length > 0 && !(this.previousQuery.length > 0 && query.indexOf(this.previousQuery) === 0
			&& this.suggestions.length === 0)) {
			this.loading = this.bubbleHandler.getSuggestions(query).then(newSuggestions => {
				this.loading = null
				// Only update search result if search query has not been changed during search and update in all other cases
				if (query === this._textField.value().trim()) {
					this.animateSuggestionsHeight(this.suggestions.length, newSuggestions.length)
					this.suggestions = newSuggestions
					if (this.suggestions.length > 0) {
						this.selectedSuggestion = this.suggestions[0]
						this.selectedSuggestion.selected = true
					} else {
						this.selectedSuggestion = null
					}
					this.previousQuery = query
					let input = this._textField._domInput
					if (input && this._textField.value() !== input.value) {
						// 1.) update before redraw to workaround missing updates
						// 2.) only update in case of an updated value
						this._textField.value(input.value)
					}
					m.redraw()
				} else {
					this._updateSuggestions()
				}
			})
		} else if (query.length === 0 && query !== this.previousQuery) {
			this.animateSuggestionsHeight(this.suggestions.length, 0)
			this.suggestions = []
			this.selectedSuggestion = null
			this.previousQuery = query
		}
	}

	animateSuggestionsHeight(currentCount: number, newCount: number) {
		let currentHeight = this.bubbleHandler.suggestionHeight * currentCount
		let newHeight = this.bubbleHandler.suggestionHeight * newCount
		this.suggestionAnimation = this.suggestionAnimation.then(() => animations.add(this._domSuggestions, height(currentHeight, newHeight)))
	}


	handleKey(key: KeyPress): boolean {
		switch (key.keyCode) {
			case 13: // return
			case 32: // whitespace
				return this.createBubbles() || false
			case 8:
				return this.handleBackspace()
			case 46:
				return this.handleDelete()
			case 37:
				return this.handleLeftArrow()
			case 39:
				return this.handleRightArrow()
			case 38:
				return this.handleUpArrow()
			case 40:
				return this.handleDownArrow()
			case 65:
				if (key.ctrl) return this.selectAll(); else break
			case 17: // do not react on ctrl key
				return true
		}

		// Handle commas
		if (key.key === ",") {
			return this.createBubbles() || false
		}
		this.removeBubbleSelection()
		return true
	}

	createBubbles(): void {
		let value = this._textField.value().trim()
		if (value === "") return

		// if there is a selected suggestion, we shall create a bubble from that suggestions instead of the entered text
		if (this.selectedSuggestion != null) {
			let bubble = this.bubbleHandler.createBubbleFromSuggestion(this.selectedSuggestion)
			if (bubble) {
				this.bubbles.push(bubble)
				this._textField.value("")
			}
		} else {
			let bubbles = this.bubbleHandler.createBubblesFromText(value)
			if (bubbles.length > 0) {
				this.bubbles.push(...bubbles)
				this._textField.value("")
			}
		}
		m.redraw()
	}

	handleBackspace(): boolean {
		const input = this._textField._domInput
		if (input && this.bubbles.length > 0 && input.selectionStart === 0
			&& input.selectionEnd === 0) {
			const bubble = this.bubbles.pop()
			this.bubbleHandler.bubbleDeleted(bubble)
			this._textField.value(bubble.text)
			return false
		}
		return true
	}

	handleDelete(): boolean {
		let selected = this.bubbles.find(b => isSelected(b.buttonAttrs))
		if (selected) {
			let selectedIndex = this.bubbles.indexOf((selected: any))
			this.deleteSelectedBubbles()
			if (selectedIndex >= 0 && selectedIndex < this.bubbles.length) {
				this.bubbles[selectedIndex].buttonAttrs.isSelected = () => true
			}
			return false
		}
		return true
	}

	handleLeftArrow(): boolean {
		let selected = this.bubbles.find(b => isSelected(b.buttonAttrs))
		if (selected) {
			let selectedIndex = this.bubbles.indexOf((selected: any))
			if (selectedIndex > 0) {
				selected.buttonAttrs.isSelected = () => false
				this.bubbles[selectedIndex - 1].buttonAttrs.isSelected = () => true
			}
		} else if (this._textField._domInput
			&& this._textField._domInput.selectionStart === 0
			&& this._textField._domInput.selectionEnd === 0) {
			this.selectLastBubble()
		}
		return true
	}

	handleRightArrow(): boolean {
		let selected = this.bubbles.find(b => isSelected(b.buttonAttrs))
		if (selected) {
			let selectedIndex = this.bubbles.indexOf((selected: any))
			selected.buttonAttrs.isSelected = () => false
			if (selectedIndex >= 0 && selectedIndex < this.bubbles.length - 1) {
				this.bubbles[selectedIndex + 1].buttonAttrs.isSelected = () => true
			}
			return false
		}
		return true
	}

	handleUpArrow(): boolean {
		if (this.selectedSuggestion != null) {
			this.selectedSuggestion.selected = false
			let next = (this.suggestions.indexOf(this.selectedSuggestion) - 1) % this.suggestions.length
			if (next === -1) {
				next = this.suggestions.length - 1
			}
			this.selectedSuggestion = this.suggestions[next]
			this.selectedSuggestion.selected = true
		}
		return false
	}

	handleDownArrow(): boolean {
		if (this.selectedSuggestion != null) {
			this.selectedSuggestion.selected = false
			let next = (this.suggestions.indexOf(this.selectedSuggestion) + 1)
			if (next === this.suggestions.length) {
				next = 0
			}
			this.selectedSuggestion = this.suggestions[next]
			this.selectedSuggestion.selected = true
		} else if (this.suggestions.length > 0) {
			this.selectedSuggestion = this.suggestions[0]
			this.selectedSuggestion.selected = true
		}
		return false
	}

	selectAll(): boolean {
		this.bubbles.forEach(b => b.buttonAttrs.isSelected = () => true)
		return true
	}

	removeBubbleSelection(): void {
		this.bubbles.forEach(b => b.buttonAttrs.isSelected = () => false)
	}

	deleteSelectedBubbles(): void {
		for (var i = this.bubbles.length - 1; i >= 0; i--) {
			if (isSelected(this.bubbles[i].buttonAttrs)) {
				var deletedBubble = this.bubbles.splice(i, 1)[0]
				this.bubbleHandler.bubbleDeleted(deletedBubble)
			}
		}
	}

	isBubbleSelected(): boolean {
		return this.bubbles.find(b => isSelected(b.buttonAttrs)) != null
	}

	selectLastBubble(): void {
		if (this.bubbles.length > 0) {
			this.bubbles[this.bubbles.length - 1].buttonAttrs.isSelected = () => true
		}
	}

	currentValue(): string {
		return this._textField.value()
	}
}

export class Bubble<T> {
	entity: T;
	buttonAttrs: ButtonAttrs;
	text: string;

	constructor(entity: T, buttonAttrs: ButtonAttrs, text: string) {
		this.entity = entity
		this.buttonAttrs = buttonAttrs
		this.text = text
	}
}

const inputMarginTop: number = size.font_size_small + size.hpad_small + 3

/**
 * TextField has been replaced with TextFieldN in all places but BubbleTextField. We have decided to move TextField here for now
 * to make sure no-one uses it anymore. Trying to replace it in BubbleTextField would require pretty much a whole rewrite which
 * did not seem feasible at the time.
 */
class TextField {
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