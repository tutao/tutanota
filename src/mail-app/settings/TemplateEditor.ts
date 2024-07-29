import m, { Children, Component, Vnode } from "mithril"
import { TextField } from "../../common/gui/base/TextField.js"
import type { DialogHeaderBarAttrs } from "../../common/gui/base/DialogHeaderBar"
import type { ButtonAttrs } from "../../common/gui/base/Button.js"
import { Button, ButtonType } from "../../common/gui/base/Button.js"
import { Dialog } from "../../common/gui/base/Dialog"
import { Icons } from "../../common/gui/base/icons/Icons"
import { createDropdown, DropdownButtonAttrs } from "../../common/gui/base/Dropdown.js"
import type { Language } from "../../common/misc/LanguageViewModel"
import { lang } from "../../common/misc/LanguageViewModel"
import type { EmailTemplate, TemplateGroupRoot } from "../../common/api/entities/tutanota/TypeRefs.js"
import { getLanguageName, TemplateEditorModel } from "./TemplateEditorModel"
import { locator } from "../../common/api/main/CommonLocator"
import { showUserError } from "../../common/misc/ErrorHandlerImpl"
import { UserError } from "../../common/api/main/UserError"
import { HtmlEditor } from "../../common/gui/editor/HtmlEditor"
import { ofClass } from "@tutao/tutanota-utils"
import { IconButton } from "../../common/gui/base/IconButton.js"
import { ButtonSize } from "../../common/gui/base/ButtonSize.js"

/**
 * Creates an Editor Popup in which you can create a new template or edit an existing one
 */
export function showTemplateEditor(template: EmailTemplate | null, templateGroupRoot: TemplateGroupRoot): void {
	const entityClient = locator.entityClient
	const editorModel = new TemplateEditorModel(template, templateGroupRoot, entityClient)

	const dialogCloseAction = () => {
		dialog.close()
	}

	const saveAction = () => {
		editorModel
			.save()
			.then(() => {
				dialogCloseAction()
			})
			.catch(ofClass(UserError, showUserError))
	}

	let headerBarAttrs: DialogHeaderBarAttrs = {
		left: [
			{
				label: "cancel_action",
				click: dialogCloseAction,
				type: ButtonType.Secondary,
			},
		],
		right: [
			{
				label: "save_action",
				click: saveAction,
				type: ButtonType.Primary,
			},
		],
		middle: () => lang.get(editorModel.template._id ? "editTemplate_action" : "createTemplate_action"),
	}
	const dialog = Dialog.editDialog(headerBarAttrs, TemplateEditor, {
		model: editorModel,
	})
	dialog.show()
}

type TemplateEditorAttrs = {
	model: TemplateEditorModel
}

class TemplateEditor implements Component<TemplateEditorAttrs> {
	private model: TemplateEditorModel
	private readonly templateContentEditor: HtmlEditor

	constructor(vnode: Vnode<TemplateEditorAttrs>) {
		this.model = vnode.attrs.model
		this.templateContentEditor = new HtmlEditor("content_label").showBorders().setMinHeight(500).enableToolbar()

		this.model.setContentProvider(() => {
			return this.templateContentEditor.getValue()
		})
		// init all input fields
		this.model.title(this.model.template.title)
		this.model.tag(this.model.template.tag)
		const content = this.model.selectedContent()

		if (content) {
			this.templateContentEditor.setValue(content.text)
		}
	}

	view(): Children {
		return m("", [
			m(TextField, {
				label: "title_placeholder",
				value: this.model.title(),
				oninput: this.model.title,
			}),
			m(TextField, {
				label: "shortcut_label",
				value: this.model.tag(),
				oninput: this.model.tag,
			}),
			m(TextField, {
				label: "language_label",
				value: this.model.selectedContent() ? getLanguageName(this.model.selectedContent()) : "",
				injectionsRight: () =>
					m(".flex.ml-between-s", [
						this.model.getAddedLanguages().length > 1 ? [this.renderRemoveLangButton(), this.renderSelectLangButton()] : null,
						this.renderAddLangButton(),
					]),
				isReadOnly: true,
			}),
			m(this.templateContentEditor),
		])
	}

	private renderAddLangButton() {
		return m(IconButton, {
			title: "addLanguage_action",
			icon: Icons.Add,
			size: ButtonSize.Compact,
			click: createDropdown({
				lazyButtons: () =>
					this.model
						.getAdditionalLanguages()
						.sort((a, b) => lang.get(a.textId).localeCompare(lang.get(b.textId)))
						.map((lang) => this.createAddNewLanguageButtonAttrs(lang)),
				width: 250,
			}),
		})
	}

	private renderSelectLangButton() {
		return m(IconButton, {
			title: "languages_label",
			icon: Icons.Language,
			size: ButtonSize.Compact,
			click: createDropdown({
				lazyButtons: () => {
					// save current content with language & create a dropdwon with all added languages & an option to add a new language
					this.model.updateContent()
					return this.model.template.contents.map((content) => {
						return {
							label: () => getLanguageName(content),
							click: () => {
								this.model.selectedContent(content)

								this.templateContentEditor.setValue(content.text)
							},
						}
					})
				},
			}),
		})
	}

	private renderRemoveLangButton() {
		return m(IconButton, {
			title: "removeLanguage_action",
			icon: Icons.Trash,
			click: () => this.removeLanguage(),
			size: ButtonSize.Compact,
		})
	}

	private removeLanguage() {
		return Dialog.confirm(() =>
			lang.get("deleteLanguageConfirmation_msg", {
				"{language}": getLanguageName(this.model.selectedContent()),
			}),
		).then((confirmed) => {
			if (confirmed) {
				this.model.removeContent()
				this.model.selectedContent(this.model.template.contents[0])

				this.templateContentEditor.setValue(this.model.selectedContent().text)
			}

			return confirmed
		})
	}

	createAddNewLanguageButtonAttrs(lang: Language): DropdownButtonAttrs {
		return {
			label: lang.textId,
			click: () => {
				// save the current state of the content editor in the model,
				// because we will overwrite it when a new language is added
				this.model.updateContent()
				const newContent = this.model.createContent(lang.code)
				this.model.selectedContent(newContent)

				this.templateContentEditor.setValue("")
			},
		}
	}
}
