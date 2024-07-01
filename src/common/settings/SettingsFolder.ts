<<<<<<<< HEAD:src/common/settings/SettingsFolder.ts
import type { lazyIcon } from "../gui/base/Icon.js"
import type { TranslationKey } from "../misc/LanguageViewModel.js"
import { isSelectedPrefix } from "../gui/base/NavButton.js"
import type { lazy } from "@tutao/tutanota-utils"
import { assertMainOrNode } from "../api/common/Env.js"
import { UpdatableSettingsViewer } from "./Interfaces.js"
========
import type { lazyIcon } from "../../common/gui/base/Icon"
import type { TranslationKey } from "../../common/misc/LanguageViewModel"
import { isSelectedPrefix } from "../../common/gui/base/NavButton.js"
import type { UpdatableSettingsViewer } from "./SettingsView"
import type { lazy } from "@tutao/tutanota-utils"
import { assertMainOrNode } from "../../common/api/common/Env"
>>>>>>>> 3349a964d (Move files to new folder structure):src/mail-app/settings/SettingsFolder.ts

assertMainOrNode()

type SettingsFolderPath = string | { folder: string; id: string }

export class SettingsFolder<T> {
	readonly url: string

	private _isVisibleHandler: lazy<boolean>

	constructor(
		readonly name: TranslationKey | lazy<string>,
		readonly icon: lazyIcon,
		readonly path: SettingsFolderPath,
		readonly viewerCreator: lazy<UpdatableSettingsViewer>,
		readonly data: T,
	) {
		this.url =
			typeof path === "string" ? `/settings/${encodeURIComponent(path)}` : `/settings/${encodeURIComponent(path.folder)}/${encodeURIComponent(path.id)}`

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

	get folder(): string | null {
		return typeof this.path === "string" ? null : this.path.folder
	}

	get id(): string | null {
		return typeof this.path === "string" ? null : this.path.id
	}
}
