#!/bin/bash

# Script to download face-api.js models
# These models are required for facial recognition to work

echo "📦 Downloading face-api.js models..."

# Create models directory
mkdir -p client/public/models

# Base URL for models
BASE_URL="https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master"

# Download required models
echo "⬇️  Downloading tiny_face_detector models..."
curl -L "${BASE_URL}/tiny_face_detector_model-weights_manifest.json" -o client/public/models/tiny_face_detector_model-weights_manifest.json
curl -L "${BASE_URL}/tiny_face_detector_model-shard1" -o client/public/models/tiny_face_detector_model-shard1

echo "⬇️  Downloading face_landmark_68 models..."
curl -L "${BASE_URL}/face_landmark_68_model-weights_manifest.json" -o client/public/models/face_landmark_68_model-weights_manifest.json
curl -L "${BASE_URL}/face_landmark_68_model-shard1" -o client/public/models/face_landmark_68_model-shard1

echo "⬇️  Downloading face_recognition models..."
curl -L "${BASE_URL}/face_recognition_model-weights_manifest.json" -o client/public/models/face_recognition_model-weights_manifest.json
curl -L "${BASE_URL}/face_recognition_model-shard1" -o client/public/models/face_recognition_model-shard1
curl -L "${BASE_URL}/face_recognition_model-shard2" -o client/public/models/face_recognition_model-shard2

echo "✅ Models downloaded successfully!"
echo "📁 Models location: client/public/models/"
echo ""
echo "You can now use facial recognition features in the application."
