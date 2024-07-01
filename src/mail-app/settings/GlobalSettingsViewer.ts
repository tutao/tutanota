import m, { Children } from "mithril"
import { DAY_IN_MILLIS, LazyLoaded, neverNull, noOp, ofClass, promiseMap } from "@tutao/tutanota-utils"
import { InfoLink, lang } from "../../common/misc/LanguageViewModel"
import { getSpamRuleFieldToName, getSpamRuleTypeNameMapping, showAddSpamRuleDialog } from "./AddSpamRuleDialog"
import { getSpamRuleField, GroupType, OperationType, SpamRuleFieldType, SpamRuleType } from "../../common/api/common/TutanotaConstants"
import {
	AuditLogEntry,
	createSurveyData,
	Customer,
	CustomerInfo,
	CustomerServerProperties,
	DomainInfo,
	GroupInfo,
} from "../../common/api/entities/sys/TypeRefs.js"
import {
	AuditLogEntryTypeRef,
	createEmailSenderListElement,
	CustomerInfoTypeRef,
	CustomerPropertiesTypeRef,
	CustomerServerPropertiesTypeRef,
	CustomerTypeRef,
	GroupInfoTypeRef,
	GroupTypeRef,
	RejectedSenderTypeRef,
	UserTypeRef,
} from "../../common/api/entities/sys/TypeRefs.js"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import { formatDateTime, formatDateTimeFromYesterdayOn } from "../../common/misc/Formatter"
import { Dialog } from "../../common/gui/base/Dialog"
import { LockedError, NotAuthorizedError, PreconditionFailedError } from "../../common/api/common/error/RestError"
import { GroupData, loadEnabledTeamMailGroups, loadEnabledUserMailGroups, loadGroupDisplayName } from "./LoadingUtils"
import { Icons } from "../../common/gui/base/icons/Icons"
import { showProgressDialog } from "../../common/gui/dialogs/ProgressDialog"
import type { TableAttrs, TableLineAttrs } from "../../common/gui/base/Table.js"
import { ColumnWidth, createRowActions } from "../../common/gui/base/Table.js"
import { attachDropdown, createDropdown, DropdownChildAttrs } from "../../common/gui/base/Dropdown.js"
import { DomainDnsStatus } from "./DomainDnsStatus"
import { showDnsCheckDialog } from "./CheckDomainDnsStatusDialog"
import { BootIcons } from "../../common/gui/base/icons/BootIcons"
import {
	GENERATED_MAX_ID,
	generatedIdToTimestamp,
	getElementId,
	sortCompareByReverseId,
	timestampToGeneratedId,
} from "../../common/api/common/utils/EntityUtils"
import { ExpandableTable } from "./ExpandableTable"
import { showRejectedSendersInfoDialog } from "./RejectedSendersInfoDialog"
import { showAddDomainWizard } from "./emaildomain/AddDomainWizard"
import { getUserGroupMemberships } from "../../common/api/common/utils/GroupUtils"
import { showNotAvailableForFreeDialog } from "../../common/misc/SubscriptionDialogs"
import { getDomainPart } from "../../common/misc/parsing/MailAddressParser"
import type { UpdatableSettingsViewer } from "./SettingsView"
import { locator } from "../../common/api/main/MainLocator"
import { assertMainOrNode } from "../../common/api/common/Env"
import { DropDownSelector } from "../../common/gui/base/DropDownSelector.js"
import { ButtonSize } from "../../common/gui/base/ButtonSize.js"
import { SettingsExpander } from "./SettingsExpander.js"
import { showDeleteAccountDialog } from "../../common/subscription/DeleteAccountDialog.js"
import { getCustomMailDomains } from "../../common/api/common/utils/CustomerUtils.js"
import { EntityUpdateData, isUpdateForTypeRef } from "../../common/api/common/utils/EntityUpdateUtils.js"
import { LoginButton } from "../../common/gui/base/buttons/LoginButton.js"
import { showLeavingUserSurveyWizard } from "../../common/subscription/LeavingUserSurveyWizard.js"
import { SURVEY_VERSION_NUMBER } from "../../common/subscription/LeavingUserSurveyConstants.js"

