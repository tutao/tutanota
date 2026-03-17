//
//  Dimensions.swift
//  calendar
//
//  Created by Tutao GmbH on 9/11/25.
//

struct Dimensions {
	/*
  * Size is intended to be used when defining Width and Height of components;
  * It is a scale in increments of 8 as it doesn't need to be as granular as Spacing
  */struct Size {
		static let core_8 = 8.0
		static let core_12 = 12.0
		static let core_16 = 16.0
		static let core_24 = 24.0
		static let core_32 = 32.0
		static let core_40 = 40.0
		static let core_48 = 48.0
	}

	/*
  * Spacing is intended to be used when defining Padding, Margin and Gaps between elements;
  * It is a scale in increments of 4 as it needs to be more granular
  */struct Spacing {
		static let space_4 = 4.0
		static let space_8 = 8.0
		static let space_12 = 12.0
		static let space_16 = 16.0
		static let space_20 = 20.0
		static let space_24 = 24.0
	}

	struct FontSize {
		static let font_20 = 20.0
		static let font_16 = 16.0
		static let font_14 = 14.0
		static let font_12 = 12.0
	}
}
