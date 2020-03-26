import m from "mithril"
import {px} from "../size"
import {assertMainOrNodeBoot} from "../../api/Env"
import {AriaLandmarks} from "../../api/common/TutanotaConstants"
import {landmarkAttrs} from "../../api/common/utils/AriaUtils"

assertMainOrNodeBoot()

export class InfoView {
	title: lazy<string>;
	content: lazy<VirtualElement>;

	constructor(title, content) {
		this.title = title
		this.content = content
	}

	view() {
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
