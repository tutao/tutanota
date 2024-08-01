import m, { Component, Vnode } from "mithril"

export type SourceCodeViewerAttrs = {
	rawHtml: string
}

export class SourceCodeViewer implements Component<SourceCodeViewerAttrs> {
	view(vnode: Vnode<SourceCodeViewerAttrs>) {
		const { rawHtml } = vnode.attrs
		return m("p.selectable", rawHtml)
	}
}
