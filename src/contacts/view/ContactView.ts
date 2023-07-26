import m, { Children, Vnode } from "mithril"
import { ViewSlider } from "../../gui/nav/ViewSlider.js"
import { ColumnType, ViewColumn } from "../../gui/base/ViewColumn"
import { AppHeaderAttrs, Header } from "../../gui/Header.js"
import { Button, ButtonColor, ButtonType } from "../../gui/base/Button.js"
import { ContactEditor } from "../ContactEditor"
import type { Contact } from "../../api/entities/tutanota/TypeRefs.js"
import { ContactTypeRef } from "../../api/entities/tutanota/TypeRefs.js"
import { ContactListView } from "./ContactListView"
import { lang } from "../../misc/LanguageViewModel"
import { assertNotNull, clear, getFirstOrThrow, noOp, ofClass } from "@tutao/tutanota-utils"
import { ContactMergeAction, Keys } from "../../api/common/TutanotaConstants"
import { assertMainOrNode, isApp } from "../../api/common/Env"
import type { Shortcut } from "../../misc/KeyManager"
import { keyManager } from "../../misc/KeyManager"
import { Icons } from "../../gui/base/icons/Icons"
import { Dialog } from "../../gui/base/Dialog"
import { LockedError, NotFoundError } from "../../api/common/error/RestError"
import { getContactSelectionMessage, MultiContactViewer } from "./MultiContactViewer"
import { BootIcons } from "../../gui/base/icons/BootIcons"
import { showProgressDialog } from "../../gui/dialogs/ProgressDialog"
import { locator } from "../../api/main/MainLocator"
import { ContactMergeView } from "./ContactMergeView"
import { getMergeableContacts, mergeContacts } from "../ContactMergeUtils"
import { exportContacts } from "../VCardExporter"
import { isNavButtonSelected, NavButton, NavButtonAttrs } from "../../gui/base/NavButton.js"
import { styles } from "../../gui/styles"
import { size } from "../../gui/size"
import { FolderColumnView } from "../../gui/FolderColumnView.js"
import { getGroupInfoDisplayName } from "../../api/common/utils/GroupUtils"
import { SidebarSection } from "../../gui/SidebarSection"
import { attachDropdown, createDropdown, DropdownButtonAttrs } from "../../gui/base/Dropdown.js"
import { IconButton } from "../../gui/base/IconButton.js"
import { ButtonSize } from "../../gui/base/ButtonSize.js"
import { BottomNav } from "../../gui/nav/BottomNav.js"
import { DrawerMenuAttrs } from "../../gui/nav/DrawerMenu.js"
import { BaseTopLevelView } from "../../gui/BaseTopLevelView.js"
import { TopLevelAttrs, TopLevelView } from "../../TopLevelView.js"
import { stateBgHover } from "../../gui/builtinThemes.js"
import { ContactCardViewer } from "./ContactCardViewer.js"
import { MobileContactActionBar } from "./MobileContactActionBar.js"
import { appendEmailSignature } from "../../mail/signature/Signature.js"
import { PartialRecipient } from "../../api/common/recipients/Recipient.js"
import { newMailEditorFromTemplate } from "../../mail/editor/MailEditor.js"
import { BackgroundColumnLayout } from "../../gui/BackgroundColumnLayout.js"
import { theme } from "../../gui/theme.js"
import { DesktopListToolbar, DesktopViewerToolbar } from "../../gui/DesktopToolbars.js"
import { SelectAllCheckbox } from "../../gui/SelectAllCheckbox.js"
import { ContactViewerActions } from "./ContactViewerActions.js"
import { MobileBottomActionBar } from "../../gui/MobileBottomActionBar.js"
import { exportAsVCard, importAsVCard } from "./ImportAsVCard.js"
import { MobileHeader } from "../../gui/MobileHeader.js"
import { LazySearchBar } from "../../misc/LazySearchBar.js"
import { MultiselectMobileHeader } from "../../gui/MultiselectMobileHeader.js"
import { MultiselectMode } from "../../gui/base/List.js"
import { EnterMultiselectIconButton } from "../../gui/EnterMultiselectIconButton.js"
import { selectionAttrsForList } from "../../misc/ListModel.js"
import { ContactViewModel } from "./ContactViewModel.js"
import { listSelectionKeyboardShortcuts } from "../../gui/base/ListUtils.js"
import { ContactListInfo, ContactListViewModel } from "./ContactListViewModel.js"
import { ContactListRecipientView } from "./ContactListRecipientView.js"
import { showContactListEditor, showContactListNameEditor } from "../ContactListEditor.js"
import { ContactListEntryViewer, getContactListEntriesSelectionMessage } from "./ContactListEntryViewer.js"
import { showPlanUpgradeRequiredDialog } from "../../misc/SubscriptionDialogs.js"
import ColumnEmptyMessageBox from "../../gui/base/ColumnEmptyMessageBox.js"

