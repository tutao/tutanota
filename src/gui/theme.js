// @flow
import {Logo} from "./base/icons/Logo"
import {deviceConfig} from "../misc/DeviceConfig"
import stream from "mithril/stream/stream.js"

export type Theme = {
	logo: string,

	button_bubble_bg: string,
	button_bubble_fg: string,

	content_bg: string,
	content_fg: string,
	content_light_fg: string,
	content_button: string,
	content_button_selected: string,
	content_button_icon: string,
	content_button_icon_selected: string,
	content_accent: string,
	content_border: string,
	content_message_bg: string,

	header_bg: string,
	header_box_shadow_bg: string,
	header_button: string,
	header_button_icon: string,
	header_button_selected: string,
	header_button_icon_selected: string,

	list_bg: string,
	list_alternate_bg: string,
	list_accent_fg: string,
	list_message_bg: string,
	list_border: string,

	modal_bg: string,

	navigation_light_fg: string,
	navigation_bg: string,
	navigation_border: string,
	navigation_button: string,
	navigation_button_selected: string,
	navigation_button_icon: string,
	navigation_button_icon_selected: string,

}

let customTheme: Theme|string = "is replaced at runtime with a custom theme" // see RootHandler.java
export const themeId: stream<ThemeId> = stream(getThemeId())
export var theme: Theme = getTheme()
export var defaultTheme: Theme = getLightTheme()

themeId.map(() => {
	theme = Object.assign(theme, getTheme())
})

function getThemeId(): ThemeId {
	if (typeof customTheme == "object" && Object.keys(customTheme).length > 0) {
		return 'custom'
	} else {
		if (deviceConfig.getTheme()) {
			return deviceConfig.getTheme()
		} else {
			return 'light'
		}
	}
}

function getTheme(): Theme {
	switch (themeId()) {
		case 'custom':
			return (Object.assign({}, getLightTheme(), (customTheme:any)):any)
		case 'dark':
			return getDarkTheme() // getD()
		default:
			return getLightTheme()
	}
}

export function updateCustomTheme(updatedTheme: ?Object) {
	customTheme = Object.assign({}, defaultTheme, updatedTheme)
	themeId('custom')
}


function getLightTheme() {
	const light = '#ffffff'

	const grey_lightest = '#f6f6f6'
	const grey_lighter = '#eaeaea'
	const grey_dark = '#d5d5d5'
	const grey = '#909090'
	const grey_darker = '#707070'
	const grey_darkest = '#4A4A4A'

	const red = '#840010'

	return {
		logo: Logo.Red,


		button_bubble_bg: grey_lighter,
		button_bubble_fg: grey_darkest,

		content_fg: grey_darkest,
		content_light_fg: grey,
		content_button: grey_darker,
		content_button_selected: red,
		content_button_icon: light,
		content_button_icon_selected: light,
		content_accent: red,
		content_bg: light,
		content_border: grey_dark,
		content_message_bg: grey_lightest,

		header_bg: light,
		header_box_shadow_bg: grey_dark,
		header_button: grey_darker,
		header_button_icon: light,
		header_button_selected: red,
		header_button_icon_selected: light,

		list_bg: grey_lightest,
		list_alternate_bg: light,
		list_accent_fg: red,
		list_message_bg: light,
		list_border: grey_dark,

		modal_bg: grey_darkest,

		navigation_light_fg: grey,
		navigation_bg: grey_lighter,
		navigation_border: grey_dark,
		navigation_button: grey_darker,
		navigation_button_icon: light,
		navigation_button_selected: red,
		navigation_button_icon_selected: light,
	}
}

function getDarkTheme(): Theme {

	const lightest = '#fff'
	const lighter = '#c5c7c7'
	const light = '#B0B0B0'
	const grey = '#909090'

	const dark_lightest = '#5e5c5c'
	const dark_lighter = '#4a4a4a'
	const dark = '#3b3a3a'
	const dark_darkest = '#222222'

	const cyan = '#76cbda'

	return {
		logo: Logo.Cyan,


		button_bubble_bg: dark_lighter,
		button_bubble_fg: lighter,

		content_fg: lighter,
		content_light_fg: grey,
		content_button: light,
		content_button_selected: cyan,
		content_button_icon: dark_lighter,
		content_button_icon_selected: lightest,
		content_accent: cyan,
		content_bg: dark_lighter,
		content_border: light,
		content_message_bg: dark_lightest,


		header_bg: dark_darkest,
		header_box_shadow_bg: dark,
		header_button: light,
		header_button_icon: dark_lighter,
		header_button_selected: cyan,
		header_button_icon_selected: lightest,

		list_bg: dark,
		list_alternate_bg: dark_lighter,
		list_accent_fg: cyan,
		list_message_bg: dark_lightest,
		list_border: dark,

		modal_bg: lighter,

		navigation_light_fg: grey,
		navigation_bg: dark_lightest,
		navigation_border: dark,
		navigation_button: light,
		navigation_button_icon: dark_lighter,
		navigation_button_selected: cyan,
		navigation_button_icon_selected: lightest,
	}
}

