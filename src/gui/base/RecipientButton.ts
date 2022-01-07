import m from "mithril"
import {px, size} from "../size"
import type {clickHandler} from "./GuiUtils"
export type Attrs = {
    label: string
    click: clickHandler
    style?: {}
}
export class RecipientButton implements Component<Attrs> {
    view({attrs}: Vnode<Attrs>): Children {
        return m(
            "button.mr-button.secondary.print",
            {
                style: Object.assign(
                    {
                        "white-space": "normal",
                        "word-break": "break-all",
                        "margin-top": px(size.vpad_small),
                        "margin-bottom": px(size.vpad_small),
                    },
                    attrs.style,
                ),
                onclick: e => attrs.click(e, e.target),
            },
            [attrs.label],
        )
    }
}