import Foundation

/** corresponds to the DataFile in typescript */
public struct DataFile: Codable {
  let name: String
  let mimeType: String
  let size: Int
  let data: DataWrapper
  private let _type: String = "DataFile"
}
