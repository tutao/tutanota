// @flow
import {size, px} from "../size"
import m from "mithril"
import {TextField} from "./TextField"
import {Button} from "./Button"
import {animations, height} from "./../animation/Animations"
import {assertMainOrNode} from "../../api/Env"
import {progressIcon} from "./Icon"

assertMainOrNode()

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

	constructor(label: string, bubbleHandler: BubbleHandler<T, any>) {
		this.loading = null
		this.suggestions = []
		this.selectedSuggestion = null
		this.suggestionAnimation = Promise.resolve()
		this.previousQuery = ""
		this.textField = new TextField(label)
		this.textField.value.map(value => {
			this._updateSuggestions()
		})

		this.bubbles = []

		this.textField._injectionsLeft = () => this.bubbles.map((b, i) => {
			return m("", [
				m(b.button),
				(this.textField.isActive() || i < this.bubbles.length - 1) ? m("span.pr", ",") : null
			])
		})
		this.textField._injectionsRight = () => {
			return this.loading != null ? m(".align-right", progressIcon()) : null
		}
		this.originalIsEmpty = this.textField.isEmpty.bind(this.textField)
		this.textField.isEmpty = () => this.originalIsEmpty() && this.bubbles.length === 0
		this.textField.baseLabelPosition = size.text_field_label_top
		this.textField.onblur.map(() => this.createBubbles())
		this.textField._keyHandler = key => this.handleKey(key)

		this.bubbleHandler = bubbleHandler

		this.view = () => {
			return m('.bubble-text-field', [
				m(this.textField),
				m(".suggestions.text-ellipsis.ml-negative-l", {
					oncreate: vnode => this._domSuggestions = vnode.dom,
					onmousedown: e => this.textField.skipNextBlur = true,
				}, this.suggestions.map(s => m(s, {
					clickHandler: e => {
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

		} else if (query.length > 0 && !(this.previousQuery.length > 0 && query.indexOf(this.previousQuery) === 0 && this.suggestions.length === 0)) {
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
					if (this.textField.value() !== this.textField._domInput.value) {
						// 1.) update before redraw to workaround missing updates
						// 2.) only update in case of an updated value
						this.textField.value(this.textField._domInput.value)
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


	handleKey(key: KeyPress) {
		switch (key.keyCode) {
			case 13: // return
			case 32: // whitespace
				return this.createBubbles()
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
				if (key.ctrlKey) return this.selectAll(); else break
			case 17: // do not react on ctrl key
				return true
		}
		this.removeBubbleSelection()
		return true
	}

	createBubbles(): boolean {
		let value = this.textField.value().trim()
		if (value === "") return false

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
		return false //TODO: explain
	}

	handleBackspace() {
		let selected = this.bubbles.find(b => b.button.isSelected())
		if (selected) {
			let selectedIndex = this.bubbles.indexOf((selected:any))
			this.deleteSelectedBubbles()
			if (selectedIndex > 0) {
				this.bubbles[selectedIndex - 1].button.setSelected(() => true)
			}
			return false
		} else if (this.textField._domInput.selectionStart === 0 && this.textField._domInput.selectionEnd === 0) {
			this.selectLastBubble()
			return false
		}
		return true
	}

	handleDelete() {
		let selected = this.bubbles.find(b => b.button.isSelected())
		if (selected) {
			let selectedIndex = this.bubbles.indexOf((selected:any))
			this.deleteSelectedBubbles()
			if (selectedIndex >= 0 && selectedIndex < this.bubbles.length) {
				this.bubbles[selectedIndex].button.setSelected(() => true)
			}
			return false
		}
		return true
	}

	handleLeftArrow() {
		let selected = this.bubbles.find(b => b.button.isSelected())
		if (selected) {
			let selectedIndex = this.bubbles.indexOf((selected:any))
			if (selectedIndex > 0) {
				selected.button.setSelected(() => false)
				this.bubbles[selectedIndex - 1].button.setSelected(() => true)
			}
		} else if (this.textField._domInput.selectionStart === 0 && this.textField._domInput.selectionEnd === 0) {
			this.selectLastBubble()
		}
		return true
	}

	handleRightArrow() {
		let selected = this.bubbles.find(b => b.button.isSelected())
		if (selected) {
			let selectedIndex = this.bubbles.indexOf((selected:any))
			selected.button.setSelected(() => false)
			if (selectedIndex >= 0 && selectedIndex < this.bubbles.length - 1) {
				this.bubbles[selectedIndex + 1].button.setSelected(() => true)
			}
			return false
		}
		return true
	}

	handleUpArrow() {
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

	handleDownArrow() {
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

	selectAll() {
		this.bubbles.forEach(b => b.button.setSelected(() => true))
		return true
	}

	removeBubbleSelection() {
		this.bubbles.forEach(b => b.button.setSelected(() => false))
	}

	deleteSelectedBubbles() {
		for (var i = this.bubbles.length - 1; i >= 0; i--) {
			if (this.bubbles[i].button.isSelected()) {
				var deletedBubble = this.bubbles.splice(i, 1)[0]
				this.bubbleHandler.bubbleDeleted(deletedBubble)
			}
		}
	}

	isBubbleSelected() {
		return this.bubbles.find(b => b.button.isSelected()) != null
	}

	selectLastBubble() {
		if (this.bubbles.length > 0)
			this.bubbles[this.bubbles.length - 1].button.setSelected(() => true)
	}
}

export class Bubble<T> {
	entity: T;
	button: Button;

	constructor(entity: T, button: Button) {
		this.entity = entity
		this.button = button
	}
}
