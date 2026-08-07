import m, { Children } from "mithril"
import { Dialog, DialogType } from "../../../ui/base/Dialog"
import { lang, TranslationKey } from "../../../ui/utils/LanguageViewModel"
import { assertMainOrNode, ProgrammingError, UpgradePromptType } from "../../../platform-kit/app-env"
import { isDomainName, isMailAddress, isRegularExpression } from "../../../platform-kit/utils/FormatUtils"
import { clone, elementIdPart } from "../../../platform-kit/meta"
import type { MailboxDetail } from "../../common/mailFunctionality/MailboxModel.js"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import { Autocapitalize } from "../../../ui/base/LegacyTextField.js"
import { isOfflineError, LockedError } from "../../../platform-kit/rest-client/error"
import { showNotAvailableForFreeDialog } from "../../common/misc/SubscriptionDialogs"
import { locator } from "../../common/api/main/CommonLocator"
import { mailLocator } from "../mailLocator.js"
import { assertSystemFolderOfType, getIndentedFolderNameForDropdown, getMailSetName } from "../mail/model/MailUtils.js"
import type { IndentedMailSet } from "../../common/api/common/mail/FolderSystem.js"
import {
	createExpandedInboxRule,
	createInboxRuleCondition,
	createInboxRuleResult,
	ExpandedInboxRule,
	InboxRuleCondition,
	InboxRuleResult,
	MailSet,
} from "@tutao/entities/tutanota"
import { InboxRuleConditionType, InboxRuleResultType, MailSetKind } from "../../../entities/tutanota/Utils"
import { Icons } from "../../../ui/base/icons/Icons"
import { Card } from "../../../ui/base/Card"
import { Icon, IconSize } from "../../../ui/base/Icon"
import { PrimaryButton, SecondaryButton } from "../../../ui/base/buttons/VariantButtons"
import { DropDownSelectorNew } from "../../../ui/base/DropDownSelectorNew"
import { TextField } from "../../../ui/base/TextField"
import { theme } from "../../../ui/theme"
import { px, size } from "../../../ui/size"
import { assertNotNull, isEmpty, last } from "@tutao/utils"
import { showProgressDialog } from "../../../ui/dialogs/ProgressDialog"
import { ButtonType } from "../../../ui/base/Button"
import { onbeforeremoveColapseAnimation, oncreateExpandAnimation } from "../../../ui/animation/Animations"
import { IconButton } from "../../../ui/base/IconButton"
import { ButtonSize } from "../../../ui/base/ButtonSize"
import { SelectorItem } from "../../../ui/base/DropDownSelector"
import { getInboxRuleConditionTypeNameMapping, getInboxRuleResultTypeNameMapping } from "../mail/model/InboxRuleHandler"
import { InboxRuleModel } from "../mail/model/InboxRuleModel"
import { applyRuleWithProgress } from "./InboxRuleSettingsViewer"

assertMainOrNode()

interface InboxRuleConditionField {
	type: Stream<InboxRuleConditionType>
	value: Stream<string>

	// for keeping track in the dialog (not persisted on db)
	key: number
}

interface InboxRuleResultField {
	type: Stream<InboxRuleResultType>
	value: Stream<MailSet | null>

	// for keeping track in the dialog (not persisted on db)
	key: number
}

interface MoveTargetFolder {
	name: string
	value: MailSet
}

