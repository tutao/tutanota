// @flow
import m from "mithril"
import {assertMainOrNode} from "../api/Env"
import {TextField} from "../gui/base/TextField"
import {Dialog} from "../gui/base/Dialog"
import {lang} from "../misc/LanguageViewModel"
import {InboxRuleType} from "../api/common/TutanotaConstants"
import {isDomainName, isMailAddress, isRegularExpression} from "../misc/Formatter"
import {getInboxRuleTypeNameMapping} from "../mail/InboxRuleHandler"
import {createInboxRule} from "../api/entities/tutanota/InboxRule"
import {update} from "../api/main/Entity"
import {showNotAvailableForFreeDialog} from "../misc/ErrorHandlerImpl"
import {DropDownSelector} from "../gui/base/DropDownSelector"
import {MailBoxController} from "../mail/MailBoxController"
import {logins} from "../api/main/LoginController"

assertMainOrNode()

export function show(mailboxController: MailBoxController, preselectedInboxRuleType: string, preselectedValue: string) {
	if (logins.getUserController().isFreeAccount()) {
		showNotAvailableForFreeDialog()
	} else if (mailboxController) {
		let typeField = new DropDownSelector("inboxRuleField_label", null, getInboxRuleTypeNameMapping(), preselectedInboxRuleType)
		let valueField = new TextField("inboxRuleValue_label", () => (typeField.selectedValue() != InboxRuleType.SUBJECT_CONTAINS && typeField.selectedValue() != InboxRuleType.MAIL_HEADER_CONTAINS) ? lang.get("emailSenderPlaceholder_label") : lang.get("emptyString_msg"))
			.setValue(preselectedValue)
		let targetFolders = mailboxController.getAllFolders().filter(folderVm => folderVm != mailboxController.getInboxFolder()).map(folderVm => {
			return {name: folderVm.getDisplayName(), value: folderVm}
		})
		let targetFolderField = new DropDownSelector("inboxRuleTargetFolder_label", null, targetFolders, mailboxController.getArchiveFolder())
		let form = {
			view: () => {
				return [
					m(typeField),
					m(valueField),
					m(targetFolderField)
				]
			}
		}
		return Dialog.smallDialog(lang.get("addInboxRule_action"), form, () => _validateInboxRuleInput(typeField.selectedValue(), valueField.value())).then(okClicked => {
			if (okClicked) {
				let rule = createInboxRule()
				rule.type = typeField.selectedValue()
				rule.value = _getCleanedValue(typeField.selectedValue(), valueField.value())
				rule.targetFolder = targetFolderField.selectedValue().folder._id
				logins.getUserController().props.inboxRules.push(rule)
				update(logins.getUserController().props)
			}
		})
	}
}

export function isRuleExistingForType(cleanValue: string, type: string) {
	return logins.getUserController().props.inboxRules.find(rule => (type == rule.type && cleanValue == rule.value)) != null
}

function _validateInboxRuleInput(type: string, value: string) {
	let currentCleanedValue = _getCleanedValue(type, value)
	if (currentCleanedValue == "") {
		return "inboxRuleEnterValue_msg"
	} else if (type != InboxRuleType.SUBJECT_CONTAINS && type != InboxRuleType.MAIL_HEADER_CONTAINS && !isRegularExpression(currentCleanedValue) && !isDomainName(currentCleanedValue) && !isMailAddress(currentCleanedValue, false)) {
		return "inboxRuleInvalidEmailAddress_msg"
	} else if (isRuleExistingForType(currentCleanedValue, type)) {
		return "inboxRuleAlreadyExists_msg"
	}
	return null
}

function _getCleanedValue(type: string, value: string) {
	if (type == InboxRuleType.SUBJECT_CONTAINS || type == InboxRuleType.MAIL_HEADER_CONTAINS) {
		return value
	} else {
		return value.trim().toLowerCase()
	}
}
