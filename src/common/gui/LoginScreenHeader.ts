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
				".mt-l.flex.justify-center.mb",
				m(
					".logo.logo-height.mt-safe-inset",
					{
						...landmarkAttrs(AriaLandmarks.Banner, "Tuta Mail logo"),
					},
					m.trust(theme.logo),
				),
		  ),
)
