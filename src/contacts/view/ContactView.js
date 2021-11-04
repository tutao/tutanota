// @flow
import m from "mithril"
import stream from "mithril/stream/stream.js"
import {ViewSlider} from "../../gui/base/ViewSlider"
import {ColumnType, ViewColumn} from "../../gui/base/ViewColumn"
import {ContactViewer} from "./ContactViewer"
import type {CurrentView} from "../../gui/base/Header"
import {Button} from "../../gui/base/Button"
import {ButtonColors, ButtonN, ButtonType} from "../../gui/base/ButtonN"
import {ContactEditor} from "../ContactEditor"
import type {Contact} from "../../api/entities/tutanota/Contact"
import {ContactTypeRef} from "../../api/entities/tutanota/Contact"
import {ContactListView} from "./ContactListView"
import {lang} from "../../misc/LanguageViewModel"
import {assertNotNull, neverNull, noOp} from "@tutao/tutanota-utils"
import {erase, load, loadAll, setup, update} from "../../api/main/Entity"
import {ContactMergeAction, GroupType, Keys, OperationType} from "../../api/common/TutanotaConstants"
import {assertMainOrNode, isApp} from "../../api/common/Env"
import type {Shortcut} from "../../misc/KeyManager"
import {keyManager} from "../../misc/KeyManager"
import {Icons} from "../../gui/base/icons/Icons"
import {utf8Uint8ArrayToString} from "@tutao/tutanota-utils"
import {Dialog} from "../../gui/base/Dialog"
import {fileController} from "../../file/FileController"
import {logins} from "../../api/main/LoginController"
import {vCardFileToVCards, vCardListToContacts} from "../VCardImporter"
import {LockedError, NotFoundError} from "../../api/common/error/RestError"
import {MultiContactViewer} from "./MultiContactViewer"
import {BootIcons} from "../../gui/base/icons/BootIcons"
import {showProgressDialog} from "../../gui/dialogs/ProgressDialog"
import {locator} from "../../api/main/MainLocator"
import {ContactMergeView} from "./ContactMergeView"
import {getMergeableContacts, mergeContacts} from "../ContactMergeUtils"
import {exportContacts} from "../VCardExporter"
import {MultiSelectionBar} from "../../gui/base/MultiSelectionBar"
import type {EntityUpdateData} from "../../api/main/EventController"
import {isUpdateForTypeRef} from "../../api/main/EventController"
import {navButtonRoutes, throttleRoute} from "../../misc/RouteChange"
import {NavButtonN} from "../../gui/base/NavButtonN"
import {styles} from "../../gui/styles"
import {size} from "../../gui/size"
import {FolderColumnView} from "../../gui/base/FolderColumnView"
import {flat} from "@tutao/tutanota-utils"
import {getGroupInfoDisplayName} from "../../api/common/utils/GroupUtils";
import {isSameId} from "../../api/common/utils/EntityUtils";
import type {ContactModel} from "../model/ContactModel"
import {createDropDownButton} from "../../gui/base/Dropdown";
import {ActionBar} from "../../gui/base/ActionBar"
import {SidebarSection} from "../../gui/SidebarSection"
import {ofClass, promiseMap} from "@tutao/tutanota-utils"
assertMainOrNode()

export class ContactView implements CurrentView {
	listColumn: ViewColumn;
	contactColumn: ViewColumn;
	folderColumn: ViewColumn;
	contactViewer: ?ContactViewer;
	viewSlider: ViewSlider;
	_contactList: ?ContactListView;
	_multiContactViewer: MultiContactViewer;
	view: Function;
	oncreate: Function;
	onremove: Function;
	_throttledSetUrl: (string) => void;

	constructor() {

		this._throttledSetUrl = throttleRoute()

		this.folderColumn = new ViewColumn({
				view: () => m(FolderColumnView, {
					button: styles.isUsingBottomNavigation() || !this._contactList
						? null
						: {
							label: "newContact_action",
							click: () => this.createNewContact(),
						},
					content: [
						m(SidebarSection, {
							name: () => getGroupInfoDisplayName(logins.getUserController().userGroupInfo)
						}, this.createContactFoldersExpanderChildren())
					],
					ariaLabel: "folderTitle_label"
				})
			},
			ColumnType.Foreground, size.first_col_min_width, size.first_col_max_width, () => lang.get("folderTitle_label")
		)

		this.listColumn = new ViewColumn({
			view: () => m(".list-column", [
				this._contactList ? m(this._contactList) : null,
			])
		}, ColumnType.Background, size.second_col_min_width, size.second_col_max_width, () => lang.get("contacts_label"))

		this.contactViewer = null

		this._multiContactViewer = new MultiContactViewer(this)

		const contactColumnTitle = () => {
			const contactList = this._contactList
			let selectedEntities = contactList ? contactList.list.getSelectedEntities() : []
			if (selectedEntities.length > 0 && contactList) {
				let selectedIndex = contactList.list._loadedEntities.indexOf(selectedEntities[0]) + 1
				return selectedIndex + "/" + contactList.list._loadedEntities.length
			} else {
				return ""
			}
		}
		this.contactColumn = new ViewColumn({
			view: () => m(".contact", this.contactViewer != null ? m(this.contactViewer) : m(this._multiContactViewer))
		}, ColumnType.Background, size.third_col_min_width, size.third_col_max_width, contactColumnTitle, () => lang.get("contacts_label")
			+ " " + contactColumnTitle())

		this.viewSlider = new ViewSlider([this.folderColumn, this.listColumn, this.contactColumn], "ContactView")

		this.view = (): Children => {
			return m("#contact.main-view", [
				m(this.viewSlider),
			])
		}

		this._setupShortcuts()

		locator.eventController.addEntityListener(updates => {
			return promiseMap(updates, update => this._processEntityUpdate(update)).then(noOp)
		})
	}

