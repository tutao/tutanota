import m, { Component, Vnode } from "mithril"
import stream from "mithril/stream"
import { ProgrammingError } from "../../api/common/error/ProgrammingError"

interface DynamicColorSvgAttrs {
	path: string
}
export class DynamicColorSvg implements Component<DynamicColorSvgAttrs> {
	private svg: stream<string | undefined> = stream()

	async oncreate({ attrs: { path } }: Vnode<DynamicColorSvgAttrs>) {
		try {
			const res = await fetch(path)
			const content = await res.text()
			const contentType = res.headers.get("content-type")
			if (!contentType?.includes("svg")) throw new Error()
			this.svg(content)
		} catch (e) {
			throw new ProgrammingError(`Failed to fetch SVG file: ${e}`)
		}
	}

	// We cannot use the `img` tag to display SVG, since the `img` tag does not expose the SVG's classes.
	view() {
		return m(".dynamic-color-svg-wrapper", this.svg() && m.trust(this.svg()!))
	}
}
