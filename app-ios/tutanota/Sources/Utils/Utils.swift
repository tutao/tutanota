import Foundation

func translate(_ key: String, default defaultValue: String) -> String {
  return Bundle.main.localizedString(forKey: key, value: defaultValue, table: "InfoPlist")
}

let SYS_MODEL_VERSION = 64

func addSystemModelHeaders(to headers: inout [String : String]) {
  headers["v"] = String(SYS_MODEL_VERSION)
}
