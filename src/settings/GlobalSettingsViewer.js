// @flow
import m from "mithril"
import {assertMainOrNode} from "../api/Env"
import {lang} from "../misc/LanguageViewModel"
import {load, loadRange, update} from "../api/main/Entity"
import * as AddSpamRuleDialog from "./AddSpamRuleDialog"
import type {SpamRuleFieldTypeEnum, SpamRuleTypeEnum} from "../api/common/TutanotaConstants"
import {getSparmRuleField, GroupType, OperationType, SpamRuleFieldType, SpamRuleType} from "../api/common/TutanotaConstants"
import {getCustomMailDomains, getUserGroupMemberships, neverNull, objectEntries} from "../api/common/utils/Utils"
import {CustomerServerPropertiesTypeRef} from "../api/entities/sys/CustomerServerProperties"
import {worker} from "../api/main/WorkerClient"
import {GENERATED_MAX_ID} from "../api/common/EntityFunctions"
import {DropDownSelector} from "../gui/base/DropDownSelector"
import stream from "mithril/stream/stream.js"
import {logins} from "../api/main/LoginController"
import {AuditLogEntryTypeRef} from "../api/entities/sys/AuditLogEntry"
import {formatDateTime, formatDateTimeFromYesterdayOn} from "../misc/Formatter"
import {CustomerTypeRef} from "../api/entities/sys/Customer"
import {Dialog} from "../gui/base/Dialog"
import {GroupInfoTypeRef} from "../api/entities/sys/GroupInfo"
import {NotAuthorizedError, PreconditionFailedError} from "../api/common/error/RestError"
import {LazyLoaded} from "../api/common/utils/LazyLoaded"
import {CustomerInfoTypeRef} from "../api/entities/sys/CustomerInfo"
import {loadEnabledTeamMailGroups, loadEnabledUserMailGroups, loadGroupDisplayName} from "./LoadingUtils"
import {GroupTypeRef} from "../api/entities/sys/Group"
import {UserTypeRef} from "../api/entities/sys/User"
import {showNotAvailableForFreeDialog} from "../misc/ErrorHandlerImpl"
import {Icons} from "../gui/base/icons/Icons"
import {showProgressDialog} from "../gui/base/ProgressDialog"
import type {EntityUpdateData} from "../api/main/EventController"
import {isUpdateForTypeRef} from "../api/main/EventController"
import type {TableLineAttrs} from "../gui/base/TableN"
import {ColumnWidth, createRowActions, TableN} from "../gui/base/TableN"
import {ExpanderButtonN, ExpanderPanelN} from "../gui/base/ExpanderN"
import {createDropdown} from "../gui/base/DropdownN"
import {ButtonType} from "../gui/base/ButtonN"
import {showAddDomainDialog} from "./AddDomainDialog"
import {DomainDnsStatus} from "./DomainDnsStatus"
import {showDnsCheckDialog} from "./CheckDomainDnsStatusDialog"

assertMainOrNode()

export class GlobalSettingsViewer implements UpdatableSettingsViewer {
	view: Function;
	_props: Stream<CustomerServerProperties>;
	_customer: Stream<Customer>;
	_customerInfo: LazyLoaded<CustomerInfo>;
	_spamRuleLines: Stream<Array<TableLineAttrs>>;
	_spamRulesExpandedState: Stream<boolean>;
	_customDomainLines: Stream<Array<TableLineAttrs>>;
	_customDomainsExpandedState: Stream<boolean>;
	_auditLogLines: Stream<Array<TableLineAttrs>>;
	_auditLogExpandedState: Stream<boolean>;
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
		this._spamRulesExpandedState = stream(false)
		this._customDomainLines = stream([])
		this._customDomainsExpandedState = stream(false)
		this._auditLogLines = stream([])
		this._auditLogExpandedState = stream(false)
		this._props = stream()
		this._customer = stream()

		let saveIpAddress = stream(false)
		this._props.map(props => saveIpAddress(props.saveEncryptedIpAddressInSession))
		let saveIpAddressDropdown = new DropDownSelector("saveEncryptedIpAddress_label", null, [
			{name: lang.get("yes_label"), value: true},
			{name: lang.get("no_label"), value: false}
		], saveIpAddress, 250).setSelectionChangedHandler(v => {
			update(Object.assign({}, this._props(), {saveEncryptedIpAddressInSession: v}))
		})

		let requirePasswordUpdateAfterReset = stream(false)
		this._props.map(props => requirePasswordUpdateAfterReset(props.requirePasswordUpdateAfterReset))
		let requirePasswordUpdateAfterResetDropdown = new DropDownSelector("enforcePasswordUpdate_title", () => lang.get("enforcePasswordUpdate_msg"), [
			{name: lang.get("yes_label"), value: true},
			{name: lang.get("no_label"), value: false}
		], requirePasswordUpdateAfterReset, 250).setSelectionChangedHandler(v => {
			update(Object.assign({}, this._props(), {requirePasswordUpdateAfterReset: v}))
		})

