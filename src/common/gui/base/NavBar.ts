import m, { Child, Children, Component, Vnode } from "mithril"
import { AriaLandmarks, landmarkAttrs } from "../AriaUtils"
import { assertMainOrNode } from "../../api/common/Env"

assertMainOrNode()
export type Attrs = void

export class NavBar implements Component<Attrs> {
	view({ children }: Vnode<Attrs>): Children {
		return m(
			"nav.nav-bar.flex-end",
			landmarkAttrs(AriaLandmarks.Navigation, "top"),
			(children as Array<Child>).map((child) => m(".plr-nav-button", child)),
		)
	}
}
