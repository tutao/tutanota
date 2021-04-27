//
//  ThemeManager.swift
//  tutanota
//
//  Created by Tutao GmbH on 6/11/21.
//  Copyright © 2021 Tutao GmbH. All rights reserved.
//

import Foundation

typealias ThemeId = String
typealias Theme = Dictionary<String, String>

let SELECTED_THEME = "theme"
let THEMES = "themes"

@objc
class ThemeManager : NSObject {
  @objc
  public var selectedThemeId: ThemeId {
    get {
      return UserDefaults.standard.object(forKey: SELECTED_THEME) as! ThemeId? ?? "light"
    }
    set(newVal) {
      UserDefaults.standard.setValue(newVal, forKey: SELECTED_THEME)
    }
  }
  
  @objc
  public var themes: Array<Theme> {
    get {
      UserDefaults.standard.object(forKey: THEMES) as! Array<Theme>? ?? []
    }
    set(newVal) {
      return UserDefaults.standard.setValue(newVal, forKey: THEMES)
    }
  }
  
  @objc
  public var currenTheme: Theme? {
    get {
      return themes.first { theme in theme["themeId"] == selectedThemeId }
    }
  }
  
  @objc
  public var currenThemeWithFallback: Theme {
    get {
      currenTheme ?? [
        "themeId": "light-fallback",
        "content_bg": "#ffffff",
        "header_bg": "#ffffff"
      ]
    }
  }
}
