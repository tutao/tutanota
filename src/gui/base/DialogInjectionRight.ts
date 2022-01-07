
import m, {Children, Component, Vnode} from "mithril"
import type {DialogHeaderBarAttrs} from "./DialogHeaderBar"
import {DialogHeaderBar} from "./DialogHeaderBar"
import {px} from "../size"
import type {MaybeLazy} from "@tutao/tutanota-utils"
import {resolveMaybeLazy} from "@tutao/tutanota-utils"
import Stream from "mithril/stream";
import {Class} from "global"

export type DialogInjectionRightAttrs<T> = {
    visible: Stream<boolean>
    headerAttrs: MaybeLazy<DialogHeaderBarAttrs>
    component: Class<Component<T>>
    componentAttrs: T
}
export class DialogInjectionRight<T> implements Component<DialogInjectionRightAttrs<T>> {
    view(vnode: Vnode<DialogInjectionRightAttrs<T>>): Children {
        const {attrs} = vnode
        const {component, componentAttrs} = attrs

        if (attrs.visible()) {
            return m(".flex-grow-shrink-auto.flex-transition.ml-s.rel.dialog.dialog-width-m.elevated-bg.dropdown-shadow", [
                m(".dialog-header.plr-l", m(DialogHeaderBar, resolveMaybeLazy(attrs.headerAttrs))),
                m(".dialog-container.scroll.plr-l", m(component, componentAttrs)),
            ])
        } else {
            return m(".flex-hide.flex-transition.rel", {
                style: {
                    maxWidth: px(0),
                },
            })
        }
    }
}