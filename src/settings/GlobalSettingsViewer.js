// @flow
import m from "mithril"
import {assertMainOrNode} from "../api/Env"
import {lang} from "../misc/LanguageViewModel"
import {Table, ColumnWidth} from "../gui/base/Table"
import {update, loadRange, load} from "../api/main/Entity"
import TableLine from "../gui/base/TableLine"
import {Button, createDropDownButton, ButtonType} from "../gui/base/Button"
import {ExpanderButton, ExpanderPanel} from "../gui/base/Expander"
import * as AddSpamRuleDialog from "./AddSpamRuleDialog"
import type {OperationTypeEnum} from "../api/common/TutanotaConstants"
import {SpamRuleType, OperationType, GroupType} from "../api/common/TutanotaConstants"
import {neverNull, getUserGroupMemberships} from "../api/common/utils/Utils"
import {CustomerServerPropertiesTypeRef} from "../api/entities/sys/CustomerServerProperties"
import {worker} from "../api/main/WorkerClient"
import {isSameTypeRef, GENERATED_MAX_ID} from "../api/common/EntityFunctions"
import {DropDownSelector} from "../gui/base/DropDownSelector"
import stream from "mithril/stream/stream.js"
import {logins} from "../api/main/LoginController"
import {AuditLogEntryTypeRef} from "../api/entities/sys/AuditLogEntry"
import {formatDateTimeFromYesterdayOn, formatDateTime} from "../misc/Formatter"
import {CustomerTypeRef} from "../api/entities/sys/Customer"
import {Dialog} from "../gui/base/Dialog"
import {GroupInfoTypeRef} from "../api/entities/sys/GroupInfo"
import {NotAuthorizedError, PreconditionFailedError} from "../api/common/error/RestError"
import {LazyLoaded} from "../api/common/utils/LazyLoaded"
import {CustomerInfoTypeRef} from "../api/entities/sys/CustomerInfo"
import {loadGroupDisplayName, loadEnabledTeamMailGroups, loadEnabledUserMailGroups} from "./LoadingUtils"
import * as AddDomainDialog from "./AddDomainDialog"
import {GroupTypeRef} from "../api/entities/sys/Group"
import {UserTypeRef} from "../api/entities/sys/User"
import {showNotAvailableForFreeDialog} from "../misc/ErrorHandlerImpl"
import {Icons} from "../gui/base/icons/Icons"
import {showProgressDialog} from "../gui/base/ProgressDialog"

assertMainOrNode()

export class GlobalSettingsViewer {
	view: Function;
	_spamRulesTable: Table;
	_domainsTable: Table;
	_auditLogTable: Table;
	_props: stream<CustomerServerProperties>;
	_customer: stream<Customer>;
	_customerInfo: LazyLoaded<CustomerInfo>;

