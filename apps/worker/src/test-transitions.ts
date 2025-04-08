import * as fs from "fs";
import * as path from "path";
import { VideoProcessingService } from "./services/video-processing.service";

async function testVideoCombination() {
  // Define paths
  const inputVideo1Path = path.join(__dirname, "test-files/video1.mp4");
  const inputVideo2Path = path.join(__dirname, "test-files/video1.mp4");
  const inputVideo3Path = path.join(__dirname, "test-files/video1.mp4");

  const outputVideoPath = path.join(__dirname, "test-files/output-video.mp4");
  // Ensure test directory exists
  const testDir = path.join(__dirname, "test-files");
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  // Instantiate the service
  const videoProcessingService = new VideoProcessingService();

  try {
    console.log("Starting video combination using VideoProcessingService...");
    // Use the service method
    await videoProcessingService.combineVideos(
      [inputVideo1Path, inputVideo2Path, inputVideo3Path],
      outputVideoPath,
      "fade",
      1
    );
    console.log("Video combination finished successfully:", outputVideoPath);
  } catch (error) {
    console.error("Error during video combination:", error);
  }
}

// Run the test
testVideoCombination();
