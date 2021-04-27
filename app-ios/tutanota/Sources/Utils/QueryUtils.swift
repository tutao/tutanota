//
//  QueryUtils.swift
//  tutanota
//
//  Created by Tutao GmbH on 6/11/21.
//  Copyright © 2021 Tutao GmbH. All rights reserved.
//

import Foundation

extension Dictionary where Key == String, Value == String {
  public func toQueryItems() -> Array<URLQueryItem> {
    var result: Array<URLQueryItem> = [];
    for (key, value) in self {
      result.append(URLQueryItem(name: key, value: value))
    }
    return result
  }
}


// Can't export Dictionary extension because of the generic constraint.
extension NSURLQueryItem {
  @objc
  public static func from(dict: Dictionary<String, String>) -> Array<URLQueryItem> {
    dict.toQueryItems()
  }
}
