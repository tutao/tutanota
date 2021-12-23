// @flow

import m from "mithril"
import type {TextFieldAttrs} from "../gui/base/TextFieldN"
import {TextFieldN} from "../gui/base/TextFieldN"
import type {DialogHeaderBarAttrs} from "../gui/base/DialogHeaderBar"
import type {ButtonAttrs} from "../gui/base/ButtonN"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import {Dialog} from "../gui/base/Dialog"
import {Icons} from "../gui/base/icons/Icons"
import {createDropdown} from "../gui/base/DropdownN"
import type {Language} from "../misc/LanguageViewModel"
import {lang} from "../misc/LanguageViewModel"
import type {EmailTemplate} from "../api/entities/tutanota/EmailTemplate"
import {getLanguageName, TemplateEditorModel} from "./TemplateEditorModel"
import {locator} from "../api/main/MainLocator"
import type {TemplateGroupRoot} from "../api/entities/tutanota/TemplateGroupRoot"
import {showUserError} from "../misc/ErrorHandlerImpl"
import {UserError} from "../api/main/UserError"
import {HtmlEditor} from "../gui/editor/HtmlEditor"
import {ofClass} from "@tutao/tutanota-utils"

/**
 * Creates an Editor Popup in which you can create a new template or edit an existing one
 */

export function showTemplateEditor(template: ?EmailTemplate, templateGroupRoot: TemplateGroupRoot): void {
	const entityClient = locator.entityClient
	const editorModel = new TemplateEditorModel(template, templateGroupRoot, entityClient)
	const dialogCloseAction = () => {
		dialog.close()
	}

	const saveAction = () => {
		editorModel.save()
		           .then(() => {
			           dialogCloseAction()
		           })
		           .catch(ofClass(UserError, showUserError))
	}

	let headerBarAttrs: DialogHeaderBarAttrs = {
		left: [{label: 'cancel_action', click: dialogCloseAction, type: ButtonType.Secondary}],
		right: [{label: 'save_action', click: saveAction, type: ButtonType.Primary}],
		middle: () => lang.get(editorModel.template._id ? "editTemplate_action" : "createTemplate_action")
	}

	const dialog = Dialog.largeDialogN(headerBarAttrs, TemplateEditor, {model: editorModel})
	dialog.show()
}

type TemplateEditorAttrs = {
	model: TemplateEditorModel
}


class TemplateEditor implements MComponent<TemplateEditorAttrs> {
	model: TemplateEditorModel
	_templateContentEditor: HtmlEditor
	_enterTitleAttrs: TextFieldAttrs
	_enterTagAttrs: TextFieldAttrs
	_chooseLanguageAttrs: TextFieldAttrs

	constructor(vnode: Vnode<TemplateEditorAttrs>) {
		this.model = vnode.attrs.model

		this._templateContentEditor = new HtmlEditor("content_label", {enabled: true})
			.showBorders()
			.setMinHeight(500)

		this.model.setContentProvider(() => {
			return this._templateContentEditor.getValue()
		})

		// init all input fields
		this.model.title(this.model.template.title)
		this.model.tag(this.model.template.tag)
		const content = this.model.selectedContent()
		if (content) {
			this._templateContentEditor.setValue(content.text)
		}

		// Initialize Attributes for TextFields and Buttons
		this._enterTitleAttrs = {
			label: "title_placeholder",
			value: this.model.title
		}

		this._enterTagAttrs = {
			label: "shortcut_label",
			value: this.model.tag
		}

		this._chooseLanguageAttrs = {
			label: "language_label",
			value: this.model.selectedContent.map((content) => content ? getLanguageName(content) : ""),
			injectionsRight: () => [
				this.model.getAddedLanguages().length > 1 ? [
					m(ButtonN, removeButtonAttrs),
					m(ButtonN, selectLanguageButton),
				] : null,
				m(ButtonN, addLanguageButtonAttrs),
			],
			disabled: true
		}

		const selectLanguageButton: ButtonAttrs = {
			label: "languages_label",
			type: ButtonType.Action,
			icon: () => Icons.Language,
			click: createDropdown(() => {
				// save current content with language & create a dropdwon with all added languages & an option to add a new language
				this.model.updateContent()
				return this.model.template.contents.map(content => {
					return {
						label: () => getLanguageName(content),
						click: () => {
							this.model.selectedContent(content)
							this._templateContentEditor.setValue(content.text)
						},
						type: ButtonType.Dropdown
					}
				})
			})
		}

		const removeButtonAttrs: ButtonAttrs = {
			label: "removeLanguage_action",
			icon: () => Icons.Trash,
			type: ButtonType.Action,
			click: () => {
				return Dialog.confirm(() => lang.get("deleteLanguageConfirmation_msg", {"{language}": (getLanguageName(this.model.selectedContent()))})).then((confirmed) => {
					if (confirmed) {
						this.model.removeContent()
						this.model.selectedContent(this.model.template.contents[0])
						this._templateContentEditor.setValue(this.model.selectedContent().text)
					}
					return confirmed
				})
			}
		}

		const addLanguageButtonAttrs: ButtonAttrs = {
			label: "addLanguage_action",
			type: ButtonType.Action,
			icon: () => Icons.Add,
			click: createDropdown(() =>
					this.model.getAdditionalLanguages()
					    .sort((a, b) => lang.get(a.textId).localeCompare(lang.get(b.textId)))
					    .map(lang => this.createAddNewLanguageButtonAttrs(lang))
				, 250)
		}
	}

	view(): Children {
		return m("", [
			m(TextFieldN, this._enterTitleAttrs),
			m(TextFieldN, this._enterTagAttrs),
			m(TextFieldN, this._chooseLanguageAttrs),
			m(this._templateContentEditor)
		])
	}

	createAddNewLanguageButtonAttrs(lang: Language): ButtonAttrs {
		return {
			label: lang.textId,
			click: () => {
				// save the current state of the content editor in the model,
				// because we will overwrite it when a new language is added
				this.model.updateContent()
				const newContent = this.model.createContent(lang.code)
				this.model.selectedContent(newContent)
				this._templateContentEditor.setValue("")
			},
			type: ButtonType.Dropdown
		}
	}
}