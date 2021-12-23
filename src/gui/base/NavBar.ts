// @flow
import m from "mithril"
import {AriaLandmarks, landmarkAttrs} from "../AriaUtils"
import {assertMainOrNode} from "../../api/common/Env"


assertMainOrNode()

export type Attrs = void

export class NavBar implements MComponent<Attrs> {
	view({children}: Vnode<Attrs>): Children {
		return m("nav.nav-bar.flex-end" + landmarkAttrs(AriaLandmarks.Navigation, "top"),
			children.map((child) => m(".plr-nav-button", child)),
		);
	}
}