assertMainOrNode()

export interface ContactViewAttrs extends TopLevelAttrs {
	drawerAttrs: DrawerMenuAttrs
	header: AppHeaderAttrs
	contactViewModel: ContactViewModel
	contactListViewModel: ContactListViewModel
}

export class ContactView extends BaseTopLevelView implements TopLevelView<ContactViewAttrs> {
	private listColumn: ViewColumn
	private folderColumn: ViewColumn
	private viewSlider: ViewSlider
	private contactViewModel: ContactViewModel
	private contactListViewModel: ContactListViewModel
	private detailsColumn: ViewColumn

	oncreate: TopLevelView["oncreate"]
	onremove: TopLevelView["onremove"]

	constructor(vnode: Vnode<ContactViewAttrs>) {
		super()
		this.contactViewModel = vnode.attrs.contactViewModel
		this.contactListViewModel = vnode.attrs.contactListViewModel
		// safe to call multiple times but we need to do it early to load the contact list groups
		this.contactListViewModel.init()

		this.folderColumn = new ViewColumn(
			{
				view: () =>
					m(FolderColumnView, {
						drawer: vnode.attrs.drawerAttrs,
						button: styles.isUsingBottomNavigation()
							? null
							: {
									type: ButtonType.FolderColumnHeader,
									label: "newContact_action",
									click: () => this.createNewContact(),
							  },
						content: [
							m(
								SidebarSection,
								{
									name: () => getGroupInfoDisplayName(locator.logins.getUserController().userGroupInfo),
								},
								this.createContactFoldersExpanderChildren(),
							),
						],
						ariaLabel: "folderTitle_label",
					}),
			},
			ColumnType.Foreground,
			size.first_col_min_width,
			size.first_col_max_width,
			() => lang.get("folderTitle_label"),
		)
		this.listColumn = new ViewColumn(
			{
				view: () =>
					this.inContactListView() ? this.renderContactListRecipientColumn(vnode.attrs.header) : this.renderContactListColumn(vnode.attrs.header),
			},
			ColumnType.Background,
			size.second_col_min_width,
			size.second_col_max_width,
			() => this.getHeaderLabel(),
		)

		this.detailsColumn = new ViewColumn(
			{
				view: () =>
					m(BackgroundColumnLayout, {
						backgroundColor: theme.navigation_bg,
						desktopToolbar: () => m(DesktopViewerToolbar, this.detailsViewerActions()),
						mobileHeader: () =>
							m(MobileHeader, {
								...vnode.attrs.header,
								backAction: () => this.viewSlider.focusPreviousColumn(),
								actions: null,
								multicolumnActions: () => this.detailsViewerActions(),
								primaryAction: () => this.renderHeaderRightView(),
								title: this.getHeaderLabel(),
								columnType: "other",
							}),
						columnLayout:
							// see comment for .scrollbar-gutter-stable-or-fallback
							m(".fill-absolute.flex.col.overflow-y-scroll", this.renderDetailsViewer()),
					}),
			},
			ColumnType.Background,
			size.third_col_min_width,
			size.third_col_max_width,
			undefined,
			() => this.getHeaderLabel(),
		)

		this.viewSlider = new ViewSlider([this.folderColumn, this.listColumn, this.detailsColumn])

		const shortcuts = this.getShortcuts()
		this.oncreate = (vnode) => {
			keyManager.registerShortcuts(shortcuts)
		}

		this.onremove = () => {
			keyManager.unregisterShortcuts(shortcuts)
		}
	}

