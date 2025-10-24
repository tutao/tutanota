import m, { Component, Vnode } from "mithril"
import { newPromise } from "@tutao/tutanota-utils"
import { theme } from "../theme"

export type SmoothProgressBarAttrs = {
	progress: number // 0.0 → 1.0 (values >1 treated as done)
	type?: ProgressBarType
	color?: string // optional custom color
}

export enum ProgressBarType {
	Small,
	Large,
}

export const PROGRESS_DONE = 1

/**
 * Smoothly animated progress bar with JS interpolation and safe removal.
 */
export class SmoothProgressBar implements Component<SmoothProgressBarAttrs> {
	private displayedProgress = 0
	private frameReq: number | null = null
	private isRemoving = false

	private animateTo(target: number, onFinish?: () => void) {
		if (this.frameReq) cancelAnimationFrame(this.frameReq)

		const duration = 500 // ms
		const start = performance.now() // requestAnimationFrame passes a DOMHighResTimeStamp to the callback
		const startValue = this.displayedProgress
		const delta = target - startValue

		const animate = (now: number) => {
			const t = Math.min((now - start) / duration, 1)
			const eased = 1 - Math.pow(1 - t, 3) // easeOutCubic
			this.displayedProgress = startValue + delta * eased
			m.redraw()

			if (t < 1) {
				this.frameReq = requestAnimationFrame(animate)
			} else {
				this.frameReq = null
				onFinish?.()
			}
		}

		this.frameReq = requestAnimationFrame(animate)
	}

	view(vnode: Vnode<SmoothProgressBarAttrs>) {
		const { progress, type, color } = vnode.attrs

		// If already removing, skip rendering again
		if (this.isRemoving) return null

		// Clamp progress
		const clamped = Math.min(progress, PROGRESS_DONE)

		this.animateTo(clamped, () => {
			if (progress >= PROGRESS_DONE) {
				setTimeout(() => {
					this.isRemoving = true
					m.redraw()
				}, 200)
			}
		})

		return m("", {
			onbeforeremove: (vn) =>
				newPromise<void>((resolve) => {
					vn.dom.addEventListener("transitionend", () => resolve())
					setTimeout(resolve, 700) // fallback
				}),
			style: {
				top: 0,
				left: 0,
				height: type === ProgressBarType.Large ? "100%" : "2px",
				width: this.displayedProgress * 100 + "%",
				background: color ?? theme.primary,
				transition: "width 0.1s linear, opacity 0.4s ease",
			},
		})
	}
}
