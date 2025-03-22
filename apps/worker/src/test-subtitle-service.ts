import * as fs from "fs";
import * as path from "path";
import { SubtitleService } from "./services/subtitle.service";

/**
 * Test script for SubtitleService
 * Tests subtitle functionality with animation and limited character set
 */
async function testSubtitleService() {
  const subtitleService = new SubtitleService();

  // Define paths
  const inputVideoPath = path.join(__dirname, "test-files/input-video.mp4");
  const outputVideoPath = path.join(
    __dirname,
    "test-files/output-with-subtitles.mp4"
  );
  const batchOutputVideoPath = path.join(
    __dirname,
    "test-files/output-with-batched-subtitles.mp4"
  );

  // Ensure test directory exists
  const testDir = path.join(__dirname, "test-files");
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  // Check if input video exists
  if (!fs.existsSync(inputVideoPath)) {
    console.error(`❌ Input video not found at ${inputVideoPath}`);
    console.log("Please place a test video at this location and try again.");
    return;
  }

  // Create test word timestamps with allowed characters only (alphanumerics, ?!.)
  const wordTimestamps = [
    { word: "HELLO!", start: 1.0, end: 1.5 },
    { word: "WORLD?", start: 1.6, end: 2.1 },
    { word: "THIS", start: 2.3, end: 2.6 },
    { word: "IS", start: 2.7, end: 2.9 },
    { word: "A", start: 3.0, end: 3.2 },
    { word: "TEST...", start: 3.3, end: 3.8 },
    { word: "OF", start: 4.0, end: 4.2 },
    { word: "ANIMATED", start: 4.3, end: 4.8 },
    { word: "SUBTITLES!", start: 4.9, end: 5.5 },
    { word: "WITH", start: 5.7, end: 6.0 },
    { word: "BASIC", start: 6.1, end: 6.4 },
    { word: "PUNCTUATION", start: 6.5, end: 7.0 },
  ];

  // Create a larger set of words for batch testing
  const batchTimestamps = Array.from({ length: 40 }, (_, i) => ({
    word: `WORD ${i + 1}${i % 3 === 0 ? "!" : i % 3 === 1 ? "?" : "."}`,
    start: 1.0 + i * 0.3,
    end: 1.3 + i * 0.3,
  }));

  console.log("Starting subtitle tests...");

  try {
    // Test 1: Regular subtitle processing with allowed characters
    console.log(
      "\n--- TEST 1: Standard Processing with Allowed Characters ---"
    );
    const result = await subtitleService.addSubtitlesToVideo(
      inputVideoPath,
      wordTimestamps,
      outputVideoPath,
      {
        fontSize: 60,
        textColor: "#FFD32C", // Yellow color
        outlineColor: "#000000", // Black outline
        outlineThickness: "thick",
        customFontPath: path.join(__dirname, "../fonts/concert-one.ttf"),
        position: "middle",
      }
    );

    console.log("✅ Test 1 completed successfully!");
    console.log(`Output video saved to: ${result}`);

    // Test 2: Batch processing with many words
    console.log("\n--- TEST 2: Batch Processing with 40 Words ---");
    const batchResult = await subtitleService.addSubtitlesToVideo(
      inputVideoPath,
      batchTimestamps,
      batchOutputVideoPath,
      {
        fontSize: 60,
        textColor: "#FF4500", // Orange-red color
        outlineColor: "#000000", // Black outline
        outlineThickness: "thick",
        customFontPath: path.join(__dirname, "../fonts/integral-cf.otf"),
        position: "bottom",
      }
    );

    console.log("✅ Test 2 completed successfully!");
    console.log(`Batched output video saved to: ${batchResult}`);
  } catch (error) {
    console.error("❌ Test failed with error:", error);
  }
}

// Run the test
testSubtitleService();
