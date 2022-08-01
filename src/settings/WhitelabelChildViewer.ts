import m, {Children} from "mithril"
import {TextField, TextFieldType} from "../gui/base/TextField.js"
import {formatDateWithMonth} from "../misc/Formatter"
import {lang} from "../misc/LanguageViewModel"
import {identity, neverNull} from "@tutao/tutanota-utils"
import {OperationType} from "../api/common/TutanotaConstants"
import {showProgressDialog} from "../gui/dialogs/ProgressDialog"
import type {WhitelabelChild} from "../api/entities/sys/TypeRefs.js"
import {WhitelabelChildTypeRef} from "../api/entities/sys/TypeRefs.js"
import {Icons} from "../gui/base/icons/Icons"
import {Dialog} from "../gui/base/Dialog"
import type {EntityUpdateData} from "../api/main/EventController"
import {isUpdateForTypeRef} from "../api/main/EventController"
import {isSameId} from "../api/common/utils/EntityUtils"
import {Button} from "../gui/base/Button.js"
import {DropDownSelectorAttrs, DropDownSelector} from "../gui/base/DropDownSelector.js"
import {assertMainOrNode} from "../api/common/Env"
import {locator} from "../api/main/MainLocator"
import {UpdatableSettingsDetailsViewer} from "./SettingsView"

assertMainOrNode()

export class WhitelabelChildViewer implements UpdatableSettingsDetailsViewer {

	constructor(
		private whitelabelChild: WhitelabelChild
	) {
	}

	view(): Children {
		return m("#whitelabel-child-viewer.fill-absolute.scroll.plr-l", [
			m(".h4.mt-l", lang.get("whitelabelAccount_label")),
			m(TextField, {
				label: "mailAddress_label",
				value: this.whitelabelChild.mailAddress,
				disabled: true,
			}),
			m(TextField, {
				label: "created_label",
				value: formatDateWithMonth(this.whitelabelChild.createdDate),
				disabled: true,
			}),
			m(DropDownSelector, identity<DropDownSelectorAttrs<boolean>>({
				label: "state_label",
				items: [
					{
						name: lang.get("activated_label"),
						value: true,
					},
					{
						name: lang.get("deactivated_label"),
						value: false,
					},
				],
				selectedValue: this.isChildActive(),
				selectionChangedHandler: (deactivate: boolean) => {
					this.whitelabelChild.deletedDate = deactivate ? new Date() : null
					return showProgressDialog("pleaseWait_msg", locator.entityClient.update(this.whitelabelChild))
				},
			})),
			m(TextField, {
				label: "comment_label",
				value: this.whitelabelChild.comment,
				disabled: true,
				type: TextFieldType.Area,
				injectionsRight: () => [m(Button, {
					label: "edit_action",
					click: () => {
						Dialog.showTextAreaInputDialog("edit_action", "comment_label", null, this.whitelabelChild.comment).then(newComment => {
							this.whitelabelChild.comment = newComment
							locator.entityClient.update(this.whitelabelChild)
						})
					},
					icon: () => Icons.Edit,
				})],
			}),
		])
	}

	private isChildActive(): boolean {
		return this.whitelabelChild.deletedDate == null
	}

	async entityEventsReceived<T>(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		for (const update of updates) {
			if (
				isUpdateForTypeRef(WhitelabelChildTypeRef, update) &&
				update.operation === OperationType.UPDATE &&
				isSameId(this.whitelabelChild._id, [neverNull(update.instanceListId), update.instanceId])
			) {
				this.whitelabelChild = await locator.entityClient.load(WhitelabelChildTypeRef, this.whitelabelChild._id)
				m.redraw()
			}
		}
	}
}