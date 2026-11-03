// swift-tools-version: 6.0
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
  name: "Tutao_LangApi",
  products: [
    .library(
      name: "Tutao_LangApi",
      targets: ["Tutao_LangApi"]
    )
  ],
  targets: [
    .target(
      name: "Tutao_LangApi",
      path: "Sources/lang-api"
    )
  ]
)
