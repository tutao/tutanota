// @flow
import {assertMainOrNode} from "../api/Env"
import {isSelectedPrefix} from "../gui/base/NavButton"

assertMainOrNode()

export class SettingsFolder {
	nameTextId: string;
	icon: lazy<SVG>;
	path: string;
	url: string; // can be changed from outside
	viewerCreator: lazy<Component>;
	_isVisibleHandler: lazy<boolean>;

	constructor(nameTextId: string, icon: lazy<SVG>, path: string, viewerCreator: lazy<Component>) {
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