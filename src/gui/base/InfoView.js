import m from "mithril"
import {px} from "../size"
import {assertMainOrNodeBoot} from "../../api/Env"
import {AriaLandmarks, TabIndex} from "../../api/common/TutanotaConstants"

assertMainOrNodeBoot()

export class InfoView {
	title: lazy<string>;
	content: lazy<VirtualElement>;

	constructor(title, content) {
		this.title = title
		this.content = content
	}

	view() {
		return m(".main-view.flex.items-center.justify-center.mlr", {
			tabindex: TabIndex.Programmatic,
			role: AriaLandmarks.Main,
			style: {
				'max-height': px(450),
			}
		}, m(".message.center.max-width-l", [
			m("h2", this.title()),
			this.content()
		]))
	}

}
