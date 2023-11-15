import { SwipeHandler } from "./SwipeHandler.js"
import { animations, transform, TransformEnum } from "../animation/Animations.js"

export class CalendarSwipeHandler extends SwipeHandler {
	_onGestureCompleted: (next: boolean) => unknown
	_xoffset: number = 0

	constructor(touchArea: HTMLElement, onGestureCompleted: (next: boolean) => unknown) {
		super(touchArea)
		// avoid flickering especially in day and week view when overflow-y is set on nested elements
		touchArea.style.transformStyle = "preserve-3d"
		touchArea.style.backfaceVisibility = "hidden"
		this._onGestureCompleted = onGestureCompleted
	}

	onHorizontalDrag(xDelta: number, yDelta: number) {
		this._xoffset = Math.abs(xDelta) > 20 ? xDelta : 0
		this.touchArea.style.transform = `translateX(${this._xoffset}px)`
	}

	onHorizontalGestureCompleted(delta: { x: number; y: number }): Promise<void> {
		if (Math.abs(delta.x) > 100) {
			this._xoffset = 0
			return animations
				.add(this.touchArea, transform(TransformEnum.TranslateX, delta.x, this.touchArea.offsetWidth * (delta.x > 0 ? 1 : -1)))
				.then(() => {
					this._onGestureCompleted(delta.x < 0)

					requestAnimationFrame(() => {
						this.touchArea.style.transform = ""
					})
				})
		} else {
			return this.reset(delta)
		}
	}

	reset(delta: { x: number; y: number }): Promise<any> {
		if (Math.abs(this._xoffset) > 20) {
			animations.add(this.touchArea, transform(TransformEnum.TranslateX, delta.x, 0))
		} else {
			this.touchArea.style.transform = ""
		}

		this._xoffset = 0
		return super.reset(delta)
	}
}