	createNewContact(): void {
		const contactList = this._contactList
		if (contactList) {
			new ContactEditor(locator.entityClient, null, contactList.listId, contactId => contactList.list.scrollToIdAndSelectWhenReceived(contactId)).show()
		}
	}

	headerRightView(): Children {
		if (this._contactList) {
			return m(ButtonN, {
				label: "newContact_action",
				click: () => this.createNewContact(),
				type: ButtonType.Action,
				icon: () => Icons.Add,
				colors: ButtonColors.Header,
			})
		} else {
			return null
		}
	}

	_setupShortcuts() {
		let shortcuts: Shortcut[] = [
			{
				key: Keys.UP,
				exec: () => this._contactList && this._contactList.list.selectPrevious(false),
				enabled: () => !!this._contactList,
				help: "selectPrevious_action"
			},
			{
				key: Keys.K,
				exec: () => this._contactList && this._contactList.list.selectPrevious(false),
				enabled: () => !!this._contactList,
				help: "selectPrevious_action"
			},
			{
				key: Keys.UP,
				shift: true,
				exec: () => this._contactList && this._contactList.list.selectPrevious(true),
				enabled: () => !!this._contactList,
				help: "addPrevious_action"
			},
			{
				key: Keys.K,
				shift: true,
				exec: () => this._contactList && this._contactList.list.selectPrevious(true),
				enabled: () => !!this._contactList,
				help: "addPrevious_action"
			},
			{
				key: Keys.DOWN,
				exec: () => this._contactList && this._contactList.list.selectNext(false),
				enabled: () => !!this._contactList,
				help: "selectNext_action"
			},
			{
				key: Keys.J,
				exec: () => this._contactList && this._contactList.list.selectNext(false),
				enabled: () => !!this._contactList,
				help: "selectNext_action"
			},
			{
				key: Keys.DOWN,
				shift: true,
				exec: () => this._contactList && this._contactList.list.selectNext(true),
				enabled: () => !!this._contactList,
				help: "addNext_action"
			},
			{
				key: Keys.J,
				shift: true,
				exec: () => this._contactList && this._contactList.list.selectNext(true),
				enabled: () => !!this._contactList,
				help: "addNext_action"
			},
			{
				key: Keys.DELETE,
				exec: () => this._deleteSelected() && true,
				enabled: () => !!this._contactList,
				help: "deleteContacts_action"
			},
			{
				key: Keys.N,
				exec: () => this.createNewContact(),
				enabled: () => !!this._contactList,
				help: "newContact_action"
			},
		]

		this.oncreate = () => keyManager.registerShortcuts(shortcuts)
		this.onremove = () => keyManager.unregisterShortcuts(shortcuts)
	}

	createContactFoldersExpanderChildren(): Children {
		let folderMoreButton = this.createFolderMoreButton()
		return m(".folders", [
			m(".folder-row.flex-space-between.plr-l.row-selected", [
				m(NavButtonN, {
					label: "all_contacts_label",
					icon: () => BootIcons.Contacts,
					href: () => m.route.get(),
				}),
				m(folderMoreButton),
			])
		])

	}

