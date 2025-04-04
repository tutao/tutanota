import { getElevatedBackground, Theme, theme } from "../gui/theme.js"
import { PlanType } from "../api/common/TutanotaConstants.js"
import { locator } from "../api/main/CommonLocator.js"
import { themes } from "../gui/builtinThemes.js"
import { client } from "../misc/ClientDetector.js"

// TODO: Update color to follow the Material 3 color rules after the color token update

/**
 * An object containing utility functions for determining colors used in the PlanBox component.
 */
export const planBoxColors = {
	getBgColor,
	getBoxShadow,
	getTextColor,
	getOutlineColor,
	getFeatureIconColor,
}

/**
 * Determines the background color for the PlanBox component based on the selection state and theme.
 */
function getBgColor(isSelected: boolean) {
	if (locator.themeController.isLightTheme()) {
		if (isSelected) {
			return theme.experimental_primary_container
		} else {
			return theme.surface
		}
	} else {
		if (isSelected) {
			return "#D7C3B8"
		} else {
			return getElevatedBackground()
		}
	}
}

/**
 * Determines the box shadow style for the PlanBox component based on the current theme.
 */
function getBoxShadow() {
	if (locator.themeController.isLightTheme()) {
		return `0px 0px 16px 0px hsl(from ${theme.experimental_on_primary_container} h s l / 25%)`
	}

	return "none"
}

/**
 * Determines the text color for the PlanBox component based on the selection state and theme.
 */
function getTextColor(isSelected: boolean, isDisabled: boolean, hasCampaign?: boolean) {
	const localTheme = hasCampaign ? getBlueTheme() : theme
	if (isDisabled) {
		if (locator.themeController.isLightTheme()) {
			return "#b8b8b8"
		} else {
			return "#d5d5d5"
		}
	}

	if (isSelected) {
		return localTheme.experimental_on_primary_container
	} else {
		return localTheme.on_surface
	}
}

/**
 * Determines the border color for the PlanBox component based on the selection state and theme.
 */
function getOutlineColor(isSelected: boolean) {
	if (locator.themeController.isLightTheme()) {
		if (isSelected) {
			return "transparent"
		} else {
			return theme.on_surface
		}
	} else {
		if (isSelected) {
			return "transparent"
		} else {
			return theme.on_surface
		}
	}
}

/**
 * Determines the icon and divider color for the PlanBox component based on the selection state and theme.
 */
function getFeatureIconColor(isSelected: boolean, isDisabled: boolean, planType: PlanType, hasCampaign?: boolean) {
	const localTheme = hasCampaign ? getBlueTheme() : theme

	if (planType === PlanType.Free || isDisabled) {
		if (isSelected) {
			return localTheme.experimental_tertiary
		} else if (locator.themeController.isLightTheme()) {
			return "#b8b8b8"
		} else {
			return "#d5d5d5"
		}
	} else {
		if (isSelected) {
			return localTheme.experimental_tertiary
		} else {
			return localTheme.primary
		}
	}
}

/**
 * Get blue theme with the current light/dark theme selection. This should only be used for the Go European campaign.
 */
export function getBlueTheme(): Theme {
	const isCalendarApp = client.isCalendarApp()
	if (theme.themeId === "light" || theme.themeId === "light_secondary") {
		return isCalendarApp ? themes().light : themes().light_secondary
	} else {
		return isCalendarApp ? themes().dark : themes().dark_secondary
	}
}
