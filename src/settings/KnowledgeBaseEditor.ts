// @flow

import m from "mithril"
import type {KnowledgeBaseEntry} from "../api/entities/tutanota/KnowledgeBaseEntry"
import stream from "mithril/stream/stream.js"
import type {TextFieldAttrs} from "../gui/base/TextFieldN"
import {ButtonColors, ButtonN, ButtonType} from "../gui/base/ButtonN"
import type {ButtonAttrs} from "../gui/base/ButtonN"
import {Icons} from "../gui/base/icons/Icons"
import {KnowledgeBaseEditorModel} from "./KnowledgeBaseEditorModel"
import {noOp} from "@tutao/tutanota-utils"
import {TextFieldN} from "../gui/base/TextFieldN"
import type {EmailTemplate} from "../api/entities/tutanota/EmailTemplate"
import {Dialog} from "../gui/base/Dialog"
import type {DialogHeaderBarAttrs} from "../gui/base/DialogHeaderBar"
import {lang} from "../misc/LanguageViewModel"
import type {KeyPress} from "../misc/KeyManager"
import {Keys} from "../api/common/TutanotaConstants"
import {Icon} from "../gui/base/Icon"
import {locator} from "../api/main/MainLocator"
import type {TemplateGroupRoot} from "../api/entities/tutanota/TemplateGroupRoot"
import {attachDropdown} from "../gui/base/DropdownN"
import {showUserError} from "../misc/ErrorHandlerImpl"
import {elementIdPart, getLetId, listIdPart} from "../api/common/utils/EntityUtils"
import {HtmlEditor} from "../gui/editor/HtmlEditor"
import {UserError} from "../api/main/UserError"
import type {DropdownChildAttrs} from "../gui/base/DropdownN"
import {TEMPLATE_SHORTCUT_PREFIX} from "../templates/model/TemplatePopupModel"
import {ofClass} from "@tutao/tutanota-utils"

/**
 *  Editor to edit / add a knowledgeBase entry
 *  Returned promise resolves when the dialog closes
 */
export function showKnowledgeBaseEditor(entry: ?KnowledgeBaseEntry, templateGroupRoot: TemplateGroupRoot): void {
	const {entityClient} = locator
	const editorModel = new KnowledgeBaseEditorModel(entry, templateGroupRoot, entityClient)

	const closeDialog = () => {
		dialog.close()
	}
	const saveAction = () => {
		editorModel.save()
		           .then(closeDialog)
		           .catch(ofClass(UserError, showUserError))
	}

	const headerBarAttrs: DialogHeaderBarAttrs = {
		left: [{label: 'cancel_action', click: closeDialog, type: ButtonType.Secondary}],
		right: [{label: 'save_action', click: saveAction, type: ButtonType.Primary}],
		middle: () => lang.get(editorModel.entry._id ? "editEntry_label" : "createEntry_action")
	}
	const dialog = Dialog.largeDialogN(headerBarAttrs, KnowledgeBaseEditor, editorModel)
	dialog.show()
}

class KnowledgeBaseEditor implements MComponent<KnowledgeBaseEditorModel> {
	entryContentEditor: HtmlEditor
	linkedTemplateButtonAttrs: ButtonAttrs

	constructor(vnode: Vnode<KnowledgeBaseEditorModel>) {
		const model = vnode.attrs

		this.linkedTemplateButtonAttrs = attachDropdown({
			label: () => lang.get("linkTemplate_label") + ' ▼',
			title: "linkTemplate_label",
			type: ButtonType.Toggle,
			click: noOp,
			noBubble: true,
			colors: ButtonColors.Elevated,
		}, () => this._createDropdownChildAttrs(model))

		this.entryContentEditor = new HtmlEditor("content_label", {
			enabled: true,
			customButtonAttrs: [this.linkedTemplateButtonAttrs]
		}).showBorders()
		  .setMinHeight(500)

		model.setDescriptionProvider(() => {
			return this.entryContentEditor.getValue()
		})

		if (model.isUpdate()) {
			this.entryContentEditor.setValue(model.entry.description)
		}
	}

	_createDropdownChildAttrs(model: KnowledgeBaseEditorModel): Promise<Array<DropdownChildAttrs>> {
		return model.availableTemplates.getAsync().then(templates => {
			if (templates.length > 0) {
				return templates.map(template => {
					return {
						label: () => template.tag,
						type: ButtonType.Dropdown,
						click: () => this.entryContentEditor._editor.insertHTML(createTemplateLink(template))
					}
				})
			} else {
				return [
					{
						label: "noEntries_msg",
						type: ButtonType.Dropdown,
						click: noOp
					}
				]
			}
		})
	}

	view(vnode: Vnode<KnowledgeBaseEditorModel>): Children {
		const model = vnode.attrs
		return m("", [
			m(TextFieldN, {
				label: "title_placeholder",
				value: model.title
			}),
			m(TextFieldN, {
				label: "keywords_label",
				value: model.keywords,
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