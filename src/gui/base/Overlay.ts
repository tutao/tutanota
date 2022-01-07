import m, {Children, Component, Vnode} from "mithril"
import type {DomMutation} from "../animation/Animations"
import {animations} from "../animation/Animations"
import {requiresStatusBarHack} from "../main-styles"
import {ease} from "../animation/Easing"
import {LayerType} from "../../RootView"
import {remove} from "@tutao/tutanota-utils"
import type {lazy} from "@tutao/tutanota-utils"
import {assertMainOrNodeBoot} from "../../api/common/Env"
assertMainOrNodeBoot()
export type PositionRect = {
    top?: string | null
    left?: string | null
    right?: string | null
    width?: string | null
    bottom?: string | null
    height?: string | null
    zIndex?: LayerType
}
type AnimationProvider = (dom: HTMLElement) => DomMutation
type OverlayAttrs = {
    component: Component<void>
    position: lazy<PositionRect>
    createAnimation?: AnimationProvider
    closeAnimation?: AnimationProvider
    shadowClass: string
}

type Overlay = [OverlayAttrs, HTMLElement | null, number]
const overlays: Array<Overlay> = []
let key = 0
export function displayOverlay(
    position: lazy<PositionRect>,
    component: Component<void>,
    createAnimation?: AnimationProvider,
    closeAnimation?: AnimationProvider,
    shadowClass: string = "dropdown-shadow",
): () => Promise<void> {
    const newAttrs = {
        position,
        component,
        createAnimation,
        closeAnimation,
        shadowClass,
    }
    const pair = [newAttrs, null, key++] as Overlay
    overlays.push(pair)
    return async () => {
        const dom = pair[1]
        const animation =
            newAttrs.closeAnimation && dom
                ? animations.add(dom, newAttrs.closeAnimation(dom), {
                      duration: 100,
                      easing: ease.in,
                  })
                : Promise.resolve()
        await animation

        if (remove(overlays, pair)) {
            m.redraw()
        }
    }
}
export const overlay: Component<void> = {
    view: (): Children =>
        m(
            "#overlay",
            {
                style: {
                    display: overlays.length > 0 ? "" : "none", // display: null not working for IE11
                },
                "aria-hidden": overlays.length === 0,
            },
            overlays.map(overlayAttrs => {
                const [attrs, dom, key] = overlayAttrs
                const position = attrs.position()
                return m(
                    ".abs.elevated-bg." + attrs.shadowClass,
                    {
                        key,
                        style: {
                            width: position.width,
                            top: position.top,
                            bottom: position.bottom,
                            right: position.right,
                            left: position.left,
                            height: position.height,
                            "z-index": position.zIndex ? position.zIndex : LayerType.Overlay,
                            "margin-top": requiresStatusBarHack() ? "20px" : "env(safe-area-inset-top)", // insets for iPhone X
                        },
                        oncreate: (vnode) => {
							const dom = vnode.dom as HTMLElement
                            overlayAttrs[1] = dom

                            if (attrs.createAnimation) {
                                animations.add(dom, attrs.createAnimation(dom))
                            }
                        },
                        onremove: () => {
                            overlayAttrs[1] = null
                        },
                    },
                    m(attrs.component),
                )
            }),
        ),
}