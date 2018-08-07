// @flow
import m from "mithril"
import {ViewSlider} from "../gui/base/ViewSlider"
import {ViewColumn, ColumnType} from "../gui/base/ViewColumn"
import {ContactViewer} from "./ContactViewer"
import {header} from "../gui/base/Header"
import {Button, ButtonType, createDropDownButton, ButtonColors} from "../gui/base/Button"
import {ContactEditor} from "./ContactEditor"
import {ContactTypeRef} from "../api/entities/tutanota/Contact"
import {ContactListView} from "./ContactListView"
import {TypeRef, isSameTypeRef, isSameId} from "../api/common/EntityFunctions"
import {lang} from "../misc/LanguageViewModel"
import {neverNull, getGroupInfoDisplayName} from "../api/common/utils/Utils"
import {load, setup, erase, loadAll, update} from "../api/main/Entity"
import type {OperationTypeEnum} from "../api/common/TutanotaConstants"
import {OperationType, GroupType, ContactMergeAction} from "../api/common/TutanotaConstants"
import {assertMainOrNode, isApp} from "../api/Env"
import {keyManager, Keys} from "../misc/KeyManager"
import {Icons} from "../gui/base/icons/Icons"
import {utf8Uint8ArrayToString} from "../api/common/utils/Encoding"
import {Dialog} from "../gui/base/Dialog"
import {fileController} from "../file/FileController"
import {logins} from "../api/main/LoginController"
import {vCardFileToVCards, vCardListToContacts} from "./VCardImporter"
import {NotFoundError} from "../api/common/error/RestError"
import {MultiContactViewer} from "./MultiContactViewer"
import {NavButton} from "../gui/base/NavButton"
import {ExpanderButton, ExpanderPanel} from "../gui/base/Expander"
import {theme} from "../gui/theme"
import {BootIcons} from "../gui/base/icons/BootIcons"
import {showProgressDialog} from "../gui/base/ProgressDialog"
import {locator} from "../api/main/MainLocator"
import {LazyContactListId} from "../contacts/ContactUtils"
import {ContactMergeView} from "./ContactMergeView"
import {getMergeableContacts, mergeContacts} from "./ContactMergeUtils"
import {exportAsVCard} from "./VCardExporter"
import {MultiSelectionBar} from "../gui/base/MultiSelectionBar"


assertMainOrNode()

export class ContactView {
	listColumn: ViewColumn;
	contactColumn: ViewColumn;
	folderColumn: ViewColumn;
	contactViewer: ?ContactViewer;
	viewSlider: ViewSlider;
	_contactList: ContactListView;
	_multiContactViewer: MultiContactViewer;
	newAction: Button;
	view: Function;
	oncreate: Function;
	onbeforeremove: Function;

	constructor() {
		let expander = this.createContactFoldersExpander()

		this.folderColumn = new ViewColumn({
			view: () => m(".folder-column.scroll.overflow-x-hidden", [
				m(".mr-negative-s.flex-space-between.plr-l", m(expander)),
				m(expander.panel)
			])
		}, ColumnType.Foreground, 200, 300, () => lang.get("folderTitle_label"))

		this.listColumn = new ViewColumn({
			view: () => m(".list-column", [
				this._contactList ? m(this._contactList) : null,
			])
		}, ColumnType.Background, 300, 500, () => lang.get("contacts_label"))

		this.contactViewer = null

		this._multiContactViewer = new MultiContactViewer(this)
		this.contactColumn = new ViewColumn({
			view: () => m(".contact", this.contactViewer != null ? m(this.contactViewer) : m(this._multiContactViewer))
		}, ColumnType.Background, 600, 2400, () => {
			let selectedEntities = this._contactList.list.getSelectedEntities();
			if (selectedEntities.length > 0) {
				let selectedIndex = this._contactList.list._loadedEntities.indexOf(selectedEntities[0]) + 1
				return selectedIndex + "/" + this._contactList.list._loadedEntities.length
			} else {
				return ""
			}
		})

		this.viewSlider = new ViewSlider([this.folderColumn, this.listColumn, this.contactColumn], "ContactView")
		this.newAction = new Button('newContact_action', () => this.createNewContact(), () => Icons.Add)
			.setType(ButtonType.Floating)

		this.view = (): VirtualElement => {
			return m("#contact.main-view", [
				m(this.viewSlider),
				this._contactList ? m(this.newAction) : null
			])
		}

		this._setupShortcuts()

		locator.entityEvent.addListener((typeRef: TypeRef<any>, listId: ?string, elementId: string, operation: OperationTypeEnum) => this.entityEventReceived(typeRef, listId, elementId, operation))
	}

	createNewContact() {
		return new ContactEditor(null, this._contactList.listId, contactId => this._contactList.list.scrollToIdAndSelectWhenReceived(contactId)).show()
	}


