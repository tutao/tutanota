// @flow
import m from "mithril"
import {ViewSlider} from "../gui/base/ViewSlider"
import {ViewColumn, ColumnType} from "../gui/base/ViewColumn"
import {worker} from "../api/main/WorkerClient"
import {ContactViewer} from "./ContactViewer"
import {header} from "../gui/base/Header"
import {Button, ButtonType} from "../gui/base/Button"
import {ContactEditor} from "./ContactEditor"
import {ContactTypeRef} from "../api/entities/tutanota/Contact"
import {ContactListView} from "./ContactListView"
import {TypeRef, isSameTypeRef, isSameId} from "../api/common/EntityFunctions"
import {lang} from "../misc/LanguageViewModel"
import {neverNull} from "../api/common/utils/Utils"
import {load} from "../api/main/Entity"
import type {OperationTypeEnum} from "../api/common/TutanotaConstants"
import {OperationType} from "../api/common/TutanotaConstants"
import {assertMainOrNode} from "../api/Env"
import MessageBox from "../gui/base/MessageBox"
import {keyManager, Keys} from "../misc/KeyManager"
import {Icons} from "../gui/base/icons/Icons"

assertMainOrNode()

export class ContactView {
	listColumn: ViewColumn;
	contactColumn: ViewColumn;
	contactViewer: ?ContactViewer;
	viewSlider: ViewSlider;
	_contactList: ContactListView;
	newAction: Button;
	view: Function;
	oncreate: Function;
	onbeforeremove: Function;

	constructor() {
		this.listColumn = new ViewColumn({
			view: () => m("list-column", [
				this._contactList ? m(this._contactList) : null,
			])
		}, ColumnType.Background, 300, 500, () => lang.get("contacts_label"))

		this.contactViewer = null

		let emptyMessageBox = new MessageBox("noContact_msg")
		this.contactColumn = new ViewColumn({
			view: () => m(".contact", this.contactViewer != null ? m(this.contactViewer) : m(emptyMessageBox))
		}, ColumnType.Background, 600, 2400, () => {
			let selectedEntities = this._contactList.list.getSelectedEntities();
			if (selectedEntities.length > 0) {
				let selectedIndex = this._contactList.list._loadedEntities.indexOf(selectedEntities[0]) + 1
				return selectedIndex + "/" + this._contactList.list._loadedEntities.length
			} else {
				return ""
			}
		})

		this.viewSlider = new ViewSlider([this.listColumn, this.contactColumn], "ContactView")
		this.newAction = new Button('newContact_action', () => this.createNewContact(), () => Icons.Add)
			.setType(ButtonType.Floating)

		this.view = (): VirtualElement => {
			return m("#contact.main-view", [
				m(this.viewSlider),
				this._contactList ? m(this.newAction) : null
			])
		}

		this._setupShortcuts()

		worker.getEntityEventController().addListener((typeRef: TypeRef<any>, listId: ?string, elementId: string, operation: OperationTypeEnum) => this.entityEventReceived(typeRef, listId, elementId, operation))
	}

	createNewContact() {
		return new ContactEditor(null, this._contactList.listId, contactId => this._contactList.list.scrollToIdAndSelectWhenReceived(contactId)).show()
	}


	_setupShortcuts() {
		let shortcuts = [
			{
				key: Keys.UP,
				exec: () => this._contactList.list.selectPrevious(false),
				help: "selectPrevious_action"
			},
			{
				key: Keys.DOWN,
				exec: () => this._contactList.list.selectNext(false),
				help: "selectNext_action"
			},
			{
				key: Keys.N,
				exec: () => (this.createNewContact():any),
				enabled: () => this._contactList,
				help: "newContact_action"
			},
		]

		this.oncreate = () => keyManager.registerShortcuts(shortcuts)
		this.onbeforeremove = () => keyManager.unregisterShortcuts(shortcuts)
	}


	/**
	 * Notifies the current view about changes of the url within its scope.
	 *
	 * @param args Object containing the optional parts of the url which are listId and contactId for the contact view.
	 */
	updateUrl(args: Object) {
		if (!this._contactList && !args.listId) {
			worker.getContactController().lazyContactListId.getAsync().then(contactListId => {
				this._setUrl(`/contact/${contactListId}`)
			})
		} else if (!this._contactList && args.listId) {
			// we have to check if the given list id is correct
			worker.getContactController().lazyContactListId.getAsync().then(contactListId => {
				if (args.listId != contactListId) {
					this._setUrl(`/contact/${contactListId}`)
				} else {
					this._contactList = new ContactListView(args.listId, (this:any)) // cast to avoid error in WebStorm
					this._contactList.list.loadInitial(args.contactId)
				}
			}).then(m.redraw)
		} else if (this._contactList && args.listId == this._contactList.listId && args.contactId && !this._contactList.list.isEntitySelected(args.contactId)) {
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

	elementSelected(contacts: Contact[], elementClicked: boolean, selectionChanged: boolean, multiSelectOperation: boolean): void {
		if (contacts.length == 1) {
			this.contactViewer = new ContactViewer(contacts[0], this)
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
		if (isSameTypeRef(typeRef, ContactTypeRef) && this._contactList && listId == this._contactList.listId) {
			this._contactList.list.entityEventReceived(elementId, operation).then(() => {
				if (operation == OperationType.UPDATE && this.contactViewer && isSameId(this.contactViewer.contact._id, [neverNull(listId), elementId])) {
					load(ContactTypeRef, this.contactViewer.contact._id).then(updatedContact => {
						this.contactViewer = new ContactViewer(updatedContact, this)
						m.redraw()
					})
				}
			})
		}
	}
}
