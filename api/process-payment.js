import applePayDecrypt from '@madskunker/apple-pay-decrypt';
import fs from 'fs';
import path from 'path';

const CERTS_DIR = path.join(process.cwd(), 'certs');
const PAYMENT_KEY_PEM_PATH = path.join(CERTS_DIR, 'payment_key.pem');
const PAYMENT_CERT_PEM_PATH = path.join(CERTS_DIR, 'payment_cert.pem');

let paymentKeyPem = null;
let paymentCertPem = null;
try {
  paymentKeyPem = fs.readFileSync(PAYMENT_KEY_PEM_PATH, 'utf8');
  paymentCertPem = fs.readFileSync(PAYMENT_CERT_PEM_PATH, 'utf8');
} catch (e) {
  console.warn('Warning: payment PEM files not found in certs/ — decryption will fail');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { payment } = req.body;
  if (!payment || !payment.token) return res.status(400).json({ error: 'missing payment token' });

  try {
    const token = payment.token;
    const payData = token.paymentData || token;

    if (!paymentKeyPem || !paymentCertPem) {
      return res.status(500).json({ error: 'payment PEM files missing on server' });
    }

    const decrypted = await applePayDecrypt.decrypt({
      payment: payData,
      privateKey: paymentKeyPem,
      certificate: paymentCertPem
    });

    console.log('Decrypted payload:', decrypted);
    res.status(200).json({ success: true, decrypted });
  } catch (err) {
    console.error('decryption error:', err);
    res.status(500).json({ error: 'decryption_failed', details: err.message });
  }
}
