import { UndoAction } from "./mail/view/MailViewModel"

/**
 * Model to keep track of and perform undo actions
 */
export class UndoModel {
	private undoAction: UndoAction | null = null

	setUndoAction(action: UndoAction) {
		this.clearCurrentUndoAction()
		this.undoAction = action
	}

	/**
	 * Clears the undo action if it matches {@link action}
	 */
	clearUndoActionIfPresent(action: UndoAction) {
		if (this.undoAction === action) {
			this.clearCurrentUndoAction()
		}
	}

	private clearCurrentUndoAction() {
		const currentAction = this.undoAction
		if (currentAction != null) {
			this.undoAction = null
			currentAction.onClear()
		}
	}

	/**
	 * Performs the undo action, clearing it
	 *
	 * If the undo action returned a promise, then it will be awaited.
	 */
	async performUndoAction(): Promise<void> {
		// Clear the undo action first, since this is synchronous (so we don't accidentally trigger the same undo twice)
		const oldAction = this.undoAction
		this.undoAction = null

		// Now perform the undo action
		await oldAction?.exec()
	}
}
