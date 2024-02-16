import m, { Children, Component, Vnode } from "mithril"
import { lang } from "../../misc/LanguageViewModel"
import type { TranslationKey } from "../../misc/LanguageViewModel"
import { assertMainOrNode } from "../../api/common/Env"

assertMainOrNode()
export type StatusType = "neutral" | "valid" | "invalid"
export type StatusFieldAttrs = {
	status: Status
}

export class StatusField implements Component<StatusFieldAttrs> {
	view(vnode: Vnode<StatusFieldAttrs>): Children {
		const { status } = vnode.attrs
		if (!status) return null
		return m("", lang.get(status.text))
	}
}

export type Status = {
	type: StatusType
	text: TranslationKey
}
