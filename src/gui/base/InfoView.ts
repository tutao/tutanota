//@flow
import m from "mithril"
import {px} from "../size"
import {AriaLandmarks, landmarkAttrs} from "../AriaUtils"
import type {lazy} from "@tutao/tutanota-utils"
import {assertMainOrNode} from "../../api/common/Env"

assertMainOrNode()

export class InfoView {
	title: lazy<string>;
	content: lazy<Children>;

	constructor(title: lazy<string>, content: lazy<Children>) {
		this.title = title
		this.content = content
	}

	view(): Children {
		return m(".main-view.flex.items-center.justify-center.mlr" + landmarkAttrs(AriaLandmarks.Main), {
			style: {
				'max-height': px(450),
			}
		}, m(".message.center.max-width-l", [
			m("h2", this.title()),
			this.content()
		]))
	}

}