assertMainOrNode()
// Number of days for that we load rejected senders
const REJECTED_SENDERS_TO_LOAD_MS = 5 * DAY_IN_MILLIS
// Max number of rejected sender entries that we display in the ui
const REJECTED_SENDERS_MAX_NUMBER = 100

export class GlobalSettingsViewer implements UpdatableSettingsViewer {
	private readonly props = stream<Readonly<CustomerServerProperties>>()
	private customer: Customer | null = null
	private readonly customerInfo = new LazyLoaded<CustomerInfo>(() => locator.logins.getUserController().loadCustomerInfo())

	private spamRuleLines: ReadonlyArray<TableLineAttrs> = []
	private rejectedSenderLines: ReadonlyArray<TableLineAttrs> = []
	private customDomainLines: ReadonlyArray<TableLineAttrs> = []
	private auditLogLines: ReadonlyArray<TableLineAttrs> = []
	private auditLogLoaded = false

	/**
	 * caches the current status for the custom email domains
	 * map from domain name to status
	 */
	private readonly domainDnsStatus: Record<string, DomainDnsStatus> = {}

	private requirePasswordUpdateAfterReset = false
	private saveIpAddress = false
	private readonly usageDataExpanded = stream(false)
	private readonly deleteAccountExpanded = stream(false)
	private readonly customerProperties = new LazyLoaded(() =>
		locator.entityClient
			.load(CustomerTypeRef, neverNull(locator.logins.getUserController().user.customer))
			.then((customer) => locator.entityClient.load(CustomerPropertiesTypeRef, neverNull(customer.properties))),
	)

	constructor() {
		this.props.map((props) => {
			this.requirePasswordUpdateAfterReset = props.requirePasswordUpdateAfterReset
			this.saveIpAddress = props.saveEncryptedIpAddressInSession
		})

		this.customerProperties.getAsync().then(m.redraw)

		this.view = this.view.bind(this)

		this.updateDomains()
		this.updateCustomerServerProperties()
		this.updateAuditLog()
	}

