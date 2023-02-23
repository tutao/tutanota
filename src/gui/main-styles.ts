import { styles } from "./styles"
import { px, size } from "./size"
import { client } from "../misc/ClientDetector"
import { lang } from "../misc/LanguageViewModel"
import { noselect, position_absolute, positionValue } from "./mixins"
import { assertMainOrNodeBoot, isAdminClient, isApp, isElectronClient } from "../api/common/Env"
import { getElevatedBackground, getNavigationMenuBg, theme } from "./theme"
import { BrowserType } from "../misc/ClientConstants"
import { stateBgActive, stateBgFocus, stateBgHover } from "./builtinThemes.js"

assertMainOrNodeBoot()

export function getFonts(): string {
	// see https://bitsofco.de/the-new-system-font-stack/
	const fonts: Array<string> = [
		"-apple-system",
		"system-ui",
		"BlinkMacSystemFont",
		"Segoe UI",
		"Roboto",
		"Helvetica Neue",
		"Helvetica",
		"Arial",
		"sans-serif",
	]
	// workaround for incorrect Japanese font see https://github.com/tutao/tutanota/issues/1909
	if (env.platformId === "win32" && lang.code === "ja") fonts.push("SimHei", "黑体")
	fonts.push("Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol")
	return fonts.join(", ")
}