		this.view = () => {
			const spamRuleTableAttrs = {
				columnHeading: ["emailSender_label", "emailSenderRule_label"],
				columnWidths: [ColumnWidth.Largest, ColumnWidth.Small],
				showActionButtonColumn: true,
				addButtonAttrs: {
					label: "addSpamRule_action",
					click: () => AddSpamRuleDialog.show(),
					icon: () => Icons.Add
				},
				lines: this._spamRuleLines()
			}

			const customDomainTableAttrs = {
				columnHeading: ["adminCustomDomain_label", "catchAllMailbox_label"],
				columnWidths: [ColumnWidth.Largest, ColumnWidth.Largest],
				showActionButtonColumn: true,
				addButtonAttrs: {
					label: "addCustomDomain_action",
					click: () => {
						if (logins.getUserController().isFreeAccount()) {
							showNotAvailableForFreeDialog(true)
						} else {
							this._customerInfo.getAsync().then(customerInfo => showAddDomainDialog(customerInfo, this._domainDnsStatus))
						}
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
					m(".flex-space-between.items-center.mb-s.mt-l", [
						m(".h4", lang.get('adminSpam_action')),
						m(ExpanderButtonN, {label: "show_action", expanded: this._spamRulesExpandedState})
					]),
					m(ExpanderPanelN, {expanded: this._spamRulesExpandedState}, m(TableN, spamRuleTableAttrs)),
					m("small", lang.get("adminSpamRuleInfo_msg")),
					m("small.text-break", [m(`a[href=${lang.getInfoLink('spamRules_link')}][target=_blank]`, lang.getInfoLink('spamRules_link'))]),

					m(".flex-space-between.items-center.mb-s.mt-l", [
						m(".h4", lang.get('customEmailDomains_label')),
						m(ExpanderButtonN, {label: "show_action", expanded: this._customDomainsExpandedState})
					]),
					m(ExpanderPanelN, {expanded: this._customDomainsExpandedState}, m(TableN, customDomainTableAttrs)),
					m("small", lang.get("moreInfo_msg") + " "),
					m("small.text-break", [m(`a[href=${lang.getInfoLink("domainInfo_link")}][target=_blank]`, lang.getInfoLink("domainInfo_link"))]),

					m(".mt-l", [
						m(".h4", lang.get('security_title')),
						m(saveIpAddressDropdown),
						logins.getUserController().isGlobalAdmin() && logins.getUserController().isPremiumAccount()
							? m("", [
								m(requirePasswordUpdateAfterResetDropdown),
								this._customer() ?
									m(".mt-l", [
										m(".flex-space-between.items-center.mb-s", [
											m(".h4", lang.get('auditLog_title')),
											m(ExpanderButtonN, {label: "show_action", expanded: this._auditLogExpandedState})
										]),
										m(ExpanderPanelN, {expanded: this._auditLogExpandedState}, m(TableN, auditLogTableAttrs)),
										m("small", lang.get("auditLogInfo_msg")),
									]) : null
							]) : null,
					]),

				]),
			]
		}

