// @flow
import {size} from "../size"
import m from "mithril"
import {TextField} from "./TextField"
import {animations, height} from "./../animation/Animations"
import {assertMainOrNode} from "../../api/common/Env"
import {progressIcon} from "./Icon"
import type {ButtonAttrs} from "./ButtonN"
import {ButtonN, isSelected} from "./ButtonN"
import type {KeyPress} from "../../misc/KeyManager"
import type {TranslationKey} from "../../misc/LanguageViewModel"

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
	textField: TextField;
	bubbles: Bubble<T>[];
	previousQuery: string;
	originalIsEmpty: Function;
	suggestions: Suggestion[];
	selectedSuggestion: ?Suggestion;
	suggestionAnimation: Promise<void>;
	bubbleHandler: BubbleHandler<T, Suggestion>;
	view: Function;

	_domSuggestions: HTMLElement;

	constructor(labelIdOrLabelTextFunction: TranslationKey | lazy<string>, bubbleHandler: BubbleHandler<T, any>,
	            suggestionStyle: {[string]: any} = {}) {
		this.loading = null
		this.suggestions = []
		this.selectedSuggestion = null
		this.suggestionAnimation = Promise.resolve()
		this.previousQuery = ""
		this.textField = new TextField(labelIdOrLabelTextFunction)
		this.textField.value.map(value => {
			this._updateSuggestions()
		})

		this.bubbles = []

		this.textField._injectionsLeft = () => this.bubbles.map((b, i) => {
			// We need overflow: hidden on both so that ellipsis on button works.
			// flex is for reserving space for the comma. align-items: end so that comma is pushed to the bottom.
			return m(".flex.overflow-hidden.items-end", [
				m(".flex-no-grow-shrink-auto.overflow-hidden", m(ButtonN, b.buttonAttrs)),
				// Comma is shown when there's another recipient afterwards or if the field is active
				(this.textField.isActive() || i < this.bubbles.length - 1) ? m("span.pr", ",") : null
			])
		})
		this.textField._injectionsRight = () => {
			return this.loading != null ? m(".align-right.mr-s", progressIcon()) : null
		}
		this.originalIsEmpty = this.textField.isEmpty.bind(this.textField)
		this.textField.isEmpty = () => this.originalIsEmpty() && this.bubbles.length === 0
		this.textField.baseLabelPosition = size.text_field_label_top
		this.textField.onblur.map(() => this.createBubbles())
		this.textField._keyHandler = key => this.handleKey(key)

		this.bubbleHandler = bubbleHandler

		this.view = () => {
			return m('.bubble-text-field', [
				m(this.textField, {
					oncreate: () => {
						// If the field is initialized with bubbles but the user did not edit it yet then field will not have correct size
						// and last bubble will not be on the same line with right injections (like "show" button). It is fixed after user
						// edits the field and autocompletion changes the field but before that it's broken. To avoid it we set the size
						// manually.
						//
						// This oncreate is run before the dom input's oncreate is run and sets the field so we have to access input on the
						// next frame. There's no other callback to use without requesting redraw.
						requestAnimationFrame(() => {
							if (this.textField._domInput) this.textField._domInput.size = 1
						})
					}
				}),
				m(".suggestions.text-ellipsis.ml-negative-l", {
					oncreate: vnode => this._domSuggestions = vnode.dom,
					onmousedown: e => this.textField.skipNextBlur = true,
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
		let value = this.textField.value()
		if (this.textField._domInput) {
			this.textField._domInput.size = value.length + 3
		}
		let query = value.trim()
		if (this.loading != null) {

		} else if (query.length > 0 && !(this.previousQuery.length > 0 && query.indexOf(this.previousQuery) === 0
			&& this.suggestions.length === 0)) {
			this.loading = this.bubbleHandler.getSuggestions(query).then(newSuggestions => {
				this.loading = null
				// Only update search result if search query has not been changed during search and update in all other cases
				if (query === this.textField.value().trim()) {
					this.animateSuggestionsHeight(this.suggestions.length, newSuggestions.length)
					this.suggestions = newSuggestions
					if (this.suggestions.length > 0) {
						this.selectedSuggestion = this.suggestions[0]
						this.selectedSuggestion.selected = true
					} else {
						this.selectedSuggestion = null
					}
					this.previousQuery = query
					let input = this.textField._domInput
					if (input && this.textField.value() !== input.value) {
						// 1.) update before redraw to workaround missing updates
						// 2.) only update in case of an updated value
						this.textField.value(input.value)
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
		let value = this.textField.value().trim()
		if (value === "") return

		// if there is a selected suggestion, we shall create a bubble from that suggestions instead of the entered text
		if (this.selectedSuggestion != null) {
			let bubble = this.bubbleHandler.createBubbleFromSuggestion(this.selectedSuggestion)
			if (bubble) {
				this.bubbles.push(bubble)
				this.textField.value("")
			}
		} else {
			let bubbles = this.bubbleHandler.createBubblesFromText(value)
			if (bubbles.length > 0) {
				this.bubbles.push(...bubbles)
				this.textField.value("")
			}
		}
		m.redraw()
	}

	handleBackspace(): boolean {
		const input = this.textField._domInput
		if (input && this.bubbles.length > 0 && input.selectionStart === 0
			&& input.selectionEnd === 0) {
			const bubble = this.bubbles.pop()
			this.bubbleHandler.bubbleDeleted(bubble)
			this.textField.value(bubble.text)
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
		} else if (this.textField._domInput
			&& this.textField._domInput.selectionStart === 0
			&& this.textField._domInput.selectionEnd === 0) {
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