	view(): Children {
		const spamRuleTableAttrs: TableAttrs = {
			columnHeading: ["emailSender_label", "emailSenderRule_label"],
			columnWidths: [ColumnWidth.Largest, ColumnWidth.Small],
			showActionButtonColumn: true,
			addButtonAttrs: {
				title: "addSpamRule_action",
				click: () => showAddSpamRuleDialog(null),
				icon: Icons.Add,
				size: ButtonSize.Compact,
			},
			lines: this.spamRuleLines,
		}
		const rejectedSenderTableAttrs: TableAttrs = {
			columnHeading: ["emailSender_label"],
			columnWidths: [ColumnWidth.Largest],
			showActionButtonColumn: true,
			addButtonAttrs: {
				title: "refresh_action",
				click: () => {
					this.updateRejectedSenderTable()
				},
				icon: BootIcons.Progress,
				size: ButtonSize.Compact,
			},
			lines: this.rejectedSenderLines,
		}
		const customDomainTableAttrs: TableAttrs = {
			columnHeading: ["adminCustomDomain_label", "catchAllMailbox_label"],
			columnWidths: [ColumnWidth.Largest, ColumnWidth.Small],
			showActionButtonColumn: true,
			addButtonAttrs: {
				title: "addCustomDomain_action",
				click: async () => {
					const customerInfo = await this.customerInfo.getAsync()
					if (locator.logins.getUserController().isFreeAccount()) {
						showNotAvailableForFreeDialog()
					} else {
						const mailAddressTableModel = await locator.mailAddressTableModelForOwnMailbox()
						await showAddDomainWizard("", customerInfo, mailAddressTableModel)
						this.updateDomains()
					}
				},
				icon: Icons.Add,
				size: ButtonSize.Compact,
			},
			lines: this.customDomainLines,
		}
		const auditLogTableAttrs: TableAttrs = {
			columnHeading: ["action_label", "modified_label", "time_label"],
			columnWidths: [ColumnWidth.Largest, ColumnWidth.Largest, ColumnWidth.Small],
			showActionButtonColumn: true,
			lines: this.auditLogLines,
			addButtonAttrs: {
				title: "refresh_action",
				click: () => showProgressDialog("loading_msg", this.updateAuditLog()).then(() => m.redraw()),
				icon: BootIcons.Progress,
				size: ButtonSize.Compact,
			},
		}
		return [
			m("#global-settings.fill-absolute.scroll.plr-l", [
				m(ExpandableTable, {
					title: "adminSpam_action",
					table: spamRuleTableAttrs,
					infoMsg: "adminSpamRuleInfo_msg",
					infoLinkId: InfoLink.SpamRules,
				}),
				m(ExpandableTable, {
					title: "rejectedEmails_label",
					table: rejectedSenderTableAttrs,
					infoMsg: "rejectedSenderListInfo_msg",
					onExpand: () => this.updateRejectedSenderTable(),
				}),
				m(ExpandableTable, {
					title: "customEmailDomains_label",
					table: customDomainTableAttrs,
					infoMsg: "moreInfo_msg",
					infoLinkId: InfoLink.DomainInfo,
				}),
				m(".mt-l", [
					m(".h4", lang.get("security_title")),
					m(DropDownSelector, {
						label: "saveEncryptedIpAddress_title",
						helpLabel: () => lang.get("saveEncryptedIpAddress_label"),
						selectedValue: this.saveIpAddress,
						selectionChangedHandler: (value) => {
							const newProps = Object.assign({}, this.props(), {
								saveEncryptedIpAddressInSession: value,
							})
							locator.entityClient.update(newProps)
						},
						items: [
							{
								name: lang.get("yes_label"),
								value: true,
							},
							{
								name: lang.get("no_label"),
								value: false,
							},
						],
						dropdownWidth: 250,
					}),
					locator.logins.getUserController().isGlobalAdmin()
						? m("", [
								locator.logins.getUserController().isPremiumAccount()
									? m(DropDownSelector, {
											label: "enforcePasswordUpdate_title",
											helpLabel: () => lang.get("enforcePasswordUpdate_msg"),
											selectedValue: this.requirePasswordUpdateAfterReset,
											selectionChangedHandler: (value) => {
												const newProps: CustomerServerProperties = Object.assign({}, this.props(), {
													requirePasswordUpdateAfterReset: value,
												})
												locator.entityClient.update(newProps)
											},
											items: [
												{
													name: lang.get("yes_label"),
													value: true,
												},
												{
													name: lang.get("no_label"),
													value: false,
												},
											],
											dropdownWidth: 250,
									  })
									: null,
								this.customer
									? m(
											".mt-l",
											m(ExpandableTable, {
												title: "auditLog_title",
												table: auditLogTableAttrs,
												infoMsg: "auditLogInfo_msg",
												onExpand: () => {
													// if the user did not load this when the view was created (i.e. due to a lost connection), attempt to reload it
													if (!this.auditLogLoaded) {
														showProgressDialog("loading_msg", this.updateAuditLog()).then(() => m.redraw())
													}
												},
											}),
									  )
									: null,
						  ])
						: null,
				]),
				locator.logins.getUserController().isPremiumAccount()
					? m(
							SettingsExpander,
							{
								title: "usageData_label",
								expanded: this.usageDataExpanded,
							},
							this.customerProperties.isLoaded()
								? m(DropDownSelector, {
										label: "customerUsageDataOptOut_label",
										items: [
											{
												name: lang.get("customerUsageDataGloballyDeactivated_label"),
												value: true,
											},
											{
												name: lang.get("customerUsageDataGloballyPossible_label"),
												value: false,
											},
										],
										selectedValue: this.customerProperties.getSync()!.usageDataOptedOut,
										selectionChangedHandler: (v) => {
											if (this.customerProperties.isLoaded()) {
												const customerProps = this.customerProperties.getSync()!
												customerProps.usageDataOptedOut = v as boolean
												locator.entityClient.update(customerProps)
											}
										},
										dropdownWidth: 250,
								  })
								: null,
					  )
					: null,
				m(
					".mb-l",
					m(
						SettingsExpander,
						{
							title: "adminDeleteAccount_action",
							buttonText: "adminDeleteAccount_action",
							expanded: this.deleteAccountExpanded,
						},
						m(
							".flex-center",
							m(
								"",
								{
									style: {
										width: "200px",
									},
								},
								m(LoginButton, {
									label: "adminDeleteAccount_action",
									onclick: () => {
										const isPremium = locator.logins.getUserController().isPremiumAccount()
										showLeavingUserSurveyWizard(isPremium, false).then((reason) => {
											if (reason.submitted && reason.category && reason.reason) {
												const surveyData = createSurveyData({
													category: reason.category,
													details: reason.details,
													reason: reason.reason,
													version: SURVEY_VERSION_NUMBER,
												})
												showDeleteAccountDialog(surveyData)
											} else {
												showDeleteAccountDialog()
											}
										})
									},
								}),
							),
						),
					),
				),
			]),
		]
	}

