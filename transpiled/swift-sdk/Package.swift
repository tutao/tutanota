// swift-tools-version: 6.0
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription
let package = Package(
    name: "swift-sdk",
    products: [
        // Products define the executables and libraries a package produces, making them visible to other packages.
        .library(
            name: "swift-sdk",
            targets: ["AppEnv", "LangApi"]
        ),
        .executable(name: "Cli", targets: ["Cli"])
    ],
    targets: [
        // Targets are the basic building blocks of a package, defining a module or a test suite.
        // Targets can depend on other targets in this package and products from dependencies.
        .target(name: "LangApi", dependencies: [], path: "Sources/LangApi"),
        .target(name: "AppEnv",dependencies: ["LangApi"], path: "Sources/PlatformKit/AppEnv"),
        .target(name: "Cli", dependencies: ["LangApi"])
    ]
)
