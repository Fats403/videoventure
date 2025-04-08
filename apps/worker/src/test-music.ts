import * as fs from "fs";
import * as path from "path";
import { MusicService } from "./services/music.service";
import dotenv from "dotenv";

dotenv.config();

// --- Existing Music Generation Test ---
async function testMusicGeneration() {
  // Define paths
  const testDir = path.join(__dirname, "test-files");
  // Ensure test directory exists
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  // Instantiate the service
  const musicService = new MusicService();

  // Test parameters
  const storyIdea = "An epic space adventure with a hopeful ending.";
  const jobId = `test-job-music-${Date.now()}`; // Unique ID for the test run
  const duration = 15; // Short duration for testing
  const provider = "fal"; // Or "beatoven", ensure API keys are set in .env

  try {
    console.log(
      `\n--- Starting Background Music Generation Test (Provider: ${provider}) ---`
    );

    // The MusicService saves the file directly to the specified directory (testDir)
    const musicFilePath = await musicService.getBackgroundMusic(
      storyIdea,
      jobId,
      testDir, // Use testDir as the temporary directory for output
      duration,
      provider
    );

    console.log(
      `Background Music generation finished successfully: ${musicFilePath}`
    );
    // You can optionally verify the file exists
    if (fs.existsSync(musicFilePath)) {
      console.log(`✅ Verified music file exists at: ${musicFilePath}`);
    } else {
      console.error(
        `❌ Music file not found at expected path: ${musicFilePath}`
      );
    }
  } catch (error) {
    console.error("Error during music generation test:", error);
  }
}

// Run the tests sequentially
async function runTests() {
  // await testMusicGeneration(); // Keep or comment out as needed
}

runTests();
