import { Component, Vnode } from "mithril"

type UntrustedKeyWarningPageAttrs = {
	contactMailAddress: string
}

export class UntrustedKeyWarningPage implements Component<UntrustedKeyWarningPageAttrs> {
	view(vnode: Vnode<UntrustedKeyWarningPageAttrs>): void {
		throw new Error("Method not implemented.")
	}
}
