import m from "mithril"
import {Dialog} from "../gui/base/Dialog"
import {lang, TranslationKey} from "../misc/LanguageViewModel"
import {InboxRuleType} from "../api/common/TutanotaConstants"
import {isDomainName, isMailAddress, isRegularExpression} from "../misc/FormatValidator"
import {getInboxRuleTypeNameMapping} from "../mail/model/InboxRuleHandler"
import type {InboxRule} from "../api/entities/tutanota/TypeRefs.js"
import {createInboxRule} from "../api/entities/tutanota/TypeRefs.js"
import {logins} from "../api/main/LoginController"
import {getArchiveFolder, getExistingRuleForType, getFolderName} from "../mail/model/MailUtils"
import type {MailboxDetail} from "../mail/model/MailModel"
import stream from "mithril/stream"
import {DropDownSelectorN} from "../gui/base/DropDownSelectorN"
import {TextFieldN} from "../gui/base/TextFieldN"
import {neverNull} from "@tutao/tutanota-utils"
import {ConnectionError, LockedError} from "../api/common/error/RestError"
import {showNotAvailableForFreeDialog} from "../misc/SubscriptionDialogs"
import {isSameId} from "../api/common/utils/EntityUtils"
import {assertMainOrNode} from "../api/common/Env"
import {locator} from "../api/main/MainLocator"
import {isOfflineError} from "../api/common/utils/ErrorCheckUtils.js"

assertMainOrNode()

export function show(mailBoxDetails: MailboxDetail, ruleOrTemplate: InboxRule) {
	if (logins.getUserController().isFreeAccount()) {
		showNotAvailableForFreeDialog(true)
	} else if (mailBoxDetails) {
		let targetFolders = mailBoxDetails.folders
										  .map(folder => {
											  return {
												  name: getFolderName(folder),
												  value: folder,
											  }
										  })
										  .sort((folder1, folder2) => folder1.name.localeCompare(folder2.name))
		const inboxRuleType = stream(ruleOrTemplate.type)
		const inboxRuleValue = stream(ruleOrTemplate.value)
		const selectedFolder = mailBoxDetails.folders.find(folder => isSameId(folder._id, ruleOrTemplate.targetFolder))
		const inboxRuleTarget = stream(selectedFolder || getArchiveFolder(mailBoxDetails.folders))

		let form = () => [
			m(DropDownSelectorN, {
				items: getInboxRuleTypeNameMapping(),
				label: "inboxRuleField_label",
				selectedValue: inboxRuleType,
			}),
			m(TextFieldN, {
				label: "inboxRuleValue_label",
				value: inboxRuleValue,
				helpLabel: () =>
					inboxRuleType() !== InboxRuleType.SUBJECT_CONTAINS && inboxRuleType() !== InboxRuleType.MAIL_HEADER_CONTAINS
						? lang.get("emailSenderPlaceholder_label")
						: lang.get("emptyString_msg"),
			}),
			m(DropDownSelectorN, {
				label: "inboxRuleTargetFolder_label",
				items: targetFolders,
				selectedValue: inboxRuleTarget,
			}),
		]

		const isNewRule = ruleOrTemplate._id === null


		const addInboxRuleOkAction = (dialog: Dialog) => {
			let rule = createInboxRule()
			rule.type = inboxRuleType()
			rule.value = getCleanedValue(inboxRuleType(), inboxRuleValue())
			rule.targetFolder = inboxRuleTarget()._id
			const props = logins.getUserController().props
			const inboxRules = props.inboxRules
			props.inboxRules = isNewRule ? [...inboxRules, rule] : inboxRules.map(inboxRule => (isSameId(inboxRule._id, ruleOrTemplate._id) ? rule : inboxRule))

			locator.entityClient.update(props).then(() => {
				dialog.close()
			}).catch(error => {
				if (isOfflineError(error)) {
					props.inboxRules = inboxRules
					//do not close
					throw error
				} else if (error instanceof LockedError) {
					dialog.close()
				} else {
					props.inboxRules = inboxRules
					dialog.close()
					throw error
				}
			})
		}

		Dialog.showActionDialog({
			title: lang.get("addInboxRule_action"),
			child: form,
			validator: () => validateInboxRuleInput(inboxRuleType(), inboxRuleValue(), ruleOrTemplate._id),
			allowOkWithReturn: true,
			okAction: addInboxRuleOkAction,
		})
	}
}

export function createInboxRuleTemplate(ruleType: string | null, value: string | null): InboxRule {
	const template = createInboxRule()
	template.type = ruleType || InboxRuleType.FROM_EQUALS
	template.value = getCleanedValue(neverNull(ruleType), value || "")
	return template
}

function validateInboxRuleInput(type: string, value: string, ruleId: Id): TranslationKey | null {
	let currentCleanedValue = getCleanedValue(type, value)

	if (currentCleanedValue === "") {
		return "inboxRuleEnterValue_msg"
	} else if (isInvalidRegex(currentCleanedValue)) {
		return "invalidRegexSyntax_msg"
	} else if (
		type !== InboxRuleType.SUBJECT_CONTAINS &&
		type !== InboxRuleType.MAIL_HEADER_CONTAINS &&
		!isRegularExpression(currentCleanedValue) &&
		!isDomainName(currentCleanedValue) &&
		!isMailAddress(currentCleanedValue, false)
	) {
		return "inboxRuleInvalidEmailAddress_msg"
	} else {
		let existingRule = getExistingRuleForType(logins.getUserController().props, currentCleanedValue, type)

		if (existingRule && (!ruleId || (ruleId && !isSameId(existingRule._id, ruleId)))) {
			return "inboxRuleAlreadyExists_msg"
		}
	}

	return null
}

function getCleanedValue(type: string, value: string) {
	if (type === InboxRuleType.SUBJECT_CONTAINS || type === InboxRuleType.MAIL_HEADER_CONTAINS) {
		return value
	} else {
		return value.trim().toLowerCase()
	}
}

/**
 * @param value
 * @returns true if provided string is a regex and it's unparseable by RegExp, else false
 * @private
 */
function isInvalidRegex(value: string) {
	if (!isRegularExpression(value)) return false // not a regular expression is not an invalid regular expression

	try {
		// RegExp ctor throws a ParseError if invalid regex
		let regExp = new RegExp(value.substring(1, value.length - 1))
	} catch (e) {
		return true
	}

	return false
}