import m from "mithril"
import { Dialog, DialogType } from "../../../ui/base/Dialog"
import { lang, TranslationKey } from "../../../ui/utils/LanguageViewModel"
import { assertMainOrNode, ProgrammingError, UpgradePromptType } from "../../../platform-kit/app-env"
import { isDomainName, isMailAddress, isRegularExpression } from "../../../platform-kit/utils/FormatUtils"
import { getInboxRuleResultTypeNameMapping, getInboxRuleTypeNameMapping } from "../mail/model/InboxRuleHandler"
import { elementIdPart, isSameId } from "../../../platform-kit/meta"
import type { MailboxDetail } from "../../common/mailFunctionality/MailboxModel.js"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import { Autocapitalize } from "../../../ui/base/LegacyTextField.js"
import { isOfflineError, LockedError } from "../../../platform-kit/rest-client/error"
import { showNotAvailableForFreeDialog } from "../../common/misc/SubscriptionDialogs"
import { locator } from "../../common/api/main/CommonLocator"
import { mailLocator } from "../mailLocator.js"
import { assertSystemFolderOfType, getExistingRuleForType, getFolderName, getIndentedFolderNameForDropdown } from "../mail/model/MailUtils.js"
import type { IndentedFolder } from "../../common/api/common/mail/FolderSystem.js"
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
import { assertNotNull } from "@tutao/utils"
import { showProgressDialog } from "../../../ui/dialogs/ProgressDialog"
import { ButtonType } from "../../../ui/base/Button"

assertMainOrNode()

export type InboxRuleTemplate = Pick<ExpandedInboxRule, "conditions" | "results"> & {
	_id?: ExpandedInboxRule["_id"]
	conditions?: Pick<InboxRuleCondition, "type" | "value">[]
	results?: Pick<InboxRuleResult, "type" | "value">[]
}

interface InboxRuleConditionField {
	type: Stream<InboxRuleConditionType>
	value: Stream<string>
}

interface InboxRuleResultField {
	type: Stream<InboxRuleResultType>
	value: Stream<MailSet | null>
}

interface MoveTargetFolder {
	name: string
	value: MailSet
}

