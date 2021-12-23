//@flow

import {Editor} from "../../gui/editor/Editor"
import {isKeyPressed} from "../../misc/KeyManager"
import {downcast} from "@tutao/tutanota-utils"
import {Keys} from "../../api/common/TutanotaConstants"
import {TEMPLATE_SHORTCUT_PREFIX, TemplatePopupModel} from "../model/TemplatePopupModel"
import {lang, languageByCode, LanguageViewModel} from "../../misc/LanguageViewModel"
import {ButtonType} from "../../gui/base/ButtonN"
import {DropdownN} from "../../gui/base/DropdownN"
import {modal} from "../../gui/base/Modal"
import {showTemplatePopupInEditor} from "./TemplatePopup"
import {firstThrow} from "@tutao/tutanota-utils"

export function registerTemplateShortcutListener(editor: Editor, templateModel: TemplatePopupModel): TemplateShortcutListener {
	const listener = new TemplateShortcutListener(editor, templateModel, lang)
	editor.addEventListener("keydown", (event) => listener.handleKeyDown(event))
	editor.addEventListener("cursor", (event) => listener.handleCursorChange(event))
	return listener
}


class TemplateShortcutListener {
	_currentCursorPosition: ?Range
	_editor: Editor
	_templateModel: TemplatePopupModel
	_lang: LanguageViewModel

	constructor(editor: Editor, templateModel: TemplatePopupModel, lang: LanguageViewModel) {
		this._editor = editor
		this._currentCursorPosition = null
		this._templateModel = templateModel
		this._lang = lang
	}

	// add this event listener to handle quick selection of templates inside the editor
	handleKeyDown(event: Event) {
		if (isKeyPressed(downcast(event).keyCode, Keys.TAB) && this._currentCursorPosition) {
			const cursorEndPos = this._currentCursorPosition
			const text = cursorEndPos.startContainer.nodeType === Node.TEXT_NODE ? cursorEndPos.startContainer.textContent : ""
			const templateShortcutStartIndex = text.lastIndexOf(TEMPLATE_SHORTCUT_PREFIX)
			const lastWhiteSpaceIndex = text.search(/\s\S*$/)
			if (templateShortcutStartIndex !== -1 && templateShortcutStartIndex < cursorEndPos.startOffset
				&& templateShortcutStartIndex > lastWhiteSpaceIndex) {
				// stopPropagation & preventDefault to prevent tabbing to "close" button or tabbing into background
				event.stopPropagation()
				event.preventDefault()

				const range = document.createRange()
				range.setStart(cursorEndPos.startContainer, templateShortcutStartIndex)
				range.setEnd(cursorEndPos.startContainer, cursorEndPos.startOffset)
				this._editor.setSelection(range)

				// find and insert template
				const selectedText = this._editor.getSelectedText();
				const template = this._templateModel.findTemplateWithTag(selectedText)
				if (template) {
					if (template.contents.length > 1) { // multiple languages
						// show dropdown to select language
						let buttons = template.contents.map(content => {
							return {
								label: () => this._lang.get(languageByCode[downcast(content.languageCode)].textId),
								click: () => {
									this._editor.insertHTML(content.text)
									this._editor.focus()
								},
								type: ButtonType.Dropdown
							}
						})
						const dropdown = new DropdownN(() => buttons, 200)
						dropdown.setOrigin(this._editor.getCursorPosition())
						modal.displayUnique(dropdown, false)
					} else {
						this._editor.insertHTML(firstThrow(template.contents).text)
					}
				} else {
					showTemplatePopupInEditor(this._templateModel, this._editor, null, selectedText)
				}
			}
		}
	}

	handleCursorChange(event: Event) {
		this._currentCursorPosition = downcast(event).range
	}
}