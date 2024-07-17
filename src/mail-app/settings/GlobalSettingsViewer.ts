import m, { Children } from "mithril"
import { DAY_IN_MILLIS, LazyLoaded, neverNull, noOp, ofClass, promiseMap } from "@tutao/tutanota-utils"
import { InfoLink, lang } from "../../common/misc/LanguageViewModel"
import { getSpamRuleFieldToName, getSpamRuleTypeNameMapping, showAddSpamRuleDialog } from "./AddSpamRuleDialog"
import { getSpamRuleField, GroupType, OperationType, SpamRuleFieldType, SpamRuleType } from "../../common/api/common/TutanotaConstants"
import {
	createEmailSenderListElement,
	Customer,
	CustomerInfo,
	CustomerInfoTypeRef,
	CustomerPropertiesTypeRef,
	CustomerServerProperties,
	CustomerServerPropertiesTypeRef,
	CustomerTypeRef,
	DomainInfo,
	GroupTypeRef,
	RejectedSenderTypeRef,
	UserTypeRef,
} from "../../common/api/entities/sys/TypeRefs.js"
import stream from "mithril/stream"
import { formatDateTime } from "../../common/misc/Formatter"
import { Dialog } from "../../common/gui/base/Dialog"
import { LockedError, PreconditionFailedError } from "../../common/api/common/error/RestError"
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
import { showRejectedSendersInfoDialog } from "./RejectedSendersInfoDialog"
import { showAddDomainWizard } from "./emaildomain/AddDomainWizard"
import { getUserGroupMemberships } from "../../common/api/common/utils/GroupUtils"
import { showNotAvailableForFreeDialog } from "../../common/misc/SubscriptionDialogs"
import { getDomainPart } from "../../common/misc/parsing/MailAddressParser"
import { locator } from "../../common/api/main/CommonLocator"
import { assertMainOrNode } from "../../common/api/common/Env"
import { ButtonSize } from "../../common/gui/base/ButtonSize.js"
import { getCustomMailDomains } from "../../common/api/common/utils/CustomerUtils.js"
import { EntityUpdateData, isUpdateForTypeRef } from "../../common/api/common/utils/EntityUpdateUtils.js"
import { AccountMaintenanceSettings, AccountMaintenanceUpdateNotifier } from "../../common/settings/AccountMaintenanceSettings.js"
import type { UpdatableSettingsViewer } from "../../common/settings/Interfaces.js"
import { ExpandableTable } from "../../common/settings/ExpandableTable.js"

assertMainOrNode()
// Number of days for that we load rejected senders
const REJECTED_SENDERS_TO_LOAD_MS = 5 * DAY_IN_MILLIS
// Max number of rejected sender entries that we display in the ui
const REJECTED_SENDERS_MAX_NUMBER = 100

export class GlobalSettingsViewer implements UpdatableSettingsViewer {
	private readonly props = stream<Readonly<CustomerServerProperties>>()
	private customer: Customer | null = null
	private readonly customerInfo = new LazyLoaded<CustomerInfo>(() => locator.logins.getUserController().loadCustomerInfo())

	private accountMaintenanceUpdateNotifier: AccountMaintenanceUpdateNotifier | null = null

	private spamRuleLines: ReadonlyArray<TableLineAttrs> = []
	private rejectedSenderLines: ReadonlyArray<TableLineAttrs> = []
	private customDomainLines: ReadonlyArray<TableLineAttrs> = []

	/**
	 * caches the current status for the custom email domains
	 * map from domain name to status
	 */
	private readonly domainDnsStatus: Record<string, DomainDnsStatus> = {}
	private readonly customerProperties = new LazyLoaded(() =>
		locator.entityClient
			.load(CustomerTypeRef, neverNull(locator.logins.getUserController().user.customer))
			.then((customer) => locator.entityClient.load(CustomerPropertiesTypeRef, neverNull(customer.properties))),
	)

	constructor() {
		this.customerProperties.getAsync().then(m.redraw)
		this.updateCustomerServerProperties()
		this.view = this.view.bind(this)
		this.updateDomains()
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
				m(AccountMaintenanceSettings, {
					customerServerProperties: this.props,
					setOnUpdateHandler: (fn: AccountMaintenanceUpdateNotifier) => {
						this.accountMaintenanceUpdateNotifier = fn
					},
				}),
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

	private async loadMailboxGroupDataAndCatchAllId(domainInfo: DomainInfo): Promise<{
		available: Array<GroupData>
		selected: GroupData | null
	}> {
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
		this.accountMaintenanceUpdateNotifier?.(updates)

		return promiseMap(updates, (update) => {
			if (isUpdateForTypeRef(CustomerServerPropertiesTypeRef, update) && update.operation === OperationType.UPDATE) {
				return this.updateCustomerServerProperties()
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
