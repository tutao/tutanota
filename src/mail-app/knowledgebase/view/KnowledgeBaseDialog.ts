import { KnowledgeBaseModel } from "../model/KnowledgeBaseModel.js"
import { Editor } from "../../../common/gui/editor/Editor.js"
import type { KnowledgebaseDialogContentAttrs } from "./KnowledgeBaseDialogContent.js"
import { KnowledgeBaseDialogContent } from "./KnowledgeBaseDialogContent.js"
import { showTemplatePopupInEditor } from "../../templates/view/TemplatePopup.js"
import type { ButtonAttrs } from "../../../common/gui/base/Button.js"
import { ButtonType } from "../../../common/gui/base/Button.js"
import type { DialogHeaderBarAttrs } from "../../../common/gui/base/DialogHeaderBar.js"
import { lang } from "../../../common/misc/LanguageViewModel.js"
import type { KnowledgeBaseEntry, TemplateGroupRoot } from "../../../common/api/entities/tutanota/TypeRefs.js"
import type { lazy } from "@tutao/tutanota-utils"
import { createDropdown } from "../../../common/gui/base/Dropdown.js"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import type { DialogInjectionRightAttrs } from "../../../common/gui/base/DialogInjectionRight.js"
import { TemplatePopupModel } from "../../templates/model/TemplatePopupModel.js"

import { getSharedGroupName } from "../../../common/sharing/GroupUtils.js"

export function createKnowledgeBaseDialogInjection(
	knowledgeBase: KnowledgeBaseModel,
	templateModel: TemplatePopupModel,
	editor: Editor,
): DialogInjectionRightAttrs<KnowledgebaseDialogContentAttrs> {
	const knowledgebaseAttrs: KnowledgebaseDialogContentAttrs = {
		onTemplateSelect: (template) => {
			showTemplatePopupInEditor(templateModel, editor, template, "")
		},
		model: knowledgeBase,
	}
	const isDialogVisible = stream(false)
	return {
		visible: isDialogVisible,
		headerAttrs: _createHeaderAttrs(knowledgebaseAttrs, isDialogVisible),
		componentAttrs: knowledgebaseAttrs,
		component: KnowledgeBaseDialogContent,
	}
}

function _createHeaderAttrs(attrs: KnowledgebaseDialogContentAttrs, isDialogVisible: Stream<boolean>): lazy<DialogHeaderBarAttrs> {
	return () => {
		const selectedEntry = attrs.model.selectedEntry()
		return selectedEntry ? createEntryViewHeader(selectedEntry, attrs.model) : createListViewHeader(attrs.model, isDialogVisible)
	}
}

function createEntryViewHeader(entry: KnowledgeBaseEntry, model: KnowledgeBaseModel): DialogHeaderBarAttrs {
	return {
		left: [
			{
				label: "back_action",
				click: () => model.selectedEntry(null),
				type: ButtonType.Secondary,
			},
		],
		middle: () => lang.get("knowledgebase_label"),
	}
}

function createListViewHeader(model: KnowledgeBaseModel, isDialogVisible: Stream<boolean>): DialogHeaderBarAttrs {
	return {
		left: () => [
			{
				label: "close_alt",
				click: () => isDialogVisible(false),
				type: ButtonType.Primary,
			},
		],
		middle: () => lang.get("knowledgebase_label"),
		right: [createAddButtonAttrs(model)],
	}
}

function createAddButtonAttrs(model: KnowledgeBaseModel): ButtonAttrs {
	const templateGroupInstances = model.getTemplateGroupInstances()

	if (templateGroupInstances.length === 1) {
		return {
			label: "add_action",
			click: () => {
				showKnowledgeBaseEditor(null, templateGroupInstances[0].groupRoot)
			},
			type: ButtonType.Primary,
		}
	} else {
		return {
			label: "add_action",
			type: ButtonType.Primary,
			click: createDropdown({
				lazyButtons: () =>
					templateGroupInstances.map((groupInstances) => {
						return {
							label: () => getSharedGroupName(groupInstances.groupInfo, model.userController, true),
							click: () => {
								showKnowledgeBaseEditor(null, groupInstances.groupRoot)
							},
						}
					}),
			}),
		}
	}
}

function showKnowledgeBaseEditor(entryToEdit: KnowledgeBaseEntry | null, groupRoot: TemplateGroupRoot) {
	import("../../settings/KnowledgeBaseEditor.js").then((editor) => {
		editor.showKnowledgeBaseEditor(entryToEdit, groupRoot)
	})
}