	private renderContactListColumn(header: AppHeaderAttrs) {
		return m(BackgroundColumnLayout, {
			backgroundColor: theme.navigation_bg,
			columnLayout: m(ContactListView, {
				contactViewModel: this.contactViewModel,
				onSingleSelection: () => {
					this.viewSlider.focus(this.detailsColumn)
				},
			}),
			desktopToolbar: () => this.renderListToolbar(),
			mobileHeader: () =>
				this.contactViewModel.listModel.state.inMultiselect
					? m(MultiselectMobileHeader, {
							...selectionAttrsForList(this.contactViewModel.listModel),
							message: getContactSelectionMessage(this.getSelectedContacts().length),
					  })
					: m(MobileHeader, {
							...header,
							backAction: () => this.viewSlider.focusPreviousColumn(),
							columnType: "first",
							title: this.listColumn.getTitle(),
							actions: m(".flex", [
								this.renderSortByButton(),
								m(EnterMultiselectIconButton, {
									clickAction: () => {
										this.contactViewModel.listModel.enterMultiselect()
									},
								}),
							]),
							primaryAction: () => this.renderHeaderRightView(),
					  }),
		})
	}

	private renderContactListRecipientColumn(header: AppHeaderAttrs) {
		return m(BackgroundColumnLayout, {
			backgroundColor: theme.navigation_bg,
			columnLayout: m(ContactListRecipientView, {
				viewModel: this.contactListViewModel,
				focusDetailsViewer: () => {
					this.viewSlider.focus(this.detailsColumn)
				},
			}),
			desktopToolbar: () => this.renderListToolbar(),
			mobileHeader: () =>
				this.contactListViewModel.listModel?.state.inMultiselect
					? m(MultiselectMobileHeader, {
							...selectionAttrsForList(this.contactListViewModel.listModel),
							message: getContactSelectionMessage(this.contactListViewModel.listModel?.getSelectedAsArray().length),
					  })
					: m(MobileHeader, {
							...header,
							backAction: () => this.viewSlider.focusPreviousColumn(),
							columnType: "first",
							title: this.listColumn.getTitle(),
							actions: m(".flex", [
								m(EnterMultiselectIconButton, {
									clickAction: () => {
										this.contactListViewModel.listModel?.enterMultiselect()
									},
								}),
							]),
							primaryAction: () => {
								return m(IconButton, {
									title: () => "Add Recipients",
									click: () => this.addRecipientsToList(),
									icon: Icons.Add,
								})
							},
					  }),
		})
	}

	private detailsViewerActions() {
		if (this.inContactListView()) {
			const recipients = this.contactListViewModel.getSelectedContactListEntries()
			if (recipients && recipients.length > 0) {
				return m(IconButton, {
					title: "delete_action",
					icon: Icons.Trash,
					click: () => this.contactListViewModel.deleteContactListEntries(recipients),
				})
			}
		} else {
			const contacts = this.getSelectedContacts()
			return m(ContactViewerActions, {
				contacts,
				onEdit: (c) => this.editContact(c),
				onExport: exportContacts,
				onDelete: deleteContacts,
				onMerge: confirmMerge,
			})
		}
	}

	private inContactListView() {
		return m.route.get().startsWith("/contactlist")
	}

	private showingListView() {
		return this.inContactListView()
			? this.contactListViewModel.getSelectedContactListEntries()?.length === 0 || this.contactListViewModel.listModel?.state.inMultiselect
			: this.getSelectedContacts().length === 0 || this.contactViewModel.listModel.state.inMultiselect
	}