export async function show(
	mailBoxDetail: MailboxDetail,
	inboxRuleModel: InboxRuleModel,
	originalInboxRule: ExpandedInboxRule | null,
	defaultConditions?: Pick<InboxRuleCondition, "type" | "value">[],
) {
	if (locator.logins.getUserController().isFreeAccount()) {
		showNotAvailableForFreeDialog(UpgradePromptType.INBOX_RULES)
	} else if (mailBoxDetail) {
		const folders = await mailLocator.mailModel.getMailboxFoldersForId(mailBoxDetail.mailbox.mailSets._id)
		let targetFolders = folders.getIndentedList().map((folderInfo: IndentedMailSet) => {
			return {
				name: getIndentedFolderNameForDropdown(folderInfo),
				value: folderInfo.mailSet,
			}
		})

		const inboxRuleName: stream<string> = stream(originalInboxRule?.name ?? "")

		// Make onbeforeremove row removal animate the correct row (otherwise it will just think it's the last row)
		let currentRowKey = 0

		const inboxRuleConditions: InboxRuleConditionField[] = (
			originalInboxRule?.conditions ??
			defaultConditions ?? [{ type: InboxRuleConditionType.FROM_EQUALS, value: "" }]
		).map((condition) => {
			return { type: stream(condition.type as InboxRuleConditionType), value: stream(condition.value), key: currentRowKey++ }
		})

		const inboxRuleResults: InboxRuleResultField[] = originalInboxRule
			? originalInboxRule.results.map((result) => {
					let value = result.value == null ? null : folders.getFolderById(elementIdPart(result.value))
					return { type: stream(result.type as InboxRuleResultType), value: stream(value), key: currentRowKey++ }
				})
			: []

		// Only allow one result of each type
		const allRuleResults = getInboxRuleResultTypeNameMapping()
		let availableRuleResults: Set<SelectorItem<InboxRuleResultType>>

		if (isEmpty(inboxRuleResults)) {
			// If there are no results yet, add the default value of Move to Archive
			inboxRuleResults.push({
				type: stream(InboxRuleResultType.MOVE),
				value: stream(assertSystemFolderOfType(folders, MailSetKind.ARCHIVE)),
				key: currentRowKey++,
			})
		}

		const renderName = () => {
			return m(
				".mt-16.max-width-m",
				m(TextField, {
					label: "name_label",
					value: inboxRuleName(),
					oninput: inboxRuleName,
				}),
			)
		}

		const renderConditionRow = (condition: InboxRuleConditionField, conditionIndex: number) => {
			const isFirstCondition = conditionIndex === 0
			const conditionLabel: TranslationKey = isFirstCondition ? "when_label" : "and_label"

			return m(
				".inbox-rule-wrapping-row.items-center.row-gap-8.mt-16",
				{
					oncreate: (vnode) => oncreateExpandAnimation(vnode.dom as HTMLElement),
					onbeforeremove: (vnode) => onbeforeremoveColapseAnimation(vnode.dom as HTMLElement),
					key: condition.key,
				},
				[
					m(".flex.items-center", [
						m(`.smaller.no-wrap.mr-16 ${isFirstCondition ? ".capitalize" : ".lowercase"}`, lang.getTranslationText(conditionLabel)),
						m(DropDownSelectorNew, {
							items: getInboxRuleConditionTypeNameMapping(),
							selectedValue: condition.type(),
							selectionChangedHandler: condition.type,
						}),
					]),
					m(".flex.items-center", [
						m(".mlr-16", "="),
						getRuleConditionValueInputByType(condition),
						!isFirstCondition
							? m(
									".ml-4",
									m(IconButton, {
										icon: Icons.TrashFilled,
										size: ButtonSize.Large,
										style: {
											fill: theme.on_surface_variant,
										},
										label: "delete_action",
										click: () => {
											inboxRuleConditions.splice(conditionIndex, 1)
										},
									}),
								)
							: null,
					]),
				],
			)
		}

		const renderAddConditionRow = (): Children => {
			const lastCondition = last(inboxRuleConditions)
			if (lastCondition != null && validateInboxRuleCondition(lastCondition) == null) {
				return m(
					".flex.items-center.row-gap-8.mt-16",
					{
						oncreate: (vnode) => oncreateExpandAnimation(vnode.dom as HTMLElement),
						onbeforeremove: (vnode) => onbeforeremoveColapseAnimation(vnode.dom as HTMLElement),
					},
					[
						m(".flex.items-center.mr-24", lang.getTranslationText("and_label")),
						m(SecondaryButton, {
							width: "flex",
							icon: Icons.Plus,
							label: "addCondition_label",
							onclick: () => {
								inboxRuleConditions.push({
									type: stream(InboxRuleConditionType.FROM_EQUALS),
									value: stream(""),
									key: currentRowKey++,
								})
							},
						}),
					],
				)
			} else {
				return null
			}
		}

		const defaultResultOfType = (type: InboxRuleResultType): MailSet | null => {
			if (type === InboxRuleResultType.MOVE) {
				// set to default folder of Archive
				return assertSystemFolderOfType(folders, MailSetKind.ARCHIVE)
			} else {
				return null
			}
		}

		const renderResultRow = (ruleResult: InboxRuleResultField, resultIndex: number) => {
			const isFirstResult = resultIndex === 0
			const resultLabel: TranslationKey = isFirstResult ? "then_label" : "and_label"
			const ruleValueInput = getRuleResultValueInputByType(ruleResult)

			return m(
				".inbox-rule-wrapping-row.items-center.row-gap-8.mt-16",
				{
					oncreate: (vnode) => oncreateExpandAnimation(vnode.dom as HTMLElement),
					onbeforeremove: (vnode) => onbeforeremoveColapseAnimation(vnode.dom as HTMLElement),
					key: ruleResult.key,
				},
				[
					m(
						".flex.items-center",
						{
							style: {
								maxWidth: ruleValueInput == null ? "35%" : undefined,
							},
						},
						[
							m(".smaller.lowercase.no-wrap.mr-16", lang.getTranslationText(resultLabel)),
							m(DropDownSelectorNew, {
								items: allRuleResults.filter((rule) => rule.value === ruleResult.type() || availableRuleResults.has(rule)),
								selectedValue: ruleResult.type(),
								selectionChangedHandler: (newValue: InboxRuleResultType) => {
									ruleResult.type(newValue)
									ruleResult.value(defaultResultOfType(newValue))
								},
							}),
						],
					),
					m(".flex.items-center.justify-end", [
						ruleValueInput !== null ? [m(".mlr-16", "="), ruleValueInput(targetFolders)] : null,
						!isFirstResult
							? m(
									".ml-4",
									m(IconButton, {
										icon: Icons.TrashFilled,
										size: ButtonSize.Large,
										style: {
											fill: theme.on_surface_variant,
										},
										label: "delete_action",
										click: () => {
											inboxRuleResults.splice(resultIndex, 1)
										},
									}),
								)
							: null,
					]),
				],
			)
		}

		const renderAddResultRow = (): Children => {
			if (availableRuleResults.size === 0) {
				return null
			}
			return m(
				".flex.items-center.row-gap-8.mt-16",
				{
					oncreate: (vnode) => oncreateExpandAnimation(vnode.dom as HTMLElement),
					onbeforeremove: (vnode) => onbeforeremoveColapseAnimation(vnode.dom as HTMLElement),
				},
				[
					m(".flex.items-center.mr-24.smaller", lang.getTranslationText("and_label")),
					m(SecondaryButton, {
						width: "flex",
						icon: Icons.Plus,
						label: "addResult_action",
						onclick: () => {
							const firstAvailable: SelectorItem<InboxRuleResultType> = assertNotNull(availableRuleResults.values().next().value)

							inboxRuleResults.push({
								type: stream(firstAvailable.value),
								value: stream(defaultResultOfType(firstAvailable.value)),
								key: currentRowKey++,
							})
						},
					}),
				],
			)
		}

		const form = () => {
			availableRuleResults = new Set(allRuleResults.filter((rule) => !inboxRuleResults.some((result) => result.type() === rule.value)))

			return [
				m(Card, { classes: ["mt-16 center"], style: { padding: px(size.spacing_16) } }, [
					m(Icon, {
						icon: Icons.FunnelFilled,
						size: IconSize.PX32,
						style: {
							fill: theme.on_surface_variant,
						},
					}),
					m(".smaller.mt-16", lang.getTranslationText("inboxRuleExplainer_msg")),
				]),
				renderName(),
				m(".uppercase.b.mt-32.content-fg", lang.getTranslationText("condition_label")),
				inboxRuleConditions.map(renderConditionRow),
				renderAddConditionRow(),
				m(".uppercase.b.mt-32.content-fg", lang.getTranslationText("searchResult_label")),
				inboxRuleResults.map(renderResultRow),
				renderAddResultRow(),
				m(
					".flex-end.wrap.mt-24.gap-16",
					m(SecondaryButton, {
						width: "flex",
						label: "save_action",
						onclick: () => inboxRuleOkAction(dialog, false),
					}),
					m(PrimaryButton, {
						width: "flex",
						label: "saveAndApply_action",
						onclick: () => inboxRuleOkAction(dialog, true),
					}),
				),
			]
		}

		const prepareRule = (validatedName: string, ruleConditions: InboxRuleCondition[], ruleResults: InboxRuleResult[]): ExpandedInboxRule => {
			if (originalInboxRule) {
				const rule = clone(originalInboxRule)
				rule.name = validatedName
				rule.conditions = ruleConditions
				rule.results = ruleResults
				return rule
			} else {
				return createExpandedInboxRule({
					name: validatedName,
					conditions: ruleConditions,
					results: ruleResults,
				})
			}
		}

		const inboxRuleOkAction = (dialog: Dialog, applyRule: boolean) => {
			const validatedName = inboxRuleName().trim()

			if (validatedName === "") {
				Dialog.message("enterName_msg")
				return
			}

			const ruleConditions: InboxRuleCondition[] = []

			for (const condition of inboxRuleConditions) {
				const invalidInboxRuleMsg = validateInboxRuleCondition(condition)
				if (invalidInboxRuleMsg !== null) {
					Dialog.message(invalidInboxRuleMsg)
					return
				}
				ruleConditions.push(createInboxRuleCondition({ type: condition.type(), value: condition.value() }))
			}

			const ruleResults: InboxRuleResult[] = []

			for (const result of inboxRuleResults) {
				const value = validateInboxRuleResult(result)

				ruleResults.push(createInboxRuleResult({ type: result.type(), value }))
			}

			const rule = prepareRule(validatedName, ruleConditions, ruleResults)
			const savePromise = isNewInboxRule ? inboxRuleModel.createInboxRule(rule) : inboxRuleModel.updateInboxRule(rule)

			savePromise
				.then(() => {
					if (applyRule) {
						return applyRuleWithProgress([rule], mailLocator.inboxRuleHandler())
					}
				})
				.then(() => {
					dialog.close()
				})
				.catch((error) => {
					if (isOfflineError(error)) {
						//do not close
						throw error
					} else if (error instanceof LockedError) {
						dialog.close()
					} else {
						dialog.close()
						throw error
					}
				})
		}

		const isNewInboxRule = originalInboxRule == null
		const dialog = Dialog.showActionDialog({
			type: DialogType.InboxRule,
			title: isNewInboxRule ? "addInboxRule_action" : "editInboxRule_action",
			child: form,
			okAction: null,
		})
	}
}

