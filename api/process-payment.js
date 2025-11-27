// Node 20+ util polyfills for legacy crypto libs

import PaymentToken from '@madskunker/apple-pay-decrypt';
import fs from 'fs';
import path from 'path';
import util from 'util';

const polyfills = {
  isBuffer: Buffer.isBuffer,
  isString: (x) => typeof x === 'string' || x instanceof String,
  isObject: (x) => x !== null && typeof x === 'object',
  isNumber: (x) => typeof x === 'number' && !isNaN(x),
  isNull: (x) => x === null,
  isUndefined: (x) => x === undefined
};

for (const key in polyfills) {
  if (!util[key]) {
    util[key] = polyfills[key];
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    console.log('Processing payment decryption request...', req.body);
    const payment = req.body.payment;

    if (!payment || !payment.token) {
      console.log('🚨 Payment object missing or malformed:', payment);
      return res.status(400).json({ error: 'Payment or token missing' });
    } else {
      console.log('✅ Payment token received', payment.token?.paymentData);
    }

    // Load PEM as string (local or from base64 env var)
    const certPem = process.env.PAYMENT_CERT_B64
      ? Buffer.from(process.env.PAYMENT_CERT_B64, 'base64').toString('utf8')
      : fs.readFileSync(path.join(process.cwd(), 'certs', 'payment_cert.pem'), 'utf8');

    const privatePem = process.env.PAYMENT_KEY_B64
      ? Buffer.from(process.env.PAYMENT_KEY_B64, 'base64').toString('utf8')
      : fs.readFileSync(path.join(process.cwd(), 'certs', 'payment_key.pem'), 'utf8');

    // Decrypt Apple Pay token
    const token = new PaymentToken(payment.token.paymentData);
    const decrypted = token.decrypt(certPem, privatePem);

    console.log('🔓 Decrypted token:', decrypted);

    res.status(200).json({ success: true, decrypted });
  } catch (err) {
    console.error('Payment decryption failed:', err);
    res.status(500).json({ error: 'Payment decryption failed', detail: err.message });
  }
}