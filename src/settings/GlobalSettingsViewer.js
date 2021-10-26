// @flow
import m from "mithril"
import {DAY_IN_MILLIS, LazyLoaded, neverNull, noOp, ofClass, promiseMap} from "@tutao/tutanota-utils"
import {lang} from "../misc/LanguageViewModel"
import {load, loadRange, update} from "../api/main/Entity"
import {getSpamRuleFieldToName, getSpamRuleTypeNameMapping, showAddSpamRuleDialog} from "./AddSpamRuleDialog"
import {getSpamRuleField, GroupType, OperationType, SpamRuleFieldType, SpamRuleType} from "../api/common/TutanotaConstants"
import {getCustomMailDomains} from "../api/common/utils/Utils"
import type {CustomerServerProperties} from "../api/entities/sys/CustomerServerProperties"
import {CustomerServerPropertiesTypeRef} from "../api/entities/sys/CustomerServerProperties"
import {DropDownSelector} from "../gui/base/DropDownSelector"
import stream from "mithril/stream/stream.js"
import {logins} from "../api/main/LoginController"
import type {AuditLogEntry} from "../api/entities/sys/AuditLogEntry"
import {AuditLogEntryTypeRef} from "../api/entities/sys/AuditLogEntry"
import {formatDateTime, formatDateTimeFromYesterdayOn} from "../misc/Formatter"
import type {Customer} from "../api/entities/sys/Customer"
import {CustomerTypeRef} from "../api/entities/sys/Customer"
import {Dialog} from "../gui/base/Dialog"
import type {GroupInfo} from "../api/entities/sys/GroupInfo"
import {GroupInfoTypeRef} from "../api/entities/sys/GroupInfo"
import {LockedError, NotAuthorizedError, PreconditionFailedError} from "../api/common/error/RestError"
import type {CustomerInfo} from "../api/entities/sys/CustomerInfo"
import {CustomerInfoTypeRef} from "../api/entities/sys/CustomerInfo"
import {loadEnabledTeamMailGroups, loadEnabledUserMailGroups, loadGroupDisplayName} from "./LoadingUtils"
import {GroupTypeRef} from "../api/entities/sys/Group"
import {UserTypeRef} from "../api/entities/sys/User"
import {Icons} from "../gui/base/icons/Icons"
import {showProgressDialog} from "../gui/dialogs/ProgressDialog"
import type {EntityUpdateData} from "../api/main/EventController"
import {isUpdateForTypeRef} from "../api/main/EventController"
import type {TableLineAttrs} from "../gui/base/TableN"
import {ColumnWidth, createRowActions} from "../gui/base/TableN"
import {attachDropdown, createDropdown} from "../gui/base/DropdownN"
import {ButtonType} from "../gui/base/ButtonN"
import {DomainDnsStatus} from "./DomainDnsStatus"
import {showDnsCheckDialog} from "./CheckDomainDnsStatusDialog"
import type {DomainInfo} from "../api/entities/sys/DomainInfo"
import {BootIcons} from "../gui/base/icons/BootIcons"
import {RejectedSenderTypeRef} from "../api/entities/sys/RejectedSender"
import {
	GENERATED_MAX_ID,
	generatedIdToTimestamp,
	getElementId,
	sortCompareByReverseId,
	timestampToGeneratedId
} from "../api/common/utils/EntityUtils"
import {ExpandableTable} from "./ExpandableTable"
import {showRejectedSendersInfoDialog} from "./RejectedSendersInfoDialog"
import {createEmailSenderListElement} from "../api/entities/sys/EmailSenderListElement"
import {showAddDomainWizard} from "./emaildomain/AddDomainWizard"
import {getUserGroupMemberships} from "../api/common/utils/GroupUtils";
import {showNotAvailableForFreeDialog} from "../misc/SubscriptionDialogs"
import {getDomainPart} from "../misc/parsing/MailAddressParser";
import type {UpdatableSettingsViewer} from "./SettingsView"
import {locator} from "../api/main/MainLocator"
import {assertMainOrNode} from "../api/common/Env"