export async function show(mailBoxDetail: MailboxDetail, ruleOrTemplate: InboxRuleTemplate) {
	if (locator.logins.getUserController().isFreeAccount()) {
		showNotAvailableForFreeDialog(UpgradePromptType.INBOX_RULES)
	} else if (mailBoxDetail) {
		const folders = await mailLocator.mailModel.getMailboxFoldersForId(mailBoxDetail.mailbox.mailSets._id)
		const targetFolders: MoveTargetFolder[] = folders.getIndentedList().map((folderInfo: IndentedFolder) => {
			return {
				name: getIndentedFolderNameForDropdown(folderInfo),
				value: folderInfo.folder,
			}
		})

		const inboxRuleConditions: InboxRuleConditionField[] = ruleOrTemplate.conditions.map((condition) => {
			return { type: stream(condition.type as InboxRuleConditionType), value: stream(condition.value) }
		})

		const inboxRuleResults: InboxRuleResultField[] = ruleOrTemplate.results.map((result) => {
			let value = result.value == null ? null : folders.getFolderById(elementIdPart(result.value))
			return { type: stream(result.type as InboxRuleResultType), value: stream(value) }
		})

		if (inboxRuleResults.length === 0) {
			// If there are no results yet, add the default value of Move to Archive
			inboxRuleResults.push({ type: stream(InboxRuleResultType.MOVE), value: stream(assertSystemFolderOfType(folders, MailSetKind.ARCHIVE)) })
		}

		const renderConditionRow = (condition: InboxRuleConditionField, conditionIndex: number) => {
			const isFirstCondition = conditionIndex === 0
			const conditionLabel: TranslationKey = isFirstCondition ? "when_label" : "and_label"

			return m(".inbox-rule-wrapping-row.items-center.row-gap-8.mt-16", [
				m(".flex.items-center", [
					m(`.smaller.no-wrap.mr-16 ${isFirstCondition ? ".capitalize" : ".lowercase"}`, lang.getTranslationText(conditionLabel)),
					m(DropDownSelectorNew, {
						items: getInboxRuleTypeNameMapping(),
						selectedValue: condition.type(),
						selectionChangedHandler: condition.type,
					}),
				]),
				m(".flex.items-center", [
					m(".mlr-16", "="),
					getRuleConditionValueInputByType(condition),
					!isFirstCondition
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
				]),
			])
		}

		const renderResultRow = (ruleResult: InboxRuleResultField, resultIndex: number) => {
			const isFirstResult = resultIndex === 0
			const resultLabel: TranslationKey = isFirstResult ? "then_label" : "and_label"
			const ruleValueInput = getRuleResultValueInputByType(ruleResult)

			return m(".inbox-rule-wrapping-row.items-center.row-gap-8.mt-16", [
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
							items: getInboxRuleResultTypeNameMapping(),
							selectedValue: ruleResult.type(),
							selectionChangedHandler: (newValue: InboxRuleResultType) => {
								ruleResult.type(newValue)
								if (newValue === InboxRuleResultType.MOVE) {
									// set to default folder of Archive
									ruleResult.value(assertSystemFolderOfType(folders, MailSetKind.ARCHIVE))
								} else {
									ruleResult.value(null)
								}
							},
						}),
					],
				),
				ruleValueInput !== null
					? m(".flex.items-center", [
							m(".mlr-16", "="),
							ruleValueInput(targetFolders),
							!isFirstResult
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
						])
					: null,
			])
		}

		const form = () => {
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
				m(".uppercase.b.mt-32.content-fg", lang.getTranslationText("condition_label")),
				inboxRuleConditions.map(renderConditionRow),
				m(".uppercase.b.mt-32.content-fg", lang.getTranslationText("searchResult_label")),
				inboxRuleResults.map(renderResultRow),
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

		const applyRule = async (rule: ExpandedInboxRule, progress: Stream<number>, abort: AbortController) => {
			// FIXME: Adapting this applyRule is the focus of another issue
			throw new ProgrammingError("Not properly using ExpandedInboxRules!")

			// const inbox = assertSystemFolderOfType(folders, MailSetKind.INBOX)
			// const targetFolder = folders.getFolderById(elementIdPart(rule.targetFolder))
			// if (targetFolder == null || targetFolder.folderType === MailSetKind.INBOX) {
			// 	return
			// }
			//
			// let totalProcessed = 0
			// let totalMoved = 0
			//
			// try {
			// 	const allIds = (await mailLocator.entityClient.loadAll(MailSetEntryTypeRef, inbox.entries)).reverse()
			// 	const chunked = splitInChunks(MAX_NBR_OF_MAILS_SYNC_OPERATION, allIds)
			//
			// 	for (const chunk of chunked) {
			// 		if (abort.signal.aborted) {
			// 			break
			// 		}
			//
			// 		const loadedMails = await resolveMailSetEntries(
			// 			chunk,
			// 			(list, elements) => mailLocator.entityClient.loadMultiple(MailTypeRef, list, elements),
			// 			mailLocator.mailModel,
			// 		)
			//
			// 		const mailsToMove: IdTuple[] = []
			//
			// 		await promiseMap(loadedMails, async (loadedMail) => {
			// 			if (loadedMail.mail.mailDetails == null) {
			// 				// inbox rules do not work on drafts
			// 				return
			// 			}
			//
			// 			const mailMatchesRule = await checkInboxRule(locator.mailFacade, loadedMail.mail, rule)
			// 			if (mailMatchesRule) {
			// 				mailsToMove.push(loadedMail.mail._id)
			// 			}
			// 		})
			//
			// 		await mailLocator.mailModel.moveMails(mailsToMove, targetFolder, MoveMode.Mails)
			// 		totalMoved += mailsToMove.length
			//
			// 		totalProcessed += chunk.length
			// 		progress((totalProcessed / allIds.length) * 100)
			// 	}
			// } catch (e) {
			// 	if (!isOfflineError(e)) {
			// 		throw e
			// 	}
			// }
		}

		const applyRuleWithProgress = async (rule: ExpandedInboxRule) => {
			const progress = stream(0)
			const abort = new AbortController()
			await showProgressDialog("pleaseWait_msg", applyRule(rule, progress, abort), progress, {
				middle: "applyingInboxRules_label",
				left: () => {
					return [
						{
							label: "cancel_action",
							click: () => {
								abort.abort()

								// set progress to 100 so it doesn't look "stuck" even if it might take a few seconds to finish
								progress(100)
							},
							type: ButtonType.Secondary,
						} as const,
					]
				},
			})
		}

		const inboxRuleOkAction = (dialog: Dialog, applyRule: boolean) => {
			const ruleConditions = []

			for (const condition of inboxRuleConditions) {
				const invalidInboxRuleMsg = validateInboxRuleCondition(condition.type(), condition.value(), ruleOrTemplate._id)
				if (invalidInboxRuleMsg !== null) {
					Dialog.message(invalidInboxRuleMsg)
					return
				}
				ruleConditions.push(createInboxRuleCondition({ type: condition.type(), value: condition.value() }))
			}

			const ruleResults = []

			for (const result of inboxRuleResults) {
				const value = validateInboxRuleResult(result.type(), result.value())

				ruleResults.push(createInboxRuleResult({ type: result.type(), value }))
			}

			const rule = createExpandedInboxRule({
				name: "FIXME: get me a name",
				conditions: ruleConditions,
				results: ruleResults,
			})

			const props = locator.logins.getUserController().props
			const inboxRules = props.inboxRules
			const ruleId = ruleOrTemplate._id
			if (ruleId) {
				rule._id = ruleId
			}

			const expandedInboxRules = props.expandedInboxRules

			props.expandedInboxRules =
				ruleId == null ? [...expandedInboxRules, rule] : expandedInboxRules.map((inboxRule) => (isSameId(inboxRule._id, ruleId) ? rule : inboxRule))

			locator.entityClient
				.update(props)
				.then(() => {
					if (applyRule) {
						return applyRuleWithProgress(rule)
					}
				})
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

		const isNewInboxRule = ruleOrTemplate._id == null
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
					selectedValueDisplay: getFolderName(assertNotNull(ruleResult.value())),
					selectionChangedHandler: ruleResult.value,
					class: "",
				})
		case InboxRuleResultType.EXCLUDE_SPAM:
			return null
		default:
			throw new ProgrammingError(`No Input specified for rule result of type: ${ruleResult.type()}`)
	}
}

export function createInboxRuleTemplate(ruleType: InboxRuleConditionType | null, value: string): InboxRuleTemplate {
	const type = ruleType ?? InboxRuleConditionType.FROM_EQUALS
	return {
		conditions: [
			createInboxRuleCondition({
				type,
				value: getCleanedValue(type, value),
			}),
		],
		results: [],
	}
}

function validateInboxRuleCondition(type: InboxRuleConditionType, value: string, ruleId: Id | undefined): TranslationKey | null {
	let currentCleanedValue = getCleanedValue(type, value)

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
		let existingRule = getExistingRuleForType(locator.logins.getUserController().props, currentCleanedValue, type)

		if (existingRule && (!ruleId || (ruleId && !isSameId(existingRule._id, ruleId)))) {
			return "inboxRuleAlreadyExists_msg"
		}
	}

	return null
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
