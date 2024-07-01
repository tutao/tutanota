import m, { Component, Vnode } from "mithril"

export type ProgressBarAttrs = {
	progress: number
}

export const PROGRESS_DONE = 1

/**
 * a progress bar that takes a progress value and displays it as
 * a portion of its containers width
 */
export class ProgressBar implements Component<ProgressBarAttrs> {
	private lastProgress: number | null = null

	view(vnode: Vnode<ProgressBarAttrs>) {
		const a = vnode.attrs
		if (this.lastProgress === null && a.progress >= PROGRESS_DONE) {
			// no need to draw anything if we went from 0 to 100 real quick
			return null
		}

		if (this.lastProgress !== null && this.lastProgress >= PROGRESS_DONE) {
			// on the last redraw, we were done
			// so we can start to remove now
			return null
		}
		if (a.progress >= PROGRESS_DONE) {
			// schedule the removal redraw now because
			// we might not get another redraw for a while
			// otherwise (since progress is done)
			m.redraw()
		}

		this.lastProgress = a.progress
		return m(".abs.accent-bg", {
			onbeforeremove: (vn) =>
				new Promise<void>((resolve) => {
					vn.dom.addEventListener("transitionend", () => {
						this.lastProgress = null
						resolve()
					})
					setTimeout(() => {
						this.lastProgress = null
						resolve()
					}, 500)
				}),
			style: {
				top: 0,
				left: 0,
				transition: "width 500ms",
				width: a.progress * 100 + "%",
				height: "2px",
			},
		})
	}
}
