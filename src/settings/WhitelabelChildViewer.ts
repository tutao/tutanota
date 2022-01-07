import m from "mithril"
import {TextFieldType} from "../gui/base/TextFieldN"
import {formatDateWithMonth} from "../misc/Formatter"
import {lang} from "../misc/LanguageViewModel"
import {neverNull, noOp} from "@tutao/tutanota-utils"
import {OperationType} from "../api/common/TutanotaConstants"
import {showProgressDialog} from "../gui/dialogs/ProgressDialog"
import type {WhitelabelChild} from "../api/entities/sys/WhitelabelChild"
import {WhitelabelChildTypeRef} from "../api/entities/sys/WhitelabelChild"
import {Icons} from "../gui/base/icons/Icons"
import {Dialog} from "../gui/base/Dialog"
import stream from "mithril/stream/stream.js"
import type {EntityUpdateData} from "../api/main/EventController"
import {isUpdateForTypeRef} from "../api/main/EventController"
import {isSameId} from "../api/common/utils/EntityUtils"
import {TextFieldN} from "../gui/base/TextFieldN"
import {ButtonN} from "../gui/base/ButtonN"
import {DropDownSelectorN} from "../gui/base/DropDownSelectorN"
import {promiseMap} from "@tutao/tutanota-utils"
import {assertMainOrNode} from "../api/common/Env"
import {locator} from "../api/main/MainLocator"
assertMainOrNode()
export class WhitelabelChildViewer implements Component<void> {
    whitelabelChild: WhitelabelChild
    _mailAddress: string
    _comment: string
    _isWhitelabelChildActive: boolean

    constructor(whitelabelChild: WhitelabelChild) {
        this.whitelabelChild = whitelabelChild
        this._mailAddress = whitelabelChild.mailAddress || ""
        this._comment = whitelabelChild.comment || ""
    }

    view(): Children {
        const mailAddressAttrs = {
            label: "mailAddress_label",
            value: stream(this._mailAddress),
            disabled: true,
        }
        const createdAttrs = {
            label: "created_label",
            value: stream(formatDateWithMonth(this.whitelabelChild.createdDate)),
            disabled: true,
        }
        const editCommentButtonAttrs = {
            label: "edit_action",
            click: () => {
                Dialog.showTextAreaInputDialog("edit_action", "comment_label", null, this._comment).then(newComment => {
                    this.whitelabelChild.comment = newComment
                    locator.entityClient.update(this.whitelabelChild)
                })
            },
            icon: () => Icons.Edit,
        }
        const commentAttrs = {
            label: "comment_label",
            value: stream(this._comment),
            disabled: true,
            type: TextFieldType.Area,
            injectionsRight: () => [m(ButtonN, editCommentButtonAttrs)],
        }
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
            selectedValue: stream(this._isWhitelabelChildActive),
            selectionChangedHandler: deactivate => {
                this.whitelabelChild.deletedDate = deactivate ? new Date() : null
                return showProgressDialog("pleaseWait_msg", locator.entityClient.update(this.whitelabelChild))
            },
        }
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