import m from "mithril"
import type {NavButtonAttrs} from "../../gui/base/NavButtonN"
import {isNavButtonSelected, NavButtonN} from "../../gui/base/NavButtonN"
import type {ButtonAttrs} from "../../gui/base/ButtonN"
import {ButtonN} from "../../gui/base/ButtonN"
import {animations, opacity} from "../../gui/animation/Animations"
import {CounterBadge} from "../../gui/base/CounterBadge"
import {getNavButtonIconBackground, theme} from "../../gui/theme"
import {px} from "../../gui/size"
export type MailFolderRowAttrs = {
    count: number
    button: NavButtonAttrs
    rightButton: ButtonAttrs | null
}
export class MailFolderRow implements Component<MailFolderRowAttrs> {
    view(vnode: Vnode<MailFolderRowAttrs>): Children {
        const {count, button, rightButton} = vnode.attrs
        return m(".folder-row.plr-l.flex.flex-row" + (isNavButtonSelected(button) ? ".row-selected" : ""), {}, [
            m(CounterBadge, {
                count,
                position: {
                    top: px(0),
                    left: px(3),
                },
                color: theme.navigation_button_icon,
                background: getNavButtonIconBackground(),
            }),
            m(NavButtonN, button),
            rightButton
                ? m(
                      ButtonN,
                      Object.assign({}, rightButton, {
                          oncreate: vnode => {
                              vnode.dom.style.opacity = "0"
                              animations.add(vnode.dom, opacity(0, 1, true))
                          },
                          onbeforeremove: vnode => {
                              vnode.dom.style.opacity = "1"
                              return animations.add(vnode.dom, opacity(1, 0, true))
                          },
                      }),
                  )
                : null,
        ])
    }
}