function getD(): Theme {
	const lila_1 = '#522974'
	const lila_2 = '#792573'
	const lila_dark = '#2c256b'
	const transparent = 'transparent' // geht momentan nicht als Einstellung
	const light = '#ffffff'

	const grey_lightest = '#f6f6f6'
	const grey_lighter = '#eaeaea'
	const grey_dark = '#d5d5d5'
	const grey = '#909090'
	const grey_darker = '#707070'
	const grey_darkest = '#4A4A4A'

	const blue = '#00adef'

	return {
		logo: `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg
   xmlns:dc="http://purl.org/dc/elements/1.1/"
   xmlns:cc="http://creativecommons.org/ns#"
   xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
   xmlns:svg="http://www.w3.org/2000/svg"
   xmlns="http://www.w3.org/2000/svg"
   xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"
   xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
   version="1.1"
viewbox="0 0 653.625 98.569107"
   
   id="svg7811"
   inkscape:version="0.91 r13725">
  <metadata
     id="metadata8">
    <rdf:RDF>
      <cc:Work
         rdf:about="">
        <dc:format>image/svg+xml</dc:format>
        <dc:type
           rdf:resource="http://purl.org/dc/dcmitype/StillImage" />
      </cc:Work>
    </rdf:RDF>
  </metadata>
  <sodipodi:namedview
     pagecolor="#ffffff"
     bordercolor="#666666"
     borderopacity="1"
     objecttolerance="10"
     gridtolerance="10"
     guidetolerance="10"
     inkscape:pageopacity="0"
     inkscape:pageshadow="2"
     inkscape:window-width="1920"
     inkscape:window-height="1016"
     id="namedview6"
     showgrid="false"
     inkscape:zoom="0.46509849"
     inkscape:cx="331.11266"
     inkscape:cy="32.083896"
     inkscape:window-x="0"
     inkscape:window-y="27"
     inkscape:window-maximized="1"
     inkscape:current-layer="svg7811" />
  <defs
     id="defs7813" />
  <g
     transform="translate(-110.33036,-468.79189)"
     id="layer1">
    <path
       d="m 671.80437,473.79189 0,39.87197 13.39573,0 c -2.70885,-3.04784 -4.25512,-7.17128 -4.25512,-11.34696 0,-10.09653 8.501,-18.12362 18.91161,-18.12362 4.50913,0 8.49287,1.42664 11.81975,3.93991 l 0,-14.3413 -39.87197,0 z m 47.12142,0 0,14.3413 c 3.30555,-2.51327 7.4948,-3.93991 11.97735,-3.93991 10.4266,0 18.75401,8.02709 18.75401,18.12362 0,4.17568 -1.45906,8.29912 -4.09751,11.34696 l 13.39572,0 0,-39.87197 -40.02957,0 z m -603.59543,0.15735 0,86.83579 38.92639,0 c 30.47598,0 44.59987,-17.0321 44.59987,-43.65429 0,-21.88229 -10.27177,-43.1815 -39.39918,-43.1815 l -44.12708,0 z m 90.46052,0 0,16.86285 24.11229,0 0,-16.86285 -24.11229,0 z m 106.53538,0 0,86.83579 24.26989,0 0,-18.28122 4.25511,-4.5703 12.92294,22.85152 29.15539,0 -26.16106,-39.39918 22.69393,-23.7971 -27.42183,0 -15.44448,18.28121 0,-41.92072 -24.26989,0 z m 219.84742,0 0,16.86285 24.2699,0 0,-16.86285 -24.2699,0 z m 167.68291,17.02044 c -6.56238,0 -11.97735,4.94551 -11.97735,11.34697 0,6.13356 5.41497,11.34696 11.97735,11.34696 l 11.81975,0 0,-11.34696 c 0,-6.40146 -5.20376,-11.34697 -11.81975,-11.34697 z m 31.04655,0 c -6.53554,0 -11.97735,4.94551 -11.97735,11.34697 l 0,11.34696 11.97735,0 c 6.68079,0 11.97735,-5.2134 11.97735,-11.34696 0,-6.40146 -5.29656,-11.34697 -11.97735,-11.34697 z m -458.29125,5.0431 c -15.05238,0 -32.0464,2.89746 -32.78012,20.64517 l 22.53633,0 c 0.12456,-2.67395 1.67436,-6.46147 9.14061,-6.46147 3.91672,0 7.87983,1.57627 7.87983,5.83108 0,4.0135 -3.3177,5.06564 -6.61906,5.67348 -12.36541,2.30954 -35.77445,1.49604 -35.77445,21.43316 0,13.25239 10.14267,19.2268 22.37873,19.2268 7.83294,0 15.34599,-1.72883 20.48757,-7.56465 l 0.15735,0 c -0.11851,1.7016 0.33587,4.28714 0.94558,5.98868 l 24.58509,0 c -2.69175,-4.01118 -2.83674,-9.44375 -2.83674,-14.1837 l 0,-25.84587 c 0,-12.1589 0.25619,-24.74268 -30.10098,-24.74268 z m 141.67945,0 c -23.86751,0 -34.67128,15.59123 -34.67128,33.09531 0,17.5067 10.80377,33.25291 34.67128,33.25291 23.8672,0 34.67127,-15.74621 34.67127,-33.25291 0,-17.50408 -10.80407,-33.09531 -34.67127,-33.09531 z m 86.363,0 c -9.66767,0 -16.11289,3.29314 -20.64517,9.6134 l -0.3152,0 0,-8.03743 -23.32431,0 0,63.19628 24.26989,0 0,-33.4105 c 0,-10.09013 5.45361,-12.13495 9.6134,-12.13495 7.09942,0 8.03744,5.15409 8.03744,12.45014 l 0,33.09531 24.26989,0 0,-43.3391 c 0,-14.46854 -10.52297,-21.43315 -21.90594,-21.43315 z m 95.50361,0 c -20.07465,0 -33.5681,15.05424 -33.5681,33.4105 0,21.03077 15.29969,32.93772 35.61686,32.93772 14.44241,0 27.8815,-6.40085 32.78011,-20.01479 l -22.69392,0 c -1.95854,3.03892 -6.32707,4.57031 -10.24379,4.57031 -7.59066,0 -11.68293,-5.1201 -12.29254,-12.29255 l 46.49103,0 c 0,-24.55629 -10.87962,-38.61119 -36.08965,-38.61119 z m -453.87855,0.15734 8.51022,0 c 19.45989,0 21.11796,15.17377 21.11796,20.64517 0,8.14536 -2.45972,21.59075 -19.2268,21.59075 l -10.40138,0 0,-42.23592 z m 63.51148,1.41837 0,63.19629 24.11229,0 0,-63.19629 -24.11229,0 z m 326.3828,0 0,63.19629 24.2699,0 0,-63.19629 -24.2699,0 z M 598.3643,511.457 c 6.24214,0 10.71658,4.72367 10.71658,10.55898 l -23.16672,0 c 1.10051,-6.80807 5.23206,-10.55898 12.45014,-10.55898 z m -184.07296,2.04876 c 9.18216,0 10.40138,8.91695 10.40138,15.60208 0,6.68795 -1.21922,15.60207 -10.40138,15.60207 -9.17713,0 -10.40139,-8.91412 -10.40139,-15.60207 0,-6.68513 1.22426,-15.60208 10.40139,-15.60208 z m 257.51303,7.40705 0,39.87197 40.02957,0 0,-39.87197 -40.02957,0 z m 47.12142,0 0,39.87197 40.02957,0 0,-39.87197 -40.02957,0 z m -439.53725,11.50456 0,5.83108 c -0.36663,6.56454 -4.57771,9.77099 -10.08619,9.77099 -4.40726,0 -7.56464,-2.91354 -7.56464,-5.83108 0,-4.25496 2.81032,-5.56288 8.19503,-6.77665 3.30671,-0.7314 6.51523,-1.53371 9.4558,-2.99434 z"
       id="path50"
       style="fill:#00adef;fill-opacity:1;fill-rule:nonzero;stroke:none"
       inkscape:connector-curvature="0" />
  </g>
</svg>`,


		button_bubble_bg: grey_lighter,
		button_bubble_fg: grey_darkest,

		content_fg: grey_darkest,
		content_light_fg: grey,
		content_button: grey_darker,
		content_button_selected: lila_dark,
		content_button_icon: light,
		content_button_icon_selected: light,
		content_accent: lila_dark,
		content_bg: light,
		content_border: grey_dark,
		content_message_bg: grey_lightest,

		header_bg: lila_1,
		header_box_shadow_bg: transparent,
		header_button: light,
		header_button_icon: grey_darker,
		header_button_selected: blue,
		header_button_icon_selected: light,

		list_bg: grey_lightest,
		list_alternate_bg: light,
		list_accent_fg: lila_dark,
		list_message_bg: light,
		list_border: grey_dark,

		modal_bg: grey_darkest,

		navigation_light_fg: light,
		navigation_bg: lila_2,
		navigation_border: grey_dark,
		navigation_button: light,
		navigation_button_icon: grey_darker,
		navigation_button_selected: blue,
		navigation_button_icon_selected: light,
	}

}