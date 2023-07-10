import m, { Children } from "mithril"
import { assertMainOrNode } from "../../api/common/Env"
import { NotFoundError } from "../../api/common/error/RestError"
import { size } from "../../gui/size"
import type { UpdatableSettingsViewer } from "../SettingsView"
import { LazyLoaded, memoized, NBSP, noOp, ofClass } from "@tutao/tutanota-utils"
import { ContactFormViewer } from "./ContactFormViewer"
import * as ContactFormEditor from "./ContactFormEditor"
import type { ContactForm } from "../../api/entities/tutanota/TypeRefs.js"
import { ContactFormTypeRef, CustomerContactFormGroupRootTypeRef } from "../../api/entities/tutanota/TypeRefs.js"
import { getWhitelabelDomain } from "../../api/common/utils/Utils"
import type { CustomerInfo } from "../../api/entities/sys/TypeRefs.js"
import { CustomerInfoTypeRef } from "../../api/entities/sys/TypeRefs.js"
import { Icon } from "../../gui/base/Icon"
import { Icons } from "../../gui/base/icons/Icons"
import { getAdministratedGroupIds, getContactFormUrl, getDefaultContactFormLanguage } from "./ContactFormUtils"
import type { EntityUpdateData } from "../../api/main/EventController"
import { isUpdateForTypeRef } from "../../api/main/EventController"
import { GENERATED_MAX_ID } from "../../api/common/utils/EntityUtils"
import { ListColumnWrapper } from "../../gui/ListColumnWrapper"
import { locator } from "../../api/main/MainLocator"
import { SelectableRowContainer, SelectableRowSelectedSetter } from "../../gui/SelectableRowContainer.js"
import { ListModel } from "../../misc/ListModel.js"
import Stream from "mithril/stream"
import { List, ListAttrs, MultiselectMode, RenderConfig } from "../../gui/base/List.js"
import { onlySingleSelection, VirtualRow } from "../../gui/base/ListUtils.js"
import ColumnEmptyMessageBox from "../../gui/base/ColumnEmptyMessageBox.js"
import { theme } from "../../gui/theme.js"
import { IconButton } from "../../gui/base/IconButton.js"

assertMainOrNode()
const className = "group-list"

export class ContactFormListView implements UpdatableSettingsViewer {
	private readonly listId: LazyLoaded<Id>
	private readonly customerInfo: LazyLoaded<CustomerInfo>

	private listModel: ListModel<ContactForm>
	private listStateSubscription: Stream<unknown> | null = null
	private readonly renderConfig: RenderConfig<ContactForm, ContactFormRow> = {
		itemHeight: size.list_row_height,
		multiselectionAllowed: MultiselectMode.Disabled,
		swipe: null,
		createElement: (dom) => {
			const contactFormRow = new ContactFormRow(this.customerInfo)
			m.render(dom, contactFormRow.render())
			return contactFormRow
		},
	}

	constructor(private readonly updateDetailsViewer: (viewer: ContactFormViewer | null) => unknown, private readonly focusDetailsViewer: () => unknown) {
		this.customerInfo = new LazyLoaded(() => locator.logins.getUserController().loadCustomerInfo())

		this.customerInfo.getAsync() // trigger loading so it is available later

		this.listId = new LazyLoaded(() => {
			return locator.logins
				.getUserController()
				.loadCustomer()
				.then((customer) => {
					return locator.entityClient.load(CustomerContactFormGroupRootTypeRef, customer.customerGroup).then((root) => root.contactForms)
				})
		})

		this.listModel = this.makeListModel()

		this.listModel.loadInitial()

		// Old-style component hacks
		this.view = this.view.bind(this)
	}

	private makeListModel() {
		const listModel = new ListModel<ContactForm>({
			topId: GENERATED_MAX_ID,
			sortCompare: (a: ContactForm, b: ContactForm) => a.path.localeCompare(b.path),
			fetch: async (startId, count) => {
				if (startId !== GENERATED_MAX_ID) {
					throw new Error("fetch user group infos called for specific start id")
				}
				const listId = await this.listId.getAsync()
				// we return all contact forms because we have already loaded all contact forms and the scroll bar shall have the complete size.
				const contactForms = await locator.entityClient.loadAll(ContactFormTypeRef, listId)
				const items = await filterContactFormsForLocalAdmin(contactForms)
				return { items, complete: true }
			},
			loadSingle: (elementId) => {
				return this.listId.getAsync().then((listId) => {
					return locator.entityClient.load<ContactForm>(ContactFormTypeRef, [listId, elementId]).catch(
						ofClass(NotFoundError, () => {
							// we return null if the entity does not exist
							return null
						}),
					)
				})
			},
		})

		listModel.setFilter((item: ContactForm) => this.groupFilter(item))

		this.listStateSubscription?.end(true)
		this.listStateSubscription = listModel.stateStream.map((state) => {
			this.onSelectionChanged(onlySingleSelection(state))
			m.redraw()
		})

		return listModel
	}

