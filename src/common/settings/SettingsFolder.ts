import type { lazyIcon } from "../gui/base/Icon.js"
import type { MaybeTranslation } from "../misc/LanguageViewModel.js"
import { isSelectedPrefix } from "../gui/base/NavButton.js"
import type { lazy } from "@tutao/tutanota-utils"
import { assertMainOrNode } from "../api/common/Env.js"
import { UpdatableSettingsViewer } from "./Interfaces.js"

assertMainOrNode()

interface SettingsFolderPath {
	folder: string
	id: string | null
}

export class SettingsFolder<T> {
	readonly url: string
	private readonly path: SettingsFolderPath

	private _isVisibleHandler: lazy<boolean>

	/**
	 * @param name Displayed as the folder name
	 * @param icon Displayed as the folder icon
	 * @param path Either a string which means URL like `/settings/mail` or an object which means URL like `/settings/templates/1`
	 * @param viewerCreator A function to produce instances of {@link UpdatableSettingsViewer}.
	 * @param data Additional data that the folder can carry
	 */
	constructor(
		readonly name: () => MaybeTranslation,
		readonly icon: lazyIcon,
		path: string | SettingsFolderPath,
		readonly viewerCreator: lazy<UpdatableSettingsViewer>,
		readonly data: T,
	) {
		this.path = typeof path === "string" ? { folder: path, id: null } : path
		this.url =
			this.path.id == null
				? `/settings/${encodeURIComponent(this.path.folder)}`
				: `/settings/${encodeURIComponent(this.path.folder)}/${encodeURIComponent(this.path.id)}`

		this._isVisibleHandler = () => true
	}

	isActive(): boolean {
		return isSelectedPrefix(this.url)
	}

	isVisible(): boolean {
		return this._isVisibleHandler()
	}

	setIsVisibleHandler(isVisibleHandler: lazy<boolean>): this {
		this._isVisibleHandler = isVisibleHandler
		return this
	}

	get folder(): string {
		return this.path.folder
	}

	get id(): string | null {
		return this.path.id
	}

	matches(folder: string, id: string | undefined | null): boolean {
		// eslint-disable-next-line eqeqeq -- this.id can be null and id can be undefined
		return folder === this.folder && id == this.id
	}

	isSameFolder(anotherFolder: SettingsFolder<unknown>): boolean {
		return this.matches(anotherFolder.folder, anotherFolder.id)
	}
}
