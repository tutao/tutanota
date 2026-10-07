import Tutao_LangApi

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
