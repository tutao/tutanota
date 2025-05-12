import { theme } from "../gui/theme.js"
import { PlanType } from "../api/common/TutanotaConstants.js"
import { locator } from "../api/main/CommonLocator.js"

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
function getBgColor({ isSelected }: { isSelected: boolean }) {
	if (locator.themeController.isLightTheme()) {
		if (isSelected) {
			return theme.experimental_primary_container
		} else {
			return theme.content_bg
		}
	} else {
		if (isSelected) {
			return "#D7C3B8"
		} else {
			return "#303030"
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
function getTextColor({ isSelected }: { isSelected: boolean }) {
	return `${isSelected ? theme.experimental_on_primary_container : theme.content_fg}`
}

/**
 * Determines the border color for the PlanBox component based on the selection state and theme.
 */
function getOutlineColor({ isSelected }: { isSelected: boolean }) {
	if (locator.themeController.isLightTheme()) {
		if (isSelected) {
			return "transparent"
		} else {
			return theme.content_border
		}
	} else {
		if (isSelected) {
			return "transparent"
		} else {
			return theme.content_fg
		}
	}
}

/**
 * Determines the icon and divider color for the PlanBox component based on the selection state and theme.
 */
function getFeatureIconColor({ isSelected, planType }: { isSelected: boolean; planType: PlanType }) {
	if (planType === PlanType.Free) {
		if (isSelected) {
			return theme.experimental_tertiary
		} else if (locator.themeController.isLightTheme()) {
			return "#b8b8b8"
		} else {
			return "#d5d5d5"
		}
	} else {
		if (isSelected) {
			return theme.experimental_tertiary
		} else {
			return theme.content_accent
		}
	}
}
