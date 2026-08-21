import { Coordinate2D, SwipeHandler } from "./SwipeHandler.js"
import { animations, DefaultAnimationTime, opacity, transform, TransformEnum } from "../animation/Animations.js"
import { ease } from "../animation/Easing.js"
import { ListRow, ListSwipeDecision, ViewHolder } from "./List.js"
import { component_size } from "../size.js"

const HORIZONTAL_ACTION_DISTANCE = 150
const VERTICAL_ACTION_DISTANCE = 50
const MAX_VERTICAL_PULL_DISTANCE = component_size.list_row_height * 3

/** Detects swipe gestures for list elements. On mobile some lists have actions on swiping, e.g. deleting an email. */
export class ListSwipeHandler<ElementType, VH extends ViewHolder<ElementType>> extends SwipeHandler {
	private virtualElement: ListRow<ElementType, VH> | null = null
	private xoffset!: number
	private yoffset: number = 0

	constructor(
		touchArea: HTMLElement,
		private readonly config: {
			domSwipeSpacerLeft: () => HTMLElement
			domSwipeSpacerRight: () => HTMLElement
			domSwipeSpacerDown: () => HTMLElement
			listElement: () => HTMLElement | null
			width: () => number
			getRowForPosition: (clientCoordinates: Coordinate2D) => ListRow<ElementType, VH> | null
			onSwipeLeft: (entity: ElementType) => Promise<ListSwipeDecision>
			onSwipeRight: (entity: ElementType) => Promise<ListSwipeDecision>
			canSwipeDown: () => boolean
			onSwipeDown: () => Promise<void>
			isSwipeDisabledForEntity: (entity: ElementType) => boolean
		},
	) {
		super(touchArea)
	}

	onHorizontalDrag(xDelta: number, yDelta: number) {
		super.onHorizontalDrag(xDelta, yDelta)
		// get it *before* raf so that we don't pick an element after reset() again
		const ve = this.getVirtualElement()
		if (ve?.entity != null && this.config.isSwipeDisabledForEntity(ve.entity)) {
			// reset xoffset to ensure that end animation isn't shown
			this.xoffset = 0
			return
		}

		// Animate the row with following touch
		window.requestAnimationFrame(() => {
			// Do not animate the swipe gesture more than necessary
			this.xoffset = xDelta < 0 ? Math.max(xDelta, -HORIZONTAL_ACTION_DISTANCE) : Math.min(xDelta, HORIZONTAL_ACTION_DISTANCE)

			if (!this.isAnimating && ve && ve.domElement && ve.entity) {
				ve.domElement.style.transform = `translateX(${this.xoffset}px) translateY(${ve.top}px)`
				this.config.domSwipeSpacerLeft().style.transform = `translateX(${this.xoffset - this.width()}px) translateY(${ve.top}px)`
				this.config.domSwipeSpacerRight().style.transform = `
				translateX(${this.xoffset + this.width()}px) translateY(${ve.top}px)`
			}
		})
	}

	onHorizontalGestureCompleted(delta: { x: number; y: number }): Promise<unknown> {
		if (
			this.virtualElement &&
			this.virtualElement.entity &&
			!this.config.isSwipeDisabledForEntity(this.virtualElement.entity) &&
			Math.abs(delta.x) > HORIZONTAL_ACTION_DISTANCE
		) {
			// the gesture is completed
			return this.finishHorizontal(this.virtualElement, this.virtualElement.entity, delta)
		} else {
			return this.reset(delta)
		}
	}

	private async finishHorizontal(
		virtualElement: ListRow<ElementType, VH>,
		entity: ElementType,
		delta: {
			x: number
			y: number
		},
	): Promise<unknown> {
		if (this.xoffset === 0) {
			return
		}
		try {
			const listTargetPosition = this.xoffset < 0 ? -this.width() : this.width()

			await Promise.all([
				// animate swipe action to full width
				virtualElement.domElement &&
					animations.add(
						virtualElement.domElement,
						transform(TransformEnum.TranslateX, this.xoffset, listTargetPosition).chain(
							TransformEnum.TranslateY,
							virtualElement.top,
							virtualElement.top,
						),
						{
							easing: ease.inOut,
							duration: DefaultAnimationTime * 2,
						},
					),
				animations.add(
					this.config.domSwipeSpacerLeft(),
					transform(TransformEnum.TranslateX, this.xoffset - this.width(), listTargetPosition - this.width()).chain(
						TransformEnum.TranslateY,
						virtualElement.top,
						virtualElement.top,
					),
					{
						easing: ease.inOut,
						duration: DefaultAnimationTime * 2,
					},
				),
				animations.add(
					this.config.domSwipeSpacerRight(),
					transform(TransformEnum.TranslateX, this.xoffset + this.width(), listTargetPosition + this.width()).chain(
						TransformEnum.TranslateY,
						virtualElement.top,
						virtualElement.top,
					),
					{
						easing: ease.inOut,
						duration: DefaultAnimationTime * 2,
					},
				),
			])

			this.xoffset = listTargetPosition

			let swipeDecision: ListSwipeDecision
			try {
				if (delta.x < 0) {
					swipeDecision = await this.config.onSwipeLeft(entity)
				} else {
					swipeDecision = await this.config.onSwipeRight(entity)
				}
			} catch (e) {
				console.error("rejection in swipe action", e)
				swipeDecision = ListSwipeDecision.Cancel
			}

			if (swipeDecision === ListSwipeDecision.Cancel) {
				await this.reset(delta)
				return
			}

			// fade out element
			this.xoffset = 0

			if (virtualElement.domElement) {
				virtualElement.domElement.style.transform = `translateX(${this.xoffset}px) translateY(${virtualElement.top}px)`
			}

			await Promise.all([
				animations.add(this.config.domSwipeSpacerLeft(), opacity(1, 0, true)),
				animations.add(this.config.domSwipeSpacerRight(), opacity(1, 0, true)),
			])

			// set swipe element to initial configuration
			// with different zoom levels Blink does weird things and shows parts of elements that it shouldn't so we shift them around by a pixel
			this.config.domSwipeSpacerLeft().style.transform = `translateX(${this.xoffset - this.width() - 1}px) translateY(${virtualElement.top}px)`
			this.config.domSwipeSpacerRight().style.transform = `translateX(${this.xoffset + this.width() + 1}px) translateY(${virtualElement.top}px)`
			this.config.domSwipeSpacerRight().style.opacity = ""
			this.config.domSwipeSpacerLeft().style.opacity = ""
		} finally {
			this.virtualElement = null
		}
	}

