// @flow
import m from "mithril"
import type {TranslationKey} from "../misc/LanguageViewModel"
import {lang} from "../misc/LanguageViewModel"
import {assertMainOrNode} from "../api/Env"
import {getSpamRuleFieldMapping, getSpamRuleTypeNameMapping} from "./GlobalSettingsViewer"
import {isDomainOrTopLevelDomain, isMailAddress} from "../misc/FormatValidator"
import type {SpamRuleFieldTypeEnum} from "../api/common/TutanotaConstants"
import {getSpamRuleType, getSparmRuleField, SpamRuleType, TUTANOTA_MAIL_ADDRESS_DOMAINS} from "../api/common/TutanotaConstants"
import {contains} from "../api/common/utils/ArrayUtils"
import {Dialog} from "../gui/base/Dialog"
import {worker} from "../api/main/WorkerClient"
import {load} from "../api/main/Entity"
import {neverNull} from "../api/common/utils/Utils"
import {CustomerInfoTypeRef} from "../api/entities/sys/CustomerInfo"
import {CustomerTypeRef} from "../api/entities/sys/Customer"
import {logins} from "../api/main/LoginController"
import stream from "mithril/stream/stream.js"
import {DropDownSelectorN} from "../gui/base/DropDownSelectorN"
import {TextFieldN} from "../gui/base/TextFieldN"

assertMainOrNode()

export function show(existingSpamRuleOrTemplate: ?EmailSenderListElement) {
	let existingSpamRules: ?EmailSenderListElement[] = null
	let customDomains: ?string[]
	worker.loadCustomerServerProperties().then(props => {
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
	const selectedField = stream(existingSpamRuleOrTemplate ? getSparmRuleField(existingSpamRuleOrTemplate) : fieldValues[0].value)
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
			worker.editSpamRule(Object.assign({}, existingSpamRuleOrTemplate, {
				value: valueFieldValue(),
				field: selectedField(),
				type: selectedType()
			}))
		} else {
			worker.addSpamRule(selectedField(), selectedType(), valueFieldValue())
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