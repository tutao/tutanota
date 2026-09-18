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
	createInboxRuleAction,
	createInboxRuleCondition,
	ExpandedInboxRule,
	InboxRuleAction,
	InboxRuleCondition,
	MailSet,
} from "@tutao/entities/tutanota"
import { InboxRuleConditionType, InboxRuleActionType, MailSetKind } from "../../../entities/tutanota/Utils"
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
import { getInboxRuleConditionTypeNameMapping, getInboxRuleActionTypeNameMapping } from "../mail/model/InboxRuleHandler"
import { InboxRuleModel } from "../mail/model/InboxRuleModel"
import { applyRuleWithProgress } from "./InboxRuleSettingsViewer"
import { LabelsDropDownSelector } from "../mail/view/LabelsDropDownSelector"
import { Label } from "../../../ui/base/Label"
import { prependParentLabelNamesToLabel } from "../mail/view/MailSetTreeUtils"
import { ExpandedInboxRuleHandler } from "../mail/model/ExpandedInboxRuleHandler"

EnvProvider.assertMainOrNode()

interface InboxRuleConditionField {
	type: Stream<InboxRuleConditionType>
	value: Stream<string>

	// for keeping track in the dialog (not persisted on db)
	key: number
	valid: boolean | null
}

interface InboxRuleActionField {
	type: Stream<InboxRuleActionType>
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

		const inboxRuleActions: InboxRuleActionField[] = originalInboxRule
			? originalInboxRule.actions
					.map((action): InboxRuleActionField => {
						const value =
							action.value == null
								? null
								: action.type === InboxRuleActionType.LABEL
									? (labels.get(elementIdPart(action.value)) ?? null)
									: folders.getFolderById(elementIdPart(action.value))
						return {
							type: stream(action.type as InboxRuleActionType),
							valueFolder: stream(value),
							valueLabels: stream([]),
							key: currentRowKey++,
							valid: null,
						}
					})
					.reduce((actions, action) => {
						// merge label actions so there's only one dropdown
						if (action.type() === InboxRuleActionType.LABEL) {
							const otherLabelAction = actions.find((r) => r.type() === InboxRuleActionType.LABEL)

							const assignedLabel = action.valueFolder()
							if (assignedLabel != null) {
								if (otherLabelAction != null) {
									otherLabelAction.valueLabels([...otherLabelAction.valueLabels(), assignedLabel])
								} else {
									// first label action clause, make it an array!
									actions.push({
										type: stream(InboxRuleActionType.LABEL),
										valueLabels: stream([assignedLabel]),
										valueFolder: stream(null),
										key: action.key,
										valid: null,
									})
								}
							}
						} else {
							// non-labels stay as they are
							actions.push(action)
						}
						return actions
					}, [] as InboxRuleActionField[])
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

		// Only allow one action of each type
		const allRuleActions = getInboxRuleActionTypeNameMapping()
		let availableRuleActions: Set<SelectorItem<InboxRuleActionType>>

