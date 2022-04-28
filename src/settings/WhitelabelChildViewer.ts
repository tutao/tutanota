import m, {Children, Component} from "mithril"
import {TextFieldType} from "../gui/base/TextFieldN"
import {formatDateWithMonth} from "../misc/Formatter"
import {lang} from "../misc/LanguageViewModel"
import {neverNull, noOp} from "@tutao/tutanota-utils"
import {OperationType} from "../api/common/TutanotaConstants"
import {showProgressDialog} from "../gui/dialogs/ProgressDialog"
import type {WhitelabelChild} from "../api/entities/sys/TypeRefs.js"
import {WhitelabelChildTypeRef} from "../api/entities/sys/TypeRefs.js"
import {Icons} from "../gui/base/icons/Icons"
import {Dialog} from "../gui/base/Dialog"
import stream from "mithril/stream"
import type {EntityUpdateData} from "../api/main/EventController"
import {isUpdateForTypeRef} from "../api/main/EventController"
import {isSameId} from "../api/common/utils/EntityUtils"
import {TextFieldN} from "../gui/base/TextFieldN"
import {ButtonN} from "../gui/base/ButtonN"
import {DropDownSelectorN} from "../gui/base/DropDownSelectorN"
import {promiseMap} from "@tutao/tutanota-utils"
import {assertMainOrNode} from "../api/common/Env"
import {locator} from "../api/main/MainLocator"
import {UpdatableSettingsDetailsViewer} from "./SettingsView"

assertMainOrNode()

export class WhitelabelChildViewer implements UpdatableSettingsDetailsViewer {
	whitelabelChild: WhitelabelChild
	private _mailAddress: string
	private _comment: string
	private _isWhitelabelChildActive!: boolean

	constructor(whitelabelChild: WhitelabelChild) {
		this.whitelabelChild = whitelabelChild
		this._mailAddress = whitelabelChild.mailAddress || ""
		this._comment = whitelabelChild.comment || ""
	}

	view(): Children {
		const mailAddressAttrs = {
			label: "mailAddress_label",
			value: this._mailAddress,
			disabled: true,
		} as const
		const createdAttrs = {
			label: "created_label",
			value: formatDateWithMonth(this.whitelabelChild.createdDate),
			disabled: true,
		} as const
		const editCommentButtonAttrs = {
			label: "edit_action",
			click: () => {
				Dialog.showTextAreaInputDialog("edit_action", "comment_label", null, this._comment).then(newComment => {
					this.whitelabelChild.comment = newComment
					locator.entityClient.update(this.whitelabelChild)
				})
			},
			icon: () => Icons.Edit,
		} as const
		const commentAttrs = {
			label: "comment_label",
			value: this._comment,
			disabled: true,
			type: TextFieldType.Area,
			injectionsRight: () => [m(ButtonN, editCommentButtonAttrs)],
		} as const
		const deactivatedDropDownAttrs = {
			label: "state_label",
			items: [
				{
					name: lang.get("activated_label"),
					value: false,
				},
				{
					name: lang.get("deactivated_label"),
					value: true,
				},
			],
			selectedValue: this._isWhitelabelChildActive,
			selectionChangedHandler: (deactivate: boolean) => {
				this.whitelabelChild.deletedDate = deactivate ? new Date() : null
				return showProgressDialog("pleaseWait_msg", locator.entityClient.update(this.whitelabelChild))
			},
		} as const
		return m("#whitelabel-child-viewer.fill-absolute.scroll.plr-l", [
			m(".h4.mt-l", lang.get("whitelabelAccount_label")),
			m(TextFieldN, mailAddressAttrs),
			m(TextFieldN, createdAttrs),
			m(DropDownSelectorN, deactivatedDropDownAttrs),
			m(TextFieldN, commentAttrs),
		])
	}

	entityEventsReceived<T>(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		return promiseMap(updates, update => {
			if (
				isUpdateForTypeRef(WhitelabelChildTypeRef, update) &&
				update.operation === OperationType.UPDATE &&
				isSameId(this.whitelabelChild._id, [neverNull(update.instanceListId), update.instanceId])
			) {
				return locator.entityClient.load(WhitelabelChildTypeRef, this.whitelabelChild._id).then(updatedWhitelabelChild => {
					this.whitelabelChild = updatedWhitelabelChild
					this._mailAddress = updatedWhitelabelChild.mailAddress
					this._isWhitelabelChildActive = updatedWhitelabelChild.deletedDate != null
					this._comment = updatedWhitelabelChild.comment
					m.redraw()
				})
			}
		}).then(noOp)
	}
}