	_setupShortcuts() {
		let shortcuts: Shortcut[] = [
			{
				key: Keys.UP,
				exec: () => this._contactList.list.selectPrevious(false),
				help: "selectPrevious_action"
			},
			{
				key: Keys.UP,
				shift: true,
				exec: () => this._contactList.list.selectPrevious(true),
				help: "addPrevious_action"
			},
			{
				key: Keys.DOWN,
				exec: () => this._contactList.list.selectNext(false),
				help: "selectNext_action"
			},
			{
				key: Keys.DOWN,
				shift: true,
				exec: () => this._contactList.list.selectNext(true),
				help: "addNext_action"
			},
			{
				key: Keys.DELETE,
				exec: () => this._deleteSelected() && true,
				help: "deleteContacts_action"
			},
			{
				key: Keys.N,
				exec: () => (this.createNewContact(): any),
				enabled: () => this._contactList,
				help: "newContact_action"
			},
		]

		this.oncreate = () => keyManager.registerShortcuts(shortcuts)
		this.onbeforeremove = () => keyManager.unregisterShortcuts(shortcuts)
	}

	createContactFoldersExpander(): ExpanderButton {
		let folderMoreButton = this.createFolderMoreButton()
		let folderButton = new NavButton('all_contacts_label', () => BootIcons.Contacts, () => m.route.get())
		let contactExpander = new ExpanderButton(() => getGroupInfoDisplayName(logins.getUserController().userGroupInfo), new ExpanderPanel({
				view: () => m(".folders", [
					m(".folder-row.flex-space-between.plr-l.row-selected", [
						m(folderButton),
						m(folderMoreButton)
					])
				])
			}), false, {}, theme.navigation_button
		)
		contactExpander.toggle()
		return contactExpander
	}

	createFolderMoreButton() {
		return createDropDownButton("more_label", () => Icons.More, () => this._vcardButtons().concat([
			new Button("merge_action", () => this._mergeAction(), () => Icons.People).setType(ButtonType.Dropdown)
		]), 250).setColors(ButtonColors.Nav)
	}

	_vcardButtons(): Button[] {
		if (isApp()) {
			return []
		} else {
			return [
				new Button('importVCard_action', () => this._importAsVCard(), () => Icons.ContactImport).setType(ButtonType.Dropdown),
				new Button("exportVCard_action", () => exportAsVCard(), () => Icons.Download).setType(ButtonType.Dropdown)
			]
		}
	}

	_importAsVCard() {
		fileController.showFileChooser(true, ["vcf"]).then((contactFiles) => {
			try {
				if (contactFiles.length > 0) {
					let vCardsList = contactFiles.map(contactFile => {
						let vCardFileData = utf8Uint8ArrayToString(contactFile.data)
						let vCards = vCardFileToVCards(vCardFileData)
						if (vCards == null) {
							throw new Error("no vcards found")
						} else {
							return vCards
						}
					})
					return showProgressDialog("pleaseWait_msg", Promise.resolve().then(() => {
						let flatvCards = vCardsList.reduce((sum, value) => sum.concat(value), [])
						let contactList = vCardListToContacts(flatvCards,
							neverNull(logins.getUserController()
							                .user
							                .memberships
							                .find(m => m.groupType === GroupType.Contact)).group)
						return LazyContactListId.getAsync().then(contactListId => {
							let promises = []
							contactList.forEach((contact) => {
								promises.push(setup(contactListId, contact))
							})
							return Promise.all(promises).then(() => {
								return promises.length
							})
						})
					}))
				}
			} catch (e) {
				console.log(e)
				Dialog.error("importVCardError_msg")
			}
		}).then(numberOfContacts => {
			if (numberOfContacts) {
				Dialog.error(() => lang.get("importVCardSuccess_msg", {"{1}": numberOfContacts}))
			}
		})
	}