	private updateCustomerServerProperties(): Promise<void> {
		return locator.customerFacade.loadCustomerServerProperties().then((props) => {
			this.props(props)

			const fieldToName = getSpamRuleFieldToName()

			this.spamRuleLines = props.emailSenderList.map((rule, index) => {
				return {
					cells: () => [
						{
							main: fieldToName[getSpamRuleField(rule)],
							info: [rule.value],
						},
						{
							main: neverNull(getSpamRuleTypeNameMapping().find((t) => t.value === rule.type)).name,
						},
					],
					actionButtonAttrs: createRowActions(
						{
							getArray: () => props.emailSenderList,
							updateInstance: () => locator.entityClient.update(props).catch(ofClass(LockedError, noOp)),
						},
						rule,
						index,
						[
							{
								label: "edit_action",
								click: () => showAddSpamRuleDialog(rule),
							},
						],
					),
				}
			})

			m.redraw()
		})
	}

	private updateRejectedSenderTable(): void {
		const customer = this.customer

		if (customer && customer.rejectedSenders) {
			// Rejected senders are written with TTL for seven days.
			// We have to avoid that we load too many (already deleted) rejected senders form the past.
			// First we load REJECTED_SENDERS_MAX_NUMBER items starting from the past timestamp into the future. If there are
			// more entries available we can safely load REJECTED_SENDERS_MAX_NUMBER from GENERATED_MAX_ID in reverse order.
			// Otherwise we will just use what has been returned in the first request.
			const senderListId = customer.rejectedSenders.items
			const startId = timestampToGeneratedId(Date.now() - REJECTED_SENDERS_TO_LOAD_MS)
			const loadingPromise = locator.entityClient
				.loadRange(RejectedSenderTypeRef, senderListId, startId, REJECTED_SENDERS_MAX_NUMBER, false)
				.then((rejectedSenders) => {
					if (REJECTED_SENDERS_MAX_NUMBER === rejectedSenders.length) {
						// There are more entries available, we need to load from GENERATED_MAX_ID.
						// we don't need to sort here because we load in reverse direction
						return locator.entityClient.loadRange(RejectedSenderTypeRef, senderListId, GENERATED_MAX_ID, REJECTED_SENDERS_MAX_NUMBER, true)
					} else {
						// ensure that rejected senders are sorted in descending order
						return rejectedSenders.sort(sortCompareByReverseId)
					}
				})
				.then((rejectedSenders) => {
					this.rejectedSenderLines = rejectedSenders.map((rejectedSender) => {
						const rejectDate = formatDateTime(new Date(generatedIdToTimestamp(getElementId(rejectedSender))))
						return {
							cells: () => {
								return [
									{
										main: rejectedSender.senderMailAddress,
										info: [`${rejectDate}, ${rejectedSender.senderHostname} (${rejectedSender.senderIp})`],
										click: () => showRejectedSendersInfoDialog(rejectedSender),
									},
								]
							},
							actionButtonAttrs: attachDropdown({
								mainButtonAttrs: {
									title: "showMore_action",
									icon: Icons.More,
									size: ButtonSize.Compact,
								},
								childAttrs: () => [
									{
										label: "showRejectReason_action",
										click: () => showRejectedSendersInfoDialog(rejectedSender),
									},
									{
										label: "addSpamRule_action",
										click: () => {
											const domainPart = getDomainPart(rejectedSender.senderMailAddress)
											showAddSpamRuleDialog(
												createEmailSenderListElement({
													value: domainPart ? domainPart : "",
													type: SpamRuleType.WHITELIST,
													field: SpamRuleFieldType.FROM,
													hashedValue: "",
												}),
											)
										},
									},
								],
							}),
						}
					})
				})
			showProgressDialog("loading_msg", loadingPromise).then(() => m.redraw())
		}
	}

