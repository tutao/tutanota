// @flow
import m from "mithril"
import {assertMainOrNode} from "../api/Env"
import {TextField, Type} from "../gui/base/TextField"
import {load, update} from "../api/main/Entity"
import {formatDateWithMonth} from "../misc/Formatter"
import {lang} from "../misc/LanguageViewModel"
import {isSameId} from "../api/common/EntityFunctions"
import {DropDownSelector} from "../gui/base/DropDownSelector"
import {neverNull} from "../api/common/utils/Utils"
import {OperationType} from "../api/common/TutanotaConstants"
import {showProgressDialog} from "../gui/base/ProgressDialog"
import {WhitelabelChildTypeRef} from "../api/entities/sys/WhitelabelChild"
import {Icons} from "../gui/base/icons/Icons"
import {Dialog} from "../gui/base/Dialog"
import {Button} from "../gui/base/Button"
import stream from "mithril/stream/stream.js"
import type {EntityUpdateData} from "../api/main/EventController"
import {isUpdateForTypeRef} from "../api/main/EventController"

assertMainOrNode()

export class WhitelabelChildViewer {
	view: Function;
	whitelabelChild: WhitelabelChild;
	_mailAddress: TextField;
	_deactivated: DropDownSelector<boolean>;
	_comment: TextField;

	constructor(whitelabelChild: WhitelabelChild) {
		this.whitelabelChild = whitelabelChild

		this._mailAddress = new TextField("mailAddress_label").setValue(whitelabelChild.mailAddress).setDisabled()
		let created = new TextField("created_label").setValue(formatDateWithMonth(whitelabelChild.createdDate))
		                                            .setDisabled()
		this._comment = new TextField("comment_label").setType(Type.Area)
		                                              .setValue(whitelabelChild.comment)
		                                              .setDisabled()

		let editCommentButton = new Button("edit_action", () => {
			Dialog.showTextAreaInputDialog("edit_action", "comment_label", null, this._comment.value())
			      .then(newComment => {
				      this.whitelabelChild.comment = newComment
				      update(this.whitelabelChild)
			      })
		}, () => Icons.Edit)

		this._comment._injectionsRight = () => [m(editCommentButton)]

		this._deactivated = new DropDownSelector("state_label", null, [
			{name: lang.get("activated_label"), value: false},
			{name: lang.get("deactivated_label"), value: true}
		], stream(this.whitelabelChild.deletedDate != null)).setSelectionChangedHandler(deactivate => {
			this.whitelabelChild.deletedDate = deactivate ? new Date() : null
			return showProgressDialog("pleaseWait_msg", update(this.whitelabelChild))
		})

		this.view = () => {
			return [
				m("#whitelabel-child-viewer.fill-absolute.scroll.plr-l", [
					m(".h4.mt-l", lang.get("whitelabelAccount_label")),
					m(this._mailAddress),
					m(created),
					m(this._deactivated),
					m(this._comment)
				])
			]
		}
	}

	entityEventsReceived<T>(updates: $ReadOnlyArray<EntityUpdateData>): void {
		for (let update of updates) {
			if (isUpdateForTypeRef(WhitelabelChildTypeRef, update) && update.operation === OperationType.UPDATE
				&& isSameId(this.whitelabelChild._id, [neverNull(update.instanceListId), update.instanceId])) {
				load(WhitelabelChildTypeRef, this.whitelabelChild._id).then(updatedWhitelabelChild => {
					this.whitelabelChild = updatedWhitelabelChild
					this._mailAddress.setValue(updatedWhitelabelChild.mailAddress)
					this._deactivated.selectedValue(updatedWhitelabelChild.deletedDate != null)
					this._comment.setValue(updatedWhitelabelChild.comment)
					m.redraw()
				})
			}
		}
	}
}
