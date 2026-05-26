import m, { Children, Component, Vnode } from "mithril"
import type { TranslationKey } from "../utils/LanguageViewModel"
import { lang } from "../utils/LanguageViewModel"
import { assertMainOrNode } from "../../platform-kits/app-env"

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