	constructor() {
		this._customerInfo = new LazyLoaded(() => {
			return load(CustomerTypeRef, neverNull(logins.getUserController().user.customer))
				.then(customer => load(CustomerInfoTypeRef, customer.customerInfo))
		})

		let addSpamRuleButton = new Button("addSpamRule_action", () => AddSpamRuleDialog.show(), () => Icons.Add)
		this._spamRulesTable = new Table(["emailSenderRule_label", "emailSender_label"], [
			ColumnWidth.Small, ColumnWidth.Largest
		], true, addSpamRuleButton)
		let spamRulesExpander = new ExpanderButton("show_action", new ExpanderPanel(this._spamRulesTable), false)

		this._props = stream()
		this._customer = stream()

		let addDomainButton = new Button("addCustomDomain_action", () => {
			if (logins.getUserController().isFreeAccount()) {
				showNotAvailableForFreeDialog()
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
			return [
				m("#global-settings.fill-absolute.scroll.plr-l", [
					m(".flex-space-between.items-center.mb-s.mt-l", [
						m(".h4", lang.get('adminSpam_action')),
						m(spamRulesExpander)
					]),
					m(spamRulesExpander.panel),
					m("small", lang.get("adminSpamRuleInfo_msg")),
					m("small.text-break", [m(`a[href=${this._getSpamRulesInfoLink()}][target=_blank]`, this._getSpamRulesInfoLink())]),
					m(".flex-space-between.items-center.mb-s.mt-l", [
						m(".h4", lang.get('customEmailDomains_label')),
						m(domainsExpander)
					]),
					m(domainsExpander.panel),
					m("small", lang.get("moreInfo_msg") + " "),
					m("small.text-break", [m(`a[href=${AddDomainDialog.getDomainInfoLink()}][target=_blank]`, AddDomainDialog.getDomainInfoLink())]),
					logins.getUserController().isGlobalAdmin() && logins.getUserController()
					                                                    .isPremiumAccount() ? m(".mt-l", [
						m(".h4", lang.get('security_title')),
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
			]
		}

		this._updateDomains()
		this._updateCustomerServerProperties()
		this._updateAuditLog()
	}

	_getSpamRulesInfoLink(): string {
		return (lang.code === "de" || lang.code
			=== "de_sie") ? "http://tutanota.uservoice.com/knowledgebase/articles/780153" : "https://tutanota.uservoice.com/knowledgebase/articles/780147"
	}

	_updateCustomerServerProperties(): void {
		worker.loadCustomerServerProperties().then(props => {
			this._props(props)
			this._spamRulesTable.updateEntries(props.emailSenderList.map((rule, index) => {
				let actionButton = new Button("delete_action", () => {
					props.emailSenderList.splice(index, 1)
					update(props)
				}, () => Icons.Cancel)
				return new TableLine([
					neverNull(getSpamRuleTypeNameMapping().find(t => t.value === rule.type)).name, rule.value
				], actionButton)
			}))
		})
	}

	_updateAuditLog() {
		load(CustomerTypeRef, neverNull(logins.getUserController().user.customer)).then(customer => {
			this._customer(customer)
			loadRange(AuditLogEntryTypeRef, neverNull(customer.auditLog).items, GENERATED_MAX_ID, 200, true)
				.then(auditLog => {
					this._auditLogTable.updateEntries(auditLog.map(line => {
						let showDetails = new Button("showMore_action", () => {
							let modifiedGroupInfo = stream()
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
								let dialog = Dialog.smallActionDialog(lang.get("auditLog_title"), {
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
											m("td.pl", line.actorIpAddress)
										]),
										m("tr", [
											m("td", lang.get("modified_label")),
											m("td.pl", (modifiedGroupInfo()
												&& this._getGroupInfoDisplayText(modifiedGroupInfo())) ? this._getGroupInfoDisplayText(modifiedGroupInfo()) : line.modifiedEntity),
										]),
										groupInfo() ? m("tr", [
											m("td", lang.get("group_label")),
											m("td.pl", customer.adminGroup
											=== groupInfo().group ? lang.get("globalAdmin_label") : this._getGroupInfoDisplayText(groupInfo())),
										]) : null,
										m("tr", [
											m("td", lang.get("time_label")),
											m("td.pl", formatDateTime(line.date)),
										]),
									])
								}, () => dialog.close(), false)
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
			let customDomainInfos = customerInfo.domainInfos.filter(domainInfo => domainInfo.certificate == null)
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
								return Dialog.showDropDownSelectionDialog("setCatchAllMailbox_action", "catchAllMailbox_label", null, availableAndSelectedGroupDatas.available, availableAndSelectedGroupDatas.selected ? availableAndSelectedGroupDatas.selected.groupId : null, 250)
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

	entityEventReceived<T>(typeRef: TypeRef<any>, listId: ?string, elementId: string, operation: OperationTypeEnum): void {
		if (isSameTypeRef(typeRef, CustomerServerPropertiesTypeRef) && operation === OperationType.UPDATE) {
			this._updateCustomerServerProperties()
		} else if (isSameTypeRef(typeRef, AuditLogEntryTypeRef)) {
			this._updateAuditLog()
		} else if (isSameTypeRef(typeRef, CustomerInfoTypeRef) && operation === OperationType.UPDATE) {
			this._customerInfo.reset()
			this._updateDomains()
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
