// @flow
import m from "mithril"
import {assertMainOrNode} from "../../api/common/Env"
import {lang} from "../../misc/LanguageViewModel"

assertMainOrNode()

export type StatusFieldAttrs = {
	status: Status,
}

export class StatusField implements MComponent<StatusFieldAttrs> {
	_status: Status;

	constructor(vnode: Vnode<StatusFieldAttrs>) {
		this._status = vnode.attrs.status
	}

	view(vnode: Vnode<StatusFieldAttrs>): Children {
		if (!this._status) return null

		return m("", lang.get(this._status.text))
	}
}