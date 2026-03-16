package de.tutao.calendar.widget.style

object Dimensions {
	/*
	 * Size is intended to be used when defining Width and Height of components;
	 * It is a scale in increments of 8 as it doesn't need to be as granular as Spacing
	 */
	object Size {
		const val core_8 = 8
		const val core_16 = 16
		const val core_24 = 24
		const val core_32 = 32
		const val core_40 = 40
		const val core_48 = 48
	}

	/*
	 * Spacing is intended to be used when defining Padding, Margin and Gaps between elements;
	 * It is a scale in increments of 4 as it needs to be more granular
	 */
	object Spacing {
		const val space_4 = 4
		const val space_8 = 8
		const val space_12 = 12
		const val space_16 = 16
		const val space_20 = 20
		const val space_24 = 24
	}

	object FontSize {
		const val font_20 = 20
		const val font_16 = 16
		const val font_14 = 14
		const val font_12 = 12
	}

}