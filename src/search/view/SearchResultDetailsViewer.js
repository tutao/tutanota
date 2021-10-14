//@flow
import m from "mithril"
import {SearchListView, SearchResultListEntry} from "./SearchListView"
import {MailTypeRef} from "../../api/entities/tutanota/Mail"
import {LockedError, NotFoundError} from "../../api/common/error/RestError"
import {update} from "../../api/main/Entity"
import {MailViewer} from "../../mail/view/MailViewer"
import {ContactViewer} from "../../contacts/view/ContactViewer"
import ColumnEmptyMessageBox from "../../gui/base/ColumnEmptyMessageBox"
import {ContactTypeRef} from "../../api/entities/tutanota/Contact"
import {assertMainOrNode} from "../../api/common/Env"
import {MultiSearchViewer} from "./MultiSearchViewer"
import {theme} from "../../gui/theme"
import {BootIcons} from "../../gui/base/icons/BootIcons"
import type {Mail} from "../../api/entities/tutanota/Mail"
import type {Contact} from "../../api/entities/tutanota/Contact"
import {noOp} from "../../api/common/utils/Utils"
import {locator} from "../../api/main/MainLocator"
import {isSameId} from "../../api/common/utils/EntityUtils";
import type {ButtonAttrs} from "../../gui/base/ButtonN"
import {isSameTypeRef} from "../../api/common/utils/TypeRef";
import {ofClass} from "../../api/common/utils/PromiseUtils"

assertMainOrNode()

export class SearchResultDetailsViewer {
	_listView: SearchListView;
	_viewer: ?MailViewer | ContactViewer | MultiSearchViewer;
	_viewerEntityId: ?IdTuple;
	_multiSearchViewer: MultiSearchViewer;

	constructor(list: SearchListView) {
		this._listView = list
		this._viewer = null
		this._viewerEntityId = null
		this._multiSearchViewer = new MultiSearchViewer(list)
	}

	view(): Children {
		let selected = this._listView.list ? this._listView.list.getSelectedEntities() : []
		if (selected.length === 0) {
			return m(".fill-absolute.mt-xs.plr-l", m(ColumnEmptyMessageBox, {
				message: "noSelection_msg",
				color: theme.content_message_bg,
				icon: isSameTypeRef(this._listView._lastType, MailTypeRef) ? BootIcons.Mail : BootIcons.Contacts,
			}))
		} else {
			return this._viewer ? m(this._viewer) : null
		}
	}

	isShownEntity(id: IdTuple): boolean {
		return this._viewerEntityId != null && isSameId(id, this._viewerEntityId)
	}

	showEntity(entity: Object, entitySelected: boolean): void {
		if (isSameTypeRef(MailTypeRef, entity._type)) {
			let mail = ((entity: any): Mail)
			this._viewer = new MailViewer(mail, true, locator.entityClient, locator.mailModel, locator.contactModel, locator.configFacade, Promise.resolve())
			this._viewerEntityId = mail._id
			if (entitySelected && mail.unread && !mail._errors) {
				mail.unread = false
				update(mail)
					.catch(ofClass(NotFoundError, e => console.log("could not set read flag as mail has been moved/deleted already", e)))
					.catch(ofClass(LockedError, noOp))
			}
			m.redraw()
		}
		if (isSameTypeRef(ContactTypeRef, entity._type)) {
			let contact = ((entity: any): Contact)
			this._viewer = new ContactViewer(contact)
			this._viewerEntityId = contact._id
			m.redraw()
		}
	}

	elementSelected(entries: SearchResultListEntry[], elementClicked: boolean, selectionChanged: boolean, multiSelectOperation: boolean): void {
		if (entries.length === 1
			&& !multiSelectOperation
			&& (selectionChanged || !this._viewer || this._viewer == this._multiSearchViewer)) {
			// set or update the visible mail
			this.showEntity(entries[0].entry, true)
		} else if (selectionChanged && (entries.length === 0 || multiSelectOperation)) {
			// remove the visible mail
			if (entries.length == 0) {
				this._viewer = null
				this._viewerEntityId = null
			} else {
				this._viewer = this._multiSearchViewer
			}
			//let url = `/mail/${this.mailList.listId}`
			//this._folderToUrl[this.selectedFolder._id[1]] = url
			//this._setUrl(url)
			m.redraw()
		} else if (selectionChanged) {
			// update the multi mail viewer
			m.redraw()
		}
	}

	multiSearchActionBarButtons(): ButtonAttrs[] {
		return this._multiSearchViewer.actionBarButtons()
	}
}
