import { AppType, assertMainOrNodeBoot, isApp, ProgrammingError } from "@tutao/app-env"
import { isColorLight } from "./Color.js"
import { theme } from "../theme.js"

assertMainOrNodeBoot()

export function getTutaLogo(): string {
	if (isColorLight(theme.surface)) {
		return getTutaLogoSvg(theme.outline_variant)
	}
	return getTutaLogoSvg("#fff")
}

export function getAppLogo(fillColor?: string) {
	if (!isApp()) {
		return getTutaLogoSvg(fillColor)
	} else {
		switch (APP_TYPE) {
			case AppType.Mail:
			case AppType.Integrated:
				return getMailLogoSvg(fillColor)
			case AppType.Calendar:
				return getCalendarLogoSvg(fillColor)
			case AppType.Drive:
				return getDriveLogoSvg(fillColor)
			default:
				throw new ProgrammingError("Unknown appType to provide app logo")
		}
	}
}

export function getTutaLogoSvg(fillColor?: string): string {
	const signetColor = fillColor ?? "#850122"
	const textColor = fillColor ?? "#410002"

	return `<svg version="1.1" id="tuta_x5F_rgb" xmlns="http://www.w3.org/2000/svg"  x="0px"
	 y="0px" viewBox="0 0 279.5 100" style="enable-background:new 0 0 279.5 100;" xml:space="preserve">
<g>
	<g>
		<path style="fill: ${textColor};" d="M238.6,58.1c0-8.8,6.7-19.3,18.1-19.3h8.4l-3,9.6C258.6,59.9,253,67,246.2,67C241.3,67,238.6,63.6,238.6,58.1
			 M195.9,53.3c-4.2,13.5,2.2,22.8,16.7,22.8c2.1,0,4.9-0.2,5.7-0.4c0.4-0.1,0.6-0.3,0.8-0.8l2.5-8.4c0.1-0.5,0-0.9-0.7-0.8
			c-2.2,0.2-4.2,0.4-6,0.4c-7.3,0-10.3-3.9-8.1-10.9l5.1-16.4h14.8c0.4,0,0.7-0.2,0.9-0.7l2.6-8.5c0.1-0.5-0.1-0.8-0.7-0.8H215
			l1.9-6.2c0.1-0.4,0-0.7-0.3-1l-7.7-7c-0.4-0.4-0.9-0.3-1.1,0.3L195.9,53.3z M144.9,53.6c-4.3,13.7,2.6,22.7,13.4,22.7
			c6.2,0,11.1-3,14.6-7.9l-0.1,6.3c0,0.6,0.3,0.8,0.8,0.8h6.9c0.5,0,0.7-0.2,0.9-0.7l13.9-45.1c0.2-0.6-0.1-0.9-0.6-0.9h-9.9
			c-0.5,0-0.8,0.2-0.9,0.7l-5.9,19c-3.7,11.8-9.5,18.5-15.6,18.5c-6.1,0-8.7-4.8-6.4-12.2l7.8-25.1c0.2-0.6-0.1-0.9-0.6-0.9h-9.9
			c-0.5,0-0.7,0.2-0.9,0.7L144.9,53.6z M111.2,53.3c-4.2,13.5,2.2,22.8,16.7,22.8c2.1,0,4.9-0.2,5.7-0.4c0.4-0.1,0.6-0.3,0.8-0.8
			l2.5-8.4c0.1-0.5,0-0.9-0.7-0.8c-2.2,0.2-4.2,0.4-6,0.4c-7.3,0-10.3-3.9-8.1-10.9l5.1-16.4H142c0.4,0,0.8-0.2,0.9-0.7l2.6-8.5
			c0.1-0.5-0.1-0.8-0.7-0.8h-14.6l1.9-6.2c0.1-0.4,0-0.7-0.3-1l-7.7-7c-0.4-0.4-0.9-0.3-1.1,0.3L111.2,53.3z M242.6,76.3
			c5.8,0,10.6-2.6,14.2-7.9v6.3c0,0.5,0.3,0.8,0.8,0.8h6.9c0.5,0,0.7-0.2,0.9-0.7l14-45.2c0.1-0.5-0.1-0.9-0.6-0.9H257
			c-21.3,0-29.6,18.5-29.6,30.5C227.4,69.7,233.9,76.3,242.6,76.3"/>
	</g>
	<path style="fill: ${signetColor};" d="M7.9,1L25,18.3c0.4,0.4,0.8,0.5,1.4,0.5h72.1c0.5,0,0.8-0.6,0.3-1.1L81.9,0.6C81.5,0.2,81.1,0,80.3,0h-72
		C7.6,0,7.5,0.6,7.9,1"/>
	<path style="fill: ${signetColor};" d="M5.4,99.2C5.3,99.6,5.5,100,6,100h71.1c0.7,0,1-0.3,1.2-0.9l21.5-69.4c0.2-0.7-0.1-0.9-0.7-0.9H27.8
		c-0.6,0-0.8,0.2-1,0.7L5.4,99.2z"/>
	<path style="fill: ${signetColor};" d="M0,79.2c0,0.8,1,0.8,1.2,0l16.3-53.1c0.2-0.6,0.2-1-0.3-1.5L1,8.5C0.6,8.1,0,8.3,0,8.8V79.2z"/>
</g>
</svg>`
}

