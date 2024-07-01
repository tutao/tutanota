import { Editor } from "../../../common/gui/editor/Editor"
import { isKeyPressed } from "../../../common/misc/KeyManager"
import { downcast, getFirstOrThrow } from "@tutao/tutanota-utils"
import { Keys } from "../../../common/api/common/TutanotaConstants"
import { TEMPLATE_SHORTCUT_PREFIX, TemplatePopupModel } from "../model/TemplatePopupModel.js"
import { lang, languageByCode, LanguageViewModel } from "../../../common/misc/LanguageViewModel"
import { Dropdown } from "../../../common/gui/base/Dropdown.js"
import { modal } from "../../../common/gui/base/Modal"
import { showTemplatePopupInEditor } from "./TemplatePopup.js"

export function registerTemplateShortcutListener(editor: Editor, templateModel: TemplatePopupModel): TemplateShortcutListener {
	const listener = new TemplateShortcutListener(editor, templateModel, lang)
	editor.addEventListener("keydown", (event: KeyboardEvent) => listener.handleKeyDown(event))
	editor.addEventListener("cursor", (event: CustomEvent<{ range: Range | null }>) => listener.handleCursorChange(event))
	return listener
}

class TemplateShortcutListener {
	_currentCursorPosition: Range | null
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
	handleKeyDown(event: KeyboardEvent) {
		if (isKeyPressed(event.key, Keys.TAB) && this._currentCursorPosition) {
			const cursorEndPos = this._currentCursorPosition
			const text = cursorEndPos.startContainer.nodeType === Node.TEXT_NODE ? cursorEndPos.startContainer.textContent ?? "" : ""
			const templateShortcutStartIndex = text.lastIndexOf(TEMPLATE_SHORTCUT_PREFIX)
			const lastWhiteSpaceIndex = text.search(/\s\S*$/)

			if (
				templateShortcutStartIndex !== -1 &&
				templateShortcutStartIndex < cursorEndPos.startOffset &&
				templateShortcutStartIndex > lastWhiteSpaceIndex
			) {
				// stopPropagation & preventDefault to prevent tabbing to "close" button or tabbing into background
				event.stopPropagation()
				event.preventDefault()
				const range = document.createRange()
				range.setStart(cursorEndPos.startContainer, templateShortcutStartIndex)
				range.setEnd(cursorEndPos.startContainer, cursorEndPos.startOffset)

				this._editor.setSelection(range)

				// find and insert template
				const selectedText = this._editor.getSelectedText()

				const template = this._templateModel.findTemplateWithTag(selectedText)

				if (template) {
					if (template.contents.length > 1) {
						// multiple languages
						// show dropdown to select language
						let buttons = template.contents.map((content) => {
							return {
								label: () => this._lang.get(languageByCode[downcast(content.languageCode)].textId),
								click: () => {
									this._editor.insertHTML(content.text)

									this._editor.focus()
								},
							}
						})
						const dropdown = new Dropdown(() => buttons, 200)
						dropdown.setOrigin(this._editor.getCursorPosition())
						modal.displayUnique(dropdown, false)
					} else {
						this._editor.insertHTML(getFirstOrThrow(template.contents).text)
					}
				} else {
					showTemplatePopupInEditor(this._templateModel, this._editor, null, selectedText)
				}
			}
		}
	}

	handleCursorChange(event: CustomEvent<{ range: Range | null }>) {
		this._currentCursorPosition = event.detail.range
	}
}