function getRuleConditionValueInputByType(ruleCondition: InboxRuleConditionField) {
	switch (ruleCondition.type()) {
		case InboxRuleConditionType.FROM_EQUALS:
		case InboxRuleConditionType.RECIPIENT_TO_EQUALS:
		case InboxRuleConditionType.RECIPIENT_CC_EQUALS:
		case InboxRuleConditionType.RECIPIENT_BCC_EQUALS:
		case InboxRuleConditionType.SUBJECT_CONTAINS:
		case InboxRuleConditionType.MAIL_HEADER_CONTAINS:
			return m(TextField, {
				label: "value_label",
				autocapitalize: Autocapitalize.none,
				value: ruleCondition.value(),
				oninput: ruleCondition.value,
				class: "",
			})
		default:
			throw new ProgrammingError(`No Input specified for rule condition of type: ${ruleCondition.type()}`)
	}
}

function getRuleResultValueInputByType(ruleResult: InboxRuleResultField) {
	switch (ruleResult.type()) {
		case InboxRuleResultType.MOVE:
			return (targetFolders: MoveTargetFolder[]) =>
				m(DropDownSelectorNew, {
					items: targetFolders,
					selectedValue: ruleResult.value(),
					selectedValueDisplay: getMailSetName(assertNotNull(ruleResult.value())),
					selectionChangedHandler: ruleResult.value,
					class: "",
				})
		case InboxRuleResultType.EXCLUDE_SPAM:
		case InboxRuleResultType.READ:
			return null
		default:
			throw new ProgrammingError(`No Input specified for rule result of type: ${ruleResult.type()}`)
	}
}

