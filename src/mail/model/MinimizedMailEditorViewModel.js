// @flow

import type {Dialog} from "../../gui/base/Dialog"
import type {SendMailModel} from "../editor/SendMailModel"
import {lastThrow, remove} from "@tutao/tutanota-utils"
import type {Mail} from "../../api/entities/tutanota/Mail"
import {isSameId} from "../../api/common/utils/EntityUtils"

export const SaveStatus = Object.freeze({
	Saving: 0,
	Saved: 1,
	NotSaved: 2,
})
export type SaveStatusEnum = $Values<typeof SaveStatus>;

export type MinimizedEditor = {
	dialog: Dialog,
	sendMailModel: SendMailModel, // we pass sendMailModel for easier access to contents of mail,
	dispose: () => void, // disposes dialog and templatePopup eventListeners when minimized mail is removed
	saveStatus: Stream<SaveStatusEnum>,
	closeOverlayFunction: () => Promise<void>
}

/**
 * handles minimized Editors
 */
export class MinimizedMailEditorViewModel {
	_minimizedEditors: Array<MinimizedEditor>;

	constructor() {
		this._minimizedEditors = []
	}

	minimizeMailEditor(dialog: Dialog, sendMailModel: SendMailModel, dispose: () => void, saveStatus: Stream<SaveStatusEnum>, closeOverlayFunction: ()=> Promise<void>): MinimizedEditor {
		dialog.close()
		// disallow creation of duplicate minimized mails
		if (!this._minimizedEditors.find(editor => editor.dialog === dialog)) {
			this._minimizedEditors.push({
				sendMailModel: sendMailModel,
				dialog: dialog,
				dispose: dispose,
				saveStatus,
				closeOverlayFunction
			})
		}
		return lastThrow(this._minimizedEditors)
	}

	// fully removes and reopens clicked mail
	reopenMinimizedEditor(editor: MinimizedEditor): void {
		editor.closeOverlayFunction()
		editor.dialog.show()
		remove(this._minimizedEditors, editor)
	}

	// fully removes clicked mail
	removeMinimizedEditor(editor: MinimizedEditor): void {
		editor.closeOverlayFunction()
		editor.dispose()
		remove(this._minimizedEditors, editor)
	}

	getMinimizedEditors(): Array<MinimizedEditor> {
		return this._minimizedEditors
	}

	getEditorForDraft(mail: Mail): ?MinimizedEditor {
		return this.getMinimizedEditors().find((e) => {
			const draft = e.sendMailModel.getDraft()
			return draft ? isSameId(draft._id, mail._id) : null
		})
	}
}