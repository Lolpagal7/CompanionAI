// Firebase Key Encoder - Run this to generate obfuscated keys
const originalKey = "AIzaSyDQXBbqle4nKmmkbF-P_HtLa943eIuy-0s";
const offset = 3;

console.log("=== Firebase Key Obfuscation Generator ===");
console.log("Original Key:", originalKey);

// Step 1: Base64 encode
const base64Key = btoa(originalKey);
console.log("Base64 Encoded:", base64Key);

// Step 2: Apply character offset
const obfuscatedKey = base64Key.split('').map(char => {
  const newCharCode = char.charCodeAt(0) + offset;
  return String.fromCharCode(newCharCode);
}).join('');

console.log("Obfuscated Key:", obfuscatedKey);
console.log("Offset:", offset);

console.log("\n=== Environment Variables to Use ===");
console.log(`VITE_FB_ENCODED_KEY=${obfuscatedKey}`);
console.log(`VITE_FB_KEY_OFFSET=${offset}`);

// Verification - decode back
const decoded = obfuscatedKey.split('').map(char => {
  const originalCharCode = char.charCodeAt(0) - offset;
  return String.fromCharCode(originalCharCode);
}).join('');
const finalKey = atob(decoded);
console.log("\n=== Verification ===");
console.log("Decoded Key:", finalKey);
console.log("Matches Original:", finalKey === originalKey);
