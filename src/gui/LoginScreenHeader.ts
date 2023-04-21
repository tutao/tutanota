import { pureComponent } from "./base/PureComponent.js"
import { styles } from "./styles.js"
import m from "mithril"
import { DesktopBaseHeader } from "./base/DesktopBaseHeader.js"
import { AriaLandmarks, landmarkAttrs } from "./AriaUtils.js"
import { theme } from "./theme.js"

/** Small header-like view for the login screens. */
export const LoginScreenHeader = pureComponent(() =>
	styles.isDesktopLayout()
		? m(DesktopBaseHeader)
		: m(
				".mt-l.flex.justify-center",
				m(
					".logo.logo-height",
					{
						...landmarkAttrs(AriaLandmarks.Banner, "Tutanota logo"),
					},
					m.trust(theme.logo),
				),
		  ),
)
