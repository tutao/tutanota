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
		static let XS = 8.0
		static let SM = 16.0
		static let MD = 24.0
		static let LG = 32.0
		static let XL = 40.0
		static let XXL = 48.0
	}

	/*
  * Spacing is intended to be used when defining Padding, Margin and Gaps between elements;
  * It is a scale in increments of 4 as it needs to be more granular
  */struct Spacing {
		static let XS = 4.0
		static let SM = 8.0
		static let MD = 12.0
		static let LG = 16.0
		static let XL = 20.0
		static let XXL = 24.0
	}
}
