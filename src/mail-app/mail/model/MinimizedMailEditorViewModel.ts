import type { Dialog } from "../../../common/gui/base/Dialog"
import type { SendMailModel } from "../../../common/mailFunctionality/SendMailModel.js"
import { lastThrow, remove } from "@tutao/tutanota-utils"
import type { Mail } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { isSameId } from "../../../common/api/common/utils/EntityUtils"
import Stream from "mithril/stream"

export const enum SaveStatusEnum {
	Saving = 0,
	Saved = 1,
	NotSaved = 2,
}

export const enum SaveErrorReason {
	Unknown,
	ConnectionLost,
}

export type SaveStatus =
	| {
			status: SaveStatusEnum.Saving
	  }
	| {
			status: SaveStatusEnum.Saved
	  }
	| {
			status: SaveStatusEnum.NotSaved
			reason: SaveErrorReason
	  }

export type MinimizedEditor = {
	dialog: Dialog
	sendMailModel: SendMailModel
	// we pass sendMailModel for easier access to contents of mail,
	dispose: () => void
	// disposes dialog and templatePopup eventListeners when minimized mail is removed
	saveStatus: Stream<SaveStatus>
	closeOverlayFunction: () => void
}

/**
 * handles minimized Editors
 */
export class MinimizedMailEditorViewModel {
	_minimizedEditors: Array<MinimizedEditor>

	constructor() {
		this._minimizedEditors = []
	}

	minimizeMailEditor(
		dialog: Dialog,
		sendMailModel: SendMailModel,
		dispose: () => void,
		saveStatus: Stream<SaveStatus>,
		closeOverlayFunction: () => void,
	): MinimizedEditor {
		dialog.close()

		// disallow creation of duplicate minimized mails
		if (!this._minimizedEditors.some((editor) => editor.dialog === dialog)) {
			this._minimizedEditors.push({
				sendMailModel: sendMailModel,
				dialog: dialog,
				dispose: dispose,
				saveStatus,
				closeOverlayFunction,
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

	getEditorForDraft(mail: Mail): MinimizedEditor | null {
		return (
			this.getMinimizedEditors().find((e) => {
				const draft = e.sendMailModel.getDraft()
				return draft ? isSameId(draft._id, mail._id) : null
			}) ?? null
		)
	}
}
