#!/usr/bin/env node

/**
 * Automatically increments the Android versionCode in app.json
 * This script is run before each build to ensure unique version codes
 */

const fs = require('fs');
const path = require('path');

const appJsonPath = path.join(__dirname, '..', 'app.json');

try {
  // Read app.json
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  
  // Get current versionCode
  const currentVersionCode = appJson.expo?.android?.versionCode || 1;
  
  // Increment versionCode
  const newVersionCode = currentVersionCode + 1;
  
  // Update app.json
  appJson.expo.android.versionCode = newVersionCode;
  
  // Write back to file
  fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');
  
  console.log(`✅ Version code incremented: ${currentVersionCode} → ${newVersionCode}`);
  process.exit(0);
} catch (error) {
  console.error('❌ Error incrementing version code:', error.message);
  process.exit(1);
}

