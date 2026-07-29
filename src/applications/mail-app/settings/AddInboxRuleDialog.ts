import m, { Children } from "mithril"
import { Dialog, DialogType } from "../../../ui/base/Dialog"
import { lang, TranslationKey } from "../../../ui/utils/LanguageViewModel"
import { EnvProvider, ProgrammingError, UpgradePromptType } from "@tutao/app-env"
import { assertNotNull, isDomainName, isEmpty, isMailAddress, isRegularExpression } from "@tutao/utils"
import { clone, elementIdPart, isSameId, isSameIdTuple } from "@tutao/meta"
import type { MailboxDetail } from "../../common/mailFunctionality/MailboxModel.js"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import { Autocapitalize } from "../../../ui/base/LegacyTextField.js"
import { isOfflineError, LockedError } from "@tutao/rest-client/error"
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
import { onbeforeremoveColapseAnimation, oncreateExpandAnimation } from "../../../ui/animation/Animations"
import { IconButton } from "../../../ui/base/IconButton"
import { ButtonSize } from "../../../ui/base/ButtonSize"
import { SelectorItem } from "../../../ui/base/DropDownSelector"
import { getInboxRuleConditionTypeNameMapping, getInboxRuleResultTypeNameMapping } from "../mail/model/InboxRuleHandler"
import { InboxRuleModel } from "../mail/model/InboxRuleModel"
import { applyRuleWithProgress } from "./InboxRuleSettingsViewer"
import { LabelsDropDownSelector } from "../mail/view/LabelsDropDownSelector"
import { Label } from "../../../ui/base/Label"
import { prependParentLabelNamesToLabel } from "../mail/view/MailSetTreeUtils"

EnvProvider.assertMainOrNode()

interface InboxRuleConditionField {
	type: Stream<InboxRuleConditionType>
	value: Stream<string>

	// for keeping track in the dialog (not persisted on db)
	key: number
	valid: boolean | null
}

interface InboxRuleResultField {
	type: Stream<InboxRuleResultType>
	valueFolder: Stream<MailSet | null>
	valueLabels: Stream<MailSet[]>

	// for keeping track in the dialog (not persisted on db)
	key: number
	valid: boolean | null
}

