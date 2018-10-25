// @flow
import {assertMainOrNode} from "../api/Env"
import {isSelectedPrefix} from "../gui/base/NavButton"
import type {AllIconsEnum, lazyIcon} from "../gui/base/Icon"

assertMainOrNode()

export class SettingsFolder {
	nameTextId: string;
	icon: lazyIcon;
	path: string;
	url: string; // can be changed from outside
	viewerCreator: lazy<UpdatableSettingsViewer>;
	_isVisibleHandler: lazy<boolean>;

	constructor(nameTextId: string, icon: lazyIcon, path: string, viewerCreator: lazy<UpdatableSettingsViewer>) {
		this.nameTextId = nameTextId
		this.icon = icon
		this.path = path
		this.url = `/settings/${path}`
		this.viewerCreator = viewerCreator
		this._isVisibleHandler = () => true
	}

	isActive() {
		return isSelectedPrefix(this.url)
	}

	isVisible() {
		return this._isVisibleHandler()
	}

	setIsVisibleHandler(isVisibleHandler: lazy<boolean>): SettingsFolder {
		this._isVisibleHandler = isVisibleHandler
		return this
	}
}