	view({ attrs }: Vnode<ContactViewAttrs>): Children {
		return m(
			"#contact.main-view",
			m(this.viewSlider, {
				header: styles.isSingleColumnLayout()
					? null
					: m(Header, {
							searchBar: () =>
								this.inContactListView()
									? null
									: m(LazySearchBar, {
											placeholder: lang.get("searchContacts_placeholder"),
									  }),
							...attrs.header,
					  }),
				bottomNav:
					styles.isSingleColumnLayout() && this.viewSlider.focusedColumn === this.detailsColumn && !this.showingListView()
						? this.inContactListView()
							? m(MobileContactActionBar, {
									deleteAction: () => this.contactListViewModel.deleteSelectedEntries(),
							  })
							: m(MobileContactActionBar, {
									editAction: () => this.editSelectedContact(),
									deleteAction: () => this.deleteSelectedContacts(),
							  })
						: (styles.isSingleColumnLayout() &&
								this.viewSlider.focusedColumn === this.listColumn &&
								this.contactViewModel.listModel.state.inMultiselect) ||
						  this.contactListViewModel.listModel?.state.inMultiselect
						? m(MobileBottomActionBar, this.detailsViewerActions())
						: m(BottomNav),
			}),
		)
	}

	private getHeaderLabel(): string {
		if (this.inContactListView()) {
			return lang.get("contactLists_label")
		} else {
			return lang.get("contacts_label")
		}
	}

	private getSelectedContacts() {
		return this.contactViewModel.listModel.getSelectedAsArray()
	}

	private async getContactListId() {
		if (m.route.get().startsWith("/contacts")) {
			return this.contactViewModel.contactListId
		} else {
			return assertNotNull(await this.contactListViewModel.getContactListId())
		}
	}

	async createNewContact() {
		let listId = await this.getContactListId()
		new ContactEditor(locator.entityClient, null, listId, (contactId) => {
			// FIXME show new contact
			// contactList.list.scrollToIdAndSelectWhenReceived(contactId)
		}).show()
	}

	private editSelectedContact() {
		const firstSelected = this.getSelectedContacts()[0]
		if (!firstSelected) return
		this.editContact(firstSelected)
	}

	private editContact(contact: Contact, listId?: Id) {
		new ContactEditor(locator.entityClient, contact, listId).show()
	}

	private renderHeaderRightView(): Children {
		return m(IconButton, {
			title: "newContact_action",
			click: () => this.createNewContact(),
			icon: Icons.Add,
		})
	}

	private renderDetailsViewer(): Children {
		if (this.inContactListView()) {
			const entries = this.contactListViewModel.getSelectedContactListEntries() ?? []
			return this.contactListViewModel.listModel == null || this.showingListView()
				? m(ColumnEmptyMessageBox, {
						message: () => getContactListEntriesSelectionMessage(entries),
						icon: Icons.People,
						color: theme.content_message_bg,
						bottomContent:
							entries.length > 0
								? m(Button, {
										label: "cancel_action",
										type: ButtonType.Secondary,
										click: () => this.contactListViewModel.listModel?.selectNone(),
								  })
								: undefined,
						backgroundColor: theme.navigation_bg,
				  })
				: m(ContactListEntryViewer, {
						entry: getFirstOrThrow(entries),
						contacts: this.contactListViewModel.contactsForSelectedEntry,
						contactEdit: (c: Contact) => this.editContact(c),
						contactDelete: deleteContacts,
						contactCreate: async (c: Contact) => {
							let listId = await this.getContactListId()
							this.editContact(c, listId)
						},
						onWriteMail: writeMail,
						selectNone: () => this.contactListViewModel.listModel?.selectNone(),
				  })
		} else {
			const contacts = this.getSelectedContacts()
			return this.showingListView()
				? m(MultiContactViewer, {
						selectedEntities: contacts,
						selectNone: () => this.contactViewModel.listModel.selectNone(),
				  })
				: m(ContactCardViewer, {
						contact: contacts[0],
						onWriteMail: writeMail,
				  })
		}
	}

