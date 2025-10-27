const fs = require('fs');
const path = require('path');

// List of files to convert
const files = [
  'certs/merchant_identity.p12',
  'certs/payment_key.pem',
  'certs/payment_cert.pem'
];

files.forEach((file) => {
  const absPath = path.resolve(file);

  if (!fs.existsSync(absPath)) {
    console.error(`File not found: ${absPath}`);
    return;
  }

  const data = fs.readFileSync(absPath);
  const base64 = data.toString('base64');

  const outFile = `${absPath}.b64`;
  fs.writeFileSync(outFile, base64);
  console.log(`✅ Created Base64 file: ${outFile}`);
});

console.log('\nAll files converted! Copy the contents of each .b64 file into Vercel environment variables.');
