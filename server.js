const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const https = require('https');
const bodyParser = require('body-parser');
const cors = require('cors');
const applePayDecrypt = require('@madskunker/apple-pay-decrypt');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const CERTS_DIR = path.join(__dirname, 'certs');
const MERCHANT_P12_PATH = path.join(CERTS_DIR, 'merchant_identity.p12');
const MERCHANT_P12_PASSWORD = process.env.MERCHANT_P12_PASSWORD || '';
const PAYMENT_KEY_PEM_PATH = path.join(CERTS_DIR, 'payment_key.pem');
const PAYMENT_CERT_PEM_PATH = path.join(CERTS_DIR, 'payment_cert.pem');

const MERCHANT_IDENTIFIER = process.env.MERCHANT_IDENTIFIER || 'merchant.com.testingAccount.epg';
const DOMAIN_NAME = process.env.DOMAIN_NAME || 'localhost';

let paymentKeyPem = null;
let paymentCertPem = null;
try {
  paymentKeyPem = fs.readFileSync(PAYMENT_KEY_PEM_PATH, 'utf8');
  paymentCertPem = fs.readFileSync(PAYMENT_CERT_PEM_PATH, 'utf8');
} catch (e) {
  console.warn('Warning: payment PEM files not found in certs/');
}

app.post('/validate-merchant', async (req, res) => {
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

    res.json(resp.data);
  } catch (err) {
    console.error('merchant validation error:', err.response ? err.response.data : err.message);
    res.status(500).json({ error: 'merchant validation failed', details: err.message });
  }
});

app.post('/process-payment', async (req, res) => {
  const { payment } = req.body;
  if (!payment || !payment.token) return res.status(400).json({ error: 'missing payment token' });

  const token = payment.token;
  if (!paymentKeyPem || !paymentCertPem) {
    return res.status(500).json({ error: 'payment PEM files missing on server' });
  }

  try {
    const payData = token.paymentData || token;
    let decrypted = null;
    const result = applePayDecrypt.decrypt({ payment: payData, privateKey: paymentKeyPem, certificate: paymentCertPem });
    decrypted = typeof result.then === 'function' ? await result : result;
    console.log('Decrypted payload:', decrypted);
    res.json({ success: true, decrypted });
  } catch (err) {
    console.error('decryption error:', err);
    res.status(500).json({ error: 'decryption_failed', details: err && err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on http://${DOMAIN_NAME}:${PORT}`));