	private getShortcuts() {
		let shortcuts: Shortcut[] = [
			...listSelectionKeyboardShortcuts(MultiselectMode.Enabled, () => {
				return this.inContactListView() ? this.contactListViewModel.listModel : this.contactViewModel.listModel
			}),
			{
				key: Keys.DELETE,
				exec: () => {
					if (this.inContactListView()) {
						this.contactListViewModel.deleteSelectedEntries()
					} else {
						this.deleteSelectedContacts()
					}
					return true
				},
				help: "deleteContacts_action",
			},
			{
				key: Keys.N,
				exec: () => {
					this.createNewContact()
				},
				help: "newContact_action",
			},
		]

		return shortcuts
	}

	createContactFoldersExpanderChildren(): Children {
		const button: NavButtonAttrs = {
			label: "all_contacts_label",
			icon: () => BootIcons.Contacts,
			href: () => `/contact`,
			click: () => this.viewSlider.focus(this.listColumn),
			disableHoverBackground: true,
		}

		return [
			m(".folders.mlr-button.border-radius-small.state-bg", { style: { background: isNavButtonSelected(button) ? stateBgHover : "" } }, [
				m(".folder-row.flex-space-between.plr-button.row-selected", [m(NavButton, button), this.renderFolderMoreButton()]),
			]),
			m(
				SidebarSection,
				{
					name: "contactLists_label",
					button: m(IconButton, {
						icon: Icons.Add,
						size: ButtonSize.Compact,
						title: "addContactList_action",
						click: () => {
							this.addContactList()
						},
					}),
				},
				[
					this.contactListViewModel.contactListInfo
						.sort((a, b) => a.name.localeCompare(b.name))
						.map((tl) => {
							return this.renderContactListRow(tl)
						}),
				],
			),
		]
	}

	private renderFolderMoreButton(): Children {
		return m(
			IconButton,
			attachDropdown({
				mainButtonAttrs: {
					title: "more_label",
					icon: Icons.More,
					size: ButtonSize.Compact,
					colors: ButtonColor.Nav,
				},
				childAttrs: () => {
					const vcardButtons: Array<DropdownButtonAttrs> = isApp()
						? []
						: [
								{
									label: "importVCard_action",
									click: () => importAsVCard(),
									icon: Icons.ContactImport,
								},
								{
									label: "exportVCard_action",
									click: () => exportAsVCard(locator.contactModel),
									icon: Icons.Export,
								},
						  ]

					return vcardButtons.concat([
						{
							label: "merge_action",
							icon: Icons.People,
							click: () => this._mergeAction(),
						},
					])
				},
				width: 250,
			}),
		)
	}

	private renderContactListRow(contactListInfo: ContactListInfo) {
		const contactListButton: NavButtonAttrs = {
			label: () => contactListInfo.name,
			icon: () => Icons.People,
			href: () => `/contactlist/${contactListInfo.groupRoot.recipients}`,
			disableHoverBackground: true,
			click: () => {
				this.contactListViewModel.updateSelectedContactList(contactListInfo.groupRoot.recipients)
				this.viewSlider.focus(this.listColumn)
			},
		}

		const moreButton = this.createContactListMoreButton(contactListInfo)

		return m(".folders.mlr-button.border-radius-small.state-bg", { style: { background: isNavButtonSelected(contactListButton) ? stateBgHover : "" } }, [
			m(".folder-row.flex-space-between.plr-button.row-selected", [
				m(NavButton, contactListButton),
				m(IconButton, {
					...moreButton,
					onblur: () => {
						m.redraw()
					},
				}),
			]),
		])
	}

	createContactListMoreButton(contactListInfo: ContactListInfo) {
		return attachDropdown({
			mainButtonAttrs: {
				title: "more_label",
				icon: Icons.More,
				colors: ButtonColor.Nav,
				size: ButtonSize.Compact,
			},
			childAttrs: () => {
				return [
					{
						label: "edit_action",
						icon: Icons.Edit,
						click: () => {
							showContactListNameEditor(contactListInfo.name, (newName) =>
								this.contactListViewModel.updateContactList(contactListInfo, newName, []),
							)
						},
					},
					{
						label: "delete_action",
						icon: Icons.Trash,
						click: async () => {
							if (await Dialog.confirm("confirmDeleteContactList_msg")) {
								this.contactListViewModel.deleteContactList(contactListInfo)
							}
						},
					},
				]
			},
		})
	}