assertMainOrNode()

// Number of days for that we load rejected senders
const REJECTED_SENDERS_TO_LOAD_MS = 5 * DAY_IN_MILLIS
// Max number of rejected sender entries that we display in the ui
const REJECTED_SENDERS_MAX_NUMBER = 100

export class GlobalSettingsViewer implements UpdatableSettingsViewer {
	view: Function;
	_props: Stream<CustomerServerProperties>;
	_customer: Stream<Customer>;
	_customerInfo: LazyLoaded<CustomerInfo>;
	_spamRuleLines: Stream<Array<TableLineAttrs>>;
	_rejectedSenderLines: Stream<Array<TableLineAttrs>>;
	_customDomainLines: Stream<Array<TableLineAttrs>>;
	_auditLogLines: Stream<Array<TableLineAttrs>>;

	/**
	 * caches the current status for the custom email domains
	 * map from domain name to status
	 */
	_domainDnsStatus: {[key: string]: DomainDnsStatus}

	constructor() {
		this._customerInfo = new LazyLoaded(() => {
			return load(CustomerTypeRef, neverNull(logins.getUserController().user.customer))
				.then(customer => load(CustomerInfoTypeRef, customer.customerInfo))
		})
		this._domainDnsStatus = {}
		this._spamRuleLines = stream([])
		this._rejectedSenderLines = stream([])
		this._customDomainLines = stream([])
		this._auditLogLines = stream([])
		this._props = stream()
		this._customer = stream()

		let saveIpAddress = stream(false)
		this._props.map(props => saveIpAddress(props.saveEncryptedIpAddressInSession))
		let saveIpAddressDropdown = new DropDownSelector("saveEncryptedIpAddress_label", null, [
			{name: lang.get("yes_label"), value: true},
			{name: lang.get("no_label"), value: false}
		], saveIpAddress, 250).setSelectionChangedHandler(v => {
			const newProps: CustomerServerProperties = Object.assign({}, this._props(), {saveEncryptedIpAddressInSession: v})
			update(newProps)
		})

		let requirePasswordUpdateAfterReset = stream(false)
		this._props.map(props => requirePasswordUpdateAfterReset(props.requirePasswordUpdateAfterReset))
		let requirePasswordUpdateAfterResetDropdown = new DropDownSelector("enforcePasswordUpdate_title", () => lang.get("enforcePasswordUpdate_msg"), [
			{name: lang.get("yes_label"), value: true},
			{name: lang.get("no_label"), value: false}
		], requirePasswordUpdateAfterReset, 250).setSelectionChangedHandler(v => {
			const newProps: CustomerServerProperties = Object.assign({}, this._props(), {requirePasswordUpdateAfterReset: v})
			update(newProps)
		})

		this.view = () => {
			const spamRuleTableAttrs = {
				columnHeading: ["emailSender_label", "emailSenderRule_label"],
				columnWidths: [ColumnWidth.Largest, ColumnWidth.Small],
				showActionButtonColumn: true,
				addButtonAttrs: {
					label: "addSpamRule_action",
					click: () => showAddSpamRuleDialog(),
					icon: () => Icons.Add
				},
				lines: this._spamRuleLines()
			}


			const rejectedSenderTableAttrs = {
				columnHeading: ["emailSender_label"],
				columnWidths: [ColumnWidth.Largest],
				showActionButtonColumn: true,
				addButtonAttrs: {
					label: "refresh_action",
					click: () => {
						this._updateRejectedSenderTable()
					},
					icon: () => BootIcons.Progress
				},
				lines: this._rejectedSenderLines()
			}


			const customDomainTableAttrs = {
				columnHeading: ["adminCustomDomain_label", "catchAllMailbox_label"],
				columnWidths: [ColumnWidth.Largest, ColumnWidth.Small],
				showActionButtonColumn: true,
				addButtonAttrs: {
					label: "addCustomDomain_action",
					click: () => {
						this._customerInfo.getAsync().then(customerInfo => {
							if (logins.getUserController().isFreeAccount()) {
								showNotAvailableForFreeDialog(getCustomMailDomains(customerInfo).length === 0)
							} else {
								showAddDomainWizard("", customerInfo).then(() => {
									this._updateDomains()
								})
							}
						})
					},
					icon: () => Icons.Add
				},
				lines: this._customDomainLines()
			}

			const auditLogTableAttrs = {
				columnHeading: ["action_label", "modified_label", "time_label"],
				columnWidths: [ColumnWidth.Largest, ColumnWidth.Largest, ColumnWidth.Small],
				showActionButtonColumn: true,
				lines: this._auditLogLines()
			}

			return [
				m("#global-settings.fill-absolute.scroll.plr-l", [
					m(ExpandableTable, {
						title: "adminSpam_action",
						table: spamRuleTableAttrs,
						infoMsg: "adminSpamRuleInfo_msg",
						infoLinkId: "spamRules_link"
					}),
					m(ExpandableTable, {
						title: "rejectedEmails_label",
						table: rejectedSenderTableAttrs,
						infoMsg: "rejectedSenderListInfo_msg",
						onExpand: () => this._updateRejectedSenderTable()
					}),
					m(ExpandableTable, {
						title: "customEmailDomains_label",
						table: customDomainTableAttrs,
						infoMsg: "moreInfo_msg",
						infoLinkId: "domainInfo_link"
					}),
					m(".mt-l", [
						m(".h4", lang.get('security_title')),
						m(saveIpAddressDropdown),
						logins.getUserController().isGlobalAdmin() && logins.getUserController().isPremiumAccount()
							? m("", [
								m(requirePasswordUpdateAfterResetDropdown),
								this._customer() ?
									m(".mt-l", m(ExpandableTable, {
										title: "auditLog_title",
										table: auditLogTableAttrs,
										infoMsg: "auditLogInfo_msg"
									})) : null
							]) : null,
					]),

				]),
			]
		}

		this._updateDomains()
		this._updateCustomerServerProperties()
		this._updateAuditLog()
	}

