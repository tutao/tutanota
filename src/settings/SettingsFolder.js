// @flow
import {assertMainOrNode} from "../api/Env"
import type {lazyIcon} from "../gui/base/Icon"
import type {TranslationKey} from "../misc/LanguageViewModel"
import {isSelectedPrefix} from "../gui/base/NavButtonN"

assertMainOrNode()

export class SettingsFolder {
	nameTextId: TranslationKey;
	icon: lazyIcon;
	path: string;
	url: string; // can be changed from outside
	viewerCreator: lazy<UpdatableSettingsViewer>;
	_isVisibleHandler: lazy<boolean>;

	constructor(nameTextId: TranslationKey, icon: lazyIcon, path: string, viewerCreator: lazy<UpdatableSettingsViewer>) {
		this.nameTextId = nameTextId
		this.icon = icon
		this.path = path
		this.url = `/settings/${path}`
		this.viewerCreator = viewerCreator
		this._isVisibleHandler = () => true
	}

	isActive(): boolean {
		return isSelectedPrefix(this.url)
	}

	isVisible(): boolean {
		return this._isVisibleHandler()
	}

	setIsVisibleHandler(isVisibleHandler: lazy<boolean>): SettingsFolder {
		this._isVisibleHandler = isVisibleHandler
		return this
	}
}
