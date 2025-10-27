# Apple Pay PoC (merchant validation + decryption)

This repository demonstrates:

- Merchant validation using merchant_identity.p12 (pfx)
- Decryption of Apple Pay EC_v1 tokens using @madskunker/apple-pay-decrypt

## Setup

1. Place certs in certs/ as described in certs/README.md
2. Set env vars: MERCHANT_P12_PASSWORD, MERCHANT_IDENTIFIER, DOMAIN_NAME
3. Run npm install
4. npm start
5. Serve over HTTPS (use ngrok for local testing)
