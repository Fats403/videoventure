import * as fs from "fs";
import * as path from "path";
import concat from "ffmpeg-concat";

async function testTransitionService() {
  // Define paths
  const inputVideo1Path = path.join(__dirname, "test-files/input-video1.mp4");
  const inputVideo2Path = path.join(__dirname, "test-files/input-video2.mp4");
  const inputVideo3Path = path.join(__dirname, "test-files/input-video3.mp4");

  const outputVideoPath = path.join(__dirname, "test-files/output-video.mp4");
  // Ensure test directory exists
  const testDir = path.join(__dirname, "test-files");
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  try {
    console.log("Starting video concatenation...");
    await concat({
      output: outputVideoPath,
      videos: [inputVideo1Path, inputVideo2Path, inputVideo3Path],
      // Example: Add 500ms fade transitions between videos
      // Adjust 'name' and 'duration' based on the library's supported transitions
      transitions: [
        {
          name: "fade", // Or 'directionalwipe', 'crosszoom', etc.
          duration: 500,
        },
        {
          name: "fade",
          duration: 500,
        },
      ],
      // Optional: Add other ffmpeg-concat options if needed
      // e.g., tempDir: path.join(__dirname, 'temp'), concurrency: 4
    });
    console.log("Concatenation finished successfully:", outputVideoPath);
  } catch (error) {
    console.error("Error during video concatenation:", error);
  }
}

// Run the test
testTransitionService();
