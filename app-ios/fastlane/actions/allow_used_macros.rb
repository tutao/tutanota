module Fastlane
  module Actions
    class AllowUsedMacrosAction < Action
      def self.run(params)
        # Allow used macros
        # If used macros are changed allow them manually in Xcode and copy the file from
        # the path below to macros.json
        sh "mkdir -p ~/Library/org.swift.swiftpm/security/"
        sh "cp -v macros.json ~/Library/org.swift.swiftpm/security/macros.json"
      end

      def self.description
        "copy allowed Swift macros allowed for Tuta to the SwiftPM config directory"
      end

      def self.is_supported?(platform)
        platform == :ios
      end
    end
  end
end