		this._updateDomains()
		this._updateCustomerServerProperties()
		this._updateAuditLog()
	}

	_updateCustomerServerProperties(): void {
		worker.loadCustomerServerProperties().then(props => {
			this._props(props)
			const fieldToName = getSpamRuleFieldToName()
			this._spamRuleLines(props.emailSenderList.map((rule, index) => {
				return {
					cells: () => [
						{
							main: fieldToName[getSparmRuleField(rule)],
							info: rule.value,
						},
						{
							main: neverNull(getSpamRuleTypeNameMapping().find(t => t.value === rule.type)).name,
						}
					],
					actionButtonAttrs: createRowActions({
						getArray: () => props.emailSenderList,
						updateInstance: () => update(props)
					}, rule, index, [
						{
							label: "edit_action",
							click: () => AddSpamRuleDialog.show(rule),
							type: ButtonType.Dropdown,
						}
					])
				}
			}))
			m.redraw()
		})
	}

	_updateAuditLog() {
		load(CustomerTypeRef, neverNull(logins.getUserController().user.customer)).then(customer => {
			this._customer(customer)
			loadRange(AuditLogEntryTypeRef, neverNull(customer.auditLog).items, GENERATED_MAX_ID, 200, true)
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
				.catch(NotAuthorizedError, e => {
					// If the admin is removed from the free group, he does not have the permission to access the groupinfo of that group anymore
				}))
		}
		if (entry.groupInfo) {
			groupInfoLoadingPromises.push(load(GroupInfoTypeRef, entry.groupInfo).then(gi => {
				groupInfo(gi)
			}).catch(NotAuthorizedError, e => {
				// If the admin is removed from the free group, he does not have the permission to access the groupinfo of that group anymore
			}))
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

	_getGroupInfoDisplayText(groupInfo: GroupInfo) {
		if (groupInfo.name && groupInfo.mailAddress) {
			return groupInfo.name + " <" + groupInfo.mailAddress + ">"
		} else if (groupInfo.mailAddress) {
			return groupInfo.mailAddress
		} else {
			return groupInfo.name
		}
	}

	_updateDomains() {
		this._customerInfo.getAsync().then(customerInfo => {
			let customDomainInfos = getCustomMailDomains(customerInfo)
			// remove dns status instances for all removed domains
			Object.keys(this._domainDnsStatus).forEach(domain => {
				if (!customDomainInfos.find(di => di.domain === domain)) {
					delete this._domainDnsStatus[domain]
				}
			})
			Promise.map(customDomainInfos, domainInfo => {
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
								info: domainDnsStatus.getDnsStatusInfo(),
								click: (domainDnsStatus.status.isLoaded() && !domainDnsStatus.areAllRecordsFine()) ? () => {
									showDnsCheckDialog(domainDnsStatus)
								} : null
							},
							{
								main: catchAllGroupName,
								info: null
							}
						],
						actionButtonAttrs: {
							label: "action_label",
							icon: () => Icons.More,
							click: createDropdown(() => (domainDnsStatus.status.isLoaded() && !domainDnsStatus.areAllRecordsFine() ? [
								{
									type: ButtonType.Dropdown,
									label: "checkDnsRecords_action",
									click: () => {
										showDnsCheckDialog(domainDnsStatus)
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
							]), 250)
						}
					}
				})
			}).then(tableLines => this._customDomainLines(tableLines))
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
				             return worker.setCatchAllGroup(domainInfo.domain, selectedMailGroupId)
			             })
		})
	}

	_deleteCustomDomain(domainInfo: DomainInfo) {
		worker.removeDomain(domainInfo.domain).catch(PreconditionFailedError, e => {
			let registrationDomains = this._props() != null ? this._props()
			                                                      .whitelabelRegistrationDomains
			                                                      .map(domainWrapper => domainWrapper.value) : []
			if (registrationDomains.indexOf(domainInfo.domain) !== -1) {
				Dialog.error(() => lang.get("customDomainDeletePreconditionWhitelabelFailed_msg", {"{domainName}": domainInfo.domain}))
			} else {
				Dialog.error(() => lang.get("customDomainDeletePreconditionFailed_msg", {"{domainName}": domainInfo.domain}))
			}
		})
	}

	entityEventsReceived(updates: $ReadOnlyArray<EntityUpdateData>) {
		for (let update of updates) {
			if (isUpdateForTypeRef(CustomerServerPropertiesTypeRef, update) && update.operation === OperationType.UPDATE) {
				this._updateCustomerServerProperties()
			} else if (isUpdateForTypeRef(AuditLogEntryTypeRef, update)) {
				this._updateAuditLog()
			} else if (isUpdateForTypeRef(CustomerInfoTypeRef, update) && update.operation === OperationType.UPDATE) {
				this._customerInfo.reset()
				this._updateDomains()
			}
		}
	}
}

export function getSpamRuleTypeNameMapping(): {value: SpamRuleTypeEnum, name: string}[] {
	return [
		{value: SpamRuleType.WHITELIST, name: lang.get("emailSenderWhitelist_action")},
		{value: SpamRuleType.BLACKLIST, name: lang.get("emailSenderBlacklist_action")},
		{value: SpamRuleType.DISCARD, name: lang.get("emailSenderDiscardlist_action")}
	]
}

function getSpamRuleFieldToName(): {[SpamRuleFieldTypeEnum]: string} {
	return {
		[SpamRuleFieldType.FROM]: lang.get("from_label"),
		[SpamRuleFieldType.TO]: lang.get("to_label"),
		[SpamRuleFieldType.CC]: "CC",
		[SpamRuleFieldType.BCC]: "BCC",
	}
}

export function getSpamRuleFieldMapping(): Array<{value: SpamRuleFieldTypeEnum, name: string}> {
	return objectEntries(getSpamRuleFieldToName()).map(([value, name]) => ({value, name}))
}

function escape(s: string) {
	if (s.indexOf('"') !== -1 || s.indexOf(',') !== -1) {
		return '"' + s.replace(new RegExp('"', 'g'), `\\"`) + '"'
	} else {
		return s
	}
}
