// @flow
import m from "mithril"
import {assertMainOrNode} from "../../api/common/Env"
import {AriaLandmarks, landmarkAttrs} from "../AriaUtils"


assertMainOrNode()

export type Attrs = void

export class NavBar implements MComponent<Attrs> {
	view({children}: Vnode<Attrs>): Children {
		return m("nav.nav-bar.flex-end" + landmarkAttrs(AriaLandmarks.Navigation, "top"),
			children.map((child) => m(".plr-nav-button", child)),
		);
	}
}
