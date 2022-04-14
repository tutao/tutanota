import m, {Children} from "mithril"
import {SearchListView, SearchResultListEntry} from "./SearchListView"
import type {Mail} from "../../api/entities/tutanota/TypeRefs.js"
import {MailTypeRef} from "../../api/entities/tutanota/TypeRefs.js"
import {LockedError, NotFoundError} from "../../api/common/error/RestError"
import {createMailViewerViewModel, MailViewer} from "../../mail/view/MailViewer"
import {ContactViewer} from "../../contacts/view/ContactViewer"
import ColumnEmptyMessageBox from "../../gui/base/ColumnEmptyMessageBox"
import type {Contact} from "../../api/entities/tutanota/TypeRefs.js"
import {ContactTypeRef} from "../../api/entities/tutanota/TypeRefs.js"
import {assertMainOrNode} from "../../api/common/Env"
import {MultiSearchViewer} from "./MultiSearchViewer"
import {theme} from "../../gui/theme"
import {BootIcons} from "../../gui/base/icons/BootIcons"
import {isSameTypeRef, noOp, ofClass} from "@tutao/tutanota-utils"
import {locator} from "../../api/main/MainLocator"
import {isSameId} from "../../api/common/utils/EntityUtils"
import type {ButtonAttrs} from "../../gui/base/ButtonN"
import {MailViewerViewModel} from "../../mail/view/MailViewerViewModel"

assertMainOrNode()

type ViewMode =
	| {mode: "mail", viewModel: MailViewerViewModel}
	| {mode: "contact", viewer: ContactViewer}
	| {mode: "multiSearch", viewer: MultiSearchViewer}

export class SearchResultDetailsViewer {
	_viewer: ViewMode | null = null
	_viewerEntityId: IdTuple | null = null
	_multiSearchViewer: MultiSearchViewer

	constructor(private _listView: SearchListView) {
		this._multiSearchViewer = new MultiSearchViewer(this._listView)
	}

	view(): Children {
		let selected = this._listView.list ? this._listView.list.getSelectedEntities() : []

		if (selected.length === 0) {
			return m(
				".fill-absolute.mt-xs.plr-l",
				m(ColumnEmptyMessageBox, {
					message: "noSelection_msg",
					color: theme.content_message_bg,
					icon: isSameTypeRef(this._listView._lastType, MailTypeRef) ? BootIcons.Mail : BootIcons.Contacts,
				}),
			)
		} else {
			return this._viewer?.mode === "mail"
				? m(MailViewer, {viewModel: this._viewer.viewModel})
				: this._viewer != null
					? m(this._viewer.viewer)
					: null
		}
	}

	isShownEntity(id: IdTuple): boolean {
		return this._viewerEntityId != null && isSameId(id, this._viewerEntityId)
	}

	showEntity(entity: Record<string, any>, entitySelected: boolean): void {
		if (isSameTypeRef(MailTypeRef, entity._type)) {
			const mail = entity as Mail
			this._viewer = {
				mode: "mail",
				viewModel: createMailViewerViewModel({
					mail,
					showFolder: true,
				})
			}

			this._viewerEntityId = mail._id

			if (entitySelected && mail.unread && !mail._errors) {
				mail.unread = false
				locator.entityClient
					   .update(mail)
					   .catch(ofClass(NotFoundError, e => console.log("could not set read flag as mail has been moved/deleted already", e)))
					   .catch(ofClass(LockedError, noOp))
			}

			m.redraw()
		}

		if (isSameTypeRef(ContactTypeRef, entity._type)) {
			let contact = (entity as any) as Contact
			this._viewer = {mode: "contact", viewer: new ContactViewer(contact)}
			this._viewerEntityId = contact._id
			m.redraw()
		}
	}

	elementSelected(entries: SearchResultListEntry[], elementClicked: boolean, selectionChanged: boolean, multiSelectOperation: boolean): void {
		if (entries.length === 1 && !multiSelectOperation && (selectionChanged || !this._viewer || this._viewer.mode === "multiSearch")) {
			// set or update the visible mail
			this.showEntity(entries[0].entry, true)
		} else if (selectionChanged && (entries.length === 0 || multiSelectOperation)) {
			// remove the visible mail
			if (entries.length == 0) {
				this._viewer = null
				this._viewerEntityId = null
			} else {
				this._viewer = { mode: "multiSearch", viewer: this._multiSearchViewer }
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