	_updateCustomerServerProperties(): Promise<void> {
		return locator.customerFacade.loadCustomerServerProperties().then(props => {
			this._props(props)
			const fieldToName = getSpamRuleFieldToName()
			this._spamRuleLines(props.emailSenderList.map((rule, index) => {
				return {
					cells: () => [
						{
							main: fieldToName[getSpamRuleField(rule)],
							info: [rule.value],
						},
						{
							main: neverNull(getSpamRuleTypeNameMapping().find(t => t.value === rule.type)).name,
						}
					],
					actionButtonAttrs: createRowActions({
						getArray: () => props.emailSenderList,
						updateInstance: () => update(props).catch(ofClass(LockedError, noOp))
					}, rule, index, [
						{
							label: "edit_action",
							click: () => showAddSpamRuleDialog(rule),
							type: ButtonType.Dropdown,
						}
					])
				}
			}))
			m.redraw()
		})
	}

	_updateRejectedSenderTable(): void {
		const customer = this._customer()
		if (customer && customer.rejectedSenders) {
			// Rejected senders are written with TTL for seven days.
			// We have to avoid that we load too many (already deleted) rejected senders form the past.
			// First we load REJECTED_SENDERS_MAX_NUMBER items starting from the past timestamp into the future. If there are
			// more entries available we can safely load REJECTED_SENDERS_MAX_NUMBER from GENERATED_MAX_ID in reverse order.
			// Otherwise we will just use what has been returned in the first request.
			const senderListId = customer.rejectedSenders.items
			const startId = timestampToGeneratedId(Date.now() - REJECTED_SENDERS_TO_LOAD_MS)
			const loadingPromise = loadRange(RejectedSenderTypeRef, senderListId, startId, REJECTED_SENDERS_MAX_NUMBER, false)
				.then(rejectedSenders => {
					if (REJECTED_SENDERS_MAX_NUMBER === rejectedSenders.length) {
						// There are more entries available, we need to load from GENERATED_MAX_ID.
						// we don't need to sort here because we load in reverse direction
						return loadRange(RejectedSenderTypeRef, senderListId, GENERATED_MAX_ID, REJECTED_SENDERS_MAX_NUMBER, true)
					} else {
						// ensure that rejected senders are sorted in descending order
						return rejectedSenders.sort(sortCompareByReverseId)
					}
				})
				.then(rejectedSenders => {
					const tableEntries = rejectedSenders.map(rejectedSender => {
						const rejectDate = formatDateTime(new Date(generatedIdToTimestamp(getElementId(rejectedSender))))
						return {
							cells: () => {
								return [
									{
										main: rejectedSender.senderMailAddress,
										info: [`${rejectDate}, ${rejectedSender.senderHostname} (${rejectedSender.senderIp})`],
										click: () => showRejectedSendersInfoDialog(rejectedSender)
									}
								]
							},
							actionButtonAttrs: attachDropdown({
									label: "showMore_action",
									icon: () => Icons.More,
								},
								() => [
									{
										label: "showRejectReason_action",
										type: ButtonType.Dropdown,
										click: () => showRejectedSendersInfoDialog(rejectedSender)
									},
									{
										label: "addSpamRule_action",
										type: ButtonType.Dropdown,
										click: () => {
											const domainPart = getDomainPart(rejectedSender.senderMailAddress)
											showAddSpamRuleDialog(createEmailSenderListElement({
												value: domainPart ? domainPart : "",
												type: SpamRuleType.WHITELIST,
												field: SpamRuleFieldType.FROM,
											}))
										}
									},
								]
							)
						}
					})
					this._rejectedSenderLines(tableEntries)
				})
			showProgressDialog("loading_msg", loadingPromise).then(() => m.redraw())
		}
	}