function validateInboxRuleCondition(condition: InboxRuleConditionField): TranslationKey | null {
	const type = condition.type()
	const value = condition.value()
	const currentCleanedValue = getCleanedValue(type, value)

	if (currentCleanedValue === "") {
		return "inboxRuleEnterValue_msg"
	} else if (isInvalidRegex(currentCleanedValue)) {
		return "invalidRegexSyntax_msg"
	} else if (
		type !== InboxRuleConditionType.SUBJECT_CONTAINS &&
		type !== InboxRuleConditionType.MAIL_HEADER_CONTAINS &&
		!isRegularExpression(currentCleanedValue) &&
		!isDomainName(currentCleanedValue) &&
		!isMailAddress(currentCleanedValue, false)
	) {
		return "inboxRuleInvalidEmailAddress_msg"
	} else {
		return null
	}
}

function validateInboxRuleResult(result: InboxRuleResultField): IdTuple | null {
	const type = result.type()
	const value = result.value()

	if (type === InboxRuleResultType.EXCLUDE_SPAM || type === InboxRuleResultType.READ) {
		if (value != null) {
			// throw an error instead of informing user, as the user should not be able to choose a value here
			// if a value is here something else has gone wrong
			throw new ProgrammingError("Boolean InboxRuleResultType has value!")
		}
		return null
	} else {
		if (value == null) {
			throw new ProgrammingError("When moving or labeling, a mail set must be there!")
		}
		return value._id
	}
}

function getCleanedValue(type: string, value: string): string {
	if (type === InboxRuleConditionType.SUBJECT_CONTAINS || type === InboxRuleConditionType.MAIL_HEADER_CONTAINS) {
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