	_mergeAction(): Promise<void> {
		return showProgressDialog(
			"pleaseWait_msg",
			locator.contactModel.contactListId().then((contactListId) => {
				return contactListId ? locator.entityClient.loadAll(ContactTypeRef, contactListId) : []
			}),
		).then((allContacts) => {
			if (allContacts.length === 0) {
				Dialog.message("noContacts_msg")
			} else {
				let mergeableAndDuplicates = getMergeableContacts(allContacts)
				let deletePromise = Promise.resolve()

				if (mergeableAndDuplicates.deletable.length > 0) {
					deletePromise = Dialog.confirm(() =>
						lang.get("duplicatesNotification_msg", {
							"{1}": mergeableAndDuplicates.deletable.length,
						}),
					).then((confirmed) => {
						if (confirmed) {
							// delete async in the background
							mergeableAndDuplicates.deletable.forEach((dc) => {
								locator.entityClient.erase(dc)
							})
						}
					})
				}

				deletePromise.then(() => {
					if (mergeableAndDuplicates.mergeable.length === 0) {
						Dialog.message(() => lang.get("noSimilarContacts_msg"))
					} else {
						this._showMergeDialogs(mergeableAndDuplicates.mergeable).then((canceled) => {
							if (!canceled) {
								Dialog.message(() => lang.get("noMoreSimilarContacts_msg"))
							}
						})
					}
				})
			}
		})
	}

	/**
	 * @returns True if the merging was canceled by the user, false otherwise
	 */
	_showMergeDialogs(mergable: Contact[][]): Promise<boolean> {
		let canceled = false

		if (mergable.length > 0) {
			let contact1 = mergable[0][0]
			let contact2 = mergable[0][1]
			let mergeDialog = new ContactMergeView(contact1, contact2)
			return mergeDialog
				.show()
				.then((action) => {
					// execute action here and update mergable
					if (action === ContactMergeAction.Merge) {
						this._removeFromMergableContacts(mergable, contact2)

						mergeContacts(contact1, contact2)
						return showProgressDialog(
							"pleaseWait_msg",
							locator.entityClient.update(contact1).then(() => locator.entityClient.erase(contact2)),
						).catch(ofClass(NotFoundError, noOp))
					} else if (action === ContactMergeAction.DeleteFirst) {
						this._removeFromMergableContacts(mergable, contact1)

						return locator.entityClient.erase(contact1)
					} else if (action === ContactMergeAction.DeleteSecond) {
						this._removeFromMergableContacts(mergable, contact2)

						return locator.entityClient.erase(contact2)
					} else if (action === ContactMergeAction.Skip) {
						this._removeFromMergableContacts(mergable, contact2)
					} else if (action === ContactMergeAction.Cancel) {
						clear(mergable)
						canceled = true
					}
				})
				.then(() => {
					if (!canceled && mergable.length > 0) {
						return this._showMergeDialogs(mergable)
					} else {
						return canceled
					}
				})
		} else {
			return Promise.resolve(canceled)
		}
	}

	/**
	 * removes the given contact from the given mergable arrays first entry (first or second element)
	 */
	_removeFromMergableContacts(mergable: Contact[][], contact: Contact) {
		if (mergable[0][0] === contact) {
			mergable[0].splice(0, 1) // remove contact1
		} else if (mergable[0][1] === contact) {
			mergable[0].splice(1, 1) // remove contact2
		}

		// remove the first entry if there is only one contact left in the first entry
		if (mergable[0].length <= 1) {
			mergable.splice(0, 1)
		}
	}

	onNewUrl(args: Record<string, any>) {
		if (this.inContactListView()) {
			this.contactListViewModel.showListAndEntry(args.listId, args.Id).then(m.redraw)
		} else {
			this.contactViewModel.init(args.listId, args.contactId)
		}
	}