	createFolderMoreButton(): Button {
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
				new Button("exportVCard_action", () => exportAsVCard(locator.contactModel), () => Icons.Export).setType(ButtonType.Dropdown)
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
						const flatvCards = flat(vCardsList)
						const contactMembership =
							assertNotNull(logins.getUserController().user.memberships.find(m => m.groupType === GroupType.Contact))
						const contactList = vCardListToContacts(flatvCards, contactMembership.group)
						return locator
							.contactModel
							.contactListId()
							.then(contactListId => promiseMap(contactList, (contact) => setup(contactListId, contact)))
							.then(() => contactList.length)
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
		return showProgressDialog("pleaseWait_msg", locator.contactModel.contactListId().then(contactListId => {
			return contactListId ? loadAll(ContactTypeRef, contactListId) : []
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
						.catch(ofClass(NotFoundError, noOp))
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
			locator.contactModel.contactListId().then(contactListId => {
				contactListId && this._setUrl(`/contact/${contactListId}`)
			})
		} else if (!this._contactList && args.listId) {
			// we have to check if the given list id is correct
			locator.contactModel.contactListId().then(async contactListId => {
				if (args.listId !== contactListId) {
					contactListId && this._setUrl(`/contact/${contactListId}`)
				} else {
					this._contactList = new ContactListView(args.listId, this)
					await this._contactList.list.loadInitial(args.contactId)
				}
				m.redraw()
			})
		} else if (this._contactList && args.listId === this._contactList.listId && args.contactId
			&& !this._contactList.list.isEntitySelected(args.contactId)) {
			this._contactList.list.scrollToIdAndSelect(args.contactId)
		}
	}

	/**
	 * Sets a new url for the contact button in the header bar and navigates to the url.
	 */
	_setUrl(url: string) {
		navButtonRoutes.contactsUrl = url
		// do not change the url if the search view is active
		if (m.route.get().startsWith("/contact")) {
			this._throttledSetUrl(url)
		}
	}

	_deleteSelected(): Promise<void> {
		const contactList = this._contactList
		if (!contactList) return Promise.resolve()
		return Dialog.confirm("deleteContacts_msg").then(confirmed => {
			if (confirmed) {
				contactList.list.getSelectedEntities().forEach(contact => {
					erase(contact)
						.catch(ofClass(NotFoundError, noOp))
						.catch(ofClass(LockedError, noOp))
				})
			}
		})
	}

	/**
	 * @pre the number of selected contacts is 2
	 */
	mergeSelected(): Promise<void> {
		const contactList = this._contactList
		if (contactList && contactList.list.getSelectedEntities().length === 2) {
			let keptContact = contactList.list.getSelectedEntities()[0]
			let goodbyeContact = contactList.list.getSelectedEntities()[1]

			if (!keptContact.presharedPassword || !goodbyeContact.presharedPassword
				|| (keptContact.presharedPassword === goodbyeContact.presharedPassword)) {
				return Dialog.confirm("mergeAllSelectedContacts_msg").then(confirmed => {
					if (confirmed) {
						mergeContacts(keptContact, goodbyeContact)
						return showProgressDialog("pleaseWait_msg",
							update(keptContact)
								.then(() => erase(goodbyeContact)))
							.catch(ofClass(NotFoundError, noOp))
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
		} else if (this._contactList) {
			this.contactViewer = null
			this._setUrl(`/contact/${this._contactList.listId}`)
		}
		m.redraw()
	}

	_processEntityUpdate(update: EntityUpdateData): Promise<void> {
		const {instanceListId, instanceId, operation} = update
		if (isUpdateForTypeRef(ContactTypeRef, update) && this._contactList && instanceListId === this._contactList.listId) {
			return this._contactList.list.entityEventReceived(instanceId, operation).then(() => {
				if (operation === OperationType.UPDATE && this.contactViewer && isSameId(this.contactViewer.contact._id,
					[neverNull(instanceListId), instanceId])) {
					return load(ContactTypeRef, this.contactViewer.contact._id).then(updatedContact => {
						this.contactViewer = new ContactViewer(updatedContact)
						m.redraw()
					})
				}
			})
		} else {
			return Promise.resolve()
		}
	}

	getViewSlider(): ?ViewSlider {
		return this.viewSlider
	}

	handleBackButton(): boolean {
		// only handle back button if viewing contact
		if (this.contactViewer) {
			this.contactViewer = null
			this.viewSlider.focus(this.listColumn)
			return true
		} else if (this._contactList && this._contactList.list.isMobileMultiSelectionActionActive()) {
			this._contactList.list.selectNone()
			return true
		}
		return false
	}

	/**
	 * Used by Header to figure out when content needs to be injected there
	 * @returns {Children} Mithril children or null
	 */
	headerView(): Children {
		const contactList = this._contactList
		if (this.viewSlider.getVisibleBackgroundColumns().length === 1 &&
			contactList &&
			contactList.list && contactList.list.isMobileMultiSelectionActionActive()
		) {
			return m(MultiSelectionBar, {
				selectNoneHandler: () => {
					contactList.list.selectNone()
				},
				selectedEntiesLength: contactList.list.getSelectedEntities().length,
				content: {
					view: () => m(ActionBar, {
						buttons: this._multiContactViewer.createActionBarButtons(() => {
							if (contactList) contactList.list.selectNone()
						}, false)
					})
				}
			})
		} else {
			return null
		}
	}
}

/**
 *Creates a vCard file with all contacts if at least one contact exists
 */
export function exportAsVCard(contactModel: ContactModel): Promise<void> {
	return showProgressDialog("pleaseWait_msg",
		contactModel.contactListId().then(contactListId => {
			if (!contactListId) return 0

			return loadAll(ContactTypeRef, contactListId).then((allContacts) => {
				if (allContacts.length === 0) {
					return 0
				} else {
					return exportContacts(allContacts).then(() => allContacts.length)
				}
			})
		})
	).then(nbrOfContacts => {
		if (nbrOfContacts === 0) {
			Dialog.error("noContacts_msg")
		}
	})
}
