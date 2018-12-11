//@flow
import {styles} from "./styles"
import {px, size} from "./size"
import {client} from "../misc/ClientDetector"
import {noselect, position_absolute, positionValue} from "./mixins"
import {assertMainOrNodeBoot, isAdminClient, isApp} from "../api/Env"
import {theme} from "./theme.js"
import {BrowserType} from "../misc/ClientConstants"

assertMainOrNodeBoot()

export function requiresStatusBarHack() {
	return isApp() && client.device === "iPhone" && client.browserVersion < 11
}

styles.registerStyle('main', () => {
	return {
		"*:not(input):not(textarea)": isAdminClient() ? {} : {
			"user-select": "none", /* disable selection/Copy for UI elements*/
			"-ms-user-select": "none",
			"-webkit-user-select": "none",
			"-moz-user-select": "none",
			"-webkit-touch-callout": "none", /* disable the IOS popup when long-press on a link */
			"-webkit-user-drag": client.isMobileDevice() ? "none" : "",
			"-webkit-tap-highlight-color": "rgba(0, 0, 0, 0)"
		},

		".selectable": {
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
			"src": `url('${System.getConfig().baseURL}images/ionicons.ttf') format('truetype')`,
			"font-weight": "normal",
			"font-style": "normal"
		},

		// Allow long-click contextual actions for iOS
		".touch-callout *": {
			"-webkit-touch-callout": "default !important"
		},

		/*
		 Box Sizing
		 */
		[`html, body, div, article, section, main, footer, header, form, fieldset, legend,
            pre, code, p, a, h1, h2, h3, h4, h5, h6, ul, ol, li, dl, dt, dd, textarea,
            input[type="email"], input[type="number"], input[type="password"],
            input[type="tel"], input[type="text"], input[type="url"], .border-box`]: {'box-sizing': 'border-box'},


		'a': {color: 'inherit'},

		'html, body': {height: '100%', margin: 0, width: "100%"},
		'html': {'-webkit-font-smoothing': 'subpixel-antialiased'}, // define font-smoothing for css animation in safari
		'body': {position: "fixed"}, // Fix body for iOS & Safari
		'button, textarea': {
			padding: 0,
			'text-align': 'left'
		},

		'body, button, foreignObject': { // foreign object is just for svg rendering (see List.js)
			overflow: 'hidden',
			// see: https://www.smashingmagazine.com/2015/11/using-system-ui-fonts-practical-guide/ and github
			'font-family': `-apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`,
			'font-size': px(size.font_size_base),
			'line-height': size.line_height,
			color: theme.content_fg,
			'background-color': theme.content_bg,
			'-webkit-text-size-adjust': 'none' // fix for safari browser

		},

		'small, .small': {
			'font-size': px(size.font_size_small),
		},

		'.b': {
			'font-weight': 'bold',
		},
		'.i': {'font-style': 'italic'},
		'.click': {
			cursor: 'pointer',
			'-webkit-tap-highlight-color': 'rgba(255, 255, 255, 0)',
		},
		'.click-disabled': {
			cursor: 'default'
		},
		'.text': {
			cursor: 'text'
		},
		'.overflow-hidden': {
			overflow: 'hidden'
		},
		'.overflow-x-hidden': {
			'overflow-x': 'hidden'
		},


		'h1, h2, h3, h4, h5, h6': {margin: 0},
		'h1, .h1': {'font-size': px(size.font_size_base * 2)},
		'h2, .h2': {'font-size': px(size.font_size_base * 1.8)},
		'h3, .h3': {'font-size': px(size.font_size_base * 1.6)},
		'h4, .h4': {'font-size': px(size.font_size_base * 1.4)},
		'h5, .h5': {'font-size': px(size.font_size_base * 1.2)},
		'h6, .h6': {'font-size': px(size.font_size_base * 1.1)},
		"h1, h2, h3, h4, h5, h6": {'font-weight': 'normal'},
		'input, button, select, textarea': {
			'font-family': 'inherit',
			'font-size': 'inherit',
			'line-height': 'inherit'
		},

		".hr": {margin: 0, border: 'none', height: '1px', 'background-color': theme.content_border},
		".border": {border: `1px solid ${theme.content_border}`},

		".white-space-pre": {'white-space': "pre"},

		//view: position_absolute(0, 0, 0, 0),

		// margins
		'.m-0': {margin: 0},
		'.mt': {'margin-top': px(size.vpad)},
		'.mt-xs': {'margin-top': px(size.vpad_xs)},
		'.mt-s': {'margin-top': px(size.vpad_small)},
		'.mt-l': {'margin-top': px(size.vpad_large)},
		'.mt-xl': {'margin-top': px(size.vpad_xl)},
		'.mt-form': {'margin-top': px(size.hpad_medium)},
		'.mb-0': {'margin-bottom': 0},
		'.mb': {'margin-bottom': px(size.vpad)},
		'.mb-s': {'margin-bottom': px(size.vpad_small)},
		'.mb-l': {'margin-bottom': px(size.vpad_large)},
		'.mb-xl': {'margin-bottom': px(size.vpad_xl)},
		'.mlr': {'margin-left': px(size.hpad), 'margin-right': px(size.hpad)},
		'.mlr-l': {'margin-left': px(size.hpad_large), 'margin-right': px(size.hpad_large)},
		'.mr-s': {'margin-right': px(size.vpad_small)},
		'.ml-s': {'margin-left': px(size.vpad_small)},

		// paddings
		'.pt-responsive': {'padding-top': px(size.hpad_large * 3)},
		'.pt': {'padding-top': px(size.vpad)},
		'.pt-0': {'padding-top': 0},
		'.pt-s': {'padding-top': px(size.vpad_small)},
		'.pt-l': {'padding-top': px(size.vpad_large)},
		'.pt-m': {'padding-top': px(size.vpad)},
		'.pt-ml': {'padding-top': px(size.vpad_ml)},
		'.pt-xl': {'padding-top': px(size.vpad_xl)},
		'.pb-0': {'padding-bottom': 0},
		'.pb': {'padding-bottom': px(size.vpad)},
		'.pb-2': {'padding-bottom': '2px'}, // for dropdown toggles
		'.pb-s': {'padding-bottom': px(size.vpad_small)},
		'.pb-l': {'padding-bottom': px(size.vpad_large)},
		'.pb-xl': {'padding-bottom': px(size.vpad_xl)},
		'.pb-m': {'padding-bottom': px(size.vpad)},
		'.pb-floating': {'padding-bottom': px(size.button_floating_size + size.hpad_large)}, // allow scrolling across the floating button
		'.plr': {'padding-left': px(size.hpad), 'padding-right': px(size.hpad)},
		'.pl': {'padding-left': px(size.hpad)},
		'.pl-s': {'padding-left': px(size.hpad_small)},
		'.pl-m': {'padding-left': px(size.hpad)},
		'.pr': {'padding-right': px(size.hpad)},
		'.pr-s': {'padding-right': px(size.hpad_small)},
		'.pr-m': {'padding-right': px(size.vpad)},

		// p-l will be overwritten in media query mobile
		'.plr-l': {'padding-left': px(size.hpad_large), 'padding-right': px(size.hpad_large)},
		'.pl-l': {'padding-left': px(size.hpad_large)},
		'.pr-l': {'padding-right': px(size.hpad_large)},

		'.plr-button': {'padding-left': px(size.hpad_button), 'padding-right': px(size.hpad_button)},

		'.plr-nav-button': {'padding-left': px(size.hpad_nav_button), 'padding-right': px(size.hpad_nav_button)},
		'.pl-button': {'padding-left': px(size.hpad_button)},

		'.mt-negative-s': {'margin-top': px(-size.hpad_button)},
		'.mr-negative-s': {'margin-right': px(-size.hpad_button)},
		'.ml-negative-s': {'margin-left': px(-size.hpad_button)}, // negative margin to handle the default padding of a button
		'.ml-negative-l': {'margin-left': px(-size.hpad_large)},
		'.ml-negative-xs': {'margin-left': px(-3)},
		'.ml-negative-bubble': {'margin-left': px(-7)},
		'.mr-negative-m': {'margin-right': px(-(size.hpad_button + size.hpad_nav_button))}, // negative margin to handle the padding of a nav button
		".fixed-bottom-right": {position: "fixed", bottom: px(size.hpad_large), right: px(size.hpad_large)},

		// common setting
		'.text-ellipsis': {overflow: 'hidden', 'text-overflow': 'ellipsis', 'min-width': 0, 'white-space': 'nowrap'},
		'.text-break': {overflow: 'hidden', 'word-break': 'break-word'},
		'.break-word-links a': {'word-wrap': 'break-word'},
		'.text-prewrap': {'white-space': 'pre-wrap'},
		'.text-pre': {'white-space': 'pre'},
		'.z1': {'z-index': '1'},
		'.z2': {'z-index': '2'},
		'.z3': {'z-index': '3'},
		'.noselect': noselect,
		'.no-wrap': {'white-space': 'nowrap'},


		'.view-columns': {'overflow-x': 'hidden'},
		'.overflow-x-hidden': {'overflow-x': 'hidden'},

		'.view-column': {'will-change': 'transform'},

		'.will-change-alpha': {'will-change': 'alpha'},

		// borders
		'.password-indicator-border': {'border': `1px solid ${theme.content_button}`},

		'.border-top': {'border-top': `1px solid ${theme.content_border}`},

		// colors
		'.bg-transparent': {'background-color': 'transparent'},

		'.content-fg': {color: theme.content_fg},
		'.content-accent-fg': {color: theme.content_accent},
		'.svg-content-fg path': {fill: theme.content_fg},
		'.content-bg': {'background-color': theme.content_bg,},
		'.content-hover:hover': {
			color: theme.content_accent,
		},
		'.content-message-bg': {'background-color': theme.content_message_bg},

		'.list-bg': {'background-color': theme.list_bg},
		'.list-accent-fg': {color: theme.list_accent_fg},
		'.svg-list-accent-fg path': {fill: theme.list_accent_fg},
		'.list-message-bg': {'background-color': theme.list_message_bg},

		'.password-indicator-bg': {'background-color': theme.content_button},

		'.accent-bg': {'background-color': theme.content_accent},
		'.accent-fg': {color: theme.content_button_icon},
		'.accent-fg path': {fill: theme.content_button_icon},

		'.red': {
			'background-color': '#840010',
		},
		'.swipe-spacer': {
			color: '#ffffff',
		},
		'.swipe-spacer path': {
			fill: '#ffffff',
		},
		'.blue': {'background-color': "#2196F3"},

		'.hover-ul:hover': {'text-decoration': isApp() ? 'none' : 'underline'},

		// positioning
		'.fill-absolute': {position: 'absolute', top: 0, bottom: 0, left: 0, right: 0},
		'.abs': {position: 'absolute'},
		'.fixed': {position: 'fixed'},
		'.rel': {position: 'relative'},
		'.max-width-s': {'max-width': px(360)},
		'.max-width-m': {'max-width': px(450)},
		'.max-width-l': {'max-width': px(800)},
		'.max-width-200': {'max-width': px(200)},

		'.scroll': {
			'overflow-y': client.overflowAuto,
			'-webkit-overflow-scrolling': 'touch',
			'-ms-overflow-style': '-ms-autohiding-scrollbar'
		},
		'.scroll-x': {
			'overflow-x': 'auto',
			'-webkit-overflow-scrolling': 'touch',
			'-ms-overflow-style': '-ms-autohiding-scrollbar',
		},
		'.center': {'text-align': 'center'},
		'.right': {'text-align': 'right'},
		'.left': {'text-align': 'left'},
		'.statusTextColor': {color: theme.content_accent},
		'.button-height': {height: px(size.button_height)},
		'.button-height-accent': {height: px(size.button_height_accent) + " !important"},
		'.button-min-height': {'min-height': px(size.button_height)},
		'.button-width-fixed': {width: px(size.button_height)},
		'.large-button-height': {height: px(size.button_floating_size)},
		'.large-button-width': {width: px(size.button_floating_size)},
		// Stretch editor a little bit more than parent so that the content is visible
		'.full-height': {"min-height": client.isIos() ? '101%' : '100%'},
		'.full-width': {width: '100%'},
		'.half-width': {width: '50%'},
		'.block': {display: 'block'},
		'.no-text-decoration': {'text-decoration': 'none'},
		'.strike': {'text-decoration': 'line-through'},

		// flex box
		'.flex-space-around': {display: 'flex', 'justify-content': 'space-around'},
		'.flex-space-between': {display: 'flex', 'justify-content': 'space-between'},
		'.flex-fixed': {flex: "0 0 auto"},
		'.flex-center': {display: 'flex', 'justify-content': 'center'},
		'.flex-end': {display: 'flex', 'justify-content': 'flex-end'},
		'.flex-start': {display: 'flex', 'justify-content': 'flex-start'},
		'.flex-v-center': {display: 'flex', 'flex-direction': "column", 'justify-content': 'center'},
		'.flex-direction-change': {display: 'flex', 'justify-content': 'center'},
		'.flex-column': {'flex-direction': "column"},
		'.flex-column-reverse': {'flex-direction': "column-reverse"},
		'.flex': {display: 'flex'},
		'.flex-grow': {flex: "1"},
		'.flex-third': {flex: '1 0 0', 'min-width': "100px"}, // splits a flex layout into three same width columns
		'.flex-third-middle': {flex: '2 1 0'}, // take up more space for the middle column
		'.flex-half': {flex: '0 0 50%'}, // splits a flex layout into two same width columns
		'.flex-grow-shrink-half': {flex: '1 1 50%'},
		'.flex-grow-shrink-auto': {flex: "1 1 auto"}, // allow element to grow and shrink using the elements width as default size.
		'.flex-grow-shrink-150': {flex: "1 1 150px"},
		'.flex-no-shrink': {flex: "1 0 0"},
		'.flex-no-grow-no-shrink-auto': {flex: "0 0 auto"},
		'.flex-no-grow': {flex: "0"},
		'.flex-no-grow-shrink-auto': {flex: "0 1 auto"},
		'.flex-wrap': {'flex-wrap': 'wrap'}, // elements may move into the next line
		'.items-center': {'align-items': 'center'},
		'.items-end': {'align-items': 'flex-end'},
		'.items-start': {'align-items': 'flex-start'},
		'.items-base': {'align-items': 'baseline'},
		'.items-stretch': {'align-items': 'stretch'},
		'.align-self-center': {'align-self': 'center'},
		'.align-self-end': {'align-self': 'flex-end'},
		'.align-self-stretch': {'align-self': 'stretch'},
		'.justify-center': {'justify-content': 'center'},
		'.justify-between': {'justify-content': 'space-between'},
		'.justify-end': {'justify-content': 'flex-end'},
		'.justify-start': {'justify-content': 'flex-start'},
		'.child-grow > *': {flex: "1 1 auto"},
		'.last-child-fixed > *:last-child': {flex: "1 0 100px"},
		'.limit-width': {'max-width': '100%'},

		'.border': {'border': `1px solid ${theme.content_border}`},
		'.border-radius': {'border-radius': px(size.border_radius)},
		'.editor-border': {
			'border': `1px solid ${theme.content_border}`,
			'padding-top': px(size.vpad_small),
			'padding-bottom': px(size.vpad_small),
			'padding-left': px(size.hpad),
			'padding-right': px(size.hpad),
		},
		'.editor-border-active': {
			'border': `2px solid ${theme.content_accent}`,
			'padding-top': px(size.vpad_small - 1),
			'padding-bottom': px(size.vpad_small - 1),
			'padding-left': px(size.hpad - 1),
			'padding-right': px(size.hpad - 1),
		},

		// icon
		'.icon': {
			height: px(size.icon_size_medium),
			width: px(size.icon_size_medium),
		},
		'.icon > svg': {
			height: px(size.icon_size_medium),
			width: px(size.icon_size_medium),
		},
		'.icon-progress-search': {
			height: px(20),
			width: px(20),
		},
		'.icon-progress-search > svg': {
			height: px(20),
			width: px(20),
		},
		'.icon-large': {
			height: px(size.icon_size_large),
			width: px(size.icon_size_large)
		},
		'.icon-large > svg': {
			height: px(size.icon_size_large),
			width: px(size.icon_size_large)
		},
		'.icon-xl': {
			height: px(size.icon_size_xl),
			width: px(size.icon_size_xl)
		},
		'.icon-xl > svg': {
			height: px(size.icon_size_xl),
			width: px(size.icon_size_xl)
		},
		'.icon-progress > svg': {
			'animation-name': 'rotate-icon',
			'animation-duration': '2s',
			'animation-iteration-count': 'infinite',
			'animation-timing-function': 'calculatePosition',
			'transform-origin': '50% 50%',
			display: 'inline-block'
		},
		'@keyframes rotate-icon': {
			'0%': {
				transform: 'rotate(0deg)',
			},
			'100%': {
				transform: 'rotate(360deg)',
			}
		},

		// custom styling for views

		// the main view
		'.main-view': {
			position: 'absolute',
			top: px(size.navbar_height),
			right: px(0),
			bottom: px(0),
			left: px(0),
			'overflow-x': 'hidden',
			'margin-top': requiresStatusBarHack() ? "20px" : 'env(safe-area-inset-top)' // insets for iPhone X)
		},

		// view slider

		'.backface_fix': { // TODO check if this can be removed
			'-webkit-backface-visibility': 'hidden',
			'backface-visibility': 'hidden'
		},

		// header
		'.header-nav': {
			position: 'absolute', top: 0, left: 0, right: 0,
			height: px(size.navbar_height),
			'background-color': theme.header_bg,
			'box-shadow': `0 3px 2px 0 ${theme.header_box_shadow_bg}`,
			'z-index': 1, // box_shadow will be overruled by the views background, otherwise
			'margin-top': requiresStatusBarHack() ? "20px" : 'env(safe-area-inset-top)' // insets for iPhone X)
		},


		'.notification-overlay-content': {
			'margin-left': px(size.vpad),
			'margin-right': px(size.vpad),
			'padding-top': px(size.vpad),
			'margin-top': (requiresStatusBarHack() ? "20px" : 'env(safe-area-inset-top)') // insets for iPhone X)
		},

		'.logo-circle': {
			width: px(size.button_icon_bg_size),
			height: px(size.button_icon_bg_size),
			'border-radius': "50%",
			overflow: "hidden"
		},
		'.logo': {height: px(size.header_logo_height)},
		'.logo-text': {height: px(size.header_logo_height), width: px(128)},
		'.logo-height': {height: px(size.header_logo_height)},
		'.logo-height > svg, .logo-height > img': {height: px(size.header_logo_height)},

		'.custom-logo': {width: px(200), 'background-repeat': "no-repeat", 'background-size': "auto 100%"},

		// fix for IE11: use position absolute to fill header parts and center child elements using flex box
		'.header-left': {position: 'absolute', left: '0', top: 0, bottom: 0, width: '310px'},
		'.header-right': {position: 'absolute', left: '310px', right: '0', top: 0, bottom: 0},
		'.header-right > .nav-bar': {width: '100%'},

		'.nav-bar-spacer': {
			width: "2px",
			height: "24px",
			'margin-left': "2px",
			'margin-top': "10px",
			"background-color": theme.navigation_border,
		},
		'.search-bar > .text-field': {
			"padding-top": '0 !important'
		},


		// dialogs
		'.dialog': {'min-width': px(200)},
		'.dialog-width-l': {'max-width': px(800)},
		'.dialog-width-m': {'max-width': px(500)},
		'.dialog-width-s': {'max-width': px(400)},
		'.dialog-width-alert': {'max-width': px(350)},
		'.dialog-header': {
			'border-bottom': `1px solid ${theme.content_border}`,
			height: px(size.button_height + 1)
		},
		'.dialog-header-line-height': {'line-height': px(size.button_height)},
		'.dialog-progress': {
			'text-align': 'center',
			padding: px(size.hpad_large),
			width: `calc(100% - ${2 * size.hpad}px)`
		},
		'.dialog-container': position_absolute(size.button_height + 1, 0, 0, 0),
		'.dialog-contentButtonsBottom': {padding: `0 ${px(size.hpad_large)} ${px(size.vpad)} ${px(size.hpad_large)}`},
		'.dialog-img': {width: px(150), height: "auto"},
		'.dialog-buttons': {'border-top': `1px solid ${theme.content_border}`},
		'.dialog-buttons > button': {
			'flex': '1',
		},
		'.dialog-buttons > button:not(:first-child)': {
			'border-left': `1px solid ${theme.content_border}`,
			'margin-left': '0'
		},
		'.dialog-max-height': {'max-height': 'calc(100vh - 100px)'},

		// mail folder view column
		' .folder-column': {
			'background-color': theme.navigation_bg,
			height: '100%',
			'border-right': `1px solid ${theme.navigation_border}`
		},
		'.list-border-right': {
			'border-right': `1px solid ${theme.list_border}`
		},
		'.folders': {'margin-bottom': px(12)},
		'.folder-row': {
			'border-left': px(size.border_selection) + ' solid transparent',
			'margin-right': px(-size.hpad_button)
		},
		'.row-selected': {'border-color': `${theme.list_accent_fg} !important`, color: `${theme.list_accent_fg}`},
		'.folder-row > a': {'flex-grow': 1, 'margin-left': px(-size.hpad_button - size.border_selection)},

		'.expander': {height: px(size.button_height), 'min-width': px(size.button_height)},

		// mail view editor
		'.mail-viewer-firstLine': {'pading-top': px(10)},
		'.hide-outline': {outline: 'none'},
		'.nofocus:focus': {
			outline: 'none'
		},

		'blockquote.tutanota_quote': {
			'border-left': `1px solid ${theme.content_accent}`,
			'padding-left': px(size.hpad),
			'margin-left': px(0)
		},

		'.MsoNormal': {margin: 0},

		// list
		'.list': {
			overflow: 'hidden',
			'list-style': 'none',
			margin: 0,
			padding: 0,
		},
		'.list-alternate-background': {
			'background': `repeating-linear-gradient(to bottom, ${theme.list_alternate_bg}, ${theme.list_alternate_bg} ${px(size.list_row_height)},  ${theme.list_bg} ${px(size.list_row_height)}, ${theme.list_bg} ${px(size.list_row_height
				* 2)})`
		},
		'.list-row': {
			position: 'absolute', left: 0, right: 0,
			'background-color': theme.list_bg,
			height: px(size.list_row_height),
			'border-left': px(size.border_selection) + " solid transparent"
		},
		'.list-row > div': {'margin-left': px(-size.border_selection)},
		'.odd-row': {
			'background-color': theme.list_alternate_bg,
		},
		'.list-loading': {bottom: 0},

		// mail list
		".teamLabel": {
			color: theme.list_alternate_bg,
			"background-color": theme.list_accent_fg,
		},
		".ion": {
			"display": "inline-block",
			"font-family": "'Ionicons'",
			"speak": "none",
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
			"line-height": px(18)
		},

		".list-font-icons": {
			"letter-spacing": "8px",
			"text-align": "right",
			"margin-right": "-8px",
			"color": theme.content_accent
		},

		'.monospace': {
			'font-family': '"Lucida Console", Monaco, monospace'
		},

		// action bar
		'.action-bar': {width: 'initial', 'margin-left': 'auto'},

		// dropdown
		'.dropdown-panel': {
			position: 'absolute',
			width: 0,
			height: 0,
			'background-color': theme.content_bg,
			overflow: 'hidden' // while the dropdown is slided open we do not want to show the scrollbars. overflow-y is later overwritten to show scrollbars if necessary
		},
		'.dropdown-content:first-child': {'padding-top': px(size.vpad_small)},
		'.dropdown-content:last-child': {'padding-bottom': px(size.vpad_small)},
		'.dropdown-content > *': {width: '100%'},
		'.dropdown-content': {overflow: 'hidden'},

		//dropdown filter bar
		'.dropdown-bar': {
			'border-style': 'solid',
			'border-width': '0px 0px 1px 0px',
			'border-color': theme.content_border,
			'padding-bottom': '1px',
			'outline': 'none',
			'z-index': 1,
			'background-color': theme.content_bg,
			'border-radius': `${size.border_radius}px ${size.border_radius}px 0 0`,
			color: theme.content_fg,
		},

		'.dropdown-bar:focus': {
			'border-style': 'solid',
			'border-width': '0px 0px 2px 0px',
			'border-color': `${theme.content_accent}`,
			'padding-bottom': '0px',
			'outline': 'none',
		},

		'button, .nav-button': {
			position: 'relative',
			border: 0,
			cursor: 'pointer',
			outline: 'none',
			overflow: 'hidden',
			'white-space': 'nowrap',
			margin: 0, // for safari
			'flex-shrink': 0,
			'-webkit-tap-highlight-color': 'rgba(255, 255, 255, 0)',
		},

		'.nav-button:hover': !isApp() ? {
			'text-decoration': 'underline',
			opacity: 0.7,
		} : {},
		'.nav-button:focus': client.isDesktopDevice() ? {
			'text-decoration': 'underline',
			opacity: 0.7,
		} : {},
		'button:focus, button:hover': client.isDesktopDevice() ? {
			opacity: 0.7,
		} : {},


		'.button-icon': {
			width: px(size.button_icon_bg_size),
			height: px(size.button_icon_bg_size),
			'border-radius': px(size.button_icon_bg_size),
			'min-width': px(size.button_icon_bg_size),
		},
		'.button-icon.floating': {
			height: px(size.button_floating_size),
			width: px(size.button_floating_size),
			'min-width': px(size.button_floating_size),
			'border-radius': px(size.button_icon_bg_size),
		},

		'.login': {
			width: "100%",
			'border-radius': px(size.border_radius),

		},
		'.button-content': {
			height: px(size.button_height),
			'min-width': px(size.button_height)
		},
		'.primary': {color: theme.content_accent, 'font-weight': 'bold'},
		'.secondary': {color: theme.content_accent},
		'.textBubble': {color: theme.content_accent, 'padding-top': px(size.text_bubble_tpad)},
		'.bubble, .toggle': {
			'max-width': "300px",
			// make the visible button smaller by 7px without changing the actual click area
			'border-radius': px(size.border_radius + ((size.button_height - size.button_height_bubble) / 2)),
			border: `${px(size.bubble_border_width)} solid ${theme.content_bg}`,
			'background-color': theme.button_bubble_bg,
			color: theme.button_bubble_fg,
		},
		'.on': {
			'background-color': theme.content_button_selected
		},
		'.off': {
			'background-color': theme.content_button
		},

		'.segmentControl': {
			// same border as for bubble buttons
			'border-top': `${px(((size.button_height - size.button_height_bubble) / 2))} solid transparent`,
			'border-bottom': `${px(((size.button_height - size.button_height_bubble) / 2))} solid transparent`,
		},

		'.segmentControl-border': {
			'border': `1px solid ${theme.content_border}`,
			'padding-top': px(1),
			'padding-bottom': px(1),
			'padding-left': px(1),
			'padding-right': px(1),
		},
		'.segmentControl-border-active': {
			'border': `2px solid ${theme.content_accent}`,
			'padding-top': px(0),
			'padding-bottom': px(0),
			'padding-left': px(0),
			'padding-right': px(0),
		},

		'.segmentControlItem': {
			cursor: 'pointer'
		},
		'.segmentControlItem:last-child': {
			'border-bottom-right-radius': px(size.border_radius),
			'border-top-right-radius': px(size.border_radius),
		},

		'.segmentControlItem:first-child': {
			'border-bottom-left-radius': px(size.border_radius),
			'border-top-left-radius': px(size.border_radius)
		},

		// contact
		'.wrapping-row': {display: 'flex', 'flex-flow': 'row wrap', 'margin-right': px(-size.hpad_large)},
		'.wrapping-row > *': {
			flex: '1 0 40%',
			'margin-right': px(size.hpad_large),
			'min-width': px(200), // makes sure the row is wrapped with too large content
		},

		'.non-wrapping-row': {display: 'flex', 'flex-flow': 'row', 'margin-right': px(-size.hpad_large)},
		'.non-wrapping-row > *': {
			flex: '1 0 40%',
			'margin-right': px(size.hpad_large),
		},

		// text input field
		'.inputWrapper': {
			flex: "1 1 auto",
			background: 'transparent',
			overflow: 'hidden',
		},

		// textarea
		'.input, .input-area': {
			display: 'block',
			resize: 'none',
			border: 0,
			padding: 0,
			margin: 0, // for safari browser
			background: 'transparent',
			outline: 'none',
			width: '100%',
			overflow: 'hidden',
			color: theme.content_fg,
		},
		'.input-no-clear::-ms-clear': { // remove the clear (x) button from edge input fields
			display: 'none'
		},

		// table

		'.table': {
			'border-collapse': 'collapse',
			'table-layout': 'fixed',
			width: '100%'
		},

		'.table tr:first-child': {
			'border-bottom': `1px solid ${theme.content_border}`
		},

		'.table td': {
			'vertical-align': 'middle',
		},

		'td': {
			'padding': 0,
		},

		'.column-width-small': {
			width: px(size.column_width_s_desktop)
		},

		'.column-width-largest': {},
		'.buyOptionBox': {
			position: 'relative',
			display: 'inline-block',
			border: `1px solid ${theme.content_border}`,
			width: "100%",
			padding: px(10)
		},
		'.buyOptionBox.selected': {
			border: `1px solid ${theme.content_accent}`,
		},

		'.ribbon-vertical': {
			position: "absolute",
			"margin-bottom": "80px",
			width: "40px",
			height: "60px",
			background: theme.content_accent,
			top: "-6px",
			right: "10px",
			color: theme.content_bg,
		},
		'.ribbon-vertical:before': {
			content: '""',
			position: "absolute",
			height: 0,
			width: 0,
			'border-bottom': `6px solid ${theme.content_accent}`,
			"border-right": "6px solid transparent",
			right: "-6px"
		},
		'.ribbon-vertical:after': {
			content: '""',
			position: "absolute",
			height: 0,
			width: 0,
			left: 0,
			"border-left": `20px solid ${theme.content_accent}`,
			"border-right": `20px solid ${theme.content_accent}`,
			"border-bottom": "20px solid transparent",
			"bottom": "-20px"
		},

		// media query for small devices where elements should be arranged in one column
		// also adaptions for table column widths
		"@media (max-width: 400px)": { // currently used for the reminder dialog
			'.flex-direction-change': {
				display: 'flex',
				'flex-direction': "column-reverse",
				'justify-content': 'center'
			},
			'.column-width-small': {width: px(size.column_width_s_mobile)}
		},

		'@keyframes move-stripes': {
			'0%': {
				'background-position': '0 0'
			},
			'100%': {
				'background-position': '15px 0'
			}
		},

		'.indefinite-progress': {
			"background-image": `repeating-linear-gradient(
  -45deg,
  ${theme.content_accent},
  ${theme.content_accent} 5px,
  ${theme.content_bg} 5px,
  ${theme.content_bg} 10px
);`,
			// WebKit based browsers initially implemented old specification, we cannot specify unprefixed value
			// for them
			[client.browser === BrowserType.SAFARI ? "-webkit-background-size" : "background-size"]: px(15),
			"width": "100%",
			"height": px(3),
			"animation": "move-stripes 2s linear infinite"
		},

		'.transition-margin': {'transition': `margin-bottom 200ms ease-in-out`},

		'.date-selected': {
			'border-radius': '50%',
			background: theme.content_accent,
			color: theme.content_button_icon,
		},

		// media query for mobile devices, should be one pixel less than style.isDesktopLayout
		[`@media (max-width: ${size.desktop_layout_width - 1}px)`]: {
			'.main-view': {top: positionValue(size.navbar_height_mobile)},
			'.header-nav': {height: px(size.navbar_height_mobile)},
			'.logo-height': {height: px(size.header_logo_height_mobile)},
			'.logo-height > svg': {height: px(size.header_logo_height_mobile)},
			// adjust padding for mobile devices
			//'.plr-l': {'padding-left': px(size.hpad_large_mobile), 'padding-right': px(size.hpad_large_mobile)},
			//'.pl-l': {'padding-left': px(size.hpad_large_mobile)},
			//'.pr-l': {'padding-right': px(size.hpad_large_mobile)},

			//".fixed-bottom-right": {bottom: px(size.hpad_large_mobile), right: px(size.hpad_large_mobile)},
			'.pt-responsive': {'padding-top': px(size.hpad_large)},
			'.header-logo': {
				height: px(size.header_logo_height_mobile),
			},
			'.header-logo > svg': {
				height: px(size.header_logo_height_mobile),
				width: 'auto'
			},

			'.header-left': {
				width: `${px(size.navbar_edge_width_mobile)}`
			},
			'.header-middle': {
				position: 'absolute',
				right: px(size.navbar_edge_width_mobile),
				left: px(size.navbar_edge_width_mobile),
				top: 0,
				bottom: 0,
			},
			'.header-right': {
				left: 'auto',
				width: `${px(size.navbar_edge_width_mobile)}`
			},

			'.custom-logo': {width: px(40)},

			'.notification-overlay-content': {
				'padding-top': px(size.vpad_small)
			}
		},

		"@media print": {
			'html, body': {position: "initial"}, // overwrite position "fixed" otherwise only one page will be printed.
			".header-nav": {display: 'none'},
			".main-view": {
				top: 0,
				position: "static !important"
			},
			".dropdown-panel": {
				display: 'none'
			},
			".fill-absolute": {
				position: "static !important"
			},
			".view-columns": {
				width: "100% !important",
				transform: "initial !important",
			},
			".view-column:nth-child(1), .view-column:nth-child(2)": {
				display: 'none'
			},
			".view-column": {
				width: "100% !important",
			},
			"#mail-viewer": {
				overflow: "visible",
				display: "block"
			},
			"#mail-body": {
				overflow: "visible"
			},
			"#login-view": {
				display: 'none',
			},
			".dialog-header": {
				display: 'none'
			},
			".dialog-container": {
				overflow: "visible",
				position: "static !important"
			},
			"#wizard-paging": {
				display: 'none'
			},
			"button:not(.print)": {
				display: 'none'
			},

		},

		// detect webkit autofills; see TextField and https://medium.com/@brunn/detecting-autofilled-fields-in-javascript-aed598d25da7
		"@keyframes onAutoFillStart": {from: {/**/}, to: {/**/}},
		"@keyframes onAutoFillCancel": {from: {/**/}, to: {/**/}},
		// use the animations as hooks for JS to capture 'animationstart' events
		"input:-webkit-autofill": {"animation-name": "onAutoFillStart",},
		"input:not(:-webkit-autofill)": {"animation-name": "onAutoFillCancel"},

		// for compatibility with Outlook 2010/2013 emails. have a negative indentation (18.0pt) on each list element and additionally this class
		// we strip all global style definitions, so the list elements are only indented to the left if we do not allow the MsoListParagraph classes
		// they are whitelisted in HtmlSanitizer.js
		".MsoListParagraph, .MsoListParagraphCxSpFirst, .MsoListParagraphCxSpMiddle, .MsoListParagraphCxSpLast": {
			"margin-left": "36.0pt"
		}
	}
})