	private readonly onSelectionChanged = memoized((item: ContactForm | null) => {
		if (item) {
			// const newSelectionModel = new GroupDetailsModel(item, locator.entityClient, m.redraw)
			this.customerInfo.getAsync().then((customerInfo) => {
				const whitelabelDomain = getWhitelabelDomain(customerInfo)
				const detailsViewer = item == null ? null : new ContactFormViewer(item, whitelabelDomain?.domain ?? null)
				this.updateDetailsViewer(detailsViewer)
			})
		}
	})

	private groupFilter = (item: ContactForm) => {
		if (locator.logins.getUserController().isGlobalAdmin()) {
			return true
		} else {
			const allAdministratedGroupIds = locator.logins
				.getUserController()
				.getLocalAdminGroupMemberships()
				.map((gm) => gm.group)
			return allAdministratedGroupIds.includes(item.targetGroup)
		}

		return false
	}

	view(): Children {
		return m(
			ListColumnWrapper,
			{
				headerContent: m(
					".flex.flex-end.center-vertically.plr-l.list-border-bottom",
					m(
						".mr-negative-s",
						m(IconButton, {
							title: "createContactForm_label",
							icon: Icons.Add,
							click: () => this.addButtonClicked(),
						}),
					),
				),
			},
			this.listModel.isEmptyAndDone()
				? m(ColumnEmptyMessageBox, {
						color: theme.list_message_bg,
						icon: Icons.Chat,
						message: "noEntries_msg",
				  })
				: m(List, {
						renderConfig: this.renderConfig,
						state: this.listModel.state,
						onLoadMore: () => this.listModel.loadMore(),
						onRetryLoading: () => this.listModel.retryLoading(),
						onStopLoading: () => this.listModel.stopLoading(),
						onSingleSelection: (item: ContactForm) => {
							this.listModel.onSingleSelection(item)
							this.focusDetailsViewer()
						},
						onSingleTogglingMultiselection: noOp,
						onRangeSelectionTowards: noOp,
				  } satisfies ListAttrs<ContactForm, ContactFormRow>),
		)
	}

	private addButtonClicked() {
		ContactFormEditor.show(null, true)
	}

	async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		for (const update of updates) {
			const { instanceListId, instanceId, operation } = update

			if (isUpdateForTypeRef(ContactFormTypeRef, update) && this.listId.isLoaded() && instanceListId === this.listId.getLoaded()) {
				await this.listModel.entityEventReceived(instanceId, operation)
			} else if (isUpdateForTypeRef(CustomerInfoTypeRef, update) && this.customerInfo.isLoaded()) {
				// a domain may have been added
				this.customerInfo.reset()

				await this.customerInfo.getAsync()

				this.listModel.reapplyFilter()
			}

			m.redraw()
		}
	}
}

export class ContactFormRow implements VirtualRow<ContactForm> {
	top: number = 0
	domElement: HTMLElement | null = null // set from List
	entity: ContactForm | null = null

	private pageTitleDom!: HTMLElement
	private urlDom!: HTMLElement
	private deletedIconDom!: HTMLElement
	private selectionUpdater!: SelectableRowSelectedSetter

	constructor(private readonly customerInfo: LazyLoaded<CustomerInfo>) {}

	update(contactForm: ContactForm, selected: boolean): void {
		this.entity = contactForm

		this.selectionUpdater(selected, false)

		// replace empty string with NBSP so that we always have a row
		this.pageTitleDom.textContent = getDefaultContactFormLanguage(contactForm.languages).pageTitle || NBSP

		if (this.customerInfo.isLoaded()) {
			const whitelabelDomain = getWhitelabelDomain(this.customerInfo.getLoaded())

			this.urlDom.textContent = getContactFormUrl(whitelabelDomain?.domain ?? null, contactForm.path)
		} else {
			this.urlDom.textContent = NBSP
		}
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
				m(".badge-line-height", {
					oncreate: (vnode) => (this.pageTitleDom = vnode.dom as HTMLElement),
				}),
				m(".flex-space-between", [
					m(".smaller", {
						oncreate: (vnode) => (this.urlDom = vnode.dom as HTMLElement),
					}),
					m(".icons.flex", [
						m(Icon, {
							icon: Icons.Trash,
							oncreate: (vnode) => (this.deletedIconDom = vnode.dom as HTMLElement),
							style: {
								display: "none",
							},
							class: "svg-list-accent-fg",
						}),
					]),
				]),
			]),
		)
	}
}

export function filterContactFormsForLocalAdmin(contactForms: ContactForm[]): Promise<ContactForm[]> {
	if (locator.logins.getUserController().isGlobalAdmin()) {
		return Promise.resolve(contactForms)
	} else {
		return getAdministratedGroupIds().then((allAdministratedGroupIds) => {
			return contactForms.filter((cf: ContactForm) => allAdministratedGroupIds.indexOf(cf.targetGroup) !== -1)
		})
	}
}
