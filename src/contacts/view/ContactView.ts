import m, { Children, Vnode } from "mithril"
import { ViewSlider } from "../../gui/nav/ViewSlider.js"
import { ColumnType, ViewColumn } from "../../gui/base/ViewColumn"
import { AppHeaderAttrs, Header } from "../../gui/Header.js"
import { ButtonColor, ButtonType } from "../../gui/base/Button.js"
import { ContactEditor } from "../ContactEditor"
import type { Contact } from "../../api/entities/tutanota/TypeRefs.js"
import { ContactTypeRef } from "../../api/entities/tutanota/TypeRefs.js"
import { ContactListView } from "./ContactListView"
import { lang } from "../../misc/LanguageViewModel"
import { clear, noOp, ofClass } from "@tutao/tutanota-utils"
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
import { MultiselectMode } from "../../gui/base/NewList.js"
import { EnterMultiselectIconButton } from "../../gui/EnterMultiselectIconButton.js"
import { selectionAttrsForList } from "../../misc/ListModel.js"
import { ContactViewModel } from "./ContactViewModel.js"
import { listSelectionKeyboardShortcuts } from "../../gui/base/ListUtils.js"

assertMainOrNode()

export interface ContactViewAttrs extends TopLevelAttrs {
	drawerAttrs: DrawerMenuAttrs
	header: AppHeaderAttrs
	contactViewModel: ContactViewModel
}

export class ContactView extends BaseTopLevelView implements TopLevelView<ContactViewAttrs> {
	private listColumn: ViewColumn
	private contactColumn: ViewColumn
	private folderColumn: ViewColumn
	private viewSlider: ViewSlider
	private contactViewModel: ContactViewModel

	oncreate: TopLevelView["oncreate"]
	onremove: TopLevelView["onremove"]

	constructor(vnode: Vnode<ContactViewAttrs>) {
		super()
		this.contactViewModel = vnode.attrs.contactViewModel

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
					m(BackgroundColumnLayout, {
						backgroundColor: theme.navigation_bg,
						columnLayout: m(ContactListView, {
							contactViewModel: this.contactViewModel,
							onSingleSelection: () => {
								this.viewSlider.focus(this.contactColumn)
							},
						}),
						desktopToolbar: () => this.renderListToolbar(),
						mobileHeader: () =>
							this.contactViewModel.listModel.state.inMultiselect
								? m(MultiselectMobileHeader, {
										...selectionAttrsForList(this.contactViewModel.listModel),
										message: getContactSelectionMessage(this.getSelectedContacts()),
								  })
								: m(MobileHeader, {
										...vnode.attrs.header,
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
					}),
			},
			ColumnType.Background,
			size.second_col_min_width,
			size.second_col_max_width,
			() => lang.get("contacts_label"),
		)

		this.contactColumn = new ViewColumn(
			{
				view: () => {
					const contacts = this.getSelectedContacts()
					return m(BackgroundColumnLayout, {
						backgroundColor: theme.navigation_bg,
						desktopToolbar: () => m(DesktopViewerToolbar, this.contactViewerActions(contacts)),
						mobileHeader: () =>
							m(MobileHeader, {
								...vnode.attrs.header,
								backAction: () => this.viewSlider.focusPreviousColumn(),
								actions: null,
								multicolumnActions: () => this.contactViewerActions(contacts),
								primaryAction: () => this.renderHeaderRightView(),
								title: lang.get("contacts_label"),
								columnType: "other",
							}),
						columnLayout: m(
							".fill-absolute.flex.col.scroll",
							this.showingListView()
								? m(MultiContactViewer, {
										selectedEntities: contacts,
										selectNone: () => this.contactViewModel.listModel.selectNone(),
								  })
								: m(ContactCardViewer, {
										contact: contacts[0],
										onWriteMail: writeMail,
								  }),
						),
					})
				},
			},
			ColumnType.Background,
			size.third_col_min_width,
			size.third_col_max_width,
			undefined,
			() => lang.get("contacts_label"),
		)
		this.viewSlider = new ViewSlider([this.folderColumn, this.listColumn, this.contactColumn], "ContactView")

		const shortcuts = this.getShortcuts()
		this.oncreate = (vnode) => {
			keyManager.registerShortcuts(shortcuts)
		}

		this.onremove = () => {
			keyManager.unregisterShortcuts(shortcuts)
		}
	}

