//
//  UIColorExtensionsTest.swift
//  tutanotaTests
//
//  Created by Tutao GmbH on 6/16/21.
//  Copyright © 2021 Tutao GmbH. All rights reserved.
//

import XCTest
import tutanota

class UIColorExtensionsTest: XCTestCase {

    override func setUpWithError() throws {
        // Put setup code here. This method is called before the invocation of each test method in the class.
    }

    override func tearDownWithError() throws {
        // Put teardown code here. This method is called after the invocation of each test method in the class.
    }

    func testIsColorLightPinkDark() throws {
      XCTAssertEqual(UIColor.isColorLight("#B73A9A"), false)
    }
  
    func testIsColorLightBlueLight() throws {
      XCTAssertEqual(UIColor.isColorLight("#3A9AFF"), true)
    }
}
