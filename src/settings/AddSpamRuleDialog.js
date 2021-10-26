// @flow
import m from "mithril"
import type {TranslationKey} from "../misc/LanguageViewModel"
import {lang} from "../misc/LanguageViewModel"
import {isDomainOrTopLevelDomain, isMailAddress} from "../misc/FormatValidator"
import type {SpamRuleFieldTypeEnum, SpamRuleTypeEnum} from "../api/common/TutanotaConstants"
import {
	getSpamRuleField,
	getSpamRuleType,
	SpamRuleFieldType,
	SpamRuleType,
	TUTANOTA_MAIL_ADDRESS_DOMAINS
} from "../api/common/TutanotaConstants"
import {contains, neverNull, objectEntries} from "@tutao/tutanota-utils"
import {Dialog} from "../gui/base/Dialog"
import {load} from "../api/main/Entity"
import {CustomerInfoTypeRef} from "../api/entities/sys/CustomerInfo"
import {CustomerTypeRef} from "../api/entities/sys/Customer"
import {logins} from "../api/main/LoginController"
import stream from "mithril/stream/stream.js"
import type {SelectorItemList} from "../gui/base/DropDownSelectorN"
import {DropDownSelectorN} from "../gui/base/DropDownSelectorN"
import {TextFieldN} from "../gui/base/TextFieldN"
import type {EmailSenderListElement} from "../api/entities/sys/EmailSenderListElement"
import {locator} from "../api/main/MainLocator"
import {assertMainOrNode} from "../api/common/Env"

assertMainOrNode()

export function showAddSpamRuleDialog(existingSpamRuleOrTemplate: ?EmailSenderListElement) {
	let existingSpamRules: ?EmailSenderListElement[] = null
	let customDomains: ?string[]
	locator.customerFacade.loadCustomerServerProperties().then(props => {
		existingSpamRules = props.emailSenderList
		load(CustomerTypeRef, neverNull(logins.getUserController().user.customer))
			.then(customer => load(CustomerInfoTypeRef, customer.customerInfo))
			.then(customerInfo => {
				customDomains = customerInfo.domainInfos.map(d => d.domain)
				m.redraw()
			})
	})

	const typeItems = getSpamRuleTypeNameMapping()
	const selectedType = stream(existingSpamRuleOrTemplate && getSpamRuleType(existingSpamRuleOrTemplate) || typeItems[0].value)
	const valueFieldValue = stream(existingSpamRuleOrTemplate ? existingSpamRuleOrTemplate.value : "")
	const fieldValues = getSpamRuleFieldMapping()
	const selectedField = stream(existingSpamRuleOrTemplate ? getSpamRuleField(existingSpamRuleOrTemplate) : fieldValues[0].value)
	let form = () => [
		m(DropDownSelectorN, {
			items: fieldValues,
			label: "field_label",
			selectedValue: selectedField,
		}),
		m(TextFieldN, {
			label: "emailSenderPlaceholder_label",
			value: valueFieldValue,
			helpLabel: () =>
				lang.get(_getInputInvalidMessage(selectedType(), valueFieldValue(), selectedField(), existingSpamRules, customDomains, existingSpamRuleOrTemplate)
					|| "emptyString_msg")
		}),
		m(DropDownSelectorN, {
			items: typeItems,
			label: "emailSenderRule_label",
			selectedValue: selectedType,
		})
	]
	let addSpamRuleOkAction = (dialog) => {
		if (existingSpamRuleOrTemplate && existingSpamRuleOrTemplate._id) {
			locator.customerFacade.editSpamRule(Object.assign({}, existingSpamRuleOrTemplate, {
				value: valueFieldValue(),
				field: selectedField(),
				type: selectedType()
			}))
		} else {
			locator.customerFacade.addSpamRule(selectedField(), selectedType(), valueFieldValue())
		}
		dialog.close()
	}

	Dialog.showActionDialog({
		title: lang.get("addSpamRule_action"),
		child: form,
		validator: () => _getInputInvalidMessage(selectedType(), valueFieldValue(), selectedField(), existingSpamRules, customDomains, existingSpamRuleOrTemplate),
		allowOkWithReturn: true,
		okAction: addSpamRuleOkAction
	})
}

function _getInputInvalidMessage(type: NumberString, value: string, field: SpamRuleFieldTypeEnum, existingRules: ?EmailSenderListElement[], customDomains: ?string[], existingSpamRuleOrTemplate: ?EmailSenderListElement): ?TranslationKey {
	let currentValue = value.toLowerCase().trim()

	if (!existingRules || !customDomains) {
		return "emptyString_msg"
	} else if (currentValue === "") {
		return "spamRuleEnterValue_msg"
	} else if (!isDomainOrTopLevelDomain(currentValue) && !isMailAddress(currentValue, false) && currentValue !== ('*')) {
		return "invalidInputFormat_msg"
	} else if (_isInvalidRule(type, currentValue, customDomains)) {
		return "emailSenderInvalidRule_msg"
	} else if (existingRules.some(r => r.value === currentValue
		// Only collision if we don't edit existing one or existing one has different id
		&& (existingSpamRuleOrTemplate == null || r._id !== existingSpamRuleOrTemplate._id)
		&& r.field === field)) {
		return "emailSenderExistingRule_msg"
	}
	return null
}


function _isInvalidRule(type: NumberString, value: string, customDomains: string[]): boolean {
	if (type !== SpamRuleType.WHITELIST) {
		if (isDomainOrTopLevelDomain(value)) {
			return value === "tutao.de" || contains(TUTANOTA_MAIL_ADDRESS_DOMAINS, value)
				|| contains(customDomains, value)
		} else if (isMailAddress(value, false)) {
			let domain = value.split("@")[1]
			return domain === "tutao.de" || contains(customDomains, domain)
		}
	}
	return false
}

export function getSpamRuleFieldToName(): {[SpamRuleFieldTypeEnum]: string} {
	return {
		[SpamRuleFieldType.FROM]: lang.get("from_label"),
		[SpamRuleFieldType.TO]: lang.get("to_label"),
		[SpamRuleFieldType.CC]: "CC",
		[SpamRuleFieldType.BCC]: "BCC",
	}
}

export function getSpamRuleFieldMapping(): SelectorItemList<SpamRuleFieldTypeEnum> {
	return objectEntries(getSpamRuleFieldToName()).map(([value, name]) => ({value, name}))
}

export function getSpamRuleTypeNameMapping(): SelectorItemList<SpamRuleTypeEnum> {
	return [
		{value: SpamRuleType.WHITELIST, name: lang.get("emailSenderWhitelist_action")},
		{value: SpamRuleType.BLACKLIST, name: lang.get("emailSenderBlacklist_action")},
		{value: SpamRuleType.DISCARD, name: lang.get("emailSenderDiscardlist_action")}
	]
}