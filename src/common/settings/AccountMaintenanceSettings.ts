import m from "mithril"
import { lang } from "../misc/LanguageViewModel.js"
import { DropDownSelector } from "../gui/base/DropDownSelector.js"
import { locator } from "../api/main/MainLocator.js"
import {
	AuditLogEntry,
	AuditLogEntryTypeRef,
	createSurveyData,
	Customer,
	CustomerInfo,
	CustomerPropertiesTypeRef,
	CustomerServerProperties,
	CustomerServerPropertiesTypeRef,
	CustomerTypeRef,
	GroupInfo,
	GroupInfoTypeRef,
} from "../api/entities/sys/TypeRefs.js"
import { ExpandableTable } from "../../mail-app/settings/ExpandableTable.js"
import { showProgressDialog } from "../gui/dialogs/ProgressDialog.js"
import { SettingsExpander } from "../../mail-app/settings/SettingsExpander.js"
import { LoginButton } from "../gui/base/buttons/LoginButton.js"
import { showLeavingUserSurveyWizard } from "../subscription/LeavingUserSurveyWizard.js"
import { SURVEY_VERSION_NUMBER } from "../subscription/LeavingUserSurveyConstants.js"
import { showDeleteAccountDialog } from "../subscription/DeleteAccountDialog.js"
import stream from "mithril/stream"
import { ColumnWidth, TableAttrs, TableLineAttrs } from "../gui/base/Table.js"
import { LazyLoaded, neverNull, noOp, ofClass, promiseMap } from "@tutao/tutanota-utils"
import { BootIcons } from "../gui/base/icons/BootIcons.js"
import { ButtonSize } from "../gui/base/ButtonSize.js"
import { GENERATED_MAX_ID } from "../api/common/utils/EntityUtils.js"
import { formatDateTime, formatDateTimeFromYesterdayOn } from "../misc/Formatter.js"
import { Icons } from "../gui/base/icons/Icons.js"
import Stream from "mithril/stream"
import { NotAuthorizedError } from "../api/common/error/RestError.js"
import { Dialog } from "../gui/base/Dialog.js"
import { OperationType } from "../api/common/TutanotaConstants.js"
import { EntityUpdateData, isUpdateForTypeRef } from "../api/common/utils/EntityUpdateUtils.js"
import { UpdatableSettingsViewer } from "./Interfaces.js"

export class AccountMaintenanceSettings implements UpdatableSettingsViewer {
	private readonly props = stream<Readonly<CustomerServerProperties>>()

	private requirePasswordUpdateAfterReset = false
	private saveIpAddress = false
	private readonly usageDataExpanded = stream(false)
	private readonly deleteAccountExpanded = stream(false)
	private auditLogLines: ReadonlyArray<TableLineAttrs> = []
	private auditLogLoaded = false

	private customer: Customer | null = null
	private readonly customerInfo = new LazyLoaded<CustomerInfo>(() => locator.logins.getUserController().loadCustomerInfo())
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

		this.updateCustomerServerProperties()
		this.updateAuditLog()
	}

	view() {
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
		]
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

	private updateCustomerServerProperties(): Promise<void> {
		return locator.customerFacade.loadCustomerServerProperties().then((props) => {
			this.props(props)
		})
	}

	entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		return promiseMap(updates, (update) => {
			if (isUpdateForTypeRef(CustomerServerPropertiesTypeRef, update) && update.operation === OperationType.UPDATE) {
				return this.updateCustomerServerProperties()
			} else if (isUpdateForTypeRef(AuditLogEntryTypeRef, update)) {
				return this.updateAuditLog()
			} else if (isUpdateForTypeRef(CustomerPropertiesTypeRef, update)) {
				this.customerProperties.reset()
				this.customerProperties.getAsync().then(m.redraw)
			}
		}).then(noOp)
	}
}
