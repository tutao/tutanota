import m, { Children, Component, Vnode } from "mithril"
import { elementIdPart, getLetId, listIdPart } from "../../../platform-kits/meta"
import { ButtonColor, ButtonType } from "../../../ui/base/Button.js"
import { KnowledgeBaseEditorModel } from "./KnowledgeBaseEditorModel"
import { noOp, ofClass } from "../../../platform-kits/utils"
import { LegacyTextField } from "../../../ui/base/LegacyTextField.js"
import { Dialog } from "../../../ui/base/Dialog"
import type { DialogHeaderBarAttrs } from "../../../ui/base/DialogHeaderBar"
import { lang } from "../../../ui/utils/LanguageViewModel"
import { locator } from "../../common/api/main/CommonLocator"
import type { DropdownChildAttrs } from "../../../ui/base/Dropdown.js"
import { createAsyncDropdown } from "../../../ui/base/Dropdown.js"
import { showUserError } from "../../common/misc/ErrorHandlerImpl"
import { HtmlEditor } from "../../../ui/editor/HtmlEditor"
import { UserError } from "../../common/api/main/UserError"
import { TEMPLATE_SHORTCUT_PREFIX } from "../templates/model/TemplatePopupModel"
import { IconButtonAttrs } from "../../../ui/base/IconButton.js"
import { Icons } from "../../../ui/base/icons/Icons.js"
import { ButtonSize } from "../../../ui/base/ButtonSize.js"
import { EmailTemplate, KnowledgeBaseEntry, TemplateGroupRoot } from "@tutao/entities/tutanota"
import { getHtmlSanitizer } from "../../common/misc/HtmlSanitizer"

/**
 *  Editor to edit / add a knowledgeBase entry
 *  Returned promise resolves when the dialog closes
 */
export function showKnowledgeBaseEditor(entry: KnowledgeBaseEntry | null, templateGroupRoot: TemplateGroupRoot): void {
	const { entityClient } = locator
	const editorModel = new KnowledgeBaseEditorModel(entry, templateGroupRoot, entityClient)

	const closeDialog = () => {
		dialog.close()
	}

	const saveAction = () => {
		editorModel.save().then(closeDialog).catch(ofClass(UserError, showUserError))
	}

	const headerBarAttrs: DialogHeaderBarAttrs = {
		left: [
			{
				label: "cancel_action",
				click: closeDialog,
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
		middle: editorModel.entry._id ? "editEntry_label" : "createEntry_action",
	}
	const dialog = Dialog.editDialog(headerBarAttrs, KnowledgeBaseEditor, editorModel)
	dialog.show()
}

class KnowledgeBaseEditor implements Component<KnowledgeBaseEditorModel> {
	entryContentEditor: HtmlEditor
	linkedTemplateButtonAttrs: IconButtonAttrs

	constructor(vnode: Vnode<KnowledgeBaseEditorModel>) {
		const model = vnode.attrs
		this.linkedTemplateButtonAttrs = {
			title: "linkTemplate_label",
			icon: Icons.Plus,
			colors: ButtonColor.Elevated,
			click: (e, dom) => {
				e.stopPropagation()
				createAsyncDropdown({
					lazyButtons: () => this._createDropdownChildAttrs(model),
				})(e, dom)
			},
			size: ButtonSize.Compact,
		}
		this.entryContentEditor = new HtmlEditor(getHtmlSanitizer(), "content_label")
			.showBorders()
			.setMinHeight(500)
			.enableToolbar()
			.setToolbarOptions({
				customButtonAttrs: [this.linkedTemplateButtonAttrs],
			})
		model.setDescriptionProvider(() => {
			return this.entryContentEditor.getValue()
		})

		if (model.isUpdate()) {
			this.entryContentEditor.setValue(model.entry.description)
		}
	}

	_createDropdownChildAttrs(model: KnowledgeBaseEditorModel): Promise<Array<DropdownChildAttrs>> {
		return model.availableTemplates.getAsync().then((templates) => {
			if (templates.length > 0) {
				return templates.map((template) => {
					return {
						label: lang.makeTranslation("tag", template.tag),
						click: () => this.entryContentEditor.editor.insertHTML(createTemplateLink(template)),
					}
				})
			} else {
				return [
					{
						label: "noEntries_msg",
						click: noOp,
					},
				]
			}
		})
	}

	view(vnode: Vnode<KnowledgeBaseEditorModel>): Children {
		const model = vnode.attrs
		return m("", [
			m(LegacyTextField, {
				label: "title_placeholder",
				value: model.title(),
				oninput: model.title,
			}),
			m(LegacyTextField, {
				label: "keywords_label",
				value: model.keywords(),
				oninput: model.keywords,
			}),
			m(this.entryContentEditor),
		])
	}
}

function createTemplateLink(template: EmailTemplate): string {
	const listId = listIdPart(getLetId(template))
	const elementId = elementIdPart(getLetId(template))
	return `<a href="tutatemplate:${listId}/${elementId}">${TEMPLATE_SHORTCUT_PREFIX + template.tag}</a>`
}
