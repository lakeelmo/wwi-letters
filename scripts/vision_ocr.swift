import Foundation
import Vision
import AppKit

let path = CommandLine.arguments[1]
let url = URL(fileURLWithPath: path)
guard let img = NSImage(contentsOf: url),
      let tiff = img.tiffRepresentation,
      let rep = NSBitmapImageRep(data: tiff),
      let cg = rep.cgImage else {
  fputs("load failed\n", stderr); exit(1)
}
let request = VNRecognizeTextRequest()
request.recognitionLevel = .accurate
request.usesLanguageCorrection = true
request.recognitionLanguages = ["en-US"]
let handler = VNImageRequestHandler(cgImage: cg, options: [:])
try handler.perform([request])
for obs in (request.results ?? []) {
  if let candidate = obs.topCandidates(1).first {
    print(String(format: "%.2f\t%@", candidate.confidence, candidate.string))
  }
}
