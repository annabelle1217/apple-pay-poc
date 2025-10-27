import axios from 'axios';
import fs from 'fs';
import https from 'https';
import path from 'path';

const CERTS_DIR = path.join(process.cwd(), 'certs');
const MERCHANT_P12_PATH = path.join(CERTS_DIR, 'merchant_identity.p12');
const MERCHANT_P12_PASSWORD = process.env.MERCHANT_P12_PASSWORD || '';
const MERCHANT_IDENTIFIER = process.env.MERCHANT_IDENTIFIER || 'merchant.com.testingAccount.epg';
const DOMAIN_NAME = process.env.DOMAIN_NAME || 'apple-pay-poc-zeta.vercel.app';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { validationURL } = req.body;
  if (!validationURL) return res.status(400).json({ error: 'missing validationURL' });

  try {
    const postBody = {
      merchantIdentifier: MERCHANT_IDENTIFIER,
      domainName: DOMAIN_NAME,
      displayName: 'EPG Testing Account'
    };

    const agent = new https.Agent({
      pfx: fs.readFileSync(MERCHANT_P12_PATH),
      passphrase: MERCHANT_P12_PASSWORD,
      rejectUnauthorized: true
    });

    const resp = await axios.post(validationURL, postBody, {
      httpsAgent: agent,
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });

    res.status(200).json(resp.data);
  } catch (err) {
    console.error('merchant validation error:', err.response?.data || err.message);
    res.status(500).json({ error: 'merchant validation failed', details: err.message });
  }
}