interface TargetMailSet {
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
		void showNotAvailableForFreeDialog(UpgradePromptType.INBOX_RULES)
	} else if (mailBoxDetail) {
		const folders = await mailLocator.mailModel.getMailboxFoldersForId(mailBoxDetail.mailbox.mailSets._id)
		let targetFolders = folders.getIndentedList().map((folderInfo: IndentedMailSet) => {
			return {
				name: getIndentedFolderNameForDropdown(folderInfo),
				value: folderInfo.mailSet,
			}
		})

		const labels = mailLocator.mailModel.getLabelsByGroupId(assertNotNull(mailBoxDetail.mailbox._ownerGroup))
		const targetLabels =
			mailLocator.mailModel
				.getLabelFolderSystemByGroupId(assertNotNull(mailBoxDetail.mailbox._ownerGroup))
				?.getIndentedList()
				.map((label) => ({
					name: getIndentedFolderNameForDropdown(label),
					value: label.mailSet,
				})) ?? []

		const inboxRuleName: stream<string> = stream(originalInboxRule?.name ?? "")

		// Make onbeforeremove row removal animate the correct row (otherwise it will just think it's the last row)
		let currentRowKey = 0

		const inboxRuleConditions: InboxRuleConditionField[] = (
			originalInboxRule?.conditions ??
			defaultConditions ?? [{ type: InboxRuleConditionType.FROM_EQUALS, value: "" }]
		).map((condition) => {
			return { type: stream(condition.type as InboxRuleConditionType), value: stream(condition.value), key: currentRowKey++, valid: null }
		})

		const inboxRuleResults: InboxRuleResultField[] = originalInboxRule
			? originalInboxRule.results
					.map((result): InboxRuleResultField => {
						const value =
							result.value == null
								? null
								: result.type === InboxRuleResultType.LABEL
									? (labels.get(elementIdPart(result.value)) ?? null)
									: folders.getFolderById(elementIdPart(result.value))
						return {
							type: stream(result.type as InboxRuleResultType),
							valueFolder: stream(value),
							valueLabels: stream([]),
							key: currentRowKey++,
							valid: null,
						}
					})
					.reduce((results, result) => {
						// merge label results so there's only one dropdown
						if (result.type() === InboxRuleResultType.LABEL) {
							const otherLabelResult = results.find((r) => r.type() === InboxRuleResultType.LABEL)

							const assignedLabel = result.valueFolder()
							if (assignedLabel != null) {
								if (otherLabelResult != null) {
									otherLabelResult.valueLabels([...otherLabelResult.valueLabels(), assignedLabel])
								} else {
									// first label result clause, make it an array!
									results.push({
										type: stream(InboxRuleResultType.LABEL),
										valueLabels: stream([assignedLabel]),
										valueFolder: stream(null),
										key: result.key,
										valid: null,
									})
								}
							}
						} else {
							// non-labels stay as they are
							results.push(result)
						}
						return results
					}, [] as InboxRuleResultField[])
			: []

		// HAS and HAS_NO Attachment are mutually exclusive and should only be selected once per inbox rule
		// when HAS_(NO_)ATTACHMENT is selected, show both options in that dropdown and do not display them in other dropdowns
		const selectableInboxRuleConditions = (currentConditionType: InboxRuleConditionType) => {
			const attachmentConditions = [InboxRuleConditionType.HAS_ATTACHMENT, InboxRuleConditionType.HAS_NO_ATTACHMENT]
			let selectableConditions = getInboxRuleConditionTypeNameMapping()
			if (!attachmentConditions.includes(currentConditionType) && inboxRuleConditions.some(({ type }) => attachmentConditions.includes(type()))) {
				selectableConditions = selectableConditions.filter(({ value }) => !attachmentConditions.includes(value as InboxRuleConditionType))
			}
			return selectableConditions
		}

		// Only allow one result of each type
		const allRuleResults = getInboxRuleResultTypeNameMapping()
		let availableRuleResults: Set<SelectorItem<InboxRuleResultType>>

		if (isEmpty(inboxRuleResults)) {
			// If there are no results yet, add the default value of Move to Archive
			inboxRuleResults.push({
				type: stream(InboxRuleResultType.MOVE),
				valueFolder: stream(assertSystemFolderOfType(folders, MailSetKind.ARCHIVE)),
				valueLabels: stream([]),
				key: currentRowKey++,
				valid: null,
			})
		}

		let nameValid = true
		const renderName = () => {
			return m(
				".mt-16.max-width-m",
				m(TextField, {
					label: "name_label",
					value: inboxRuleName(),
					oninput: (val: string) => {
						inboxRuleName(val)
						nameValid = true
					},
					onblur: () => {
						if (!nameValid) {
							nameValid = !!inboxRuleName()
						}
					},
					doShowBorder: nameValid,
					class: nameValid ? "" : "error-text-field",
					helpLabel: nameValid ? null : () => lang.getTranslationText("enterName_msg"),
				}),
			)
		}

		const renderConditionRow = (condition: InboxRuleConditionField, conditionIndex: number, allConditions: InboxRuleConditionField[]) => {
			const isFirstCondition = conditionIndex === 0
			const conditionLabel: TranslationKey = isFirstCondition ? "whenCondition_label" : "and_label"
			const conditionInput = getRuleConditionValueInputByType(condition)

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
							items: selectableInboxRuleConditions(condition.type()),
							selectedValue: condition.type(),
							selectionChangedHandler: condition.type,
						}),
					]),
					m(".flex", [
						conditionInput,
						allConditions.length > 1
							? m(
									".ml-4",
									m(IconButton, {
										icon: Icons.X,
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
			return m(
				".flex.items-center.row-gap-8.mt-16",
				{
					oncreate: (vnode) => oncreateExpandAnimation(vnode.dom as HTMLElement),
					onbeforeremove: (vnode) => onbeforeremoveColapseAnimation(vnode.dom as HTMLElement),
				},
				[
					m(".flex.items-center.mr-16.smaller", lang.getTranslationText("and_label")),
					m(SecondaryButton, {
						width: "flex",
						icon: Icons.Plus,
						label: "addCondition_label",
						onclick: () => {
							inboxRuleConditions.push({
								type: stream(InboxRuleConditionType.FROM_EQUALS),
								value: stream(""),
								key: currentRowKey++,
								valid: null,
							})
						},
					}),
				],
			)
		}

		const defaultResultOfType = (type: InboxRuleResultType): MailSet | null => {
			if (type === InboxRuleResultType.MOVE) {
				// set to default folder of Archive
				return assertSystemFolderOfType(folders, MailSetKind.ARCHIVE)
			} else {
				return null
			}
		}

		const renderResultRow = (ruleResult: InboxRuleResultField, resultIndex: number, allResults: InboxRuleResultField[]) => {
			const resultLabel: TranslationKey = resultIndex === 0 ? "then_label" : "and_label"
			const ruleValueInput = getRuleResultValueInputByType(ruleResult)

			return m(
				"",
				{
					oncreate: (vnode) => oncreateExpandAnimation(vnode.dom as HTMLElement),
					onbeforeremove: (vnode) => onbeforeremoveColapseAnimation(vnode.dom as HTMLElement),
					key: ruleResult.key,
				},
				[
					m(".inbox-rule-wrapping-row.items-center.row-gap-8.mt-16", [
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
										ruleResult.valueFolder(defaultResultOfType(newValue))
									},
								}),
							],
						),
						m(".flex", [
							ruleValueInput !== null
								? [m(".mlr-16.mt-16", "="), ruleValueInput(ruleResult.type() === InboxRuleResultType.LABEL ? targetLabels : targetFolders)]
								: null,
							allResults.length > 1
								? m(
										".ml-4",
										m(IconButton, {
											icon: Icons.X,
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
					]),
					ruleResult.type() === InboxRuleResultType.LABEL && ruleResult.valueLabels().length
						? m(
								".flex.wrap.ml-32.mt-16.mr-between-8.row-gap-8",
								ruleResult.valueLabels().map((value) =>
									m(Label, {
										text: prependParentLabelNamesToLabel(value, labels),
										color: value.color ?? theme.primary,
										cancelable: true,
										cancelAction: () => {
											const newValue = ruleResult.valueLabels().filter((label) => !isSameIdTuple(label._id, value._id))
											ruleResult.valueLabels(newValue)
										},
									}),
								),
							)
						: null,
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
					m(".flex.items-center.mr-16.smaller", lang.getTranslationText("and_label")),
					m(SecondaryButton, {
						width: "flex",
						icon: Icons.Plus,
						label: "addResult_action",
						onclick: () => {
							const firstAvailable: SelectorItem<InboxRuleResultType> = assertNotNull(availableRuleResults.values().next().value)

							inboxRuleResults.push({
								type: stream(firstAvailable.value),
								valueFolder: stream(defaultResultOfType(firstAvailable.value)),
								valueLabels: stream([]),
								key: currentRowKey++,
								valid: null,
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
				m(".uppercase.b.mt-32.content-fg", lang.getTranslationText("inboxRuleConditions_label")),
				inboxRuleConditions.map(renderConditionRow),
				renderAddConditionRow(),
				m(".uppercase.b.mt-32.content-fg", lang.getTranslationText("inboxRuleResults_label")),
				inboxRuleResults.map(renderResultRow),
				renderAddResultRow(),
				m(
					".flex-end.wrap.mt-24.gap-16",
					m(SecondaryButton, {
						width: "flex",
						label: "saveAndApply_action",
						onclick: () => inboxRuleOkAction(dialog, true),
					}),
					m(PrimaryButton, {
						width: "flex",
						label: "save_action",
						onclick: () => inboxRuleOkAction(dialog, false),
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
					enabled: true,
				})
			}
		}

		const inboxRuleOkAction = (dialog: Dialog, applyRule: boolean) => {
			// did we already send a dialogue about an invalid field?
			let alreadyMessaged = false
			const validatedName = inboxRuleName().trim()

			if (validatedName === "") {
				nameValid = false
				Dialog.message("enterName_msg")
				alreadyMessaged = true
			}

			const ruleConditions: InboxRuleCondition[] = []

			for (const condition of inboxRuleConditions) {
				const invalidInboxRuleMsg = validateInboxRuleCondition(condition)
				if (invalidInboxRuleMsg !== null) {
					condition.valid = false
					if (!alreadyMessaged) {
						Dialog.message(invalidInboxRuleMsg)
						alreadyMessaged = true
					}
				}
				ruleConditions.push(createInboxRuleCondition({ type: condition.type(), value: condition.value() }))
			}

			const ruleResults: InboxRuleResult[] = []

			for (const result of inboxRuleResults) {
				if (result.type() === InboxRuleResultType.LABEL) {
					if (result.valueLabels().length === 0) {
						result.valid = false
						if (!alreadyMessaged) {
							Dialog.message("labelMustBeSelected_msg")
							alreadyMessaged = true
						}
					}
					for (const label of result.valueLabels()) {
						const labelId = validateInboxRuleResult(result.type(), label)
						ruleResults.push(createInboxRuleResult({ type: result.type(), value: labelId }))
					}
				} else {
					const valueId = validateInboxRuleResult(result.type(), result.valueFolder())
					ruleResults.push(createInboxRuleResult({ type: result.type(), value: valueId }))
				}
			}

			if (alreadyMessaged) {
				// only return here to give user all the feedback before exiting
				return
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

function getRuleConditionValueInputByType(ruleCondition: InboxRuleConditionField): Children {
	const clearValidation = (val: string) => {
		ruleCondition.value(val)

		// don't be annoying!
		if (ruleCondition.valid === false) {
			const valid = validateInboxRuleCondition(ruleCondition) === null
			if (valid) {
				ruleCondition.valid = valid
			}
		}
	}
	const validate = () => {
		if (ruleCondition.valid === false) {
			ruleCondition.valid = validateInboxRuleCondition(ruleCondition) === null
		}
	}
	const validatedTextFieldProps = {
		oninput: clearValidation,
		onblur: validate,
		doShowBorder: ruleCondition.valid !== false,
		class: ruleCondition.valid === false ? "error-text-field" : "",
		helpLabel: ruleCondition.valid === false ? () => lang.getTranslationText(validateInboxRuleCondition(ruleCondition)!) : null,
	}

	switch (ruleCondition.type()) {
		case InboxRuleConditionType.FROM_EQUALS:
		case InboxRuleConditionType.RECIPIENT_TO_EQUALS:
		case InboxRuleConditionType.RECIPIENT_CC_EQUALS:
		case InboxRuleConditionType.RECIPIENT_BCC_EQUALS:
		case InboxRuleConditionType.RECIPIENT_ANY_EQUALS:
			return [
				m(".mlr-16.mt-16", "="),
				m(TextField, {
					label: "emailSenderPlaceholder_label",
					autocapitalize: Autocapitalize.none,
					value: ruleCondition.value(),
					...validatedTextFieldProps,
				}),
			]
		case InboxRuleConditionType.SUBJECT_CONTAINS:
		case InboxRuleConditionType.MAIL_HEADER_CONTAINS:
			return [
				m(".mlr-8", ""),
				m(TextField, {
					label: "value_label",
					autocapitalize: Autocapitalize.none,
					value: ruleCondition.value(),
					...validatedTextFieldProps,
				}),
			]
		case InboxRuleConditionType.HAS_ATTACHMENT:
		case InboxRuleConditionType.HAS_NO_ATTACHMENT:
			ruleCondition.value("")
			return null
		default:
			throw new ProgrammingError(`No Input specified for rule condition of type: ${ruleCondition.type()}`)
	}
}

function getRuleResultValueInputByType(ruleResult: InboxRuleResultField) {
	switch (ruleResult.type()) {
		case InboxRuleResultType.MOVE:
			return (targetFolders: TargetMailSet[]) =>
				m(DropDownSelectorNew, {
					// icon: {
					// 	icon: ruleResult.valueFolder()?.folderType
					// 		? getFolderIconByType(assertNotNull(ruleResult.valueFolder()).folderType as MailSetKind)
					// 		: Icons.FolderFilled,
					// 	color: theme.on_surface_variant,
					// },
					items: targetFolders,
					selectedValue: ruleResult.valueFolder(),
					selectedValueDisplay: getMailSetName(assertNotNull(ruleResult.valueFolder())),
					selectionChangedHandler: ruleResult.valueFolder,
					class: "",
				})
		case InboxRuleResultType.LABEL:
			return (labels: TargetMailSet[]) =>
				m(LabelsDropDownSelector, {
					label: "selectLabel_action",
					items: labels.map((label) => ({
						...label,
						applied: ruleResult.valueLabels().some((l) => isSameId(l._id, label.value._id)),
					})),
					icon: {
						icon: Icons.LabelFilled,
						color: theme.on_surface_variant,
					},
					onLabelsApplied: ruleResult.valueLabels,
					onModalClosed: () => {
						if (ruleResult.valid === false) {
							ruleResult.valid = !!ruleResult.valueLabels().length
						}
					},
					class: ruleResult.valid === false ? "error-text-field" : undefined,
					helpLabel: ruleResult.valid === false ? () => lang.getTranslationText("labelMustBeSelected_msg") : undefined,
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

	if (type !== InboxRuleConditionType.HAS_ATTACHMENT && type !== InboxRuleConditionType.HAS_NO_ATTACHMENT && currentCleanedValue === "") {
		return "inboxRuleEnterValue_msg"
	} else if (isInvalidRegex(currentCleanedValue)) {
		return "invalidRegexSyntax_msg"
	} else if (
		type !== InboxRuleConditionType.SUBJECT_CONTAINS &&
		type !== InboxRuleConditionType.MAIL_HEADER_CONTAINS &&
		type !== InboxRuleConditionType.HAS_ATTACHMENT &&
		type !== InboxRuleConditionType.HAS_NO_ATTACHMENT &&
		!isRegularExpression(currentCleanedValue) &&
		!isDomainName(currentCleanedValue) &&
		!isMailAddress(currentCleanedValue, false)
	) {
		return "inboxRuleInvalidEmailAddress_msg"
	} else {
		return null
	}
}

function validateInboxRuleResult(type: InboxRuleResultType, value: MailSet | null): IdTuple | null {
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