	private updateAuditLog(): Promise<void> {
		return locator.logins
			.getUserController()
			.loadCustomer()
			.then((customer) => {
				this.customer = customer

				return locator.entityClient
					.loadRange(AuditLogEntryTypeRef, neverNull(customer.auditLog).items, GENERATED_MAX_ID, 200, true)
					.then((auditLog) => {
						this.auditLogLoaded = true // indicate that we do not need to reload the list again when we expand
						this.auditLogLines = auditLog.map((auditLogEntry) => {
							return {
								cells: [auditLogEntry.action, auditLogEntry.modifiedEntity, formatDateTimeFromYesterdayOn(auditLogEntry.date)],
								actionButtonAttrs: {
									title: "showMore_action",
									icon: Icons.More,
									click: () => this.showAuditLogDetails(auditLogEntry, customer),
									size: ButtonSize.Compact,
								},
							}
						})
					})
			})
	}

	private showAuditLogDetails(entry: AuditLogEntry, customer: Customer) {
		let modifiedGroupInfo: Stream<GroupInfo> = stream()
		let groupInfo = stream<GroupInfo>()
		let groupInfoLoadingPromises: Promise<unknown>[] = []

		if (entry.modifiedGroupInfo) {
			groupInfoLoadingPromises.push(
				locator.entityClient
					.load(GroupInfoTypeRef, entry.modifiedGroupInfo)
					.then((gi) => {
						modifiedGroupInfo(gi)
					})
					.catch(
						ofClass(NotAuthorizedError, () => {
							// If the admin is removed from the free group, he does not have the permission to access the groupinfo of that group anymore
						}),
					),
			)
		}

		if (entry.groupInfo) {
			groupInfoLoadingPromises.push(
				locator.entityClient
					.load(GroupInfoTypeRef, entry.groupInfo)
					.then((gi) => {
						groupInfo(gi)
					})
					.catch(
						ofClass(NotAuthorizedError, () => {
							// If the admin is removed from the free group, he does not have the permission to access the groupinfo of that group anymore
						}),
					),
			)
		}

		Promise.all(groupInfoLoadingPromises).then(() => {
			const groupInfoValue = groupInfo()
			let dialog = Dialog.showActionDialog({
				title: lang.get("auditLog_title"),
				child: {
					view: () =>
						m("table.pt", [
							m("tr", [m("td", lang.get("action_label")), m("td.pl", entry.action)]),
							m("tr", [m("td", lang.get("actor_label")), m("td.pl", entry.actorMailAddress)]),
							m("tr", [m("td", lang.get("IpAddress_label")), m("td.pl", entry.actorIpAddress ? entry.actorIpAddress : "")]),
							m("tr", [
								m("td", lang.get("modified_label")),
								m(
									"td.pl",
									modifiedGroupInfo() && this.getGroupInfoDisplayText(modifiedGroupInfo())
										? this.getGroupInfoDisplayText(modifiedGroupInfo())
										: entry.modifiedEntity,
								),
							]),
							groupInfoValue
								? m("tr", [
										m("td", lang.get("group_label")),
										m(
											"td.pl",
											customer.adminGroup === groupInfoValue.group
												? lang.get("globalAdmin_label")
												: this.getGroupInfoDisplayText(groupInfoValue),
										),
								  ])
								: null,
							m("tr", [m("td", lang.get("time_label")), m("td.pl", formatDateTime(entry.date))]),
						]),
				},
				allowOkWithReturn: true,
				okAction: () => dialog.close(),
				allowCancel: false,
			})
		})
	}

