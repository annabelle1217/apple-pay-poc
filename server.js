const fs = require('fs');
const path = require('path');
const axios = require('axios');
const applePayDecrypt = require('@madskunker/apple-pay-decrypt');

const CERTS_DIR = path.join(__dirname, 'certs');
const MERCHANT_P12_PATH = path.join(CERTS_DIR, 'merchant_identity.p12');
const MERCHANT_P12_PASSWORD = process.env.MERCHANT_P12_PASSWORD || '';
const PAYMENT_KEY_PEM_PATH = path.join(CERTS_DIR, 'payment_key.pem');
const PAYMENT_CERT_PEM_PATH = path.join(CERTS_DIR, 'payment_cert.pem');

const MERCHANT_IDENTIFIER = process.env.MERCHANT_IDENTIFIER || 'merchant.com.testingAccount.epg';
const DOMAIN_NAME = process.env.DOMAIN_NAME || 'apple-pay-poc-zeta.vercel.app';

let paymentKeyPem = null;
let paymentCertPem = null;
try {
  paymentKeyPem = fs.readFileSync(PAYMENT_KEY_PEM_PATH, 'utf8');
  paymentCertPem = fs.readFileSync(PAYMENT_CERT_PEM_PATH, 'utf8');
} catch (e) {
  console.warn('Warning: payment PEM files not found in certs/ — decryption will fail');
}

// ======= EXPORTS FOR VERCEL SERVERLESS FUNCTIONS ======= //
module.exports = {
  validateMerchant: async (req, res) => {
    const { validationURL } = req.body;
    if (!validationURL) return res.status(400).json({ error: 'missing validationURL' });

    try {
      const postBody = {
        merchantIdentifier: MERCHANT_IDENTIFIER,
        domainName: DOMAIN_NAME,
        displayName: 'EPG Testing Account'
      };

      const httpsAgent = new (require('https').Agent)({
        pfx: fs.readFileSync(MERCHANT_P12_PATH),
        passphrase: MERCHANT_P12_PASSWORD,
        rejectUnauthorized: true
      });

      const resp = await axios.post(validationURL, postBody, {
        httpsAgent,
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });

      res.status(200).json(resp.data);
    } catch (err) {
      console.error('merchant validation error:', err.response?.data || err.message);
      res.status(500).json({ error: 'merchant validation failed', details: err.message });
    }
  },

  processPayment: async (req, res) => {
    const { payment } = req.body;
    if (!payment || !payment.token) return res.status(400).json({ error: 'missing payment token' });

    const token = payment.token;
    if (!paymentKeyPem || !paymentCertPem) {
      return res.status(500).json({ error: 'payment PEM files missing on server' });
    }

    try {
      const payData = token.paymentData || token;
      const decrypted = await applePayDecrypt.decrypt({ payment: payData, privateKey: paymentKeyPem, certificate: paymentCertPem });
      console.log('Decrypted payload:', decrypted);
      res.status(200).json({ success: true, decrypted });
    } catch (err) {
      console.error('decryption error:', err);
      res.status(500).json({ error: 'decryption_failed', details: err.message });
    }
  }
};
