// @flow
import m from "mithril"
import {assertMainOrNode} from "../api/Env"
import {lang} from "../misc/LanguageViewModel"
import {load, loadRange, update} from "../api/main/Entity"
import TableLine from "../gui/base/TableLine"
import {Button, ButtonType, createDropDownButton} from "../gui/base/Button"
import {ExpanderButton, ExpanderPanel} from "../gui/base/Expander"
import * as AddSpamRuleDialog from "./AddSpamRuleDialog"
import {GroupType, OperationType, SpamRuleType} from "../api/common/TutanotaConstants"
import {getCustomMailDomains, getUserGroupMemberships, neverNull} from "../api/common/utils/Utils"
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
import * as AddDomainDialog from "./AddDomainDialog"
import {GroupTypeRef} from "../api/entities/sys/Group"
import {UserTypeRef} from "../api/entities/sys/User"
import {showNotAvailableForFreeDialog} from "../misc/ErrorHandlerImpl"
import {Icons} from "../gui/base/icons/Icons"
import {showProgressDialog} from "../gui/base/ProgressDialog"
import type {EntityUpdateData} from "../api/main/EventController"
import {isUpdateForTypeRef} from "../api/main/EventController"
import type {TableLineAttrs} from "../gui/base/TableN"
import {ColumnWidth, createRowActions, TableN} from "../gui/base/TableN"
import {Table} from "../gui/base/Table"
import {ExpanderButtonN, ExpanderPanelN} from "../gui/base/ExpanderN"

assertMainOrNode()

export class GlobalSettingsViewer implements UpdatableSettingsViewer {
	view: Function;
	_domainsTable: Table;
	_auditLogTable: Table;
	_props: Stream<CustomerServerProperties>;
	_customer: Stream<Customer>;
	_customerInfo: LazyLoaded<CustomerInfo>;
	_spamRuleLines: Stream<Array<TableLineAttrs>>;
	_spamRulesExpandedState: Stream<boolean>;

