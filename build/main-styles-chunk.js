import "./dist-chunk.js";
import "./ProgrammingError-chunk.js";
import { assertMainOrNode, assertMainOrNodeBoot, isAdminClient, isApp, isElectronClient } from "./Env-chunk.js";
import { client } from "./ClientDetector-chunk.js";
import "./mithril-chunk.js";
import "./dist2-chunk.js";
import "./WhitelabelCustomizations-chunk.js";
import { lang } from "./LanguageViewModel-chunk.js";
import { DefaultAnimationTime, styles } from "./styles-chunk.js";
import { getContentButtonIconBackground, getElevatedBackground, getNavigationMenuBg, stateBgActive, stateBgFocus, stateBgHover, stateBgLike, theme } from "./theme-chunk.js";
import "./WindowFacade-chunk.js";
import { px, size } from "./size-chunk.js";
import { locator } from "./CommonLocator-chunk.js";
import { FontIcons } from "./FontIcons-chunk.js";

//#region src/common/gui/mixins.ts
assertMainOrNodeBoot();
const noselect = {
	_webkit_touch_callout: "none",
	_webkit_user_select: "none",
	_khtml_user_select: "none",
	_moz_user_select: "none",
	_ms_user_select: "none",
	user_select: "none"
};
function position_absolute(top, right, bottom, left) {
	return {
		position: "absolute",
		top: positionValue(top),
		right: positionValue(right),
		bottom: positionValue(bottom),
		left: positionValue(left)
	};
}
function positionValue(value) {
	if (value) return px(value);
else if (value === 0) return 0;
else return "unset";
}

//#endregion
//#region src/common/gui/main-styles.ts
assertMainOrNode();
function getFonts() {
	const fonts = [
		"-apple-system",
		"system-ui",
		"BlinkMacSystemFont",
		"Segoe UI",
		"Roboto",
		"Helvetica Neue",
		"Helvetica",
		"Arial",
		"sans-serif"
	];
	if (env.platformId === "win32" && lang.code === "ja") fonts.push("SimHei", "黑体");
	fonts.push("Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol");
	return fonts.join(", ");
}
const boxShadow = `0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)`;
const searchBarShadow = "0px 2px 4px rgb(0, 0, 0, 0.12)";
const scrollbarWidthHeight = px(18);
styles.registerStyle("main", () => {
	const lightTheme = locator.themeController.getBaseTheme("light");
	return {
		"#link-tt": isElectronClient() ? {
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
			"font-family": "monospace"
		} : {},
		"#link-tt.reveal": isElectronClient() ? {
			opacity: 1,
			transition: "opacity .1s linear",
			"z-index": 9999
		} : {},
		"*:not(input):not(textarea)": isAdminClient() ? {} : {
			"user-select": "none",
			"-ms-user-select": "none",
			"-webkit-user-select": "none",
			"-moz-user-select": "none",
			"-webkit-touch-callout": "none",
			"-webkit-tap-highlight-color": "rgba(0, 0, 0, 0)"
		},
		"*:not(input):not(textarea):not([draggable='true'])": { "-webkit-user-drag": "none" },
		":where(.mouse-nav) *, :where(.touch-nav) *": { outline: "none" },
		".selectable": {
			cursor: "text",
			"user-select": "text !important",
			"-ms-user-select": "text !important",
			"-webkit-user-select": "text !important",
			"-moz-user-select": "text !important",
			"-webkit-touch-callout": "default !important"
		},
		".selectable *": {
			"user-select": "text !important",
			"-ms-user-select": "text !important",
			"-webkit-user-select": "text !important",
			"-moz-user-select": "text !important",
			"-webkit-touch-callout": "default !important"
		},
		"@font-face": {
			"font-family": "'Ionicons'",
			src: `url('${window.tutao.appState.prefixWithoutFile}/images/font.ttf') format('truetype')`,
			"font-weight": "normal",
			"font-style": "normal"
		},
		".touch-callout *": { "-webkit-touch-callout": "default !important" },
		[`html, body, div, article, section, main, footer, header, form, fieldset, legend,
            pre, code, p, a, h1, h2, h3, h4, h5, h6, ul, ol, li, dl, dt, dd, textarea,
            input[type="email"], input[type="number"], input[type="password"],
            input[type="tel"], input[type="text"], input[type="url"], .border-box`]: { "box-sizing": "border-box" },
		a: { color: "inherit" },
		":root": {
			"--safe-area-inset-bottom": "env(safe-area-inset-bottom)",
			"--safe-area-inset-top": "env(safe-area-inset-top)",
			"--safe-area-inset-right": "env(safe-area-inset-right)",
			"--safe-area-inset-left": "env(safe-area-inset-left)"
		},
		"html, body": {
			height: "100%",
			margin: 0,
			width: "100%"
		},
		html: { "-webkit-font-smoothing": "subpixel-antialiased" },
		body: {
			position: "fixed",
			"background-color": `${theme.content_bg} !important`
		},
		"button, textarea": {
			padding: 0,
			"text-align": "left"
		},
		button: { background: "transparent" },
		"button:disabled": { cursor: "default" },
		"body, button": {
			overflow: "hidden",
			"font-family": getFonts(),
			"font-size": px(size.font_size_base),
			"line-height": size.line_height,
			color: theme.content_fg,
			"-webkit-text-size-adjust": "none"
		},
		"small, .small": { "font-size": px(size.font_size_small) },
		".smaller": { "font-size": px(size.font_size_smaller) },
		".normal-font-size": { "font-size": px(size.font_size_base) },
		".b": { "font-weight": "bold" },
		".font-weight-600": { "font-weight": "600" },
		".i": { "font-style": "italic" },
		".click": {
			cursor: "pointer",
			"-webkit-tap-highlight-color": "rgba(255, 255, 255, 0)"
		},
		".click-disabled": { cursor: "default" },
		".text": { cursor: "text" },
		".overflow-hidden": { overflow: "hidden" },
		".overflow-x-hidden": { "overflow-x": "hidden" },
		".overflow-y-hidden": { "overflow-y": "hidden" },
		".overflow-y-visible": { "overflow-y": "visible !important" },
		".overflow-y-scroll": {
			"overflow-y": "scroll",
			"webkit-overflow-scrolling": "touch"
		},
		".overflow-visible": { overflow: "visible" },
		"h1, h2, h3, h4, h5, h6": {
			margin: 0,
			"font-weight": "normal"
		},
		"h1, .h1": { "font-size": px(size.font_size_base * 2) },
		"h2, .h2": { "font-size": px(size.font_size_base * 1.8) },
		"h3, .h3": { "font-size": px(size.font_size_base * 1.6) },
		"h4, .h4": { "font-size": px(size.font_size_base * 1.4) },
		"h5, .h5": { "font-size": px(size.font_size_base * 1.2) },
		"h6, .h6": { "font-size": px(size.font_size_base * 1.1) },
		"input, button, select, textarea": {
			"font-family": "inherit",
			"font-size": "inherit",
			"line-height": "inherit"
		},
		".hr": {
			margin: 0,
			border: "none",
			height: "1px",
			"background-color": theme.list_border
		},
		".border": { border: `1px solid ${theme.content_border}` },
		".border-top": { "border-top": `1px solid ${theme.content_border}` },
		"#mail-body.break-pre pre": {
			"white-space": "pre-wrap",
			"word-break": "normal",
			"overflow-wrap": "anywhere"
		},
		".white-space-pre": { "white-space": "pre" },
		".min-content": {
			width: "min-content",
			height: "min-content"
		},
		".width-min-content": { width: "min-content" },
		".m-0": { margin: 0 },
		".mt": { "margin-top": px(size.vpad) },
		".mt-xs": { "margin-top": px(size.vpad_xs) },
		".mt-xxs": { "margin-top": px(2) },
		".mt-s": { "margin-top": px(size.vpad_small) },
		".mt-m": { "margin-top": px(size.hpad) },
		".mt-l": { "margin-top": px(size.vpad_large) },
		".mt-xl": { "margin-top": px(size.vpad_xl) },
		".mt-form": { "margin-top": px(size.hpad_medium) },
		".mb-0": { "margin-bottom": 0 },
		".mb": { "margin-bottom": px(size.vpad) },
		".mb-s": { "margin-bottom": px(size.vpad_small) },
		".mb-xs": { "margin-bottom": px(size.vpad_xs) },
		".mb-l": { "margin-bottom": px(size.vpad_large) },
		".mb-xl": { "margin-bottom": px(size.vpad_xl) },
		".mb-xxl": { "margin-bottom": px(size.vpad_xxl) },
		".mlr": {
			"margin-left": px(size.hpad),
			"margin-right": px(size.hpad)
		},
		".mlr-button": {
			"margin-left": px(size.hpad_button),
			"margin-right": px(size.hpad_button)
		},
		".mlr-l": {
			"margin-left": px(size.hpad_large),
			"margin-right": px(size.hpad_large)
		},
		".mr-s": { "margin-right": px(size.vpad_small) },
		".mr-xs": { "margin-right": px(size.vpad_xs) },
		".ml-s": { "margin-left": px(size.vpad_small) },
		".ml-m": { "margin-left": px(size.hpad_medium) },
		".ml-l": { "margin-left": px(size.hpad_large) },
		".mr-m": { "margin-right": px(size.hpad_medium) },
		".mr-l": { "margin-right": px(size.hpad_large) },
		".mlr-s": {
			"margin-left": px(size.hpad_small),
			"margin-right": px(size.hpad_small)
		},
		".mlr-xs": {
			"margin-left": px(size.vpad_xs),
			"margin-right": px(size.vpad_xs)
		},
		".ml-hpad_small": { "margin-left": px(size.hpad_small) },
		".mr-hpad-small": { "margin-right": px(size.hpad_small) },
		".mtb-0": {
			"margin-top": px(0),
			"margin-bottom": px(0)
		},
		".mr": { "margin-right": px(size.hpad) },
		".ml": { "margin-left": px(size.hpad) },
		".p0": { padding: "0" },
		".pt": { "padding-top": px(size.vpad) },
		".pt-0": { "padding-top": 0 },
		".pt-s": { "padding-top": px(size.vpad_small) },
		".pt-l": { "padding-top": px(size.vpad_large) },
		".pt-m": { "padding-top": px(size.hpad) },
		".pt-ml": { "padding-top": px(size.vpad_ml) },
		".pt-xl": { "padding-top": px(size.vpad_xl) },
		".pt-xs": { "padding-top": px(size.vpad_xs) },
		".pb-0": { "padding-bottom": 0 },
		".pb": { "padding-bottom": px(size.vpad) },
		".pb-2": { "padding-bottom": "2px" },
		".pb-s": { "padding-bottom": px(size.vpad_small) },
		".drag": { "touch-action": "auto" },
		".pb-xs": { "padding-bottom": px(size.vpad_xs) },
		".pb-l": { "padding-bottom": px(size.vpad_large) },
		".pb-xl": { "padding-bottom": px(size.vpad_xl) },
		".pb-m": { "padding-bottom": px(size.hpad) },
		".pb-ml": { "padding-bottom": px(size.vpad_ml) },
		".pb-floating": { "padding-bottom": px(size.button_floating_size + size.hpad_large) },
		".plr": {
			"padding-left": px(size.hpad),
			"padding-right": px(size.hpad)
		},
		".pl": { "padding-left": px(size.hpad) },
		".pl-s": { "padding-left": px(size.hpad_small) },
		".pl-m": { "padding-left": px(size.hpad) },
		".pl-xs": { "padding-left": px(size.vpad_xs) },
		".pl-vpad-m": { "padding-left": px(size.vpad) },
		".pl-vpad-s": { "padding-left": px(size.vpad_small) },
		".pl-vpad-l": { "padding-left": px(size.vpad_large) },
		".pr": { "padding-right": px(size.hpad) },
		".pr-s": { "padding-right": px(size.hpad_small) },
		".pr-vpad-s": { "padding-right": px(size.vpad_small) },
		".pr-m": { "padding-right": px(size.vpad) },
		".plr-s": {
			"padding-left": px(size.hpad_small),
			"padding-right": px(size.hpad_small)
		},
		".plr-m": {
			"padding-left": px(size.hpad),
			"padding-right": px(size.hpad)
		},
		".plr-l": {
			"padding-left": px(size.hpad_large),
			"padding-right": px(size.hpad_large)
		},
		".plr-2l": {
			"padding-left": px(size.hpad_large * 2),
			"padding-right": px(size.hpad_large * 2)
		},
		".pl-l": { "padding-left": px(size.hpad_large) },
		".pr-l": { "padding-right": px(size.hpad_large) },
		".plr-button": {
			"padding-left": px(size.hpad_button),
			"padding-right": px(size.hpad_button)
		},
		".plr-button-double": {
			"padding-left": px(size.hpad_button * 2),
			"padding-right": px(size.hpad_button * 2)
		},
		".plr-nav-button": {
			"padding-left": px(size.hpad_nav_button),
			"padding-right": px(size.hpad_nav_button)
		},
		".pl-button": { "padding-left": px(size.hpad_button) },
		".mr-button": { "margin-right": px(size.hpad_button) },
		".ml-button": { "margin-left": px(size.hpad_button) },
		".mt-negative-hpad-button": { "margin-top": px(-size.hpad_button) },
		".mt-negative-s": { "margin-top": px(-size.vpad_small) },
		".mt-negative-m": { "margin-top": px(-size.vpad) },
		".mt-negative-l": { "margin-top": px(-size.hpad_large) },
		".mr-negative-s": { "margin-right": px(-size.hpad_button) },
		".mr-negative-l": { "margin-right": px(-size.hpad_large) },
		".ml-negative-s": { "margin-left": px(-size.hpad_button) },
		".ml-negative-l": { "margin-left": px(-size.hpad_large) },
		".ml-negative-xs": { "margin-left": px(-3) },
		".ml-negative-bubble": { "margin-left": px(-7) },
		".mr-negative-m": { "margin-right": px(-(size.hpad_button + size.hpad_nav_button)) },
		".fixed-bottom-right": {
			position: "fixed",
			bottom: px(size.hpad),
			right: px(size.hpad_large)
		},
		".mr-negative-xs": { "margin-right": px(-3) },
		".text-ellipsis": {
			overflow: "hidden",
			"text-overflow": "ellipsis",
			"min-width": 0,
			"white-space": "nowrap"
		},
		".text-ellipsis-multi-line": {
			display: "-webkit-box",
			"-webkit-line-clamp": 3,
			"-webkit-box-orient": "vertical",
			overflow: " hidden",
			"text-overflow": "ellipsis"
		},
		".text-clip": {
			overflow: "hidden",
			"text-overflow": "clip",
			"min-width": 0,
			"white-space": "nowrap"
		},
		".min-width-0": { "min-width": 0 },
		".min-width-full": { "min-width": "100%" },
		".text-break": {
			overflow: "hidden",
			"word-break": "normal",
			"overflow-wrap": "anywhere"
		},
		".break-word": {
			"word-break": "normal",
			"overflow-wrap": "break-word",
			hyphens: "auto"
		},
		".break-all": { "word-break": "break-all" },
		".break-word-links a": { "overflow-wrap": "anywhere" },
		".text-prewrap": { "white-space": "pre-wrap" },
		".text-preline": { "white-space": "pre-line" },
		".text-pre": { "white-space": "pre" },
		".uppercase": { "text-transform": "uppercase" },
		".line-break-anywhere": { "line-break": "anywhere" },
		".z1": { "z-index": "1" },
		".z2": { "z-index": "2" },
		".z3": { "z-index": "3" },
		".z4": { "z-index": "4" },
		".noselect": noselect,
		".no-wrap": { "white-space": "nowrap" },
		".height-100p": { height: "100%" },
		".view-columns": { overflow: "hidden" },
		".view-column": { "will-change": "transform" },
		".will-change-alpha": { "will-change": "alpha" },
		".border-bottom": { "border-bottom": `1px solid ${theme.content_border}` },
		".border-left": { "border-left": `1px solid ${theme.content_border}` },
		".bg-transparent": { "background-color": "transparent" },
		".bg-white": { "background-color": "white" },
		".bg-fix-quoted blockquote.tutanota_quote": {
			"background-color": "white",
			color: "black",
			"border-width": "4px"
		},
		".content-black": { color: "black" },
		".content-fg": { color: theme.content_fg },
		".content-accent-fg": { color: theme.content_accent },
		".content-accent-accent": { "accent-color": theme.content_accent },
		".icon-accent svg": { fill: theme.content_accent },
		".svg-content-fg path": { fill: theme.content_fg },
		".content-bg": { "background-color": theme.content_bg },
		".nav-bg": { "background-color": theme.navigation_bg },
		".content-hover:hover": { color: theme.content_accent },
		".no-hover": { "pointer-events": "none" },
		".content-message-bg": { "background-color": theme.content_message_bg },
		".elevated-bg": { "background-color": getElevatedBackground() },
		".list-bg": { "background-color": theme.list_bg },
		".list-accent-fg": { color: theme.list_accent_fg },
		".svg-list-accent-fg path": { fill: theme.list_accent_fg },
		".bg-accent-fg": { "background-color": theme.list_accent_fg },
		".list-border-bottom": { "border-bottom": `1px solid ${theme.list_border}` },
		".accent-bg-translucent": {
			background: `${theme.content_accent}2C`,
			color: theme.content_accent
		},
		".button-bg": {
			background: theme.content_button,
			color: theme.navigation_bg,
			opacity: "0.5"
		},
		".accent-bg": {
			"background-color": theme.content_accent,
			color: theme.content_button_icon_selected
		},
		".accent-bg-cyber-monday": {
			"background-color": theme.content_accent_cyber_monday,
			color: theme.content_button_icon_selected
		},
		".accent-fg": { color: theme.content_button_icon },
		".accent-fg path": { fill: theme.content_button_icon },
		".red": { "background-color": "#840010" },
		".swipe-spacer": { color: "#ffffff" },
		".swipe-spacer path": { fill: "#ffffff" },
		".blue": { "background-color": "#2196F3" },
		".underline": { "text-decoration": "underline" },
		".hover-ul:hover": { "text-decoration": isApp() ? "none" : "underline" },
		".fill-absolute": {
			position: "absolute",
			top: 0,
			bottom: 0,
			left: 0,
			right: 0
		},
		".fill-flex": {
			"flex-basis": "100%",
			"flex-shrink": 0
		},
		".abs": { position: "absolute" },
		".fixed": { position: "fixed" },
		".rel": { position: "relative" },
		".max-width-s": { "max-width": px(360) },
		".max-width-m": { "max-width": px(450) },
		".max-width-l": { "max-width": px(800) },
		".max-width-200": { "max-width": px(200) },
		".scroll": {
			"overflow-y": client.overflowAuto,
			"-webkit-overflow-scrolling": "touch"
		},
		".scroll-no-overlay": {
			"overflow-y": "auto",
			"-webkit-overflow-scrolling": "touch"
		},
		".scroll-x": {
			"overflow-x": "auto",
			"-webkit-overflow-scrolling": "touch"
		},
		"*": {
			"scrollbar-color": `${theme.content_button} transparent`,
			"scrollbar-width": "thin"
		},
		"::-webkit-scrollbar": !client.isMobileDevice() ? {
			background: "transparent",
			width: scrollbarWidthHeight,
			height: scrollbarWidthHeight
		} : {},
		"::-webkit-scrollbar-thumb": !client.isMobileDevice() ? {
			background: theme.content_button,
			"border-left": "15px solid transparent",
			"background-clip": "padding-box"
		} : {},
		"*::-webkit-scrollbar-thumb:hover": { "border-left": "8px solid transparent" },
		".visible-scrollbar::-webkit-scrollbar": {
			background: "transparent",
			width: "6px"
		},
		".visible-scrollbar::-webkit-scrollbar-thumb": {
			background: theme.content_button,
			"border-radius": "3px"
		},
		".scrollbar-gutter-stable-or-fallback": { "scrollbar-gutter": "stable" },
		"@supports not (scrollbar-gutter: stable)": { ".scrollbar-gutter-stable-or-fallback": { "padding-right": scrollbarWidthHeight } },
		".center": { "text-align": "center" },
		".dropdown-info": {
			"padding-bottom": "5px",
			"padding-left": "16px",
			"padding-right": "16px"
		},
		".dropdown-info + .dropdown-button": { "border-top": `1px solid ${theme.content_border}` },
		".dropdown-info + .dropdown-info": { "padding-top": "0" },
		".text-center": { "text-align": "center" },
		".right": { "text-align": "right" },
		".left": { "text-align": "left" },
		".start": { "text-align": "start" },
		".statusTextColor": { color: theme.content_accent },
		".button-height": { height: px(size.button_height) },
		".button-min-height": { "min-height": px(size.button_height) },
		".button-min-width": { "min-width": px(size.button_height) },
		".button-width-fixed": { width: px(size.button_height) },
		".large-button-height": { height: px(size.button_floating_size) },
		".large-button-width": { width: px(size.button_floating_size) },
		".notification-min-width": { "min-width": px(400) },
		".full-height": { "min-height": client.isIos() ? "101%" : "100%" },
		".full-width": { width: "100%" },
		".half-width": { width: "50%" },
		".block": { display: "block" },
		".inline-block": { display: "inline-block" },
		".no-text-decoration": { "text-decoration": "none" },
		".strike": { "text-decoration": "line-through" },
		".text-align-vertical": { "vertical-align": "text-top" },
		".flex-space-around": {
			display: "flex",
			"justify-content": "space-around"
		},
		".flex-space-between": {
			display: "flex",
			"justify-content": "space-between"
		},
		".flex-fixed": { flex: "0 0 auto" },
		".flex-center": {
			display: "flex",
			"justify-content": "center"
		},
		".flex-end": {
			display: "flex",
			"justify-content": "flex-end"
		},
		".flex-start": {
			display: "flex",
			"justify-content": "flex-start"
		},
		".flex-v-center": {
			display: "flex",
			"flex-direction": "column",
			"justify-content": "center"
		},
		".flex-direction-change": {
			display: "flex",
			"justify-content": "center"
		},
		".flex-column": { "flex-direction": "column" },
		".col": { "flex-direction": "column" },
		".row": { "flex-direction": "row" },
		".flex-column-reverse": { "flex-direction": "column-reverse" },
		".col-reverse": { "flex-direction": "column-reverse" },
		".column-gap": { "column-gap": px(size.hpad) },
		".column-gap-s": { "column-gap": px(size.hpad_small) },
		".gap-vpad": { gap: px(size.vpad) },
		".gap-vpad-xs": { gap: px(size.vpad_xsm) },
		".gap-vpad-s": { gap: px(size.vpad_small) },
		".gap-vpad-s-15": { gap: px(size.vpad_small * 1.5) },
		".gap-hpad": { gap: px(size.hpad) },
		".gap-vpad-xxl": { gap: px(size.vpad_xxl) },
		".flex": { display: "flex" },
		".flex-grow": { flex: "1" },
		".flex-hide": { flex: "0" },
		".flex-third": {
			flex: "1 0 0",
			"min-width": "100px"
		},
		".flex-third-middle": { flex: "2 1 0" },
		".flex-half": { flex: "0 0 50%" },
		".flex-grow-shrink-half": { flex: "1 1 50%" },
		".flex-nogrow-shrink-half": { flex: "0 1 50%" },
		".flex-grow-shrink-auto": { flex: "1 1 auto" },
		".flex-grow-shrink-0": { flex: "1 1 0px" },
		".flex-grow-shrink-150": { flex: "1 1 150px" },
		".flex-no-shrink": { flex: "1 0 0" },
		".flex-no-grow-no-shrink-auto": { flex: "0 0 auto" },
		".flex-no-grow": { flex: "0" },
		".no-shrink": { "flex-shrink": "0" },
		".flex-no-grow-shrink-auto": { flex: "0 1 auto" },
		".flex-wrap": { "flex-wrap": "wrap" },
		".wrap": { "flex-wrap": "wrap" },
		".items-center": { "align-items": "center" },
		".center-vertically": { "align-items": "center" },
		".items-end": { "align-items": "flex-end" },
		".items-start": { "align-items": "flex-start" },
		".items-base": { "align-items": "baseline" },
		".items-stretch": { "align-items": "stretch" },
		".align-self-start": { "align-self": "start" },
		".align-self-center": { "align-self": "center" },
		".align-self-end": { "align-self": "flex-end" },
		".align-self-stretch": { "align-self": "stretch" },
		".justify-center": { "justify-content": "center" },
		".center-horizontally": { "justify-content": "center" },
		".justify-between": { "justify-content": "space-between" },
		".justify-end": { "justify-content": "flex-end" },
		".justify-start": { "justify-content": "flex-start" },
		".justify-right": { "justify-content": "right" },
		".child-grow > *": { flex: "1 1 auto" },
		".last-child-fixed > *:last-child": { flex: "1 0 100px" },
		".limit-width": { "max-width": "100%" },
		".flex-transition": { transition: "flex 200ms linear" },
		".border-radius": { "border-radius": px(size.border_radius) },
		".border-radius-top": {
			"border-top-left-radius": px(size.border_radius),
			"border-top-right-radius": px(size.border_radius)
		},
		".border-radius-top-left-big": { "border-top-left-radius": px(size.border_radius_larger) },
		".border-radius-top-right-big": { "border-top-right-radius": px(size.border_radius_larger) },
		".border-radius-bottom": {
			"border-bottom-left-radius": px(size.border_radius),
			"border-bottom-right-radius": px(size.border_radius)
		},
		".border-radius-small": { "border-radius": px(size.border_radius_small) },
		".border-radius-big": { "border-radius": px(size.border_radius_larger) },
		".border-radius-m": { "border-radius": px(size.border_radius_medium) },
		".border-radius-top-left-m": { "border-top-left-radius": px(size.border_radius_medium) },
		".border-radius-top-right-m": { "border-top-right-radius": px(size.border_radius_medium) },
		".settings-item": {
			border: 0,
			cursor: "pointer",
			overflow: "hidden",
			"white-space": "nowrap",
			margin: 0,
			"flex-shrink": 0,
			"-webkit-tap-highlight-color": "rgba(255, 255, 255, 0)",
			"padding-bottom": px(size.icon_size_small),
			"padding-top": px(size.icon_size_small),
			"border-bottom": `1px solid ${theme.button_bubble_bg} !important`
		},
		".settings-item:last-child": { "border-bottom": "none !important" },
		".editor-border": {
			border: `2px solid ${theme.content_border}`,
			"padding-top": px(size.vpad_small),
			"padding-bottom": px(size.vpad_small),
			"padding-left": px(size.hpad),
			"padding-right": px(size.hpad)
		},
		".editor-border-active": {
			border: `3px solid ${theme.content_accent}`,
			"padding-top": px(size.vpad_small - 1),
			"padding-bottom": px(size.vpad_small - 1),
			"padding-left": px(size.hpad - 1),
			"padding-right": px(size.hpad - 1)
		},
		".editor-no-top-border": { "border-top-color": "transparent" },
		".icon": {
			height: px(size.icon_size_medium),
			width: px(size.icon_size_medium)
		},
		".icon > svg": {
			height: px(size.icon_size_medium),
			width: px(size.icon_size_medium)
		},
		".icon-progress-search": {
			height: `${px(20)} !important`,
			width: `${px(20)} !important`
		},
		".icon-progress-search > svg": {
			height: `${px(20)} !important`,
			width: `${px(20)} !important`
		},
		".search-bar": {
			transition: "all 200ms",
			"background-color": stateBgLike
		},
		".search-bar:hover": { "background-color": stateBgHover },
		".search-bar[focused=true]": {
			"background-color": theme.content_bg,
			"box-shadow": searchBarShadow
		},
		".fab-shadow": { "box-shadow": "0px 8px 12px 6px rgba(0, 0, 0, 0.15), 0px 4px 4px rgba(0, 0, 0, 0.3)" },
		".icon-progress-tiny": {
			height: px(15),
			width: px(15)
		},
		".icon-progress-tiny > svg": {
			height: px(15),
			width: px(15)
		},
		".icon-small": {
			height: px(size.icon_size_small),
			width: px(size.icon_size_small)
		},
		".icon-small > svg": {
			height: px(size.icon_size_small),
			width: px(size.icon_size_small)
		},
		".icon-large": {
			height: px(size.icon_size_large),
			width: px(size.icon_size_large)
		},
		".icon-medium-large": {
			height: px(size.icon_size_medium_large),
			width: px(size.icon_size_medium_large)
		},
		".icon-medium-large > svg": {
			height: px(size.icon_size_medium_large),
			width: px(size.icon_size_medium_large)
		},
		".icon-large > svg": {
			height: px(size.icon_size_large),
			width: px(size.icon_size_large)
		},
		".icon-xl": {
			height: px(size.icon_size_xl),
			width: px(size.icon_size_xl)
		},
		".icon-xl > svg": {
			height: px(size.icon_size_xl),
			width: px(size.icon_size_xl)
		},
		".icon-message-box": {
			height: px(size.icon_message_box),
			width: px(size.icon_message_box)
		},
		".icon-message-box > svg": {
			height: px(size.icon_message_box),
			width: px(size.icon_message_box)
		},
		".icon-progress > svg": {
			"animation-name": "rotate-icon",
			"animation-duration": "2s",
			"animation-iteration-count": "infinite",
			"animation-timing-function": "calculatePosition",
			"transform-origin": "50% 50%",
			display: "inline-block"
		},
		".icon-button": {
			"border-radius": "25%",
			width: px(size.button_height),
			height: px(size.button_height),
			"max-width": px(size.button_height),
			"max-height": px(size.button_height)
		},
		".center-h": { margin: "0 auto" },
		".toggle-button": {
			"border-radius": "25%",
			width: px(size.button_height),
			height: px(size.button_height),
			"max-width": px(size.button_height),
			"max-height": px(size.button_height)
		},
		".wizard-next-button": {
			"margin-top": "auto",
			"margin-bottom": px(size.vpad)
		},
		".wizard-breadcrumb": {
			border: `1px solid ${getContentButtonIconBackground()}`,
			color: "inherit",
			"transition-property": "border-width, border-color, color, background-color",
			"transition-duration": `${DefaultAnimationTime - 70}ms`,
			"transition-timing-function": "ease-out",
			"will-change": "border-width, border-color, color"
		},
		".wizard-breadcrumb-active": {
			border: `2px solid ${theme.content_accent}`,
			color: theme.content_accent,
			"transition-property": "border-width, border-color, color, background-color",
			"transition-duration": `${DefaultAnimationTime - 70}ms`,
			"transition-timing-function": "ease-out",
			"will-change": "border-width, color, background-color"
		},
		".wizard-breadcrumb-previous": {
			border: `1px solid ${theme.content_accent}`,
			color: "inherit",
			"background-color": theme.content_accent,
			"transition-property": "border-width, border-color, color, background-color",
			"transition-duration": `${DefaultAnimationTime - 70}ms`,
			"transition-timing-function": "ease-out",
			"will-change": "border-width, border-color, color, background-color"
		},
		".wizard-breadcrumb-line": {
			"border-top": `3px dotted ${theme.content_border}`,
			height: 0,
			transition: `border-top-color ${DefaultAnimationTime}ms ease-out`,
			"will-change": "border-top-style, border-top-color"
		},
		".wizard-breadcrumb-line-active": {
			"border-top": `3px solid ${theme.content_accent}`,
			height: 0,
			transition: `border-top-color ${DefaultAnimationTime}ms ease-out`
		},
		".compact": {
			width: `${size.button_height_compact}px !important`,
			height: `${size.button_height_compact}px !important`
		},
		".large": {
			width: `${size.button_floating_size}px`,
			height: `${size.button_floating_size}px`,
			"max-width": `${size.button_floating_size}px`,
			"max-height": `${size.button_floating_size}px`
		},
		".state-bg": {
			background: "transparent",
			transition: "background 0.6s",
			opacity: "1 !important"
		},
		":where(.mouse-nav) .state-bg:hover, :where(.keyboard-nav) .state-bg:hover": {
			background: stateBgHover,
			"transition-duration": ".3s"
		},
		":where(.keyboard-nav) .state-bg:focus": {
			background: stateBgFocus,
			"transition-duration": ".3s",
			outline: "none"
		},
		".state-bg:active, .state-bg[pressed=true]": {
			background: stateBgActive,
			"transition-duration": ".3s"
		},
		".flash": { transition: `opacity ${DefaultAnimationTime}ms` },
		".flash:active": { opacity: "0.4" },
		".disabled": { opacity: "0.7" },
		".translucent": { opacity: "0.4" },
		".opaque": { opacity: "1" },
		"@keyframes rotate-icon": {
			"0%": { transform: "rotate(0deg)" },
			"100%": { transform: "rotate(360deg)" }
		},
		".main-view": {
			position: "absolute",
			top: 0,
			right: px(0),
			bottom: px(0),
			left: px(0),
			"overflow-x": "hidden"
		},
		".mlr-safe-inset": {
			"margin-right": "env(safe-area-inset-right)",
			"margin-left": "env(safe-area-inset-left)"
		},
		".plr-safe-inset": {
			"padding-right": "env(safe-area-inset-right)",
			"padding-left": "env(safe-area-inset-left)"
		},
		".mt-safe-inset": { "margin-top": "env(safe-area-inset-top)" },
		".header-nav": {
			height: px(size.navbar_height),
			"background-color": theme.navigation_bg,
			"z-index": 2
		},
		".bottom-nav": {
			"border-top": `1px solid ${theme.navigation_border}`,
			height: positionValue(size.bottom_nav_bar),
			background: theme.header_bg,
			"margin-bottom": "env(safe-area-inset-bottom)",
			"z-index": 2
		},
		".notification-overlay-content": {
			"margin-left": px(size.vpad),
			"margin-right": px(size.vpad),
			"padding-top": px(size.vpad)
		},
		".logo-circle": {
			width: px(size.button_icon_bg_size),
			height: px(size.button_icon_bg_size),
			"border-radius": "50%",
			overflow: "hidden"
		},
		".dot": {
			width: px(size.dot_size),
			height: px(size.dot_size),
			"border-radius": "50%",
			overflow: "hidden",
			"margin-top": px(6)
		},
		".news-button": { position: "relative" },
		".logo-text": {
			height: px(size.header_logo_height),
			width: px(128)
		},
		".logo-height": { height: px(size.header_logo_height) },
		".logo-height > svg, .logo-height > img": { height: px(size.header_logo_height) },
		".custom-logo": {
			width: px(200),
			"background-repeat": "no-repeat",
			"background-size": "auto 100%"
		},
		".nav-bar-spacer": {
			width: "0px",
			height: "22px",
			"margin-left": "2px",
			"border-color": theme.navigation_border,
			"border-width": "1px",
			"border-style": "solid"
		},
		".dialog": { "min-width": px(200) },
		".dialog-width-l": { "max-width": px(800) },
		".dialog-width-m": { "max-width": px(500) },
		".dialog-width-s": { "max-width": px(400) },
		".dialog-width-alert": { "max-width": px(350) },
		".dialog-header": {
			"border-bottom": `1px solid ${theme.content_border}`,
			height: px(size.button_height + 1)
		},
		".dialog-header-line-height": { "line-height": px(size.button_height) },
		".dialog-progress": {
			"text-align": "center",
			padding: px(size.hpad_large),
			width: `calc(100% - ${2 * size.hpad}px)`
		},
		".faq-items img": {
			"max-width": "100%",
			height: "auto"
		},
		".dialog-container": position_absolute(size.button_height + 1, 0, 0, 0),
		".dialog-contentButtonsBottom": { padding: `0 ${px(size.hpad_large)} ${px(size.vpad)} ${px(size.hpad_large)}` },
		".dialog-img": {
			width: px(150),
			height: "auto"
		},
		".dialog-buttons": { "border-top": `1px solid ${theme.content_border}` },
		".dialog-buttons > button": { flex: "1" },
		".dialog-buttons > button:not(:first-child)": {
			"border-left": `1px solid ${theme.content_border}`,
			"margin-left": "0"
		},
		".dialog-height-small": { "min-height": "65vh" },
		".dialog-max-height": { "max-height": "calc(100vh - 100px)" },
		" .folder-column": {
			height: "100%",
			"padding-top": "env(safe-area-inset-top)"
		},
		".list-border-right": { "border-right": `1px solid ${theme.list_border}` },
		".folders": { "margin-bottom": px(12) },
		".folder-row": {
			"align-items": "center",
			position: "relative"
		},
		".template-list-row": {
			"border-left": px(size.border_selection) + " solid transparent",
			"align-items": "center",
			position: "relative"
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
			"text-align": "center"
		},
		".row-selected": {
			"border-color": `${theme.list_accent_fg} !important`,
			color: `${theme.list_accent_fg}`
		},
		".hoverable-list-item:hover": {
			"border-color": `${theme.list_accent_fg} !important`,
			color: `${theme.list_accent_fg}`
		},
		".expander": {
			height: px(size.button_height),
			"min-width": px(size.button_height)
		},
		".mail-viewer-firstLine": { "pading-top": px(10) },
		".hide-outline": { outline: "none" },
		".nofocus:focus": { outline: "none" },
		".input": { outline: "none" },
		"blockquote.tutanota_quote, blockquote[type=cite]": {
			"border-left": `1px solid ${theme.content_accent}`,
			"padding-left": px(size.hpad),
			"margin-left": px(0),
			"margin-right": px(0)
		},
		".tutanota-placeholder": {
			"max-width": "100px !important",
			"max-height": "100px !important"
		},
		".MsoNormal": { margin: 0 },
		".list": {
			overflow: "hidden",
			"list-style": "none",
			margin: 0,
			padding: 0
		},
		".list-row": {
			position: "absolute",
			left: 0,
			right: 0,
			height: px(size.list_row_height)
		},
		".odd-row": { "background-color": theme.list_bg },
		".list-loading": { bottom: 0 },
		".teamLabel": {
			color: theme.list_alternate_bg,
			"background-color": theme.list_accent_fg
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
			"-moz-osx-font-smoothing": "grayscale"
		},
		".badge-line-height": { "line-height": px(18) },
		".list-font-icons": {
			"letter-spacing": "1px",
			"text-align": "right",
			"margin-right": "-3px"
		},
		".monospace": { "font-family": "\"Lucida Console\", Monaco, monospace" },
		".hidden": { visibility: "hidden" },
		".action-bar": {
			width: "initial",
			"margin-left": "auto"
		},
		".ml-between-s > :not(:first-child)": { "margin-left": px(size.hpad_small) },
		".mt-between-s > :not(:first-child)": { "margin-top": px(size.hpad_small) },
		".mt-between-m > :not(:first-child)": { "margin-top": px(size.hpad) },
		".dropdown-panel": {
			position: "absolute",
			width: 0,
			height: 0,
			overflow: "hidden"
		},
		".dropdown-panel-scrollable": {
			position: "absolute",
			width: 0,
			height: 0,
			"overflow-x": "hidden",
			"overflow-y": "auto"
		},
		".dropdown-panel.fit-content, .dropdown-panel.fit-content .dropdown-content": { "min-width": "fit-content" },
		".dropdown-content:first-child": { "padding-top": px(size.vpad_small) },
		".dropdown-content:last-child": { "padding-bottom": px(size.vpad_small) },
		".dropdown-content, .dropdown-content > *": { width: "100%" },
		".dropdown-shadow": { "box-shadow": boxShadow },
		".minimized-shadow": { "box-shadow": `0px 0px 4px 2px ${theme.header_box_shadow_bg}` },
		".dropdown-bar": {
			"border-style": "solid",
			"border-width": "0px 0px 1px 0px",
			"border-color": theme.content_border,
			"padding-bottom": "1px",
			"z-index": 1,
			"border-radius": `${size.border_radius}px ${size.border_radius}px 0 0`,
			color: theme.content_fg
		},
		".dropdown-bar:focus": {
			"border-style": "solid",
			"border-width": "0px 0px 2px 0px",
			"border-color": `${theme.content_accent}`,
			"padding-bottom": "0px"
		},
		".dropdown-button": {
			height: px(size.button_height),
			"padding-left": px(size.vpad),
			"padding-right": px(size.vpad)
		},
		"button, .nav-button": {
			border: 0,
			cursor: "pointer",
			overflow: "hidden",
			"white-space": "nowrap",
			margin: 0,
			"flex-shrink": 0,
			"-webkit-tap-highlight-color": "rgba(255, 255, 255, 0)"
		},
		".nav-button:hover": !isApp() ? {} : {},
		".nav-button:focus": client.isDesktopDevice() ? {} : {},
		"button:focus, button:hover": client.isDesktopDevice() ? { opacity: .7 } : {},
		".button-icon": {
			width: px(size.button_icon_bg_size),
			height: px(size.button_icon_bg_size),
			"border-radius": px(size.button_icon_bg_size),
			"min-width": px(size.button_icon_bg_size)
		},
		".login": {
			width: "100%",
			"border-radius": px(size.border_radius)
		},
		".small-login-button": { width: "260px" },
		".button-content": {
			height: px(size.button_height),
			"min-width": px(size.button_height)
		},
		".text-bubble": { "padding-top": px(size.text_bubble_tpad) },
		".bubble": {
			"border-radius": px(size.border_radius),
			"background-color": theme.button_bubble_bg,
			color: theme.button_bubble_fg
		},
		".keyword-bubble": {
			"max-width": "300px",
			"border-radius": px(size.border_radius),
			"margin-bottom": px(size.vpad_small / 2),
			"margin-right": px(size.vpad_small / 2),
			"background-color": theme.button_bubble_bg,
			padding: `${px(size.vpad_small / 2)} ${px(size.vpad_small)} ${px(size.vpad_small / 2)} ${px(size.vpad_small)}`
		},
		".keyword-bubble-no-padding": {
			"max-width": "300px",
			"border-radius": px(size.border_radius),
			margin: px(size.vpad_small / 2),
			"background-color": theme.button_bubble_bg
		},
		".bubble-color": {
			"background-color": theme.button_bubble_bg,
			color: theme.button_bubble_fg
		},
		mark: {
			"background-color": theme.content_accent,
			color: theme.content_button_icon_selected
		},
		".segmentControl": {
			"border-top": `${px((size.button_height - size.button_height_bubble) / 2)} solid transparent`,
			"border-bottom": `${px((size.button_height - size.button_height_bubble) / 2)} solid transparent`
		},
		".segmentControl-border": {
			border: `1px solid ${theme.content_border}`,
			"padding-top": px(1),
			"padding-bottom": px(1),
			"padding-left": px(1),
			"padding-right": px(1)
		},
		".segmentControl-border-active": {
			border: `2px solid ${theme.content_accent}`,
			"padding-top": px(0),
			"padding-bottom": px(0),
			"padding-left": px(0),
			"padding-right": px(0)
		},
		".segmentControl-border-active-cyber-monday": { border: `2px solid ${theme.content_accent_cyber_monday}` },
		".segmentControlItem": {
			cursor: "pointer",
			background: "transparent"
		},
		".segmentControlItem:last-child": {
			"border-bottom-right-radius": px(size.border_radius_small),
			"border-top-right-radius": px(size.border_radius_small)
		},
		".segmentControlItem:first-child": {
			"border-bottom-left-radius": px(size.border_radius_small),
			"border-top-left-radius": px(size.border_radius_small)
		},
		".icon-segment-control": { "border-radius": px(size.border_radius) },
		".icon-segment-control-item": {
			"border-top": `1px solid ${stateBgHover}`,
			"border-bottom": `1px solid ${stateBgHover}`,
			"border-right": `0.5px solid ${stateBgHover}`,
			width: px(size.icon_segment_control_button_width),
			height: px(size.icon_segment_control_button_height),
			cursor: "pointer",
			background: "transparent"
		},
		".icon-segment-control-item[active]": {
			background: stateBgHover,
			"transition-duration": ".3s"
		},
		".icon-segment-control-item:first-child": {
			"border-bottom-left-radius": px(size.border_radius),
			"border-top-left-radius": px(size.border_radius),
			"border-left": `1px solid ${stateBgHover}`
		},
		".icon-segment-control-item:last-child": {
			"border-bottom-right-radius": px(size.border_radius),
			"border-top-right-radius": px(size.border_radius),
			"border-right": `1px solid ${stateBgHover}`
		},
		".payment-logo": { width: "124px" },
		".onboarding-logo, .onboarding-logo > svg": {
			width: "fit-content",
			height: px(160)
		},
		".onboarding-logo-large, .onboarding-logo-large > svg": {
			width: "fit-content",
			height: px(222)
		},
		"settings-illustration-large, .settings-illustration-large > svg": {
			width: "full-width",
			height: "fit-content"
		},
		".wrapping-row": {
			display: "flex",
			"flex-flow": "row wrap",
			"margin-right": px(-size.hpad_large)
		},
		".wrapping-row > *": {
			flex: "1 0 40%",
			"margin-right": px(size.hpad_large),
			"min-width": px(200)
		},
		".non-wrapping-row": {
			display: "flex",
			"flex-flow": "row",
			"margin-right": px(-size.hpad_large)
		},
		".non-wrapping-row > *": {
			flex: "1 0 40%",
			"margin-right": px(size.hpad_large)
		},
		".inputWrapper": {
			flex: "1 1 auto",
			background: "transparent",
			overflow: "hidden"
		},
		".input, .input-area": {
			display: "block",
			resize: "none",
			border: 0,
			padding: 0,
			margin: 0,
			background: "transparent",
			width: "100%",
			overflow: "hidden",
			color: theme.content_fg
		},
		".input-no-clear::-ms-clear": { display: "none" },
		".resize-none": { resize: "none" },
		".table": {
			"border-collapse": "collapse",
			"table-layout": "fixed",
			width: "100%"
		},
		".table-header-border tr:first-child": { "border-bottom": `1px solid ${theme.content_border}` },
		".table td": { "vertical-align": "middle" },
		td: { padding: 0 },
		".column-width-small": { width: px(size.column_width_s_desktop) },
		".column-width-largest": {},
		".buyOptionBox": {
			position: "relative",
			display: "inline-block",
			border: `1px solid ${theme.content_border}`,
			width: "100%",
			padding: px(10)
		},
		".plans-grid": {
			display: "grid",
			"grid-template-columns": "1fr",
			"grid-auto-flow": "column",
			"grid-template-rows": "auto 1fr"
		},
		"@media (max-width: 992px)": {
			".plans-grid": { "grid-template-rows": "auto 1fr auto 1fr" },
			".plans-grid > div:nth-child(3), .plans-grid > div:nth-child(4)": { order: 1 },
			".plans-grid > div:nth-child(5), .plans-grid > div:nth-child(6)": {
				"grid-column": "1 / 3",
				"justify-self": "center"
			},
			".plans-grid > div:nth-child(5)": { "grid-row-start": 3 },
			".plans-grid > div:nth-child(6)": { "grid-row-start": 4 }
		},
		"@media (max-width: 600px)": {
			".plans-grid": { "grid-template-rows": "auto min-content auto min-content auto min-content" },
			".plans-grid > div:nth-child(3), .plans-grid > div:nth-child(4)": { order: "unset" },
			".plans-grid > div:nth-child(5), .plans-grid > div:nth-child(6)": { "grid-column": "unset" },
			".plans-grid > div:nth-child(5)": { "grid-row-start": "unset" },
			".plans-grid > div:nth-child(6)": { "grid-row-start": "unset" }
		},
		".buyOptionBox.active": { border: `1px solid ${theme.content_accent}` },
		".buyOptionBox.highlighted": {
			border: `2px solid ${theme.content_accent}`,
			padding: px(9)
		},
		".buyOptionBox.highlighted.cyberMonday": {
			border: `2px solid ${theme.content_accent_cyber_monday}`,
			padding: px(9)
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
			background: theme.content_button
		},
		".tooltip": {
			position: "relative",
			display: "inline-block"
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
			left: "50%"
		},
		"details[open] summary ~ *": { animation: "expand .2s ease-in-out" },
		".expand": { animation: "expand .2s ease-in-out" },
		"@keyframes expand": {
			"0%": {
				opacity: 0,
				"margin-top": "-10px",
				height: "0%"
			},
			"100%": {
				opacity: 1,
				"margin-top": px(0),
				height: "100%"
			}
		},
		".info-badge:active": {
			background: theme.content_bg,
			color: theme.content_button
		},
		".tooltip:hover .tooltiptext, .tooltip[expanded=true] .tooltiptext": { visibility: "visible" },
		".ribbon-horizontal": {
			position: "absolute",
			"margin-bottom": "80px",
			background: theme.content_accent,
			top: "69px",
			left: "-6px",
			right: "-6px",
			color: theme.content_bg
		},
		".ribbon-horizontal-cyber-monday": {
			background: theme.content_bg_cyber_monday,
			color: theme.content_bg
		},
		".ribbon-horizontal:after": {
			content: "\"\"",
			position: "absolute",
			height: 0,
			width: 0,
			"border-left": `6px solid ${theme.content_accent}`,
			"border-bottom": "6px solid transparent",
			bottom: "-6px",
			right: 0
		},
		".ribbon-horizontal-cyber-monday:after": { "border-left": `6px solid ${theme.content_bg_cyber_monday}` },
		".ribbon-horizontal:before": {
			content: "\"\"",
			position: "absolute",
			height: 0,
			width: 0,
			"border-right": `6px solid ${theme.content_accent}`,
			"border-bottom": "6px solid transparent",
			bottom: "-6px",
			left: 0
		},
		".ribbon-horizontal-cyber-monday:before": { "border-right": `6px solid ${theme.content_bg_cyber_monday}` },
		".flex-end-on-child .button-content": { "align-items": "flex-end !important" },
		".calendar-checkbox": {
			height: px(22),
			width: px(22),
			"border-width": "1.5px",
			"border-style": "solid",
			"border-radius": "2px"
		},
		".checkbox-override": {
			appearance: "none",
			font: "inherit",
			margin: px(0),
			"margin-right": px(5),
			position: "relative",
			bottom: px(-2)
		},
		".checkbox": {
			appearance: "none",
			margin: "0",
			display: "block",
			width: px(size.checkbox_size),
			height: px(size.checkbox_size),
			border: `2px solid ${theme.content_button}`,
			"border-radius": "3px",
			position: "relative",
			transition: `border ${DefaultAnimationTime}ms cubic-bezier(.4,.0,.23,1)`,
			opacity: "0.8"
		},
		".checkbox:hover": { opacity: "1" },
		".checkbox:checked": {
			border: `7px solid ${theme.content_accent}`,
			opacity: "1"
		},
		".checkbox:checked:after": { display: "inline-flex" },
		".checkbox:after": {
			"font-family": "'Ionicons'",
			content: `'${FontIcons.Checkbox}'`,
			position: "absolute",
			display: "none",
			"font-size": "12px",
			top: "-6px",
			left: "-6px",
			right: 0,
			bottom: 0,
			"line-height": "12px",
			color: theme.content_bg,
			"align-items": "center",
			width: "12px",
			height: "12px"
		},
		".checkbox:before": {
			content: "''",
			position: "absolute",
			width: "30px",
			height: "30px",
			top: "-10px",
			left: "-10px",
			"border-radius": px(size.border_radius),
			transition: `all ${DefaultAnimationTime}ms cubic-bezier(.4,.0,.23,1)`
		},
		".checkbox:checked:before": {
			top: "-15px",
			left: "-15px"
		},
		".checkbox:hover:before": { background: stateBgHover },
		".checkbox:active:before": { background: stateBgActive },
		".list-checkbox": { opacity: "0.4" },
		".calendar-alternate-background": { background: `${theme.list_alternate_bg} !important` },
		".calendar-day:hover": { background: theme.list_alternate_bg },
		".calendar-day:hover .calendar-day-header-button": { opacity: 1 },
		".calendar-day-header-button": { opacity: 0 },
		".calendar-hour": {
			"border-bottom": `1px solid ${theme.content_border}`,
			height: px(size.calendar_hour_height),
			flex: "1 0 auto"
		},
		".calendar-hour:hover": { background: theme.list_alternate_bg },
		".calendar-column-border": { "border-right": `1px solid ${theme.list_border}` },
		".calendar-column-border:nth-child(7)": { "border-right": "none" },
		".calendar-hour-margin": { "margin-left": px(size.calendar_hour_width) },
		".calendar-hour-column": { width: px(size.calendar_hour_width) },
		".calendar-days-header-row": { height: px(size.calendar_days_header_height) },
		".calendar-day": {
			"border-top": `1px solid ${theme.list_border}`,
			transition: "background 0.4s",
			background: theme.list_bg
		},
		".cursor-pointer": { cursor: "pointer" },
		".calendar-day-indicator": {
			height: px(size.calendar_days_header_height),
			"line-height": px(size.calendar_days_header_height),
			"text-align": "center",
			"font-size": "14px"
		},
		".calendar-day .calendar-day-indicator:hover": {
			background: theme.list_message_bg,
			opacity: .7
		},
		".calendar-day-number": {
			margin: "3px auto",
			width: "22px"
		},
		".calendar-event": {
			"border-radius": px(4),
			border: ` ${size.calendar_event_border}px solid ${theme.content_bg}`,
			"padding-left": "4px",
			"font-weight": "600",
			"box-sizing": "content-box"
		},
		".calendar-current-day-circle": { "background-color": theme.content_button },
		".calendar-selected-day-circle": { "background-color": theme.content_accent },
		".calendar-current-day-text": {
			color: theme.content_bg,
			"font-weight": "bold"
		},
		".calendar-selected-day-text": {
			color: theme.content_bg,
			"font-weight": "bold"
		},
		".animation-reverse": { "animation-direction": "reverse" },
		".slide-bottom": {
			"animation-name": "slideFromBottom",
			"animation-iteration-count": 1,
			"animation-timing-function": "ease-in",
			"animation-duration": "100ms"
		},
		"@keyframes slideFromBottom": {
			"0%": { translate: "0 100%" },
			"100%": { translate: "0 0" }
		},
		".slide-top": {
			"animation-name": "slideFromTop",
			"animation-iteration-count": 1,
			"animation-timing-function": "ease-in",
			"animation-duration": "100ms"
		},
		"@keyframes slideFromTop": {
			"0%": { translate: "0 -100%" },
			"100%": { translate: "0 0" }
		},
		".fade-in": {
			opacity: 1,
			"animation-name": "fadeInOpacity",
			"animation-iteration-count": 1,
			"animation-timing-function": "ease-in",
			"animation-duration": "200ms"
		},
		"@keyframes fadeInOpacity": {
			"0%": { opacity: 0 },
			"100%": { opacity: 1 }
		},
		".calendar-bubble-more-padding-day .calendar-event": { border: `1px solid ${theme.list_bg}` },
		".darker-hover:hover": { filter: "brightness(95%)" },
		".darkest-hover:hover": { filter: "brightness(70%)" },
		".event-continues-left": {
			"border-top-left-radius": 0,
			"border-bottom-left-radius": 0,
			"border-left": "none"
		},
		".event-continues-right": {
			"margin-right": 0,
			"border-right": "none",
			"border-top-right-radius": 0,
			"border-bottom-right-radius": 0
		},
		".event-continues-right-arrow": {
			width: 0,
			height: 0,
			"border-top": "9px solid transparent",
			"border-bottom": "9px solid transparent",
			"border-left": "6px solid green",
			"margin-top": px(1),
			"margin-bottom": px(1)
		},
		".time-field": { width: "80px" },
		".time-picker input": { color: "rgba(0, 0, 0, 0)" },
		".time-picker-fake-display": {
			bottom: "1.6em",
			left: "0.1em"
		},
		".calendar-agenda-time-column": { width: px(80) },
		".calendar-agenda-time-column > *": { height: px(44) },
		".calendar-agenda-row": {
			"min-height": "44px",
			flex: "1 0 auto"
		},
		".calendar-switch-button": {
			width: "40px",
			"text-align": "center"
		},
		".calendar-long-events-header": {
			overflow: "hidden",
			"border-bottom": `1px solid ${theme.content_border}`
		},
		".calendar-month-week-number": {
			"font-size": "12px",
			opacity: "0.8",
			top: "8px",
			left: "6px"
		},
		".calendar-month-week-number:after": {
			content: "''",
			width: "100%",
			height: "100%",
			position: "absolute",
			top: "0",
			left: "0",
			padding: "35%",
			margin: "-35% -35%"
		},
		".color-option:not(.selected):focus-within, .color-option:not(.selected):hover": client.isDesktopDevice() ? { opacity: .7 } : {},
		".custom-color-container .text-field": { "padding-top": "0px" },
		".custom-color-container .text.input": {
			"text-transform": "uppercase",
			width: "9ch"
		},
		".custom-color-container .inputWrapper:before": {
			content: "\"#\" / \"\"",
			color: theme.content_message_bg
		},
		".calendar-invite-field": { "min-width": "80px" },
		".block-list": {
			"list-style": "none",
			padding: 0
		},
		".block-list li": { display: "block" },
		".sticky": { position: "sticky" },
		".text-fade": { color: theme.content_button },
		".no-appearance input, .no-appearance input::-webkit-outer-spin-button, .no-appearance input::-webkit-inner-spin-button": {
			"-webkit-appearance": "none",
			"-moz-appearance": "textfield",
			appearance: "none"
		},
		"@media (max-width: 400px)": {
			".flex-direction-change": {
				display: "flex",
				"flex-direction": "column-reverse",
				"justify-content": "center"
			},
			".column-width-small": { width: px(size.column_width_s_mobile) },
			"svg, img": { "shape-rendering": "optimizeSpeed" }
		},
		".transition-margin": { transition: `margin-bottom 200ms ease-in-out` },
		".circle": { "border-radius": "50%" },
		".clickable": { cursor: "pointer" },
		".switch-month-button svg": { fill: theme.navigation_button },
		"drawer-menu": {
			width: px(size.drawer_menu_width),
			background: getNavigationMenuBg()
		},
		".menu-shadow": { "box-shadow": "0 4px 5px 2px rgba(0,0,0,0.14), 0 4px 5px 2px rgba(0,0,0,0.14), 0 4px 5px 2px rgba(0,0,0,0.14)" },
		".big-input input": {
			"font-size": px(size.font_size_base * 1.4),
			"line-height": `${px(size.font_size_base * 1.4 + 2)} !important`
		},
		".hidden-until-focus": {
			position: "absolute",
			left: "-9999px",
			"z-index": "999",
			opacity: "0"
		},
		".hidden-until-focus:focus": {
			left: "50%",
			transform: "translate(-50%)",
			opacity: "1"
		},
		[`@media (max-width: ${size.desktop_layout_width - 1}px)`]: {
			".main-view": {
				top: 0,
				bottom: 0
			},
			".fixed-bottom-right": {
				bottom: px(size.hpad_large_mobile + size.bottom_nav_bar),
				right: px(size.hpad_large_mobile)
			},
			".custom-logo": { width: px(40) },
			".notification-overlay-content": { "padding-top": px(size.vpad_small) },
			".calendar-day-indicator": {
				height: "20px",
				"line-height": "20px",
				"text-align": "center",
				"font-size": "14px"
			},
			".calendar-day-number": {
				margin: "2px auto",
				width: "20px"
			},
			".calendar-hour-margin": { "margin-left": px(size.calendar_hour_width_mobile) },
			".calendar-month-week-number": {
				"font-size": "10px",
				opacity: "0.8",
				top: "3px",
				left: "3px"
			}
		},
		".cursor-grabbing *": { cursor: "grabbing !important" },
		".drag-mod-key *": { cursor: "copy !important" },
		".noscreen": { display: "none" },
		"@media print": {
			".color-adjust-exact": {
				"color-adjust": "exact",
				"-webkit-print-color-adjust": "exact"
			},
			".noprint": { display: "none !important" },
			".noscreen": { display: "initial" },
			".print": {
				color: "black",
				"background-color": "white",
				display: "block"
			},
			"html, body": {
				position: "initial",
				overflow: "visible !important",
				color: lightTheme.content_fg,
				"background-color": `${lightTheme.content_bg} !important`
			},
			".header-nav": { display: "none" },
			".main-view": {
				top: 0,
				position: "static !important"
			},
			".dropdown-panel": { display: "none" },
			".fill-absolute": {
				position: "static !important",
				display: "initial"
			},
			".view-columns": {
				width: "100% !important",
				transform: "initial !important",
				display: "initial",
				position: "initial"
			},
			".view-column:nth-child(1), .view-column:nth-child(2)": { display: "none" },
			".view-column": { width: "100% !important" },
			"#mail-viewer": {
				overflow: "visible",
				display: "block"
			},
			"#mail-body": { overflow: "visible" },
			"#login-view": { display: "none" },
			".dialog-header": { display: "none" },
			".dialog-container": {
				overflow: "visible",
				position: "static !important"
			},
			"#wizard-paging": { display: "none" },
			"button:not(.print)": { display: "none" },
			".bottom-nav": { display: "none" },
			".mobile .view-column:nth-child(2)": { display: "initial" },
			".folder-column": { display: "none" },
			pre: {
				"word-break": "normal",
				"overflow-wrap": "anywhere",
				"white-space": "break-spaces"
			}
		},
		"@keyframes onAutoFillStart": {
			from: {},
			to: {}
		},
		"@keyframes onAutoFillCancel": {
			from: {},
			to: {}
		},
		"input:-webkit-autofill": { "animation-name": "onAutoFillStart" },
		"input:not(:-webkit-autofill)": { "animation-name": "onAutoFillCancel" },
		".MsoListParagraph, .MsoListParagraphCxSpFirst, .MsoListParagraphCxSpMiddle, .MsoListParagraphCxSpLast": { "margin-left": "36.0pt" },
		"span.vertical-text": {
			transform: "rotate(180deg)",
			"writing-mode": "vertical-rl"
		},
		"ul.usage-test-opt-in-bullets": {
			margin: "0 auto",
			"list-style": "disc",
			"text-align": "left"
		},
		".bonus-month": {
			background: theme.content_accent,
			color: theme.content_bg,
			width: px(100),
			"min-width": px(100),
			height: px(100),
			"min-height": px(100),
			"border-radius": px(100)
		},
		".day-events-indicator": {
			"background-color": theme.content_accent,
			"border-radius": "50%",
			display: "inline-block",
			height: "5px",
			width: "5px",
			position: "absolute",
			bottom: 0,
			margin: "0 auto",
			left: 0,
			right: 0
		},
		".faded-day": { color: theme.navigation_menu_icon },
		".faded-text": { color: theme.content_message_bg },
		".svg-text-content-bg text": { fill: theme.content_bg },
		".overflow-auto": { overflow: "auto" },
		".float-action-button": {
			position: "fixed",
			"border-radius": "25%"
		},
		".posb-ml": { bottom: px(size.vpad_ml) },
		".posr-ml": { right: px(size.vpad_ml) },
		".mb-small-line-height": { "margin-bottom": px(size.line_height * size.font_size_small) },
		".tutaui-card-container": {
			"box-sizing": "border-box",
			"background-color": theme.content_bg,
			"border-radius": px(size.border_radius_medium),
			padding: px(size.vpad_small),
			position: "relative",
			height: "fit-content"
		},
		".tutaui-text-field, .child-text-editor [role='textbox']": {
			display: "block",
			"box-sizing": "border-box",
			"background-color": "transparent",
			border: "none",
			"border-radius": px(size.border_radius_medium),
			color: theme.content_fg,
			width: "100%",
			padding: px(size.vpad_small),
			transition: `background-color .1s ease-out`,
			"caret-color": theme.content_accent
		},
		".child-text-editor [role='textbox']:focus-visible": { outline: "medium invert color" },
		".tutaui-text-field:focus, .child-text-editor [role='textbox']:focus": { "background-color": theme.button_bubble_bg },
		".tutaui-text-field::placeholder": { color: theme.content_message_bg },
		".text-editor-placeholder": {
			position: "absolute",
			top: px(size.vpad_small),
			left: px(size.vpad_small),
			color: theme.content_message_bg
		},
		".tutaui-switch": {
			display: "flex",
			"align-items": "center",
			gap: px(size.vpad_small)
		},
		".tutaui-toggle-pill": {
			position: "relative",
			display: "block",
			width: "45.5px",
			height: "28px",
			"background-color": theme.content_message_bg,
			"border-radius": px(size.vpad_small * 4),
			transition: `background-color ${DefaultAnimationTime}ms ease-out`
		},
		".tutaui-toggle-pill:after": {
			position: "absolute",
			content: "''",
			width: "21px",
			height: "21px",
			top: "50%",
			"-webkit-transform": "translateY(-50%)",
			"-moz-transform": "translateY(-50%)",
			"-ms-transform": "translateY(-50%)",
			transform: "translateY(-50%)",
			margin: "0 4px",
			"background-color": "#fff",
			"border-radius": "50%",
			left: 0,
			transition: `left ${DefaultAnimationTime}ms ease-out`
		},
		".tutaui-toggle-pill.checked": { "background-color": theme.content_accent },
		".tutaui-toggle-pill.checked:after": { left: "calc(100% - 29px)" },
		".tutaui-toggle-pill input[type='checkbox']": {
			"z-index": "-1",
			visibility: "hidden",
			position: "absolute"
		},
		".tutaui-select-trigger": {
			display: "flex",
			"justify-content": "space-between",
			"align-items": "center",
			gap: px(size.vpad_small)
		},
		".fit-content": { width: "fit-content" },
		".tutaui-button-outline": {
			border: "2px solid",
			"border-radius": px(size.border_radius_medium),
			padding: px(size.border_radius_medium),
			"text-align": "center"
		},
		".unstyled-list": {
			"list-style": "none",
			margin: 0,
			padding: 0
		},
		".time-selection-grid": {
			display: "grid",
			"grid-template-columns": "2fr 6fr 3fr",
			"grid-gap": px(size.vpad_small),
			"align-items": "center"
		},
		".time-selection-grid > *": {
			overflow: "hidden",
			"white-space": "nowrap",
			"text-overflow": "clip"
		},
		".invisible": {
			all: "none",
			"background-color": "transparent",
			border: "none",
			color: "transparent"
		},
		".invisible::selection": {
			all: "none",
			"background-color": "transparent",
			border: "none",
			color: "transparent"
		},
		".invisible::-moz-selection": {
			all: "none",
			"background-color": "transparent",
			border: "none",
			color: "transparent"
		},
		".transition-transform": { transition: `transform ${DefaultAnimationTime}ms linear` },
		".border-none": { border: "none" },
		".big-radio": {
			width: "20px",
			height: "20px"
		},
		".outlined": {
			border: `2px solid ${theme.content_border}`,
			"border-radius": px(size.border_radius_medium)
		},
		".capitalize": { "text-transform": "capitalize" },
		".box-content": { "box-sizing": "content-box" },
		".fit-height": { height: "fit-content" },
		".min-h-s": { "min-height": px(size.vpad_xl * 4) },
		".border-content-message-bg": { "border-color": theme.content_message_bg },
		".border-radius-bottom-0": {
			"border-bottom-right-radius": px(0),
			"border-bottom-left-radius": px(0)
		}
	};
});

//#endregion
export { getFonts };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi1zdHlsZXMtY2h1bmsuanMiLCJuYW1lcyI6WyJ0b3A6IG51bWJlciB8IG51bGwiLCJyaWdodDogbnVtYmVyIHwgbnVsbCIsImJvdHRvbTogbnVtYmVyIHwgbnVsbCIsImxlZnQ6IG51bWJlciB8IG51bGwiLCJ2YWx1ZTogbnVtYmVyIHwgbnVsbCIsImZvbnRzOiBBcnJheTxzdHJpbmc+Il0sInNvdXJjZXMiOlsiLi4vc3JjL2NvbW1vbi9ndWkvbWl4aW5zLnRzIiwiLi4vc3JjL2NvbW1vbi9ndWkvbWFpbi1zdHlsZXMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgcHggfSBmcm9tIFwiLi9zaXplXCJcbmltcG9ydCB7IGFzc2VydE1haW5Pck5vZGVCb290IH0gZnJvbSBcIi4uL2FwaS9jb21tb24vRW52XCJcblxuYXNzZXJ0TWFpbk9yTm9kZUJvb3QoKVxuZXhwb3J0IGNvbnN0IG5vc2VsZWN0ID0ge1xuXHRfd2Via2l0X3RvdWNoX2NhbGxvdXQ6IFwibm9uZVwiLFxuXG5cdC8qIGlPUyBTYWZhcmkgKi9cblx0X3dlYmtpdF91c2VyX3NlbGVjdDogXCJub25lXCIsXG5cblx0LyogQ2hyb21lL1NhZmFyaS9PcGVyYSAqL1xuXHRfa2h0bWxfdXNlcl9zZWxlY3Q6IFwibm9uZVwiLFxuXG5cdC8qIEtvbnF1ZXJvciAqL1xuXHRfbW96X3VzZXJfc2VsZWN0OiBcIm5vbmVcIixcblxuXHQvKiBGaXJlZm94ICovXG5cdF9tc191c2VyX3NlbGVjdDogXCJub25lXCIsXG5cblx0LyogSUUvRWRnZSAqL1xuXHR1c2VyX3NlbGVjdDogXCJub25lXCIsXG5cdC8qIG5vbl9wcmVmaXhlZCB2ZXJzaW9uLCBjdXJyZW50bHkgbm90IHN1cHBvcnRlZCBieSBhbnkgYnJvd3NlciAqL1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcG9zaXRpb25fYWJzb2x1dGUoXG5cdHRvcDogbnVtYmVyIHwgbnVsbCxcblx0cmlnaHQ6IG51bWJlciB8IG51bGwsXG5cdGJvdHRvbTogbnVtYmVyIHwgbnVsbCxcblx0bGVmdDogbnVtYmVyIHwgbnVsbCxcbik6IHtcblx0Ym90dG9tOiBudW1iZXIgfCBzdHJpbmdcblx0bGVmdDogbnVtYmVyIHwgc3RyaW5nXG5cdHBvc2l0aW9uOiBzdHJpbmdcblx0cmlnaHQ6IG51bWJlciB8IHN0cmluZ1xuXHR0b3A6IG51bWJlciB8IHN0cmluZ1xufSB7XG5cdHJldHVybiB7XG5cdFx0cG9zaXRpb246IFwiYWJzb2x1dGVcIixcblx0XHR0b3A6IHBvc2l0aW9uVmFsdWUodG9wKSxcblx0XHRyaWdodDogcG9zaXRpb25WYWx1ZShyaWdodCksXG5cdFx0Ym90dG9tOiBwb3NpdGlvblZhbHVlKGJvdHRvbSksXG5cdFx0bGVmdDogcG9zaXRpb25WYWx1ZShsZWZ0KSxcblx0fVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcG9zaXRpb25WYWx1ZSh2YWx1ZTogbnVtYmVyIHwgbnVsbCk6IG51bWJlciB8IHN0cmluZyB7XG5cdGlmICh2YWx1ZSkge1xuXHRcdHJldHVybiBweCh2YWx1ZSlcblx0fSBlbHNlIGlmICh2YWx1ZSA9PT0gMCkge1xuXHRcdHJldHVybiAwXG5cdH0gZWxzZSB7XG5cdFx0cmV0dXJuIFwidW5zZXRcIlxuXHR9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmbGV4KGFyZ3M6IHN0cmluZyk6IHtcblx0X21zX2ZsZXg6IHN0cmluZ1xuXHRfd2Via2l0X2JveF9mbGV4OiBzdHJpbmdcblx0X3dlYmtpdF9mbGV4OiBzdHJpbmdcblx0ZmxleDogc3RyaW5nXG59IHtcblx0cmV0dXJuIHtcblx0XHRfd2Via2l0X2JveF9mbGV4OiBhcmdzLFxuXHRcdF93ZWJraXRfZmxleDogYXJncyxcblx0XHRfbXNfZmxleDogYXJncyxcblx0XHRmbGV4OiBhcmdzLFxuXHR9XG59XG5cbi8vIFdlIGFwcGx5IGJhY2tmYWNlX3Zpc2liaWxpdHkgb24gYWxsIGFuaW1hdGVkIGVsZW1lbnRzIHRvIGluY3JlYXNlIGFuaW1hdGlvbiBwZXJmb3JtYW5jZSBvbiBtb2JpbGUgZGV2aWNlc1xuZXhwb3J0IGNvbnN0IGJhY2tmYWNlX2ZpeCA9IHtcblx0X3dlYmtpdF9iYWNrZmFjZV92aXNpYmlsaXR5OiBcImhpZGRlblwiLFxuXHRiYWNrZmFjZV92aXNpYmlsaXR5OiBcImhpZGRlblwiLFxufVxuIiwiaW1wb3J0IHsgc3R5bGVzIH0gZnJvbSBcIi4vc3R5bGVzXCJcbmltcG9ydCB7IHB4LCBzaXplIH0gZnJvbSBcIi4vc2l6ZVwiXG5pbXBvcnQgeyBjbGllbnQgfSBmcm9tIFwiLi4vbWlzYy9DbGllbnREZXRlY3RvclwiXG5pbXBvcnQgeyBsYW5nIH0gZnJvbSBcIi4uL21pc2MvTGFuZ3VhZ2VWaWV3TW9kZWxcIlxuaW1wb3J0IHsgbm9zZWxlY3QsIHBvc2l0aW9uX2Fic29sdXRlLCBwb3NpdGlvblZhbHVlIH0gZnJvbSBcIi4vbWl4aW5zXCJcbmltcG9ydCB7IGFzc2VydE1haW5Pck5vZGUsIGlzQWRtaW5DbGllbnQsIGlzQXBwLCBpc0VsZWN0cm9uQ2xpZW50IH0gZnJvbSBcIi4uL2FwaS9jb21tb24vRW52XCJcbmltcG9ydCB7IGdldENvbnRlbnRCdXR0b25JY29uQmFja2dyb3VuZCwgZ2V0RWxldmF0ZWRCYWNrZ3JvdW5kLCBnZXROYXZpZ2F0aW9uTWVudUJnLCB0aGVtZSB9IGZyb20gXCIuL3RoZW1lXCJcbmltcG9ydCB7IHN0YXRlQmdBY3RpdmUsIHN0YXRlQmdGb2N1cywgc3RhdGVCZ0hvdmVyLCBzdGF0ZUJnTGlrZSB9IGZyb20gXCIuL2J1aWx0aW5UaGVtZXMuanNcIlxuaW1wb3J0IHsgRm9udEljb25zIH0gZnJvbSBcIi4vYmFzZS9pY29ucy9Gb250SWNvbnMuanNcIlxuaW1wb3J0IHsgRGVmYXVsdEFuaW1hdGlvblRpbWUgfSBmcm9tIFwiLi9hbmltYXRpb24vQW5pbWF0aW9ucy5qc1wiXG5pbXBvcnQgeyBsb2NhdG9yIH0gZnJvbSBcIi4uL2FwaS9tYWluL0NvbW1vbkxvY2F0b3IuanNcIlxuXG5hc3NlcnRNYWluT3JOb2RlKClcblxuZXhwb3J0IGZ1bmN0aW9uIGdldEZvbnRzKCk6IHN0cmluZyB7XG5cdC8vIHNlZSBodHRwczovL2JpdHNvZmNvLmRlL3RoZS1uZXctc3lzdGVtLWZvbnQtc3RhY2svXG5cdGNvbnN0IGZvbnRzOiBBcnJheTxzdHJpbmc+ID0gW1xuXHRcdFwiLWFwcGxlLXN5c3RlbVwiLFxuXHRcdFwic3lzdGVtLXVpXCIsXG5cdFx0XCJCbGlua01hY1N5c3RlbUZvbnRcIixcblx0XHRcIlNlZ29lIFVJXCIsXG5cdFx0XCJSb2JvdG9cIixcblx0XHRcIkhlbHZldGljYSBOZXVlXCIsXG5cdFx0XCJIZWx2ZXRpY2FcIixcblx0XHRcIkFyaWFsXCIsXG5cdFx0XCJzYW5zLXNlcmlmXCIsXG5cdF1cblx0Ly8gd29ya2Fyb3VuZCBmb3IgaW5jb3JyZWN0IEphcGFuZXNlIGZvbnQgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS90dXRhby90dXRhbm90YS9pc3N1ZXMvMTkwOVxuXHRpZiAoZW52LnBsYXRmb3JtSWQgPT09IFwid2luMzJcIiAmJiBsYW5nLmNvZGUgPT09IFwiamFcIikgZm9udHMucHVzaChcIlNpbUhlaVwiLCBcIum7keS9k1wiKVxuXHRmb250cy5wdXNoKFwiQXBwbGUgQ29sb3IgRW1vamlcIiwgXCJTZWdvZSBVSSBFbW9qaVwiLCBcIlNlZ29lIFVJIFN5bWJvbFwiKVxuXHRyZXR1cm4gZm9udHMuam9pbihcIiwgXCIpXG59XG5cbmNvbnN0IGJveFNoYWRvdyA9IGAwIDEwcHggMjBweCByZ2JhKDAsMCwwLDAuMTkpLCAwIDZweCA2cHggcmdiYSgwLDAsMCwwLjIzKWBcbmNvbnN0IHNlYXJjaEJhclNoYWRvdyA9IFwiMHB4IDJweCA0cHggcmdiKDAsIDAsIDAsIDAuMTIpXCJcblxuY29uc3Qgc2Nyb2xsYmFyV2lkdGhIZWlnaHQgPSBweCgxOClcbnN0eWxlcy5yZWdpc3RlclN0eWxlKFwibWFpblwiLCAoKSA9PiB7XG5cdGNvbnN0IGxpZ2h0VGhlbWUgPSBsb2NhdG9yLnRoZW1lQ29udHJvbGxlci5nZXRCYXNlVGhlbWUoXCJsaWdodFwiKVxuXHRyZXR1cm4ge1xuXHRcdFwiI2xpbmstdHRcIjogaXNFbGVjdHJvbkNsaWVudCgpXG5cdFx0XHQ/IHtcblx0XHRcdFx0XHRcInBvaW50ZXItZXZlbnRzXCI6IFwibm9uZVwiLFxuXHRcdFx0XHRcdFwiZm9udC1zaXplXCI6IHB4KHNpemUuZm9udF9zaXplX3NtYWxsKSxcblx0XHRcdFx0XHRcInBhZGRpbmctbGVmdFwiOiBweChzaXplLmhwYWRfc21hbGwpLFxuXHRcdFx0XHRcdFwicGFkZGluZy1yaWdodFwiOiBweChzaXplLmhwYWRfc21hbGwpLFxuXHRcdFx0XHRcdFwicGFkZGluZy10b3BcIjogcHgoc2l6ZS52cGFkX3hzKSxcblx0XHRcdFx0XHRwb3NpdGlvbjogXCJmaXhlZFwiLFxuXHRcdFx0XHRcdGJvdHRvbTogcHgoc2l6ZS52cGFkX3hzKSxcblx0XHRcdFx0XHRsZWZ0OiBweChzaXplLnZwYWRfeHMpLFxuXHRcdFx0XHRcdFwidGV4dC1hbGlnblwiOiBcImNlbnRlclwiLFxuXHRcdFx0XHRcdGNvbG9yOiB0aGVtZS5jb250ZW50X2JnLFxuXHRcdFx0XHRcdFwidGV4dC1kZWNvcmF0aW9uXCI6IFwibm9uZVwiLFxuXHRcdFx0XHRcdFwiYmFja2dyb3VuZC1jb2xvclwiOiB0aGVtZS5jb250ZW50X2ZnLFxuXHRcdFx0XHRcdGJvcmRlcjogXCIxcHggc29saWQgXCIgKyB0aGVtZS5jb250ZW50X2JnLFxuXHRcdFx0XHRcdG9wYWNpdHk6IDAsXG5cdFx0XHRcdFx0dHJhbnNpdGlvbjogXCJvcGFjaXR5IC4xcyBsaW5lYXJcIixcblx0XHRcdFx0XHRcImZvbnQtZmFtaWx5XCI6IFwibW9ub3NwYWNlXCIsXG5cdFx0XHQgIH1cblx0XHRcdDoge30sXG5cdFx0XCIjbGluay10dC5yZXZlYWxcIjogaXNFbGVjdHJvbkNsaWVudCgpXG5cdFx0XHQ/IHtcblx0XHRcdFx0XHRvcGFjaXR5OiAxLFxuXHRcdFx0XHRcdHRyYW5zaXRpb246IFwib3BhY2l0eSAuMXMgbGluZWFyXCIsXG5cdFx0XHRcdFx0XCJ6LWluZGV4XCI6IDk5OTksXG5cdFx0XHQgIH1cblx0XHRcdDoge30sXG5cdFx0XCIqOm5vdChpbnB1dCk6bm90KHRleHRhcmVhKVwiOiBpc0FkbWluQ2xpZW50KClcblx0XHRcdD8ge31cblx0XHRcdDoge1xuXHRcdFx0XHRcdFwidXNlci1zZWxlY3RcIjogXCJub25lXCIsXG5cblx0XHRcdFx0XHQvKiBkaXNhYmxlIHNlbGVjdGlvbi9Db3B5IGZvciBVSSBlbGVtZW50cyovXG5cdFx0XHRcdFx0XCItbXMtdXNlci1zZWxlY3RcIjogXCJub25lXCIsXG5cdFx0XHRcdFx0XCItd2Via2l0LXVzZXItc2VsZWN0XCI6IFwibm9uZVwiLFxuXHRcdFx0XHRcdFwiLW1vei11c2VyLXNlbGVjdFwiOiBcIm5vbmVcIixcblx0XHRcdFx0XHRcIi13ZWJraXQtdG91Y2gtY2FsbG91dFwiOiBcIm5vbmVcIixcblxuXHRcdFx0XHRcdC8qIGRpc2FibGUgdGhlIElPUyBwb3B1cCB3aGVuIGxvbmctcHJlc3Mgb24gYSBsaW5rICovXG5cdFx0XHRcdFx0XCItd2Via2l0LXRhcC1oaWdobGlnaHQtY29sb3JcIjogXCJyZ2JhKDAsIDAsIDAsIDApXCIsXG5cdFx0XHQgIH0sXG5cdFx0XCIqOm5vdChpbnB1dCk6bm90KHRleHRhcmVhKTpub3QoW2RyYWdnYWJsZT0ndHJ1ZSddKVwiOiB7XG5cdFx0XHRcIi13ZWJraXQtdXNlci1kcmFnXCI6IFwibm9uZVwiLFxuXHRcdH0sXG5cdFx0Ly8gRGlzYWJsZSBvdXRsaW5lIGZvciBtb3VzZSBhbmQgdG91Y2ggbmF2aWdhdGlvblxuXHRcdFwiOndoZXJlKC5tb3VzZS1uYXYpICosIDp3aGVyZSgudG91Y2gtbmF2KSAqXCI6IHtcblx0XHRcdG91dGxpbmU6IFwibm9uZVwiLFxuXHRcdH0sXG5cdFx0XCIuc2VsZWN0YWJsZVwiOiB7XG5cdFx0XHRjdXJzb3I6IFwidGV4dFwiLFxuXHRcdFx0XCJ1c2VyLXNlbGVjdFwiOiBcInRleHQgIWltcG9ydGFudFwiLFxuXHRcdFx0XCItbXMtdXNlci1zZWxlY3RcIjogXCJ0ZXh0ICFpbXBvcnRhbnRcIixcblx0XHRcdFwiLXdlYmtpdC11c2VyLXNlbGVjdFwiOiBcInRleHQgIWltcG9ydGFudFwiLFxuXHRcdFx0XCItbW96LXVzZXItc2VsZWN0XCI6IFwidGV4dCAhaW1wb3J0YW50XCIsXG5cdFx0XHRcIi13ZWJraXQtdG91Y2gtY2FsbG91dFwiOiBcImRlZmF1bHQgIWltcG9ydGFudFwiLFxuXHRcdH0sXG5cdFx0XCIuc2VsZWN0YWJsZSAqXCI6IHtcblx0XHRcdFwidXNlci1zZWxlY3RcIjogXCJ0ZXh0ICFpbXBvcnRhbnRcIixcblx0XHRcdFwiLW1zLXVzZXItc2VsZWN0XCI6IFwidGV4dCAhaW1wb3J0YW50XCIsXG5cdFx0XHRcIi13ZWJraXQtdXNlci1zZWxlY3RcIjogXCJ0ZXh0ICFpbXBvcnRhbnRcIixcblx0XHRcdFwiLW1vei11c2VyLXNlbGVjdFwiOiBcInRleHQgIWltcG9ydGFudFwiLFxuXHRcdFx0XCItd2Via2l0LXRvdWNoLWNhbGxvdXRcIjogXCJkZWZhdWx0ICFpbXBvcnRhbnRcIixcblx0XHR9LFxuXHRcdFwiQGZvbnQtZmFjZVwiOiB7XG5cdFx0XHRcImZvbnQtZmFtaWx5XCI6IFwiJ0lvbmljb25zJ1wiLFxuXHRcdFx0c3JjOiBgdXJsKCcke3dpbmRvdy50dXRhby5hcHBTdGF0ZS5wcmVmaXhXaXRob3V0RmlsZX0vaW1hZ2VzL2ZvbnQudHRmJykgZm9ybWF0KCd0cnVldHlwZScpYCxcblx0XHRcdFwiZm9udC13ZWlnaHRcIjogXCJub3JtYWxcIixcblx0XHRcdFwiZm9udC1zdHlsZVwiOiBcIm5vcm1hbFwiLFxuXHRcdH0sXG5cdFx0Ly8gQWxsb3cgbG9uZy1jbGljayBjb250ZXh0dWFsIGFjdGlvbnMgZm9yIGlPU1xuXHRcdFwiLnRvdWNoLWNhbGxvdXQgKlwiOiB7XG5cdFx0XHRcIi13ZWJraXQtdG91Y2gtY2FsbG91dFwiOiBcImRlZmF1bHQgIWltcG9ydGFudFwiLFxuXHRcdH0sXG5cblx0XHQvKlxuICAgICBCb3ggU2l6aW5nXG4gICAgICovXG5cdFx0W2BodG1sLCBib2R5LCBkaXYsIGFydGljbGUsIHNlY3Rpb24sIG1haW4sIGZvb3RlciwgaGVhZGVyLCBmb3JtLCBmaWVsZHNldCwgbGVnZW5kLFxuICAgICAgICAgICAgcHJlLCBjb2RlLCBwLCBhLCBoMSwgaDIsIGgzLCBoNCwgaDUsIGg2LCB1bCwgb2wsIGxpLCBkbCwgZHQsIGRkLCB0ZXh0YXJlYSxcbiAgICAgICAgICAgIGlucHV0W3R5cGU9XCJlbWFpbFwiXSwgaW5wdXRbdHlwZT1cIm51bWJlclwiXSwgaW5wdXRbdHlwZT1cInBhc3N3b3JkXCJdLFxuICAgICAgICAgICAgaW5wdXRbdHlwZT1cInRlbFwiXSwgaW5wdXRbdHlwZT1cInRleHRcIl0sIGlucHV0W3R5cGU9XCJ1cmxcIl0sIC5ib3JkZXItYm94YF06IHtcblx0XHRcdFwiYm94LXNpemluZ1wiOiBcImJvcmRlci1ib3hcIixcblx0XHR9LFxuXHRcdGE6IHtcblx0XHRcdGNvbG9yOiBcImluaGVyaXRcIixcblx0XHR9LFxuXHRcdFwiOnJvb3RcIjoge1xuXHRcdFx0Ly8gV2UgbmVlZCBpdCBiZWNhdXNlIHdlIGNhbid0IGdldCBlbnYoKSB2YWx1ZSBmcm9tIEpTIGRpcmVjdGx5XG5cdFx0XHRcIi0tc2FmZS1hcmVhLWluc2V0LWJvdHRvbVwiOiBcImVudihzYWZlLWFyZWEtaW5zZXQtYm90dG9tKVwiLFxuXHRcdFx0XCItLXNhZmUtYXJlYS1pbnNldC10b3BcIjogXCJlbnYoc2FmZS1hcmVhLWluc2V0LXRvcClcIixcblx0XHRcdFwiLS1zYWZlLWFyZWEtaW5zZXQtcmlnaHRcIjogXCJlbnYoc2FmZS1hcmVhLWluc2V0LXJpZ2h0KVwiLFxuXHRcdFx0XCItLXNhZmUtYXJlYS1pbnNldC1sZWZ0XCI6IFwiZW52KHNhZmUtYXJlYS1pbnNldC1sZWZ0KVwiLFxuXHRcdH0sXG5cdFx0XCJodG1sLCBib2R5XCI6IHtcblx0XHRcdGhlaWdodDogXCIxMDAlXCIsXG5cdFx0XHRtYXJnaW46IDAsXG5cdFx0XHR3aWR0aDogXCIxMDAlXCIsXG5cdFx0fSxcblx0XHRodG1sOiB7XG5cdFx0XHRcIi13ZWJraXQtZm9udC1zbW9vdGhpbmdcIjogXCJzdWJwaXhlbC1hbnRpYWxpYXNlZFwiLFxuXHRcdH0sXG5cdFx0Ly8gZGVmaW5lIGZvbnQtc21vb3RoaW5nIGZvciBjc3MgYW5pbWF0aW9uIGluIHNhZmFyaVxuXHRcdGJvZHk6IHtcblx0XHRcdHBvc2l0aW9uOiBcImZpeGVkXCIsXG5cdFx0XHQvLyBGaXggYm9keSBmb3IgaU9TICYgU2FmYXJpXG5cdFx0XHQvLyBJdCBpcyBpbmxpbmVkIHRvIFwidHJhbnNwYXJlbnRcIiBpbiBIVE1MIHNvIHdlIGhhdmUgdG8gb3ZlcndyaXRlIGl0LlxuXHRcdFx0XCJiYWNrZ3JvdW5kLWNvbG9yXCI6IGAke3RoZW1lLmNvbnRlbnRfYmd9ICFpbXBvcnRhbnRgLFxuXHRcdH0sXG5cdFx0XCJidXR0b24sIHRleHRhcmVhXCI6IHtcblx0XHRcdHBhZGRpbmc6IDAsXG5cdFx0XHRcInRleHQtYWxpZ25cIjogXCJsZWZ0XCIsXG5cdFx0fSxcblx0XHRidXR0b246IHtcblx0XHRcdGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIiwgLy8gcmVtb3ZlcyBkZWZhdWx0IGJyb3dzZXIgc3R5bGUgZm9yIGJ1dHRvbnNcblx0XHR9LFxuXHRcdFwiYnV0dG9uOmRpc2FibGVkXCI6IHtcblx0XHRcdGN1cnNvcjogXCJkZWZhdWx0XCIsXG5cdFx0fSxcblx0XHRcImJvZHksIGJ1dHRvblwiOiB7XG5cdFx0XHQvLyBZZXMgd2UgaGF2ZSB0byB0ZWxsIGJ1dHRvbnMgc2VwYXJhdGVseSBiZWNhdXNlIGJyb3dzZXIgYnV0dG9uIHN0eWxlcyBvdmVycmlkZSBnZW5lcmFsIGJvZHkgb25lc1xuXHRcdFx0b3ZlcmZsb3c6IFwiaGlkZGVuXCIsXG5cdFx0XHQvLyBzZWU6IGh0dHBzOi8vd3d3LnNtYXNoaW5nbWFnYXppbmUuY29tLzIwMTUvMTEvdXNpbmctc3lzdGVtLXVpLWZvbnRzLXByYWN0aWNhbC1ndWlkZS8gYW5kIGdpdGh1YlxuXHRcdFx0XCJmb250LWZhbWlseVwiOiBnZXRGb250cygpLFxuXHRcdFx0XCJmb250LXNpemVcIjogcHgoc2l6ZS5mb250X3NpemVfYmFzZSksXG5cdFx0XHRcImxpbmUtaGVpZ2h0XCI6IHNpemUubGluZV9oZWlnaHQsXG5cdFx0XHRjb2xvcjogdGhlbWUuY29udGVudF9mZyxcblx0XHRcdFwiLXdlYmtpdC10ZXh0LXNpemUtYWRqdXN0XCI6IFwibm9uZVwiLCAvLyBmaXggZm9yIHNhZmFyaSBicm93c2VyXG5cdFx0fSxcblx0XHRcInNtYWxsLCAuc21hbGxcIjoge1xuXHRcdFx0XCJmb250LXNpemVcIjogcHgoc2l6ZS5mb250X3NpemVfc21hbGwpLFxuXHRcdH0sXG5cdFx0XCIuc21hbGxlclwiOiB7XG5cdFx0XHRcImZvbnQtc2l6ZVwiOiBweChzaXplLmZvbnRfc2l6ZV9zbWFsbGVyKSxcblx0XHR9LFxuXHRcdFwiLm5vcm1hbC1mb250LXNpemVcIjoge1xuXHRcdFx0XCJmb250LXNpemVcIjogcHgoc2l6ZS5mb250X3NpemVfYmFzZSksXG5cdFx0fSxcblx0XHRcIi5iXCI6IHtcblx0XHRcdFwiZm9udC13ZWlnaHRcIjogXCJib2xkXCIsXG5cdFx0fSxcblx0XHRcIi5mb250LXdlaWdodC02MDBcIjoge1xuXHRcdFx0XCJmb250LXdlaWdodFwiOiBcIjYwMFwiLFxuXHRcdH0sXG5cdFx0XCIuaVwiOiB7XG5cdFx0XHRcImZvbnQtc3R5bGVcIjogXCJpdGFsaWNcIixcblx0XHR9LFxuXHRcdFwiLmNsaWNrXCI6IHtcblx0XHRcdGN1cnNvcjogXCJwb2ludGVyXCIsXG5cdFx0XHRcIi13ZWJraXQtdGFwLWhpZ2hsaWdodC1jb2xvclwiOiBcInJnYmEoMjU1LCAyNTUsIDI1NSwgMClcIixcblx0XHR9LFxuXHRcdFwiLmNsaWNrLWRpc2FibGVkXCI6IHtcblx0XHRcdGN1cnNvcjogXCJkZWZhdWx0XCIsXG5cdFx0fSxcblx0XHRcIi50ZXh0XCI6IHtcblx0XHRcdGN1cnNvcjogXCJ0ZXh0XCIsXG5cdFx0fSxcblx0XHRcIi5vdmVyZmxvdy1oaWRkZW5cIjoge1xuXHRcdFx0b3ZlcmZsb3c6IFwiaGlkZGVuXCIsXG5cdFx0fSxcblx0XHRcIi5vdmVyZmxvdy14LWhpZGRlblwiOiB7XG5cdFx0XHRcIm92ZXJmbG93LXhcIjogXCJoaWRkZW5cIixcblx0XHR9LFxuXHRcdFwiLm92ZXJmbG93LXktaGlkZGVuXCI6IHtcblx0XHRcdFwib3ZlcmZsb3cteVwiOiBcImhpZGRlblwiLFxuXHRcdH0sXG5cdFx0XCIub3ZlcmZsb3cteS12aXNpYmxlXCI6IHtcblx0XHRcdFwib3ZlcmZsb3cteVwiOiBcInZpc2libGUgIWltcG9ydGFudFwiLFxuXHRcdH0sXG5cdFx0XCIub3ZlcmZsb3cteS1zY3JvbGxcIjoge1xuXHRcdFx0XCJvdmVyZmxvdy15XCI6IFwic2Nyb2xsXCIsXG5cdFx0XHRcIndlYmtpdC1vdmVyZmxvdy1zY3JvbGxpbmdcIjogXCJ0b3VjaFwiLFxuXHRcdH0sXG5cdFx0XCIub3ZlcmZsb3ctdmlzaWJsZVwiOiB7XG5cdFx0XHRvdmVyZmxvdzogXCJ2aXNpYmxlXCIsXG5cdFx0fSxcblx0XHRcImgxLCBoMiwgaDMsIGg0LCBoNSwgaDZcIjoge1xuXHRcdFx0bWFyZ2luOiAwLFxuXHRcdFx0XCJmb250LXdlaWdodFwiOiBcIm5vcm1hbFwiLFxuXHRcdH0sXG5cdFx0XCJoMSwgLmgxXCI6IHtcblx0XHRcdFwiZm9udC1zaXplXCI6IHB4KHNpemUuZm9udF9zaXplX2Jhc2UgKiAyKSxcblx0XHR9LFxuXHRcdFwiaDIsIC5oMlwiOiB7XG5cdFx0XHRcImZvbnQtc2l6ZVwiOiBweChzaXplLmZvbnRfc2l6ZV9iYXNlICogMS44KSxcblx0XHR9LFxuXHRcdFwiaDMsIC5oM1wiOiB7XG5cdFx0XHRcImZvbnQtc2l6ZVwiOiBweChzaXplLmZvbnRfc2l6ZV9iYXNlICogMS42KSxcblx0XHR9LFxuXHRcdFwiaDQsIC5oNFwiOiB7XG5cdFx0XHRcImZvbnQtc2l6ZVwiOiBweChzaXplLmZvbnRfc2l6ZV9iYXNlICogMS40KSxcblx0XHR9LFxuXHRcdFwiaDUsIC5oNVwiOiB7XG5cdFx0XHRcImZvbnQtc2l6ZVwiOiBweChzaXplLmZvbnRfc2l6ZV9iYXNlICogMS4yKSxcblx0XHR9LFxuXHRcdFwiaDYsIC5oNlwiOiB7XG5cdFx0XHRcImZvbnQtc2l6ZVwiOiBweChzaXplLmZvbnRfc2l6ZV9iYXNlICogMS4xKSxcblx0XHR9LFxuXHRcdFwiaW5wdXQsIGJ1dHRvbiwgc2VsZWN0LCB0ZXh0YXJlYVwiOiB7XG5cdFx0XHRcImZvbnQtZmFtaWx5XCI6IFwiaW5oZXJpdFwiLFxuXHRcdFx0XCJmb250LXNpemVcIjogXCJpbmhlcml0XCIsXG5cdFx0XHRcImxpbmUtaGVpZ2h0XCI6IFwiaW5oZXJpdFwiLFxuXHRcdH0sXG5cdFx0XCIuaHJcIjoge1xuXHRcdFx0bWFyZ2luOiAwLFxuXHRcdFx0Ym9yZGVyOiBcIm5vbmVcIixcblx0XHRcdGhlaWdodDogXCIxcHhcIixcblx0XHRcdFwiYmFja2dyb3VuZC1jb2xvclwiOiB0aGVtZS5saXN0X2JvcmRlcixcblx0XHR9LFxuXHRcdFwiLmJvcmRlclwiOiB7XG5cdFx0XHRib3JkZXI6IGAxcHggc29saWQgJHt0aGVtZS5jb250ZW50X2JvcmRlcn1gLFxuXHRcdH0sXG5cdFx0XCIuYm9yZGVyLXRvcFwiOiB7XG5cdFx0XHRcImJvcmRlci10b3BcIjogYDFweCBzb2xpZCAke3RoZW1lLmNvbnRlbnRfYm9yZGVyfWAsXG5cdFx0fSxcblx0XHRcIiNtYWlsLWJvZHkuYnJlYWstcHJlIHByZVwiOiB7XG5cdFx0XHRcIndoaXRlLXNwYWNlXCI6IFwicHJlLXdyYXBcIixcblx0XHRcdFwid29yZC1icmVha1wiOiBcIm5vcm1hbFwiLFxuXHRcdFx0XCJvdmVyZmxvdy13cmFwXCI6IFwiYW55d2hlcmVcIixcblx0XHR9LFxuXHRcdFwiLndoaXRlLXNwYWNlLXByZVwiOiB7XG5cdFx0XHRcIndoaXRlLXNwYWNlXCI6IFwicHJlXCIsXG5cdFx0fSxcblx0XHRcIi5taW4tY29udGVudFwiOiB7XG5cdFx0XHR3aWR0aDogXCJtaW4tY29udGVudFwiLFxuXHRcdFx0aGVpZ2h0OiBcIm1pbi1jb250ZW50XCIsXG5cdFx0fSxcblx0XHRcIi53aWR0aC1taW4tY29udGVudFwiOiB7XG5cdFx0XHR3aWR0aDogXCJtaW4tY29udGVudFwiLFxuXHRcdH0sXG5cdFx0Ly8gbWFyZ2luc1xuXHRcdFwiLm0tMFwiOiB7XG5cdFx0XHRtYXJnaW46IDAsXG5cdFx0fSxcblx0XHRcIi5tdFwiOiB7XG5cdFx0XHRcIm1hcmdpbi10b3BcIjogcHgoc2l6ZS52cGFkKSxcblx0XHR9LFxuXHRcdFwiLm10LXhzXCI6IHtcblx0XHRcdFwibWFyZ2luLXRvcFwiOiBweChzaXplLnZwYWRfeHMpLFxuXHRcdH0sXG5cdFx0XCIubXQteHhzXCI6IHtcblx0XHRcdFwibWFyZ2luLXRvcFwiOiBweCgyKSxcblx0XHR9LFxuXHRcdFwiLm10LXNcIjoge1xuXHRcdFx0XCJtYXJnaW4tdG9wXCI6IHB4KHNpemUudnBhZF9zbWFsbCksXG5cdFx0fSxcblx0XHRcIi5tdC1tXCI6IHtcblx0XHRcdFwibWFyZ2luLXRvcFwiOiBweChzaXplLmhwYWQpLFxuXHRcdH0sXG5cdFx0XCIubXQtbFwiOiB7XG5cdFx0XHRcIm1hcmdpbi10b3BcIjogcHgoc2l6ZS52cGFkX2xhcmdlKSxcblx0XHR9LFxuXHRcdFwiLm10LXhsXCI6IHtcblx0XHRcdFwibWFyZ2luLXRvcFwiOiBweChzaXplLnZwYWRfeGwpLFxuXHRcdH0sXG5cdFx0XCIubXQtZm9ybVwiOiB7XG5cdFx0XHRcIm1hcmdpbi10b3BcIjogcHgoc2l6ZS5ocGFkX21lZGl1bSksXG5cdFx0fSxcblx0XHRcIi5tYi0wXCI6IHtcblx0XHRcdFwibWFyZ2luLWJvdHRvbVwiOiAwLFxuXHRcdH0sXG5cdFx0XCIubWJcIjoge1xuXHRcdFx0XCJtYXJnaW4tYm90dG9tXCI6IHB4KHNpemUudnBhZCksXG5cdFx0fSxcblx0XHRcIi5tYi1zXCI6IHtcblx0XHRcdFwibWFyZ2luLWJvdHRvbVwiOiBweChzaXplLnZwYWRfc21hbGwpLFxuXHRcdH0sXG5cdFx0XCIubWIteHNcIjoge1xuXHRcdFx0XCJtYXJnaW4tYm90dG9tXCI6IHB4KHNpemUudnBhZF94cyksXG5cdFx0fSxcblx0XHRcIi5tYi1sXCI6IHtcblx0XHRcdFwibWFyZ2luLWJvdHRvbVwiOiBweChzaXplLnZwYWRfbGFyZ2UpLFxuXHRcdH0sXG5cdFx0XCIubWIteGxcIjoge1xuXHRcdFx0XCJtYXJnaW4tYm90dG9tXCI6IHB4KHNpemUudnBhZF94bCksXG5cdFx0fSxcblx0XHRcIi5tYi14eGxcIjoge1xuXHRcdFx0XCJtYXJnaW4tYm90dG9tXCI6IHB4KHNpemUudnBhZF94eGwpLFxuXHRcdH0sXG5cdFx0XCIubWxyXCI6IHtcblx0XHRcdFwibWFyZ2luLWxlZnRcIjogcHgoc2l6ZS5ocGFkKSxcblx0XHRcdFwibWFyZ2luLXJpZ2h0XCI6IHB4KHNpemUuaHBhZCksXG5cdFx0fSxcblx0XHRcIi5tbHItYnV0dG9uXCI6IHtcblx0XHRcdFwibWFyZ2luLWxlZnRcIjogcHgoc2l6ZS5ocGFkX2J1dHRvbiksXG5cdFx0XHRcIm1hcmdpbi1yaWdodFwiOiBweChzaXplLmhwYWRfYnV0dG9uKSxcblx0XHR9LFxuXHRcdFwiLm1sci1sXCI6IHtcblx0XHRcdFwibWFyZ2luLWxlZnRcIjogcHgoc2l6ZS5ocGFkX2xhcmdlKSxcblx0XHRcdFwibWFyZ2luLXJpZ2h0XCI6IHB4KHNpemUuaHBhZF9sYXJnZSksXG5cdFx0fSxcblx0XHRcIi5tci1zXCI6IHtcblx0XHRcdFwibWFyZ2luLXJpZ2h0XCI6IHB4KHNpemUudnBhZF9zbWFsbCksXG5cdFx0fSxcblx0XHRcIi5tci14c1wiOiB7XG5cdFx0XHRcIm1hcmdpbi1yaWdodFwiOiBweChzaXplLnZwYWRfeHMpLFxuXHRcdH0sXG5cdFx0XCIubWwtc1wiOiB7XG5cdFx0XHRcIm1hcmdpbi1sZWZ0XCI6IHB4KHNpemUudnBhZF9zbWFsbCksXG5cdFx0fSxcblx0XHRcIi5tbC1tXCI6IHtcblx0XHRcdFwibWFyZ2luLWxlZnRcIjogcHgoc2l6ZS5ocGFkX21lZGl1bSksXG5cdFx0fSxcblx0XHRcIi5tbC1sXCI6IHtcblx0XHRcdFwibWFyZ2luLWxlZnRcIjogcHgoc2l6ZS5ocGFkX2xhcmdlKSxcblx0XHR9LFxuXHRcdFwiLm1yLW1cIjoge1xuXHRcdFx0XCJtYXJnaW4tcmlnaHRcIjogcHgoc2l6ZS5ocGFkX21lZGl1bSksXG5cdFx0fSxcblx0XHRcIi5tci1sXCI6IHtcblx0XHRcdFwibWFyZ2luLXJpZ2h0XCI6IHB4KHNpemUuaHBhZF9sYXJnZSksXG5cdFx0fSxcblx0XHRcIi5tbHItc1wiOiB7XG5cdFx0XHRcIm1hcmdpbi1sZWZ0XCI6IHB4KHNpemUuaHBhZF9zbWFsbCksXG5cdFx0XHRcIm1hcmdpbi1yaWdodFwiOiBweChzaXplLmhwYWRfc21hbGwpLFxuXHRcdH0sXG5cdFx0XCIubWxyLXhzXCI6IHtcblx0XHRcdFwibWFyZ2luLWxlZnRcIjogcHgoc2l6ZS52cGFkX3hzKSxcblx0XHRcdFwibWFyZ2luLXJpZ2h0XCI6IHB4KHNpemUudnBhZF94cyksXG5cdFx0fSxcblx0XHRcIi5tbC1ocGFkX3NtYWxsXCI6IHtcblx0XHRcdFwibWFyZ2luLWxlZnRcIjogcHgoc2l6ZS5ocGFkX3NtYWxsKSxcblx0XHR9LFxuXHRcdFwiLm1yLWhwYWQtc21hbGxcIjoge1xuXHRcdFx0XCJtYXJnaW4tcmlnaHRcIjogcHgoc2l6ZS5ocGFkX3NtYWxsKSxcblx0XHR9LFxuXHRcdFwiLm10Yi0wXCI6IHtcblx0XHRcdFwibWFyZ2luLXRvcFwiOiBweCgwKSxcblx0XHRcdFwibWFyZ2luLWJvdHRvbVwiOiBweCgwKSxcblx0XHR9LFxuXHRcdFwiLm1yXCI6IHtcblx0XHRcdFwibWFyZ2luLXJpZ2h0XCI6IHB4KHNpemUuaHBhZCksXG5cdFx0fSxcblx0XHRcIi5tbFwiOiB7XG5cdFx0XHRcIm1hcmdpbi1sZWZ0XCI6IHB4KHNpemUuaHBhZCksXG5cdFx0fSxcblx0XHQvLyBwYWRkaW5nc1xuXHRcdFwiLnAwXCI6IHtcblx0XHRcdHBhZGRpbmc6IFwiMFwiLFxuXHRcdH0sXG5cdFx0XCIucHRcIjoge1xuXHRcdFx0XCJwYWRkaW5nLXRvcFwiOiBweChzaXplLnZwYWQpLFxuXHRcdH0sXG5cdFx0XCIucHQtMFwiOiB7XG5cdFx0XHRcInBhZGRpbmctdG9wXCI6IDAsXG5cdFx0fSxcblx0XHRcIi5wdC1zXCI6IHtcblx0XHRcdFwicGFkZGluZy10b3BcIjogcHgoc2l6ZS52cGFkX3NtYWxsKSxcblx0XHR9LFxuXHRcdFwiLnB0LWxcIjoge1xuXHRcdFx0XCJwYWRkaW5nLXRvcFwiOiBweChzaXplLnZwYWRfbGFyZ2UpLFxuXHRcdH0sXG5cdFx0XCIucHQtbVwiOiB7XG5cdFx0XHRcInBhZGRpbmctdG9wXCI6IHB4KHNpemUuaHBhZCksXG5cdFx0fSxcblx0XHRcIi5wdC1tbFwiOiB7XG5cdFx0XHRcInBhZGRpbmctdG9wXCI6IHB4KHNpemUudnBhZF9tbCksXG5cdFx0fSxcblx0XHRcIi5wdC14bFwiOiB7XG5cdFx0XHRcInBhZGRpbmctdG9wXCI6IHB4KHNpemUudnBhZF94bCksXG5cdFx0fSxcblx0XHRcIi5wdC14c1wiOiB7XG5cdFx0XHRcInBhZGRpbmctdG9wXCI6IHB4KHNpemUudnBhZF94cyksXG5cdFx0fSxcblx0XHRcIi5wYi0wXCI6IHtcblx0XHRcdFwicGFkZGluZy1ib3R0b21cIjogMCxcblx0XHR9LFxuXHRcdFwiLnBiXCI6IHtcblx0XHRcdFwicGFkZGluZy1ib3R0b21cIjogcHgoc2l6ZS52cGFkKSxcblx0XHR9LFxuXHRcdFwiLnBiLTJcIjoge1xuXHRcdFx0XCJwYWRkaW5nLWJvdHRvbVwiOiBcIjJweFwiLFxuXHRcdH0sXG5cdFx0Ly8gZm9yIGRyb3Bkb3duIHRvZ2dsZXNcblx0XHRcIi5wYi1zXCI6IHtcblx0XHRcdFwicGFkZGluZy1ib3R0b21cIjogcHgoc2l6ZS52cGFkX3NtYWxsKSxcblx0XHR9LFxuXHRcdFwiLmRyYWdcIjoge1xuXHRcdFx0XCJ0b3VjaC1hY3Rpb25cIjogXCJhdXRvXCIsXG5cdFx0fSxcblx0XHRcIi5wYi14c1wiOiB7XG5cdFx0XHRcInBhZGRpbmctYm90dG9tXCI6IHB4KHNpemUudnBhZF94cyksXG5cdFx0fSxcblx0XHRcIi5wYi1sXCI6IHtcblx0XHRcdFwicGFkZGluZy1ib3R0b21cIjogcHgoc2l6ZS52cGFkX2xhcmdlKSxcblx0XHR9LFxuXHRcdFwiLnBiLXhsXCI6IHtcblx0XHRcdFwicGFkZGluZy1ib3R0b21cIjogcHgoc2l6ZS52cGFkX3hsKSxcblx0XHR9LFxuXHRcdFwiLnBiLW1cIjoge1xuXHRcdFx0XCJwYWRkaW5nLWJvdHRvbVwiOiBweChzaXplLmhwYWQpLFxuXHRcdH0sXG5cdFx0XCIucGItbWxcIjoge1xuXHRcdFx0XCJwYWRkaW5nLWJvdHRvbVwiOiBweChzaXplLnZwYWRfbWwpLFxuXHRcdH0sXG5cdFx0XCIucGItZmxvYXRpbmdcIjoge1xuXHRcdFx0XCJwYWRkaW5nLWJvdHRvbVwiOiBweChzaXplLmJ1dHRvbl9mbG9hdGluZ19zaXplICsgc2l6ZS5ocGFkX2xhcmdlKSxcblx0XHR9LFxuXHRcdC8vIGFsbG93IHNjcm9sbGluZyBhY3Jvc3MgdGhlIGZsb2F0aW5nIGJ1dHRvblxuXHRcdFwiLnBsclwiOiB7XG5cdFx0XHRcInBhZGRpbmctbGVmdFwiOiBweChzaXplLmhwYWQpLFxuXHRcdFx0XCJwYWRkaW5nLXJpZ2h0XCI6IHB4KHNpemUuaHBhZCksXG5cdFx0fSxcblx0XHRcIi5wbFwiOiB7XG5cdFx0XHRcInBhZGRpbmctbGVmdFwiOiBweChzaXplLmhwYWQpLFxuXHRcdH0sXG5cdFx0XCIucGwtc1wiOiB7XG5cdFx0XHRcInBhZGRpbmctbGVmdFwiOiBweChzaXplLmhwYWRfc21hbGwpLFxuXHRcdH0sXG5cdFx0XCIucGwtbVwiOiB7XG5cdFx0XHRcInBhZGRpbmctbGVmdFwiOiBweChzaXplLmhwYWQpLFxuXHRcdH0sXG5cdFx0XCIucGwteHNcIjoge1xuXHRcdFx0XCJwYWRkaW5nLWxlZnRcIjogcHgoc2l6ZS52cGFkX3hzKSxcblx0XHR9LFxuXHRcdFwiLnBsLXZwYWQtbVwiOiB7XG5cdFx0XHRcInBhZGRpbmctbGVmdFwiOiBweChzaXplLnZwYWQpLFxuXHRcdH0sXG5cdFx0XCIucGwtdnBhZC1zXCI6IHtcblx0XHRcdFwicGFkZGluZy1sZWZ0XCI6IHB4KHNpemUudnBhZF9zbWFsbCksXG5cdFx0fSxcblx0XHRcIi5wbC12cGFkLWxcIjoge1xuXHRcdFx0XCJwYWRkaW5nLWxlZnRcIjogcHgoc2l6ZS52cGFkX2xhcmdlKSxcblx0XHR9LFxuXHRcdFwiLnByXCI6IHtcblx0XHRcdFwicGFkZGluZy1yaWdodFwiOiBweChzaXplLmhwYWQpLFxuXHRcdH0sXG5cdFx0XCIucHItc1wiOiB7XG5cdFx0XHRcInBhZGRpbmctcmlnaHRcIjogcHgoc2l6ZS5ocGFkX3NtYWxsKSxcblx0XHR9LFxuXHRcdFwiLnByLXZwYWQtc1wiOiB7XG5cdFx0XHRcInBhZGRpbmctcmlnaHRcIjogcHgoc2l6ZS52cGFkX3NtYWxsKSxcblx0XHR9LFxuXHRcdFwiLnByLW1cIjoge1xuXHRcdFx0XCJwYWRkaW5nLXJpZ2h0XCI6IHB4KHNpemUudnBhZCksXG5cdFx0fSxcblx0XHRcIi5wbHItc1wiOiB7XG5cdFx0XHRcInBhZGRpbmctbGVmdFwiOiBweChzaXplLmhwYWRfc21hbGwpLFxuXHRcdFx0XCJwYWRkaW5nLXJpZ2h0XCI6IHB4KHNpemUuaHBhZF9zbWFsbCksXG5cdFx0fSxcblx0XHRcIi5wbHItbVwiOiB7XG5cdFx0XHRcInBhZGRpbmctbGVmdFwiOiBweChzaXplLmhwYWQpLFxuXHRcdFx0XCJwYWRkaW5nLXJpZ2h0XCI6IHB4KHNpemUuaHBhZCksXG5cdFx0fSxcblx0XHQvLyBwLWwgd2lsbCBiZSBvdmVyd3JpdHRlbiBpbiBtZWRpYSBxdWVyeSBtb2JpbGVcblx0XHRcIi5wbHItbFwiOiB7XG5cdFx0XHRcInBhZGRpbmctbGVmdFwiOiBweChzaXplLmhwYWRfbGFyZ2UpLFxuXHRcdFx0XCJwYWRkaW5nLXJpZ2h0XCI6IHB4KHNpemUuaHBhZF9sYXJnZSksXG5cdFx0fSxcblx0XHRcIi5wbHItMmxcIjoge1xuXHRcdFx0XCJwYWRkaW5nLWxlZnRcIjogcHgoc2l6ZS5ocGFkX2xhcmdlICogMiksXG5cdFx0XHRcInBhZGRpbmctcmlnaHRcIjogcHgoc2l6ZS5ocGFkX2xhcmdlICogMiksXG5cdFx0fSxcblx0XHRcIi5wbC1sXCI6IHtcblx0XHRcdFwicGFkZGluZy1sZWZ0XCI6IHB4KHNpemUuaHBhZF9sYXJnZSksXG5cdFx0fSxcblx0XHRcIi5wci1sXCI6IHtcblx0XHRcdFwicGFkZGluZy1yaWdodFwiOiBweChzaXplLmhwYWRfbGFyZ2UpLFxuXHRcdH0sXG5cdFx0XCIucGxyLWJ1dHRvblwiOiB7XG5cdFx0XHRcInBhZGRpbmctbGVmdFwiOiBweChzaXplLmhwYWRfYnV0dG9uKSxcblx0XHRcdFwicGFkZGluZy1yaWdodFwiOiBweChzaXplLmhwYWRfYnV0dG9uKSxcblx0XHR9LFxuXHRcdFwiLnBsci1idXR0b24tZG91YmxlXCI6IHtcblx0XHRcdFwicGFkZGluZy1sZWZ0XCI6IHB4KHNpemUuaHBhZF9idXR0b24gKiAyKSxcblx0XHRcdFwicGFkZGluZy1yaWdodFwiOiBweChzaXplLmhwYWRfYnV0dG9uICogMiksXG5cdFx0fSxcblx0XHRcIi5wbHItbmF2LWJ1dHRvblwiOiB7XG5cdFx0XHRcInBhZGRpbmctbGVmdFwiOiBweChzaXplLmhwYWRfbmF2X2J1dHRvbiksXG5cdFx0XHRcInBhZGRpbmctcmlnaHRcIjogcHgoc2l6ZS5ocGFkX25hdl9idXR0b24pLFxuXHRcdH0sXG5cdFx0XCIucGwtYnV0dG9uXCI6IHtcblx0XHRcdFwicGFkZGluZy1sZWZ0XCI6IHB4KHNpemUuaHBhZF9idXR0b24pLFxuXHRcdH0sXG5cdFx0XCIubXItYnV0dG9uXCI6IHtcblx0XHRcdFwibWFyZ2luLXJpZ2h0XCI6IHB4KHNpemUuaHBhZF9idXR0b24pLFxuXHRcdH0sXG5cdFx0XCIubWwtYnV0dG9uXCI6IHtcblx0XHRcdFwibWFyZ2luLWxlZnRcIjogcHgoc2l6ZS5ocGFkX2J1dHRvbiksXG5cdFx0fSxcblx0XHRcIi5tdC1uZWdhdGl2ZS1ocGFkLWJ1dHRvblwiOiB7XG5cdFx0XHRcIm1hcmdpbi10b3BcIjogcHgoLXNpemUuaHBhZF9idXR0b24pLFxuXHRcdH0sXG5cdFx0XCIubXQtbmVnYXRpdmUtc1wiOiB7XG5cdFx0XHRcIm1hcmdpbi10b3BcIjogcHgoLXNpemUudnBhZF9zbWFsbCksXG5cdFx0fSxcblx0XHRcIi5tdC1uZWdhdGl2ZS1tXCI6IHtcblx0XHRcdFwibWFyZ2luLXRvcFwiOiBweCgtc2l6ZS52cGFkKSxcblx0XHR9LFxuXHRcdFwiLm10LW5lZ2F0aXZlLWxcIjoge1xuXHRcdFx0XCJtYXJnaW4tdG9wXCI6IHB4KC1zaXplLmhwYWRfbGFyZ2UpLFxuXHRcdH0sXG5cdFx0XCIubXItbmVnYXRpdmUtc1wiOiB7XG5cdFx0XHRcIm1hcmdpbi1yaWdodFwiOiBweCgtc2l6ZS5ocGFkX2J1dHRvbiksXG5cdFx0fSxcblx0XHRcIi5tci1uZWdhdGl2ZS1sXCI6IHtcblx0XHRcdFwibWFyZ2luLXJpZ2h0XCI6IHB4KC1zaXplLmhwYWRfbGFyZ2UpLFxuXHRcdH0sXG5cdFx0XCIubWwtbmVnYXRpdmUtc1wiOiB7XG5cdFx0XHRcIm1hcmdpbi1sZWZ0XCI6IHB4KC1zaXplLmhwYWRfYnV0dG9uKSxcblx0XHR9LFxuXHRcdC8vIG5lZ2F0aXZlIG1hcmdpbiB0byBoYW5kbGUgdGhlIGRlZmF1bHQgcGFkZGluZyBvZiBhIGJ1dHRvblxuXHRcdFwiLm1sLW5lZ2F0aXZlLWxcIjoge1xuXHRcdFx0XCJtYXJnaW4tbGVmdFwiOiBweCgtc2l6ZS5ocGFkX2xhcmdlKSxcblx0XHR9LFxuXHRcdFwiLm1sLW5lZ2F0aXZlLXhzXCI6IHtcblx0XHRcdFwibWFyZ2luLWxlZnRcIjogcHgoLTMpLFxuXHRcdH0sXG5cdFx0XCIubWwtbmVnYXRpdmUtYnViYmxlXCI6IHtcblx0XHRcdFwibWFyZ2luLWxlZnRcIjogcHgoLTcpLFxuXHRcdH0sXG5cdFx0XCIubXItbmVnYXRpdmUtbVwiOiB7XG5cdFx0XHRcIm1hcmdpbi1yaWdodFwiOiBweCgtKHNpemUuaHBhZF9idXR0b24gKyBzaXplLmhwYWRfbmF2X2J1dHRvbikpLFxuXHRcdH0sXG5cdFx0Ly8gbmVnYXRpdmUgbWFyZ2luIHRvIGhhbmRsZSB0aGUgcGFkZGluZyBvZiBhIG5hdiBidXR0b25cblx0XHRcIi5maXhlZC1ib3R0b20tcmlnaHRcIjoge1xuXHRcdFx0cG9zaXRpb246IFwiZml4ZWRcIixcblx0XHRcdGJvdHRvbTogcHgoc2l6ZS5ocGFkKSxcblx0XHRcdHJpZ2h0OiBweChzaXplLmhwYWRfbGFyZ2UpLFxuXHRcdH0sXG5cdFx0XCIubXItbmVnYXRpdmUteHNcIjoge1xuXHRcdFx0XCJtYXJnaW4tcmlnaHRcIjogcHgoLTMpLFxuXHRcdH0sXG5cdFx0Ly8gY29tbW9uIHNldHRpbmdcblx0XHRcIi50ZXh0LWVsbGlwc2lzXCI6IHtcblx0XHRcdG92ZXJmbG93OiBcImhpZGRlblwiLFxuXHRcdFx0XCJ0ZXh0LW92ZXJmbG93XCI6IFwiZWxsaXBzaXNcIixcblx0XHRcdFwibWluLXdpZHRoXCI6IDAsXG5cdFx0XHRcIndoaXRlLXNwYWNlXCI6IFwibm93cmFwXCIsXG5cdFx0fSxcblx0XHRcIi50ZXh0LWVsbGlwc2lzLW11bHRpLWxpbmVcIjoge1xuXHRcdFx0Lypcblx0XHRcdCAqIFRoZSBgLXdlYmtpdC1saW5lLWNsYW1wYCBwcm9wZXJ0eSBpcyBzdGFuZGFyZGl6ZWQgYW5kIHN1cHBvcnRlZCBieSBhbGwgbWFqb3IgYnJvd3NlcnMuXG5cdFx0XHQgKiBJdCB3aWxsIGxpa2VseSBiZSByZXBsYWNlZCBieSBhIHByb3BlcnR5IGNhbGxlZCBgbGluZS1jbGFtcGAgaW4gdGhlIGZ1dHVyZS5cblx0XHRcdCAqIFNlZTogaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQ1NTLy13ZWJraXQtbGluZS1jbGFtcFxuXHRcdFx0ICovXG5cdFx0XHRkaXNwbGF5OiBcIi13ZWJraXQtYm94XCIsXG5cdFx0XHRcIi13ZWJraXQtbGluZS1jbGFtcFwiOiAzLFxuXHRcdFx0XCItd2Via2l0LWJveC1vcmllbnRcIjogXCJ2ZXJ0aWNhbFwiLFxuXHRcdFx0b3ZlcmZsb3c6IFwiIGhpZGRlblwiLFxuXHRcdFx0XCJ0ZXh0LW92ZXJmbG93XCI6IFwiZWxsaXBzaXNcIixcblx0XHR9LFxuXHRcdFwiLnRleHQtY2xpcFwiOiB7XG5cdFx0XHRvdmVyZmxvdzogXCJoaWRkZW5cIixcblx0XHRcdFwidGV4dC1vdmVyZmxvd1wiOiBcImNsaXBcIixcblx0XHRcdFwibWluLXdpZHRoXCI6IDAsXG5cdFx0XHRcIndoaXRlLXNwYWNlXCI6IFwibm93cmFwXCIsXG5cdFx0fSxcblx0XHRcIi5taW4td2lkdGgtMFwiOiB7XG5cdFx0XHRcIm1pbi13aWR0aFwiOiAwLFxuXHRcdH0sXG5cdFx0XCIubWluLXdpZHRoLWZ1bGxcIjoge1xuXHRcdFx0XCJtaW4td2lkdGhcIjogXCIxMDAlXCIsXG5cdFx0fSxcblx0XHQvLyB1c2VkIHRvIGVuYWJsZSB0ZXh0IGVsbGlwc2lzIGluIGZsZXggY2hpbGQgZWxlbWVudHMgc2VlIGh0dHBzOi8vY3NzLXRyaWNrcy5jb20vZmxleGJveC10cnVuY2F0ZWQtdGV4dC9cblx0XHRcIi50ZXh0LWJyZWFrXCI6IHtcblx0XHRcdG92ZXJmbG93OiBcImhpZGRlblwiLFxuXHRcdFx0XCJ3b3JkLWJyZWFrXCI6IFwibm9ybWFsXCIsXG5cdFx0XHRcIm92ZXJmbG93LXdyYXBcIjogXCJhbnl3aGVyZVwiLFxuXHRcdH0sXG5cdFx0XCIuYnJlYWstd29yZFwiOiB7XG5cdFx0XHRcIndvcmQtYnJlYWtcIjogXCJub3JtYWxcIixcblx0XHRcdFwib3ZlcmZsb3ctd3JhcFwiOiBcImJyZWFrLXdvcmRcIixcblx0XHRcdGh5cGhlbnM6IFwiYXV0b1wiLFxuXHRcdH0sXG5cdFx0XCIuYnJlYWstYWxsXCI6IHtcblx0XHRcdFwid29yZC1icmVha1wiOiBcImJyZWFrLWFsbFwiLFxuXHRcdH0sXG5cdFx0XCIuYnJlYWstd29yZC1saW5rcyBhXCI6IHtcblx0XHRcdFwib3ZlcmZsb3ctd3JhcFwiOiBcImFueXdoZXJlXCIsXG5cdFx0fSxcblx0XHRcIi50ZXh0LXByZXdyYXBcIjoge1xuXHRcdFx0XCJ3aGl0ZS1zcGFjZVwiOiBcInByZS13cmFwXCIsXG5cdFx0fSxcblx0XHRcIi50ZXh0LXByZWxpbmVcIjoge1xuXHRcdFx0XCJ3aGl0ZS1zcGFjZVwiOiBcInByZS1saW5lXCIsXG5cdFx0fSxcblx0XHRcIi50ZXh0LXByZVwiOiB7XG5cdFx0XHRcIndoaXRlLXNwYWNlXCI6IFwicHJlXCIsXG5cdFx0fSxcblx0XHRcIi51cHBlcmNhc2VcIjoge1xuXHRcdFx0XCJ0ZXh0LXRyYW5zZm9ybVwiOiBcInVwcGVyY2FzZVwiLFxuXHRcdH0sXG5cdFx0XCIubGluZS1icmVhay1hbnl3aGVyZVwiOiB7XG5cdFx0XHRcImxpbmUtYnJlYWtcIjogXCJhbnl3aGVyZVwiLFxuXHRcdH0sXG5cdFx0XCIuejFcIjoge1xuXHRcdFx0XCJ6LWluZGV4XCI6IFwiMVwiLFxuXHRcdH0sXG5cdFx0XCIuejJcIjoge1xuXHRcdFx0XCJ6LWluZGV4XCI6IFwiMlwiLFxuXHRcdH0sXG5cdFx0XCIuejNcIjoge1xuXHRcdFx0XCJ6LWluZGV4XCI6IFwiM1wiLFxuXHRcdH0sXG5cdFx0XCIuejRcIjoge1xuXHRcdFx0XCJ6LWluZGV4XCI6IFwiNFwiLFxuXHRcdH0sXG5cdFx0XCIubm9zZWxlY3RcIjogbm9zZWxlY3QsXG5cdFx0XCIubm8td3JhcFwiOiB7XG5cdFx0XHRcIndoaXRlLXNwYWNlXCI6IFwibm93cmFwXCIsXG5cdFx0fSxcblx0XHRcIi5oZWlnaHQtMTAwcFwiOiB7XG5cdFx0XHRoZWlnaHQ6IFwiMTAwJVwiLFxuXHRcdH0sXG5cdFx0XCIudmlldy1jb2x1bW5zXCI6IHtcblx0XHRcdG92ZXJmbG93OiBcImhpZGRlblwiLFxuXHRcdH0sXG5cdFx0XCIudmlldy1jb2x1bW5cIjoge1xuXHRcdFx0XCJ3aWxsLWNoYW5nZVwiOiBcInRyYW5zZm9ybVwiLFxuXHRcdH0sXG5cdFx0XCIud2lsbC1jaGFuZ2UtYWxwaGFcIjoge1xuXHRcdFx0XCJ3aWxsLWNoYW5nZVwiOiBcImFscGhhXCIsXG5cdFx0fSxcblx0XHQvLyBib3JkZXJzXG5cdFx0XCIuYm9yZGVyLWJvdHRvbVwiOiB7XG5cdFx0XHRcImJvcmRlci1ib3R0b21cIjogYDFweCBzb2xpZCAke3RoZW1lLmNvbnRlbnRfYm9yZGVyfWAsXG5cdFx0fSxcblx0XHRcIi5ib3JkZXItbGVmdFwiOiB7XG5cdFx0XHRcImJvcmRlci1sZWZ0XCI6IGAxcHggc29saWQgJHt0aGVtZS5jb250ZW50X2JvcmRlcn1gLFxuXHRcdH0sXG5cdFx0Ly8gY29sb3JzXG5cdFx0XCIuYmctdHJhbnNwYXJlbnRcIjoge1xuXHRcdFx0XCJiYWNrZ3JvdW5kLWNvbG9yXCI6IFwidHJhbnNwYXJlbnRcIixcblx0XHR9LFxuXHRcdFwiLmJnLXdoaXRlXCI6IHtcblx0XHRcdFwiYmFja2dyb3VuZC1jb2xvclwiOiBcIndoaXRlXCIsXG5cdFx0fSxcblx0XHRcIi5iZy1maXgtcXVvdGVkIGJsb2NrcXVvdGUudHV0YW5vdGFfcXVvdGVcIjoge1xuXHRcdFx0XCJiYWNrZ3JvdW5kLWNvbG9yXCI6IFwid2hpdGVcIixcblx0XHRcdGNvbG9yOiBcImJsYWNrXCIsXG5cdFx0XHQvLyBtYWtlIHRoZSBib3JkZXIgdGhpY2tlciBzbyBpdCBpcyBlYXNpZXIgdG8gc2VlXG5cdFx0XHRcImJvcmRlci13aWR0aFwiOiBcIjRweFwiLFxuXHRcdH0sXG5cdFx0XCIuY29udGVudC1ibGFja1wiOiB7XG5cdFx0XHRjb2xvcjogXCJibGFja1wiLFxuXHRcdH0sXG5cdFx0XCIuY29udGVudC1mZ1wiOiB7XG5cdFx0XHRjb2xvcjogdGhlbWUuY29udGVudF9mZyxcblx0XHR9LFxuXHRcdFwiLmNvbnRlbnQtYWNjZW50LWZnXCI6IHtcblx0XHRcdGNvbG9yOiB0aGVtZS5jb250ZW50X2FjY2VudCxcblx0XHR9LFxuXHRcdFwiLmNvbnRlbnQtYWNjZW50LWFjY2VudFwiOiB7XG5cdFx0XHRcImFjY2VudC1jb2xvclwiOiB0aGVtZS5jb250ZW50X2FjY2VudCxcblx0XHR9LFxuXHRcdFwiLmljb24tYWNjZW50IHN2Z1wiOiB7XG5cdFx0XHRmaWxsOiB0aGVtZS5jb250ZW50X2FjY2VudCxcblx0XHR9LFxuXHRcdFwiLnN2Zy1jb250ZW50LWZnIHBhdGhcIjoge1xuXHRcdFx0ZmlsbDogdGhlbWUuY29udGVudF9mZyxcblx0XHR9LFxuXHRcdFwiLmNvbnRlbnQtYmdcIjoge1xuXHRcdFx0XCJiYWNrZ3JvdW5kLWNvbG9yXCI6IHRoZW1lLmNvbnRlbnRfYmcsXG5cdFx0fSxcblx0XHRcIi5uYXYtYmdcIjoge1xuXHRcdFx0XCJiYWNrZ3JvdW5kLWNvbG9yXCI6IHRoZW1lLm5hdmlnYXRpb25fYmcsXG5cdFx0fSxcblx0XHRcIi5jb250ZW50LWhvdmVyOmhvdmVyXCI6IHtcblx0XHRcdGNvbG9yOiB0aGVtZS5jb250ZW50X2FjY2VudCxcblx0XHR9LFxuXHRcdFwiLm5vLWhvdmVyXCI6IHtcblx0XHRcdFwicG9pbnRlci1ldmVudHNcIjogXCJub25lXCIsXG5cdFx0fSxcblx0XHRcIi5jb250ZW50LW1lc3NhZ2UtYmdcIjoge1xuXHRcdFx0XCJiYWNrZ3JvdW5kLWNvbG9yXCI6IHRoZW1lLmNvbnRlbnRfbWVzc2FnZV9iZyxcblx0XHR9LFxuXHRcdFwiLmVsZXZhdGVkLWJnXCI6IHtcblx0XHRcdFwiYmFja2dyb3VuZC1jb2xvclwiOiBnZXRFbGV2YXRlZEJhY2tncm91bmQoKSxcblx0XHR9LFxuXHRcdFwiLmxpc3QtYmdcIjoge1xuXHRcdFx0XCJiYWNrZ3JvdW5kLWNvbG9yXCI6IHRoZW1lLmxpc3RfYmcsXG5cdFx0fSxcblx0XHRcIi5saXN0LWFjY2VudC1mZ1wiOiB7XG5cdFx0XHRjb2xvcjogdGhlbWUubGlzdF9hY2NlbnRfZmcsXG5cdFx0fSxcblx0XHRcIi5zdmctbGlzdC1hY2NlbnQtZmcgcGF0aFwiOiB7XG5cdFx0XHRmaWxsOiB0aGVtZS5saXN0X2FjY2VudF9mZyxcblx0XHR9LFxuXHRcdFwiLmJnLWFjY2VudC1mZ1wiOiB7XG5cdFx0XHRcImJhY2tncm91bmQtY29sb3JcIjogdGhlbWUubGlzdF9hY2NlbnRfZmcsXG5cdFx0fSxcblx0XHRcIi5saXN0LWJvcmRlci1ib3R0b21cIjoge1xuXHRcdFx0XCJib3JkZXItYm90dG9tXCI6IGAxcHggc29saWQgJHt0aGVtZS5saXN0X2JvcmRlcn1gLFxuXHRcdH0sXG5cdFx0XCIuYWNjZW50LWJnLXRyYW5zbHVjZW50XCI6IHtcblx0XHRcdGJhY2tncm91bmQ6IGAke3RoZW1lLmNvbnRlbnRfYWNjZW50fTJDYCxcblx0XHRcdGNvbG9yOiB0aGVtZS5jb250ZW50X2FjY2VudCxcblx0XHR9LFxuXHRcdFwiLmJ1dHRvbi1iZ1wiOiB7XG5cdFx0XHRiYWNrZ3JvdW5kOiB0aGVtZS5jb250ZW50X2J1dHRvbixcblx0XHRcdGNvbG9yOiB0aGVtZS5uYXZpZ2F0aW9uX2JnLFxuXHRcdFx0b3BhY2l0eTogXCIwLjVcIixcblx0XHR9LFxuXHRcdFwiLmFjY2VudC1iZ1wiOiB7XG5cdFx0XHRcImJhY2tncm91bmQtY29sb3JcIjogdGhlbWUuY29udGVudF9hY2NlbnQsXG5cdFx0XHRjb2xvcjogdGhlbWUuY29udGVudF9idXR0b25faWNvbl9zZWxlY3RlZCxcblx0XHR9LFxuXHRcdFwiLmFjY2VudC1iZy1jeWJlci1tb25kYXlcIjoge1xuXHRcdFx0XCJiYWNrZ3JvdW5kLWNvbG9yXCI6IHRoZW1lLmNvbnRlbnRfYWNjZW50X2N5YmVyX21vbmRheSxcblx0XHRcdGNvbG9yOiB0aGVtZS5jb250ZW50X2J1dHRvbl9pY29uX3NlbGVjdGVkLFxuXHRcdH0sXG5cdFx0XCIuYWNjZW50LWZnXCI6IHtcblx0XHRcdGNvbG9yOiB0aGVtZS5jb250ZW50X2J1dHRvbl9pY29uLFxuXHRcdH0sXG5cdFx0XCIuYWNjZW50LWZnIHBhdGhcIjoge1xuXHRcdFx0ZmlsbDogdGhlbWUuY29udGVudF9idXR0b25faWNvbixcblx0XHR9LFxuXHRcdFwiLnJlZFwiOiB7XG5cdFx0XHRcImJhY2tncm91bmQtY29sb3JcIjogXCIjODQwMDEwXCIsXG5cdFx0fSxcblx0XHRcIi5zd2lwZS1zcGFjZXJcIjoge1xuXHRcdFx0Y29sb3I6IFwiI2ZmZmZmZlwiLFxuXHRcdH0sXG5cdFx0XCIuc3dpcGUtc3BhY2VyIHBhdGhcIjoge1xuXHRcdFx0ZmlsbDogXCIjZmZmZmZmXCIsXG5cdFx0fSxcblx0XHRcIi5ibHVlXCI6IHtcblx0XHRcdFwiYmFja2dyb3VuZC1jb2xvclwiOiBcIiMyMTk2RjNcIixcblx0XHR9LFxuXHRcdFwiLnVuZGVybGluZVwiOiB7XG5cdFx0XHRcInRleHQtZGVjb3JhdGlvblwiOiBcInVuZGVybGluZVwiLFxuXHRcdH0sXG5cdFx0XCIuaG92ZXItdWw6aG92ZXJcIjoge1xuXHRcdFx0XCJ0ZXh0LWRlY29yYXRpb25cIjogaXNBcHAoKSA/IFwibm9uZVwiIDogXCJ1bmRlcmxpbmVcIixcblx0XHR9LFxuXHRcdC8vIHBvc2l0aW9uaW5nMVxuXHRcdFwiLmZpbGwtYWJzb2x1dGVcIjoge1xuXHRcdFx0cG9zaXRpb246IFwiYWJzb2x1dGVcIixcblx0XHRcdHRvcDogMCxcblx0XHRcdGJvdHRvbTogMCxcblx0XHRcdGxlZnQ6IDAsXG5cdFx0XHRyaWdodDogMCxcblx0XHR9LFxuXHRcdFwiLmZpbGwtZmxleFwiOiB7XG5cdFx0XHRcImZsZXgtYmFzaXNcIjogXCIxMDAlXCIsXG5cdFx0XHRcImZsZXgtc2hyaW5rXCI6IDAsXG5cdFx0fSxcblx0XHRcIi5hYnNcIjoge1xuXHRcdFx0cG9zaXRpb246IFwiYWJzb2x1dGVcIixcblx0XHR9LFxuXHRcdFwiLmZpeGVkXCI6IHtcblx0XHRcdHBvc2l0aW9uOiBcImZpeGVkXCIsXG5cdFx0fSxcblx0XHRcIi5yZWxcIjoge1xuXHRcdFx0cG9zaXRpb246IFwicmVsYXRpdmVcIixcblx0XHR9LFxuXHRcdFwiLm1heC13aWR0aC1zXCI6IHtcblx0XHRcdFwibWF4LXdpZHRoXCI6IHB4KDM2MCksXG5cdFx0fSxcblx0XHRcIi5tYXgtd2lkdGgtbVwiOiB7XG5cdFx0XHRcIm1heC13aWR0aFwiOiBweCg0NTApLFxuXHRcdH0sXG5cdFx0XCIubWF4LXdpZHRoLWxcIjoge1xuXHRcdFx0XCJtYXgtd2lkdGhcIjogcHgoODAwKSxcblx0XHR9LFxuXHRcdFwiLm1heC13aWR0aC0yMDBcIjoge1xuXHRcdFx0XCJtYXgtd2lkdGhcIjogcHgoMjAwKSxcblx0XHR9LFxuXHRcdFwiLnNjcm9sbFwiOiB7XG5cdFx0XHRcIm92ZXJmbG93LXlcIjogY2xpZW50Lm92ZXJmbG93QXV0byxcblx0XHRcdFwiLXdlYmtpdC1vdmVyZmxvdy1zY3JvbGxpbmdcIjogXCJ0b3VjaFwiLFxuXHRcdH0sXG5cdFx0XCIuc2Nyb2xsLW5vLW92ZXJsYXlcIjoge1xuXHRcdFx0XCJvdmVyZmxvdy15XCI6IFwiYXV0b1wiLFxuXHRcdFx0XCItd2Via2l0LW92ZXJmbG93LXNjcm9sbGluZ1wiOiBcInRvdWNoXCIsXG5cdFx0fSxcblx0XHRcIi5zY3JvbGwteFwiOiB7XG5cdFx0XHRcIm92ZXJmbG93LXhcIjogXCJhdXRvXCIsXG5cdFx0XHRcIi13ZWJraXQtb3ZlcmZsb3ctc2Nyb2xsaW5nXCI6IFwidG91Y2hcIixcblx0XHR9LFxuXHRcdFwiKlwiOiB7XG5cdFx0XHRcInNjcm9sbGJhci1jb2xvclwiOiBgJHt0aGVtZS5jb250ZW50X2J1dHRvbn0gdHJhbnNwYXJlbnRgLFxuXHRcdFx0XCJzY3JvbGxiYXItd2lkdGhcIjogXCJ0aGluXCIsXG5cdFx0fSxcblx0XHRcIjo6LXdlYmtpdC1zY3JvbGxiYXJcIjogIWNsaWVudC5pc01vYmlsZURldmljZSgpXG5cdFx0XHQ/IHtcblx0XHRcdFx0XHRiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG5cdFx0XHRcdFx0d2lkdGg6IHNjcm9sbGJhcldpZHRoSGVpZ2h0LCAvLyB3aWR0aCBvZiB2ZXJ0aWNhbCBzY3JvbGxiYXJcblx0XHRcdFx0XHRoZWlnaHQ6IHNjcm9sbGJhcldpZHRoSGVpZ2h0LCAvLyB3aWR0aCBvZiBob3Jpem9udGFsIHNjcm9sbGJhclxuXHRcdFx0ICB9XG5cdFx0XHQ6IHt9LFxuXHRcdFwiOjotd2Via2l0LXNjcm9sbGJhci10aHVtYlwiOiAhY2xpZW50LmlzTW9iaWxlRGV2aWNlKClcblx0XHRcdD8ge1xuXHRcdFx0XHRcdGJhY2tncm91bmQ6IHRoZW1lLmNvbnRlbnRfYnV0dG9uLFxuXHRcdFx0XHRcdC8vIHJlZHVjZSB0aGUgYmFja2dyb3VuZFxuXHRcdFx0XHRcdFwiYm9yZGVyLWxlZnRcIjogXCIxNXB4IHNvbGlkIHRyYW5zcGFyZW50XCIsXG5cdFx0XHRcdFx0XCJiYWNrZ3JvdW5kLWNsaXBcIjogXCJwYWRkaW5nLWJveFwiLFxuXHRcdFx0ICB9XG5cdFx0XHQ6IHt9LFxuXHRcdFwiKjo6LXdlYmtpdC1zY3JvbGxiYXItdGh1bWI6aG92ZXJcIjoge1xuXHRcdFx0XCJib3JkZXItbGVmdFwiOiBcIjhweCBzb2xpZCB0cmFuc3BhcmVudFwiLFxuXHRcdH0sXG5cdFx0Ly8gc2Nyb2xsYmFyIHdpbGwgYmUgZGlzYWJsZWQgZm9yIG1vYmlsZSBkZXZpY2VzLCBldmVuIHdpdGggLnNjcm9sbCBhcHBsaWVkLFxuXHRcdC8vIGFwcGx5IHRoaXMgY2xhc3MgaWYgeW91IG5lZWQgaXQgdG8gc2hvd1xuXHRcdFwiLnZpc2libGUtc2Nyb2xsYmFyOjotd2Via2l0LXNjcm9sbGJhclwiOiB7XG5cdFx0XHRiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG5cdFx0XHR3aWR0aDogXCI2cHhcIixcblx0XHR9LFxuXHRcdFwiLnZpc2libGUtc2Nyb2xsYmFyOjotd2Via2l0LXNjcm9sbGJhci10aHVtYlwiOiB7XG5cdFx0XHRiYWNrZ3JvdW5kOiB0aGVtZS5jb250ZW50X2J1dHRvbixcblx0XHRcdFwiYm9yZGVyLXJhZGl1c1wiOiBcIjNweFwiLFxuXHRcdH0sXG5cdFx0Ly8gd2UgYXJlIHRyeWluZyB0byBoYW5kbGUgMyBjYXNlczpcblx0XHQvLyBnZWNrby9GRjogc3VwcG9ydHMgc2Nyb2xsYmFyLWd1dHRlciBidXQgbm90IGN1c3RvbSBzY3JvbGxiYXJzXG5cdFx0Ly8gYmxpbmsvQ2hyb21lOiBzdXBwb3J0cyBzY3JvbGxiYXItZ3V0dGVyIGFuZCBjdXN0b20gc2Nyb2xsYmFyc1xuXHRcdC8vIHdlYmtpdC9TYWZhcmk6IHN1cHBvcnRzIGN1c3RvbSBzY3JvbGxiYXJzIGJ1dCBub3Qgc2Nyb2xsYmFyLWd1dHRlclxuXHRcdC8vIHNvIGZvciBzY3JvbGxpbmcgY29udGFpbmVycyB3ZSBqdXN0IGZvcmNlIHRoZSBzY3JvbGxiYXJzIHdpdGggYG92ZXJmbG93OiBzY3JvbGxgIGFuZCBmb3Igbm9uLXNjcm9sbGluZyBvbmVzIHdlIGZhbGwgYmFjayB0byBwYWRkaW5nXG5cdFx0XCIuc2Nyb2xsYmFyLWd1dHRlci1zdGFibGUtb3ItZmFsbGJhY2tcIjoge1xuXHRcdFx0XCJzY3JvbGxiYXItZ3V0dGVyXCI6IFwic3RhYmxlXCIsXG5cdFx0fSxcblx0XHRcIkBzdXBwb3J0cyBub3QgKHNjcm9sbGJhci1ndXR0ZXI6IHN0YWJsZSlcIjoge1xuXHRcdFx0XCIuc2Nyb2xsYmFyLWd1dHRlci1zdGFibGUtb3ItZmFsbGJhY2tcIjoge1xuXHRcdFx0XHRcInBhZGRpbmctcmlnaHRcIjogc2Nyb2xsYmFyV2lkdGhIZWlnaHQsXG5cdFx0XHR9LFxuXHRcdH0sXG5cdFx0Ly9UT0RPOiBtaWdyYXRlIHRvIC50ZXh0LWNlbnRlclxuXHRcdFwiLmNlbnRlclwiOiB7XG5cdFx0XHRcInRleHQtYWxpZ25cIjogXCJjZW50ZXJcIixcblx0XHR9LFxuXHRcdFwiLmRyb3Bkb3duLWluZm9cIjoge1xuXHRcdFx0XCJwYWRkaW5nLWJvdHRvbVwiOiBcIjVweFwiLFxuXHRcdFx0XCJwYWRkaW5nLWxlZnRcIjogXCIxNnB4XCIsXG5cdFx0XHRcInBhZGRpbmctcmlnaHRcIjogXCIxNnB4XCIsXG5cdFx0fSxcblx0XHRcIi5kcm9wZG93bi1pbmZvICsgLmRyb3Bkb3duLWJ1dHRvblwiOiB7XG5cdFx0XHRcImJvcmRlci10b3BcIjogYDFweCBzb2xpZCAke3RoZW1lLmNvbnRlbnRfYm9yZGVyfWAsXG5cdFx0fSxcblx0XHRcIi5kcm9wZG93bi1pbmZvICsgLmRyb3Bkb3duLWluZm9cIjoge1xuXHRcdFx0XCJwYWRkaW5nLXRvcFwiOiBcIjBcIixcblx0XHR9LFxuXHRcdFwiLnRleHQtY2VudGVyXCI6IHtcblx0XHRcdFwidGV4dC1hbGlnblwiOiBcImNlbnRlclwiLFxuXHRcdH0sXG5cdFx0XCIucmlnaHRcIjoge1xuXHRcdFx0XCJ0ZXh0LWFsaWduXCI6IFwicmlnaHRcIixcblx0XHR9LFxuXHRcdFwiLmxlZnRcIjoge1xuXHRcdFx0XCJ0ZXh0LWFsaWduXCI6IFwibGVmdFwiLFxuXHRcdH0sXG5cdFx0XCIuc3RhcnRcIjoge1xuXHRcdFx0XCJ0ZXh0LWFsaWduXCI6IFwic3RhcnRcIixcblx0XHR9LFxuXHRcdFwiLnN0YXR1c1RleHRDb2xvclwiOiB7XG5cdFx0XHRjb2xvcjogdGhlbWUuY29udGVudF9hY2NlbnQsXG5cdFx0fSxcblx0XHRcIi5idXR0b24taGVpZ2h0XCI6IHtcblx0XHRcdGhlaWdodDogcHgoc2l6ZS5idXR0b25faGVpZ2h0KSxcblx0XHR9LFxuXHRcdFwiLmJ1dHRvbi1taW4taGVpZ2h0XCI6IHtcblx0XHRcdFwibWluLWhlaWdodFwiOiBweChzaXplLmJ1dHRvbl9oZWlnaHQpLFxuXHRcdH0sXG5cdFx0XCIuYnV0dG9uLW1pbi13aWR0aFwiOiB7XG5cdFx0XHRcIm1pbi13aWR0aFwiOiBweChzaXplLmJ1dHRvbl9oZWlnaHQpLFxuXHRcdH0sXG5cdFx0XCIuYnV0dG9uLXdpZHRoLWZpeGVkXCI6IHtcblx0XHRcdHdpZHRoOiBweChzaXplLmJ1dHRvbl9oZWlnaHQpLFxuXHRcdH0sXG5cdFx0XCIubGFyZ2UtYnV0dG9uLWhlaWdodFwiOiB7XG5cdFx0XHRoZWlnaHQ6IHB4KHNpemUuYnV0dG9uX2Zsb2F0aW5nX3NpemUpLFxuXHRcdH0sXG5cdFx0XCIubGFyZ2UtYnV0dG9uLXdpZHRoXCI6IHtcblx0XHRcdHdpZHRoOiBweChzaXplLmJ1dHRvbl9mbG9hdGluZ19zaXplKSxcblx0XHR9LFxuXHRcdFwiLm5vdGlmaWNhdGlvbi1taW4td2lkdGhcIjoge1xuXHRcdFx0XCJtaW4td2lkdGhcIjogcHgoNDAwKSxcblx0XHR9LFxuXHRcdC8vIFN0cmV0Y2ggZWRpdG9yIGEgbGl0dGxlIGJpdCBtb3JlIHRoYW4gcGFyZW50IHNvIHRoYXQgdGhlIGNvbnRlbnQgaXMgdmlzaWJsZVxuXHRcdFwiLmZ1bGwtaGVpZ2h0XCI6IHtcblx0XHRcdFwibWluLWhlaWdodFwiOiBjbGllbnQuaXNJb3MoKSA/IFwiMTAxJVwiIDogXCIxMDAlXCIsXG5cdFx0fSxcblx0XHRcIi5mdWxsLXdpZHRoXCI6IHtcblx0XHRcdHdpZHRoOiBcIjEwMCVcIixcblx0XHR9LFxuXHRcdFwiLmhhbGYtd2lkdGhcIjoge1xuXHRcdFx0d2lkdGg6IFwiNTAlXCIsXG5cdFx0fSxcblx0XHRcIi5ibG9ja1wiOiB7XG5cdFx0XHRkaXNwbGF5OiBcImJsb2NrXCIsXG5cdFx0fSxcblx0XHRcIi5pbmxpbmUtYmxvY2tcIjoge1xuXHRcdFx0ZGlzcGxheTogXCJpbmxpbmUtYmxvY2tcIixcblx0XHR9LFxuXHRcdFwiLm5vLXRleHQtZGVjb3JhdGlvblwiOiB7XG5cdFx0XHRcInRleHQtZGVjb3JhdGlvblwiOiBcIm5vbmVcIixcblx0XHR9LFxuXHRcdFwiLnN0cmlrZVwiOiB7XG5cdFx0XHRcInRleHQtZGVjb3JhdGlvblwiOiBcImxpbmUtdGhyb3VnaFwiLFxuXHRcdH0sXG5cdFx0XCIudGV4dC1hbGlnbi12ZXJ0aWNhbFwiOiB7XG5cdFx0XHRcInZlcnRpY2FsLWFsaWduXCI6IFwidGV4dC10b3BcIixcblx0XHR9LFxuXHRcdC8vIGZsZXggYm94XG5cdFx0XCIuZmxleC1zcGFjZS1hcm91bmRcIjoge1xuXHRcdFx0ZGlzcGxheTogXCJmbGV4XCIsXG5cdFx0XHRcImp1c3RpZnktY29udGVudFwiOiBcInNwYWNlLWFyb3VuZFwiLFxuXHRcdH0sXG5cdFx0XCIuZmxleC1zcGFjZS1iZXR3ZWVuXCI6IHtcblx0XHRcdGRpc3BsYXk6IFwiZmxleFwiLFxuXHRcdFx0XCJqdXN0aWZ5LWNvbnRlbnRcIjogXCJzcGFjZS1iZXR3ZWVuXCIsXG5cdFx0fSxcblx0XHRcIi5mbGV4LWZpeGVkXCI6IHtcblx0XHRcdGZsZXg6IFwiMCAwIGF1dG9cIixcblx0XHR9LFxuXHRcdFwiLmZsZXgtY2VudGVyXCI6IHtcblx0XHRcdGRpc3BsYXk6IFwiZmxleFwiLFxuXHRcdFx0XCJqdXN0aWZ5LWNvbnRlbnRcIjogXCJjZW50ZXJcIixcblx0XHR9LFxuXHRcdFwiLmZsZXgtZW5kXCI6IHtcblx0XHRcdGRpc3BsYXk6IFwiZmxleFwiLFxuXHRcdFx0XCJqdXN0aWZ5LWNvbnRlbnRcIjogXCJmbGV4LWVuZFwiLFxuXHRcdH0sXG5cdFx0XCIuZmxleC1zdGFydFwiOiB7XG5cdFx0XHRkaXNwbGF5OiBcImZsZXhcIixcblx0XHRcdFwianVzdGlmeS1jb250ZW50XCI6IFwiZmxleC1zdGFydFwiLFxuXHRcdH0sXG5cdFx0XCIuZmxleC12LWNlbnRlclwiOiB7XG5cdFx0XHRkaXNwbGF5OiBcImZsZXhcIixcblx0XHRcdFwiZmxleC1kaXJlY3Rpb25cIjogXCJjb2x1bW5cIixcblx0XHRcdFwianVzdGlmeS1jb250ZW50XCI6IFwiY2VudGVyXCIsXG5cdFx0fSxcblx0XHRcIi5mbGV4LWRpcmVjdGlvbi1jaGFuZ2VcIjoge1xuXHRcdFx0ZGlzcGxheTogXCJmbGV4XCIsXG5cdFx0XHRcImp1c3RpZnktY29udGVudFwiOiBcImNlbnRlclwiLFxuXHRcdH0sXG5cdFx0XCIuZmxleC1jb2x1bW5cIjoge1xuXHRcdFx0XCJmbGV4LWRpcmVjdGlvblwiOiBcImNvbHVtblwiLFxuXHRcdH0sXG5cdFx0Ly9UT0RPIG1pZ3JhdGUgdG8gLmNvbFxuXHRcdFwiLmNvbFwiOiB7XG5cdFx0XHRcImZsZXgtZGlyZWN0aW9uXCI6IFwiY29sdW1uXCIsXG5cdFx0fSxcblx0XHRcIi5yb3dcIjoge1xuXHRcdFx0XCJmbGV4LWRpcmVjdGlvblwiOiBcInJvd1wiLFxuXHRcdH0sXG5cdFx0XCIuZmxleC1jb2x1bW4tcmV2ZXJzZVwiOiB7XG5cdFx0XHRcImZsZXgtZGlyZWN0aW9uXCI6IFwiY29sdW1uLXJldmVyc2VcIixcblx0XHR9LFxuXHRcdC8vVE9ETzogbWlncmF0ZSB0byBjb2wtcmV2ZXJzZVxuXHRcdFwiLmNvbC1yZXZlcnNlXCI6IHtcblx0XHRcdFwiZmxleC1kaXJlY3Rpb25cIjogXCJjb2x1bW4tcmV2ZXJzZVwiLFxuXHRcdH0sXG5cdFx0XCIuY29sdW1uLWdhcFwiOiB7XG5cdFx0XHRcImNvbHVtbi1nYXBcIjogcHgoc2l6ZS5ocGFkKSxcblx0XHR9LFxuXHRcdFwiLmNvbHVtbi1nYXAtc1wiOiB7XG5cdFx0XHRcImNvbHVtbi1nYXBcIjogcHgoc2l6ZS5ocGFkX3NtYWxsKSxcblx0XHR9LFxuXHRcdFwiLmdhcC12cGFkXCI6IHtcblx0XHRcdGdhcDogcHgoc2l6ZS52cGFkKSxcblx0XHR9LFxuXHRcdFwiLmdhcC12cGFkLXhzXCI6IHtcblx0XHRcdGdhcDogcHgoc2l6ZS52cGFkX3hzbSksXG5cdFx0fSxcblx0XHRcIi5nYXAtdnBhZC1zXCI6IHtcblx0XHRcdGdhcDogcHgoc2l6ZS52cGFkX3NtYWxsKSxcblx0XHR9LFxuXHRcdFwiLmdhcC12cGFkLXMtMTVcIjoge1xuXHRcdFx0Z2FwOiBweChzaXplLnZwYWRfc21hbGwgKiAxLjUpLFxuXHRcdH0sXG5cdFx0XCIuZ2FwLWhwYWRcIjoge1xuXHRcdFx0Z2FwOiBweChzaXplLmhwYWQpLFxuXHRcdH0sXG5cdFx0XCIuZ2FwLXZwYWQteHhsXCI6IHtcblx0XHRcdGdhcDogcHgoc2l6ZS52cGFkX3h4bCksXG5cdFx0fSxcblx0XHRcIi5mbGV4XCI6IHtcblx0XHRcdGRpc3BsYXk6IFwiZmxleFwiLFxuXHRcdH0sXG5cdFx0XCIuZmxleC1ncm93XCI6IHtcblx0XHRcdGZsZXg6IFwiMVwiLFxuXHRcdH0sXG5cdFx0XCIuZmxleC1oaWRlXCI6IHtcblx0XHRcdGZsZXg6IFwiMFwiLFxuXHRcdH0sXG5cdFx0XCIuZmxleC10aGlyZFwiOiB7XG5cdFx0XHRmbGV4OiBcIjEgMCAwXCIsXG5cdFx0XHRcIm1pbi13aWR0aFwiOiBcIjEwMHB4XCIsXG5cdFx0fSxcblx0XHQvLyBzcGxpdHMgYSBmbGV4IGxheW91dCBpbnRvIHRocmVlIHNhbWUgd2lkdGggY29sdW1uc1xuXHRcdFwiLmZsZXgtdGhpcmQtbWlkZGxlXCI6IHtcblx0XHRcdGZsZXg6IFwiMiAxIDBcIixcblx0XHR9LFxuXHRcdC8vIHRha2UgdXAgbW9yZSBzcGFjZSBmb3IgdGhlIG1pZGRsZSBjb2x1bW5cblx0XHRcIi5mbGV4LWhhbGZcIjoge1xuXHRcdFx0ZmxleDogXCIwIDAgNTAlXCIsXG5cdFx0fSxcblx0XHQvLyBzcGxpdHMgYSBmbGV4IGxheW91dCBpbnRvIHR3byBzYW1lIHdpZHRoIGNvbHVtbnNcblx0XHRcIi5mbGV4LWdyb3ctc2hyaW5rLWhhbGZcIjoge1xuXHRcdFx0ZmxleDogXCIxIDEgNTAlXCIsXG5cdFx0fSxcblx0XHRcIi5mbGV4LW5vZ3Jvdy1zaHJpbmstaGFsZlwiOiB7XG5cdFx0XHRmbGV4OiBcIjAgMSA1MCVcIixcblx0XHR9LFxuXHRcdFwiLmZsZXgtZ3Jvdy1zaHJpbmstYXV0b1wiOiB7XG5cdFx0XHRmbGV4OiBcIjEgMSBhdXRvXCIsXG5cdFx0fSxcblx0XHQvLyBVc2VmdWwgZm9yIGtlZXBpbmcgcm93cyBvZiBudW1iZXJzIGFsaWduZWQgdmVydGljYWxseVxuXHRcdFwiLmZsZXgtZ3Jvdy1zaHJpbmstMFwiOiB7XG5cdFx0XHRmbGV4OiBcIjEgMSAwcHhcIixcblx0XHR9LFxuXHRcdC8vIGFsbG93IGVsZW1lbnQgdG8gZ3JvdyBhbmQgc2hyaW5rIHVzaW5nIHRoZSBlbGVtZW50cyB3aWR0aCBhcyBkZWZhdWx0IHNpemUuXG5cdFx0XCIuZmxleC1ncm93LXNocmluay0xNTBcIjoge1xuXHRcdFx0ZmxleDogXCIxIDEgMTUwcHhcIixcblx0XHR9LFxuXHRcdFwiLmZsZXgtbm8tc2hyaW5rXCI6IHtcblx0XHRcdGZsZXg6IFwiMSAwIDBcIixcblx0XHR9LFxuXHRcdFwiLmZsZXgtbm8tZ3Jvdy1uby1zaHJpbmstYXV0b1wiOiB7XG5cdFx0XHRmbGV4OiBcIjAgMCBhdXRvXCIsXG5cdFx0fSxcblx0XHRcIi5mbGV4LW5vLWdyb3dcIjoge1xuXHRcdFx0ZmxleDogXCIwXCIsXG5cdFx0fSxcblx0XHRcIi5uby1zaHJpbmtcIjoge1xuXHRcdFx0XCJmbGV4LXNocmlua1wiOiBcIjBcIixcblx0XHR9LFxuXHRcdFwiLmZsZXgtbm8tZ3Jvdy1zaHJpbmstYXV0b1wiOiB7XG5cdFx0XHRmbGV4OiBcIjAgMSBhdXRvXCIsXG5cdFx0fSxcblx0XHRcIi5mbGV4LXdyYXBcIjoge1xuXHRcdFx0XCJmbGV4LXdyYXBcIjogXCJ3cmFwXCIsXG5cdFx0fSxcblx0XHQvLyBUT0RPOiBtaWdyYXRlIHRvIC53cmFwXG5cdFx0XCIud3JhcFwiOiB7XG5cdFx0XHRcImZsZXgtd3JhcFwiOiBcIndyYXBcIixcblx0XHR9LFxuXHRcdC8vIGVsZW1lbnRzIG1heSBtb3ZlIGludG8gdGhlIG5leHQgbGluZVxuXHRcdFwiLml0ZW1zLWNlbnRlclwiOiB7XG5cdFx0XHRcImFsaWduLWl0ZW1zXCI6IFwiY2VudGVyXCIsXG5cdFx0fSxcblx0XHQvL1RPRE86IG1pZ3JhdGUgdG8gLmNlbnRlci12ZXJ0aWNhbGx5XG5cdFx0XCIuY2VudGVyLXZlcnRpY2FsbHlcIjoge1xuXHRcdFx0XCJhbGlnbi1pdGVtc1wiOiBcImNlbnRlclwiLFxuXHRcdH0sXG5cdFx0XCIuaXRlbXMtZW5kXCI6IHtcblx0XHRcdFwiYWxpZ24taXRlbXNcIjogXCJmbGV4LWVuZFwiLFxuXHRcdH0sXG5cdFx0XCIuaXRlbXMtc3RhcnRcIjoge1xuXHRcdFx0XCJhbGlnbi1pdGVtc1wiOiBcImZsZXgtc3RhcnRcIixcblx0XHR9LFxuXHRcdFwiLml0ZW1zLWJhc2VcIjoge1xuXHRcdFx0XCJhbGlnbi1pdGVtc1wiOiBcImJhc2VsaW5lXCIsXG5cdFx0fSxcblx0XHRcIi5pdGVtcy1zdHJldGNoXCI6IHtcblx0XHRcdFwiYWxpZ24taXRlbXNcIjogXCJzdHJldGNoXCIsXG5cdFx0fSxcblx0XHRcIi5hbGlnbi1zZWxmLXN0YXJ0XCI6IHtcblx0XHRcdFwiYWxpZ24tc2VsZlwiOiBcInN0YXJ0XCIsXG5cdFx0fSxcblx0XHRcIi5hbGlnbi1zZWxmLWNlbnRlclwiOiB7XG5cdFx0XHRcImFsaWduLXNlbGZcIjogXCJjZW50ZXJcIixcblx0XHR9LFxuXHRcdFwiLmFsaWduLXNlbGYtZW5kXCI6IHtcblx0XHRcdFwiYWxpZ24tc2VsZlwiOiBcImZsZXgtZW5kXCIsXG5cdFx0fSxcblx0XHRcIi5hbGlnbi1zZWxmLXN0cmV0Y2hcIjoge1xuXHRcdFx0XCJhbGlnbi1zZWxmXCI6IFwic3RyZXRjaFwiLFxuXHRcdH0sXG5cdFx0XCIuanVzdGlmeS1jZW50ZXJcIjoge1xuXHRcdFx0XCJqdXN0aWZ5LWNvbnRlbnRcIjogXCJjZW50ZXJcIixcblx0XHR9LFxuXHRcdC8vVE9ETzogbWlncmF0ZSB0byBqdXN0aWZ5LWhvcml6b250YWxseVxuXHRcdFwiLmNlbnRlci1ob3Jpem9udGFsbHlcIjoge1xuXHRcdFx0XCJqdXN0aWZ5LWNvbnRlbnRcIjogXCJjZW50ZXJcIixcblx0XHR9LFxuXHRcdFwiLmp1c3RpZnktYmV0d2VlblwiOiB7XG5cdFx0XHRcImp1c3RpZnktY29udGVudFwiOiBcInNwYWNlLWJldHdlZW5cIixcblx0XHR9LFxuXHRcdFwiLmp1c3RpZnktZW5kXCI6IHtcblx0XHRcdFwianVzdGlmeS1jb250ZW50XCI6IFwiZmxleC1lbmRcIixcblx0XHR9LFxuXHRcdFwiLmp1c3RpZnktc3RhcnRcIjoge1xuXHRcdFx0XCJqdXN0aWZ5LWNvbnRlbnRcIjogXCJmbGV4LXN0YXJ0XCIsXG5cdFx0fSxcblx0XHRcIi5qdXN0aWZ5LXJpZ2h0XCI6IHtcblx0XHRcdFwianVzdGlmeS1jb250ZW50XCI6IFwicmlnaHRcIixcblx0XHR9LFxuXHRcdFwiLmNoaWxkLWdyb3cgPiAqXCI6IHtcblx0XHRcdGZsZXg6IFwiMSAxIGF1dG9cIixcblx0XHR9LFxuXHRcdFwiLmxhc3QtY2hpbGQtZml4ZWQgPiAqOmxhc3QtY2hpbGRcIjoge1xuXHRcdFx0ZmxleDogXCIxIDAgMTAwcHhcIixcblx0XHR9LFxuXHRcdFwiLmxpbWl0LXdpZHRoXCI6IHtcblx0XHRcdFwibWF4LXdpZHRoXCI6IFwiMTAwJVwiLFxuXHRcdH0sXG5cdFx0XCIuZmxleC10cmFuc2l0aW9uXCI6IHtcblx0XHRcdHRyYW5zaXRpb246IFwiZmxleCAyMDBtcyBsaW5lYXJcIixcblx0XHR9LFxuXHRcdFwiLmJvcmRlci1yYWRpdXNcIjoge1xuXHRcdFx0XCJib3JkZXItcmFkaXVzXCI6IHB4KHNpemUuYm9yZGVyX3JhZGl1cyksXG5cdFx0fSxcblx0XHRcIi5ib3JkZXItcmFkaXVzLXRvcFwiOiB7XG5cdFx0XHRcImJvcmRlci10b3AtbGVmdC1yYWRpdXNcIjogcHgoc2l6ZS5ib3JkZXJfcmFkaXVzKSxcblx0XHRcdFwiYm9yZGVyLXRvcC1yaWdodC1yYWRpdXNcIjogcHgoc2l6ZS5ib3JkZXJfcmFkaXVzKSxcblx0XHR9LFxuXHRcdFwiLmJvcmRlci1yYWRpdXMtdG9wLWxlZnQtYmlnXCI6IHtcblx0XHRcdFwiYm9yZGVyLXRvcC1sZWZ0LXJhZGl1c1wiOiBweChzaXplLmJvcmRlcl9yYWRpdXNfbGFyZ2VyKSxcblx0XHR9LFxuXHRcdFwiLmJvcmRlci1yYWRpdXMtdG9wLXJpZ2h0LWJpZ1wiOiB7XG5cdFx0XHRcImJvcmRlci10b3AtcmlnaHQtcmFkaXVzXCI6IHB4KHNpemUuYm9yZGVyX3JhZGl1c19sYXJnZXIpLFxuXHRcdH0sXG5cdFx0XCIuYm9yZGVyLXJhZGl1cy1ib3R0b21cIjoge1xuXHRcdFx0XCJib3JkZXItYm90dG9tLWxlZnQtcmFkaXVzXCI6IHB4KHNpemUuYm9yZGVyX3JhZGl1cyksXG5cdFx0XHRcImJvcmRlci1ib3R0b20tcmlnaHQtcmFkaXVzXCI6IHB4KHNpemUuYm9yZGVyX3JhZGl1cyksXG5cdFx0fSxcblx0XHRcIi5ib3JkZXItcmFkaXVzLXNtYWxsXCI6IHtcblx0XHRcdFwiYm9yZGVyLXJhZGl1c1wiOiBweChzaXplLmJvcmRlcl9yYWRpdXNfc21hbGwpLFxuXHRcdH0sXG5cdFx0XCIuYm9yZGVyLXJhZGl1cy1iaWdcIjoge1xuXHRcdFx0XCJib3JkZXItcmFkaXVzXCI6IHB4KHNpemUuYm9yZGVyX3JhZGl1c19sYXJnZXIpLFxuXHRcdH0sXG5cdFx0XCIuYm9yZGVyLXJhZGl1cy1tXCI6IHtcblx0XHRcdFwiYm9yZGVyLXJhZGl1c1wiOiBweChzaXplLmJvcmRlcl9yYWRpdXNfbWVkaXVtKSxcblx0XHR9LFxuXHRcdFwiLmJvcmRlci1yYWRpdXMtdG9wLWxlZnQtbVwiOiB7XG5cdFx0XHRcImJvcmRlci10b3AtbGVmdC1yYWRpdXNcIjogcHgoc2l6ZS5ib3JkZXJfcmFkaXVzX21lZGl1bSksXG5cdFx0fSxcblx0XHRcIi5ib3JkZXItcmFkaXVzLXRvcC1yaWdodC1tXCI6IHtcblx0XHRcdFwiYm9yZGVyLXRvcC1yaWdodC1yYWRpdXNcIjogcHgoc2l6ZS5ib3JkZXJfcmFkaXVzX21lZGl1bSksXG5cdFx0fSxcblx0XHRcIi5zZXR0aW5ncy1pdGVtXCI6IHtcblx0XHRcdGJvcmRlcjogMCxcblx0XHRcdGN1cnNvcjogXCJwb2ludGVyXCIsXG5cdFx0XHRvdmVyZmxvdzogXCJoaWRkZW5cIixcblx0XHRcdFwid2hpdGUtc3BhY2VcIjogXCJub3dyYXBcIixcblx0XHRcdG1hcmdpbjogMCxcblx0XHRcdFwiZmxleC1zaHJpbmtcIjogMCxcblx0XHRcdFwiLXdlYmtpdC10YXAtaGlnaGxpZ2h0LWNvbG9yXCI6IFwicmdiYSgyNTUsIDI1NSwgMjU1LCAwKVwiLFxuXHRcdFx0XCJwYWRkaW5nLWJvdHRvbVwiOiBweChzaXplLmljb25fc2l6ZV9zbWFsbCksXG5cdFx0XHRcInBhZGRpbmctdG9wXCI6IHB4KHNpemUuaWNvbl9zaXplX3NtYWxsKSxcblx0XHRcdFwiYm9yZGVyLWJvdHRvbVwiOiBgMXB4IHNvbGlkICR7dGhlbWUuYnV0dG9uX2J1YmJsZV9iZ30gIWltcG9ydGFudGAsXG5cdFx0fSxcblx0XHRcIi5zZXR0aW5ncy1pdGVtOmxhc3QtY2hpbGRcIjoge1xuXHRcdFx0XCJib3JkZXItYm90dG9tXCI6IFwibm9uZSAhaW1wb3J0YW50XCIsXG5cdFx0fSxcblx0XHRcIi5lZGl0b3ItYm9yZGVyXCI6IHtcblx0XHRcdGJvcmRlcjogYDJweCBzb2xpZCAke3RoZW1lLmNvbnRlbnRfYm9yZGVyfWAsXG5cdFx0XHRcInBhZGRpbmctdG9wXCI6IHB4KHNpemUudnBhZF9zbWFsbCksXG5cdFx0XHRcInBhZGRpbmctYm90dG9tXCI6IHB4KHNpemUudnBhZF9zbWFsbCksXG5cdFx0XHRcInBhZGRpbmctbGVmdFwiOiBweChzaXplLmhwYWQpLFxuXHRcdFx0XCJwYWRkaW5nLXJpZ2h0XCI6IHB4KHNpemUuaHBhZCksXG5cdFx0fSxcblx0XHRcIi5lZGl0b3ItYm9yZGVyLWFjdGl2ZVwiOiB7XG5cdFx0XHRib3JkZXI6IGAzcHggc29saWQgJHt0aGVtZS5jb250ZW50X2FjY2VudH1gLFxuXHRcdFx0XCJwYWRkaW5nLXRvcFwiOiBweChzaXplLnZwYWRfc21hbGwgLSAxKSxcblx0XHRcdFwicGFkZGluZy1ib3R0b21cIjogcHgoc2l6ZS52cGFkX3NtYWxsIC0gMSksXG5cdFx0XHRcInBhZGRpbmctbGVmdFwiOiBweChzaXplLmhwYWQgLSAxKSxcblx0XHRcdFwicGFkZGluZy1yaWdodFwiOiBweChzaXplLmhwYWQgLSAxKSxcblx0XHR9LFxuXHRcdFwiLmVkaXRvci1uby10b3AtYm9yZGVyXCI6IHtcblx0XHRcdFwiYm9yZGVyLXRvcC1jb2xvclwiOiBcInRyYW5zcGFyZW50XCIsXG5cdFx0fSxcblx0XHQvLyBpY29uXG5cdFx0XCIuaWNvblwiOiB7XG5cdFx0XHRoZWlnaHQ6IHB4KHNpemUuaWNvbl9zaXplX21lZGl1bSksXG5cdFx0XHR3aWR0aDogcHgoc2l6ZS5pY29uX3NpemVfbWVkaXVtKSxcblx0XHR9LFxuXHRcdFwiLmljb24gPiBzdmdcIjoge1xuXHRcdFx0aGVpZ2h0OiBweChzaXplLmljb25fc2l6ZV9tZWRpdW0pLFxuXHRcdFx0d2lkdGg6IHB4KHNpemUuaWNvbl9zaXplX21lZGl1bSksXG5cdFx0fSxcblx0XHQvLyBhIGJpdCBjdXJzZWQgc29sdXRpb24gdG8gbWFrZSB0aGUgdmlzaWJsZSBpY29uIG5vdCB0b28gaHVnZSByZWxhdGl2ZSB0byB0aGUgdGlueSBcImNsb3NlXCIgaWNvbiB0aGF0IHdlIGhhdmUgYnV0IGFsc28gdG8ga2VlcCB0aGUgc2l6ZSBjb25zaXN0ZW50XG5cdFx0Ly8gd2l0aCBpY29uLWxhcmdlIHNvIHRoYXQgdGhlIHRleHQgZmllbGQgZG9lc24ndCBqdW1wIGFyb3VuZFxuXHRcdFwiLmljb24tcHJvZ3Jlc3Mtc2VhcmNoXCI6IHtcblx0XHRcdGhlaWdodDogYCR7cHgoMjApfSAhaW1wb3J0YW50YCxcblx0XHRcdHdpZHRoOiBgJHtweCgyMCl9ICFpbXBvcnRhbnRgLFxuXHRcdH0sXG5cdFx0XCIuaWNvbi1wcm9ncmVzcy1zZWFyY2ggPiBzdmdcIjoge1xuXHRcdFx0aGVpZ2h0OiBgJHtweCgyMCl9ICFpbXBvcnRhbnRgLFxuXHRcdFx0d2lkdGg6IGAke3B4KDIwKX0gIWltcG9ydGFudGAsXG5cdFx0fSxcblx0XHRcIi5zZWFyY2gtYmFyXCI6IHtcblx0XHRcdHRyYW5zaXRpb246IFwiYWxsIDIwMG1zXCIsXG5cdFx0XHRcImJhY2tncm91bmQtY29sb3JcIjogc3RhdGVCZ0xpa2UsXG5cdFx0fSxcblx0XHRcIi5zZWFyY2gtYmFyOmhvdmVyXCI6IHtcblx0XHRcdFwiYmFja2dyb3VuZC1jb2xvclwiOiBzdGF0ZUJnSG92ZXIsXG5cdFx0fSxcblx0XHRcIi5zZWFyY2gtYmFyW2ZvY3VzZWQ9dHJ1ZV1cIjoge1xuXHRcdFx0XCJiYWNrZ3JvdW5kLWNvbG9yXCI6IHRoZW1lLmNvbnRlbnRfYmcsXG5cdFx0XHRcImJveC1zaGFkb3dcIjogc2VhcmNoQmFyU2hhZG93LFxuXHRcdH0sXG5cdFx0XCIuZmFiLXNoYWRvd1wiOiB7XG5cdFx0XHRcImJveC1zaGFkb3dcIjogXCIwcHggOHB4IDEycHggNnB4IHJnYmEoMCwgMCwgMCwgMC4xNSksIDBweCA0cHggNHB4IHJnYmEoMCwgMCwgMCwgMC4zKVwiLFxuXHRcdH0sXG5cdFx0XCIuaWNvbi1wcm9ncmVzcy10aW55XCI6IHtcblx0XHRcdGhlaWdodDogcHgoMTUpLFxuXHRcdFx0d2lkdGg6IHB4KDE1KSxcblx0XHR9LFxuXHRcdFwiLmljb24tcHJvZ3Jlc3MtdGlueSA+IHN2Z1wiOiB7XG5cdFx0XHRoZWlnaHQ6IHB4KDE1KSxcblx0XHRcdHdpZHRoOiBweCgxNSksXG5cdFx0fSxcblx0XHRcIi5pY29uLXNtYWxsXCI6IHtcblx0XHRcdGhlaWdodDogcHgoc2l6ZS5pY29uX3NpemVfc21hbGwpLFxuXHRcdFx0d2lkdGg6IHB4KHNpemUuaWNvbl9zaXplX3NtYWxsKSxcblx0XHR9LFxuXHRcdFwiLmljb24tc21hbGwgPiBzdmdcIjoge1xuXHRcdFx0aGVpZ2h0OiBweChzaXplLmljb25fc2l6ZV9zbWFsbCksXG5cdFx0XHR3aWR0aDogcHgoc2l6ZS5pY29uX3NpemVfc21hbGwpLFxuXHRcdH0sXG5cdFx0XCIuaWNvbi1sYXJnZVwiOiB7XG5cdFx0XHRoZWlnaHQ6IHB4KHNpemUuaWNvbl9zaXplX2xhcmdlKSxcblx0XHRcdHdpZHRoOiBweChzaXplLmljb25fc2l6ZV9sYXJnZSksXG5cdFx0fSxcblx0XHRcIi5pY29uLW1lZGl1bS1sYXJnZVwiOiB7XG5cdFx0XHRoZWlnaHQ6IHB4KHNpemUuaWNvbl9zaXplX21lZGl1bV9sYXJnZSksXG5cdFx0XHR3aWR0aDogcHgoc2l6ZS5pY29uX3NpemVfbWVkaXVtX2xhcmdlKSxcblx0XHR9LFxuXHRcdFwiLmljb24tbWVkaXVtLWxhcmdlID4gc3ZnXCI6IHtcblx0XHRcdGhlaWdodDogcHgoc2l6ZS5pY29uX3NpemVfbWVkaXVtX2xhcmdlKSxcblx0XHRcdHdpZHRoOiBweChzaXplLmljb25fc2l6ZV9tZWRpdW1fbGFyZ2UpLFxuXHRcdH0sXG5cdFx0XCIuaWNvbi1sYXJnZSA+IHN2Z1wiOiB7XG5cdFx0XHRoZWlnaHQ6IHB4KHNpemUuaWNvbl9zaXplX2xhcmdlKSxcblx0XHRcdHdpZHRoOiBweChzaXplLmljb25fc2l6ZV9sYXJnZSksXG5cdFx0fSxcblx0XHRcIi5pY29uLXhsXCI6IHtcblx0XHRcdGhlaWdodDogcHgoc2l6ZS5pY29uX3NpemVfeGwpLFxuXHRcdFx0d2lkdGg6IHB4KHNpemUuaWNvbl9zaXplX3hsKSxcblx0XHR9LFxuXHRcdFwiLmljb24teGwgPiBzdmdcIjoge1xuXHRcdFx0aGVpZ2h0OiBweChzaXplLmljb25fc2l6ZV94bCksXG5cdFx0XHR3aWR0aDogcHgoc2l6ZS5pY29uX3NpemVfeGwpLFxuXHRcdH0sXG5cdFx0XCIuaWNvbi1tZXNzYWdlLWJveFwiOiB7XG5cdFx0XHRoZWlnaHQ6IHB4KHNpemUuaWNvbl9tZXNzYWdlX2JveCksXG5cdFx0XHR3aWR0aDogcHgoc2l6ZS5pY29uX21lc3NhZ2VfYm94KSxcblx0XHR9LFxuXHRcdFwiLmljb24tbWVzc2FnZS1ib3ggPiBzdmdcIjoge1xuXHRcdFx0aGVpZ2h0OiBweChzaXplLmljb25fbWVzc2FnZV9ib3gpLFxuXHRcdFx0d2lkdGg6IHB4KHNpemUuaWNvbl9tZXNzYWdlX2JveCksXG5cdFx0fSxcblx0XHRcIi5pY29uLXByb2dyZXNzID4gc3ZnXCI6IHtcblx0XHRcdFwiYW5pbWF0aW9uLW5hbWVcIjogXCJyb3RhdGUtaWNvblwiLFxuXHRcdFx0XCJhbmltYXRpb24tZHVyYXRpb25cIjogXCIyc1wiLFxuXHRcdFx0XCJhbmltYXRpb24taXRlcmF0aW9uLWNvdW50XCI6IFwiaW5maW5pdGVcIixcblx0XHRcdFwiYW5pbWF0aW9uLXRpbWluZy1mdW5jdGlvblwiOiBcImNhbGN1bGF0ZVBvc2l0aW9uXCIsXG5cdFx0XHRcInRyYW5zZm9ybS1vcmlnaW5cIjogXCI1MCUgNTAlXCIsXG5cdFx0XHRkaXNwbGF5OiBcImlubGluZS1ibG9ja1wiLFxuXHRcdH0sXG5cdFx0XCIuaWNvbi1idXR0b25cIjoge1xuXHRcdFx0XCJib3JkZXItcmFkaXVzXCI6IFwiMjUlXCIsXG5cdFx0XHR3aWR0aDogcHgoc2l6ZS5idXR0b25faGVpZ2h0KSxcblx0XHRcdGhlaWdodDogcHgoc2l6ZS5idXR0b25faGVpZ2h0KSxcblx0XHRcdFwibWF4LXdpZHRoXCI6IHB4KHNpemUuYnV0dG9uX2hlaWdodCksXG5cdFx0XHRcIm1heC1oZWlnaHRcIjogcHgoc2l6ZS5idXR0b25faGVpZ2h0KSxcblx0XHR9LFxuXHRcdFwiLmNlbnRlci1oXCI6IHtcblx0XHRcdG1hcmdpbjogXCIwIGF1dG9cIixcblx0XHR9LFxuXHRcdFwiLnRvZ2dsZS1idXR0b25cIjoge1xuXHRcdFx0XCJib3JkZXItcmFkaXVzXCI6IFwiMjUlXCIsXG5cdFx0XHR3aWR0aDogcHgoc2l6ZS5idXR0b25faGVpZ2h0KSxcblx0XHRcdGhlaWdodDogcHgoc2l6ZS5idXR0b25faGVpZ2h0KSxcblx0XHRcdFwibWF4LXdpZHRoXCI6IHB4KHNpemUuYnV0dG9uX2hlaWdodCksXG5cdFx0XHRcIm1heC1oZWlnaHRcIjogcHgoc2l6ZS5idXR0b25faGVpZ2h0KSxcblx0XHR9LFxuXHRcdFwiLndpemFyZC1uZXh0LWJ1dHRvblwiOiB7XG5cdFx0XHRcIm1hcmdpbi10b3BcIjogXCJhdXRvXCIsXG5cdFx0XHRcIm1hcmdpbi1ib3R0b21cIjogcHgoc2l6ZS52cGFkKSxcblx0XHR9LFxuXHRcdFwiLndpemFyZC1icmVhZGNydW1iXCI6IHtcblx0XHRcdGJvcmRlcjogYDFweCBzb2xpZCAke2dldENvbnRlbnRCdXR0b25JY29uQmFja2dyb3VuZCgpfWAsXG5cdFx0XHRjb2xvcjogXCJpbmhlcml0XCIsXG5cdFx0XHRcInRyYW5zaXRpb24tcHJvcGVydHlcIjogXCJib3JkZXItd2lkdGgsIGJvcmRlci1jb2xvciwgY29sb3IsIGJhY2tncm91bmQtY29sb3JcIixcblx0XHRcdFwidHJhbnNpdGlvbi1kdXJhdGlvblwiOiBgJHtEZWZhdWx0QW5pbWF0aW9uVGltZSAtIDcwfW1zYCxcblx0XHRcdFwidHJhbnNpdGlvbi10aW1pbmctZnVuY3Rpb25cIjogXCJlYXNlLW91dFwiLFxuXHRcdFx0XCJ3aWxsLWNoYW5nZVwiOiBcImJvcmRlci13aWR0aCwgYm9yZGVyLWNvbG9yLCBjb2xvclwiLFxuXHRcdH0sXG5cdFx0XCIud2l6YXJkLWJyZWFkY3J1bWItYWN0aXZlXCI6IHtcblx0XHRcdGJvcmRlcjogYDJweCBzb2xpZCAke3RoZW1lLmNvbnRlbnRfYWNjZW50fWAsXG5cdFx0XHRjb2xvcjogdGhlbWUuY29udGVudF9hY2NlbnQsXG5cdFx0XHRcInRyYW5zaXRpb24tcHJvcGVydHlcIjogXCJib3JkZXItd2lkdGgsIGJvcmRlci1jb2xvciwgY29sb3IsIGJhY2tncm91bmQtY29sb3JcIixcblx0XHRcdFwidHJhbnNpdGlvbi1kdXJhdGlvblwiOiBgJHtEZWZhdWx0QW5pbWF0aW9uVGltZSAtIDcwfW1zYCxcblx0XHRcdFwidHJhbnNpdGlvbi10aW1pbmctZnVuY3Rpb25cIjogXCJlYXNlLW91dFwiLFxuXHRcdFx0XCJ3aWxsLWNoYW5nZVwiOiBcImJvcmRlci13aWR0aCwgY29sb3IsIGJhY2tncm91bmQtY29sb3JcIixcblx0XHR9LFxuXHRcdFwiLndpemFyZC1icmVhZGNydW1iLXByZXZpb3VzXCI6IHtcblx0XHRcdGJvcmRlcjogYDFweCBzb2xpZCAke3RoZW1lLmNvbnRlbnRfYWNjZW50fWAsXG5cdFx0XHRjb2xvcjogXCJpbmhlcml0XCIsXG5cdFx0XHRcImJhY2tncm91bmQtY29sb3JcIjogdGhlbWUuY29udGVudF9hY2NlbnQsXG5cdFx0XHRcInRyYW5zaXRpb24tcHJvcGVydHlcIjogXCJib3JkZXItd2lkdGgsIGJvcmRlci1jb2xvciwgY29sb3IsIGJhY2tncm91bmQtY29sb3JcIixcblx0XHRcdFwidHJhbnNpdGlvbi1kdXJhdGlvblwiOiBgJHtEZWZhdWx0QW5pbWF0aW9uVGltZSAtIDcwfW1zYCxcblx0XHRcdFwidHJhbnNpdGlvbi10aW1pbmctZnVuY3Rpb25cIjogXCJlYXNlLW91dFwiLFxuXHRcdFx0XCJ3aWxsLWNoYW5nZVwiOiBcImJvcmRlci13aWR0aCwgYm9yZGVyLWNvbG9yLCBjb2xvciwgYmFja2dyb3VuZC1jb2xvclwiLFxuXHRcdH0sXG5cdFx0XCIud2l6YXJkLWJyZWFkY3J1bWItbGluZVwiOiB7XG5cdFx0XHRcImJvcmRlci10b3BcIjogYDNweCBkb3R0ZWQgJHt0aGVtZS5jb250ZW50X2JvcmRlcn1gLFxuXHRcdFx0aGVpZ2h0OiAwLFxuXHRcdFx0dHJhbnNpdGlvbjogYGJvcmRlci10b3AtY29sb3IgJHtEZWZhdWx0QW5pbWF0aW9uVGltZX1tcyBlYXNlLW91dGAsXG5cdFx0XHRcIndpbGwtY2hhbmdlXCI6IFwiYm9yZGVyLXRvcC1zdHlsZSwgYm9yZGVyLXRvcC1jb2xvclwiLFxuXHRcdH0sXG5cdFx0XCIud2l6YXJkLWJyZWFkY3J1bWItbGluZS1hY3RpdmVcIjoge1xuXHRcdFx0XCJib3JkZXItdG9wXCI6IGAzcHggc29saWQgJHt0aGVtZS5jb250ZW50X2FjY2VudH1gLFxuXHRcdFx0aGVpZ2h0OiAwLFxuXHRcdFx0dHJhbnNpdGlvbjogYGJvcmRlci10b3AtY29sb3IgJHtEZWZhdWx0QW5pbWF0aW9uVGltZX1tcyBlYXNlLW91dGAsXG5cdFx0fSxcblx0XHRcIi5jb21wYWN0XCI6IHtcblx0XHRcdHdpZHRoOiBgJHtzaXplLmJ1dHRvbl9oZWlnaHRfY29tcGFjdH1weCAhaW1wb3J0YW50YCxcblx0XHRcdGhlaWdodDogYCR7c2l6ZS5idXR0b25faGVpZ2h0X2NvbXBhY3R9cHggIWltcG9ydGFudGAsXG5cdFx0fSxcblx0XHRcIi5sYXJnZVwiOiB7XG5cdFx0XHR3aWR0aDogYCR7c2l6ZS5idXR0b25fZmxvYXRpbmdfc2l6ZX1weGAsXG5cdFx0XHRoZWlnaHQ6IGAke3NpemUuYnV0dG9uX2Zsb2F0aW5nX3NpemV9cHhgLFxuXHRcdFx0XCJtYXgtd2lkdGhcIjogYCR7c2l6ZS5idXR0b25fZmxvYXRpbmdfc2l6ZX1weGAsXG5cdFx0XHRcIm1heC1oZWlnaHRcIjogYCR7c2l6ZS5idXR0b25fZmxvYXRpbmdfc2l6ZX1weGAsXG5cdFx0fSxcblx0XHQvLyBzdGF0ZS1iZyBpcyBhIHNpbXVsYXRpb24gb2YgYSBcInN0YXRlIGxheWVyXCIgZnJvbSBNYXRlcmlhbCBidXQgd2l0aG91dCBhbiBhZGRpdGlvbmFsIGxheWVyXG5cdFx0Ly8gV2UgZG9uJ3QgZXhhY3RseSBmb2xsb3cgdHJhbnNwYXJlbmN5IGZvciBpdCBiZWNhdXNlIHdlIGNvbWJpbmUgdHJhbnNwYXJlbmN5IHdpdGggbGlnaHQgZ3JleSBjb2xvciB3aGljaCB3b3JrcyB3ZWxsIG9uIGJvdGggbGlnaHQgYW5kIGRhcmsgdGhlbWVzXG5cdFx0XCIuc3RhdGUtYmdcIjoge1xuXHRcdFx0YmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuXHRcdFx0dHJhbnNpdGlvbjogXCJiYWNrZ3JvdW5kIDAuNnNcIixcblx0XHRcdC8vIHVuZG9pbmcgb3VyIGRlZmF1bHQgYnV0dG9uIHN0eWxpbmdcblx0XHRcdG9wYWNpdHk6IFwiMSAhaW1wb3J0YW50XCIsXG5cdFx0fSxcblx0XHQvLyBPbmx5IGVuYWJsZSBob3ZlciBmb3IgbW91c2UgYW5kIGtleWJvYXJkIG5hdmlnYXRpb24gKG5vdCB0b3VjaCkgYmVjYXVzZVxuXHRcdC8vIDpob3ZlciB3aWxsIGJldCBzdHVjayBhZnRlciB0aGUgdG91Y2ggb24gbW9iaWxlLlxuXHRcdC8vIFVzZSA6d2hlcmUoKSB0byBub3QgY291bnQgdG93YXJkcyBzcGVjaWZpY2l0eSwgb3RoZXJ3aXNlIHRoaXMgaXMgbW9yZSBzcGVjaWZpY1xuXHRcdC8vIHRoYW4gOmFjdGl2ZSAod2hpY2ggaXMgdW5jb25kaXRpb25hbFxuXHRcdFwiOndoZXJlKC5tb3VzZS1uYXYpIC5zdGF0ZS1iZzpob3ZlciwgOndoZXJlKC5rZXlib2FyZC1uYXYpIC5zdGF0ZS1iZzpob3ZlclwiOiB7XG5cdFx0XHRiYWNrZ3JvdW5kOiBzdGF0ZUJnSG92ZXIsXG5cdFx0XHRcInRyYW5zaXRpb24tZHVyYXRpb25cIjogXCIuM3NcIixcblx0XHR9LFxuXHRcdFwiOndoZXJlKC5rZXlib2FyZC1uYXYpIC5zdGF0ZS1iZzpmb2N1c1wiOiB7XG5cdFx0XHRiYWNrZ3JvdW5kOiBzdGF0ZUJnRm9jdXMsXG5cdFx0XHRcInRyYW5zaXRpb24tZHVyYXRpb25cIjogXCIuM3NcIixcblx0XHRcdC8vIGRpc2FibGUgZGVmYXVsdCBmb2N1cyBpbmRpY2F0b3IgYmVjYXVzZSB3ZSBoYXZlIG91ciBvd24gZm9yIHRoaXMgZWxlbWVudFxuXHRcdFx0b3V0bGluZTogXCJub25lXCIsXG5cdFx0fSxcblx0XHRcIi5zdGF0ZS1iZzphY3RpdmUsIC5zdGF0ZS1iZ1twcmVzc2VkPXRydWVdXCI6IHtcblx0XHRcdGJhY2tncm91bmQ6IHN0YXRlQmdBY3RpdmUsXG5cdFx0XHRcInRyYW5zaXRpb24tZHVyYXRpb25cIjogXCIuM3NcIixcblx0XHR9LFxuXHRcdFwiLmZsYXNoXCI6IHtcblx0XHRcdHRyYW5zaXRpb246IGBvcGFjaXR5ICR7RGVmYXVsdEFuaW1hdGlvblRpbWV9bXNgLFxuXHRcdH0sXG5cdFx0XCIuZmxhc2g6YWN0aXZlXCI6IHtcblx0XHRcdG9wYWNpdHk6IFwiMC40XCIsXG5cdFx0fSxcblx0XHRcIi5kaXNhYmxlZFwiOiB7XG5cdFx0XHRvcGFjaXR5OiBcIjAuN1wiLFxuXHRcdH0sXG5cdFx0XCIudHJhbnNsdWNlbnRcIjoge1xuXHRcdFx0b3BhY2l0eTogXCIwLjRcIixcblx0XHR9LFxuXHRcdFwiLm9wYXF1ZVwiOiB7XG5cdFx0XHRvcGFjaXR5OiBcIjFcIixcblx0XHR9LFxuXHRcdFwiQGtleWZyYW1lcyByb3RhdGUtaWNvblwiOiB7XG5cdFx0XHRcIjAlXCI6IHtcblx0XHRcdFx0dHJhbnNmb3JtOiBcInJvdGF0ZSgwZGVnKVwiLFxuXHRcdFx0fSxcblx0XHRcdFwiMTAwJVwiOiB7XG5cdFx0XHRcdHRyYW5zZm9ybTogXCJyb3RhdGUoMzYwZGVnKVwiLFxuXHRcdFx0fSxcblx0XHR9LFxuXHRcdC8vIGN1c3RvbSBzdHlsaW5nIGZvciB2aWV3c1xuXHRcdC8vIHRoZSBtYWluIHZpZXdcblx0XHRcIi5tYWluLXZpZXdcIjoge1xuXHRcdFx0cG9zaXRpb246IFwiYWJzb2x1dGVcIixcblx0XHRcdHRvcDogMCxcblx0XHRcdHJpZ2h0OiBweCgwKSxcblx0XHRcdGJvdHRvbTogcHgoMCksXG5cdFx0XHRsZWZ0OiBweCgwKSxcblx0XHRcdFwib3ZlcmZsb3cteFwiOiBcImhpZGRlblwiLFxuXHRcdH0sXG5cdFx0XCIubWxyLXNhZmUtaW5zZXRcIjoge1xuXHRcdFx0XCJtYXJnaW4tcmlnaHRcIjogXCJlbnYoc2FmZS1hcmVhLWluc2V0LXJpZ2h0KVwiLFxuXHRcdFx0XCJtYXJnaW4tbGVmdFwiOiBcImVudihzYWZlLWFyZWEtaW5zZXQtbGVmdClcIixcblx0XHR9LFxuXHRcdFwiLnBsci1zYWZlLWluc2V0XCI6IHtcblx0XHRcdFwicGFkZGluZy1yaWdodFwiOiBcImVudihzYWZlLWFyZWEtaW5zZXQtcmlnaHQpXCIsXG5cdFx0XHRcInBhZGRpbmctbGVmdFwiOiBcImVudihzYWZlLWFyZWEtaW5zZXQtbGVmdClcIixcblx0XHR9LFxuXHRcdFwiLm10LXNhZmUtaW5zZXRcIjoge1xuXHRcdFx0XCJtYXJnaW4tdG9wXCI6IFwiZW52KHNhZmUtYXJlYS1pbnNldC10b3ApXCIsXG5cdFx0fSxcblx0XHQvLyBoZWFkZXJcblx0XHRcIi5oZWFkZXItbmF2XCI6IHtcblx0XHRcdGhlaWdodDogcHgoc2l6ZS5uYXZiYXJfaGVpZ2h0KSxcblx0XHRcdFwiYmFja2dyb3VuZC1jb2xvclwiOiB0aGVtZS5uYXZpZ2F0aW9uX2JnLFxuXHRcdFx0XCJ6LWluZGV4XCI6IDIsXG5cdFx0fSxcblx0XHRcIi5ib3R0b20tbmF2XCI6IHtcblx0XHRcdFwiYm9yZGVyLXRvcFwiOiBgMXB4IHNvbGlkICR7dGhlbWUubmF2aWdhdGlvbl9ib3JkZXJ9YCxcblx0XHRcdGhlaWdodDogcG9zaXRpb25WYWx1ZShzaXplLmJvdHRvbV9uYXZfYmFyKSxcblx0XHRcdGJhY2tncm91bmQ6IHRoZW1lLmhlYWRlcl9iZyxcblx0XHRcdFwibWFyZ2luLWJvdHRvbVwiOiBcImVudihzYWZlLWFyZWEtaW5zZXQtYm90dG9tKVwiLFxuXHRcdFx0XCJ6LWluZGV4XCI6IDIsXG5cdFx0fSxcblx0XHRcIi5ub3RpZmljYXRpb24tb3ZlcmxheS1jb250ZW50XCI6IHtcblx0XHRcdFwibWFyZ2luLWxlZnRcIjogcHgoc2l6ZS52cGFkKSxcblx0XHRcdFwibWFyZ2luLXJpZ2h0XCI6IHB4KHNpemUudnBhZCksXG5cdFx0XHRcInBhZGRpbmctdG9wXCI6IHB4KHNpemUudnBhZCksXG5cdFx0fSxcblx0XHRcIi5sb2dvLWNpcmNsZVwiOiB7XG5cdFx0XHR3aWR0aDogcHgoc2l6ZS5idXR0b25faWNvbl9iZ19zaXplKSxcblx0XHRcdGhlaWdodDogcHgoc2l6ZS5idXR0b25faWNvbl9iZ19zaXplKSxcblx0XHRcdFwiYm9yZGVyLXJhZGl1c1wiOiBcIjUwJVwiLFxuXHRcdFx0b3ZlcmZsb3c6IFwiaGlkZGVuXCIsXG5cdFx0fSxcblx0XHRcIi5kb3RcIjoge1xuXHRcdFx0d2lkdGg6IHB4KHNpemUuZG90X3NpemUpLFxuXHRcdFx0aGVpZ2h0OiBweChzaXplLmRvdF9zaXplKSxcblx0XHRcdFwiYm9yZGVyLXJhZGl1c1wiOiBcIjUwJVwiLFxuXHRcdFx0b3ZlcmZsb3c6IFwiaGlkZGVuXCIsXG5cdFx0XHRcIm1hcmdpbi10b3BcIjogcHgoNiksXG5cdFx0fSxcblx0XHRcIi5uZXdzLWJ1dHRvblwiOiB7XG5cdFx0XHRwb3NpdGlvbjogXCJyZWxhdGl2ZVwiLFxuXHRcdH0sXG5cdFx0XCIubG9nby10ZXh0XCI6IHtcblx0XHRcdGhlaWdodDogcHgoc2l6ZS5oZWFkZXJfbG9nb19oZWlnaHQpLFxuXHRcdFx0d2lkdGg6IHB4KDEyOCksXG5cdFx0fSxcblx0XHRcIi5sb2dvLWhlaWdodFwiOiB7XG5cdFx0XHRoZWlnaHQ6IHB4KHNpemUuaGVhZGVyX2xvZ29faGVpZ2h0KSxcblx0XHR9LFxuXHRcdFwiLmxvZ28taGVpZ2h0ID4gc3ZnLCAubG9nby1oZWlnaHQgPiBpbWdcIjoge1xuXHRcdFx0aGVpZ2h0OiBweChzaXplLmhlYWRlcl9sb2dvX2hlaWdodCksXG5cdFx0fSxcblx0XHRcIi5jdXN0b20tbG9nb1wiOiB7XG5cdFx0XHR3aWR0aDogcHgoMjAwKSxcblx0XHRcdFwiYmFja2dyb3VuZC1yZXBlYXRcIjogXCJuby1yZXBlYXRcIixcblx0XHRcdFwiYmFja2dyb3VuZC1zaXplXCI6IFwiYXV0byAxMDAlXCIsXG5cdFx0fSxcblx0XHRcIi5uYXYtYmFyLXNwYWNlclwiOiB7XG5cdFx0XHR3aWR0aDogXCIwcHhcIixcblx0XHRcdGhlaWdodDogXCIyMnB4XCIsXG5cdFx0XHRcIm1hcmdpbi1sZWZ0XCI6IFwiMnB4XCIsXG5cdFx0XHRcImJvcmRlci1jb2xvclwiOiB0aGVtZS5uYXZpZ2F0aW9uX2JvcmRlcixcblx0XHRcdFwiYm9yZGVyLXdpZHRoXCI6IFwiMXB4XCIsXG5cdFx0XHRcImJvcmRlci1zdHlsZVwiOiBcInNvbGlkXCIsXG5cdFx0fSxcblx0XHQvLyBkaWFsb2dzXG5cdFx0XCIuZGlhbG9nXCI6IHtcblx0XHRcdFwibWluLXdpZHRoXCI6IHB4KDIwMCksXG5cdFx0fSxcblx0XHRcIi5kaWFsb2ctd2lkdGgtbFwiOiB7XG5cdFx0XHRcIm1heC13aWR0aFwiOiBweCg4MDApLFxuXHRcdH0sXG5cdFx0XCIuZGlhbG9nLXdpZHRoLW1cIjoge1xuXHRcdFx0XCJtYXgtd2lkdGhcIjogcHgoNTAwKSxcblx0XHR9LFxuXHRcdFwiLmRpYWxvZy13aWR0aC1zXCI6IHtcblx0XHRcdFwibWF4LXdpZHRoXCI6IHB4KDQwMCksXG5cdFx0fSxcblx0XHRcIi5kaWFsb2ctd2lkdGgtYWxlcnRcIjoge1xuXHRcdFx0XCJtYXgtd2lkdGhcIjogcHgoMzUwKSxcblx0XHR9LFxuXHRcdFwiLmRpYWxvZy1oZWFkZXJcIjoge1xuXHRcdFx0XCJib3JkZXItYm90dG9tXCI6IGAxcHggc29saWQgJHt0aGVtZS5jb250ZW50X2JvcmRlcn1gLFxuXHRcdFx0aGVpZ2h0OiBweChzaXplLmJ1dHRvbl9oZWlnaHQgKyAxKSxcblx0XHR9LFxuXHRcdFwiLmRpYWxvZy1oZWFkZXItbGluZS1oZWlnaHRcIjoge1xuXHRcdFx0XCJsaW5lLWhlaWdodFwiOiBweChzaXplLmJ1dHRvbl9oZWlnaHQpLFxuXHRcdH0sXG5cdFx0XCIuZGlhbG9nLXByb2dyZXNzXCI6IHtcblx0XHRcdFwidGV4dC1hbGlnblwiOiBcImNlbnRlclwiLFxuXHRcdFx0cGFkZGluZzogcHgoc2l6ZS5ocGFkX2xhcmdlKSxcblx0XHRcdHdpZHRoOiBgY2FsYygxMDAlIC0gJHsyICogc2l6ZS5ocGFkfXB4KWAsXG5cdFx0fSxcblx0XHRcIi5mYXEtaXRlbXMgaW1nXCI6IHtcblx0XHRcdFwibWF4LXdpZHRoXCI6IFwiMTAwJVwiLFxuXHRcdFx0aGVpZ2h0OiBcImF1dG9cIixcblx0XHR9LFxuXHRcdFwiLmRpYWxvZy1jb250YWluZXJcIjogcG9zaXRpb25fYWJzb2x1dGUoc2l6ZS5idXR0b25faGVpZ2h0ICsgMSwgMCwgMCwgMCksXG5cdFx0XCIuZGlhbG9nLWNvbnRlbnRCdXR0b25zQm90dG9tXCI6IHtcblx0XHRcdHBhZGRpbmc6IGAwICR7cHgoc2l6ZS5ocGFkX2xhcmdlKX0gJHtweChzaXplLnZwYWQpfSAke3B4KHNpemUuaHBhZF9sYXJnZSl9YCxcblx0XHR9LFxuXHRcdFwiLmRpYWxvZy1pbWdcIjoge1xuXHRcdFx0d2lkdGg6IHB4KDE1MCksXG5cdFx0XHRoZWlnaHQ6IFwiYXV0b1wiLFxuXHRcdH0sXG5cdFx0XCIuZGlhbG9nLWJ1dHRvbnNcIjoge1xuXHRcdFx0XCJib3JkZXItdG9wXCI6IGAxcHggc29saWQgJHt0aGVtZS5jb250ZW50X2JvcmRlcn1gLFxuXHRcdH0sXG5cdFx0XCIuZGlhbG9nLWJ1dHRvbnMgPiBidXR0b25cIjoge1xuXHRcdFx0ZmxleDogXCIxXCIsXG5cdFx0fSxcblx0XHRcIi5kaWFsb2ctYnV0dG9ucyA+IGJ1dHRvbjpub3QoOmZpcnN0LWNoaWxkKVwiOiB7XG5cdFx0XHRcImJvcmRlci1sZWZ0XCI6IGAxcHggc29saWQgJHt0aGVtZS5jb250ZW50X2JvcmRlcn1gLFxuXHRcdFx0XCJtYXJnaW4tbGVmdFwiOiBcIjBcIixcblx0XHR9LFxuXHRcdFwiLmRpYWxvZy1oZWlnaHQtc21hbGxcIjoge1xuXHRcdFx0XCJtaW4taGVpZ2h0XCI6IFwiNjV2aFwiLFxuXHRcdH0sXG5cdFx0XCIuZGlhbG9nLW1heC1oZWlnaHRcIjoge1xuXHRcdFx0XCJtYXgtaGVpZ2h0XCI6IFwiY2FsYygxMDB2aCAtIDEwMHB4KVwiLFxuXHRcdH0sXG5cdFx0Ly8gbWFpbCBmb2xkZXIgdmlldyBjb2x1bW5cblx0XHRcIiAuZm9sZGVyLWNvbHVtblwiOiB7XG5cdFx0XHRoZWlnaHQ6IFwiMTAwJVwiLFxuXHRcdFx0XCJwYWRkaW5nLXRvcFwiOiBcImVudihzYWZlLWFyZWEtaW5zZXQtdG9wKVwiLFxuXHRcdH0sXG5cdFx0XCIubGlzdC1ib3JkZXItcmlnaHRcIjoge1xuXHRcdFx0XCJib3JkZXItcmlnaHRcIjogYDFweCBzb2xpZCAke3RoZW1lLmxpc3RfYm9yZGVyfWAsXG5cdFx0fSxcblx0XHRcIi5mb2xkZXJzXCI6IHtcblx0XHRcdFwibWFyZ2luLWJvdHRvbVwiOiBweCgxMiksXG5cdFx0fSxcblx0XHRcIi5mb2xkZXItcm93XCI6IHtcblx0XHRcdFwiYWxpZ24taXRlbXNcIjogXCJjZW50ZXJcIixcblx0XHRcdHBvc2l0aW9uOiBcInJlbGF0aXZlXCIsXG5cdFx0fSxcblx0XHRcIi50ZW1wbGF0ZS1saXN0LXJvd1wiOiB7XG5cdFx0XHRcImJvcmRlci1sZWZ0XCI6IHB4KHNpemUuYm9yZGVyX3NlbGVjdGlvbikgKyBcIiBzb2xpZCB0cmFuc3BhcmVudFwiLFxuXHRcdFx0XCJhbGlnbi1pdGVtc1wiOiBcImNlbnRlclwiLFxuXHRcdFx0cG9zaXRpb246IFwicmVsYXRpdmVcIixcblx0XHR9LFxuXHRcdFwiLmNvdW50ZXItYmFkZ2VcIjoge1xuXHRcdFx0XCJwYWRkaW5nLWxlZnRcIjogcHgoNCksXG5cdFx0XHRcInBhZGRpbmctcmlnaHRcIjogcHgoNCksXG5cdFx0XHRcImJvcmRlci1yYWRpdXNcIjogcHgoOCksXG5cdFx0XHRcImxpbmUtaGVpZ2h0XCI6IHB4KDE2KSxcblx0XHRcdFwiZm9udC1zaXplXCI6IHB4KHNpemUuZm9udF9zaXplX3NtYWxsKSxcblx0XHRcdFwiZm9udC13ZWlnaHRcIjogXCJib2xkXCIsXG5cdFx0XHRcIm1pbi13aWR0aFwiOiBweCgxNiksXG5cdFx0XHRcIm1pbi1oZWlnaHRcIjogcHgoMTYpLFxuXHRcdFx0XCJ0ZXh0LWFsaWduXCI6IFwiY2VudGVyXCIsXG5cdFx0fSxcblx0XHRcIi5yb3ctc2VsZWN0ZWRcIjoge1xuXHRcdFx0XCJib3JkZXItY29sb3JcIjogYCR7dGhlbWUubGlzdF9hY2NlbnRfZmd9ICFpbXBvcnRhbnRgLFxuXHRcdFx0Y29sb3I6IGAke3RoZW1lLmxpc3RfYWNjZW50X2ZnfWAsXG5cdFx0fSxcblx0XHRcIi5ob3ZlcmFibGUtbGlzdC1pdGVtOmhvdmVyXCI6IHtcblx0XHRcdFwiYm9yZGVyLWNvbG9yXCI6IGAke3RoZW1lLmxpc3RfYWNjZW50X2ZnfSAhaW1wb3J0YW50YCxcblx0XHRcdGNvbG9yOiBgJHt0aGVtZS5saXN0X2FjY2VudF9mZ31gLFxuXHRcdH0sXG5cdFx0XCIuZXhwYW5kZXJcIjoge1xuXHRcdFx0aGVpZ2h0OiBweChzaXplLmJ1dHRvbl9oZWlnaHQpLFxuXHRcdFx0XCJtaW4td2lkdGhcIjogcHgoc2l6ZS5idXR0b25faGVpZ2h0KSxcblx0XHR9LFxuXHRcdC8vIG1haWwgdmlldyBlZGl0b3Jcblx0XHRcIi5tYWlsLXZpZXdlci1maXJzdExpbmVcIjoge1xuXHRcdFx0XCJwYWRpbmctdG9wXCI6IHB4KDEwKSxcblx0XHR9LFxuXHRcdFwiLmhpZGUtb3V0bGluZVwiOiB7XG5cdFx0XHRvdXRsaW5lOiBcIm5vbmVcIixcblx0XHR9LFxuXHRcdFwiLm5vZm9jdXM6Zm9jdXNcIjoge1xuXHRcdFx0b3V0bGluZTogXCJub25lXCIsXG5cdFx0fSxcblx0XHRcIi5pbnB1dFwiOiB7XG5cdFx0XHRvdXRsaW5lOiBcIm5vbmVcIixcblx0XHR9LFxuXHRcdFwiYmxvY2txdW90ZS50dXRhbm90YV9xdW90ZSwgYmxvY2txdW90ZVt0eXBlPWNpdGVdXCI6IHtcblx0XHRcdFwiYm9yZGVyLWxlZnRcIjogYDFweCBzb2xpZCAke3RoZW1lLmNvbnRlbnRfYWNjZW50fWAsXG5cdFx0XHRcInBhZGRpbmctbGVmdFwiOiBweChzaXplLmhwYWQpLFxuXHRcdFx0XCJtYXJnaW4tbGVmdFwiOiBweCgwKSxcblx0XHRcdFwibWFyZ2luLXJpZ2h0XCI6IHB4KDApLFxuXHRcdH0sXG5cdFx0XCIudHV0YW5vdGEtcGxhY2Vob2xkZXJcIjoge1xuXHRcdFx0XCJtYXgtd2lkdGhcIjogXCIxMDBweCAhaW1wb3J0YW50XCIsXG5cdFx0XHRcIm1heC1oZWlnaHRcIjogXCIxMDBweCAhaW1wb3J0YW50XCIsXG5cdFx0fSxcblx0XHRcIi5Nc29Ob3JtYWxcIjoge1xuXHRcdFx0bWFyZ2luOiAwLFxuXHRcdH0sXG5cdFx0Ly8gbGlzdFxuXHRcdFwiLmxpc3RcIjoge1xuXHRcdFx0b3ZlcmZsb3c6IFwiaGlkZGVuXCIsXG5cdFx0XHRcImxpc3Qtc3R5bGVcIjogXCJub25lXCIsXG5cdFx0XHRtYXJnaW46IDAsXG5cdFx0XHRwYWRkaW5nOiAwLFxuXHRcdH0sXG5cdFx0XCIubGlzdC1yb3dcIjoge1xuXHRcdFx0cG9zaXRpb246IFwiYWJzb2x1dGVcIixcblx0XHRcdGxlZnQ6IDAsXG5cdFx0XHRyaWdodDogMCxcblx0XHRcdGhlaWdodDogcHgoc2l6ZS5saXN0X3Jvd19oZWlnaHQpLFxuXHRcdH0sXG5cdFx0XCIub2RkLXJvd1wiOiB7XG5cdFx0XHRcImJhY2tncm91bmQtY29sb3JcIjogdGhlbWUubGlzdF9iZyxcblx0XHR9LFxuXHRcdFwiLmxpc3QtbG9hZGluZ1wiOiB7XG5cdFx0XHRib3R0b206IDAsXG5cdFx0fSxcblx0XHQvLyBtYWlsIGxpc3Rcblx0XHRcIi50ZWFtTGFiZWxcIjoge1xuXHRcdFx0Y29sb3I6IHRoZW1lLmxpc3RfYWx0ZXJuYXRlX2JnLFxuXHRcdFx0XCJiYWNrZ3JvdW5kLWNvbG9yXCI6IHRoZW1lLmxpc3RfYWNjZW50X2ZnLFxuXHRcdH0sXG5cdFx0XCIuaW9uXCI6IHtcblx0XHRcdGRpc3BsYXk6IFwiaW5saW5lLWJsb2NrXCIsXG5cdFx0XHRcImZvbnQtZmFtaWx5XCI6IFwiJ0lvbmljb25zJ1wiLFxuXHRcdFx0c3BlYWs6IFwibm9uZVwiLFxuXHRcdFx0XCJmb250LXN0eWxlXCI6IFwibm9ybWFsXCIsXG5cdFx0XHRcImZvbnQtd2VpZ2h0XCI6IFwibm9ybWFsXCIsXG5cdFx0XHRcImZvbnQtdmFyaWFudFwiOiBcIm5vcm1hbFwiLFxuXHRcdFx0XCJ0ZXh0LXRyYW5zZm9ybVwiOiBcIm5vbmVcIixcblx0XHRcdFwidGV4dC1yZW5kZXJpbmdcIjogXCJhdXRvXCIsXG5cdFx0XHRcImxpbmUtaGVpZ2h0XCI6IFwiMVwiLFxuXHRcdFx0XCItd2Via2l0LWZvbnQtc21vb3RoaW5nXCI6IFwiYW50aWFsaWFzZWRcIixcblx0XHRcdFwiLW1vei1vc3gtZm9udC1zbW9vdGhpbmdcIjogXCJncmF5c2NhbGVcIixcblx0XHR9LFxuXHRcdFwiLmJhZGdlLWxpbmUtaGVpZ2h0XCI6IHtcblx0XHRcdFwibGluZS1oZWlnaHRcIjogcHgoMTgpLFxuXHRcdH0sXG5cdFx0XCIubGlzdC1mb250LWljb25zXCI6IHtcblx0XHRcdFwibGV0dGVyLXNwYWNpbmdcIjogXCIxcHhcIixcblx0XHRcdFwidGV4dC1hbGlnblwiOiBcInJpZ2h0XCIsXG5cdFx0XHRcIm1hcmdpbi1yaWdodFwiOiBcIi0zcHhcIixcblx0XHR9LFxuXHRcdFwiLm1vbm9zcGFjZVwiOiB7XG5cdFx0XHRcImZvbnQtZmFtaWx5XCI6ICdcIkx1Y2lkYSBDb25zb2xlXCIsIE1vbmFjbywgbW9ub3NwYWNlJyxcblx0XHR9LFxuXHRcdFwiLmhpZGRlblwiOiB7XG5cdFx0XHR2aXNpYmlsaXR5OiBcImhpZGRlblwiLFxuXHRcdH0sXG5cdFx0Ly8gYWN0aW9uIGJhclxuXHRcdFwiLmFjdGlvbi1iYXJcIjoge1xuXHRcdFx0d2lkdGg6IFwiaW5pdGlhbFwiLFxuXHRcdFx0XCJtYXJnaW4tbGVmdFwiOiBcImF1dG9cIixcblx0XHR9LFxuXHRcdFwiLm1sLWJldHdlZW4tcyA+IDpub3QoOmZpcnN0LWNoaWxkKVwiOiB7XG5cdFx0XHRcIm1hcmdpbi1sZWZ0XCI6IHB4KHNpemUuaHBhZF9zbWFsbCksXG5cdFx0fSxcblx0XHRcIi5tdC1iZXR3ZWVuLXMgPiA6bm90KDpmaXJzdC1jaGlsZClcIjoge1xuXHRcdFx0XCJtYXJnaW4tdG9wXCI6IHB4KHNpemUuaHBhZF9zbWFsbCksXG5cdFx0fSxcblx0XHRcIi5tdC1iZXR3ZWVuLW0gPiA6bm90KDpmaXJzdC1jaGlsZClcIjoge1xuXHRcdFx0XCJtYXJnaW4tdG9wXCI6IHB4KHNpemUuaHBhZCksXG5cdFx0fSxcblx0XHQvLyBkcm9wZG93blxuXHRcdFwiLmRyb3Bkb3duLXBhbmVsXCI6IHtcblx0XHRcdHBvc2l0aW9uOiBcImFic29sdXRlXCIsXG5cdFx0XHR3aWR0aDogMCxcblx0XHRcdGhlaWdodDogMCxcblx0XHRcdG92ZXJmbG93OiBcImhpZGRlblwiLCAvLyB3aGlsZSB0aGUgZHJvcGRvd24gaXMgc2xpZGVkIG9wZW4gd2UgZG8gbm90IHdhbnQgdG8gc2hvdyB0aGUgc2Nyb2xsYmFycy4gb3ZlcmZsb3cteSBpcyBsYXRlciBvdmVyd3JpdHRlbiB0byBzaG93IHNjcm9sbGJhcnMgaWYgbmVjZXNzYXJ5XG5cdFx0fSxcblx0XHRcIi5kcm9wZG93bi1wYW5lbC1zY3JvbGxhYmxlXCI6IHtcblx0XHRcdHBvc2l0aW9uOiBcImFic29sdXRlXCIsXG5cdFx0XHR3aWR0aDogMCxcblx0XHRcdGhlaWdodDogMCxcblx0XHRcdFwib3ZlcmZsb3cteFwiOiBcImhpZGRlblwiLFxuXHRcdFx0XCJvdmVyZmxvdy15XCI6IFwiYXV0b1wiLFxuXHRcdH0sXG5cdFx0XCIuZHJvcGRvd24tcGFuZWwuZml0LWNvbnRlbnQsIC5kcm9wZG93bi1wYW5lbC5maXQtY29udGVudCAuZHJvcGRvd24tY29udGVudFwiOiB7XG5cdFx0XHRcIm1pbi13aWR0aFwiOiBcImZpdC1jb250ZW50XCIsXG5cdFx0fSxcblx0XHRcIi5kcm9wZG93bi1jb250ZW50OmZpcnN0LWNoaWxkXCI6IHtcblx0XHRcdFwicGFkZGluZy10b3BcIjogcHgoc2l6ZS52cGFkX3NtYWxsKSxcblx0XHR9LFxuXHRcdFwiLmRyb3Bkb3duLWNvbnRlbnQ6bGFzdC1jaGlsZFwiOiB7XG5cdFx0XHRcInBhZGRpbmctYm90dG9tXCI6IHB4KHNpemUudnBhZF9zbWFsbCksXG5cdFx0fSxcblx0XHRcIi5kcm9wZG93bi1jb250ZW50LCAuZHJvcGRvd24tY29udGVudCA+ICpcIjoge1xuXHRcdFx0d2lkdGg6IFwiMTAwJVwiLFxuXHRcdH0sXG5cdFx0XCIuZHJvcGRvd24tc2hhZG93XCI6IHtcblx0XHRcdFwiYm94LXNoYWRvd1wiOiBib3hTaGFkb3csXG5cdFx0fSxcblx0XHRcIi5taW5pbWl6ZWQtc2hhZG93XCI6IHtcblx0XHRcdC8vIHNoYWRvdyBwYXJhbXM6IDEub2Zmc2V0LXggMi5vZmZzZXQteSAzLmJsdXIgNC5zcHJlYWQgNS5jb2xvclxuXHRcdFx0XCJib3gtc2hhZG93XCI6IGAwcHggMHB4IDRweCAycHggJHt0aGVtZS5oZWFkZXJfYm94X3NoYWRvd19iZ31gLCAvLyBzaW1pbGFyIHRvIGhlYWRlciBiYXIgc2hhZG93XG5cdFx0fSxcblx0XHQvL2Ryb3Bkb3duIGZpbHRlciBiYXJcblx0XHRcIi5kcm9wZG93bi1iYXJcIjoge1xuXHRcdFx0XCJib3JkZXItc3R5bGVcIjogXCJzb2xpZFwiLFxuXHRcdFx0XCJib3JkZXItd2lkdGhcIjogXCIwcHggMHB4IDFweCAwcHhcIixcblx0XHRcdFwiYm9yZGVyLWNvbG9yXCI6IHRoZW1lLmNvbnRlbnRfYm9yZGVyLFxuXHRcdFx0XCJwYWRkaW5nLWJvdHRvbVwiOiBcIjFweFwiLFxuXHRcdFx0XCJ6LWluZGV4XCI6IDEsXG5cdFx0XHRcImJvcmRlci1yYWRpdXNcIjogYCR7c2l6ZS5ib3JkZXJfcmFkaXVzfXB4ICR7c2l6ZS5ib3JkZXJfcmFkaXVzfXB4IDAgMGAsXG5cdFx0XHRjb2xvcjogdGhlbWUuY29udGVudF9mZyxcblx0XHR9LFxuXHRcdFwiLmRyb3Bkb3duLWJhcjpmb2N1c1wiOiB7XG5cdFx0XHRcImJvcmRlci1zdHlsZVwiOiBcInNvbGlkXCIsXG5cdFx0XHRcImJvcmRlci13aWR0aFwiOiBcIjBweCAwcHggMnB4IDBweFwiLFxuXHRcdFx0XCJib3JkZXItY29sb3JcIjogYCR7dGhlbWUuY29udGVudF9hY2NlbnR9YCxcblx0XHRcdFwicGFkZGluZy1ib3R0b21cIjogXCIwcHhcIixcblx0XHR9LFxuXHRcdFwiLmRyb3Bkb3duLWJ1dHRvblwiOiB7XG5cdFx0XHRoZWlnaHQ6IHB4KHNpemUuYnV0dG9uX2hlaWdodCksXG5cdFx0XHRcInBhZGRpbmctbGVmdFwiOiBweChzaXplLnZwYWQpLFxuXHRcdFx0XCJwYWRkaW5nLXJpZ2h0XCI6IHB4KHNpemUudnBhZCksXG5cdFx0fSxcblx0XHRcImJ1dHRvbiwgLm5hdi1idXR0b25cIjoge1xuXHRcdFx0Ym9yZGVyOiAwLFxuXHRcdFx0Y3Vyc29yOiBcInBvaW50ZXJcIixcblx0XHRcdG92ZXJmbG93OiBcImhpZGRlblwiLFxuXHRcdFx0XCJ3aGl0ZS1zcGFjZVwiOiBcIm5vd3JhcFwiLFxuXHRcdFx0bWFyZ2luOiAwLFxuXHRcdFx0Ly8gZm9yIHNhZmFyaVxuXHRcdFx0XCJmbGV4LXNocmlua1wiOiAwLFxuXHRcdFx0XCItd2Via2l0LXRhcC1oaWdobGlnaHQtY29sb3JcIjogXCJyZ2JhKDI1NSwgMjU1LCAyNTUsIDApXCIsXG5cdFx0fSxcblx0XHRcIi5uYXYtYnV0dG9uOmhvdmVyXCI6ICFpc0FwcCgpXG5cdFx0XHQ/IHtcblx0XHRcdFx0XHQvLyBcInRleHQtZGVjb3JhdGlvblwiOiBcInVuZGVybGluZVwiLFxuXHRcdFx0XHRcdC8vIG9wYWNpdHk6IDAuNyxcblx0XHRcdCAgfVxuXHRcdFx0OiB7fSxcblx0XHRcIi5uYXYtYnV0dG9uOmZvY3VzXCI6IGNsaWVudC5pc0Rlc2t0b3BEZXZpY2UoKVxuXHRcdFx0PyB7XG5cdFx0XHRcdFx0Ly8gXCJ0ZXh0LWRlY29yYXRpb25cIjogXCJ1bmRlcmxpbmVcIixcblx0XHRcdFx0XHQvLyBvcGFjaXR5OiAwLjcsXG5cdFx0XHQgIH1cblx0XHRcdDoge30sXG5cdFx0XCJidXR0b246Zm9jdXMsIGJ1dHRvbjpob3ZlclwiOiBjbGllbnQuaXNEZXNrdG9wRGV2aWNlKClcblx0XHRcdD8ge1xuXHRcdFx0XHRcdG9wYWNpdHk6IDAuNyxcblx0XHRcdCAgfVxuXHRcdFx0OiB7fSxcblx0XHRcIi5idXR0b24taWNvblwiOiB7XG5cdFx0XHR3aWR0aDogcHgoc2l6ZS5idXR0b25faWNvbl9iZ19zaXplKSxcblx0XHRcdGhlaWdodDogcHgoc2l6ZS5idXR0b25faWNvbl9iZ19zaXplKSxcblx0XHRcdFwiYm9yZGVyLXJhZGl1c1wiOiBweChzaXplLmJ1dHRvbl9pY29uX2JnX3NpemUpLFxuXHRcdFx0XCJtaW4td2lkdGhcIjogcHgoc2l6ZS5idXR0b25faWNvbl9iZ19zaXplKSxcblx0XHR9LFxuXHRcdFwiLmxvZ2luXCI6IHtcblx0XHRcdHdpZHRoOiBcIjEwMCVcIixcblx0XHRcdFwiYm9yZGVyLXJhZGl1c1wiOiBweChzaXplLmJvcmRlcl9yYWRpdXMpLFxuXHRcdH0sXG5cdFx0XCIuc21hbGwtbG9naW4tYnV0dG9uXCI6IHtcblx0XHRcdHdpZHRoOiBcIjI2MHB4XCIsXG5cdFx0fSxcblx0XHRcIi5idXR0b24tY29udGVudFwiOiB7XG5cdFx0XHRoZWlnaHQ6IHB4KHNpemUuYnV0dG9uX2hlaWdodCksXG5cdFx0XHRcIm1pbi13aWR0aFwiOiBweChzaXplLmJ1dHRvbl9oZWlnaHQpLFxuXHRcdH0sXG5cdFx0XCIudGV4dC1idWJibGVcIjoge1xuXHRcdFx0XCJwYWRkaW5nLXRvcFwiOiBweChzaXplLnRleHRfYnViYmxlX3RwYWQpLFxuXHRcdH0sXG5cdFx0XCIuYnViYmxlXCI6IHtcblx0XHRcdFwiYm9yZGVyLXJhZGl1c1wiOiBweChzaXplLmJvcmRlcl9yYWRpdXMpLFxuXHRcdFx0XCJiYWNrZ3JvdW5kLWNvbG9yXCI6IHRoZW1lLmJ1dHRvbl9idWJibGVfYmcsXG5cdFx0XHRjb2xvcjogdGhlbWUuYnV0dG9uX2J1YmJsZV9mZyxcblx0XHR9LFxuXHRcdFwiLmtleXdvcmQtYnViYmxlXCI6IHtcblx0XHRcdFwibWF4LXdpZHRoXCI6IFwiMzAwcHhcIixcblx0XHRcdFwiYm9yZGVyLXJhZGl1c1wiOiBweChzaXplLmJvcmRlcl9yYWRpdXMpLFxuXHRcdFx0XCJtYXJnaW4tYm90dG9tXCI6IHB4KHNpemUudnBhZF9zbWFsbCAvIDIpLFxuXHRcdFx0XCJtYXJnaW4tcmlnaHRcIjogcHgoc2l6ZS52cGFkX3NtYWxsIC8gMiksXG5cdFx0XHRcImJhY2tncm91bmQtY29sb3JcIjogdGhlbWUuYnV0dG9uX2J1YmJsZV9iZyxcblx0XHRcdHBhZGRpbmc6IGAke3B4KHNpemUudnBhZF9zbWFsbCAvIDIpfSAke3B4KHNpemUudnBhZF9zbWFsbCl9ICR7cHgoc2l6ZS52cGFkX3NtYWxsIC8gMil9ICR7cHgoc2l6ZS52cGFkX3NtYWxsKX1gLFxuXHRcdH0sXG5cdFx0XCIua2V5d29yZC1idWJibGUtbm8tcGFkZGluZ1wiOiB7XG5cdFx0XHRcIm1heC13aWR0aFwiOiBcIjMwMHB4XCIsXG5cdFx0XHRcImJvcmRlci1yYWRpdXNcIjogcHgoc2l6ZS5ib3JkZXJfcmFkaXVzKSxcblx0XHRcdG1hcmdpbjogcHgoc2l6ZS52cGFkX3NtYWxsIC8gMiksXG5cdFx0XHRcImJhY2tncm91bmQtY29sb3JcIjogdGhlbWUuYnV0dG9uX2J1YmJsZV9iZyxcblx0XHR9LFxuXHRcdFwiLmJ1YmJsZS1jb2xvclwiOiB7XG5cdFx0XHRcImJhY2tncm91bmQtY29sb3JcIjogdGhlbWUuYnV0dG9uX2J1YmJsZV9iZyxcblx0XHRcdGNvbG9yOiB0aGVtZS5idXR0b25fYnViYmxlX2ZnLFxuXHRcdH0sXG5cdFx0bWFyazoge1xuXHRcdFx0Ly8gJ2JhY2tncm91bmQtY29sb3InOiB0aGVtZS5jb250ZW50X2J1dHRvbixcblx0XHRcdC8vICdjb2xvcic6IHRoZW1lLmNvbnRlbnRfYnV0dG9uX2ljb24sXG5cdFx0XHRcImJhY2tncm91bmQtY29sb3JcIjogdGhlbWUuY29udGVudF9hY2NlbnQsXG5cdFx0XHRjb2xvcjogdGhlbWUuY29udGVudF9idXR0b25faWNvbl9zZWxlY3RlZCxcblx0XHR9LFxuXHRcdFwiLnNlZ21lbnRDb250cm9sXCI6IHtcblx0XHRcdC8vIHNhbWUgYm9yZGVyIGFzIGZvciBidWJibGUgYnV0dG9uc1xuXHRcdFx0XCJib3JkZXItdG9wXCI6IGAke3B4KChzaXplLmJ1dHRvbl9oZWlnaHQgLSBzaXplLmJ1dHRvbl9oZWlnaHRfYnViYmxlKSAvIDIpfSBzb2xpZCB0cmFuc3BhcmVudGAsXG5cdFx0XHRcImJvcmRlci1ib3R0b21cIjogYCR7cHgoKHNpemUuYnV0dG9uX2hlaWdodCAtIHNpemUuYnV0dG9uX2hlaWdodF9idWJibGUpIC8gMil9IHNvbGlkIHRyYW5zcGFyZW50YCxcblx0XHR9LFxuXHRcdFwiLnNlZ21lbnRDb250cm9sLWJvcmRlclwiOiB7XG5cdFx0XHRib3JkZXI6IGAxcHggc29saWQgJHt0aGVtZS5jb250ZW50X2JvcmRlcn1gLFxuXHRcdFx0XCJwYWRkaW5nLXRvcFwiOiBweCgxKSxcblx0XHRcdFwicGFkZGluZy1ib3R0b21cIjogcHgoMSksXG5cdFx0XHRcInBhZGRpbmctbGVmdFwiOiBweCgxKSxcblx0XHRcdFwicGFkZGluZy1yaWdodFwiOiBweCgxKSxcblx0XHR9LFxuXHRcdFwiLnNlZ21lbnRDb250cm9sLWJvcmRlci1hY3RpdmVcIjoge1xuXHRcdFx0Ym9yZGVyOiBgMnB4IHNvbGlkICR7dGhlbWUuY29udGVudF9hY2NlbnR9YCxcblx0XHRcdFwicGFkZGluZy10b3BcIjogcHgoMCksXG5cdFx0XHRcInBhZGRpbmctYm90dG9tXCI6IHB4KDApLFxuXHRcdFx0XCJwYWRkaW5nLWxlZnRcIjogcHgoMCksXG5cdFx0XHRcInBhZGRpbmctcmlnaHRcIjogcHgoMCksXG5cdFx0fSxcblx0XHRcIi5zZWdtZW50Q29udHJvbC1ib3JkZXItYWN0aXZlLWN5YmVyLW1vbmRheVwiOiB7XG5cdFx0XHRib3JkZXI6IGAycHggc29saWQgJHt0aGVtZS5jb250ZW50X2FjY2VudF9jeWJlcl9tb25kYXl9YCxcblx0XHR9LFxuXHRcdFwiLnNlZ21lbnRDb250cm9sSXRlbVwiOiB7XG5cdFx0XHRjdXJzb3I6IFwicG9pbnRlclwiLFxuXHRcdFx0YmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuXHRcdH0sXG5cdFx0XCIuc2VnbWVudENvbnRyb2xJdGVtOmxhc3QtY2hpbGRcIjoge1xuXHRcdFx0XCJib3JkZXItYm90dG9tLXJpZ2h0LXJhZGl1c1wiOiBweChzaXplLmJvcmRlcl9yYWRpdXNfc21hbGwpLFxuXHRcdFx0XCJib3JkZXItdG9wLXJpZ2h0LXJhZGl1c1wiOiBweChzaXplLmJvcmRlcl9yYWRpdXNfc21hbGwpLFxuXHRcdH0sXG5cdFx0XCIuc2VnbWVudENvbnRyb2xJdGVtOmZpcnN0LWNoaWxkXCI6IHtcblx0XHRcdFwiYm9yZGVyLWJvdHRvbS1sZWZ0LXJhZGl1c1wiOiBweChzaXplLmJvcmRlcl9yYWRpdXNfc21hbGwpLFxuXHRcdFx0XCJib3JkZXItdG9wLWxlZnQtcmFkaXVzXCI6IHB4KHNpemUuYm9yZGVyX3JhZGl1c19zbWFsbCksXG5cdFx0fSxcblxuXHRcdC8vIEljb25TZWdtZW50Q29udHJvbFxuXHRcdFwiLmljb24tc2VnbWVudC1jb250cm9sXCI6IHtcblx0XHRcdFwiYm9yZGVyLXJhZGl1c1wiOiBweChzaXplLmJvcmRlcl9yYWRpdXMpLFxuXHRcdH0sXG5cdFx0XCIuaWNvbi1zZWdtZW50LWNvbnRyb2wtaXRlbVwiOiB7XG5cdFx0XHQvLyBNYWtlIHRoaW4gYm9yZGVyIGJldHdlZW4gaXRlbXMgdmlhIGJvcmRlci1yaWdodFxuXHRcdFx0XCJib3JkZXItdG9wXCI6IGAxcHggc29saWQgJHtzdGF0ZUJnSG92ZXJ9YCxcblx0XHRcdFwiYm9yZGVyLWJvdHRvbVwiOiBgMXB4IHNvbGlkICR7c3RhdGVCZ0hvdmVyfWAsXG5cdFx0XHRcImJvcmRlci1yaWdodFwiOiBgMC41cHggc29saWQgJHtzdGF0ZUJnSG92ZXJ9YCxcblx0XHRcdHdpZHRoOiBweChzaXplLmljb25fc2VnbWVudF9jb250cm9sX2J1dHRvbl93aWR0aCksXG5cdFx0XHRoZWlnaHQ6IHB4KHNpemUuaWNvbl9zZWdtZW50X2NvbnRyb2xfYnV0dG9uX2hlaWdodCksXG5cdFx0XHRjdXJzb3I6IFwicG9pbnRlclwiLFxuXHRcdFx0YmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuXHRcdH0sXG5cdFx0XCIuaWNvbi1zZWdtZW50LWNvbnRyb2wtaXRlbVthY3RpdmVdXCI6IHtcblx0XHRcdGJhY2tncm91bmQ6IHN0YXRlQmdIb3Zlcixcblx0XHRcdFwidHJhbnNpdGlvbi1kdXJhdGlvblwiOiBcIi4zc1wiLFxuXHRcdH0sXG5cdFx0XCIuaWNvbi1zZWdtZW50LWNvbnRyb2wtaXRlbTpmaXJzdC1jaGlsZFwiOiB7XG5cdFx0XHRcImJvcmRlci1ib3R0b20tbGVmdC1yYWRpdXNcIjogcHgoc2l6ZS5ib3JkZXJfcmFkaXVzKSxcblx0XHRcdFwiYm9yZGVyLXRvcC1sZWZ0LXJhZGl1c1wiOiBweChzaXplLmJvcmRlcl9yYWRpdXMpLFxuXHRcdFx0XCJib3JkZXItbGVmdFwiOiBgMXB4IHNvbGlkICR7c3RhdGVCZ0hvdmVyfWAsXG5cdFx0fSxcblx0XHRcIi5pY29uLXNlZ21lbnQtY29udHJvbC1pdGVtOmxhc3QtY2hpbGRcIjoge1xuXHRcdFx0XCJib3JkZXItYm90dG9tLXJpZ2h0LXJhZGl1c1wiOiBweChzaXplLmJvcmRlcl9yYWRpdXMpLFxuXHRcdFx0XCJib3JkZXItdG9wLXJpZ2h0LXJhZGl1c1wiOiBweChzaXplLmJvcmRlcl9yYWRpdXMpLFxuXHRcdFx0XCJib3JkZXItcmlnaHRcIjogYDFweCBzb2xpZCAke3N0YXRlQmdIb3Zlcn1gLFxuXHRcdH0sXG5cdFx0XCIucGF5bWVudC1sb2dvXCI6IHtcblx0XHRcdC8vIHRoYXQncyB0aGUgc2l6ZSBvZiB0aGUgU1ZHIGFuZCBpdCBzZWVtcyB0byBiZSBhIGdvb2Qgc2l6ZVxuXHRcdFx0d2lkdGg6IFwiMTI0cHhcIixcblx0XHR9LFxuXHRcdFwiLm9uYm9hcmRpbmctbG9nbywgLm9uYm9hcmRpbmctbG9nbyA+IHN2Z1wiOiB7XG5cdFx0XHR3aWR0aDogXCJmaXQtY29udGVudFwiLFxuXHRcdFx0aGVpZ2h0OiBweCgxNjApLFxuXHRcdH0sXG5cdFx0XCIub25ib2FyZGluZy1sb2dvLWxhcmdlLCAub25ib2FyZGluZy1sb2dvLWxhcmdlID4gc3ZnXCI6IHtcblx0XHRcdHdpZHRoOiBcImZpdC1jb250ZW50XCIsXG5cdFx0XHQvLyBUaGlzIHZhbHVlIGJyaW5ncyB0aGUgYm90dG9tIG9mIHRoZSBpbGx1c3RyYXRpb24gaW5saW5lIHdpdGggdGhlIGZpcnN0IGJ1dHRvbiBvbiB0aGUgbm90aWZpY2F0aW9ucyBwYWdlXG5cdFx0XHRoZWlnaHQ6IHB4KDIyMiksXG5cdFx0fSxcblx0XHRcInNldHRpbmdzLWlsbHVzdHJhdGlvbi1sYXJnZSwgLnNldHRpbmdzLWlsbHVzdHJhdGlvbi1sYXJnZSA+IHN2Z1wiOiB7XG5cdFx0XHR3aWR0aDogXCJmdWxsLXdpZHRoXCIsXG5cdFx0XHRoZWlnaHQ6IFwiZml0LWNvbnRlbnRcIixcblx0XHR9LFxuXHRcdC8vIGNvbnRhY3Rcblx0XHRcIi53cmFwcGluZy1yb3dcIjoge1xuXHRcdFx0ZGlzcGxheTogXCJmbGV4XCIsXG5cdFx0XHRcImZsZXgtZmxvd1wiOiBcInJvdyB3cmFwXCIsXG5cdFx0XHRcIm1hcmdpbi1yaWdodFwiOiBweCgtc2l6ZS5ocGFkX2xhcmdlKSxcblx0XHR9LFxuXHRcdFwiLndyYXBwaW5nLXJvdyA+ICpcIjoge1xuXHRcdFx0ZmxleDogXCIxIDAgNDAlXCIsXG5cdFx0XHRcIm1hcmdpbi1yaWdodFwiOiBweChzaXplLmhwYWRfbGFyZ2UpLFxuXHRcdFx0XCJtaW4td2lkdGhcIjogcHgoMjAwKSwgLy8gbWFrZXMgc3VyZSB0aGUgcm93IGlzIHdyYXBwZWQgd2l0aCB0b28gbGFyZ2UgY29udGVudFxuXHRcdH0sXG5cdFx0XCIubm9uLXdyYXBwaW5nLXJvd1wiOiB7XG5cdFx0XHRkaXNwbGF5OiBcImZsZXhcIixcblx0XHRcdFwiZmxleC1mbG93XCI6IFwicm93XCIsXG5cdFx0XHRcIm1hcmdpbi1yaWdodFwiOiBweCgtc2l6ZS5ocGFkX2xhcmdlKSxcblx0XHR9LFxuXHRcdFwiLm5vbi13cmFwcGluZy1yb3cgPiAqXCI6IHtcblx0XHRcdGZsZXg6IFwiMSAwIDQwJVwiLFxuXHRcdFx0XCJtYXJnaW4tcmlnaHRcIjogcHgoc2l6ZS5ocGFkX2xhcmdlKSxcblx0XHR9LFxuXHRcdC8vIHRleHQgaW5wdXQgZmllbGRcblx0XHRcIi5pbnB1dFdyYXBwZXJcIjoge1xuXHRcdFx0ZmxleDogXCIxIDEgYXV0b1wiLFxuXHRcdFx0YmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuXHRcdFx0b3ZlcmZsb3c6IFwiaGlkZGVuXCIsXG5cdFx0fSxcblx0XHQvLyB0ZXh0YXJlYVxuXHRcdFwiLmlucHV0LCAuaW5wdXQtYXJlYVwiOiB7XG5cdFx0XHRkaXNwbGF5OiBcImJsb2NrXCIsXG5cdFx0XHRyZXNpemU6IFwibm9uZVwiLFxuXHRcdFx0Ym9yZGVyOiAwLFxuXHRcdFx0cGFkZGluZzogMCxcblx0XHRcdG1hcmdpbjogMCxcblx0XHRcdC8vIGZvciBzYWZhcmkgYnJvd3NlclxuXHRcdFx0YmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuXHRcdFx0d2lkdGg6IFwiMTAwJVwiLFxuXHRcdFx0b3ZlcmZsb3c6IFwiaGlkZGVuXCIsXG5cdFx0XHRjb2xvcjogdGhlbWUuY29udGVudF9mZyxcblx0XHR9LFxuXHRcdFwiLmlucHV0LW5vLWNsZWFyOjotbXMtY2xlYXJcIjoge1xuXHRcdFx0Ly8gcmVtb3ZlIHRoZSBjbGVhciAoeCkgYnV0dG9uIGZyb20gZWRnZSBpbnB1dCBmaWVsZHNcblx0XHRcdGRpc3BsYXk6IFwibm9uZVwiLFxuXHRcdH0sXG5cdFx0XCIucmVzaXplLW5vbmVcIjoge1xuXHRcdFx0cmVzaXplOiBcIm5vbmVcIixcblx0XHR9LFxuXHRcdC8vIHRhYmxlXG5cdFx0XCIudGFibGVcIjoge1xuXHRcdFx0XCJib3JkZXItY29sbGFwc2VcIjogXCJjb2xsYXBzZVwiLFxuXHRcdFx0XCJ0YWJsZS1sYXlvdXRcIjogXCJmaXhlZFwiLFxuXHRcdFx0d2lkdGg6IFwiMTAwJVwiLFxuXHRcdH0sXG5cdFx0XCIudGFibGUtaGVhZGVyLWJvcmRlciB0cjpmaXJzdC1jaGlsZFwiOiB7XG5cdFx0XHRcImJvcmRlci1ib3R0b21cIjogYDFweCBzb2xpZCAke3RoZW1lLmNvbnRlbnRfYm9yZGVyfWAsXG5cdFx0fSxcblx0XHRcIi50YWJsZSB0ZFwiOiB7XG5cdFx0XHRcInZlcnRpY2FsLWFsaWduXCI6IFwibWlkZGxlXCIsXG5cdFx0fSxcblx0XHR0ZDoge1xuXHRcdFx0cGFkZGluZzogMCxcblx0XHR9LFxuXHRcdFwiLmNvbHVtbi13aWR0aC1zbWFsbFwiOiB7XG5cdFx0XHR3aWR0aDogcHgoc2l6ZS5jb2x1bW5fd2lkdGhfc19kZXNrdG9wKSxcblx0XHR9LFxuXHRcdFwiLmNvbHVtbi13aWR0aC1sYXJnZXN0XCI6IHt9LFxuXHRcdFwiLmJ1eU9wdGlvbkJveFwiOiB7XG5cdFx0XHRwb3NpdGlvbjogXCJyZWxhdGl2ZVwiLFxuXHRcdFx0ZGlzcGxheTogXCJpbmxpbmUtYmxvY2tcIixcblx0XHRcdGJvcmRlcjogYDFweCBzb2xpZCAke3RoZW1lLmNvbnRlbnRfYm9yZGVyfWAsXG5cdFx0XHR3aWR0aDogXCIxMDAlXCIsXG5cdFx0XHRwYWRkaW5nOiBweCgxMCksXG5cdFx0fSxcblx0XHRcIi5wbGFucy1ncmlkXCI6IHtcblx0XHRcdGRpc3BsYXk6IFwiZ3JpZFwiLFxuXHRcdFx0XCJncmlkLXRlbXBsYXRlLWNvbHVtbnNcIjogXCIxZnJcIixcblx0XHRcdFwiZ3JpZC1hdXRvLWZsb3dcIjogXCJjb2x1bW5cIixcblx0XHRcdFwiZ3JpZC10ZW1wbGF0ZS1yb3dzXCI6IFwiYXV0byAxZnJcIixcblx0XHR9LFxuXHRcdFwiQG1lZGlhIChtYXgtd2lkdGg6IDk5MnB4KVwiOiB7XG5cdFx0XHRcIi5wbGFucy1ncmlkXCI6IHtcblx0XHRcdFx0XCJncmlkLXRlbXBsYXRlLXJvd3NcIjogXCJhdXRvIDFmciBhdXRvIDFmclwiLFxuXHRcdFx0fSxcblx0XHRcdFwiLnBsYW5zLWdyaWQgPiBkaXY6bnRoLWNoaWxkKDMpLCAucGxhbnMtZ3JpZCA+IGRpdjpudGgtY2hpbGQoNClcIjoge1xuXHRcdFx0XHRvcmRlcjogMSxcblx0XHRcdH0sXG5cdFx0XHRcIi5wbGFucy1ncmlkID4gZGl2Om50aC1jaGlsZCg1KSwgLnBsYW5zLWdyaWQgPiBkaXY6bnRoLWNoaWxkKDYpXCI6IHtcblx0XHRcdFx0XCJncmlkLWNvbHVtblwiOiBcIjEgLyAzXCIsXG5cdFx0XHRcdFwianVzdGlmeS1zZWxmXCI6IFwiY2VudGVyXCIsXG5cdFx0XHR9LFxuXHRcdFx0XCIucGxhbnMtZ3JpZCA+IGRpdjpudGgtY2hpbGQoNSlcIjoge1xuXHRcdFx0XHRcImdyaWQtcm93LXN0YXJ0XCI6IDMsXG5cdFx0XHR9LFxuXHRcdFx0XCIucGxhbnMtZ3JpZCA+IGRpdjpudGgtY2hpbGQoNilcIjoge1xuXHRcdFx0XHRcImdyaWQtcm93LXN0YXJ0XCI6IDQsXG5cdFx0XHR9LFxuXHRcdH0sXG5cdFx0XCJAbWVkaWEgKG1heC13aWR0aDogNjAwcHgpXCI6IHtcblx0XHRcdFwiLnBsYW5zLWdyaWRcIjoge1xuXHRcdFx0XHRcImdyaWQtdGVtcGxhdGUtcm93c1wiOiBcImF1dG8gbWluLWNvbnRlbnQgYXV0byBtaW4tY29udGVudCBhdXRvIG1pbi1jb250ZW50XCIsXG5cdFx0XHR9LFxuXHRcdFx0XCIucGxhbnMtZ3JpZCA+IGRpdjpudGgtY2hpbGQoMyksIC5wbGFucy1ncmlkID4gZGl2Om50aC1jaGlsZCg0KVwiOiB7XG5cdFx0XHRcdG9yZGVyOiBcInVuc2V0XCIsXG5cdFx0XHR9LFxuXHRcdFx0XCIucGxhbnMtZ3JpZCA+IGRpdjpudGgtY2hpbGQoNSksIC5wbGFucy1ncmlkID4gZGl2Om50aC1jaGlsZCg2KVwiOiB7XG5cdFx0XHRcdFwiZ3JpZC1jb2x1bW5cIjogXCJ1bnNldFwiLFxuXHRcdFx0fSxcblx0XHRcdFwiLnBsYW5zLWdyaWQgPiBkaXY6bnRoLWNoaWxkKDUpXCI6IHtcblx0XHRcdFx0XCJncmlkLXJvdy1zdGFydFwiOiBcInVuc2V0XCIsXG5cdFx0XHR9LFxuXHRcdFx0XCIucGxhbnMtZ3JpZCA+IGRpdjpudGgtY2hpbGQoNilcIjoge1xuXHRcdFx0XHRcImdyaWQtcm93LXN0YXJ0XCI6IFwidW5zZXRcIixcblx0XHRcdH0sXG5cdFx0fSxcblx0XHRcIi5idXlPcHRpb25Cb3guYWN0aXZlXCI6IHtcblx0XHRcdGJvcmRlcjogYDFweCBzb2xpZCAke3RoZW1lLmNvbnRlbnRfYWNjZW50fWAsXG5cdFx0fSxcblx0XHRcIi5idXlPcHRpb25Cb3guaGlnaGxpZ2h0ZWRcIjoge1xuXHRcdFx0Ym9yZGVyOiBgMnB4IHNvbGlkICR7dGhlbWUuY29udGVudF9hY2NlbnR9YCxcblx0XHRcdHBhZGRpbmc6IHB4KDkpLFxuXHRcdH0sXG5cdFx0XCIuYnV5T3B0aW9uQm94LmhpZ2hsaWdodGVkLmN5YmVyTW9uZGF5XCI6IHtcblx0XHRcdGJvcmRlcjogYDJweCBzb2xpZCAke3RoZW1lLmNvbnRlbnRfYWNjZW50X2N5YmVyX21vbmRheX1gLFxuXHRcdFx0cGFkZGluZzogcHgoOSksXG5cdFx0fSxcblx0XHRcIi5pbmZvLWJhZGdlXCI6IHtcblx0XHRcdFwiYm9yZGVyLXJhZGl1c1wiOiBweCg4KSxcblx0XHRcdFwibGluZS1oZWlnaHRcIjogcHgoMTYpLFxuXHRcdFx0XCJmb250LXNpemVcIjogcHgoMTIpLFxuXHRcdFx0XCJmb250LXdlaWdodFwiOiBcImJvbGRcIixcblx0XHRcdHdpZHRoOiBweCgxNiksXG5cdFx0XHRoZWlnaHQ6IHB4KDE2KSxcblx0XHRcdFwidGV4dC1hbGlnblwiOiBcImNlbnRlclwiLFxuXHRcdFx0Y29sb3I6IFwid2hpdGVcIixcblx0XHRcdGJhY2tncm91bmQ6IHRoZW1lLmNvbnRlbnRfYnV0dG9uLFxuXHRcdH0sXG5cdFx0XCIudG9vbHRpcFwiOiB7XG5cdFx0XHRwb3NpdGlvbjogXCJyZWxhdGl2ZVwiLFxuXHRcdFx0ZGlzcGxheTogXCJpbmxpbmUtYmxvY2tcIixcblx0XHR9LFxuXHRcdFwiLnRvb2x0aXAgLnRvb2x0aXB0ZXh0XCI6IHtcblx0XHRcdHZpc2liaWxpdHk6IFwiaGlkZGVuXCIsXG5cdFx0XHRcImJhY2tncm91bmQtY29sb3JcIjogdGhlbWUuY29udGVudF9idXR0b24sXG5cdFx0XHRjb2xvcjogdGhlbWUuY29udGVudF9iZyxcblx0XHRcdFwidGV4dC1hbGlnblwiOiBcImNlbnRlclwiLFxuXHRcdFx0cGFkZGluZzogXCI1cHggNXB4XCIsXG5cdFx0XHRcImJvcmRlci1yYWRpdXNcIjogcHgoNiksXG5cdFx0XHRwb3NpdGlvbjogXCJhYnNvbHV0ZVwiLFxuXHRcdFx0XCJ6LWluZGV4XCI6IDEsXG5cdFx0XHR0b3A6IFwiMTUwJVwiLFxuXHRcdFx0bGVmdDogXCI1MCVcIixcblx0XHR9LFxuXHRcdC8qIHdlJ3JlIHNlbGVjdGluZyBldmVyeSBlbGVtZW50IHRoYXQncyBhZnRlciBhIHN1bW1hcnkgdGFnIGFuZCBpcyBpbnNpZGUgYW4gb3BlbmVkIGRldGFpbHMgdGFnICovXG5cdFx0XCJkZXRhaWxzW29wZW5dIHN1bW1hcnkgfiAqXCI6IHtcblx0XHRcdGFuaW1hdGlvbjogXCJleHBhbmQgLjJzIGVhc2UtaW4tb3V0XCIsXG5cdFx0fSxcblx0XHRcIi5leHBhbmRcIjoge1xuXHRcdFx0YW5pbWF0aW9uOiBcImV4cGFuZCAuMnMgZWFzZS1pbi1vdXRcIixcblx0XHR9LFxuXHRcdFwiQGtleWZyYW1lcyBleHBhbmRcIjoge1xuXHRcdFx0XCIwJVwiOiB7XG5cdFx0XHRcdG9wYWNpdHk6IDAsXG5cdFx0XHRcdFwibWFyZ2luLXRvcFwiOiBcIi0xMHB4XCIsXG5cdFx0XHRcdGhlaWdodDogXCIwJVwiLFxuXHRcdFx0fSxcblx0XHRcdFwiMTAwJVwiOiB7XG5cdFx0XHRcdG9wYWNpdHk6IDEsXG5cdFx0XHRcdFwibWFyZ2luLXRvcFwiOiBweCgwKSxcblx0XHRcdFx0aGVpZ2h0OiBcIjEwMCVcIixcblx0XHRcdH0sXG5cdFx0fSxcblx0XHRcIi5pbmZvLWJhZGdlOmFjdGl2ZVwiOiB7XG5cdFx0XHRiYWNrZ3JvdW5kOiB0aGVtZS5jb250ZW50X2JnLFxuXHRcdFx0Y29sb3I6IHRoZW1lLmNvbnRlbnRfYnV0dG9uLFxuXHRcdH0sXG5cdFx0XCIudG9vbHRpcDpob3ZlciAudG9vbHRpcHRleHQsIC50b29sdGlwW2V4cGFuZGVkPXRydWVdIC50b29sdGlwdGV4dFwiOiB7XG5cdFx0XHR2aXNpYmlsaXR5OiBcInZpc2libGVcIixcblx0XHR9LFxuXHRcdFwiLnJpYmJvbi1ob3Jpem9udGFsXCI6IHtcblx0XHRcdHBvc2l0aW9uOiBcImFic29sdXRlXCIsXG5cdFx0XHRcIm1hcmdpbi1ib3R0b21cIjogXCI4MHB4XCIsXG5cdFx0XHRiYWNrZ3JvdW5kOiB0aGVtZS5jb250ZW50X2FjY2VudCxcblx0XHRcdHRvcDogXCI2OXB4XCIsXG5cdFx0XHRsZWZ0OiBcIi02cHhcIixcblx0XHRcdHJpZ2h0OiBcIi02cHhcIixcblx0XHRcdGNvbG9yOiB0aGVtZS5jb250ZW50X2JnLFxuXHRcdH0sXG5cdFx0XCIucmliYm9uLWhvcml6b250YWwtY3liZXItbW9uZGF5XCI6IHtcblx0XHRcdGJhY2tncm91bmQ6IHRoZW1lLmNvbnRlbnRfYmdfY3liZXJfbW9uZGF5LFxuXHRcdFx0Y29sb3I6IHRoZW1lLmNvbnRlbnRfYmcsXG5cdFx0fSxcblx0XHRcIi5yaWJib24taG9yaXpvbnRhbDphZnRlclwiOiB7XG5cdFx0XHRjb250ZW50OiAnXCJcIicsXG5cdFx0XHRwb3NpdGlvbjogXCJhYnNvbHV0ZVwiLFxuXHRcdFx0aGVpZ2h0OiAwLFxuXHRcdFx0d2lkdGg6IDAsXG5cdFx0XHRcImJvcmRlci1sZWZ0XCI6IGA2cHggc29saWQgJHt0aGVtZS5jb250ZW50X2FjY2VudH1gLFxuXHRcdFx0XCJib3JkZXItYm90dG9tXCI6IFwiNnB4IHNvbGlkIHRyYW5zcGFyZW50XCIsXG5cdFx0XHRib3R0b206IFwiLTZweFwiLFxuXHRcdFx0cmlnaHQ6IDAsXG5cdFx0fSxcblx0XHRcIi5yaWJib24taG9yaXpvbnRhbC1jeWJlci1tb25kYXk6YWZ0ZXJcIjoge1xuXHRcdFx0XCJib3JkZXItbGVmdFwiOiBgNnB4IHNvbGlkICR7dGhlbWUuY29udGVudF9iZ19jeWJlcl9tb25kYXl9YCxcblx0XHR9LFxuXHRcdFwiLnJpYmJvbi1ob3Jpem9udGFsOmJlZm9yZVwiOiB7XG5cdFx0XHRjb250ZW50OiAnXCJcIicsXG5cdFx0XHRwb3NpdGlvbjogXCJhYnNvbHV0ZVwiLFxuXHRcdFx0aGVpZ2h0OiAwLFxuXHRcdFx0d2lkdGg6IDAsXG5cdFx0XHRcImJvcmRlci1yaWdodFwiOiBgNnB4IHNvbGlkICR7dGhlbWUuY29udGVudF9hY2NlbnR9YCxcblx0XHRcdFwiYm9yZGVyLWJvdHRvbVwiOiBcIjZweCBzb2xpZCB0cmFuc3BhcmVudFwiLFxuXHRcdFx0Ym90dG9tOiBcIi02cHhcIixcblx0XHRcdGxlZnQ6IDAsXG5cdFx0fSxcblx0XHRcIi5yaWJib24taG9yaXpvbnRhbC1jeWJlci1tb25kYXk6YmVmb3JlXCI6IHtcblx0XHRcdFwiYm9yZGVyLXJpZ2h0XCI6IGA2cHggc29saWQgJHt0aGVtZS5jb250ZW50X2JnX2N5YmVyX21vbmRheX1gLFxuXHRcdH0sXG5cdFx0Ly8gY2FsZW5kYXJcblx0XHRcIi5mbGV4LWVuZC1vbi1jaGlsZCAuYnV0dG9uLWNvbnRlbnRcIjoge1xuXHRcdFx0XCJhbGlnbi1pdGVtc1wiOiBcImZsZXgtZW5kICFpbXBvcnRhbnRcIixcblx0XHR9LFxuXHRcdFwiLmNhbGVuZGFyLWNoZWNrYm94XCI6IHtcblx0XHRcdGhlaWdodDogcHgoMjIpLFxuXHRcdFx0d2lkdGg6IHB4KDIyKSxcblx0XHRcdFwiYm9yZGVyLXdpZHRoXCI6IFwiMS41cHhcIixcblx0XHRcdFwiYm9yZGVyLXN0eWxlXCI6IFwic29saWRcIixcblx0XHRcdFwiYm9yZGVyLXJhZGl1c1wiOiBcIjJweFwiLFxuXHRcdH0sXG5cdFx0XCIuY2hlY2tib3gtb3ZlcnJpZGVcIjoge1xuXHRcdFx0YXBwZWFyYW5jZTogXCJub25lXCIsXG5cdFx0XHRmb250OiBcImluaGVyaXRcIixcblx0XHRcdG1hcmdpbjogcHgoMCksXG5cdFx0XHRcIm1hcmdpbi1yaWdodFwiOiBweCg1KSxcblx0XHRcdHBvc2l0aW9uOiBcInJlbGF0aXZlXCIsXG5cdFx0XHRib3R0b206IHB4KC0yKSxcblx0XHR9LFxuXHRcdFwiLmNoZWNrYm94XCI6IHtcblx0XHRcdGFwcGVhcmFuY2U6IFwibm9uZVwiLFxuXHRcdFx0Ly8gcmVzZXQgYnJvd3NlciBzdHlsZVxuXHRcdFx0bWFyZ2luOiBcIjBcIixcblx0XHRcdGRpc3BsYXk6IFwiYmxvY2tcIixcblx0XHRcdHdpZHRoOiBweChzaXplLmNoZWNrYm94X3NpemUpLFxuXHRcdFx0aGVpZ2h0OiBweChzaXplLmNoZWNrYm94X3NpemUpLFxuXHRcdFx0Ym9yZGVyOiBgMnB4IHNvbGlkICR7dGhlbWUuY29udGVudF9idXR0b259YCxcblx0XHRcdFwiYm9yZGVyLXJhZGl1c1wiOiBcIjNweFwiLFxuXHRcdFx0cG9zaXRpb246IFwicmVsYXRpdmVcIixcblx0XHRcdHRyYW5zaXRpb246IGBib3JkZXIgJHtEZWZhdWx0QW5pbWF0aW9uVGltZX1tcyBjdWJpYy1iZXppZXIoLjQsLjAsLjIzLDEpYCxcblx0XHRcdG9wYWNpdHk6IFwiMC44XCIsXG5cdFx0fSxcblx0XHRcIi5jaGVja2JveDpob3ZlclwiOiB7XG5cdFx0XHRvcGFjaXR5OiBcIjFcIixcblx0XHR9LFxuXHRcdFwiLmNoZWNrYm94OmNoZWNrZWRcIjoge1xuXHRcdFx0Ym9yZGVyOiBgN3B4IHNvbGlkICR7dGhlbWUuY29udGVudF9hY2NlbnR9YCxcblx0XHRcdG9wYWNpdHk6IFwiMVwiLFxuXHRcdH0sXG5cdFx0XCIuY2hlY2tib3g6Y2hlY2tlZDphZnRlclwiOiB7XG5cdFx0XHRkaXNwbGF5OiBcImlubGluZS1mbGV4XCIsXG5cdFx0fSxcblx0XHRcIi5jaGVja2JveDphZnRlclwiOiB7XG5cdFx0XHRcImZvbnQtZmFtaWx5XCI6IFwiJ0lvbmljb25zJ1wiLFxuXHRcdFx0Y29udGVudDogYCcke0ZvbnRJY29ucy5DaGVja2JveH0nYCxcblx0XHRcdHBvc2l0aW9uOiBcImFic29sdXRlXCIsXG5cdFx0XHRkaXNwbGF5OiBcIm5vbmVcIixcblx0XHRcdFwiZm9udC1zaXplXCI6IFwiMTJweFwiLFxuXHRcdFx0Ly8gcmVsYXRlZCB0byBib3JkZXIgd2lkdGhcblx0XHRcdHRvcDogXCItNnB4XCIsXG5cdFx0XHRsZWZ0OiBcIi02cHhcIixcblx0XHRcdHJpZ2h0OiAwLFxuXHRcdFx0Ym90dG9tOiAwLFxuXHRcdFx0XCJsaW5lLWhlaWdodFwiOiBcIjEycHhcIixcblx0XHRcdGNvbG9yOiB0aGVtZS5jb250ZW50X2JnLFxuXHRcdFx0XCJhbGlnbi1pdGVtc1wiOiBcImNlbnRlclwiLFxuXHRcdFx0d2lkdGg6IFwiMTJweFwiLFxuXHRcdFx0aGVpZ2h0OiBcIjEycHhcIixcblx0XHR9LFxuXHRcdFwiLmNoZWNrYm94OmJlZm9yZVwiOiB7XG5cdFx0XHRjb250ZW50OiBcIicnXCIsXG5cdFx0XHRwb3NpdGlvbjogXCJhYnNvbHV0ZVwiLFxuXHRcdFx0d2lkdGg6IFwiMzBweFwiLFxuXHRcdFx0aGVpZ2h0OiBcIjMwcHhcIixcblx0XHRcdC8vIHBvc2l0aW9uIHJlbGF0aXZlIHRvIHRoZSBpbm5lciBzaXplIG9mIGNoZWNrYm94IChpbnNpZGUgdGhlIGJvcmRlcilcblx0XHRcdHRvcDogXCItMTBweFwiLFxuXHRcdFx0bGVmdDogXCItMTBweFwiLFxuXHRcdFx0XCJib3JkZXItcmFkaXVzXCI6IHB4KHNpemUuYm9yZGVyX3JhZGl1cyksXG5cdFx0XHQvLyBwb3NpdGlvbiBpcyByZWxhdGUgdG8gcGFkZGluZyBhbmQgd2UgYW5pbWF0ZSBwYWRkaW5nIHNvIHRvIGtlZXAgdGhlIGNoZWNrYm94IGluIHBsYWNlIHdlIGFsc28gYW5pbWF0ZSBwb3NpdGlvbiBzbyBpdCBsb29rcyBsaWtlIGl0IGRvZXNuJ3QgbW92ZVxuXHRcdFx0dHJhbnNpdGlvbjogYGFsbCAke0RlZmF1bHRBbmltYXRpb25UaW1lfW1zIGN1YmljLWJlemllciguNCwuMCwuMjMsMSlgLFxuXHRcdH0sXG5cdFx0XCIuY2hlY2tib3g6Y2hlY2tlZDpiZWZvcmVcIjoge1xuXHRcdFx0Ly8gcG9zaXRpb24gcmVsYXRpdmUgdG8gdGhlIGlubmVyIHNpemUgb2YgdGhlIGNoZWNrYm94IChpbnNpZGUgdGhlIGJvcmRlcikgYW5kIHNlbGVjdGVkIGNoZWNrYm94IGhhcyBib3JkZXIgNTAlXG5cdFx0XHR0b3A6IFwiLTE1cHhcIixcblx0XHRcdGxlZnQ6IFwiLTE1cHhcIixcblx0XHR9LFxuXHRcdFwiLmNoZWNrYm94OmhvdmVyOmJlZm9yZVwiOiB7XG5cdFx0XHRiYWNrZ3JvdW5kOiBzdGF0ZUJnSG92ZXIsXG5cdFx0fSxcblx0XHRcIi5jaGVja2JveDphY3RpdmU6YmVmb3JlXCI6IHtcblx0XHRcdGJhY2tncm91bmQ6IHN0YXRlQmdBY3RpdmUsXG5cdFx0fSxcblx0XHRcIi5saXN0LWNoZWNrYm94XCI6IHtcblx0XHRcdG9wYWNpdHk6IFwiMC40XCIsXG5cdFx0fSxcblx0XHRcIi5jYWxlbmRhci1hbHRlcm5hdGUtYmFja2dyb3VuZFwiOiB7XG5cdFx0XHRiYWNrZ3JvdW5kOiBgJHt0aGVtZS5saXN0X2FsdGVybmF0ZV9iZ30gIWltcG9ydGFudGAsXG5cdFx0fSxcblx0XHRcIi5jYWxlbmRhci1kYXk6aG92ZXJcIjoge1xuXHRcdFx0YmFja2dyb3VuZDogdGhlbWUubGlzdF9hbHRlcm5hdGVfYmcsXG5cdFx0fSxcblx0XHRcIi5jYWxlbmRhci1kYXk6aG92ZXIgLmNhbGVuZGFyLWRheS1oZWFkZXItYnV0dG9uXCI6IHtcblx0XHRcdG9wYWNpdHk6IDEsXG5cdFx0fSxcblx0XHRcIi5jYWxlbmRhci1kYXktaGVhZGVyLWJ1dHRvblwiOiB7XG5cdFx0XHRvcGFjaXR5OiAwLFxuXHRcdH0sXG5cdFx0XCIuY2FsZW5kYXItaG91clwiOiB7XG5cdFx0XHRcImJvcmRlci1ib3R0b21cIjogYDFweCBzb2xpZCAke3RoZW1lLmNvbnRlbnRfYm9yZGVyfWAsXG5cdFx0XHRoZWlnaHQ6IHB4KHNpemUuY2FsZW5kYXJfaG91cl9oZWlnaHQpLFxuXHRcdFx0ZmxleDogXCIxIDAgYXV0b1wiLFxuXHRcdH0sXG5cdFx0XCIuY2FsZW5kYXItaG91cjpob3ZlclwiOiB7XG5cdFx0XHRiYWNrZ3JvdW5kOiB0aGVtZS5saXN0X2FsdGVybmF0ZV9iZyxcblx0XHR9LFxuXHRcdFwiLmNhbGVuZGFyLWNvbHVtbi1ib3JkZXJcIjoge1xuXHRcdFx0XCJib3JkZXItcmlnaHRcIjogYDFweCBzb2xpZCAke3RoZW1lLmxpc3RfYm9yZGVyfWAsXG5cdFx0fSxcblx0XHRcIi5jYWxlbmRhci1jb2x1bW4tYm9yZGVyOm50aC1jaGlsZCg3KVwiOiB7XG5cdFx0XHRcImJvcmRlci1yaWdodFwiOiBcIm5vbmVcIixcblx0XHR9LFxuXHRcdFwiLmNhbGVuZGFyLWhvdXItbWFyZ2luXCI6IHtcblx0XHRcdFwibWFyZ2luLWxlZnRcIjogcHgoc2l6ZS5jYWxlbmRhcl9ob3VyX3dpZHRoKSxcblx0XHR9LFxuXHRcdFwiLmNhbGVuZGFyLWhvdXItY29sdW1uXCI6IHtcblx0XHRcdHdpZHRoOiBweChzaXplLmNhbGVuZGFyX2hvdXJfd2lkdGgpLFxuXHRcdH0sXG5cdFx0XCIuY2FsZW5kYXItZGF5cy1oZWFkZXItcm93XCI6IHtcblx0XHRcdGhlaWdodDogcHgoc2l6ZS5jYWxlbmRhcl9kYXlzX2hlYWRlcl9oZWlnaHQpLFxuXHRcdH0sXG5cdFx0XCIuY2FsZW5kYXItZGF5XCI6IHtcblx0XHRcdFwiYm9yZGVyLXRvcFwiOiBgMXB4IHNvbGlkICR7dGhlbWUubGlzdF9ib3JkZXJ9YCxcblx0XHRcdHRyYW5zaXRpb246IFwiYmFja2dyb3VuZCAwLjRzXCIsXG5cdFx0XHRiYWNrZ3JvdW5kOiB0aGVtZS5saXN0X2JnLFxuXHRcdH0sXG5cdFx0XCIuY3Vyc29yLXBvaW50ZXJcIjoge1xuXHRcdFx0Y3Vyc29yOiBcInBvaW50ZXJcIixcblx0XHR9LFxuXHRcdFwiLmNhbGVuZGFyLWRheS1pbmRpY2F0b3JcIjoge1xuXHRcdFx0Ly8gb3ZlcnJpZGRlbiBmb3IgbW9iaWxlXG5cdFx0XHRoZWlnaHQ6IHB4KHNpemUuY2FsZW5kYXJfZGF5c19oZWFkZXJfaGVpZ2h0KSxcblx0XHRcdFwibGluZS1oZWlnaHRcIjogcHgoc2l6ZS5jYWxlbmRhcl9kYXlzX2hlYWRlcl9oZWlnaHQpLFxuXHRcdFx0XCJ0ZXh0LWFsaWduXCI6IFwiY2VudGVyXCIsXG5cdFx0XHRcImZvbnQtc2l6ZVwiOiBcIjE0cHhcIixcblx0XHR9LFxuXHRcdFwiLmNhbGVuZGFyLWRheSAuY2FsZW5kYXItZGF5LWluZGljYXRvcjpob3ZlclwiOiB7XG5cdFx0XHRiYWNrZ3JvdW5kOiB0aGVtZS5saXN0X21lc3NhZ2VfYmcsXG5cdFx0XHRvcGFjaXR5OiAwLjcsXG5cdFx0fSxcblx0XHRcIi5jYWxlbmRhci1kYXktbnVtYmVyXCI6IHtcblx0XHRcdG1hcmdpbjogXCIzcHggYXV0b1wiLFxuXHRcdFx0d2lkdGg6IFwiMjJweFwiLFxuXHRcdH0sXG5cdFx0XCIuY2FsZW5kYXItZXZlbnRcIjoge1xuXHRcdFx0XCJib3JkZXItcmFkaXVzXCI6IHB4KDQpLFxuXHRcdFx0Ym9yZGVyOiBgICR7c2l6ZS5jYWxlbmRhcl9ldmVudF9ib3JkZXJ9cHggc29saWQgJHt0aGVtZS5jb250ZW50X2JnfWAsXG5cdFx0XHRcInBhZGRpbmctbGVmdFwiOiBcIjRweFwiLFxuXHRcdFx0XCJmb250LXdlaWdodFwiOiBcIjYwMFwiLFxuXHRcdFx0XCJib3gtc2l6aW5nXCI6IFwiY29udGVudC1ib3hcIixcblx0XHR9LFxuXHRcdFwiLmNhbGVuZGFyLWN1cnJlbnQtZGF5LWNpcmNsZVwiOiB7XG5cdFx0XHRcImJhY2tncm91bmQtY29sb3JcIjogdGhlbWUuY29udGVudF9idXR0b24sXG5cdFx0fSxcblx0XHRcIi5jYWxlbmRhci1zZWxlY3RlZC1kYXktY2lyY2xlXCI6IHtcblx0XHRcdFwiYmFja2dyb3VuZC1jb2xvclwiOiB0aGVtZS5jb250ZW50X2FjY2VudCxcblx0XHR9LFxuXHRcdFwiLmNhbGVuZGFyLWN1cnJlbnQtZGF5LXRleHRcIjoge1xuXHRcdFx0Y29sb3I6IHRoZW1lLmNvbnRlbnRfYmcsXG5cdFx0XHRcImZvbnQtd2VpZ2h0XCI6IFwiYm9sZFwiLFxuXHRcdH0sXG5cdFx0XCIuY2FsZW5kYXItc2VsZWN0ZWQtZGF5LXRleHRcIjoge1xuXHRcdFx0Y29sb3I6IHRoZW1lLmNvbnRlbnRfYmcsXG5cdFx0XHRcImZvbnQtd2VpZ2h0XCI6IFwiYm9sZFwiLFxuXHRcdH0sXG5cdFx0XCIuYW5pbWF0aW9uLXJldmVyc2VcIjoge1xuXHRcdFx0XCJhbmltYXRpb24tZGlyZWN0aW9uXCI6IFwicmV2ZXJzZVwiLFxuXHRcdH0sXG5cdFx0XCIuc2xpZGUtYm90dG9tXCI6IHtcblx0XHRcdFwiYW5pbWF0aW9uLW5hbWVcIjogXCJzbGlkZUZyb21Cb3R0b21cIixcblx0XHRcdFwiYW5pbWF0aW9uLWl0ZXJhdGlvbi1jb3VudFwiOiAxLFxuXHRcdFx0XCJhbmltYXRpb24tdGltaW5nLWZ1bmN0aW9uXCI6IFwiZWFzZS1pblwiLFxuXHRcdFx0XCJhbmltYXRpb24tZHVyYXRpb25cIjogXCIxMDBtc1wiLFxuXHRcdH0sXG5cdFx0XCJAa2V5ZnJhbWVzIHNsaWRlRnJvbUJvdHRvbVwiOiB7XG5cdFx0XHRcIjAlXCI6IHtcblx0XHRcdFx0dHJhbnNsYXRlOiBcIjAgMTAwJVwiLFxuXHRcdFx0fSxcblx0XHRcdFwiMTAwJVwiOiB7XG5cdFx0XHRcdHRyYW5zbGF0ZTogXCIwIDBcIixcblx0XHRcdH0sXG5cdFx0fSxcblx0XHRcIi5zbGlkZS10b3BcIjoge1xuXHRcdFx0XCJhbmltYXRpb24tbmFtZVwiOiBcInNsaWRlRnJvbVRvcFwiLFxuXHRcdFx0XCJhbmltYXRpb24taXRlcmF0aW9uLWNvdW50XCI6IDEsXG5cdFx0XHRcImFuaW1hdGlvbi10aW1pbmctZnVuY3Rpb25cIjogXCJlYXNlLWluXCIsXG5cdFx0XHRcImFuaW1hdGlvbi1kdXJhdGlvblwiOiBcIjEwMG1zXCIsXG5cdFx0fSxcblx0XHRcIkBrZXlmcmFtZXMgc2xpZGVGcm9tVG9wXCI6IHtcblx0XHRcdFwiMCVcIjoge1xuXHRcdFx0XHR0cmFuc2xhdGU6IFwiMCAtMTAwJVwiLFxuXHRcdFx0fSxcblx0XHRcdFwiMTAwJVwiOiB7XG5cdFx0XHRcdHRyYW5zbGF0ZTogXCIwIDBcIixcblx0XHRcdH0sXG5cdFx0fSxcblx0XHRcIi5mYWRlLWluXCI6IHtcblx0XHRcdG9wYWNpdHk6IDEsXG5cdFx0XHRcImFuaW1hdGlvbi1uYW1lXCI6IFwiZmFkZUluT3BhY2l0eVwiLFxuXHRcdFx0XCJhbmltYXRpb24taXRlcmF0aW9uLWNvdW50XCI6IDEsXG5cdFx0XHRcImFuaW1hdGlvbi10aW1pbmctZnVuY3Rpb25cIjogXCJlYXNlLWluXCIsXG5cdFx0XHRcImFuaW1hdGlvbi1kdXJhdGlvblwiOiBcIjIwMG1zXCIsXG5cdFx0fSxcblx0XHRcIkBrZXlmcmFtZXMgZmFkZUluT3BhY2l0eVwiOiB7XG5cdFx0XHRcIjAlXCI6IHtcblx0XHRcdFx0b3BhY2l0eTogMCxcblx0XHRcdH0sXG5cdFx0XHRcIjEwMCVcIjoge1xuXHRcdFx0XHRvcGFjaXR5OiAxLFxuXHRcdFx0fSxcblx0XHR9LFxuXHRcdFwiLmNhbGVuZGFyLWJ1YmJsZS1tb3JlLXBhZGRpbmctZGF5IC5jYWxlbmRhci1ldmVudFwiOiB7XG5cdFx0XHRib3JkZXI6IGAxcHggc29saWQgJHt0aGVtZS5saXN0X2JnfWAsXG5cdFx0fSxcblx0XHRcIi5kYXJrZXItaG92ZXI6aG92ZXJcIjoge1xuXHRcdFx0ZmlsdGVyOiBcImJyaWdodG5lc3MoOTUlKVwiLFxuXHRcdH0sXG5cdFx0XCIuZGFya2VzdC1ob3Zlcjpob3ZlclwiOiB7XG5cdFx0XHRmaWx0ZXI6IFwiYnJpZ2h0bmVzcyg3MCUpXCIsXG5cdFx0fSxcblx0XHRcIi5ldmVudC1jb250aW51ZXMtbGVmdFwiOiB7XG5cdFx0XHRcImJvcmRlci10b3AtbGVmdC1yYWRpdXNcIjogMCxcblx0XHRcdFwiYm9yZGVyLWJvdHRvbS1sZWZ0LXJhZGl1c1wiOiAwLFxuXHRcdFx0XCJib3JkZXItbGVmdFwiOiBcIm5vbmVcIixcblx0XHR9LFxuXHRcdFwiLmV2ZW50LWNvbnRpbnVlcy1yaWdodFwiOiB7XG5cdFx0XHRcIm1hcmdpbi1yaWdodFwiOiAwLFxuXHRcdFx0XCJib3JkZXItcmlnaHRcIjogXCJub25lXCIsXG5cdFx0XHRcImJvcmRlci10b3AtcmlnaHQtcmFkaXVzXCI6IDAsXG5cdFx0XHRcImJvcmRlci1ib3R0b20tcmlnaHQtcmFkaXVzXCI6IDAsXG5cdFx0fSxcblx0XHRcIi5ldmVudC1jb250aW51ZXMtcmlnaHQtYXJyb3dcIjoge1xuXHRcdFx0d2lkdGg6IDAsXG5cdFx0XHRoZWlnaHQ6IDAsXG5cdFx0XHRcImJvcmRlci10b3BcIjogXCI5cHggc29saWQgdHJhbnNwYXJlbnRcIixcblx0XHRcdFwiYm9yZGVyLWJvdHRvbVwiOiBcIjlweCBzb2xpZCB0cmFuc3BhcmVudFwiLFxuXHRcdFx0XCJib3JkZXItbGVmdFwiOiBcIjZweCBzb2xpZCBncmVlblwiLFxuXHRcdFx0XCJtYXJnaW4tdG9wXCI6IHB4KDEpLFxuXHRcdFx0XCJtYXJnaW4tYm90dG9tXCI6IHB4KDEpLFxuXHRcdH0sXG5cdFx0XCIudGltZS1maWVsZFwiOiB7XG5cdFx0XHR3aWR0aDogXCI4MHB4XCIsXG5cdFx0fSxcblx0XHRcIi50aW1lLXBpY2tlciBpbnB1dFwiOiB7XG5cdFx0XHRjb2xvcjogXCJyZ2JhKDAsIDAsIDAsIDApXCIsXG5cdFx0fSxcblx0XHRcIi50aW1lLXBpY2tlci1mYWtlLWRpc3BsYXlcIjoge1xuXHRcdFx0Ym90dG9tOiBcIjEuNmVtXCIsXG5cdFx0XHRsZWZ0OiBcIjAuMWVtXCIsXG5cdFx0fSxcblx0XHRcIi5jYWxlbmRhci1hZ2VuZGEtdGltZS1jb2x1bW5cIjoge1xuXHRcdFx0d2lkdGg6IHB4KDgwKSxcblx0XHR9LFxuXHRcdFwiLmNhbGVuZGFyLWFnZW5kYS10aW1lLWNvbHVtbiA+ICpcIjoge1xuXHRcdFx0aGVpZ2h0OiBweCg0NCksXG5cdFx0fSxcblx0XHRcIi5jYWxlbmRhci1hZ2VuZGEtcm93XCI6IHtcblx0XHRcdFwibWluLWhlaWdodFwiOiBcIjQ0cHhcIixcblx0XHRcdGZsZXg6IFwiMSAwIGF1dG9cIixcblx0XHR9LFxuXHRcdFwiLmNhbGVuZGFyLXN3aXRjaC1idXR0b25cIjoge1xuXHRcdFx0d2lkdGg6IFwiNDBweFwiLFxuXHRcdFx0XCJ0ZXh0LWFsaWduXCI6IFwiY2VudGVyXCIsXG5cdFx0fSxcblx0XHRcIi5jYWxlbmRhci1sb25nLWV2ZW50cy1oZWFkZXJcIjoge1xuXHRcdFx0b3ZlcmZsb3c6IFwiaGlkZGVuXCIsXG5cdFx0XHRcImJvcmRlci1ib3R0b21cIjogYDFweCBzb2xpZCAke3RoZW1lLmNvbnRlbnRfYm9yZGVyfWAsXG5cdFx0fSxcblx0XHRcIi5jYWxlbmRhci1tb250aC13ZWVrLW51bWJlclwiOiB7XG5cdFx0XHRcImZvbnQtc2l6ZVwiOiBcIjEycHhcIixcblx0XHRcdG9wYWNpdHk6IFwiMC44XCIsXG5cdFx0XHR0b3A6IFwiOHB4XCIsXG5cdFx0XHRsZWZ0OiBcIjZweFwiLFxuXHRcdH0sXG5cdFx0XCIuY2FsZW5kYXItbW9udGgtd2Vlay1udW1iZXI6YWZ0ZXJcIjoge1xuXHRcdFx0Ly8gVXNlZCB0byBleHBhbmQgdGhlIGNsaWNrYWJsZSBhcmVhXG5cdFx0XHRjb250ZW50OiBcIicnXCIsXG5cdFx0XHR3aWR0aDogXCIxMDAlXCIsXG5cdFx0XHRoZWlnaHQ6IFwiMTAwJVwiLFxuXHRcdFx0cG9zaXRpb246IFwiYWJzb2x1dGVcIixcblx0XHRcdHRvcDogXCIwXCIsXG5cdFx0XHRsZWZ0OiBcIjBcIixcblx0XHRcdHBhZGRpbmc6IFwiMzUlXCIsXG5cdFx0XHRtYXJnaW46IFwiLTM1JSAtMzUlXCIsXG5cdFx0fSxcblx0XHRcIi5jb2xvci1vcHRpb246bm90KC5zZWxlY3RlZCk6Zm9jdXMtd2l0aGluLCAuY29sb3Itb3B0aW9uOm5vdCguc2VsZWN0ZWQpOmhvdmVyXCI6IGNsaWVudC5pc0Rlc2t0b3BEZXZpY2UoKVxuXHRcdFx0PyB7XG5cdFx0XHRcdFx0b3BhY2l0eTogMC43LFxuXHRcdFx0ICB9XG5cdFx0XHQ6IHt9LFxuXHRcdFwiLmN1c3RvbS1jb2xvci1jb250YWluZXIgLnRleHQtZmllbGRcIjoge1xuXHRcdFx0XCJwYWRkaW5nLXRvcFwiOiBcIjBweFwiLFxuXHRcdH0sXG5cdFx0XCIuY3VzdG9tLWNvbG9yLWNvbnRhaW5lciAudGV4dC5pbnB1dFwiOiB7XG5cdFx0XHRcInRleHQtdHJhbnNmb3JtXCI6IFwidXBwZXJjYXNlXCIsXG5cdFx0XHR3aWR0aDogXCI5Y2hcIixcblx0XHR9LFxuXHRcdFwiLmN1c3RvbS1jb2xvci1jb250YWluZXIgLmlucHV0V3JhcHBlcjpiZWZvcmVcIjoge1xuXHRcdFx0Ly8gc2xhc2ggaW4gY29udGVudCBpcyBjb250ZW50IGFsdC4gc28gdGhhdCBpdCdzIGlnbm9yZWQgYnkgc2NyZWVuIHJlYWRlcnNcblx0XHRcdGNvbnRlbnQ6ICdcIiNcIiAvIFwiXCInLFxuXHRcdFx0Y29sb3I6IHRoZW1lLmNvbnRlbnRfbWVzc2FnZV9iZyxcblx0XHR9LFxuXHRcdFwiLmNhbGVuZGFyLWludml0ZS1maWVsZFwiOiB7XG5cdFx0XHRcIm1pbi13aWR0aFwiOiBcIjgwcHhcIixcblx0XHR9LFxuXHRcdFwiLmJsb2NrLWxpc3RcIjoge1xuXHRcdFx0XCJsaXN0LXN0eWxlXCI6IFwibm9uZVwiLFxuXHRcdFx0cGFkZGluZzogMCxcblx0XHR9LFxuXHRcdFwiLmJsb2NrLWxpc3QgbGlcIjoge1xuXHRcdFx0ZGlzcGxheTogXCJibG9ja1wiLFxuXHRcdH0sXG5cdFx0XCIuc3RpY2t5XCI6IHtcblx0XHRcdHBvc2l0aW9uOiBcInN0aWNreVwiLFxuXHRcdH0sXG5cdFx0XCIudGV4dC1mYWRlXCI6IHtcblx0XHRcdGNvbG9yOiB0aGVtZS5jb250ZW50X2J1dHRvbixcblx0XHR9LFxuXHRcdFwiLm5vLWFwcGVhcmFuY2UgaW5wdXQsIC5uby1hcHBlYXJhbmNlIGlucHV0Ojotd2Via2l0LW91dGVyLXNwaW4tYnV0dG9uLCAubm8tYXBwZWFyYW5jZSBpbnB1dDo6LXdlYmtpdC1pbm5lci1zcGluLWJ1dHRvblwiOiB7XG5cdFx0XHRcIi13ZWJraXQtYXBwZWFyYW5jZVwiOiBcIm5vbmVcIixcblx0XHRcdFwiLW1vei1hcHBlYXJhbmNlXCI6IFwidGV4dGZpZWxkXCIsXG5cdFx0XHRhcHBlYXJhbmNlOiBcIm5vbmVcIixcblx0XHR9LFxuXHRcdC8vIG1lZGlhIHF1ZXJ5IGZvciBzbWFsbCBkZXZpY2VzIHdoZXJlIGVsZW1lbnRzIHNob3VsZCBiZSBhcnJhbmdlZCBpbiBvbmUgY29sdW1uXG5cdFx0Ly8gYWxzbyBhZGFwdGlvbnMgZm9yIHRhYmxlIGNvbHVtbiB3aWR0aHNcblx0XHRcIkBtZWRpYSAobWF4LXdpZHRoOiA0MDBweClcIjoge1xuXHRcdFx0Ly8gY3VycmVudGx5IHVzZWQgZm9yIHRoZSByZW1pbmRlciBkaWFsb2dcblx0XHRcdFwiLmZsZXgtZGlyZWN0aW9uLWNoYW5nZVwiOiB7XG5cdFx0XHRcdGRpc3BsYXk6IFwiZmxleFwiLFxuXHRcdFx0XHRcImZsZXgtZGlyZWN0aW9uXCI6IFwiY29sdW1uLXJldmVyc2VcIixcblx0XHRcdFx0XCJqdXN0aWZ5LWNvbnRlbnRcIjogXCJjZW50ZXJcIixcblx0XHRcdH0sXG5cdFx0XHRcIi5jb2x1bW4td2lkdGgtc21hbGxcIjoge1xuXHRcdFx0XHR3aWR0aDogcHgoc2l6ZS5jb2x1bW5fd2lkdGhfc19tb2JpbGUpLFxuXHRcdFx0fSxcblx0XHRcdC8vIFNwZWVkIHVwIFNWRyByZW5kZXJpbmcgaW4gdGhlIG9uYm9hcmRpbmcgd2l6YXJkIGJ5IGRpc2FibGluZyBhbnRpYWxpYXNpbmdcblx0XHRcdFwic3ZnLCBpbWdcIjoge1xuXHRcdFx0XHRcInNoYXBlLXJlbmRlcmluZ1wiOiBcIm9wdGltaXplU3BlZWRcIixcblx0XHRcdH0sXG5cdFx0fSxcblx0XHRcIi50cmFuc2l0aW9uLW1hcmdpblwiOiB7XG5cdFx0XHR0cmFuc2l0aW9uOiBgbWFyZ2luLWJvdHRvbSAyMDBtcyBlYXNlLWluLW91dGAsXG5cdFx0fSxcblx0XHRcIi5jaXJjbGVcIjoge1xuXHRcdFx0XCJib3JkZXItcmFkaXVzXCI6IFwiNTAlXCIsXG5cdFx0fSxcblx0XHRcIi5jbGlja2FibGVcIjoge1xuXHRcdFx0Y3Vyc29yOiBcInBvaW50ZXJcIixcblx0XHR9LFxuXHRcdFwiLnN3aXRjaC1tb250aC1idXR0b24gc3ZnXCI6IHtcblx0XHRcdGZpbGw6IHRoZW1lLm5hdmlnYXRpb25fYnV0dG9uLFxuXHRcdH0sXG5cdFx0XCJkcmF3ZXItbWVudVwiOiB7XG5cdFx0XHR3aWR0aDogcHgoc2l6ZS5kcmF3ZXJfbWVudV93aWR0aCksXG5cdFx0XHRiYWNrZ3JvdW5kOiBnZXROYXZpZ2F0aW9uTWVudUJnKCksXG5cdFx0fSxcblx0XHRcIi5tZW51LXNoYWRvd1wiOiB7XG5cdFx0XHRcImJveC1zaGFkb3dcIjogXCIwIDRweCA1cHggMnB4IHJnYmEoMCwwLDAsMC4xNCksIDAgNHB4IDVweCAycHggcmdiYSgwLDAsMCwwLjE0KSwgMCA0cHggNXB4IDJweCByZ2JhKDAsMCwwLDAuMTQpXCIsXG5cdFx0fSxcblx0XHRcIi5iaWctaW5wdXQgaW5wdXRcIjoge1xuXHRcdFx0XCJmb250LXNpemVcIjogcHgoc2l6ZS5mb250X3NpemVfYmFzZSAqIDEuNCksXG5cdFx0XHRcImxpbmUtaGVpZ2h0XCI6IGAke3B4KHNpemUuZm9udF9zaXplX2Jhc2UgKiAxLjQgKyAyKX0gIWltcG9ydGFudGAsXG5cdFx0fSxcblx0XHRcIi5oaWRkZW4tdW50aWwtZm9jdXNcIjoge1xuXHRcdFx0cG9zaXRpb246IFwiYWJzb2x1dGVcIixcblx0XHRcdGxlZnQ6IFwiLTk5OTlweFwiLFxuXHRcdFx0XCJ6LWluZGV4XCI6IFwiOTk5XCIsXG5cdFx0XHRvcGFjaXR5OiBcIjBcIixcblx0XHR9LFxuXHRcdFwiLmhpZGRlbi11bnRpbC1mb2N1czpmb2N1c1wiOiB7XG5cdFx0XHQvLyBwb3NpdGlvbjogXCJpbml0aWFsXCIsXG5cdFx0XHRsZWZ0OiBcIjUwJVwiLFxuXHRcdFx0dHJhbnNmb3JtOiBcInRyYW5zbGF0ZSgtNTAlKVwiLFxuXHRcdFx0b3BhY2l0eTogXCIxXCIsXG5cdFx0fSxcblx0XHRbYEBtZWRpYSAobWF4LXdpZHRoOiAke3NpemUuZGVza3RvcF9sYXlvdXRfd2lkdGggLSAxfXB4KWBdOiB7XG5cdFx0XHRcIi5tYWluLXZpZXdcIjoge1xuXHRcdFx0XHR0b3A6IDAsXG5cdFx0XHRcdGJvdHRvbTogMCxcblx0XHRcdH0sXG5cdFx0XHRcIi5maXhlZC1ib3R0b20tcmlnaHRcIjoge1xuXHRcdFx0XHRib3R0b206IHB4KHNpemUuaHBhZF9sYXJnZV9tb2JpbGUgKyBzaXplLmJvdHRvbV9uYXZfYmFyKSxcblx0XHRcdFx0cmlnaHQ6IHB4KHNpemUuaHBhZF9sYXJnZV9tb2JpbGUpLFxuXHRcdFx0fSxcblx0XHRcdFwiLmN1c3RvbS1sb2dvXCI6IHtcblx0XHRcdFx0d2lkdGg6IHB4KDQwKSxcblx0XHRcdH0sXG5cdFx0XHRcIi5ub3RpZmljYXRpb24tb3ZlcmxheS1jb250ZW50XCI6IHtcblx0XHRcdFx0XCJwYWRkaW5nLXRvcFwiOiBweChzaXplLnZwYWRfc21hbGwpLFxuXHRcdFx0fSxcblx0XHRcdFwiLmNhbGVuZGFyLWRheS1pbmRpY2F0b3JcIjoge1xuXHRcdFx0XHRoZWlnaHQ6IFwiMjBweFwiLFxuXHRcdFx0XHRcImxpbmUtaGVpZ2h0XCI6IFwiMjBweFwiLFxuXHRcdFx0XHRcInRleHQtYWxpZ25cIjogXCJjZW50ZXJcIixcblx0XHRcdFx0XCJmb250LXNpemVcIjogXCIxNHB4XCIsXG5cdFx0XHR9LFxuXHRcdFx0XCIuY2FsZW5kYXItZGF5LW51bWJlclwiOiB7XG5cdFx0XHRcdG1hcmdpbjogXCIycHggYXV0b1wiLFxuXHRcdFx0XHR3aWR0aDogXCIyMHB4XCIsXG5cdFx0XHR9LFxuXHRcdFx0XCIuY2FsZW5kYXItaG91ci1tYXJnaW5cIjoge1xuXHRcdFx0XHRcIm1hcmdpbi1sZWZ0XCI6IHB4KHNpemUuY2FsZW5kYXJfaG91cl93aWR0aF9tb2JpbGUpLFxuXHRcdFx0fSxcblx0XHRcdFwiLmNhbGVuZGFyLW1vbnRoLXdlZWstbnVtYmVyXCI6IHtcblx0XHRcdFx0XCJmb250LXNpemVcIjogXCIxMHB4XCIsXG5cdFx0XHRcdG9wYWNpdHk6IFwiMC44XCIsXG5cdFx0XHRcdHRvcDogXCIzcHhcIixcblx0XHRcdFx0bGVmdDogXCIzcHhcIixcblx0XHRcdH0sXG5cdFx0fSxcblx0XHRcIi5jdXJzb3ItZ3JhYmJpbmcgKlwiOiB7XG5cdFx0XHRjdXJzb3I6IFwiZ3JhYmJpbmcgIWltcG9ydGFudFwiLFxuXHRcdH0sXG5cdFx0Ly8gVGhpcyBpcyBhcHBsaWVkIHRvIGVsZW1lbnRzIHRoYXQgc2hvdWxkIGluZGljYXRlIHRoZXkgd2lsbCBiZSBkcmFnZ2FibGUgd2hlbiBzb21lIGtleSBpcyBwcmVzc2VkLlxuXHRcdC8vIElkZWFsbHkgd2Ugd291bGQgdXNlIGN1cnNvcjogZ3JhYiBoZXJlLCBidXQgaXQgZG9lc24ndCBzZWVtIHRvIGJlIHN1cHBvcnRlZCBpbiBlbGVjdHJvblxuXHRcdFwiLmRyYWctbW9kLWtleSAqXCI6IHtcblx0XHRcdGN1cnNvcjogXCJjb3B5ICFpbXBvcnRhbnRcIixcblx0XHR9LFxuXHRcdC8vV2UgdXMgdGhpcyBjbGFzcyB0byBoaWRlIGNvbnRlbnRzIHRoYXQgc2hvdWxkIGp1c3QgYmUgdmlzaWJsZSBmb3IgcHJpbnRpbmdcblx0XHRcIi5ub3NjcmVlblwiOiB7XG5cdFx0XHRkaXNwbGF5OiBcIm5vbmVcIixcblx0XHR9LFxuXHRcdFwiQG1lZGlhIHByaW50XCI6IHtcblx0XHRcdFwiLmNvbG9yLWFkanVzdC1leGFjdFwiOiB7XG5cdFx0XHRcdFwiY29sb3ItYWRqdXN0XCI6IFwiZXhhY3RcIixcblx0XHRcdFx0XCItd2Via2l0LXByaW50LWNvbG9yLWFkanVzdFwiOiBcImV4YWN0XCIsXG5cdFx0XHR9LFxuXHRcdFx0XCIubm9wcmludFwiOiB7XG5cdFx0XHRcdGRpc3BsYXk6IFwibm9uZSAhaW1wb3J0YW50XCIsXG5cdFx0XHR9LFxuXHRcdFx0XCIubm9zY3JlZW5cIjoge1xuXHRcdFx0XHRkaXNwbGF5OiBcImluaXRpYWxcIixcblx0XHRcdH0sXG5cdFx0XHRcIi5wcmludFwiOiB7XG5cdFx0XHRcdGNvbG9yOiBcImJsYWNrXCIsXG5cdFx0XHRcdFwiYmFja2dyb3VuZC1jb2xvclwiOiBcIndoaXRlXCIsXG5cdFx0XHRcdGRpc3BsYXk6IFwiYmxvY2tcIixcblx0XHRcdH0sXG5cdFx0XHRcImh0bWwsIGJvZHlcIjoge1xuXHRcdFx0XHRwb3NpdGlvbjogXCJpbml0aWFsXCIsXG5cdFx0XHRcdG92ZXJmbG93OiBcInZpc2libGUgIWltcG9ydGFudFwiLFxuXHRcdFx0XHRjb2xvcjogbGlnaHRUaGVtZS5jb250ZW50X2ZnLFxuXHRcdFx0XHRcImJhY2tncm91bmQtY29sb3JcIjogYCR7bGlnaHRUaGVtZS5jb250ZW50X2JnfSAhaW1wb3J0YW50YCxcblx0XHRcdH0sXG5cdFx0XHQvLyBvdmVyd3JpdGUgcG9zaXRpb24gXCJmaXhlZFwiIG90aGVyd2lzZSBvbmx5IG9uZSBwYWdlIHdpbGwgYmUgcHJpbnRlZC5cblx0XHRcdFwiLmhlYWRlci1uYXZcIjoge1xuXHRcdFx0XHRkaXNwbGF5OiBcIm5vbmVcIixcblx0XHRcdH0sXG5cdFx0XHRcIi5tYWluLXZpZXdcIjoge1xuXHRcdFx0XHR0b3A6IDAsXG5cdFx0XHRcdHBvc2l0aW9uOiBcInN0YXRpYyAhaW1wb3J0YW50XCIsXG5cdFx0XHR9LFxuXHRcdFx0XCIuZHJvcGRvd24tcGFuZWxcIjoge1xuXHRcdFx0XHRkaXNwbGF5OiBcIm5vbmVcIixcblx0XHRcdH0sXG5cdFx0XHRcIi5maWxsLWFic29sdXRlXCI6IHtcblx0XHRcdFx0cG9zaXRpb246IFwic3RhdGljICFpbXBvcnRhbnRcIixcblx0XHRcdFx0ZGlzcGxheTogXCJpbml0aWFsXCIsXG5cdFx0XHR9LFxuXHRcdFx0XCIudmlldy1jb2x1bW5zXCI6IHtcblx0XHRcdFx0d2lkdGg6IFwiMTAwJSAhaW1wb3J0YW50XCIsXG5cdFx0XHRcdHRyYW5zZm9ybTogXCJpbml0aWFsICFpbXBvcnRhbnRcIixcblx0XHRcdFx0ZGlzcGxheTogXCJpbml0aWFsXCIsXG5cdFx0XHRcdHBvc2l0aW9uOiBcImluaXRpYWxcIixcblx0XHRcdH0sXG5cdFx0XHRcIi52aWV3LWNvbHVtbjpudGgtY2hpbGQoMSksIC52aWV3LWNvbHVtbjpudGgtY2hpbGQoMilcIjoge1xuXHRcdFx0XHRkaXNwbGF5OiBcIm5vbmVcIixcblx0XHRcdH0sXG5cdFx0XHRcIi52aWV3LWNvbHVtblwiOiB7XG5cdFx0XHRcdHdpZHRoOiBcIjEwMCUgIWltcG9ydGFudFwiLFxuXHRcdFx0fSxcblx0XHRcdFwiI21haWwtdmlld2VyXCI6IHtcblx0XHRcdFx0b3ZlcmZsb3c6IFwidmlzaWJsZVwiLFxuXHRcdFx0XHRkaXNwbGF5OiBcImJsb2NrXCIsXG5cdFx0XHR9LFxuXHRcdFx0XCIjbWFpbC1ib2R5XCI6IHtcblx0XHRcdFx0b3ZlcmZsb3c6IFwidmlzaWJsZVwiLFxuXHRcdFx0fSxcblx0XHRcdFwiI2xvZ2luLXZpZXdcIjoge1xuXHRcdFx0XHRkaXNwbGF5OiBcIm5vbmVcIixcblx0XHRcdH0sXG5cdFx0XHRcIi5kaWFsb2ctaGVhZGVyXCI6IHtcblx0XHRcdFx0ZGlzcGxheTogXCJub25lXCIsXG5cdFx0XHR9LFxuXHRcdFx0XCIuZGlhbG9nLWNvbnRhaW5lclwiOiB7XG5cdFx0XHRcdG92ZXJmbG93OiBcInZpc2libGVcIixcblx0XHRcdFx0cG9zaXRpb246IFwic3RhdGljICFpbXBvcnRhbnRcIixcblx0XHRcdH0sXG5cdFx0XHRcIiN3aXphcmQtcGFnaW5nXCI6IHtcblx0XHRcdFx0ZGlzcGxheTogXCJub25lXCIsXG5cdFx0XHR9LFxuXHRcdFx0XCJidXR0b246bm90KC5wcmludClcIjoge1xuXHRcdFx0XHRkaXNwbGF5OiBcIm5vbmVcIixcblx0XHRcdH0sXG5cdFx0XHRcIi5ib3R0b20tbmF2XCI6IHtcblx0XHRcdFx0ZGlzcGxheTogXCJub25lXCIsXG5cdFx0XHR9LFxuXHRcdFx0XCIubW9iaWxlIC52aWV3LWNvbHVtbjpudGgtY2hpbGQoMilcIjoge1xuXHRcdFx0XHRkaXNwbGF5OiBcImluaXRpYWxcIixcblx0XHRcdH0sXG5cdFx0XHRcIi5mb2xkZXItY29sdW1uXCI6IHtcblx0XHRcdFx0ZGlzcGxheTogXCJub25lXCIsXG5cdFx0XHR9LFxuXHRcdFx0cHJlOiB7XG5cdFx0XHRcdFwid29yZC1icmVha1wiOiBcIm5vcm1hbFwiLFxuXHRcdFx0XHRcIm92ZXJmbG93LXdyYXBcIjogXCJhbnl3aGVyZVwiLFxuXHRcdFx0XHRcIndoaXRlLXNwYWNlXCI6IFwiYnJlYWstc3BhY2VzXCIsXG5cdFx0XHR9LFxuXHRcdH0sXG5cdFx0Ly8gZGV0ZWN0IHdlYmtpdCBhdXRvZmlsbHM7IHNlZSBUZXh0RmllbGQgYW5kIGh0dHBzOi8vbWVkaXVtLmNvbS9AYnJ1bm4vZGV0ZWN0aW5nLWF1dG9maWxsZWQtZmllbGRzLWluLWphdmFzY3JpcHQtYWVkNTk4ZDI1ZGE3XG5cdFx0XCJAa2V5ZnJhbWVzIG9uQXV0b0ZpbGxTdGFydFwiOiB7XG5cdFx0XHRmcm9tOiB7XG5cdFx0XHRcdC8qKi9cblx0XHRcdH0sXG5cdFx0XHR0bzoge1xuXHRcdFx0XHQvKiovXG5cdFx0XHR9LFxuXHRcdH0sXG5cdFx0XCJAa2V5ZnJhbWVzIG9uQXV0b0ZpbGxDYW5jZWxcIjoge1xuXHRcdFx0ZnJvbToge1xuXHRcdFx0XHQvKiovXG5cdFx0XHR9LFxuXHRcdFx0dG86IHtcblx0XHRcdFx0LyoqL1xuXHRcdFx0fSxcblx0XHR9LFxuXHRcdC8vIHVzZSB0aGUgYW5pbWF0aW9ucyBhcyBob29rcyBmb3IgSlMgdG8gY2FwdHVyZSAnYW5pbWF0aW9uc3RhcnQnIGV2ZW50c1xuXHRcdFwiaW5wdXQ6LXdlYmtpdC1hdXRvZmlsbFwiOiB7XG5cdFx0XHRcImFuaW1hdGlvbi1uYW1lXCI6IFwib25BdXRvRmlsbFN0YXJ0XCIsXG5cdFx0fSxcblx0XHRcImlucHV0Om5vdCg6LXdlYmtpdC1hdXRvZmlsbClcIjoge1xuXHRcdFx0XCJhbmltYXRpb24tbmFtZVwiOiBcIm9uQXV0b0ZpbGxDYW5jZWxcIixcblx0XHR9LFxuXHRcdC8vIGZvciBjb21wYXRpYmlsaXR5IHdpdGggT3V0bG9vayAyMDEwLzIwMTMgZW1haWxzLiBoYXZlIGEgbmVnYXRpdmUgaW5kZW50YXRpb24gKDE4LjBwdCkgb24gZWFjaCBsaXN0IGVsZW1lbnQgYW5kIGFkZGl0aW9uYWxseSB0aGlzIGNsYXNzXG5cdFx0Ly8gd2Ugc3RyaXAgYWxsIGdsb2JhbCBzdHlsZSBkZWZpbml0aW9ucywgc28gdGhlIGxpc3QgZWxlbWVudHMgYXJlIG9ubHkgaW5kZW50ZWQgdG8gdGhlIGxlZnQgaWYgd2UgZG8gbm90IGFsbG93IHRoZSBNc29MaXN0UGFyYWdyYXBoIGNsYXNzZXNcblx0XHQvLyB0aGV5IGFyZSB3aGl0ZWxpc3RlZCBpbiBIdG1sU2FuaXRpemVyLmpzXG5cdFx0XCIuTXNvTGlzdFBhcmFncmFwaCwgLk1zb0xpc3RQYXJhZ3JhcGhDeFNwRmlyc3QsIC5Nc29MaXN0UGFyYWdyYXBoQ3hTcE1pZGRsZSwgLk1zb0xpc3RQYXJhZ3JhcGhDeFNwTGFzdFwiOiB7XG5cdFx0XHRcIm1hcmdpbi1sZWZ0XCI6IFwiMzYuMHB0XCIsXG5cdFx0fSxcblx0XHRcInNwYW4udmVydGljYWwtdGV4dFwiOiB7XG5cdFx0XHR0cmFuc2Zvcm06IFwicm90YXRlKDE4MGRlZylcIixcblx0XHRcdFwid3JpdGluZy1tb2RlXCI6IFwidmVydGljYWwtcmxcIixcblx0XHR9LFxuXHRcdFwidWwudXNhZ2UtdGVzdC1vcHQtaW4tYnVsbGV0c1wiOiB7XG5cdFx0XHRtYXJnaW46IFwiMCBhdXRvXCIsXG5cdFx0XHRcImxpc3Qtc3R5bGVcIjogXCJkaXNjXCIsXG5cdFx0XHRcInRleHQtYWxpZ25cIjogXCJsZWZ0XCIsXG5cdFx0fSxcblx0XHRcIi5ib251cy1tb250aFwiOiB7XG5cdFx0XHRiYWNrZ3JvdW5kOiB0aGVtZS5jb250ZW50X2FjY2VudCxcblx0XHRcdGNvbG9yOiB0aGVtZS5jb250ZW50X2JnLFxuXHRcdFx0d2lkdGg6IHB4KDEwMCksXG5cdFx0XHRcIm1pbi13aWR0aFwiOiBweCgxMDApLFxuXHRcdFx0aGVpZ2h0OiBweCgxMDApLFxuXHRcdFx0XCJtaW4taGVpZ2h0XCI6IHB4KDEwMCksXG5cdFx0XHRcImJvcmRlci1yYWRpdXNcIjogcHgoMTAwKSxcblx0XHR9LFxuXHRcdFwiLmRheS1ldmVudHMtaW5kaWNhdG9yXCI6IHtcblx0XHRcdFwiYmFja2dyb3VuZC1jb2xvclwiOiB0aGVtZS5jb250ZW50X2FjY2VudCxcblx0XHRcdFwiYm9yZGVyLXJhZGl1c1wiOiBcIjUwJVwiLFxuXHRcdFx0ZGlzcGxheTogXCJpbmxpbmUtYmxvY2tcIixcblx0XHRcdGhlaWdodDogXCI1cHhcIixcblx0XHRcdHdpZHRoOiBcIjVweFwiLFxuXHRcdFx0cG9zaXRpb246IFwiYWJzb2x1dGVcIixcblx0XHRcdGJvdHRvbTogMCxcblx0XHRcdG1hcmdpbjogXCIwIGF1dG9cIixcblx0XHRcdGxlZnQ6IDAsXG5cdFx0XHRyaWdodDogMCxcblx0XHR9LFxuXHRcdFwiLmZhZGVkLWRheVwiOiB7XG5cdFx0XHRjb2xvcjogdGhlbWUubmF2aWdhdGlvbl9tZW51X2ljb24sXG5cdFx0fSxcblx0XHRcIi5mYWRlZC10ZXh0XCI6IHtcblx0XHRcdGNvbG9yOiB0aGVtZS5jb250ZW50X21lc3NhZ2VfYmcsXG5cdFx0fSxcblx0XHRcIi5zdmctdGV4dC1jb250ZW50LWJnIHRleHRcIjoge1xuXHRcdFx0ZmlsbDogdGhlbWUuY29udGVudF9iZyxcblx0XHR9LFxuXHRcdFwiLm92ZXJmbG93LWF1dG9cIjoge1xuXHRcdFx0b3ZlcmZsb3c6IFwiYXV0b1wiLFxuXHRcdH0sXG5cdFx0XCIuZmxvYXQtYWN0aW9uLWJ1dHRvblwiOiB7XG5cdFx0XHRwb3NpdGlvbjogXCJmaXhlZFwiLFxuXHRcdFx0XCJib3JkZXItcmFkaXVzXCI6IFwiMjUlXCIsXG5cdFx0fSxcblx0XHRcIi5wb3NiLW1sXCI6IHtcblx0XHRcdGJvdHRvbTogcHgoc2l6ZS52cGFkX21sKSxcblx0XHR9LFxuXHRcdFwiLnBvc3ItbWxcIjoge1xuXHRcdFx0cmlnaHQ6IHB4KHNpemUudnBhZF9tbCksXG5cdFx0fSxcblx0XHRcIi5tYi1zbWFsbC1saW5lLWhlaWdodFwiOiB7XG5cdFx0XHRcIm1hcmdpbi1ib3R0b21cIjogcHgoc2l6ZS5saW5lX2hlaWdodCAqIHNpemUuZm9udF9zaXplX3NtYWxsKSxcblx0XHR9LFxuXHRcdFwiLnR1dGF1aS1jYXJkLWNvbnRhaW5lclwiOiB7XG5cdFx0XHRcImJveC1zaXppbmdcIjogXCJib3JkZXItYm94XCIsXG5cdFx0XHRcImJhY2tncm91bmQtY29sb3JcIjogdGhlbWUuY29udGVudF9iZyxcblx0XHRcdFwiYm9yZGVyLXJhZGl1c1wiOiBweChzaXplLmJvcmRlcl9yYWRpdXNfbWVkaXVtKSxcblx0XHRcdHBhZGRpbmc6IHB4KHNpemUudnBhZF9zbWFsbCksXG5cdFx0XHRwb3NpdGlvbjogXCJyZWxhdGl2ZVwiLFxuXHRcdFx0aGVpZ2h0OiBcImZpdC1jb250ZW50XCIsXG5cdFx0fSxcblx0XHRcIi50dXRhdWktdGV4dC1maWVsZCwgLmNoaWxkLXRleHQtZWRpdG9yIFtyb2xlPSd0ZXh0Ym94J11cIjoge1xuXHRcdFx0ZGlzcGxheTogXCJibG9ja1wiLFxuXHRcdFx0XCJib3gtc2l6aW5nXCI6IFwiYm9yZGVyLWJveFwiLFxuXHRcdFx0XCJiYWNrZ3JvdW5kLWNvbG9yXCI6IFwidHJhbnNwYXJlbnRcIixcblx0XHRcdGJvcmRlcjogXCJub25lXCIsXG5cdFx0XHRcImJvcmRlci1yYWRpdXNcIjogcHgoc2l6ZS5ib3JkZXJfcmFkaXVzX21lZGl1bSksXG5cdFx0XHRjb2xvcjogdGhlbWUuY29udGVudF9mZyxcblx0XHRcdHdpZHRoOiBcIjEwMCVcIixcblx0XHRcdHBhZGRpbmc6IHB4KHNpemUudnBhZF9zbWFsbCksXG5cdFx0XHR0cmFuc2l0aW9uOiBgYmFja2dyb3VuZC1jb2xvciAuMXMgZWFzZS1vdXRgLFxuXHRcdFx0XCJjYXJldC1jb2xvclwiOiB0aGVtZS5jb250ZW50X2FjY2VudCxcblx0XHR9LFxuXHRcdFwiLmNoaWxkLXRleHQtZWRpdG9yIFtyb2xlPSd0ZXh0Ym94J106Zm9jdXMtdmlzaWJsZVwiOiB7XG5cdFx0XHRvdXRsaW5lOiBcIm1lZGl1bSBpbnZlcnQgY29sb3JcIixcblx0XHR9LFxuXHRcdFwiLnR1dGF1aS10ZXh0LWZpZWxkOmZvY3VzLCAuY2hpbGQtdGV4dC1lZGl0b3IgW3JvbGU9J3RleHRib3gnXTpmb2N1c1wiOiB7XG5cdFx0XHRcImJhY2tncm91bmQtY29sb3JcIjogdGhlbWUuYnV0dG9uX2J1YmJsZV9iZyxcblx0XHR9LFxuXHRcdFwiLnR1dGF1aS10ZXh0LWZpZWxkOjpwbGFjZWhvbGRlclwiOiB7XG5cdFx0XHRjb2xvcjogdGhlbWUuY29udGVudF9tZXNzYWdlX2JnLFxuXHRcdH0sXG5cdFx0XCIudGV4dC1lZGl0b3ItcGxhY2Vob2xkZXJcIjoge1xuXHRcdFx0cG9zaXRpb246IFwiYWJzb2x1dGVcIixcblx0XHRcdHRvcDogcHgoc2l6ZS52cGFkX3NtYWxsKSxcblx0XHRcdGxlZnQ6IHB4KHNpemUudnBhZF9zbWFsbCksXG5cdFx0XHRjb2xvcjogdGhlbWUuY29udGVudF9tZXNzYWdlX2JnLFxuXHRcdH0sXG5cdFx0XCIudHV0YXVpLXN3aXRjaFwiOiB7XG5cdFx0XHRkaXNwbGF5OiBcImZsZXhcIixcblx0XHRcdFwiYWxpZ24taXRlbXNcIjogXCJjZW50ZXJcIixcblx0XHRcdGdhcDogcHgoc2l6ZS52cGFkX3NtYWxsKSxcblx0XHR9LFxuXHRcdFwiLnR1dGF1aS10b2dnbGUtcGlsbFwiOiB7XG5cdFx0XHRwb3NpdGlvbjogXCJyZWxhdGl2ZVwiLFxuXHRcdFx0ZGlzcGxheTogXCJibG9ja1wiLFxuXHRcdFx0d2lkdGg6IFwiNDUuNXB4XCIsXG5cdFx0XHRoZWlnaHQ6IFwiMjhweFwiLFxuXHRcdFx0XCJiYWNrZ3JvdW5kLWNvbG9yXCI6IHRoZW1lLmNvbnRlbnRfbWVzc2FnZV9iZyxcblx0XHRcdFwiYm9yZGVyLXJhZGl1c1wiOiBweChzaXplLnZwYWRfc21hbGwgKiA0KSxcblx0XHRcdHRyYW5zaXRpb246IGBiYWNrZ3JvdW5kLWNvbG9yICR7RGVmYXVsdEFuaW1hdGlvblRpbWV9bXMgZWFzZS1vdXRgLFxuXHRcdH0sXG5cdFx0XCIudHV0YXVpLXRvZ2dsZS1waWxsOmFmdGVyXCI6IHtcblx0XHRcdHBvc2l0aW9uOiBcImFic29sdXRlXCIsXG5cdFx0XHRjb250ZW50OiBcIicnXCIsXG5cdFx0XHR3aWR0aDogXCIyMXB4XCIsXG5cdFx0XHRoZWlnaHQ6IFwiMjFweFwiLFxuXHRcdFx0dG9wOiBcIjUwJVwiLFxuXHRcdFx0XCItd2Via2l0LXRyYW5zZm9ybVwiOiBcInRyYW5zbGF0ZVkoLTUwJSlcIixcblx0XHRcdFwiLW1vei10cmFuc2Zvcm1cIjogXCJ0cmFuc2xhdGVZKC01MCUpXCIsXG5cdFx0XHRcIi1tcy10cmFuc2Zvcm1cIjogXCJ0cmFuc2xhdGVZKC01MCUpXCIsXG5cdFx0XHR0cmFuc2Zvcm06IFwidHJhbnNsYXRlWSgtNTAlKVwiLFxuXHRcdFx0bWFyZ2luOiBcIjAgNHB4XCIsXG5cdFx0XHRcImJhY2tncm91bmQtY29sb3JcIjogXCIjZmZmXCIsXG5cdFx0XHRcImJvcmRlci1yYWRpdXNcIjogXCI1MCVcIixcblx0XHRcdGxlZnQ6IDAsXG5cdFx0XHR0cmFuc2l0aW9uOiBgbGVmdCAke0RlZmF1bHRBbmltYXRpb25UaW1lfW1zIGVhc2Utb3V0YCxcblx0XHR9LFxuXHRcdFwiLnR1dGF1aS10b2dnbGUtcGlsbC5jaGVja2VkXCI6IHtcblx0XHRcdFwiYmFja2dyb3VuZC1jb2xvclwiOiB0aGVtZS5jb250ZW50X2FjY2VudCxcblx0XHR9LFxuXHRcdFwiLnR1dGF1aS10b2dnbGUtcGlsbC5jaGVja2VkOmFmdGVyXCI6IHtcblx0XHRcdGxlZnQ6IFwiY2FsYygxMDAlIC0gMjlweClcIixcblx0XHR9LFxuXHRcdFwiLnR1dGF1aS10b2dnbGUtcGlsbCBpbnB1dFt0eXBlPSdjaGVja2JveCddXCI6IHtcblx0XHRcdFwiei1pbmRleFwiOiBcIi0xXCIsXG5cdFx0XHR2aXNpYmlsaXR5OiBcImhpZGRlblwiLFxuXHRcdFx0cG9zaXRpb246IFwiYWJzb2x1dGVcIixcblx0XHR9LFxuXHRcdFwiLnR1dGF1aS1zZWxlY3QtdHJpZ2dlclwiOiB7XG5cdFx0XHRkaXNwbGF5OiBcImZsZXhcIixcblx0XHRcdFwianVzdGlmeS1jb250ZW50XCI6IFwic3BhY2UtYmV0d2VlblwiLFxuXHRcdFx0XCJhbGlnbi1pdGVtc1wiOiBcImNlbnRlclwiLFxuXHRcdFx0Z2FwOiBweChzaXplLnZwYWRfc21hbGwpLFxuXHRcdH0sXG5cdFx0XCIuZml0LWNvbnRlbnRcIjoge1xuXHRcdFx0d2lkdGg6IFwiZml0LWNvbnRlbnRcIixcblx0XHR9LFxuXHRcdFwiLnR1dGF1aS1idXR0b24tb3V0bGluZVwiOiB7XG5cdFx0XHRib3JkZXI6IFwiMnB4IHNvbGlkXCIsXG5cdFx0XHRcImJvcmRlci1yYWRpdXNcIjogcHgoc2l6ZS5ib3JkZXJfcmFkaXVzX21lZGl1bSksXG5cdFx0XHRwYWRkaW5nOiBweChzaXplLmJvcmRlcl9yYWRpdXNfbWVkaXVtKSxcblx0XHRcdFwidGV4dC1hbGlnblwiOiBcImNlbnRlclwiLFxuXHRcdH0sXG5cdFx0XCIudW5zdHlsZWQtbGlzdFwiOiB7XG5cdFx0XHRcImxpc3Qtc3R5bGVcIjogXCJub25lXCIsXG5cdFx0XHRtYXJnaW46IDAsXG5cdFx0XHRwYWRkaW5nOiAwLFxuXHRcdH0sXG5cdFx0XCIudGltZS1zZWxlY3Rpb24tZ3JpZFwiOiB7XG5cdFx0XHRkaXNwbGF5OiBcImdyaWRcIixcblx0XHRcdFwiZ3JpZC10ZW1wbGF0ZS1jb2x1bW5zXCI6IFwiMmZyIDZmciAzZnJcIixcblx0XHRcdFwiZ3JpZC1nYXBcIjogcHgoc2l6ZS52cGFkX3NtYWxsKSxcblx0XHRcdFwiYWxpZ24taXRlbXNcIjogXCJjZW50ZXJcIixcblx0XHR9LFxuXHRcdFwiLnRpbWUtc2VsZWN0aW9uLWdyaWQgPiAqXCI6IHtcblx0XHRcdG92ZXJmbG93OiBcImhpZGRlblwiLFxuXHRcdFx0XCJ3aGl0ZS1zcGFjZVwiOiBcIm5vd3JhcFwiLFxuXHRcdFx0XCJ0ZXh0LW92ZXJmbG93XCI6IFwiY2xpcFwiLFxuXHRcdH0sXG5cdFx0XCIuaW52aXNpYmxlXCI6IHtcblx0XHRcdGFsbDogXCJub25lXCIsXG5cdFx0XHRcImJhY2tncm91bmQtY29sb3JcIjogXCJ0cmFuc3BhcmVudFwiLFxuXHRcdFx0Ym9yZGVyOiBcIm5vbmVcIixcblx0XHRcdGNvbG9yOiBcInRyYW5zcGFyZW50XCIsXG5cdFx0fSxcblx0XHRcIi5pbnZpc2libGU6OnNlbGVjdGlvblwiOiB7XG5cdFx0XHRhbGw6IFwibm9uZVwiLFxuXHRcdFx0XCJiYWNrZ3JvdW5kLWNvbG9yXCI6IFwidHJhbnNwYXJlbnRcIixcblx0XHRcdGJvcmRlcjogXCJub25lXCIsXG5cdFx0XHRjb2xvcjogXCJ0cmFuc3BhcmVudFwiLFxuXHRcdH0sXG5cdFx0XCIuaW52aXNpYmxlOjotbW96LXNlbGVjdGlvblwiOiB7XG5cdFx0XHRhbGw6IFwibm9uZVwiLFxuXHRcdFx0XCJiYWNrZ3JvdW5kLWNvbG9yXCI6IFwidHJhbnNwYXJlbnRcIixcblx0XHRcdGJvcmRlcjogXCJub25lXCIsXG5cdFx0XHRjb2xvcjogXCJ0cmFuc3BhcmVudFwiLFxuXHRcdH0sXG5cdFx0XCIudHJhbnNpdGlvbi10cmFuc2Zvcm1cIjoge1xuXHRcdFx0dHJhbnNpdGlvbjogYHRyYW5zZm9ybSAke0RlZmF1bHRBbmltYXRpb25UaW1lfW1zIGxpbmVhcmAsXG5cdFx0fSxcblx0XHRcIi5ib3JkZXItbm9uZVwiOiB7XG5cdFx0XHRib3JkZXI6IFwibm9uZVwiLFxuXHRcdH0sXG5cdFx0XCIuYmlnLXJhZGlvXCI6IHtcblx0XHRcdC8qIEluY3JlYXNlIHJhZGlvIGJ1dHRvbidzIHNpemUgKi9cblx0XHRcdHdpZHRoOiBcIjIwcHhcIixcblx0XHRcdGhlaWdodDogXCIyMHB4XCIsXG5cdFx0fSxcblx0XHRcIi5vdXRsaW5lZFwiOiB7XG5cdFx0XHRib3JkZXI6IGAycHggc29saWQgJHt0aGVtZS5jb250ZW50X2JvcmRlcn1gLFxuXHRcdFx0XCJib3JkZXItcmFkaXVzXCI6IHB4KHNpemUuYm9yZGVyX3JhZGl1c19tZWRpdW0pLFxuXHRcdH0sXG5cdFx0XCIuY2FwaXRhbGl6ZVwiOiB7XG5cdFx0XHRcInRleHQtdHJhbnNmb3JtXCI6IFwiY2FwaXRhbGl6ZVwiLFxuXHRcdH0sXG5cdFx0XCIuYm94LWNvbnRlbnRcIjoge1xuXHRcdFx0XCJib3gtc2l6aW5nXCI6IFwiY29udGVudC1ib3hcIixcblx0XHR9LFxuXHRcdFwiLmZpdC1oZWlnaHRcIjoge1xuXHRcdFx0aGVpZ2h0OiBcImZpdC1jb250ZW50XCIsXG5cdFx0fSxcblx0XHRcIi5taW4taC1zXCI6IHtcblx0XHRcdFwibWluLWhlaWdodFwiOiBweChzaXplLnZwYWRfeGwgKiA0KSxcblx0XHR9LFxuXHRcdFwiLmJvcmRlci1jb250ZW50LW1lc3NhZ2UtYmdcIjoge1xuXHRcdFx0XCJib3JkZXItY29sb3JcIjogdGhlbWUuY29udGVudF9tZXNzYWdlX2JnLFxuXHRcdH0sXG5cdFx0XCIuYm9yZGVyLXJhZGl1cy1ib3R0b20tMFwiOiB7XG5cdFx0XHRcImJvcmRlci1ib3R0b20tcmlnaHQtcmFkaXVzXCI6IHB4KDApLFxuXHRcdFx0XCJib3JkZXItYm90dG9tLWxlZnQtcmFkaXVzXCI6IHB4KDApLFxuXHRcdH0sXG5cdH1cbn0pXG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7QUFHQSxzQkFBc0I7TUFDVCxXQUFXO0NBQ3ZCLHVCQUF1QjtDQUd2QixxQkFBcUI7Q0FHckIsb0JBQW9CO0NBR3BCLGtCQUFrQjtDQUdsQixpQkFBaUI7Q0FHakIsYUFBYTtBQUViO0FBRU0sU0FBUyxrQkFDZkEsS0FDQUMsT0FDQUMsUUFDQUMsTUFPQztBQUNELFFBQU87RUFDTixVQUFVO0VBQ1YsS0FBSyxjQUFjLElBQUk7RUFDdkIsT0FBTyxjQUFjLE1BQU07RUFDM0IsUUFBUSxjQUFjLE9BQU87RUFDN0IsTUFBTSxjQUFjLEtBQUs7Q0FDekI7QUFDRDtBQUVNLFNBQVMsY0FBY0MsT0FBdUM7QUFDcEUsS0FBSSxNQUNILFFBQU8sR0FBRyxNQUFNO1NBQ04sVUFBVSxFQUNwQixRQUFPO0lBRVAsUUFBTztBQUVSOzs7O0FDekNELGtCQUFrQjtBQUVYLFNBQVMsV0FBbUI7Q0FFbEMsTUFBTUMsUUFBdUI7RUFDNUI7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0NBQ0E7QUFFRCxLQUFJLElBQUksZUFBZSxXQUFXLEtBQUssU0FBUyxLQUFNLE9BQU0sS0FBSyxVQUFVLEtBQUs7QUFDaEYsT0FBTSxLQUFLLHFCQUFxQixrQkFBa0Isa0JBQWtCO0FBQ3BFLFFBQU8sTUFB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