	_mergeAction(): Promise<void> {
		return showProgressDialog("pleaseWait_msg", LazyContactListId.getAsync().then(contactListId => {
			return loadAll(ContactTypeRef, contactListId)
		})).then(allContacts => {
			if (allContacts.length === 0) {
				Dialog.error("noContacts_msg")
			} else {
				let mergeableAndDuplicates = getMergeableContacts(allContacts)
				let deletePromise = Promise.resolve()
				if (mergeableAndDuplicates.deletable.length > 0) {
					deletePromise = Dialog.confirm(() =>
						lang.get("duplicatesNotification_msg", {"{1}": mergeableAndDuplicates.deletable.length}))
					                      .then((confirmed) => {
						                      if (confirmed) {
							                      // delete async in the background
							                      mergeableAndDuplicates.deletable.forEach((dc) => {
								                      erase(dc)
							                      })
						                      }
					                      })
				}
				deletePromise.then(() => {
					if (mergeableAndDuplicates.mergeable.length === 0) {
						Dialog.error(() => lang.get("noSimilarContacts_msg"))
					} else {
						this._showMergeDialogs(mergeableAndDuplicates.mergeable).then(canceled => {
							if (!canceled) {
								Dialog.error(() => lang.get("noMoreSimilarContacts_msg"))
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
			return mergeDialog.show().then(action => {
				// execute action here and update mergable
				if (action === ContactMergeAction.Merge) {
					this._removeFromMergableContacts(mergable, contact2)
					mergeContacts(contact1, contact2)
					return showProgressDialog("pleaseWait_msg", update(contact1).then(() => erase(contact2)))
				} else if (action === ContactMergeAction.DeleteFirst) {
					this._removeFromMergableContacts(mergable, contact1)
					return erase(contact1)
				} else if (action === ContactMergeAction.DeleteSecond) {
					this._removeFromMergableContacts(mergable, contact2)
					return erase(contact2)
				} else if (action === ContactMergeAction.Skip) {
					this._removeFromMergableContacts(mergable, contact2)
				} else if (action === ContactMergeAction.Cancel) {
					mergable.length = 0
					canceled = true
				}
			}).then(() => {
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


	/**
	 * Notifies the current view about changes of the url within its scope.
	 *
	 * @param args Object containing the optional parts of the url which are listId and contactId for the contact view.
	 */
	updateUrl(args: Object) {
		if (!this._contactList && !args.listId) {
			LazyContactListId.getAsync().then(contactListId => {
				this._setUrl(`/contact/${contactListId}`)
			})
		} else if (!this._contactList && args.listId) {
			// we have to check if the given list id is correct
			LazyContactListId.getAsync().then(contactListId => {
				if (args.listId !== contactListId) {
					this._setUrl(`/contact/${contactListId}`)
				} else {
					this._contactList = new ContactListView(args.listId, (this: any)) // cast to avoid error in WebStorm
					this._contactList.list.loadInitial(args.contactId)
				}
			}).then(m.redraw)
		} else if (this._contactList && args.listId === this._contactList.listId && args.contactId
			&& !this._contactList.list.isEntitySelected(args.contactId)) {
			this._contactList.list.scrollToIdAndSelect(args.contactId)
		}
	}

	/**
	 * Sets a new url for the contact button in the header bar and navigates to the url.
	 */
	_setUrl(url: string) {
		header.contactsUrl = url
		m.route.set(url)
	}

	_deleteSelected(): Promise<void> {
		return Dialog.confirm("deleteContacts_msg").then(confirmed => {
			if (confirmed) {
				this._contactList.list.getSelectedEntities().forEach(contact => {
					erase(contact).catch(NotFoundError, e => {
						// ignore because the delete key shortcut may be executed again while the contact is already deleted
					})
				})
			}
		})
	}

	/**
	 * @pre the number of selected contacts is 2
	 */
	mergeSelected(): Promise<void> {
		if (this._contactList.list.getSelectedEntities().length === 2) {
			let keptContact = this._contactList.list.getSelectedEntities()[0]
			let goodbyeContact = this._contactList.list.getSelectedEntities()[1]

			if (!keptContact.presharedPassword || !goodbyeContact.presharedPassword
				|| (keptContact.presharedPassword === goodbyeContact.presharedPassword)) {
				return Dialog.confirm("mergeAllSelectedContacts_msg").then(confirmed => {
					if (confirmed) {
						mergeContacts(keptContact, goodbyeContact)
						return showProgressDialog("pleaseWait_msg", update(keptContact).then(() => {
							return erase(goodbyeContact).catch(NotFoundError, e => {
								// ignore
							})
						}))
					}
				})
			} else {
				return Dialog.error("presharedPasswordsUnequal_msg")
			}
		} else {
			return Promise.resolve()
		}
	}


	elementSelected(contacts: Contact[], elementClicked: boolean, selectionChanged: boolean, multiSelectOperation: boolean): void {
		if (contacts.length === 1 && !multiSelectOperation) {
			this.contactViewer = new ContactViewer(contacts[0])
			this._setUrl(`/contact/${contacts[0]._id.join("/")}`)
			if (elementClicked) {
				this.viewSlider.focus(this.contactColumn)
			}
		} else {
			this.contactViewer = null
			this._setUrl(`/contact/${this._contactList.listId}`)
		}
		m.redraw()
	}

	entityEventReceived<T>(typeRef: TypeRef<any>, listId: ?string, elementId: string, operation: OperationTypeEnum): void {
		if (isSameTypeRef(typeRef, ContactTypeRef) && this._contactList && listId === this._contactList.listId) {
			this._contactList.list.entityEventReceived(elementId, operation).then(() => {
				if (operation === OperationType.UPDATE && this.contactViewer && isSameId(this.contactViewer.contact._id,
					[neverNull(listId), elementId])) {
					load(ContactTypeRef, this.contactViewer.contact._id).then(updatedContact => {
						this.contactViewer = new ContactViewer(updatedContact)
						m.redraw()
					})
				}
			})
		}
	}


	/**
	 * Used by Header to figure out when content needs to be injected there
	 * @returns {Children} Mithril children or null
	 */
	headerView(): Children {
		return this.viewSlider.getVisibleBackgroundColumns().length === 1 && this._contactList && this._contactList.list
		&& this._contactList.list.isMobileMultiSelectionActionActive() ? m(MultiSelectionBar, {
			selectNoneHandler: () => this._contactList.list.selectNone(),
			selectedEntiesLength: this._contactList.list.getSelectedEntities().length,
			content: this._multiContactViewer.createActionBar(() => this._contactList.list.selectNone())
		}) : null
	}
}
