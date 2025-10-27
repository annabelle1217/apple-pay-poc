import { decrypt } from '@madskunker/apple-pay-decrypt';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const keyPath = process.env.PAYMENT_KEY_B64
      ? (() => {
          const tmpKey = path.join('/tmp', 'payment_key.pem');
          fs.writeFileSync(tmpKey, Buffer.from(process.env.PAYMENT_KEY_B64, 'base64'));
          return tmpKey;
        })()
      : path.join(process.cwd(), 'certs', 'payment_key.pem');

    const certPath = process.env.PAYMENT_CERT_B64
      ? (() => {
          const tmpCert = path.join('/tmp', 'payment_cert.pem');
          fs.writeFileSync(tmpCert, Buffer.from(process.env.PAYMENT_CERT_B64, 'base64'));
          return tmpCert;
        })()
      : path.join(process.cwd(), 'certs', 'payment_cert.pem');

    const token = req.body.token;

    const decrypted = decrypt({
      key: keyPath,
      cert: certPath,
      token,
    });

    res.status(200).json(decrypted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Payment decryption failed' });
  }
}