	_updateAuditLog(): Promise<void> {
		return load(CustomerTypeRef, neverNull(logins.getUserController().user.customer)).then(customer => {
			this._customer(customer)
			return loadRange(AuditLogEntryTypeRef, neverNull(customer.auditLog).items, GENERATED_MAX_ID, 200, true)
				.then(auditLog => {
					this._auditLogLines(auditLog.map(auditLogEntry => {
						return {
							cells: [auditLogEntry.action, auditLogEntry.modifiedEntity, formatDateTimeFromYesterdayOn(auditLogEntry.date)],
							actionButtonAttrs: {
								label: "showMore_action",
								icon: () => Icons.More,
								click: () => this._showAuditLogDetails(auditLogEntry, customer)
							}
						}
					}))
				})
		})
	}

	_showAuditLogDetails(entry: AuditLogEntry, customer: Customer) {
		let modifiedGroupInfo: Stream<GroupInfo> = stream()
		let groupInfo = stream()
		let groupInfoLoadingPromises = []
		if (entry.modifiedGroupInfo) {
			groupInfoLoadingPromises.push(load(GroupInfoTypeRef, entry.modifiedGroupInfo)
				.then(gi => {
					modifiedGroupInfo(gi)
				})
				.catch(ofClass(NotAuthorizedError, e => {
					// If the admin is removed from the free group, he does not have the permission to access the groupinfo of that group anymore
				})))
		}
		if (entry.groupInfo) {
			groupInfoLoadingPromises.push(load(GroupInfoTypeRef, entry.groupInfo).then(gi => {
				groupInfo(gi)
			}).catch(ofClass(NotAuthorizedError, e => {
				// If the admin is removed from the free group, he does not have the permission to access the groupinfo of that group anymore
			})))
		}
		Promise.all(groupInfoLoadingPromises).then(() => {
			let dialog = Dialog.showActionDialog({
				title: lang.get("auditLog_title"),
				child: {
					view: () => m("table.pt", [
						m("tr", [
							m("td", lang.get("action_label")),
							m("td.pl", entry.action)
						]),
						m("tr", [
							m("td", lang.get("actor_label")),
							m("td.pl", entry.actorMailAddress)
						]),
						m("tr", [
							m("td", lang.get("IpAddress_label")),
							m("td.pl", entry.actorIpAddress ? entry.actorIpAddress : "")
						]),
						m("tr", [
							m("td", lang.get("modified_label")),
							m("td.pl", (modifiedGroupInfo()
								&& this._getGroupInfoDisplayText(modifiedGroupInfo()))
								? this._getGroupInfoDisplayText(modifiedGroupInfo())
								: entry.modifiedEntity),
						]),
						groupInfo() ? m("tr", [
							m("td", lang.get("group_label")),
							m("td.pl", customer.adminGroup === groupInfo().group
								? lang.get("globalAdmin_label")
								: this._getGroupInfoDisplayText(groupInfo())),
						]) : null,
						m("tr", [
							m("td", lang.get("time_label")),
							m("td.pl", formatDateTime(entry.date)),
						]),
					])
				},
				allowOkWithReturn: true,
				okAction: () => dialog.close(),
				allowCancel: false
			})
		})
	}

