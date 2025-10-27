import fs from 'fs';
import path from 'path';
import { validateMerchantSession } from '@madskunker/apple-pay-decrypt';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    // Detect if running on Vercel (env var present)
    const p12Path = process.env.MERCHANT_P12_B64
      ? (() => {
          const tmpPath = path.join('/tmp', 'merchant_identity.p12');
          fs.writeFileSync(tmpPath, Buffer.from(process.env.MERCHANT_P12_B64, 'base64'));
          return tmpPath;
        })()
      : path.join(process.cwd(), 'certs', 'merchant_identity.p12');

    const password = process.env.MERCHANT_P12_PASSWORD || '';

    const validationURL = req.body.validationURL;

    const merchantSession = await validateMerchantSession({
      p12: p12Path,
      password,
      merchantIdentifier: process.env.MERCHANT_IDENTIFIER || 'merchant.com.testingAccount.epg',
      validationURL,
      domainName: process.env.DOMAIN_NAME || 'apple-pay-poc-zeta.vercel.app',
    });

    res.status(200).json(merchantSession);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Merchant validation failed' });
  }
}