	constructor() {
		this._customerInfo = new LazyLoaded(() => {
			return load(CustomerTypeRef, neverNull(logins.getUserController().user.customer))
				.then(customer => load(CustomerInfoTypeRef, customer.customerInfo))
		})

		this._spamRuleLines = stream([])
		this._spamRulesExpandedState = stream(false)
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

		let addDomainButton = new Button("addCustomDomain_action", () => {
			if (logins.getUserController().isFreeAccount()) {
				showNotAvailableForFreeDialog(true)
			} else {
				this._customerInfo.getAsync().then(customerInfo => AddDomainDialog.show(customerInfo))
			}
		}, () => Icons.Add)
		this._domainsTable = new Table(["adminCustomDomain_label", "catchAllMailbox_label"], [
			ColumnWidth.Largest, ColumnWidth.Largest
		], true, addDomainButton)
		let domainsExpander = new ExpanderButton("show_action", new ExpanderPanel(this._domainsTable), false)

		let requirePasswordUpdateAfterReset = stream(false)
		this._props.map(props => requirePasswordUpdateAfterReset(props.requirePasswordUpdateAfterReset))
		let requirePasswordUpdateAfterResetDropdown = new DropDownSelector("enforcePasswordUpdate_title", () => lang.get("enforcePasswordUpdate_msg"), [
			{name: lang.get("yes_label"), value: true},
			{name: lang.get("no_label"), value: false}
		], requirePasswordUpdateAfterReset, 250).setSelectionChangedHandler(v => {
			update(Object.assign({}, this._props(), {requirePasswordUpdateAfterReset: v}))
		})

		this._auditLogTable = new Table(["action_label", "modified_label", "time_label"], [
			ColumnWidth.Largest, ColumnWidth.Largest, ColumnWidth.Small
		], true)
		let auditLogExpander = new ExpanderButton("show_action", new ExpanderPanel(this._auditLogTable), false)

		this.view = () => {
			const spamRuleTableAttrs = {
				columnHeadingTextIds: ["emailSenderRule_label", "emailSender_label"],
				columnWidths: [ColumnWidth.Small, ColumnWidth.Largest],
				showActionButtonColumn: true,
				addButtonAttrs: {
					label: "addSpamRule_action",
					click: () => AddSpamRuleDialog.show(),
					icon: () => Icons.Add
				},
				lines: this._spamRuleLines()
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
						m(domainsExpander)
					]),
					m(domainsExpander.panel),
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
											m(auditLogExpander)
										]),
										m(auditLogExpander.panel),
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
			this._spamRuleLines(props.emailSenderList.map((rule, index) => {
				return {
					cells: [
						neverNull(getSpamRuleTypeNameMapping().find(t => t.value === rule.type)).name, rule.value
					],
					actionButtonAttrs: createRowActions({
						getArray: () => props.emailSenderList,
						updateInstance: () => update(props)
					}, rule, index)
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
					this._auditLogTable.updateEntries(auditLog.map(line => {
						let showDetails = new Button("showMore_action", () => {
							let modifiedGroupInfo: Stream<GroupInfo> = stream()
							let groupInfo = stream()
							let groupInfoLoadingPromises = []
							if (line.modifiedGroupInfo) {
								groupInfoLoadingPromises.push(load(GroupInfoTypeRef, line.modifiedGroupInfo)
									.then(gi => {
										modifiedGroupInfo(gi)
									})
									.catch(NotAuthorizedError, e => {
										// If the admin is removed from the free group, he does not have the permission to access the groupinfo of that group anymore
									}))
							}
							if (line.groupInfo) {
								groupInfoLoadingPromises.push(load(GroupInfoTypeRef, line.groupInfo).then(gi => {
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
												m("td.pl", line.action)
											]),
											m("tr", [
												m("td", lang.get("actor_label")),
												m("td.pl", line.actorMailAddress)
											]),
											m("tr", [
												m("td", lang.get("IpAddress_label")),
												m("td.pl", line.actorIpAddress ? line.actorIpAddress : "")
											]),
											m("tr", [
												m("td", lang.get("modified_label")),
												m("td.pl", (modifiedGroupInfo()
													&& this._getGroupInfoDisplayText(modifiedGroupInfo()))
													? this._getGroupInfoDisplayText(modifiedGroupInfo())
													: line.modifiedEntity),
											]),
											groupInfo() ? m("tr", [
												m("td", lang.get("group_label")),
												m("td.pl", customer.adminGroup === groupInfo().group
													? lang.get("globalAdmin_label")
													: this._getGroupInfoDisplayText(groupInfo())),
											]) : null,
											m("tr", [
												m("td", lang.get("time_label")),
												m("td.pl", formatDateTime(line.date)),
											]),
										])
									},
									okAction: () => dialog.close(),
									allowCancel: false
								})
							})
						}, () => Icons.More)
						return new TableLine([
							line.action, line.modifiedEntity, formatDateTimeFromYesterdayOn(line.date)
						], showDetails)
					}))
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
			Promise.map(customDomainInfos, domainInfo => {
				let p = Promise.resolve(lang.get("comboBoxSelectionNone_msg"))
				if (domainInfo.catchAllMailGroup) {
					p = loadGroupDisplayName(domainInfo.catchAllMailGroup)
				}
				return p.then(catchAllGroupName => {
					let actionButton = createDropDownButton("action_label", () => Icons.More, () => {
						let buttons = []
						buttons.push(new Button("setCatchAllMailbox_action", () => {
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
											}))
								})).then(availableAndSelectedGroupDatas => {
								const valueStream = stream(availableAndSelectedGroupDatas.selected ? availableAndSelectedGroupDatas.selected.groupId : null)
								return Dialog.showDropDownSelectionDialog("setCatchAllMailbox_action", "catchAllMailbox_label", null, availableAndSelectedGroupDatas.available, valueStream, 250)
								             .then(selectedMailGroupId => {
									             return worker.setCatchAllGroup(domainInfo.domain, selectedMailGroupId)
								             })
							})
						}).setType(ButtonType.Dropdown))
						buttons.push(new Button("delete_action", () => {
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
						}).setType(ButtonType.Dropdown))
						return buttons
					}, 250)
					return new TableLine([domainInfo.domain, catchAllGroupName], actionButton)
				})
			}).then(tableLines => this._domainsTable.updateEntries(tableLines))
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

export function getSpamRuleTypeNameMapping(): {value: string, name: string}[] {
	return [
		{value: SpamRuleType.WHITELIST, name: lang.get("emailSenderWhitelist_action")},
		{value: SpamRuleType.BLACKLIST, name: lang.get("emailSenderBlacklist_action")},
		{value: SpamRuleType.DISCARD, name: lang.get("emailSenderDiscardlist_action")}
	]
}

function escape(s: string) {
	if (s.indexOf('"') !== -1 || s.indexOf(',') !== -1) {
		return '"' + s.replace(new RegExp('"', 'g'), `\\"`) + '"'
	} else {
		return s
	}
}