	private getGroupInfoDisplayText(groupInfo: GroupInfo): string {
		if (groupInfo.name && groupInfo.mailAddress) {
			return groupInfo.name + " <" + groupInfo.mailAddress + ">"
		} else if (groupInfo.mailAddress) {
			return groupInfo.mailAddress
		} else {
			return groupInfo.name
		}
	}

	private async updateDomains(): Promise<void> {
		const customerInfo = await this.customerInfo.getAsync()
		let customDomainInfos = getCustomMailDomains(customerInfo)
		// remove dns status instances for all removed domains
		for (const domain of Object.keys(this.domainDnsStatus)) {
			if (!customDomainInfos.some((di) => di.domain === domain)) {
				delete this.domainDnsStatus[domain]
			}
		}
		return promiseMap(customDomainInfos, (domainInfo) => {
			// create dns status instances for all new domains
			if (!this.domainDnsStatus[domainInfo.domain]) {
				this.domainDnsStatus[domainInfo.domain] = new DomainDnsStatus(domainInfo.domain)

				this.domainDnsStatus[domainInfo.domain].loadCurrentStatus().then(() => {
					m.redraw()
				})
			}

			let domainDnsStatus = this.domainDnsStatus[domainInfo.domain]
			let p = Promise.resolve(lang.get("comboBoxSelectionNone_msg"))

			if (domainInfo.catchAllMailGroup) {
				p = loadGroupDisplayName(domainInfo.catchAllMailGroup)
			}

			return p.then((catchAllGroupName) => {
				return {
					cells: () => [
						{
							main: domainInfo.domain,
							info: [domainDnsStatus.getDnsStatusInfo()],
							click:
								domainDnsStatus.status.isLoaded() && !domainDnsStatus.areAllRecordsFine()
									? () => {
											showDnsCheckDialog(domainDnsStatus)
									  }
									: noOp,
						},
						{
							main: catchAllGroupName,
						},
					],
					actionButtonAttrs: {
						title: "action_label" as const,
						icon: Icons.More,
						size: ButtonSize.Compact,
						click: createDropdown({
							lazyButtons: () => {
								const buttons: DropdownChildAttrs[] = [
									{
										label: "setCatchAllMailbox_action",
										click: () => this.editCatchAllMailbox(domainInfo),
									},
									{
										label: "delete_action",
										click: () => this.deleteCustomDomain(domainInfo),
									},
								]

								if (domainDnsStatus.status.isLoaded() && !domainDnsStatus.areAllRecordsFine()) {
									buttons.unshift({
										label: "resumeSetup_label",
										click: () => this.onResumeSetup(domainDnsStatus, customerInfo),
									})
								}
								return buttons
							},
							width: 260,
						}),
					},
				}
			})
		}).then((tableLines) => {
			this.customDomainLines = tableLines

			m.redraw()
		})
	}

	private async onResumeSetup(domainDnsStatus: DomainDnsStatus, customerInfo: any) {
		// Assuming user mailbox for now
		const mailAddressTableModel = await locator.mailAddressTableModelForOwnMailbox()
		showAddDomainWizard(domainDnsStatus.domain, customerInfo, mailAddressTableModel).then(() => {
			domainDnsStatus.loadCurrentStatus().then(() => m.redraw())
		})
	}