	_getGroupInfoDisplayText(groupInfo: GroupInfo): string {
		if (groupInfo.name && groupInfo.mailAddress) {
			return groupInfo.name + " <" + groupInfo.mailAddress + ">"
		} else if (groupInfo.mailAddress) {
			return groupInfo.mailAddress
		} else {
			return groupInfo.name
		}
	}


	_updateDomains(): Promise<void> {
		return this._customerInfo.getAsync().then(customerInfo => {
			let customDomainInfos = getCustomMailDomains(customerInfo)
			// remove dns status instances for all removed domains
			Object.keys(this._domainDnsStatus).forEach(domain => {
				if (!customDomainInfos.find(di => di.domain === domain)) {
					delete this._domainDnsStatus[domain]
				}
			})
			return promiseMap(customDomainInfos, domainInfo => {
				// create dns status instances for all new domains
				if (!this._domainDnsStatus[domainInfo.domain]) {
					this._domainDnsStatus[domainInfo.domain] = new DomainDnsStatus(domainInfo.domain)
					this._domainDnsStatus[domainInfo.domain].loadCurrentStatus().then(() => {
						m.redraw()
					})
				}
				let domainDnsStatus = this._domainDnsStatus[domainInfo.domain]
				let p = Promise.resolve(lang.get("comboBoxSelectionNone_msg"))
				if (domainInfo.catchAllMailGroup) {
					p = loadGroupDisplayName(domainInfo.catchAllMailGroup)
				}
				return p.then(catchAllGroupName => {
					return {
						cells: () => [
							{
								main: domainInfo.domain,
								info: [domainDnsStatus.getDnsStatusInfo()],
								click: (domainDnsStatus.status.isLoaded() && !domainDnsStatus.areAllRecordsFine()) ? () => {
									showDnsCheckDialog(domainDnsStatus)
								} : noOp
							},
							{
								main: catchAllGroupName,
							}
						],
						actionButtonAttrs: {
							label: "action_label",
							icon: () => Icons.More,
							click: createDropdown(() => (domainDnsStatus.status.isLoaded() && !domainDnsStatus.areAllRecordsFine() ? [
								{
									type: ButtonType.Dropdown,
									label: "resumeSetup_label",
									click: () => {
										showAddDomainWizard(domainDnsStatus.domain, customerInfo).then(() => {
											domainDnsStatus.loadCurrentStatus().then(() => m.redraw())
										})
									}
								}
							] : []).concat([
								{
									type: ButtonType.Dropdown,
									label: "setCatchAllMailbox_action",
									click: () => this._editCatchAllMailbox(domainInfo)
								},
								{
									type: ButtonType.Dropdown,
									label: "delete_action",
									click: () => this._deleteCustomDomain(domainInfo)
								}
							]), 260)
						}
					}
				})
			}).then(tableLines => {
				this._customDomainLines(tableLines)
				m.redraw()
			})
		})
	}