	private contactViewerActions(contacts: Contact[]) {
		return m(ContactViewerActions, {
			contacts,
			onEdit: (c) => this.editContact(c),
			onExport: exportContacts,
			onDelete: deleteContacts,
			onMerge: confirmMerge,
		})
	}

	private showingListView() {
		return this.getSelectedContacts().length === 0 || this.contactViewModel.listModel.state.inMultiselect
	}

	view({ attrs }: Vnode<ContactViewAttrs>): Children {
		return m(
			"#contact.main-view",
			m(this.viewSlider, {
				header: styles.isSingleColumnLayout()
					? null
					: m(Header, {
							searchBar: () =>
								m(LazySearchBar, {
									placeholder: lang.get("searchContacts_placeholder"),
								}),
							...attrs.header,
					  }),
				bottomNav:
					styles.isSingleColumnLayout() && this.viewSlider.focusedColumn === this.contactColumn && !this.showingListView()
						? m(MobileContactActionBar, {
								editAction: () => this.editSelectedContact(),
								deleteAction: () => this._deleteSelected(),
						  })
						: styles.isSingleColumnLayout() &&
						  this.viewSlider.focusedColumn === this.listColumn &&
						  //this.showingListView()
						  this.contactViewModel.listModel.state.inMultiselect
						? m(MobileBottomActionBar, this.contactViewerActions(this.getSelectedContacts()))
						: m(BottomNav),
			}),
		)
	}

	private getSelectedContacts() {
		return this.contactViewModel.listModel.getSelectedAsArray()
	}

	createNewContact(): void {
		new ContactEditor(locator.entityClient, null, this.contactViewModel.contactListId, (contactId) => {
			// FIXME show new contact
			// contactList.list.scrollToIdAndSelectWhenReceived(contactId)
		}).show()
	}

	private editSelectedContact() {
		const firstSelected = this.getSelectedContacts()[0]
		if (!firstSelected) return
		this.editContact(firstSelected)
	}

	private editContact(contact: Contact) {
		new ContactEditor(locator.entityClient, contact).show()
	}

	private renderHeaderRightView(): Children {
		return m(IconButton, {
			title: "newContact_action",
			click: () => this.createNewContact(),
			icon: Icons.Add,
		})
	}

	private getShortcuts() {
		let shortcuts: Shortcut[] = [
			...listSelectionKeyboardShortcuts(MultiselectMode.Enabled, () => this.contactViewModel.listModel),
			{
				key: Keys.DELETE,
				exec: () => {
					this._deleteSelected()
					return true
				},
				help: "deleteContacts_action",
			},
			{
				key: Keys.N,
				exec: () => this.createNewContact(),
				help: "newContact_action",
			},
		]

		return shortcuts
	}

	createContactFoldersExpanderChildren(): Children {
		const button: NavButtonAttrs = {
			label: "all_contacts_label",
			icon: () => BootIcons.Contacts,
			href: () => m.route.get(),
			disableHoverBackground: true,
		}
		return m(".folders.mlr-button.border-radius-small.state-bg", { style: { background: isNavButtonSelected(button) ? stateBgHover : "" } }, [
			m(".folder-row.flex-space-between.plr-button.row-selected", [m(NavButton, button), this.renderFolderMoreButton()]),
		])
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
		this.contactViewModel.init(args.listId, args.contactId)
	}

	_deleteSelected(): Promise<void> {
		return deleteContacts(this.getSelectedContacts())
	}

	getViewSlider(): ViewSlider | null {
		return this.viewSlider
	}

	handleBackButton(): boolean {
		// only handle back button if viewing contact
		if (this.viewSlider.focusedColumn === this.contactColumn) {
			this.viewSlider.focus(this.listColumn)
			return true
		} else if (this.showingListView()) {
			this.contactViewModel.listModel.selectNone()

			return true
		}

		return false
	}

	private renderListToolbar() {
		return m(DesktopListToolbar, m(SelectAllCheckbox, selectionAttrsForList(this.contactViewModel.listModel)), this.renderSortByButton())
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
			contactList.forEach((contact) => {
				locator.entityClient.erase(contact).catch(ofClass(NotFoundError, noOp)).catch(ofClass(LockedError, noOp))
			})
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
