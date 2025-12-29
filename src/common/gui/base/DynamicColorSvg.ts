import m, { Component, Vnode } from "mithril"
import stream from "mithril/stream"
import { ProgrammingError } from "../../api/common/error/ProgrammingError"

interface DynamicColorSvgAttrs {
	path: string
}
export class DynamicColorSvg implements Component<DynamicColorSvgAttrs> {
	private svg: stream<string | undefined> = stream()
	private loadSeq = 0

	oncreate({ attrs: { path } }: Vnode<DynamicColorSvgAttrs>) {
		void this.loadSvg(path)
	}

	onbeforeupdate(vnode: Vnode<DynamicColorSvgAttrs>, old: Vnode<DynamicColorSvgAttrs>) {
		if (vnode.attrs.path !== old.attrs.path) {
			void this.loadSvg(vnode.attrs.path)
		}
		return true
	}

	private async loadSvg(path: string) {
		const loadId = ++this.loadSeq
		try {
			const res = await fetch(path)
			const content = await res.text()
			const contentType = res.headers.get("content-type")
			if (!contentType?.includes("svg")) throw new Error()
			if (loadId !== this.loadSeq) return
			this.svg(content)
		} catch (e) {
			if (loadId !== this.loadSeq) return
			throw new ProgrammingError(`Failed to fetch SVG file: ${e}`)
		} finally {
			if (loadId === this.loadSeq) m.redraw()
		}
	}

	// We cannot use the `img` tag to display SVG, since the `img` tag does not expose the SVG's classes.
	view() {
		return m(".dynamic-color-svg-wrapper", this.svg() && m.trust(this.svg()!))
	}
}
