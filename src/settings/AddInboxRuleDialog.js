// @flow
import m from "mithril"
import {assertMainOrNode} from "../api/Env"
import {Dialog} from "../gui/base/Dialog"
import {lang} from "../misc/LanguageViewModel"
import {InboxRuleType} from "../api/common/TutanotaConstants"
import {isDomainName, isMailAddress, isRegularExpression} from "../misc/FormatValidator"
import {getInboxRuleTypeNameMapping} from "../mail/InboxRuleHandler"
import {createInboxRule} from "../api/entities/tutanota/InboxRule"
import {update} from "../api/main/Entity"
import {showNotAvailableForFreeDialog} from "../misc/ErrorHandlerImpl"
import {logins} from "../api/main/LoginController"
import {getArchiveFolder, getFolderName, getInboxFolder} from "../mail/MailUtils"
import type {MailboxDetail} from "../mail/MailModel"
import stream from "mithril/stream/stream.js"
import {DropDownSelectorN} from "../gui/base/DropDownSelectorN"
import {TextFieldN} from "../gui/base/TextFieldN"
import {neverNull, noOp} from "../api/common/utils/Utils"
import {isSameId} from "../api/common/EntityFunctions"
import type {InboxRule} from "../api/entities/tutanota/InboxRule"
import {LockedError} from "../api/common/error/RestError"

assertMainOrNode()

export function show(mailBoxDetails: MailboxDetail, ruleOrTemplate: InboxRule) {
	if (logins.getUserController().isFreeAccount()) {
		showNotAvailableForFreeDialog(true)
	} else if (mailBoxDetails) {
		let targetFolders = mailBoxDetails.folders
		                                  .map(folder => {
			                                  return {name: getFolderName(folder), value: folder}
		                                  })
		                                  .sort((folder1, folder2) => folder1.name.localeCompare(folder2.name))
		const inboxRuleType = stream(ruleOrTemplate.type)
		const inboxRuleValue = stream(ruleOrTemplate.value)
		const selectedFolder = mailBoxDetails.folders.find((folder) => isSameId(folder._id, ruleOrTemplate.targetFolder))
		const inboxRuleTarget = stream(selectedFolder || getArchiveFolder(mailBoxDetails.folders))
		let form = () => [
			m(DropDownSelectorN, {
				items: getInboxRuleTypeNameMapping(),
				label: "inboxRuleField_label",
				selectedValue: inboxRuleType
			}),
			m(TextFieldN, {
				label: "inboxRuleValue_label",
				value: inboxRuleValue,
				helpLabel: () => (inboxRuleType() !== InboxRuleType.SUBJECT_CONTAINS
					&& inboxRuleType() !== InboxRuleType.MAIL_HEADER_CONTAINS)
					? lang.get("emailSenderPlaceholder_label")
					: lang.get("emptyString_msg")

			}),
			m(DropDownSelectorN, {
				label: "inboxRuleTargetFolder_label",
				items: targetFolders,
				selectedValue: inboxRuleTarget
			})
		]

		const isNewRule = ruleOrTemplate._id === null
		const addInboxRuleOkAction = (dialog) => {
			let rule = createInboxRule()
			rule.type = inboxRuleType()
			rule.value = _getCleanedValue(inboxRuleType(), inboxRuleValue())
			rule.targetFolder = inboxRuleTarget()._id
			const props = logins.getUserController().props
			if (isNewRule) {
				props.inboxRules.push(rule)
			} else {
				props.inboxRules = props.inboxRules.map(inboxRule => isSameId(inboxRule._id, ruleOrTemplate._id) ? rule : inboxRule)
			}
			update(props).catch(LockedError, noOp)
			dialog.close()
		}

		Dialog.showActionDialog({
			title: lang.get("addInboxRule_action"),
			child: form,
			validator: () => _validateInboxRuleInput(inboxRuleType(), inboxRuleValue(), ruleOrTemplate._id),
			allowOkWithReturn: true,
			okAction: addInboxRuleOkAction
		})
	}
}

export function createInboxRuleTemplate(ruleType: ?string, value: ?string): InboxRule {
	const template = createInboxRule()
	template.type = ruleType || InboxRuleType.FROM_EQUALS
	template.value = _getCleanedValue(neverNull(ruleType), value || "")
	return template
}

export function getExistingRuleForType(cleanValue: string, type: string): ?InboxRule {
	return logins.getUserController().props.inboxRules.find(rule => (type === rule.type && cleanValue === rule.value))
}

function _validateInboxRuleInput(type: string, value: string, ruleId: Id) {
	let currentCleanedValue = _getCleanedValue(type, value)
	if (currentCleanedValue === "") {
		return "inboxRuleEnterValue_msg"
	} else if (type !== InboxRuleType.SUBJECT_CONTAINS && type !== InboxRuleType.MAIL_HEADER_CONTAINS
		&& !isRegularExpression(currentCleanedValue) && !isDomainName(currentCleanedValue)
		&& !isMailAddress(currentCleanedValue, false)) {
		return "inboxRuleInvalidEmailAddress_msg"
	} else {
		let existingRule = getExistingRuleForType(currentCleanedValue, type)
		if (existingRule && (!ruleId || (ruleId && !isSameId(existingRule._id, ruleId)))) {
			return "inboxRuleAlreadyExists_msg"
		}
	}
	return null
}

function _getCleanedValue(type: string, value: string) {
	if (type === InboxRuleType.SUBJECT_CONTAINS || type === InboxRuleType.MAIL_HEADER_CONTAINS) {
		return value
	} else {
		return value.trim().toLowerCase()
	}
}
