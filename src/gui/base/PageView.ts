import m from "mithril"
import {SwipeHandler} from "./SwipeHandler"
import {animations, transform} from "../animation/Animations"
type Page = {
    key: string | number
    nodes: Children
}
type Attrs = {
    previousPage: Page
    currentPage: Page
    nextPage: Page
    onChangePage: (next: boolean) => unknown
}
export class PageView implements Component<Attrs> {
    _viewDom: HTMLElement | null
    _swipeHandler: PageSwipeHandler
    _onChangePage: (arg0: boolean) => unknown

    view({attrs}: Vnode<Attrs>): Children {
        this._onChangePage = next => attrs.onChangePage(next)

        return m(
            ".fill-absolute",
            {
                oncreate: vnode => {
                    this._viewDom = vnode.dom
                    this._swipeHandler = new PageSwipeHandler(vnode.dom, next => this._onChangePage(next))
                },
            },
            [
                m(
                    ".abs",
                    {
                        "aria-hidden": "true",
                        key: attrs.previousPage.key,
                        style: this._viewDom &&
                            this._viewDom.offsetWidth > 0 && {
                                width: this._viewDom.offsetWidth + "px",
                                height: this._viewDom.offsetHeight + "px",
                                transform: `translateX(${-this._viewDom.offsetWidth}px)`,
                            },
                    },
                    attrs.previousPage.nodes,
                ),
                m(
                    ".fill-absolute",
                    {
                        key: attrs.currentPage.key,
                    },
                    attrs.currentPage.nodes,
                ),
                m(
                    ".abs",
                    {
                        "aria-hidden": "true",
                        key: attrs.nextPage.key,
                        style: this._viewDom &&
                            this._viewDom.offsetWidth > 0 && {
                                width: this._viewDom.offsetWidth + "px",
                                height: this._viewDom.offsetHeight + "px",
                                transform: `translateX(${this._viewDom.offsetWidth}px)`,
                            },
                    },
                    attrs.nextPage.nodes,
                ),
            ],
        )
    }
}
export class PageSwipeHandler extends SwipeHandler {
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
        this._xoffset = Math.abs(xDelta) > 40 ? xDelta : 0
        this.touchArea.style.transform = `translateX(${this._xoffset}px)`
    }

    onHorizontalGestureCompleted(delta: {x: number; y: number}): Promise<void> {
        if (Math.abs(delta.x) > 100) {
            this._xoffset = 0
            return animations
                .add(this.touchArea, transform(transform.type.translateX, delta.x, this.touchArea.offsetWidth * (delta.x > 0 ? 1 : -1)))
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

    reset(delta: {x: number; y: number}): Promise<any> {
        if (Math.abs(this._xoffset) > 40) {
            animations.add(this.touchArea, transform(transform.type.translateX, delta.x, 0))
        } else {
            this.touchArea.style.transform = ""
        }

        this._xoffset = 0
        return super.reset(delta)
    }
}