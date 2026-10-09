public enum BotKind: String, Sendable, StringBasedEnum {
  public var __tsValue: SwString { return SwString(self.rawValue) }
  // Object is used instead of Typescript enum to avoid emitting IIFE which might be affected by further tree-shaking.
  // See example of compiled enums https://stackoverflow.com/q/47363996)
  case Awesomium = "awesomium"
  case Cef = "cef"
  case CefSharp = "cefsharp"
  case CoachJS = "coachjs"
  case Electron = "electron"
  case FMiner = "fminer"
  case Geb = "geb"
  case NightmareJS = "nightmarejs"
  case Phantomas = "phantomas"
  case PhantomJS = "phantomjs"
  case Rhino = "rhino"
  case Selenium = "selenium"
  case Sequentum = "sequentum"
  case SlimerJS = "slimerjs"
  case WebDriverIO = "webdriverio"
  case WebDriver = "webdriver"
  case HeadlessChrome = "headless_chrome"
  case Unknown = "unknown"
}

public struct BotdResult {
  public let bot: Bool
  public let botKind: Nullable<BotKind>

  public init(bot: Bool, botKind: Nullable<BotKind>) {
    self.bot = bot
    self.botKind = botKind
  }
}

public final class FingerprintJs {
  public static func detect(_ monitoring: Bool) -> Promise<BotdResult> {
    fatalError("not implemented")
  }
}
