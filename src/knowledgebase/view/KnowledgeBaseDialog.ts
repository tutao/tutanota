import {KnowledgeBaseModel} from "../model/KnowledgeBaseModel"
import {Editor} from "../../gui/editor/Editor"
import type {KnowledgebaseDialogContentAttrs} from "./KnowledgeBaseDialogContent"
import {KnowledgeBaseDialogContent} from "./KnowledgeBaseDialogContent"
import {showTemplatePopupInEditor} from "../../templates/view/TemplatePopup"
import type {ButtonAttrs} from "../../gui/base/Button.js"
import {ButtonType} from "../../gui/base/Button.js"
import type {DialogHeaderBarAttrs} from "../../gui/base/DialogHeaderBar"
import {lang} from "../../misc/LanguageViewModel"
import type {KnowledgeBaseEntry, TemplateGroupRoot} from "../../api/entities/tutanota/TypeRefs.js"
import type {lazy} from "@tutao/tutanota-utils"
import {createDropdown} from "../../gui/base/Dropdown.js"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import type {DialogInjectionRightAttrs} from "../../gui/base/DialogInjectionRight"
import {Icons} from "../../gui/base/icons/Icons"
import {TemplatePopupModel} from "../../templates/model/TemplatePopupModel"
import {getSharedGroupName} from "../../sharing/GroupUtils"
import {IconButtonAttrs} from "../../gui/base/IconButton.js"
import {ButtonSize} from "../../gui/base/ButtonSize.js"

export function createKnowledgeBaseDialogInjection(
	knowledgeBase: KnowledgeBaseModel,
	templateModel: TemplatePopupModel,
	editor: Editor,
): DialogInjectionRightAttrs<KnowledgebaseDialogContentAttrs> {
	const knowledgebaseAttrs: KnowledgebaseDialogContentAttrs = {
		onTemplateSelect: template => {
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

export function createOpenKnowledgeBaseButtonAttrs(
	dialogInjectionAttrs: DialogInjectionRightAttrs<KnowledgebaseDialogContentAttrs>,
	getEmailContent: () => string,
): IconButtonAttrs {
	return {
		title: "openKnowledgebase_action",
		click: () => {
			if (dialogInjectionAttrs.visible()) {
				dialogInjectionAttrs.visible(false)
			} else {
				dialogInjectionAttrs.componentAttrs.model.sortEntriesByMatchingKeywords(getEmailContent())
				dialogInjectionAttrs.visible(true)
				dialogInjectionAttrs.componentAttrs.model.init()
			}
		},
		icon: Icons.Book,
		size: ButtonSize.Compact,
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
				lazyButtons: () => templateGroupInstances.map(groupInstances => {
					return {
						label: () => getSharedGroupName(groupInstances.groupInfo, true),
						click: () => {
							showKnowledgeBaseEditor(null, groupInstances.groupRoot)
						},
					}
				})

			})
		}
	}
}

function showKnowledgeBaseEditor(entryToEdit: KnowledgeBaseEntry | null, groupRoot: TemplateGroupRoot) {
	import("../../settings/KnowledgeBaseEditor").then(editor => {
		editor.showKnowledgeBaseEditor(entryToEdit, groupRoot)
	})
}