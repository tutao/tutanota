// @flow
import {client} from "../../misc/ClientDetector"
import {size} from "../size"


export const DirectionLock = Object.freeze({
	Horizontal: 1,
	Vertical: 2
})
export type DirectionLockEnum = $Values<typeof DirectionLock>

export class SwipeHandler {
	startPos: {x: number, y: number};
	touchArea: HTMLElement;
	animating: Promise<any>;
	directionLock: ?DirectionLockEnum;

	constructor(touchArea: HTMLElement) {
		this.startPos = {x: 0, y: 0}
		this.touchArea = touchArea
		this.animating = Promise.resolve()
		this.directionLock = null
		let eventListenerArgs = client.passive() ? {passive: true} : false
		this.touchArea.addEventListener('touchstart', (e: TouchEvent) => this.start(e), eventListenerArgs)
		this.touchArea.addEventListener('touchmove', (e: TouchEvent) => this.move(e), client.passive() ? {passive: false} : false) // does invoke prevent default
		this.touchArea.addEventListener('touchend', (e: TouchEvent) => this.end(e), eventListenerArgs)
	}

	start(e: TouchEvent) {
		this.startPos.x = e.touches[0].clientX
		this.startPos.y = e.touches[0].clientY
	}

	move(e: TouchEvent) {
		let {x, y} = this.getDelta(e)
		// If we're either locked horizontally OR if we're not locked vertically but would like to lock horizontally, then lock horizontally
		if (this.directionLock === DirectionLock.Horizontal || this.directionLock !== DirectionLock.Vertical && Math.abs(x) > Math.abs(y)
			&& Math.abs(x) > 14) {
			this.directionLock = DirectionLock.Horizontal
			// Do not scroll the list
			e.preventDefault()
			if (this.animating.isFulfilled()) {
				this.onHorizontalDrag(x, y)

			}
			// If we don't have a vertical lock yet but we would like to have it, lock vertically
		} else if (this.directionLock !== DirectionLock.Vertical && Math.abs(y) > Math.abs(x) && Math.abs(y) > size.list_row_height) {
			this.directionLock = DirectionLock.Vertical
			if (this.animating.isFulfilled()) {
				// Reset the row
				window.requestAnimationFrame(() => {
					if (this.animating.isFulfilled()) {
						this.reset({x, y})
					}
				})
			}
		}
	}

	end(e: TouchEvent) {
		this.gestureEnd(e)
	}

	gestureEnd(e: TouchEvent) {
		const delta = this.getDelta(e)
		if (this.animating.isFulfilled() && this.directionLock === DirectionLock.Horizontal) {
			// Gesture is completed
			this.animating = this.onHorizontalGestureCompleted(delta)
		} else if (this.animating.isFulfilled()) {
			// Gesture is not completed, reset row
			this.animating = this.reset(delta)
		}
		this.directionLock = null
	}

	onHorizontalDrag(xDelta: number, yDelta: number) {
		// noOp
	}

	onHorizontalGestureCompleted(delta: {x: number, y: number}): Promise<void> {
		// noOp
		return Promise.resolve()
	}

	reset(delta: {x: number, y: number}): Promise<any> {
		return Promise.resolve()
	}

	getDelta(e: any): {|x: number, y: number|} {
		return {
			x: e.changedTouches[0].clientX - this.startPos.x,
			y: e.changedTouches[0].clientY - this.startPos.y
		}
	}
}