	private width() {
		return this.config.width()
	}

	private getVirtualElement(): ListRow<ElementType, VH> | null {
		if (!this.virtualElement) {
			// touch coordinates are based on clientX so they are relative to the viewport and we need to adjust them by the position of the list
			this.virtualElement = this.config.getRowForPosition(this.startPos)
		}

		return this.virtualElement
	}

	onVerticalDrag(yDelta: number) {
		super.onVerticalDrag(yDelta)
		if (!this.config.canSwipeDown()) {
			// reset yoffset if we cannot swipe down
			this.yoffset = 0
			return
		}
		this.yoffset = yDelta < 0 ? Math.min(yDelta, 0) : Math.min(yDelta, MAX_VERTICAL_PULL_DISTANCE)

		// Animate the list and down spacer
		window.requestAnimationFrame(() => {
			if (!this.isAnimating) {
				const listElement = this.config.listElement()
				const downSpacer = this.config.domSwipeSpacerDown()
				if (listElement) {
					// Move the entire list down
					listElement.style.transform = `translateY(${this.yoffset}px)`
				}
				downSpacer.style.transform = `translateY(${this.yoffset - component_size.list_row_height}px)`
			}
		})
	}

	async onVerticalGestureCompleted(delta: { x: number; y: number }): Promise<unknown> {
		if (this.config.canSwipeDown() && delta.y > VERTICAL_ACTION_DISTANCE) {
			// the gesture is completed
			return this.finishVertical(delta)
		} else {
			return this.reset(delta)
		}
	}

	private async finishVertical(delta: { x: number; y: number }): Promise<void> {
		if (this.yoffset === 0) {
			return
		}
		try {
			await this.config.onSwipeDown()
		} catch (e) {
			console.error("Swipe down failed", e)
		}
		await this.reset(delta)
	}

	private resetVertical(): Promise<unknown> {
		if (this.yoffset !== 0) {
			const listElement = this.config.listElement()
			const downSpacer = this.config.domSwipeSpacerDown()
			if (listElement) {
				return Promise.all([
					animations.add(listElement, transform(TransformEnum.TranslateY, this.yoffset, 0), {
						easing: ease.inOut,
						duration: 200,
					}),
					animations.add(
						downSpacer,
						transform(TransformEnum.TranslateY, this.yoffset - component_size.list_row_height, -component_size.list_row_height),
						{ easing: ease.inOut, duration: 200 },
					),
				]).then(() => {
					this.yoffset = 0
				})
			}
			this.yoffset = 0
		}
		return Promise.resolve()
	}

	async reset(delta: { x: number; y: number }): Promise<unknown> {
		try {
			if (this.yoffset !== 0) {
				return await this.resetVertical()
			}
			return await this.resetHorizontal()
		} finally {
			this.virtualElement = null
		}
	}

	private resetHorizontal() {
		if (this.xoffset !== 0) {
			const ve = this.virtualElement

			if (ve && ve.domElement && ve.entity) {
				return Promise.all([
					animations.add(ve.domElement, transform(TransformEnum.TranslateX, this.xoffset, 0).chain(TransformEnum.TranslateY, ve.top, ve.top), {
						easing: ease.inOut,
					}),
					animations.add(
						this.config.domSwipeSpacerLeft(),
						transform(TransformEnum.TranslateX, this.xoffset - this.width(), -this.width()).chain(TransformEnum.TranslateY, ve.top, ve.top),
						{
							easing: ease.inOut,
						},
					),
					animations.add(
						this.config.domSwipeSpacerRight(),
						transform(TransformEnum.TranslateX, this.xoffset + this.width(), this.width()).chain(TransformEnum.TranslateY, ve.top, ve.top),
						{
							easing: ease.inOut,
						},
					),
				]).then(() => {
					this.xoffset = 0
				})
			}
			this.xoffset = 0
		}
		return Promise.resolve()
	}
}
