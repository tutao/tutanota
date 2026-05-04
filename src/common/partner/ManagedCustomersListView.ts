import m, { Children } from "mithril"
import * as restError from "@tutao/rest-client/error"
import { component_size } from "../../ui/size.js"
import { assertNotNull, noOp } from "@tutao/utils"
import { assertMainOrNode, FeatureType } from "@tutao/app-env"
import { Icon } from "../../ui/base/Icon.js"
import { Icons } from "../../ui/base/icons/Icons.js"
import { ListColumnWrapper } from "../../ui/ListColumnWrapper.js"
import { locator } from "../api/main/CommonLocator.js"
import Stream from "mithril/stream"
import { SelectableRowContainer, SelectableRowSelectedSetter, setVisibility } from "../../ui/SelectableRowContainer.js"
import { List, ListAttrs, MultiselectMode, RenderConfig } from "../../ui/base/List.js"
import { listSelectionKeyboardShortcuts, VirtualRow } from "../../ui/base/ListUtils.js"
import ColumnEmptyMessageBox from "../../ui/base/ColumnEmptyMessageBox.js"
import { theme } from "../../ui/theme.js"
import { BaseSearchBar, BaseSearchBarAttrs } from "../../ui/base/BaseSearchBar.js"
import { IconButton } from "../../ui/base/IconButton.js"
import { lang } from "../../ui/utils/LanguageViewModel.js"
import { keyManager } from "../../ui/utils/KeyManager.js"
import { ListAutoSelectBehavior } from "../misc/DeviceConfig.js"
import { UpdatableSettingsViewer } from "../settings/Interfaces.js"
import { ListElementListModel } from "../misc/ListElementListModel"
import { ManagedCustomerViewer } from "./ManagedCustomerViewer"
import { CustomerInfo, CustomerInfoTypeRef, PartnerManagedCustomerTypeRef } from "@tutao/entities/sys"
import { EntityUpdateData, isUpdateForTypeRef } from "../../instance-pipeline/EntityUpdateUtils"
import { elementIdPart, listIdPart } from "@tutao/meta"

assertMainOrNode()

function getCustomerInfoDisplayName(groupInfo: CustomerInfo): string {
	if (groupInfo.company) {
		return groupInfo.company
	} else if (groupInfo.registrationMailAddress) {
		return groupInfo.registrationMailAddress
	} else {
		return ""
	}
}

function compareCustomerInfos(a: CustomerInfo, b: CustomerInfo): number {
	return getCustomerInfoDisplayName(a).localeCompare(getCustomerInfoDisplayName(b))
}

/**
 * Displays a list with customers that are available to be managed by the current partner.
 * Admins see all customers.
 */
export class ManagedCustomerListView implements UpdatableSettingsViewer {
	private searchQuery: string = ""
	private listModel: ListElementListModel<CustomerInfo>
	private readonly renderConfig: RenderConfig<CustomerInfo, ManagedCustomerRow> = {
		createElement: (dom) => {
			const row = new ManagedCustomerRow()
			m.render(dom, row.render())
			return row
		},
		itemHeight: component_size.list_row_height,
		swipe: null,
		multiselectionAllowed: MultiselectMode.Disabled,
	}

	private listStateSubscription: Stream<unknown> | null = null
	private listSelectionSubscription: Stream<unknown> | null = null

	constructor(
		private readonly updateDetailsViewer: (viewer: ManagedCustomerViewer | null) => unknown,
		private readonly focusDetailsViewer: () => unknown,
	) {
		// doing it after "onSelectionChanged" is initialized
		this.listModel = this.makeListModel()
		this.listModel.loadInitial()

		this.oncreate = this.oncreate.bind(this)
		this.onremove = this.onremove.bind(this)
		this.view = this.view.bind(this)
	}

	private readonly shortcuts = listSelectionKeyboardShortcuts(MultiselectMode.Disabled, () => this.listModel)

	oncreate() {
		keyManager.registerShortcuts(this.shortcuts)
	}

	view(): Children {
		if (locator.logins.isEnabled(FeatureType.WhitelabelChild)) {
			return null
		}

		return m(
			ListColumnWrapper,
			{
				headerContent: m(
					".flex.flex-space-between.center-vertically.plr-24",
					m(BaseSearchBar, {
						text: this.searchQuery,
						onInput: (text) => this.updateQuery(text),
						busy: false,
						onKeyDown: (e) => e.stopPropagation(),
						onClear: () => {
							this.searchQuery = ""
							this.listModel.reapplyFilter()
						},
						placeholder: lang.get("searchManagedCustomers_placeholder"),
					} satisfies BaseSearchBarAttrs),
					m(
						".mr-negative-8",
						m(IconButton, {
							title: "addManagedCustomers_action",
							icon: Icons.Plus,
							click: () => this.addButtonClicked(),
						}),
					),
				),
			},
			this.listModel.isEmptyAndDone()
				? m(ColumnEmptyMessageBox, {
						color: theme.on_surface_variant,
						icon: Icons.PersonFilled,
						message: "noEntries_msg",
					})
				: m(List, {
						renderConfig: this.renderConfig,
						state: this.listModel.state,
						onLoadMore: () => this.listModel.loadMore(),
						onRetryLoading: () => this.listModel.retryLoading(),
						onStopLoading: () => this.listModel.stopLoading(),
						onSingleSelection: (item: CustomerInfo) => {
							this.listModel.onSingleSelection(item)
							this.focusDetailsViewer()
						},
						onSingleTogglingMultiselection: noOp,
						onRangeSelectionTowards: noOp,
					} satisfies ListAttrs<CustomerInfo, ManagedCustomerRow>),
		)
	}

