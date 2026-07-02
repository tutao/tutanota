import m from "mithril"
import { Dialog, DialogType } from "../../../ui/base/Dialog"
import { lang, TranslationKey } from "../../../ui/utils/LanguageViewModel"
import { assertMainOrNode, ProgrammingError, UpgradePromptType } from "../../../platform-kit/app-env"
import { isDomainName, isMailAddress, isRegularExpression } from "../../../platform-kit/utils/FormatUtils"
import { getInboxRuleResultTypeNameMapping, getInboxRuleTypeNameMapping } from "../mail/model/InboxRuleHandler"
import { elementIdPart, isSameId } from "../../../platform-kit/meta"
import type { MailboxDetail } from "../../common/mailFunctionality/MailboxModel.js"
import stream from "mithril/stream"
import { Autocapitalize } from "../../../ui/base/LegacyTextField.js"
import { isOfflineError, LockedError } from "../../../platform-kit/rest-client/error"
import { showNotAvailableForFreeDialog } from "../../common/misc/SubscriptionDialogs"
import { locator } from "../../common/api/main/CommonLocator"
import { mailLocator } from "../mailLocator.js"
import { assertSystemFolderOfType, getExistingRuleForType, getFolderName, getIndentedFolderNameForDropdown } from "../mail/model/MailUtils.js"
import type { IndentedFolder } from "../../common/api/common/mail/FolderSystem.js"
import { createInboxRule, InboxRule, MailSet } from "@tutao/entities/tutanota"
import { InboxRuleResultType, InboxRuleType, MailSetKind } from "../../../entities/tutanota/Utils"
import { Icons } from "../../../ui/base/icons/Icons"
import { Card } from "../../../ui/base/Card"
import { Icon, IconSize } from "../../../ui/base/Icon"
import { PrimaryButton } from "../../../ui/base/buttons/VariantButtons"
import { DropDownSelectorNew } from "../../../ui/base/DropDownSelectorNew"
import { TextField } from "../../../ui/base/TextField"
import { theme } from "../../../ui/theme"
import { px, size } from "../../../ui/size"

assertMainOrNode()

export type InboxRuleTemplate = Pick<InboxRule, "type" | "value"> & {
	_id?: InboxRule["_id"]
	targetFolder?: InboxRule["targetFolder"]
	excludeFromSpamFilter?: InboxRule["excludeFromSpamFilter"]
}

