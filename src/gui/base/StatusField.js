// @flow
import m from "mithril"
import {assertMainOrNode} from "../../api/common/Env"
import {lang} from "../../misc/LanguageViewModel"

assertMainOrNode()

export type StatusFieldAttrs = {
	status: Status,
}

export class StatusField implements MComponent<StatusFieldAttrs> {

	view(vnode: Vnode<StatusFieldAttrs>): Children {
		const {status} = vnode.attrs
		if (!status) return null

		return m("", lang.get(status.text))
	}
}