	_editCatchAllMailbox(domainInfo: DomainInfo) {
		showProgressDialog("pleaseWait_msg", load(CustomerTypeRef, neverNull(logins.getUserController().user.customer))
			.then(customer => {
				return loadEnabledTeamMailGroups(customer)
					.then(teamMailGroups => loadEnabledUserMailGroups(customer)
						.then(userMailGroups => {
							let allMailGroups = teamMailGroups.concat(userMailGroups)
							let options = [
								{name: lang.get("comboBoxSelectionNone_msg"), value: null}
							].concat(allMailGroups.map(groupData => {
								return {name: groupData.displayName, value: groupData.groupId}
							}))
							let selectedPromise = Promise.resolve(null) // default is no selection
							if (domainInfo.catchAllMailGroup) {
								// the catch all group may be a user group, so load the mail group in that case
								selectedPromise = load(GroupTypeRef, domainInfo.catchAllMailGroup)
									.then(catchAllGroup => {
										if (catchAllGroup.type === GroupType.User) {
											return load(UserTypeRef, neverNull(catchAllGroup.user))
												.then(user => {
													return getUserGroupMemberships(user, GroupType.Mail)[0].group // the first is the users personal mail group
												})
										} else {
											return domainInfo.catchAllMailGroup
										}
									})
							}
							return selectedPromise.then(catchAllMailGroupId => {
								let selected = allMailGroups.find(g => g.groupId
									=== catchAllMailGroupId)
								return {available: options, selected: selected}
							})
						})
					)
			})
		).then(availableAndSelectedGroupDatas => {
			const valueStream = stream(availableAndSelectedGroupDatas.selected ? availableAndSelectedGroupDatas.selected.groupId : null)
			return Dialog.showDropDownSelectionDialog("setCatchAllMailbox_action", "catchAllMailbox_label", null, availableAndSelectedGroupDatas.available, valueStream, 250)
			             .then(selectedMailGroupId => {
				             return locator.customerFacade.setCatchAllGroup(domainInfo.domain, selectedMailGroupId)
			             })
		})
	}

	_deleteCustomDomain(domainInfo: DomainInfo) {
		Dialog.confirm(() => lang.get("confirmCustomDomainDeletion_msg", {"{domain}": domainInfo.domain}))
		      .then(confirmed => {
			      if (confirmed) {
				      locator.customerFacade.removeDomain(domainInfo.domain)
				             .catch(ofClass(PreconditionFailedError, e => {
					             let registrationDomains = this._props() != null ? this._props()
					                                                                   .whitelabelRegistrationDomains
					                                                                   .map(domainWrapper => domainWrapper.value) : []
					             if (registrationDomains.indexOf(domainInfo.domain) !== -1) {
						             Dialog.error(() => lang.get("customDomainDeletePreconditionWhitelabelFailed_msg", {"{domainName}": domainInfo.domain}))
					             } else {
						             Dialog.error(() => lang.get("customDomainDeletePreconditionFailed_msg", {"{domainName}": domainInfo.domain}))
					             }
				             }))
				             .catch(ofClass(LockedError, e => Dialog.error("operationStillActive_msg")))
			      }
		      })
	}

	entityEventsReceived(updates: $ReadOnlyArray<EntityUpdateData>): Promise<void> {
		return promiseMap(updates, update => {
			if (isUpdateForTypeRef(CustomerServerPropertiesTypeRef, update) && update.operation === OperationType.UPDATE) {
				return this._updateCustomerServerProperties()
			} else if (isUpdateForTypeRef(AuditLogEntryTypeRef, update)) {
				return this._updateAuditLog()
			} else if (isUpdateForTypeRef(CustomerInfoTypeRef, update) && update.operation === OperationType.UPDATE) {
				this._customerInfo.reset()
				return this._updateDomains()
			}
		}).then(noOp)
	}
}