export async function show(mailBoxDetail: MailboxDetail, ruleOrTemplate: InboxRuleTemplate) {
	if (locator.logins.getUserController().isFreeAccount()) {
		showNotAvailableForFreeDialog(UpgradePromptType.INBOX_RULES)
	} else if (mailBoxDetail) {
		const folders = await mailLocator.mailModel.getMailboxFoldersForId(mailBoxDetail.mailbox.mailSets._id)
		let targetFolders = folders.getIndentedList().map((folderInfo: IndentedFolder) => {
			return {
				name: getIndentedFolderNameForDropdown(folderInfo),
				value: folderInfo.folder,
			}
		})
		const inboxRuleType = stream(ruleOrTemplate.type)
		const inboxRuleValue = stream(ruleOrTemplate.value)
		const selectedFolder = ruleOrTemplate.targetFolder == null ? null : folders.getFolderById(elementIdPart(ruleOrTemplate.targetFolder))
		const inboxRuleTarget = stream(selectedFolder ?? assertSystemFolderOfType(folders, MailSetKind.ARCHIVE))
		const isRuleExcludedFromSpamFilter = stream(ruleOrTemplate.excludeFromSpamFilter ?? false)

		let form = () => {
			return [
				m(Card, { classes: ["mt-16 center"], style: { padding: px(size.spacing_16) } }, [
					m(Icon, {
						icon: Icons.InboxFilled,
						size: IconSize.PX32,
					}),
					//FIXME: need a proper text explains the configuration of Inbox Rules
					m(".smaller.mt-16", "This would be a short sentence that explains the configuration of Inbox Rules."),
				]),
				m(".uppercase.b.mt-32.content-fg", lang.getTranslationText("condition_label")),
				renderConditionRow(ruleOrTemplate, 0),
				// m(".wrapping-row.pb-24", [
				// 	m(".full-width.flex-space-between.items-center", [
				// 		m(".smaller.text-center", lang.getTranslationText("when_label")),
				// 		m(DropDownSelectorNew, {
				// 			items: getInboxRuleTypeNameMapping(),
				// 			label: "inboxRuleField_label",
				// 			selectedValue: inboxRuleType(),
				// 			selectionChangedHandler: inboxRuleType,
				// 		}),
				// 		m(".smaller.text-center", lang.getTranslationText("matches_label")),
				// 	]),
				// 	m(TextField, {
				// 		label: "inboxRuleValue_label",
				// 		autocapitalize: Autocapitalize.none,
				// 		value: inboxRuleValue(),
				// 		oninput: inboxRuleValue,
				// 	}),
				// ]),
				m(".uppercase.b.mt-32.content-fg", lang.getTranslationText("searchResult_label")),
				[InboxRuleResultType.MOVE, InboxRuleResultType.EXCLUDE_SPAM].map(renderResultRow),
				// m(".flex.items-center.mt-16", [
				// 	m(".smaller.text-center.mr-16", lang.getTranslationText("then_label")),
				// 	m(DropDownSelectorNew, {
				// 		label: "inboxRuleTargetFolder_label",
				// 		items: targetFolders,
				// 		selectedValue: inboxRuleTarget(),
				// 		selectedValueDisplay: getFolderName(inboxRuleTarget()),
				// 		selectionChangedHandler: inboxRuleTarget,
				// 		class: "flex-half pl-16",
				// 	}),
				// ]),
				// inboxRuleTarget().folderType === MailSetKind.SPAM
				// 	? null
				// 	: m(
				// 			".pt-16",
				// 			m(Checkbox, {
				// 				label: () => lang.getTranslationText("inboxRuleExcludedFromSpamFilter_msg"),
				// 				checked: isRuleExcludedFromSpamFilter(),
				// 				onChecked: (checked) => isRuleExcludedFromSpamFilter(checked),
				// 			}),
				// 		),
				m(
					".flex-end.mt-16",
					m(PrimaryButton, {
						width: "flex",
						label: "applyInboxRules_action",
						onclick: () => addInboxRuleOkAction(dialog),
					}),
				),
			]
		}

		const addInboxRuleOkAction = (dialog: Dialog) => {
			let rule = createInboxRule({
				type: inboxRuleType(),
				value: getCleanedValue(inboxRuleType(), inboxRuleValue()),
				targetFolder: inboxRuleTarget()._id,
				excludeFromSpamFilter: isRuleExcludedFromSpamFilter(),
			})
			const props = locator.logins.getUserController().props
			const inboxRules = props.inboxRules
			const ruleId = ruleOrTemplate._id
			if (ruleId) {
				rule._id = ruleId
			}

			// When saving a rule that goes to spam, always set it to be excluded from the filter, so it always goes to spam
			if (inboxRuleTarget().folderType === MailSetKind.SPAM) {
				rule.excludeFromSpamFilter = true
			}
			props.inboxRules = ruleId == null ? [...inboxRules, rule] : inboxRules.map((inboxRule) => (isSameId(inboxRule._id, ruleId) ? rule : inboxRule))

			locator.entityClient
				.update(props)
				.then(() => {
					dialog.close()
				})
				.catch((error) => {
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

		const dialog = Dialog.showActionDialog({
			title: "addInboxRule_action",
			child: form,
			validator: async () => validateInboxRuleInput(inboxRuleType(), inboxRuleValue(), ruleOrTemplate._id),
			okAction: null,
			type: DialogType.InboxRule,
		})
	}
}

function getRuleValueInputByType(ruleType: InboxRuleType) {
	switch (ruleType) {
		case InboxRuleType.FROM_EQUALS:
		case InboxRuleType.RECIPIENT_TO_EQUALS:
		case InboxRuleType.RECIPIENT_CC_EQUALS:
		case InboxRuleType.RECIPIENT_BCC_EQUALS:
		case InboxRuleType.SUBJECT_CONTAINS:
		case InboxRuleType.MAIL_HEADER_CONTAINS:
			return (label: TranslationKey, value: string) =>
				m(TextField, {
					label,
					autocapitalize: Autocapitalize.none,
					value,
					oninput: (newValue) => {
						value = newValue
					},
					class: "",
				})
		default:
			throw new ProgrammingError(`No Input specified for rule of type: ${ruleType}`)
	}
}

function getRuleResultValueInputByType(ruleType: InboxRuleResultType) {
	switch (ruleType) {
		case InboxRuleResultType.MOVE:
			return (targetFolders: { name: string; value: MailSet }[], selectedValue: MailSet) =>
				m(DropDownSelectorNew, {
					label: "inboxRuleTargetFolder_label",
					items: targetFolders,
					selectedValue,
					selectedValueDisplay: getFolderName(selectedValue),
					selectionChangedHandler: (newValue) => {
						selectedValue = newValue as MailSet
					},
					class: "",
				})
		case InboxRuleResultType.EXCLUDE_SPAM:
			return null
		default:
			throw new ProgrammingError(`No Input specified for rule of type: ${ruleType}`)
	}
}

function renderConditionRow(ruleOrTemplate: InboxRuleTemplate, conditionIndex: number) {
	const conditionLabel: TranslationKey = conditionIndex === 0 ? "when_label" : "and_label"
	const isRemovable = conditionIndex > 0
	const ruleValueInput = getRuleValueInputByType(ruleOrTemplate.type as InboxRuleType)

	let ruleConditionKind: InboxRuleType | null = null
	let ruleConditionValue: string = ""

	return m(
		".rule-condition-row.mt-16.flex.wrap.items-center",
		{
			style: {
				rowGap: px(size.spacing_16),
			},
		},
		[
			m(
				".flex.items-center",
				{
					style: {
						marginRight: 0,
						flex: "1 0 35%",
						minWidth: px(200),
					},
				},
				[
					m(".smaller.text-center.mr-16.no-wrap", lang.getTranslationText(conditionLabel)),
					m(DropDownSelectorNew, {
						items: getInboxRuleTypeNameMapping(),
						label: "inboxRuleField_label",
						selectedValue: ruleConditionKind,
						selectionChangedHandler: (newValue) => {
							ruleConditionKind = newValue as InboxRuleType
						},
					}),
				],
			),
			m(
				".flex.items-center",
				{
					style: {
						flex: "1 0 65%",
						minWidth: px(200),
					},
				},
				[
					m(".ml-16.mr-16", "="),
					ruleValueInput("value_label", ruleConditionValue),
					isRemovable
						? m(
								".ml-16",
								m(Icon, {
									icon: Icons.TrashFilled,
									size: IconSize.PX24,
									style: {
										fill: theme.on_surface_variant,
									},
								}),
							)
						: null,
				],
			),
		],
	)
}

function renderResultRow(ruleResultType: InboxRuleResultType, resultIndex: number) {
	const resultLabel: TranslationKey = resultIndex === 0 ? "then_label" : "and_label"
	const isRemovable = resultIndex > 0
	const ruleValueInput = getRuleResultValueInputByType(ruleResultType)

	let ruleResultKind: InboxRuleType | null = null
	let ruleResultValue: string = ""

	return m(
		".rule-result-row.mt-16.flex.wrap.items-center",
		{
			style: {
				rowGap: px(size.spacing_16),
			},
		},
		[
			m(
				".flex.items-center",
				{
					style: {
						marginRight: 0,
						flex: "1 0 35%",
						minWidth: px(200),
					},
				},
				[
					m(".smaller.text-center.mr-16.no-wrap", lang.getTranslationText(resultLabel)),
					m(DropDownSelectorNew, {
						items: getInboxRuleResultTypeNameMapping(),
						label: "inboxRuleField_label",
						selectedValue: ruleResultKind,
						selectionChangedHandler: (newValue) => {
							ruleResultKind = newValue as InboxRuleType
						},
					}),
				],
			),
			ruleValueInput !== null
				? m(
						".flex.items-center",
						{
							style: {
								flex: "1 0 65%",
								minWidth: px(200),
							},
						},
						[
							m(".ml-16.mr-16", "="),
							// FIXME
							ruleValueInput([], {} as any),
							isRemovable
								? m(
										".ml-16",
										m(Icon, {
											icon: Icons.TrashFilled,
											size: IconSize.PX24,
											style: {
												fill: theme.on_surface_variant,
											},
										}),
									)
								: null,
						],
					)
				: null,
		],
	)
}

export function createInboxRuleTemplate(ruleType: string | null, value: string): InboxRuleTemplate {
	const type = ruleType ?? InboxRuleType.FROM_EQUALS
	return {
		type,
		value: getCleanedValue(type, value),
	}
}

function validateInboxRuleInput(type: string, value: string, ruleId: Id | undefined): TranslationKey | null {
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
		let existingRule = getExistingRuleForType(locator.logins.getUserController().props, currentCleanedValue, type)

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