const boxShadow = `0 2px 12px rgba(0, 0, 0, 0.4), 0 10px 40px rgba(0, 0, 0, 0.3)`
styles.registerStyle("main", () => {
	return {
		"#link-tt": isElectronClient()
			? {
					"pointer-events": "none",
					"font-size": px(size.font_size_small),
					"padding-left": px(size.hpad_small),
					"padding-right": px(size.hpad_small),
					"padding-top": px(size.vpad_xs),
					position: "fixed",
					bottom: px(size.vpad_xs),
					left: px(size.vpad_xs),
					"text-align": "center",
					color: theme.content_bg,
					"text-decoration": "none",
					"background-color": theme.content_fg,
					border: "1px solid " + theme.content_bg,
					opacity: 0,
					transition: "opacity .1s linear",
					"font-family": "monospace",
			  }
			: {},
		"#link-tt.reveal": isElectronClient()
			? {
					opacity: 1,
					transition: "opacity .1s linear",
					"z-index": 100,
			  }
			: {},
		"*:not(input):not(textarea)": isAdminClient()
			? {}
			: {
					"user-select": "none",

					/* disable selection/Copy for UI elements*/
					"-ms-user-select": "none",
					"-webkit-user-select": "none",
					"-moz-user-select": "none",
					"-webkit-touch-callout": "none",

					/* disable the IOS popup when long-press on a link */
					"-webkit-tap-highlight-color": "rgba(0, 0, 0, 0)",
			  },
		"*:not(input):not(textarea):not([draggable='true'])": {
			"-webkit-user-drag": "none",
		},
		// Disable outline for mouse and touch navigation
		":where(.mouse-nav) *, :where(.touch-nav) *": {
			outline: "none",
		},
		".selectable": {
			"user-select": "text !important",
			"-ms-user-select": "text !important",
			"-webkit-user-select": "text !important",
			"-moz-user-select": "text !important",
			"-webkit-touch-callout": "default !important",
		},
		".selectable *": {
			"user-select": "text !important",
			"-ms-user-select": "text !important",
			"-webkit-user-select": "text !important",
			"-moz-user-select": "text !important",
			"-webkit-touch-callout": "default !important",
		},
		"@font-face": {
			"font-family": "'Ionicons'",
			src: `url('${window.tutao.appState.prefixWithoutFile}/images/font.ttf') format('truetype')`,
			"font-weight": "normal",
			"font-style": "normal",
		},
		// Allow long-click contextual actions for iOS
		".touch-callout *": {
			"-webkit-touch-callout": "default !important",
		},

		/*
	 Box Sizing
	 */
		[`html, body, div, article, section, main, footer, header, form, fieldset, legend,
            pre, code, p, a, h1, h2, h3, h4, h5, h6, ul, ol, li, dl, dt, dd, textarea,
            input[type="email"], input[type="number"], input[type="password"],
            input[type="tel"], input[type="text"], input[type="url"], .border-box`]: {
			"box-sizing": "border-box",
		},
		a: {
			color: "inherit",
		},
		":root": {
			// We need it because we can't get env() value from JS directly
			"--safe-area-inset-bottom": "env(safe-area-inset-bottom)",
			"--safe-area-inset-top": "env(safe-area-inset-top)",
			"--safe-area-inset-right": "env(safe-area-inset-right)",
			"--safe-area-inset-left": "env(safe-area-inset-left)",
		},
		"html, body": {
			height: "100%",
			margin: 0,
			width: "100%",
		},
		html: {
			"-webkit-font-smoothing": "subpixel-antialiased",
		},
		// define font-smoothing for css animation in safari
		body: {
			position: "fixed",
			// Fix body for iOS & Safari
			// It is inlined to "transparent" in HTML so we have to overwrite it.
			"background-color": `${theme.content_bg} !important`,
		},
		"button, textarea": {
			padding: 0,
			"text-align": "left",
		},
		button: {
			background: "transparent", // removes default browser style for buttons
		},
		"button:disabled": {
			cursor: "default",
		},
		"body, button": {
			// Yes we have to tell buttons separately because browser button styles override general body ones
			overflow: "hidden",
			// see: https://www.smashingmagazine.com/2015/11/using-system-ui-fonts-practical-guide/ and github
			"font-family": getFonts(),
			"font-size": px(size.font_size_base),
			"line-height": size.line_height,
			color: theme.content_fg,
			"-webkit-text-size-adjust": "none", // fix for safari browser
		},
		"small, .small": {
			"font-size": px(size.font_size_small),
		},
		".smaller": {
			"font-size": px(size.font_size_smaller),
		},
		".b": {
			"font-weight": "bold",
		},
		".font-weight-600": {
			"font-weight": "600",
		},
		".i": {
			"font-style": "italic",
		},
		".click": {
			cursor: "pointer",
			"-webkit-tap-highlight-color": "rgba(255, 255, 255, 0)",
		},
		".click-disabled": {
			cursor: "default",
		},
		".text": {
			cursor: "text",
		},
		".overflow-hidden": {
			overflow: "hidden",
		},
		".overflow-x-hidden": {
			"overflow-x": "hidden",
		},
		".overflow-y-hidden": {
			"overflow-y": "hidden",
		},
		".overflow-y-visible": {
			"overflow-y": "visible !important",
		},
		".overflow-visible": {
			overflow: "visible",
		},
		"h1, h2, h3, h4, h5, h6": {
			margin: 0,
			"font-weight": "normal",
		},
		"h1, .h1": {
			"font-size": px(size.font_size_base * 2),
		},
		"h2, .h2": {
			"font-size": px(size.font_size_base * 1.8),
		},
		"h3, .h3": {
			"font-size": px(size.font_size_base * 1.6),
		},
		"h4, .h4": {
			"font-size": px(size.font_size_base * 1.4),
		},
		"h5, .h5": {
			"font-size": px(size.font_size_base * 1.2),
		},
		"h6, .h6": {
			"font-size": px(size.font_size_base * 1.1),
		},
		"input, button, select, textarea": {
			"font-family": "inherit",
			"font-size": "inherit",
			"line-height": "inherit",
		},
		".hr": {
			margin: 0,
			border: "none",
			height: "1px",
			"background-color": theme.list_border,
		},
		".border": {
			border: `1px solid ${theme.content_border}`,
		},
		".border-top": {
			"border-top": `1px solid ${theme.content_border}`,
		},
		"#mail-body.break-pre pre": {
			"white-space": "pre-wrap",
			"word-break": "normal",
			"overflow-wrap": "anywhere",
		},
		".white-space-pre": {
			"white-space": "pre",
		},
		".min-content": {
			width: "min-content",
			height: "min-content",
		},
		// margins
		".m-0": {
			margin: 0,
		},
		".mt": {
			"margin-top": px(size.vpad),
		},
		".mt-xs": {
			"margin-top": px(size.vpad_xs),
		},
		".mt-s": {
			"margin-top": px(size.vpad_small),
		},
		".mt-l": {
			"margin-top": px(size.vpad_large),
		},
		".mt-m": {
			"margin-top": px(size.hpad),
		},
		".mt-xl": {
			"margin-top": px(size.vpad_xl),
		},
		".mt-form": {
			"margin-top": px(size.hpad_medium),
		},
		".mb-0": {
			"margin-bottom": 0,
		},
		".mb": {
			"margin-bottom": px(size.vpad),
		},
		".mb-s": {
			"margin-bottom": px(size.vpad_small),
		},
		".mb-xs": {
			"margin-bottom": px(size.vpad_xs),
		},
		".mb-l": {
			"margin-bottom": px(size.vpad_large),
		},
		".mb-xl": {
			"margin-bottom": px(size.vpad_xl),
		},
		".mlr": {
			"margin-left": px(size.hpad),
			"margin-right": px(size.hpad),
		},
		".mlr-button": {
			"margin-left": px(size.hpad_button),
			"margin-right": px(size.hpad_button),
		},
		".mlr-l": {
			"margin-left": px(size.hpad_large),
			"margin-right": px(size.hpad_large),
		},
		".mr-s": {
			"margin-right": px(size.vpad_small),
		},
		".mr-xs": {
			"margin-right": px(size.vpad_xs),
		},
		".ml-s": {
			"margin-left": px(size.vpad_small),
		},
		".ml-m": {
			"margin-left": px(size.hpad_medium),
		},
		".ml-l": {
			"margin-left": px(size.hpad_large),
		},
		".mr-m": {
			"margin-right": px(size.hpad_medium),
		},
		".mr-l": {
			"margin-right": px(size.hpad_large),
		},
		".mlr-s": {
			"margin-left": px(size.hpad_small),
			"margin-right": px(size.hpad_small),
		},
		".mtb-0": {
			"margin-top": px(0),
			"margin-bottom": px(0),
		},
		".mr": {
			"margin-right": px(size.hpad),
		},
		".ml": {
			"margin-left": px(size.hpad),
		},
		// paddings
		".p0": {
			padding: "0",
		},
		".pt-responsive": {
			"padding-top": px(size.hpad_large * 3),
		},
		".pt": {
			"padding-top": px(size.vpad),
		},
		".pt-0": {
			"padding-top": 0,
		},
		".pt-s": {
			"padding-top": px(size.vpad_small),
		},
		".pt-l": {
			"padding-top": px(size.vpad_large),
		},
		".pt-m": {
			"padding-top": px(size.vpad),
		},
		".pt-ml": {
			"padding-top": px(size.vpad_ml),
		},
		".pt-xl": {
			"padding-top": px(size.vpad_xl),
		},
		".pt-xs": {
			"padding-top": px(size.vpad_xs),
		},
		".pb-0": {
			"padding-bottom": 0,
		},
		".pb": {
			"padding-bottom": px(size.vpad),
		},
		".pb-2": {
			"padding-bottom": "2px",
		},
		// for dropdown toggles
		".pb-s": {
			"padding-bottom": px(size.vpad_small),
		},
		".pb-xs": {
			"padding-bottom": px(size.vpad_xs),
		},
		".pb-l": {
			"padding-bottom": px(size.vpad_large),
		},
		".pb-xl": {
			"padding-bottom": px(size.vpad_xl),
		},
		".pb-m": {
			"padding-bottom": px(size.vpad),
		},
		".pb-ml": {
			"padding-bottom": px(size.vpad_ml),
		},
		".pb-floating": {
			"padding-bottom": px(size.button_floating_size + size.hpad_large),
		},
		// allow scrolling across the floating button
		".plr": {
			"padding-left": px(size.hpad),
			"padding-right": px(size.hpad),
		},
		".pl": {
			"padding-left": px(size.hpad),
		},
		".pl-s": {
			"padding-left": px(size.hpad_small),
		},
		".pl-m": {
			"padding-left": px(size.hpad),
		},
		".pl-xs": {
			"padding-left": px(size.vpad_xs),
		},
		".pr": {
			"padding-right": px(size.hpad),
		},
		".pr-s": {
			"padding-right": px(size.hpad_small),
		},
		".pr-m": {
			"padding-right": px(size.vpad),
		},
		".plr-s": {
			"padding-left": px(size.hpad_small),
			"padding-right": px(size.hpad_small),
		},
		".plr-m": {
			"padding-left": px(size.hpad),
			"padding-right": px(size.hpad),
		},
		// p-l will be overwritten in media query mobile
		".plr-l": {
			"padding-left": px(size.hpad_large),
			"padding-right": px(size.hpad_large),
		},
		".pl-l": {
			"padding-left": px(size.hpad_large),
		},
		".pr-l": {
			"padding-right": px(size.hpad_large),
		},
		".plr-button": {
			"padding-left": px(size.hpad_button),
			"padding-right": px(size.hpad_button),
		},
		".plr-button-double": {
			"padding-left": px(size.hpad_button * 2),
			"padding-right": px(size.hpad_button * 2),
		},
		".plr-nav-button": {
			"padding-left": px(size.hpad_nav_button),
			"padding-right": px(size.hpad_nav_button),
		},
		".pl-button": {
			"padding-left": px(size.hpad_button),
		},
		".mr-button": {
			"margin-right": px(size.hpad_button),
		},
		".mt-negative-hpad-button": {
			"margin-top": px(-size.hpad_button),
		},
		".mt-negative-s": {
			"margin-top": px(-size.vpad_small),
		},
		".mt-negative-m": {
			"margin-top": px(-size.vpad),
		},
		".mt-negative-l": {
			"margin-top": px(-size.hpad_large),
		},
		".mr-negative-s": {
			"margin-right": px(-size.hpad_button),
		},
		".ml-negative-s": {
			"margin-left": px(-size.hpad_button),
		},
		// negative margin to handle the default padding of a button
		".ml-negative-l": {
			"margin-left": px(-size.hpad_large),
		},
		".ml-negative-xs": {
			"margin-left": px(-3),
		},
		".ml-negative-bubble": {
			"margin-left": px(-7),
		},
		".mr-negative-m": {
			"margin-right": px(-(size.hpad_button + size.hpad_nav_button)),
		},
		// negative margin to handle the padding of a nav button
		".fixed-bottom-right": {
			position: "fixed",
			bottom: px(size.hpad),
			right: px(size.hpad_large),
		},
		".mr-negative-xs": {
			"margin-right": px(-3),
		},
		// common setting
		".text-ellipsis": {
			overflow: "hidden",
			"text-overflow": "ellipsis",
			"min-width": 0,
			"white-space": "nowrap",
		},
		".min-width-0": {
			"min-width": 0,
		},
		// used to enable text ellipsis in flex child elements see https://css-tricks.com/flexbox-truncated-text/
		".text-break": {
			overflow: "hidden",
			"word-break": "normal",
			"overflow-wrap": "anywhere",
		},
		".break-word": {
			"word-break": "normal",
			"overflow-wrap": "break-word",
		},
		".break-word-links a": {
			"word-wrap": "break-word",
		},
		".text-prewrap": {
			"white-space": "pre-wrap",
		},
		".text-preline": {
			"white-space": "pre-line",
		},
		".text-pre": {
			"white-space": "pre",
		},
		".line-break-anywhere": {
			"line-break": "anywhere",
		},
		".z1": {
			"z-index": "1",
		},
		".z2": {
			"z-index": "2",
		},
		".z3": {
			"z-index": "3",
		},
		".z4": {
			"z-index": "4",
		},
		".noselect": noselect,
		".no-wrap": {
			"white-space": "nowrap",
		},
		".height-100p": {
			height: "100%",
		},
		".view-columns": {
			overflow: "hidden",
		},
		".view-column": {
			"will-change": "transform",
		},
		".will-change-alpha": {
			"will-change": "alpha",
		},
		// borders
		".border-bottom": {
			"border-bottom": `1px solid ${theme.content_border}`,
		},
		".border-left": {
			"border-left": `1px solid ${theme.content_border}`,
		},
		// colors
		".bg-transparent": {
			"background-color": "transparent",
		},
		".bg-white": {
			"background-color": "white",
		},
		".content-black": {
			color: "black",
		},
		".content-fg": {
			color: theme.content_fg,
		},
		".content-accent-fg": {
			color: theme.content_accent,
		},
		".svg-content-fg path": {
			fill: theme.content_fg,
		},
		".content-bg": {
			"background-color": theme.content_bg,
		},
		".nav-bg": {
			"background-color": theme.navigation_bg,
		},
		".content-hover:hover": {
			color: theme.content_accent,
		},
		".no-hover": {
			"pointer-events": "none",
		},
		".content-message-bg": {
			"background-color": theme.content_message_bg,
		},
		".elevated-bg": {
			"background-color": getElevatedBackground(),
		},
		".list-bg": {
			"background-color": theme.list_bg,
		},
		".list-accent-fg": {
			color: theme.list_accent_fg,
		},
		".svg-list-accent-fg path": {
			fill: theme.list_accent_fg,
		},
		".bg-accent-fg": {
			"background-color": theme.list_accent_fg,
		},
		".list-border-bottom": {
			"border-bottom": `1px solid ${theme.list_border}`,
		},
		".accent-bg": {
			"background-color": theme.content_accent,
			color: theme.content_button_icon_selected,
		},
		".accent-fg": {
			color: theme.content_button_icon,
		},
		".accent-fg path": {
			fill: theme.content_button_icon,
		},
		".red": {
			"background-color": "#840010",
		},
		".swipe-spacer": {
			color: "#ffffff",
		},
		".swipe-spacer path": {
			fill: "#ffffff",
		},
		".blue": {
			"background-color": "#2196F3",
		},
		".underline": {
			"text-decoration": "underline",
		},
		".hover-ul:hover": {
			"text-decoration": isApp() ? "none" : "underline",
		},
		// positioning1
		".fill-absolute": {
			position: "absolute",
			top: 0,
			bottom: 0,
			left: 0,
			right: 0,
		},
		".abs": {
			position: "absolute",
		},
		".fixed": {
			position: "fixed",
		},
		".rel": {
			position: "relative",
		},
		".max-width-s": {
			"max-width": px(360),
		},
		".max-width-m": {
			"max-width": px(450),
		},
		".max-width-l": {
			"max-width": px(800),
		},
		".max-width-200": {
			"max-width": px(200),
		},
		".scroll": {
			"overflow-y": client.overflowAuto,
			"-webkit-overflow-scrolling": "touch",
			"-ms-overflow-style": "-ms-autohiding-scrollbar",
		},
		".scroll-no-overlay": {
			"overflow-y": "auto",
			"-webkit-overflow-scrolling": "touch",
		},
		".scroll-x": {
			"overflow-x": "auto",
			"-webkit-overflow-scrolling": "touch",
			"-ms-overflow-style": "-ms-autohiding-scrollbar",
		},
		"*": {
			"scrollbar-color": `${theme.content_button} transparent`,
			"scrollbar-width": "thin",
		},
		"::-webkit-scrollbar": !client.isMobileDevice()
			? {
					background: "transparent",
					width: "8px", // width of vertical scrollbar
					height: "8px", // width of horizontal scrollbar
			  }
			: {},
		"::-webkit-scrollbar-thumb": !client.isMobileDevice()
			? {
					background: theme.content_button,
					"border-radius": "4px",
			  }
			: {},
		// scrollbar will be disabled for mobile devices, even with .scroll applied,
		// apply this class if you need it to show
		".visible-scrollbar::-webkit-scrollbar": {
			background: "transparent",
			width: "8px",
		},
		".visible-scrollbar::-webkit-scrollbar-thumb": {
			background: theme.content_button,
			"border-radius": "4px",
		},
		//TODO: migrate to .text-center
		".center": {
			"text-align": "center",
		},
		".dropdown-info": {
			"padding-bottom": "5px",
			"padding-left": "16px",
			"padding-right": "16px",
		},
		".dropdown-info + .dropdown-button": {
			"border-top": `1px solid ${theme.content_border}`,
		},
		".dropdown-info + .dropdown-info": {
			"padding-top": "0",
		},
		".text-center": {
			"text-align": "center",
		},
		".right": {
			"text-align": "right",
		},
		".left": {
			"text-align": "left",
		},
		".start": {
			"text-align": "start",
		},
		".statusTextColor": {
			color: theme.content_accent,
		},
		".button-height": {
			height: px(size.button_height),
		},
		".button-min-height": {
			"min-height": px(size.button_height),
		},
		".button-width-fixed": {
			width: px(size.button_height),
		},
		".large-button-height": {
			height: px(size.button_floating_size),
		},
		".large-button-width": {
			width: px(size.button_floating_size),
		},
		// Stretch editor a little bit more than parent so that the content is visible
		".full-height": {
			"min-height": client.isIos() ? "101%" : "100%",
		},
		".full-width": {
			width: "100%",
		},
		".half-width": {
			width: "50%",
		},
		".block": {
			display: "block",
		},
		".inline-block": {
			display: "inline-block",
		},
		".no-text-decoration": {
			"text-decoration": "none",
		},
		".strike": {
			"text-decoration": "line-through",
		},
		".text-align-vertical": {
			"vertical-align": "text-top",
		},
		// flex box
		".flex-space-around": {
			display: "flex",
			"justify-content": "space-around",
		},
		".flex-space-between": {
			display: "flex",
			"justify-content": "space-between",
		},
		".flex-fixed": {
			flex: "0 0 auto",
		},
		".flex-center": {
			display: "flex",
			"justify-content": "center",
		},
		".flex-end": {
			display: "flex",
			"justify-content": "flex-end",
		},
		".flex-start": {
			display: "flex",
			"justify-content": "flex-start",
		},
		".flex-v-center": {
			display: "flex",
			"flex-direction": "column",
			"justify-content": "center",
		},
		".flex-direction-change": {
			display: "flex",
			"justify-content": "center",
		},
		".flex-column": {
			"flex-direction": "column",
		},
		//TODO migrate to .col
		".col": {
			"flex-direction": "column",
		},
		".row": {
			"flex-direction": "row",
		},
		".flex-column-reverse": {
			"flex-direction": "column-reverse",
		},
		//TODO: migrate to col-reverse
		".col-reverse": {
			"flex-direction": "column-reverse",
		},
		".column-gap": {
			"column-gap": px(size.hpad),
		},
		".flex": {
			display: "flex",
		},
		".flex-grow": {
			flex: "1",
		},
		".flex-hide": {
			flex: "0",
		},
		".flex-third": {
			flex: "1 0 0",
			"min-width": "100px",
		},
		// splits a flex layout into three same width columns
		".flex-third-middle": {
			flex: "2 1 0",
		},
		// take up more space for the middle column
		".flex-half": {
			flex: "0 0 50%",
		},
		// splits a flex layout into two same width columns
		".flex-grow-shrink-half": {
			flex: "1 1 50%",
		},
		".flex-nogrow-shrink-half": {
			flex: "0 1 50%",
		},
		".flex-grow-shrink-auto": {
			flex: "1 1 auto",
		},
		// allow element to grow and shrink using the elements width as default size.
		".flex-grow-shrink-150": {
			flex: "1 1 150px",
		},
		".flex-no-shrink": {
			flex: "1 0 0",
		},
		".flex-no-grow-no-shrink-auto": {
			flex: "0 0 auto",
		},
		".flex-no-grow": {
			flex: "0",
		},
		".no-shrink": {
			"flex-shrink": "0",
		},
		".flex-no-grow-shrink-auto": {
			flex: "0 1 auto",
		},
		".flex-wrap": {
			"flex-wrap": "wrap",
		},
		// TODO: migrate to .wrap
		".wrap": {
			"flex-wrap": "wrap",
		},
		// elements may move into the next line
		".items-center": {
			"align-items": "center",
		},
		//TODO: migrate to .center-vertically
		".center-vertically": {
			"align-items": "center",
		},
		".items-end": {
			"align-items": "flex-end",
		},
		".items-start": {
			"align-items": "flex-start",
		},
		".items-base": {
			"align-items": "baseline",
		},
		".items-stretch": {
			"align-items": "stretch",
		},
		".align-self-start": {
			"align-self": "start",
		},
		".align-self-center": {
			"align-self": "center",
		},
		".align-self-end": {
			"align-self": "flex-end",
		},
		".align-self-stretch": {
			"align-self": "stretch",
		},
		".justify-center": {
			"justify-content": "center",
		},
		//TODO: migrate to justify-horizontally
		".center-horizontally": {
			"justify-content": "center",
		},
		".justify-between": {
			"justify-content": "space-between",
		},
		".justify-end": {
			"justify-content": "flex-end",
		},
		".justify-start": {
			"justify-content": "flex-start",
		},
		".justify-right": {
			"justify-content": "right",
		},
		".child-grow > *": {
			flex: "1 1 auto",
		},
		".last-child-fixed > *:last-child": {
			flex: "1 0 100px",
		},
		".limit-width": {
			"max-width": "100%",
		},
		".flex-transition": {
			transition: "flex 200ms linear",
		},
		".border-radius": {
			"border-radius": px(size.border_radius),
		},
		".border-radius-top": {
			"border-top-left-radius": px(size.border_radius),
			"border-top-right-radius": px(size.border_radius),
		},
		".border-radius-bottom": {
			"border-bottom-left-radius": px(size.border_radius),
			"border-bottom-right-radius": px(size.border_radius),
		},
		".border-radius-small": {
			"border-radius": px(size.border_radius_small),
		},
		".border-radius-big": {
			"border-radius": px(size.border_radius_big),
		},
		".editor-border": {
			border: `1px solid ${theme.content_border}`,
			"padding-top": px(size.vpad_small),
			"padding-bottom": px(size.vpad_small),
			"padding-left": px(size.hpad),
			"padding-right": px(size.hpad),
		},
		".editor-border-active": {
			border: `2px solid ${theme.content_accent}`,
			"padding-top": px(size.vpad_small - 1),
			"padding-bottom": px(size.vpad_small - 1),
			"padding-left": px(size.hpad - 1),
			"padding-right": px(size.hpad - 1),
		},
		".editor-no-top-border": {
			"border-top-color": "transparent",
		},
		// icon
		".icon": {
			height: px(size.icon_size_medium),
			width: px(size.icon_size_medium),
		},
		".icon > svg": {
			height: px(size.icon_size_medium),
			width: px(size.icon_size_medium),
		},
		".icon-progress-search": {
			height: px(20),
			width: px(20),
		},
		".icon-progress-search > svg": {
			height: px(20),
			width: px(20),
		},
		".icon-progress-tiny": {
			height: px(15),
			width: px(15),
		},
		".icon-progress-tiny > svg": {
			height: px(15),
			width: px(15),
		},
		".icon-small": {
			height: px(size.font_size_small),
			width: px(size.font_size_small),
		},
		".icon-small > svg": {
			height: px(size.font_size_small),
			width: px(size.font_size_small),
		},
		".icon-large": {
			height: px(size.icon_size_large),
			width: px(size.icon_size_large),
		},
		".icon-large > svg": {
			height: px(size.icon_size_large),
			width: px(size.icon_size_large),
		},
		".icon-xl": {
			height: px(size.icon_size_xl),
			width: px(size.icon_size_xl),
		},
		".icon-xl > svg": {
			height: px(size.icon_size_xl),
			width: px(size.icon_size_xl),
		},
		".icon-message-box": {
			height: px(size.icon_message_box),
			width: px(size.icon_message_box),
		},
		".icon-message-box > svg": {
			height: px(size.icon_message_box),
			width: px(size.icon_message_box),
		},
		".icon-progress > svg": {
			"animation-name": "rotate-icon",
			"animation-duration": "2s",
			"animation-iteration-count": "infinite",
			"animation-timing-function": "calculatePosition",
			"transform-origin": "50% 50%",
			display: "inline-block",
		},
		".icon-button": {
			"border-radius": "25%",
			width: px(size.button_height),
			height: px(size.button_height),
			"max-width": px(size.button_height),
			"max-height": px(size.button_height),
		},
		".center-h": {
			margin: "0 auto",
		},
		".toggle-button": {
			"border-radius": "25%",
			width: px(size.button_height),
			height: px(size.button_height),
			"max-width": px(size.button_height),
			"max-height": px(size.button_height),
		},
		".compact": {
			width: `${size.button_height_compact}px !important`,
			height: `${size.button_height_compact}px !important`,
		},
		// state-bg is a simulation of a "state layer" from Material but without an additional layer
		// We don't exactly follow transparency for it because we combine transparency with light grey color which works well on both light and dark themes
		".state-bg": {
			background: "transparent",
			transition: "background 0.6s",
			// undoing our default button styling
			opacity: "1 !important",
		},
		// Only enable hover for mouse and keyboard navigation (not touch) because
		// :hover will bet stuck after the touch on mobile.
		// Use :where() to not count towards specificity, otherwise this is more specific
		// than :active (which is unconditional
		":where(.mouse-nav) .state-bg:hover, :where(.keyboard-nav) .state-bg:hover": {
			background: stateBgHover,
			"transition-duration": ".3s",
		},
		":where(.keyboard-nav) .state-bg:focus": {
			background: stateBgFocus,
			"transition-duration": ".3s",
			// disable default focus indicator because we have our own for this element
			outline: "none",
		},
		".state-bg:active, .state-bg[toggled=true]": {
			background: stateBgActive,
			"transition-duration": ".3s",
		},
		".translucent": {
			opacity: "0.4",
		},
		".opaque": {
			opacity: "1",
		},
		"@keyframes rotate-icon": {
			"0%": {
				transform: "rotate(0deg)",
			},
			"100%": {
				transform: "rotate(360deg)",
			},
		},
		// custom styling for views
		// the main view
		".main-view": {
			position: "absolute",
			top: 0,
			right: px(0),
			bottom: px(0),
			left: px(0),
			"overflow-x": "hidden",
		},
		".mlr-safe-inset": {
			"margin-right": "env(safe-area-inset-right)",
			"margin-left": "env(safe-area-inset-left)",
		},
		".plr-safe-inset": {
			"padding-right": "env(safe-area-inset-right)",
			"padding-left": "env(safe-area-inset-left)",
		},
		// header
		".header-nav": {
			position: "relative",
			height: px(size.navbar_height),
			"background-color": theme.header_bg,
			"box-shadow": `0 2px 4px 0 ${theme.header_box_shadow_bg}`,
			"z-index": 2,
			// box_shadow will be overruled by the views background, otherwise
			"margin-top": "env(safe-area-inset-top)", // insets for iPhone X
		},
		"bottom-nav, .bottom-nav": {
			"box-shadow": `0 -2px 4px 0 ${theme.header_box_shadow_bg}`,
			height: positionValue(size.bottom_nav_bar),
			background: theme.header_bg,
			"margin-bottom": "env(safe-area-inset-bottom)",
			"z-index": 2,
		},
		".notification-overlay-content": {
			"margin-left": px(size.vpad),
			"margin-right": px(size.vpad),
			"padding-top": px(size.vpad),
		},
		".logo-circle": {
			width: px(size.button_icon_bg_size),
			height: px(size.button_icon_bg_size),
			"border-radius": "50%",
			overflow: "hidden",
		},
		".dot": {
			width: px(size.hpad_large_mobile + 1),
			height: px(size.hpad_large_mobile + 1),
			"border-radius": "50%",
			overflow: "hidden",
			"margin-top": px(6),
		},
		".news-button": {
			position: "relative",
		},
		".logo": {
			height: px(size.header_logo_height),
		},
		".logo-text": {
			height: px(size.header_logo_height),
			width: px(128),
		},
		".logo-height": {
			height: px(size.header_logo_height),
		},
		".logo-height > svg, .logo-height > img": {
			height: px(size.header_logo_height),
		},
		".custom-logo": {
			width: px(200),
			"background-repeat": "no-repeat",
			"background-size": "auto 100%",
		},
		".header-left": {
			position: "absolute",
			left: "0",
			top: 0,
			bottom: 0,
		},
		".header-right": {
			position: "absolute",
			left: "56px",
			right: "0",
			top: 0,
			bottom: 0,
		},
		".nav-bar-spacer": {
			width: "0px",
			height: "22px",
			"margin-left": "2px",
			"margin-top": "10px",
			"border-color": theme.navigation_border,
			"border-width": "1px",
			"border-style": "solid",
		},
		".search-bar > .text-field": {
			"padding-top": "0 !important",
		},
		// dialogs
		".dialog": {
			"min-width": px(200),
		},
		".dialog-width-l": {
			"max-width": px(800),
		},
		".dialog-width-m": {
			"max-width": px(500),
		},
		".dialog-width-s": {
			"max-width": px(400),
		},
		".dialog-width-alert": {
			"max-width": px(350),
		},
		".dialog-header": {
			"border-bottom": `1px solid ${theme.content_border}`,
			height: px(size.button_height + 1),
		},
		".dialog-header-line-height": {
			"line-height": px(size.button_height),
		},
		".dialog-progress": {
			"text-align": "center",
			padding: px(size.hpad_large),
			width: `calc(100% - ${2 * size.hpad}px)`,
		},
		".faq-items img": {
			"max-width": "100%",
			height: "auto",
		},
		".dialog-container": position_absolute(size.button_height + 1, 0, 0, 0),
		".dialog-contentButtonsBottom": {
			padding: `0 ${px(size.hpad_large)} ${px(size.vpad)} ${px(size.hpad_large)}`,
		},
		".dialog-img": {
			width: px(150),
			height: "auto",
		},
		".dialog-buttons": {
			"border-top": `1px solid ${theme.content_border}`,
		},
		".dialog-buttons > button": {
			flex: "1",
		},
		".dialog-buttons > button:not(:first-child)": {
			"border-left": `1px solid ${theme.content_border}`,
			"margin-left": "0",
		},
		".dialog-max-height": {
			"max-height": "calc(100vh - 100px)",
		},
		// mail folder view column
		" .folder-column": {
			"background-color": theme.navigation_bg,
			height: "100%",
			"padding-top": "env(safe-area-inset-top)",
		},
		".list-border-right": {
			"border-right": `1px solid ${theme.list_border}`,
		},
		".folders": {
			"margin-bottom": px(12),
		},
		".folder-row": {
			"align-items": "center",
			position: "relative",
		},
		".template-list-row": {
			"border-left": px(size.border_selection) + " solid transparent",
			"align-items": "center",
			position: "relative",
		},
		".counter-badge": {
			"padding-left": px(4),
			"padding-right": px(4),
			"border-radius": px(8),
			"line-height": px(16),
			"font-size": px(size.font_size_small),
			"font-weight": "bold",
			"min-width": px(16),
			"min-height": px(16),
			"text-align": "center",
		},
		".row-selected": {
			"border-color": `${theme.list_accent_fg} !important`,
			color: `${theme.list_accent_fg}`,
		},
		// FIXME why??
		// ".folder-row > a": {
		// 	"flex-grow": 1,
		// 	"margin-left": px(-size.hpad_button - size.border_selection),
		// },
		".hoverable-list-item:hover": {
			"border-color": `${theme.list_accent_fg} !important`,
			color: `${theme.list_accent_fg}`,
		},
		".expander": {
			height: px(size.button_height),
			"min-width": px(size.button_height),
		},
		// mail view editor
		".mail-viewer-firstLine": {
			"pading-top": px(10),
		},
		".hide-outline": {
			outline: "none",
		},
		".nofocus:focus": {
			outline: "none",
		},
		".input": {
			outline: "none",
		},
		"blockquote.tutanota_quote, blockquote[type=cite]": {
			"border-left": `1px solid ${theme.content_accent}`,
			"padding-left": px(size.hpad),
			"margin-left": px(0),
			"margin-right": px(0),
		},
		".tutanota-placeholder": {
			"max-width": "100px !important",
			"max-height": "100px !important",
		},
		".MsoNormal": {
			margin: 0,
		},
		// list
		".list": {
			overflow: "hidden",
			"list-style": "none",
			margin: 0,
			padding: 0,
			"border-bottom": `1px solid ${theme.list_border}`,
		},
		".list-alternate-background": {
			background: `repeating-linear-gradient(to bottom, ${theme.list_bg}, ${theme.list_bg} ${px(size.list_row_height)},  ${theme.list_alternate_bg} ${px(
				size.list_row_height,
			)}, ${theme.list_alternate_bg} ${px(size.list_row_height * 2)})`,
		},
		".list-row": {
			position: "absolute",
			left: 0,
			right: 0,
			"background-color": theme.list_alternate_bg,
			height: px(size.list_row_height),
			"border-left": px(size.border_selection) + " solid transparent",
		},
		".list-row > div": {
			"margin-left": px(-size.border_selection),
		},
		".odd-row": {
			"background-color": theme.list_bg,
		},
		".list-loading": {
			bottom: 0,
		},
		// mail list
		".teamLabel": {
			color: theme.list_alternate_bg,
			"background-color": theme.list_accent_fg,
		},
		".ion": {
			display: "inline-block",
			"font-family": "'Ionicons'",
			speak: "none",
			"font-style": "normal",
			"font-weight": "normal",
			"font-variant": "normal",
			"text-transform": "none",
			"text-rendering": "auto",
			"line-height": "1",
			"-webkit-font-smoothing": "antialiased",
			"-moz-osx-font-smoothing": "grayscale",
		},
		".badge-line-height": {
			"line-height": px(18),
		},
		".list-font-icons": {
			"letter-spacing": "8px",
			"text-align": "right",
			"margin-right": "-8px",
		},
		".monospace": {
			"font-family": '"Lucida Console", Monaco, monospace',
		},
		".hidden": {
			visibility: "hidden",
		},
		// action bar
		".action-bar": {
			width: "initial",
			"margin-left": "auto",
		},
		".ml-between-s > :not(:first-child)": {
			"margin-left": px(size.hpad_small),
		},
		".mt-between-s > :not(:first-child)": {
			"margin-top": px(size.hpad_small),
		},
		".mt-between-m > :not(:first-child)": {
			"margin-top": px(size.hpad),
		},
		// dropdown
		".dropdown-panel": {
			position: "absolute",
			width: 0,
			height: 0,
			overflow: "hidden", // while the dropdown is slided open we do not want to show the scrollbars. overflow-y is later overwritten to show scrollbars if necessary
		},
		".dropdown-content:first-child": {
			"padding-top": px(size.vpad_small),
		},
		".dropdown-content:last-child": {
			"padding-bottom": px(size.vpad_small),
		},
		".dropdown-content > *": {
			width: "100%",
		},
		".dropdown-shadow": {
			"box-shadow": boxShadow,
		},
		".minimized-shadow": {
			// shadow params: 1.offset-x 2.offset-y 3.blur 4.spread 5.color
			"box-shadow": `0px 0px 4px 2px ${theme.header_box_shadow_bg}`, // similar to header bar shadow
		},
		//dropdown filter bar
		".dropdown-bar": {
			"border-style": "solid",
			"border-width": "0px 0px 1px 0px",
			"border-color": theme.content_border,
			"padding-bottom": "1px",
			"z-index": 1,
			"border-radius": `${size.border_radius}px ${size.border_radius}px 0 0`,
			color: theme.content_fg,
		},
		".dropdown-bar:focus": {
			"border-style": "solid",
			"border-width": "0px 0px 2px 0px",
			"border-color": `${theme.content_accent}`,
			"padding-bottom": "0px",
		},
		".dropdown-button": {
			height: px(size.button_height),
			"padding-left": px(size.vpad),
			"padding-right": px(size.vpad),
		},
		"button, .nav-button": {
			// FIXME whyyy?
			// position: "relative",
			border: 0,
			cursor: "pointer",
			overflow: "hidden",
			"white-space": "nowrap",
			margin: 0,
			// for safari
			"flex-shrink": 0,
			"-webkit-tap-highlight-color": "rgba(255, 255, 255, 0)",
		},
		".nav-button:hover": !isApp()
			? {
					// "text-decoration": "underline",
					// opacity: 0.7,
			  }
			: {},
		".nav-button:focus": client.isDesktopDevice()
			? {
					// "text-decoration": "underline",
					// opacity: 0.7,
			  }
			: {},
		"button:focus, button:hover": client.isDesktopDevice()
			? {
					opacity: 0.7,
			  }
			: {},
		".button-icon": {
			width: px(size.button_icon_bg_size),
			height: px(size.button_icon_bg_size),
			"border-radius": px(size.button_icon_bg_size),
			"min-width": px(size.button_icon_bg_size),
		},
		".login": {
			width: "100%",
			"border-radius": px(size.border_radius),
		},
		".button-content": {
			height: px(size.button_height),
			"min-width": px(size.button_height),
		},
		".primary": {
			color: theme.content_accent,
			"font-weight": "bold",
		},
		".secondary": {
			color: theme.content_accent,
		},
		".textBubble": {
			color: theme.content_accent,
			"padding-top": px(size.text_bubble_tpad),
		},
		".bubble": {
			"max-width": "300px",
			"border-radius": px(size.border_radius),
			height: px(size.button_height_bubble),
			"background-color": theme.button_bubble_bg,
			color: theme.button_bubble_fg,
		},
		".keyword-bubble": {
			"max-width": "300px",
			"border-radius": px(size.border_radius),
			"margin-bottom": px(size.vpad_small / 2),
			"margin-right": px(size.vpad_small / 2),
			"background-color": theme.button_bubble_bg,
			padding: `${px(size.vpad_small / 2)} ${px(size.vpad_small)} ${px(size.vpad_small / 2)} ${px(size.vpad_small)}`,
		},
		".keyword-bubble-no-padding": {
			"max-width": "300px",
			"border-radius": px(size.border_radius),
			margin: px(size.vpad_small / 2),
			"background-color": theme.button_bubble_bg,
		},
		mark: {
			// 'background-color': theme.content_button,
			// 'color': theme.content_button_icon,
			"background-color": theme.content_accent,
			color: theme.content_button_icon_selected,
		},
		".segmentControl": {
			// same border as for bubble buttons
			"border-top": `${px((size.button_height - size.button_height_bubble) / 2)} solid transparent`,
			"border-bottom": `${px((size.button_height - size.button_height_bubble) / 2)} solid transparent`,
		},
		".segmentControl-border": {
			border: `1px solid ${theme.content_border}`,
			"padding-top": px(1),
			"padding-bottom": px(1),
			"padding-left": px(1),
			"padding-right": px(1),
		},
		".segmentControl-border-active": {
			border: `2px solid ${theme.content_accent}`,
			"padding-top": px(0),
			"padding-bottom": px(0),
			"padding-left": px(0),
			"padding-right": px(0),
		},
		".segmentControlItem": {
			cursor: "pointer",
			background: "transparent",
		},
		".segmentControlItem:last-child": {
			"border-bottom-right-radius": px(size.border_radius_small),
			"border-top-right-radius": px(size.border_radius_small),
		},
		".segmentControlItem:first-child": {
			"border-bottom-left-radius": px(size.border_radius_small),
			"border-top-left-radius": px(size.border_radius_small),
		},
		// contact
		".wrapping-row": {
			display: "flex",
			"flex-flow": "row wrap",
			"margin-right": px(-size.hpad_large),
		},
		".wrapping-row > *": {
			flex: "1 0 40%",
			"margin-right": px(size.hpad_large),
			"min-width": px(200), // makes sure the row is wrapped with too large content
		},
		".non-wrapping-row": {
			display: "flex",
			"flex-flow": "row",
			"margin-right": px(-size.hpad_large),
		},
		".non-wrapping-row > *": {
			flex: "1 0 40%",
			"margin-right": px(size.hpad_large),
		},
		// text input field
		".inputWrapper": {
			flex: "1 1 auto",
			background: "transparent",
			overflow: "hidden",
		},
		// textarea
		".input, .input-area": {
			display: "block",
			resize: "none",
			border: 0,
			padding: 0,
			margin: 0,
			// for safari browser
			background: "transparent",
			width: "100%",
			overflow: "hidden",
			color: theme.content_fg,
		},
		".input-no-clear::-ms-clear": {
			// remove the clear (x) button from edge input fields
			display: "none",
		},
		".resize-none": {
			resize: "none",
		},
		// table
		".table": {
			"border-collapse": "collapse",
			"table-layout": "fixed",
			width: "100%",
		},
		".table-header-border tr:first-child": {
			"border-bottom": `1px solid ${theme.content_border}`,
		},
		".table td": {
			"vertical-align": "middle",
		},
		td: {
			padding: 0,
		},
		".column-width-small": {
			width: px(size.column_width_s_desktop),
		},
		".column-width-largest": {},
		".buyOptionBox": {
			position: "relative",
			display: "inline-block",
			border: `1px solid ${theme.content_border}`,
			width: "100%",
			padding: px(10),
		},
		".buyOptionBox.active": {
			border: `1px solid ${theme.content_accent}`,
		},
		".buyOptionBox.highlighted": {
			border: `2px solid ${theme.content_accent}`,
			padding: px(9),
		},
		".info-badge": {
			"border-radius": px(8),
			"line-height": px(16),
			"font-size": px(12),
			"font-weight": "bold",
			width: px(16),
			height: px(16),
			"text-align": "center",
			color: "white",
			background: theme.content_button,
		},
		".tooltip": {
			position: "relative",
			display: "inline-block",
		},
		".tooltip .tooltiptext": {
			visibility: "hidden",
			"background-color": theme.content_button,
			color: theme.content_bg,
			"text-align": "center",
			padding: "5px 5px",
			"border-radius": px(6),
			position: "absolute",
			"z-index": 1,
			top: "150%",
			left: "50%",
		},
		/* we're selecting every element that's after a summary tag and is inside an opened details tag */
		"details[open] summary ~ *": {
			animation: "expand .2s ease-in-out",
		},
		".expand": {
			animation: "expand .2s ease-in-out",
		},
		"@keyframes expand": {
			"0%": {
				opacity: 0,
				"margin-top": "-10px",
				height: "0%",
			},
			"100%": {
				opacity: 1,
				"margin-top": px(0),
				height: "100%",
			},
		},
		".info-badge:active": {
			background: theme.content_bg,
			color: theme.content_button,
		},
		".tooltip:hover .tooltiptext, .tooltip[expanded=true] .tooltiptext": {
			visibility: "visible",
		},
		".ribbon-vertical": {
			position: "absolute",
			"margin-bottom": "80px",
			width: "40px",
			height: "60px",
			background: theme.content_accent,
			top: "-6px",
			right: "10px",
			color: theme.content_bg,
		},
		".ribbon-vertical:before": {
			content: '""',
			position: "absolute",
			height: 0,
			width: 0,
			"border-bottom": `6px solid ${theme.content_accent}`,
			"border-right": "6px solid transparent",
			right: "-6px",
		},
		".ribbon-vertical:after": {
			content: '""',
			position: "absolute",
			height: 0,
			width: 0,
			left: 0,
			"border-left": `20px solid ${theme.content_accent}`,
			"border-right": `20px solid ${theme.content_accent}`,
			"border-bottom": "20px solid transparent",
			bottom: "-20px",
		},
		// calendar
		".flex-end-on-child .button-content": {
			"align-items": "flex-end !important",
		},
		".calendar-checkbox": {
			height: px(22),
			width: px(22),
			"border-width": "1.5px",
			"border-style": "solid",
			"border-radius": "2px",
		},
		".calendar-alternate-background": {
			background: `${theme.list_alternate_bg} !important`,
		},
		".calendar-day:hover": {
			background: theme.list_alternate_bg,
		},
		".calendar-day:hover .calendar-day-header-button": {
			opacity: 1,
		},
		".calendar-day-header-button": {
			opacity: 0,
		},
		".calendar-hour": {
			"border-bottom": `1px solid ${theme.content_border}`,
			height: px(size.calendar_hour_height),
			flex: "1 0 auto",
		},
		".calendar-hour:hover": {
			background: theme.list_alternate_bg,
		},
		".calendar-column-border": {
			"border-right": `1px solid ${theme.content_border}`,
		},
		".calendar-column-border:nth-child(7)": {
			"border-right": "none",
		},
		".calendar-hour-margin": {
			"margin-left": px(size.calendar_hour_width),
		},
		".calendar-day": {
			"border-top": `1px solid ${theme.content_border}`,
			transition: "background 0.4s",
			background: theme.list_bg,
		},
		".cursor-pointer": {
			cursor: "pointer",
		},
		".calendar-day-indicator": {
			// overriden for mobile
			height: "22px",
			"line-height": "24px",
			"text-align": "center",
			"font-size": "14px",
		},
		".calendar-day .calendar-day-indicator:hover": {
			background: theme.list_message_bg,
			opacity: 0.7,
		},
		".calendar-day-number": {
			margin: "3px auto",
			width: "22px",
		},
		".calendar-event": {
			"border-radius": px(4),
			border: ` ${size.calendar_event_border}px solid ${theme.content_bg}`,
			"padding-left": "4px",
			"font-weight": "600",
			"box-sizing": "content-box",
		},
		".fade-in": {
			opacity: 1,
			"animation-name": "fadeInOpacity",
			"animation-iteration-count": 1,
			"animation-timing-function": "ease-in",
			"animation-duration": "200ms",
		},
		"@keyframes fadeInOpacity": {
			"0%": {
				opacity: 0,
			},
			"100%": {
				opacity: 1,
			},
		},
		".calendar-bubble-more-padding-day .calendar-event": {
			border: `1px solid ${theme.list_bg}`,
		},
		".darker-hover:hover": {
			filter: "brightness(95%)",
		},
		".darkest-hover:hover": {
			filter: "brightness(70%)",
		},
		".event-continues-left": {
			"border-top-left-radius": 0,
			"border-bottom-left-radius": 0,
			"border-left": "none",
		},
		".event-continues-right": {
			"margin-right": 0,
			"border-right": "none",
			"border-top-right-radius": 0,
			"border-bottom-right-radius": 0,
		},
		".event-continues-right-arrow": {
			width: 0,
			height: 0,
			"border-top": "9px solid transparent",
			"border-bottom": "9px solid transparent",
			"border-left": "6px solid green",
			"margin-top": px(1),
			"margin-bottom": px(1),
		},
		".time-field": {
			width: "80px",
		},
		".calendar-agenda-time-column": {
			width: px(80),
		},
		".calendar-agenda-time-column > *": {
			height: px(44),
		},
		".calendar-agenda-row": {
			"min-height": "44px",
			flex: "1 0 auto",
		},
		".calendar-switch-button": {
			width: "40px",
			"text-align": "center",
		},
		".calendar-long-events-header": {
			overflow: "hidden",
			"background-color": theme.content_bg,
			"border-bottom": `1px solid ${theme.content_border}`,
		},
		".calendar-month-week-number": {
			"font-size": "12px",
			opacity: "0.8",
			top: "8px",
			left: "6px",
		},
		".color-picker": {
			height: px(30),
			width: px(100),
		},
		".calendar-invite-field": {
			"min-width": "80px",
		},
		".block-list": {
			"list-style": "none",
			padding: 0,
		},
		".block-list li": {
			display: "block",
		},
		".sticky": {
			position: "sticky",
		},
		".text-fade": {
			color: theme.content_button,
		},
		// media query for small devices where elements should be arranged in one column
		// also adaptions for table column widths
		"@media (max-width: 400px)": {
			// currently used for the reminder dialog
			".flex-direction-change": {
				display: "flex",
				"flex-direction": "column-reverse",
				"justify-content": "center",
			},
			".column-width-small": {
				width: px(size.column_width_s_mobile),
			},
		},
		"@keyframes move-stripes": {
			"0%": {
				"background-position": "0 0",
			},
			"100%": {
				"background-position": "15px 0",
			},
		},
		".indefinite-progress": {
			"background-image": `repeating-linear-gradient(
  -45deg,
  ${theme.content_accent},
  ${theme.content_accent} 5px,
  ${theme.content_bg} 5px,
  ${theme.content_bg} 10px
);`,
			// WebKit based browsers initially implemented old specification, we cannot specify unprefixed value
			// for them
			[(client.browser === BrowserType.SAFARI ? "-webkit-background-size" : "background-size") as string]: px(15),
			width: "100%",
			height: px(3),
			animation: "move-stripes 2s linear infinite",
		},
		".transition-margin": {
			transition: `margin-bottom 200ms ease-in-out`,
		},
		".circle": {
			"border-radius": "50%",
		},
		".clickable": {
			cursor: "pointer",
		},
		".switch-month-button svg": {
			fill: theme.navigation_button,
		},
		"drawer-menu": {
			width: px(size.drawer_menu_width),
			background: getNavigationMenuBg(),
			"border-right": `0.5px solid ${theme.navigation_border}`,
		},
		".mobile .header-nav": {
			height: px(size.navbar_height_mobile),
		},
		".mobile .header-logo": {
			height: px(size.header_logo_height_mobile),
		},
		".mobile .header-logo > svg": {
			height: px(size.header_logo_height_mobile),
			width: "auto",
		},
		".mobile .header-left": {
			width: `${px(size.navbar_edge_width_mobile)}`,
		},
		".mobile .header-middle": {
			position: "absolute",
			right: px(size.navbar_edge_width_mobile),
			left: px(size.navbar_edge_width_mobile),
			top: 0,
			bottom: 0,
		},
		".mobile .header-right": {
			left: "auto",
			width: `${px(size.navbar_edge_width_mobile)}`,
		},
		".menu-shadow": {
			"box-shadow": "0 4px 5px 2px rgba(0,0,0,0.14), 0 4px 5px 2px rgba(0,0,0,0.14), 0 4px 5px 2px rgba(0,0,0,0.14)",
		},
		".big-input input": {
			"font-size": px(size.font_size_base * 1.4),
			"line-height": `${px(size.font_size_base * 1.4 + 2)} !important`,
		},
		[`@media (max-width: ${size.desktop_layout_width - 1}px)`]: {
			".main-view": {
				top: 0,
				bottom: 0,
			},
			".logo-height": {
				height: px(size.header_logo_height_mobile),
			},
			".logo-height > svg": {
				height: px(size.header_logo_height_mobile),
			},
			".fixed-bottom-right": {
				bottom: px(size.hpad_large_mobile + size.bottom_nav_bar),
				right: px(size.hpad_large_mobile),
			},
			".pt-responsive": {
				"padding-top": px(size.hpad_large),
			},
			".custom-logo": {
				width: px(40),
			},
			".notification-overlay-content": {
				"padding-top": px(size.vpad_small),
			},
			".calendar-day-indicator": {
				height: "20px",
				"line-height": "20px",
				"text-align": "center",
				"font-size": "14px",
			},
			".calendar-day-number": {
				margin: "2px auto",
				width: "20px",
			},
			".calendar-hour-margin": {
				"margin-left": px(size.calendar_hour_width_mobile),
			},
			".calendar-month-week-number": {
				"font-size": "10px",
				opacity: "0.8",
				top: "3px",
				left: "3px",
			},
		},
		".cursor-grabbing *": {
			cursor: "grabbing !important",
		},
		// This is applied to elements that should indicate they will be draggable when some key is pressed.
		// Ideally we would use cursor: grab here, but it doesn't seem to be supported in electron
		".drag-mod-key *": {
			cursor: "copy !important",
		},
		//We us this class to hide contents that should just be visible for printing
		".noscreen": {
			display: "none",
		},
		"@media print": {
			".color-adjust-exact": {
				"color-adjust": "exact",
				"-webkit-print-color-adjust": "exact",
			},
			".noprint": {
				display: "none",
			},
			".noscreen": {
				display: "initial",
			},
			".print": {
				color: "black",
				"background-color": "white",
				display: "block",
			},
			"html, body": {
				position: "initial",
				overflow: "visible !important",
			},
			// overwrite position "fixed" otherwise only one page will be printed.
			".header-nav": {
				display: "none",
			},
			".main-view": {
				top: 0,
				position: "static !important",
			},
			".dropdown-panel": {
				display: "none",
			},
			".fill-absolute": {
				position: "static !important",
				display: "initial",
			},
			".view-columns": {
				width: "100% !important",
				transform: "initial !important",
				display: "initial",
				position: "initial",
			},
			".view-column:nth-child(1), .view-column:nth-child(2)": {
				display: "none",
			},
			".view-column": {
				width: "100% !important",
			},
			"#mail-viewer": {
				overflow: "visible",
				display: "block",
			},
			"#mail-body": {
				overflow: "visible",
			},
			"#login-view": {
				display: "none",
			},
			".dialog-header": {
				display: "none",
			},
			".dialog-container": {
				overflow: "visible",
				position: "static !important",
			},
			"#wizard-paging": {
				display: "none",
			},
			"button:not(.print)": {
				display: "none",
			},
			".bottom-nav": {
				display: "none",
			},
			".mobile .view-column:nth-child(2)": {
				display: "initial",
			},
			".folder-column": {
				display: "none",
			},
			pre: {
				"word-break": "normal",
				"overflow-wrap": "anywhere",
				"white-space": "break-spaces",
			},
		},
		// detect webkit autofills; see TextField and https://medium.com/@brunn/detecting-autofilled-fields-in-javascript-aed598d25da7
		"@keyframes onAutoFillStart": {
			from: {
				/**/
			},
			to: {
				/**/
			},
		},
		"@keyframes onAutoFillCancel": {
			from: {
				/**/
			},
			to: {
				/**/
			},
		},
		// use the animations as hooks for JS to capture 'animationstart' events
		"input:-webkit-autofill": {
			"animation-name": "onAutoFillStart",
		},
		"input:not(:-webkit-autofill)": {
			"animation-name": "onAutoFillCancel",
		},
		// for compatibility with Outlook 2010/2013 emails. have a negative indentation (18.0pt) on each list element and additionally this class
		// we strip all global style definitions, so the list elements are only indented to the left if we do not allow the MsoListParagraph classes
		// they are whitelisted in HtmlSanitizer.js
		".MsoListParagraph, .MsoListParagraphCxSpFirst, .MsoListParagraphCxSpMiddle, .MsoListParagraphCxSpLast": {
			"margin-left": "36.0pt",
		},
		"span.vertical-text": {
			transform: "rotate(180deg)",
			"writing-mode": "vertical-rl",
		},
		"ul.usage-test-opt-in-bullets": {
			margin: "0 auto",
			"list-style": "disc",
			"text-align": "left",
		},
	}
})
