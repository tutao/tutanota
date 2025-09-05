import { styles } from "./styles.js"

export function responsiveCardHMargin() {
	return styles.isSingleColumnLayout() ? "mlr-8" : "mlr-24"
}

export function responsiveCardHPadding() {
	return styles.isSingleColumnLayout() ? "plr-8" : "plr-24"
}
