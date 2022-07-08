import type {lazyIcon} from "../gui/base/Icon"
import type {TranslationKey} from "../misc/LanguageViewModel"
import {isSelectedPrefix} from "../gui/base/NavButton.js"
import type {UpdatableSettingsViewer} from "./SettingsView"
import type {lazy} from "@tutao/tutanota-utils"
import {assertMainOrNode} from "../api/common/Env"

assertMainOrNode()

type SettingsFolderPath =
	| string
	| {folder: string, id: string}

export class SettingsFolder<T> {
	url: string // can be changed from outside

	readonly data: T
	readonly name: TranslationKey | lazy<string>
	readonly icon: lazyIcon
	readonly path: SettingsFolderPath
	readonly viewerCreator: lazy<UpdatableSettingsViewer>
	private _isVisibleHandler: lazy<boolean>

	constructor(name: TranslationKey | lazy<string>, icon: lazyIcon, path: SettingsFolderPath, viewerCreator: lazy<UpdatableSettingsViewer>, data: T) {
		this.data = data
		this.name = name
		this.icon = icon
		this.path = path
		this.url =
			typeof path === "string" ? `/settings/${encodeURIComponent(path)}` : `/settings/${encodeURIComponent(path.folder)}/${encodeURIComponent(path.id)}`
		this.viewerCreator = viewerCreator

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
}