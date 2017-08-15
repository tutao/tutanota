// @flow
import m from "mithril"
import {assertMainOrNode} from "../api/Env"

assertMainOrNode()

export class SettingsFolder {
	nameTextId: string;
	icon: lazy<SVG>;
	path: string;
	url: string; // can be changed from outside
	viewerCreator: lazy<Component>;

	constructor(nameTextId: string, icon: lazy<SVG>, path: string, viewerCreator: lazy<Component>) {
		this.nameTextId = nameTextId
		this.icon = icon
		this.path = path
		this.url = `/settings/${path}`
		this.viewerCreator = viewerCreator
	}

	isActive() {
		let current = m.route.get()
		return (current == this.url || (current.indexOf(this.url + "/") === 0))
	}
}