	private async editCatchAllMailbox(domainInfo: DomainInfo) {
		const groupDatas = await showProgressDialog("pleaseWait_msg", this.loadMailboxGroupDataAndCatchAllId(domainInfo))
		const initialValue = groupDatas.selected?.groupId ?? null
		const selectedMailGroupId = await Dialog.showDropDownSelectionDialog(
			"setCatchAllMailbox_action",
			"catchAllMailbox_label",
			null,
			[
				{
					name: lang.get("comboBoxSelectionNone_msg"),
					value: null,
				},
				...groupDatas.available.map((groupData) => {
					return {
						name: groupData.displayName,
						value: groupData.groupId,
					}
				}),
			],
			initialValue,
			250,
		)
		return locator.customerFacade.setCatchAllGroup(domainInfo.domain, selectedMailGroupId)
	}

	private async loadMailboxGroupDataAndCatchAllId(domainInfo: DomainInfo): Promise<{ available: Array<GroupData>; selected: GroupData | null }> {
		const customer = await locator.logins.getUserController().loadCustomer()
		const teamMailGroups = await loadEnabledTeamMailGroups(customer)
		const userMailGroups = await loadEnabledUserMailGroups(customer)
		const allMailGroups = teamMailGroups.concat(userMailGroups)
		let catchAllMailGroupId: Id | null = null
		if (domainInfo.catchAllMailGroup) {
			const catchAllGroup = await locator.entityClient.load(GroupTypeRef, domainInfo.catchAllMailGroup)
			if (catchAllGroup.type === GroupType.User) {
				// the catch all group may be a user group, so load the mail group in that case
				const user = await locator.entityClient.load(UserTypeRef, neverNull(catchAllGroup.user))
				catchAllMailGroupId = getUserGroupMemberships(user, GroupType.Mail)[0].group // the first is the users personal mail group
			} else {
				catchAllMailGroupId = domainInfo.catchAllMailGroup
			}
		}

		return {
			available: allMailGroups,
			selected: allMailGroups.find((g) => g.groupId === catchAllMailGroupId) ?? null,
		}
	}

	private deleteCustomDomain(domainInfo: DomainInfo) {
		Dialog.confirm(() =>
			lang.get("confirmCustomDomainDeletion_msg", {
				"{domain}": domainInfo.domain,
			}),
		).then((confirmed) => {
			if (confirmed) {
				locator.customerFacade
					.removeDomain(domainInfo.domain)
					.catch(
						ofClass(PreconditionFailedError, () => {
							let registrationDomains =
								this.props() != null ? this.props().whitelabelRegistrationDomains.map((domainWrapper) => domainWrapper.value) : []

							if (registrationDomains.indexOf(domainInfo.domain) !== -1) {
								Dialog.message(() =>
									lang.get("customDomainDeletePreconditionWhitelabelFailed_msg", {
										"{domainName}": domainInfo.domain,
									}),
								)
							} else {
								Dialog.message(() =>
									lang.get("customDomainDeletePreconditionFailed_msg", {
										"{domainName}": domainInfo.domain,
									}),
								)
							}
						}),
					)
					.catch(ofClass(LockedError, () => Dialog.message("operationStillActive_msg")))
			}
		})
	}

	entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		return promiseMap(updates, (update) => {
			if (isUpdateForTypeRef(CustomerServerPropertiesTypeRef, update) && update.operation === OperationType.UPDATE) {
				return this.updateCustomerServerProperties()
			} else if (isUpdateForTypeRef(AuditLogEntryTypeRef, update)) {
				return this.updateAuditLog()
			} else if (isUpdateForTypeRef(CustomerInfoTypeRef, update) && update.operation === OperationType.UPDATE) {
				this.customerInfo.reset()

				return this.updateDomains()
			} else if (isUpdateForTypeRef(CustomerPropertiesTypeRef, update)) {
				this.customerProperties.reset()
				this.customerProperties.getAsync().then(m.redraw)
			}
		}).then(noOp)
	}
}
