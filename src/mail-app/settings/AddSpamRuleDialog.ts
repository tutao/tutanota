import m from "mithril"
import type { TranslationKey } from "../../common/misc/LanguageViewModel"
import { lang } from "../../common/misc/LanguageViewModel"
import { isDomainOrTopLevelDomain, isMailAddress } from "../../common/misc/FormatValidator"
import { getSpamRuleField, getSpamRuleType, SpamRuleFieldType, SpamRuleType, TUTA_MAIL_ADDRESS_DOMAINS } from "../../common/api/common/TutanotaConstants"
import { contains, neverNull, objectEntries } from "@tutao/tutanota-utils"
import { Dialog } from "../../common/gui/base/Dialog"
import type { EmailSenderListElement } from "../../common/api/entities/sys/TypeRefs.js"
import { CustomerInfoTypeRef, CustomerTypeRef } from "../../common/api/entities/sys/TypeRefs.js"
import stream from "mithril/stream"
import type { SelectorItemList } from "../../common/gui/base/DropDownSelector.js"
import { DropDownSelector } from "../../common/gui/base/DropDownSelector.js"
import { TextField } from "../../common/gui/base/TextField.js"
import { locator } from "../../common/api/main/CommonLocator"
import { assertMainOrNode } from "../../common/api/common/Env"
import { isOfflineError } from "../../common/api/common/utils/ErrorUtils.js"

assertMainOrNode()

type LoadedData = { customDomains: string[]; existingSpamRules: EmailSenderListElement[] }

export function showAddSpamRuleDialog(existingSpamRuleOrTemplate: EmailSenderListElement | null) {
	let loadedData: LoadedData | null = null

	const typeItems = getSpamRuleTypeNameMapping()
	const selectedType = stream((existingSpamRuleOrTemplate && getSpamRuleType(existingSpamRuleOrTemplate)) || typeItems[0].value)
	const valueFieldValue = stream(existingSpamRuleOrTemplate ? existingSpamRuleOrTemplate.value : "")
	const fieldValues = getSpamRuleFieldMapping()
	const selectedField = stream(existingSpamRuleOrTemplate ? getSpamRuleField(existingSpamRuleOrTemplate) : fieldValues[0].value)

	let form = () => [
		m(DropDownSelector, {
			items: fieldValues,
			label: "field_label",
			selectedValue: selectedField(),
			selectionChangedHandler: selectedField,
		}),
		m(TextField, {
			label: "emailSenderPlaceholder_label",
			value: valueFieldValue(),
			oninput: valueFieldValue,
			helpLabel: () =>
				lang.get(validate(selectedType(), valueFieldValue(), selectedField(), loadedData, existingSpamRuleOrTemplate) ?? "emptyString_msg"),
		}),
		m(DropDownSelector, {
			items: typeItems,
			label: "emailSenderRule_label",
			selectedValue: selectedType(),
			selectionChangedHandler: selectedType,
		}),
	]

	let addSpamRuleOkAction = async (dialog: Dialog) => {
		try {
			if (existingSpamRuleOrTemplate && existingSpamRuleOrTemplate._id) {
				await locator.customerFacade.editSpamRule(
					Object.assign({}, existingSpamRuleOrTemplate, {
						value: valueFieldValue(),
						field: selectedField(),
						type: selectedType(),
					}),
				)
			} else {
				await locator.customerFacade.addSpamRule(selectedField(), selectedType(), valueFieldValue())
			}
			dialog.close()
		} catch (error) {
			if (!isOfflineError(error)) {
				dialog.close()
			}
			throw error
		}
	}

	const dialog = Dialog.showActionDialog({
		title: lang.get("addSpamRule_action"),
		child: form,
		validator: () => validate(selectedType(), valueFieldValue(), selectedField(), loadedData, existingSpamRuleOrTemplate),
		allowOkWithReturn: true,
		okAction: addSpamRuleOkAction,
	})

	// start loading in background
	loadData().then(
		(loaded) => {
			loadedData = loaded
			m.redraw()
		},
		(e) => {
			// Might be an offline error, if we can't load data we should close the dialog regardless, they can try opening it again
			dialog.close()
			throw e
		},
	)
}

async function loadData(): Promise<LoadedData> {
	const customerServerProperties = await locator.customerFacade.loadCustomerServerProperties()
	const customer = await locator.logins.getUserController().loadCustomer()
	const customerInfo = await locator.logins.getUserController().loadCustomerInfo()

	const customDomains = customerInfo.domainInfos.map((d) => d.domain)
	const existingSpamRules = customerServerProperties.emailSenderList

	return { customDomains, existingSpamRules }
}

/** @return translation key if validation fails or null if it succeeds */
function validate(
	type: SpamRuleType,
	value: string,
	field: SpamRuleFieldType,
	loadedData: LoadedData | null,
	existingSpamRuleOrTemplate: EmailSenderListElement | null,
): TranslationKey | null {
	let currentValue = value.toLowerCase().trim()

	if (loadedData == null) {
		return "loading_msg"
	} else if (currentValue === "") {
		return "spamRuleEnterValue_msg"
	} else if (!isDomainOrTopLevelDomain(currentValue) && !isMailAddress(currentValue, false) && currentValue !== "*") {
		return "invalidInputFormat_msg"
	} else if (isInvalidRule(type, currentValue, loadedData.customDomains)) {
		return "emailSenderInvalidRule_msg"
	} else if (
		loadedData.existingSpamRules.some(
			(r) =>
				r.value === currentValue && // Only collision if we don't edit existing one or existing one has different id
				(existingSpamRuleOrTemplate == null || r._id !== existingSpamRuleOrTemplate._id) &&
				r.field === field,
		)
	) {
		return "emailSenderExistingRule_msg"
	}

	return null
}

function isInvalidRule(type: NumberString, value: string, customDomains: string[]): boolean {
	if (type !== SpamRuleType.WHITELIST) {
		if (isDomainOrTopLevelDomain(value)) {
			return value === "tutao.de" || contains(TUTA_MAIL_ADDRESS_DOMAINS, value) || contains(customDomains, value)
		} else if (isMailAddress(value, false)) {
			let domain = value.split("@")[1]
			return domain === "tutao.de" || contains(customDomains, domain)
		}
	}

	return false
}

export function getSpamRuleFieldToName(): Record<SpamRuleFieldType, string> {
	return {
		[SpamRuleFieldType.FROM]: lang.get("inboxRuleSenderEquals_action"),
		[SpamRuleFieldType.TO]: lang.get("inboxRuleToRecipientEquals_action"),
		[SpamRuleFieldType.CC]: lang.get("inboxRuleCCRecipientEquals_action"),
		[SpamRuleFieldType.BCC]: lang.get("inboxRuleBCCRecipientEquals_action"),
	}
}

export function getSpamRuleFieldMapping(): SelectorItemList<SpamRuleFieldType> {
	return objectEntries(getSpamRuleFieldToName()).map(([value, name]) => ({
		value,
		name,
	}))
}

export function getSpamRuleTypeNameMapping(): SelectorItemList<SpamRuleType> {
	return [
		{
			value: SpamRuleType.WHITELIST,
			name: lang.get("emailSenderWhitelist_action"),
		},
		{
			value: SpamRuleType.BLACKLIST,
			name: lang.get("emailSenderBlacklist_action"),
		},
		{
			value: SpamRuleType.DISCARD,
			name: lang.get("emailSenderDiscardlist_action"),
		},
	]
}
