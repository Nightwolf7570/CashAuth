#!/usr/bin/env node

/**
 * Static verification script for scan history functionality
 * This script analyzes the code without running the dev server
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function checkFile(filePath, checks) {
  const fullPath = path.join(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`${colors.red}✗${colors.reset} File not found: ${filePath}`);
    return false;
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  let allPassed = true;

  checks.forEach(({ name, test, required = true }) => {
    const passed = test(content);
    const icon = passed ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
    const status = passed ? 'PASS' : required ? 'FAIL' : 'WARN';
    const color = passed ? colors.green : required ? colors.red : colors.yellow;
    
    console.log(`  ${icon} ${name} ${color}${status}${colors.reset}`);
    if (!passed && required) {
      allPassed = false;
    }
  });

  return allPassed;
}

console.log(`${colors.cyan}=== Scan History Functionality Verification ===${colors.reset}\n`);

let allChecksPassed = true;

// Check 1: Firebase save function
console.log(`${colors.blue}1. Checking saveScanResult() in lib/firebase.ts${colors.reset}`);
allChecksPassed &= checkFile('lib/firebase.ts', [
  { name: 'Function exports saveScanResult', test: (c) => /export async function saveScanResult/.test(c), required: true },
  { name: 'Uploads to Firebase Storage', test: (c) => /uploadBytes|uploadBytesResumable/.test(c), required: true },
  { name: 'Gets download URL', test: (c) => /getDownloadURL/.test(c), required: true },
  { name: 'Saves to Firestore scans collection', test: (c) => /collection\(db, ['"]scans['"]\)/.test(c), required: true },
  { name: 'Includes userId in document', test: (c) => /userId.*:/.test(c), required: true },
  { name: 'Includes timestamp', test: (c) => /timestamp.*Timestamp\.now\(\)/.test(c), required: true },
  { name: 'Error handling present', test: (c) => /catch\s*\(/.test(c), required: true },
  { name: 'Logging for debugging', test: (c) => /console\.log.*Saving scan result/.test(c), required: false },
]);

// Check 2: Firebase get history function
console.log(`\n${colors.blue}2. Checking getScanHistory() in lib/firebase.ts${colors.reset}`);
allChecksPassed &= checkFile('lib/firebase.ts', [
  { name: 'Function exports getScanHistory', test: (c) => /export async function getScanHistory/.test(c), required: true },
  { name: 'Queries scans collection', test: (c) => /collection\(db, ['"]scans['"]\)/.test(c), required: true },
  { name: 'Filters by userId', test: (c) => /where\(['"]userId['"], ['"]==['"], userId\)/.test(c), required: true },
  { name: 'Orders by timestamp', test: (c) => /orderBy\(['"]timestamp['"], ['"]desc['"]\)/.test(c), required: true },
  { name: 'Has fallback query', test: (c) => /fallback|Fallback/.test(c), required: true },
  { name: 'Converts Timestamp to Date', test: (c) => /timestamp.*toDate\(\)/.test(c), required: true },
  { name: 'Error handling present', test: (c) => /catch\s*\(/.test(c), required: true },
]);

// Check 3: History page
console.log(`\n${colors.blue}3. Checking History Page (app/history/page.tsx)${colors.reset}`);
allChecksPassed &= checkFile('app/history/page.tsx', [
  { name: 'Imports getScanHistory', test: (c) => /import.*getScanHistory.*from/.test(c), required: true },
  { name: 'Uses useAuth hook', test: (c) => /useAuth/.test(c), required: true },
  { name: 'Calls getScanHistory on load', test: (c) => /getScanHistory\(user\.uid\)/.test(c), required: true },
  { name: 'Handles loading state', test: (c) => /loading.*useState/.test(c), required: true },
  { name: 'Handles empty state', test: (c) => /history\.length === 0/.test(c), required: true },
  { name: 'Handles unauthenticated state', test: (c) => /!user/.test(c), required: true },
  { name: 'Delete functionality', test: (c) => /deleteScan/.test(c), required: true },
  { name: 'Error handling with toast', test: (c) => /toast\.error/.test(c), required: true },
  { name: 'Refresh button', test: (c) => /onClick.*loadHistory/.test(c), required: false },
]);

// Check 4: Scanner page
console.log(`\n${colors.blue}4. Checking Scanner Page (app/scanner/page.tsx)${colors.reset}`);
allChecksPassed &= checkFile('app/scanner/page.tsx', [
  { name: 'Imports saveScanResult', test: (c) => /import.*saveScanResult.*from/.test(c), required: true },
  { name: 'Uses useAuth hook', test: (c) => /useAuth/.test(c), required: true },
  { name: 'Calls saveScanResult when user exists', test: (c) => /if\s*\(.*user.*\)/.test(c) && /saveScanResult/.test(c), required: true },
  { name: 'Handles denomination format', test: (c) => /denominationValue|denomination/.test(c), required: true },
  { name: 'Error handling present', test: (c) => /catch\s*\(/.test(c), required: true },
  { name: 'Saves all required fields', test: (c) => /validity/.test(c) && /currency/.test(c) && /confidence/.test(c), required: true },
]);

// Check 5: Firestore rules
console.log(`\n${colors.blue}5. Checking Firestore Rules (firestore.rules)${colors.reset}`);
allChecksPassed &= checkFile('firestore.rules', [
  { name: 'Scans collection defined', test: (c) => /match.*scans/.test(c), required: true },
  { name: 'Read rule checks userId', test: (c) => /allow read.*userId/.test(c), required: true },
  { name: 'Create rule checks userId', test: (c) => /allow create.*userId/.test(c), required: true },
  { name: 'Delete rule checks userId', test: (c) => /allow delete.*userId/.test(c), required: true },
  { name: 'Updates disabled', test: (c) => /allow update.*false/.test(c), required: true },
]);

// Check 6: Storage rules
console.log(`\n${colors.blue}6. Checking Storage Rules (storage.rules)${colors.reset}`);
allChecksPassed &= checkFile('storage.rules', [
  { name: 'Scans folder defined', test: (c) => /match.*scans/.test(c), required: true },
  { name: 'Read rule checks userId', test: (c) => /allow read.*userId/.test(c), required: true },
  { name: 'Write rule checks userId', test: (c) => /allow write/.test(c) && /userId/.test(c), required: true },
  { name: 'File size limit', test: (c) => /size.*10.*1024/.test(c), required: false },
  { name: 'Content type check', test: (c) => /contentType.*image/.test(c), required: false },
]);

// Check 7: Firestore indexes
console.log(`\n${colors.blue}7. Checking Firestore Indexes (firestore.indexes.json)${colors.reset}`);
allChecksPassed &= checkFile('firestore.indexes.json', [
  { name: 'Indexes file exists', test: (c) => true, required: true },
  { name: 'Scans collection index defined', test: (c) => /scans/.test(c), required: true },
  { name: 'userId field in index', test: (c) => /userId/.test(c), required: true },
  { name: 'timestamp field in index', test: (c) => /timestamp/.test(c), required: true },
]);

// Check 8: Type definitions
console.log(`\n${colors.blue}8. Checking Type Definitions${colors.reset}`);
allChecksPassed &= checkFile('lib/firebase.ts', [
  { name: 'ScanResult interface exported', test: (c) => /export interface ScanResult/.test(c), required: true },
  { name: 'Has required fields', test: (c) => /userId.*:.*string/.test(c) && /imageUrl.*:.*string/.test(c), required: true },
  { name: 'Has timestamp field', test: (c) => /timestamp.*Date.*Timestamp/.test(c), required: true },
]);

// Summary
console.log(`\n${colors.cyan}=== Summary ===${colors.reset}`);
if (allChecksPassed) {
  console.log(`${colors.green}✓ All critical checks passed!${colors.reset}`);
  console.log(`\n${colors.yellow}Note:${colors.reset} This is a static analysis. Please test with a real Firebase project.`);
  process.exit(0);
} else {
  console.log(`${colors.red}✗ Some critical checks failed!${colors.reset}`);
  console.log(`\nPlease review the failures above and fix the issues.`);
  process.exit(1);
}

