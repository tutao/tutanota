import Foundation

func translate(_ key: String, default defaultValue: String) -> String {
  return Bundle.main.localizedString(forKey: key, value: defaultValue, table: "InfoPlist")
}

// // keep in sync with src/native/main/NativePushServiceApp.ts
let SYS_MODEL_VERSION = 85

func addSystemModelHeaders(to headers: inout [String : String]) {
  headers["v"] = String(SYS_MODEL_VERSION)
}
