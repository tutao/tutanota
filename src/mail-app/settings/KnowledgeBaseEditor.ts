import m, { Children, Component, Vnode } from "mithril"
import type { EmailTemplate, KnowledgeBaseEntry, TemplateGroupRoot } from "../../common/api/entities/tutanota/TypeRefs.js"
import { ButtonColor, ButtonType } from "../../common/gui/base/Button.js"
import { KnowledgeBaseEditorModel } from "./KnowledgeBaseEditorModel"
import { noOp, ofClass } from "@tutao/tutanota-utils"
import { TextField } from "../../common/gui/base/TextField.js"
import { Dialog } from "../../common/gui/base/Dialog"
import type { DialogHeaderBarAttrs } from "../../common/gui/base/DialogHeaderBar"
import { lang } from "../../common/misc/LanguageViewModel"
import { locator } from "../../common/api/main/CommonLocator"
import type { DropdownChildAttrs } from "../../common/gui/base/Dropdown.js"
import { createAsyncDropdown } from "../../common/gui/base/Dropdown.js"
import { showUserError } from "../../common/misc/ErrorHandlerImpl"
import { elementIdPart, getLetId, listIdPart } from "../../common/api/common/utils/EntityUtils"
import { HtmlEditor } from "../../common/gui/editor/HtmlEditor"
import { UserError } from "../../common/api/main/UserError"
import { TEMPLATE_SHORTCUT_PREFIX } from "../templates/model/TemplatePopupModel"
import { IconButtonAttrs } from "../../common/gui/base/IconButton.js"
import { Icons } from "../../common/gui/base/icons/Icons.js"
import { ButtonSize } from "../../common/gui/base/ButtonSize.js"

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
		middle: () => lang.get(editorModel.entry._id ? "editEntry_label" : "createEntry_action"),
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
			icon: Icons.Add,
			colors: ButtonColor.Elevated,
			click: (e, dom) => {
				e.stopPropagation()
				createAsyncDropdown({
					lazyButtons: () => this._createDropdownChildAttrs(model),
				})(e, dom)
			},
			size: ButtonSize.Compact,
		}
		this.entryContentEditor = new HtmlEditor("content_label")
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
						label: () => template.tag,
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
			m(TextField, {
				label: "title_placeholder",
				value: model.title(),
				oninput: model.title,
			}),
			m(TextField, {
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
