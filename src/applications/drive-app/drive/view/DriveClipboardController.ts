import { FolderItem, FolderItemId, folderItemToId } from "./DriveUtils"

export const enum ClipboardAction {
	Cut,
	Copy,
}

export interface DriveClipboard {
	items: readonly FolderItemId[]
	action: ClipboardAction
}

export class DriveClipboardController {
	private _clipboard: DriveClipboard | null = null

	get clipboard(): DriveClipboard | null {
		return this._clipboard
	}
	cut(items: readonly FolderItem[]) {
		this._clipboard = {
			items: items.map(folderItemToId),
			action: ClipboardAction.Cut,
		}
	}

	copy(items: readonly FolderItem[]) {
		this._clipboard = {
			items: items.map(folderItemToId),
			action: ClipboardAction.Copy,
		}
	}
	clear() {
		this._clipboard = null
	}
}
