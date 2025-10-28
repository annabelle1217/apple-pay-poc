import PaymentToken from '@madskunker/apple-pay-decrypt';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const payment = req.body.payment;

    // Load cert and key (from env base64 or local files)
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

    // Read file contents
    const certPem = fs.readFileSync(certPath, 'utf8');
    const privatePem = fs.readFileSync(keyPath, 'utf8');

    // Decrypt Apple Pay token
    const token = new PaymentToken(payment.token.paymentData);
    const decrypted = token.decrypt(certPem, privatePem);

    res.status(200).json({ success: true, decrypted });
  } catch (err) {
    console.error('Payment decryption failed:', err);
    res.status(500).json({ error: 'Payment decryption failed', detail: err.message });
  }
}