		if (isEmpty(inboxRuleActions)) {
			// If there are no actions yet, add the default value of Move to Archive
			inboxRuleActions.push({
				type: stream(InboxRuleActionType.MOVE),
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
			const conditionLabel: TranslationKey | null = isFirstCondition ? null : "and_label"
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
						conditionLabel ? m(".smaller.no-wrap.mr-16.ml-8", lang.getTranslationText(conditionLabel)) : null,
						m(DropDownSelectorNew, {
							items: selectableInboxRuleConditions(condition.type()),
							selectedValue: condition.type(),
							selectionChangedHandler: (newValue: InboxRuleConditionType) => {
								condition.valid = null
								condition.type(newValue)
							},
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
					m(".flex.items-center.mr-16.ml-8.smaller", lang.getTranslationText("and_label")),
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

		const defaultActionOfType = (type: InboxRuleActionType): MailSet | null => {
			if (type === InboxRuleActionType.MOVE) {
				// set to default folder of Archive
				return assertSystemFolderOfType(folders, MailSetKind.ARCHIVE)
			} else {
				return null
			}
		}

		const renderActionRow = (ruleAction: InboxRuleActionField, actionIndex: number, allActions: InboxRuleActionField[]) => {
			const actionLabel: TranslationKey | null = actionIndex === 0 ? null : "and_label"
			const ruleValueInput = getRuleActionValueInputByType(ruleAction)

			return m(
				"",
				{
					oncreate: (vnode) => oncreateExpandAnimation(vnode.dom as HTMLElement),
					onbeforeremove: (vnode) => onbeforeremoveColapseAnimation(vnode.dom as HTMLElement),
					key: ruleAction.key,
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
								actionLabel ? m(".smaller.lowercase.no-wrap.mr-16.ml-8", lang.getTranslationText(actionLabel)) : null,
								m(DropDownSelectorNew, {
									items: allRuleActions.filter((rule) => rule.value === ruleAction.type() || availableRuleActions.has(rule)),
									selectedValue: ruleAction.type(),
									selectionChangedHandler: (newValue: InboxRuleActionType) => {
										ruleAction.type(newValue)
										ruleAction.valueFolder(defaultActionOfType(newValue))
									},
								}),
							],
						),
						m(".flex", [
							ruleValueInput !== null
								? [m(".mlr-8", ""), ruleValueInput(ruleAction.type() === InboxRuleActionType.LABEL ? targetLabels : targetFolders)]
								: null,
							allActions.length > 1
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
												inboxRuleActions.splice(actionIndex, 1)
											},
										}),
									)
								: null,
						]),
					]),
					ruleAction.type() === InboxRuleActionType.LABEL && ruleAction.valueLabels().length
						? m(
								".flex.wrap.ml-48.mt-16.mr-between-8.row-gap-8",
								ruleAction.valueLabels().map((value) =>
									m(Label, {
										text: prependParentLabelNamesToLabel(value, labels),
										color: value.color ?? theme.primary,
										cancelable: true,
										cancelAction: () => {
											const newValue = ruleAction.valueLabels().filter((label) => !isSameIdTuple(label._id, value._id))
											ruleAction.valueLabels(newValue)
										},
									}),
								),
							)
						: null,
				],
			)
		}

		const renderAddActionRow = (): Children => {
			if (availableRuleActions.size === 0) {
				return null
			}
			return m(
				".flex.items-center.row-gap-8.mt-16",
				{
					oncreate: (vnode) => oncreateExpandAnimation(vnode.dom as HTMLElement),
					onbeforeremove: (vnode) => onbeforeremoveColapseAnimation(vnode.dom as HTMLElement),
				},
				[
					m(".flex.items-center.mr-16.ml-8.smaller", lang.getTranslationText("and_label")),
					m(SecondaryButton, {
						width: "flex",
						icon: Icons.Plus,
						label: "addAction_action",
						onclick: () => {
							const firstAvailable: SelectorItem<InboxRuleActionType> = assertNotNull(availableRuleActions.values().next().value)

							inboxRuleActions.push({
								type: stream(firstAvailable.value),
								valueFolder: stream(defaultActionOfType(firstAvailable.value)),
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
			availableRuleActions = new Set(allRuleActions.filter((rule) => !inboxRuleActions.some((action) => action.type() === rule.value)))

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
				m(".uppercase.b.mt-32.content-fg", lang.getTranslationText("inboxRuleActions_label")),
				inboxRuleActions.map(renderActionRow),
				renderAddActionRow(),
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

		const prepareRule = (validatedName: string, ruleConditions: InboxRuleCondition[], ruleActions: InboxRuleAction[]): ExpandedInboxRule => {
			if (originalInboxRule) {
				const rule = clone(originalInboxRule)
				rule.name = validatedName
				rule.conditions = ruleConditions
				rule.actions = ruleActions
				return rule
			} else {
				return createExpandedInboxRule({
					name: validatedName,
					conditions: ruleConditions,
					actions: ruleActions,
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

			const ruleActions: InboxRuleAction[] = []

			for (const action of inboxRuleActions) {
				if (action.type() === InboxRuleActionType.LABEL) {
					if (action.valueLabels().length === 0) {
						action.valid = false
						if (!alreadyMessaged) {
							Dialog.message("labelMustBeSelected_msg")
							alreadyMessaged = true
						}
					}
					for (const label of action.valueLabels()) {
						const labelId = validateInboxRuleAction(action.type(), label)
						ruleActions.push(createInboxRuleAction({ type: action.type(), value: labelId }))
					}
				} else {
					const valueId = validateInboxRuleAction(action.type(), action.valueFolder())
					ruleActions.push(createInboxRuleAction({ type: action.type(), value: valueId }))
				}
			}

			if (alreadyMessaged) {
				// only return here to give user all the feedback before exiting
				return
			}

			const rule = prepareRule(validatedName, ruleConditions, ruleActions)
			const savePromise = isNewInboxRule ? inboxRuleModel.createInboxRule(rule) : inboxRuleModel.updateInboxRule(rule)

			savePromise
				.then(() => {
					if (applyRule) {
						return applyRuleWithProgress([rule], <ExpandedInboxRuleHandler>mailLocator.inboxRuleHandler())
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
				m(".mlr-8", ""),
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

function getRuleActionValueInputByType(ruleAction: InboxRuleActionField) {
	switch (ruleAction.type()) {
		case InboxRuleActionType.MOVE:
			return (targetFolders: TargetMailSet[]) =>
				m(DropDownSelectorNew, {
					items: targetFolders,
					selectedValue: ruleAction.valueFolder(),
					selectedValueDisplay: getMailSetName(assertNotNull(ruleAction.valueFolder())),
					selectionChangedHandler: ruleAction.valueFolder,
					class: "",
				})
		case InboxRuleActionType.LABEL:
			return (labels: TargetMailSet[]) =>
				m(LabelsDropDownSelector, {
					label: "selectLabel_action",
					items: labels.map((label) => ({
						...label,
						applied: ruleAction.valueLabels().some((l) => isSameId(l._id, label.value._id)),
					})),
					icon: {
						icon: Icons.LabelFilled,
						color: theme.on_surface_variant,
					},
					onLabelsApplied: ruleAction.valueLabels,
					onModalClosed: () => {
						if (ruleAction.valid === false) {
							ruleAction.valid = !!ruleAction.valueLabels().length
						}
					},
					class: ruleAction.valid === false ? "error-text-field" : undefined,
					helpLabel: ruleAction.valid === false ? () => lang.getTranslationText("labelMustBeSelected_msg") : undefined,
				})

		case InboxRuleActionType.EXCLUDE_SPAM:
		case InboxRuleActionType.READ:
			return null
		default:
			throw new ProgrammingError(`No Input specified for rule action of type: ${ruleAction.type()}`)
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

function validateInboxRuleAction(type: InboxRuleActionType, value: MailSet | null): IdTuple | null {
	if (type === InboxRuleActionType.EXCLUDE_SPAM || type === InboxRuleActionType.READ) {
		if (value != null) {
			// throw an error instead of informing user, as the user should not be able to choose a value here
			// if a value is here something else has gone wrong
			throw new ProgrammingError("Boolean InboxRuleActionType has value!")
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
