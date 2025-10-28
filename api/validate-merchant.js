import axios from 'axios';
import fs from 'fs';
import https from 'https';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { validationURL } = req.body;
    if (!validationURL) return res.status(400).json({ error: 'Missing validationURL' });

    // --- Load merchant identity certificate (.p12) ---
    const p12Buffer = process.env.MERCHANT_P12_B64
      ? Buffer.from(process.env.MERCHANT_P12_B64, 'base64')
      : fs.readFileSync(path.join(process.cwd(), 'certs', 'merchant_identity.p12'));

    const httpsAgent = new https.Agent({
      pfx: p12Buffer,
      passphrase: process.env.MERCHANT_P12_PASSWORD,
    });

    // --- Construct request body ---
    const payload = {
      merchantIdentifier: process.env.MERCHANT_IDENTIFIER,
      displayName: 'Apple Pay PoC',
      initiative: 'web',
      initiativeContext: process.env.DOMAIN_NAME,
    };

    // --- Send request to Apple’s validation URL ---
    const response = await axios.post(validationURL, payload, {
      httpsAgent,
      headers: { 'Content-Type': 'application/json' },
    });

    res.status(200).json(response.data);
  } catch (err) {
    console.error('Merchant validation failed:', err.response?.data || err.message);
    res.status(500).json({ error: 'Merchant validation failed', detail: err.message });
  }
}