export function getMailLogoSvg(fillColor: string = "#850122"): string {
	return `<svg style="fill: ${fillColor}">
	<use href="/images/mail-logo.svg#logo"></use>
</svg>`
}

export function getCalendarLogoSvg(fillColor: string = "#003E85"): string {
	return `<svg style="fill: ${fillColor}">
	<use href="/images/calendar-logo.svg#logo"></use>
</svg>`
}

export function getDriveLogoSvg(fillColor: string = "#015F47"): string {
	return `<svg style="fill: ${fillColor}">
	<use href="/images/drive-logo.svg#logo"></use>
</svg>`
}

export function getTutaLogoSignetSvg(fillColor?: string): string {
	const signetColor = fillColor ?? "#850122"

	return `<svg version="1.1" id="Layer_2_00000109733484558031751480000005632669012941692061_"
     xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 500 500"
     style="enable-background:new 0 0 500 500;" xml:space="preserve">
	<g>
	<g>
		<path d="M86,120.9L5.2,40.6c-1-0.9-2.2-0.8-2.3-0.8c-1.6,0-2.9,1.3-2.9,2.9v353.7l0,0c0,1.6,1.3,2.9,2.9,2.9
			c1.2,0,2.3-0.8,2.7-1.9c0.1-0.1,0.1-0.3,0.2-0.5c0-0.1,0.2-0.8,0.2-0.9l81.5-267.6C88.5,125.4,88.5,123.4,86,120.9z"
              fill="${signetColor}"/>
        <path d="M498.8,88.5L414.3,3c-3.7-3.6-4-3-8-3c0,0-364.4,0-364.5,0c-1.6,0-2.9,1.3-2.9,2.9c0,0.1-0.1,1.3,0.9,2.4
			l0.1,0.1L125,91.5c2,2,4,2.5,7,2.5h365.3C499.8,94,501.1,90.8,498.8,88.5z" fill="${signetColor}"/>
	</g>
        <path d="M499.9,146.5L392.4,495.6c-0.4,1.1-0.7,1.9-0.9,2.5c-0.4,1-1.2,1.7-2.3,1.9c-0.2,0-0.6,0-0.6,0H29.7
		c-1.6,0-2.9-1.3-2.9-2.9c0-0.4,0.2-1.1,0.2-1.1l107.2-350.6c0.1-0.5,0.3-1.1,0.5-1.6c0.4-1.1,1.4-1.9,2.6-1.9c1.5,0,359,0,359,0
		C499.2,141.9,500.5,143.7,499.9,146.5z" fill="${signetColor}"/>
</g>
</svg> `
}