	private deleteSelectedContacts(): Promise<void> {
		return deleteContacts(this.getSelectedContacts())
	}

	getViewSlider(): ViewSlider | null {
		return this.viewSlider
	}

	handleBackButton(): boolean {
		// only handle back button if viewing contact
		if (this.viewSlider.focusedColumn === this.detailsColumn) {
			this.viewSlider.focus(this.listColumn)
			return true
		} else if (this.showingListView()) {
			this.contactViewModel.listModel.selectNone()
			this.contactListViewModel.listModel?.selectNone()

			return true
		}

		return false
	}

	private renderListToolbar() {
		if (this.inContactListView()) {
			return m(
				DesktopListToolbar,
				m(SelectAllCheckbox, selectionAttrsForList(this.contactListViewModel.listModel)),
				m(".flex-grow"),
				m(IconButton, {
					title: "addEntries_action",
					icon: Icons.Add,
					click: () => {
						this.addRecipientsToList()
					},
				}),
			)
		} else {
			return m(DesktopListToolbar, m(SelectAllCheckbox, selectionAttrsForList(this.contactViewModel.listModel)), this.renderSortByButton())
		}
	}

	private addRecipientsToList() {
		showContactListEditor(
			null,
			null,
			lang.get("addEntries_action"),
			(name, addresses) => {
				this.contactListViewModel.addRecipientstoContactList(
					addresses,
					assertNotNull(this.contactListViewModel.getSelectedContactListInfo()?.groupRoot),
				)
			},
			false,
		)
	}

	private renderSortByButton() {
		return m(IconButton, {
			title: "sortBy_label",
			icon: Icons.ListOrdered,
			click: (e: MouseEvent, dom: HTMLElement) => {
				createDropdown({
					lazyButtons: () => [
						{
							label: "firstName_placeholder",
							click: () => {
								this.contactViewModel.setSortByFirstName(true)
							},
						},
						{
							label: "lastName_placeholder",
							click: () => {
								this.contactViewModel.setSortByFirstName(false)
							},
						},
					],
				})(e, dom)
			},
		})
	}

	private async addContactList() {
		if (await this.contactListViewModel.canCreateContactList()) {
			await showContactListEditor(null, null, "Create Recipient List", (name, recipients) => {
				this.contactListViewModel.addContactList(name, recipients)
			})
		} else {
			const { getAvailablePlansWithContactList } = await import("../../subscription/SubscriptionUtils.js")
			const plans = await getAvailablePlansWithContactList()
			await showPlanUpgradeRequiredDialog(plans)
		}
	}
}

export function writeMail(to: PartialRecipient, subject: string = ""): Promise<unknown> {
	return locator.mailModel.getUserMailboxDetails().then((mailboxDetails) => {
		return newMailEditorFromTemplate(
			mailboxDetails,
			{
				to: [to],
			},
			subject,
			appendEmailSignature("", locator.logins.getUserController().props),
		).then((editor) => editor.show())
	})
}

export function deleteContacts(contactList: Contact[]): Promise<void> {
	return Dialog.confirm("deleteContacts_msg").then((confirmed) => {
		if (confirmed) {
			for (const contact of contactList) {
				locator.entityClient.erase(contact).catch(ofClass(NotFoundError, noOp)).catch(ofClass(LockedError, noOp))
			}
		}
	})
}

export function confirmMerge(keptContact: Contact, goodbyeContact: Contact): Promise<void> {
	if (!keptContact.presharedPassword || !goodbyeContact.presharedPassword || keptContact.presharedPassword === goodbyeContact.presharedPassword) {
		return Dialog.confirm("mergeAllSelectedContacts_msg").then((confirmed) => {
			if (confirmed) {
				mergeContacts(keptContact, goodbyeContact)
				return showProgressDialog(
					"pleaseWait_msg",
					locator.entityClient.update(keptContact).then(() => locator.entityClient.erase(goodbyeContact)),
				).catch(ofClass(NotFoundError, noOp))
			}
		})
	} else {
		return Dialog.message("presharedPasswordsUnequal_msg")
	}
}