	onremove() {
		keyManager.unregisterShortcuts(this.shortcuts)

		this.listStateSubscription?.end(true)
		this.listSelectionSubscription?.end(true)
	}

	private async addButtonClicked() {
		const customerInfo = await locator.logins.getUserController().loadCustomerInfo()

		// Loads signup page with current partner promotion and business plans pre-selected.
		const campaignUrl = `/signup?t-src=${customerInfo.promotionId}&type=business&interval=12`
		window.open(campaignUrl)
	}

	async entityEventsReceived<T>(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		for (const update of updates) {
			if (isUpdateForTypeRef(PartnerManagedCustomerTypeRef, update)) {
				const partnerManagedCustomer = await locator.entityClient.load(PartnerManagedCustomerTypeRef, [update.instanceListId, update.instanceId])
				const customerInfoId = partnerManagedCustomer.customerInfo
				await this.listModel.entityEventReceived(listIdPart(customerInfoId), elementIdPart(customerInfoId), update.operation)
			}

			m.redraw()
		}
	}

	private makeListModel(): ListElementListModel<CustomerInfo> {
		const listModel = new ListElementListModel<CustomerInfo>({
			sortCompare: compareCustomerInfos,
			fetch: async (_lastFetchedEntity) => {
				const customerInfo = await locator.logins.getUserController().loadCustomerInfo()
				const managedCustomers = await locator.entityClient.loadAll(PartnerManagedCustomerTypeRef, assertNotNull(customerInfo.partnerManagedCustomers))
				const customerInfoIds = managedCustomers.map((customer) => elementIdPart(customer.customerInfo))
				if (managedCustomers.length < 1) {
					return { items: [], complete: true }
				}

				const customerInfos = await locator.entityClient.loadMultiple(
					CustomerInfoTypeRef,
					listIdPart(managedCustomers[0].customerInfo),
					customerInfoIds,
				)
				return { items: customerInfos, complete: true }
			},
			loadSingle: async (_listId: Id, elementId: Id) => {
				try {
					return await locator.entityClient.load<CustomerInfo>(CustomerInfoTypeRef, [_listId, elementId])
				} catch (e) {
					if (e instanceof restError.NotFoundError) {
						// we return null if the CustomerInfo does not exist
						return null
					} else {
						throw e
					}
				}
			},
			autoSelectBehavior: () => ListAutoSelectBehavior.OLDER,
		})

		listModel.setFilter((gi) => this.groupFilter() && this.queryFilter(gi))

		this.listStateSubscription?.end(true)
		this.listStateSubscription = listModel.stateStream.map((state) => {
			m.redraw()
		})

		this.listSelectionSubscription?.end(true)
		this.listSelectionSubscription = listModel.differentItemsSelected.map((newSelection) => {
			let detailsViewer: ManagedCustomerViewer | null
			if (newSelection.size === 0) {
				detailsViewer = null
			} else {
				const item = newSelection.values().next().value
				detailsViewer = new ManagedCustomerViewer(item)
			}
			this.updateDetailsViewer(detailsViewer)
			m.redraw()
		})
		return listModel
	}

	private queryFilter(gi: CustomerInfo) {
		const lowercaseSearch = this.searchQuery.toLowerCase()
		return (
			gi.company?.toLowerCase().includes(lowercaseSearch) ||
			(!!gi.registrationMailAddress && gi.registrationMailAddress?.toLowerCase().includes(lowercaseSearch)) ||
			gi.domainInfos.some((domain) => domain.domain.toLowerCase().includes(lowercaseSearch))
		)
	}

	private groupFilter = () => {
		return locator.logins.getUserController().isGlobalAdmin()
	}

	private updateQuery(query: string) {
		this.searchQuery = query
		this.listModel.reapplyFilter()
	}
}

export class ManagedCustomerRow implements VirtualRow<CustomerInfo> {
	top: number = 0
	domElement: HTMLElement | null = null // set from List
	entity: CustomerInfo | null = null
	private nameDom!: HTMLElement
	private addressDom!: HTMLElement
	private deletedIconDom!: HTMLElement
	private selectionUpdater!: SelectableRowSelectedSetter

	constructor() {}

	update(customerInfo: CustomerInfo, selected: boolean): void {
		this.entity = customerInfo

		this.selectionUpdater(selected, false)

		this.nameDom.textContent = customerInfo.company
		this.addressDom.textContent = customerInfo.registrationMailAddress ? customerInfo.registrationMailAddress : ""

		setVisibility(this.deletedIconDom, customerInfo.deletionTime != null)
	}

	/**
	 * Only the structure is managed by mithril. We set all contents on our own (see update) in order to avoid the vdom overhead (not negligible on mobiles)
	 */
	render(): Children {
		return m(
			SelectableRowContainer,
			{
				onSelectedChangeRef: (updater) => (this.selectionUpdater = updater),
			},
			m(".flex.col.flex-grow", [
				m(".badge-line-height", [
					m("", {
						oncreate: (vnode) => (this.nameDom = vnode.dom as HTMLElement),
					}),
				]),
				m(".flex-space-between.mt-4", [
					m(".smaller", {
						oncreate: (vnode) => (this.addressDom = vnode.dom as HTMLElement),
					}),
					m(".icons.flex", [
						m(Icon, {
							icon: Icons.TrashFilled,
							oncreate: (vnode) => (this.deletedIconDom = vnode.dom as HTMLElement),
							class: "svg-list-accent-fg",
							style: {
								display: "none",
							},
						}),
					]),
				]),
			]),
		)
	}
}
