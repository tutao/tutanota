package de.tutao.calendar.widget.style

object Dimensions {
	/*
	 * Size is intended to be used when defining Width and Height of components;
	 * It is a scale in increments of 8 as it doesn't need to be as granular as Spacing
	 */
	object Size {
		const val XS = 8
		const val SM = 16
		const val MD = 24
		const val LG = 32
		const val XL = 40
		const val XXL = 48
	}

	/*
	 * Spacing is intended to be used when defining Padding, Margin and Gaps between elements;
	 * It is a scale in increments of 4 as it needs to be more granular
	 */
	object Spacing {
		const val XS = 4
		const val SM = 8
		const val MD = 12
		const val LG = 16
		const val XL = 20
		const val XXL = 24
	}
}