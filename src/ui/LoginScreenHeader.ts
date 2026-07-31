import { pureComponent } from "./base/PureComponent.js"
import { Styles } from "./styles.js"
import m from "mithril"
import { DesktopBaseHeader } from "./base/DesktopBaseHeader.js"
import { AriaLandmarks, landmarkAttrs } from "./AriaUtils.js"
import { theme } from "./theme.js"

/** Small header-like view for the login screens. */
export const LoginScreenHeader = pureComponent(() =>
	Styles.get().isDesktopLayout()
		? m(DesktopBaseHeader)
		: m(
				".mt-32.flex.justify-center.mb-16",
				m(
					".logo.logo-height.mt-safe-inset",
					{
						...landmarkAttrs(AriaLandmarks.Banner, "Tuta Mail logo"),
					},
					m.trust(theme.logo),
				),
			),
)
