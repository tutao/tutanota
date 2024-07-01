import { Vnode } from "mithril"
import { TopLevelAttrs } from "../../TopLevelView.js"

/**
 * Base (utility) class for top-level components. Will handle URL updates for you automatically and will only call {@link onNewUrl} when necessary.
 */
export abstract class BaseTopLevelView {
	private lastPath: string = ""

	oninit({ attrs }: Vnode<TopLevelAttrs>) {
		this.lastPath = attrs.requestedPath
		this.onNewUrl(attrs.args, attrs.requestedPath)
	}

	onbeforeupdate({ attrs }: Vnode<TopLevelAttrs>) {
		// onupdate() is called on every re-render but we don't want to call onNewUrl all the time
		if (this.lastPath !== attrs.requestedPath) {
			this.lastPath = attrs.requestedPath
			this.onNewUrl(attrs.args, attrs.requestedPath)
		}
	}

	protected abstract onNewUrl(args: Record<string, any>, requestedPath: string): void
}
