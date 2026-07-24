import ExpoModulesCore

public class ICloudDriveModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ICloudDrive")

    // Must not run on the main thread the first time; Expo AsyncFunctions run
    // on a background queue by default.
    AsyncFunction("getDocumentsUrlAsync") { () -> String? in
      let fm = FileManager.default
      guard let container = fm.url(forUbiquityContainerIdentifier: nil) else {
        return nil
      }
      let documents = container.appendingPathComponent("Documents", isDirectory: true)
      if !fm.fileExists(atPath: documents.path) {
        try? fm.createDirectory(at: documents, withIntermediateDirectories: true)
      }
      return documents.absoluteString
    }

    // Files in iCloud Drive may exist only as .icloud placeholders locally.
    // Triggers a download when needed and waits for the real file to appear.
    AsyncFunction("ensureDownloadedAsync") { (urlString: String) -> Bool in
      guard let url = URL(string: urlString), url.isFileURL else {
        return false
      }
      let fm = FileManager.default
      if fm.fileExists(atPath: url.path) {
        return true
      }
      let placeholder = url
        .deletingLastPathComponent()
        .appendingPathComponent(".\(url.lastPathComponent).icloud")
      guard fm.fileExists(atPath: placeholder.path) else {
        return false
      }
      try? fm.startDownloadingUbiquitousItem(at: url)
      for _ in 0..<60 {
        if fm.fileExists(atPath: url.path) {
          return true
        }
        Thread.sleep(forTimeInterval: 0.5)
      }
      return fm.fileExists(atPath: url.path)
    }
  }
}
