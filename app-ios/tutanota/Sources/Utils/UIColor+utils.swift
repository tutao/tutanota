//
//  UIColor+hex.swift
//  tutanota
//
//  Created by Tutao GmbH on 6/1/21.
//  Copyright © 2021 Tutao GmbH. All rights reserved.
//

import UIKit

@objc
extension UIColor {

  /// Convenience constructor to initialize from a hex color string.
  /// Supported formats:
  /// #RGB
  /// #RRGGBB
  /// #RRGGBBAA
  @objc
  public convenience init?(hex: String) {
    
    var color: UInt32 = 0
    if parseColorCode(hex, &color) {
      let r = CGFloat(redPart(color)) / 255.0
      let g = CGFloat(greenPart(color)) / 255.0
      let b = CGFloat(bluePart(color)) / 255.0
      let a = CGFloat(alphaPart(color)) / 255

      self.init(red: r, green: g, blue: b, alpha: a)
      return
    }
    
    return nil
  }
  
  @objc
  public static func isColorLight(_ hexCode: String) -> Bool {
    var rgba: UInt32 = 0
    assert(parseColorCode(hexCode, &rgba), "Invalid color code: " + hexCode)

    // Counting the perceptive luminance
    // human eye favors green color...
    let a = 1 - (0.299 * Double(redPart(rgba)) + 0.587 * Double(greenPart(rgba)) + 0.114 * Double(bluePart(rgba))) / 255
    return a < 0.5
  }
}


/** Parse a #RGB or #RRGGBB #RRGGBBAA color code into an 0xRRGGBBAA int */
private func parseColorCode(_ code: String, _ rrggbbaa: UnsafeMutablePointer<UInt32>?) -> Bool {
  if (code.first != "#" || (code.count != 4 && code.count != 7 && code.count != 9)) {
    return false
  }

  let start = code.index(code.startIndex, offsetBy: 1)
  var hexString = String(code[start...]).uppercased()
  
  // input was #RGB
  if hexString.count == 3 {
    hexString = expandShortHex(hex: hexString)
  }
  
  // input was #RGB or #RRGGBB, set alpha channel to max
  if hexString.count != 8 {
    hexString += "FF"
  }
    
  return Scanner(string: hexString).scanHexInt32(rrggbbaa)
}

private func expandShortHex(hex: String) -> String {
  assert(hex.count == 3, "hex string must be exactly 3 characters")

  var hexCode = ""
  for char in hex {
    hexCode += String(repeating: char, count: 2)
  }
  return hexCode
}

private func redPart(_ rrggbbaa: UInt32) -> UInt8 {
  return UInt8((rrggbbaa >> 24) & 0xff)
}

private func greenPart(_ rrggbbaa: UInt32) -> UInt8 {
  return UInt8((rrggbbaa >> 16) & 0xff)
}

private func bluePart(_ rrggbbaa: UInt32) -> UInt8 {
  return UInt8((rrggbbaa >> 8) & 0xff)
}

private func alphaPart(_ rrggbbaa: UInt32) -> UInt8 {
  return UInt8(rrggbbaa & 0xff)
}
