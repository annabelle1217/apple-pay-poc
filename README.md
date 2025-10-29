# 🍎 Apple Pay PoC (Merchant Validation + Decryption)

> ⚡️ **Fork & Reuse:**
> You can fork this repository, create your own Apple Pay merchant certificates, deploy to Vercel (or any HTTPS server), and complete domain verification yourself.
> 🔗 [Apple Pay Configuring Your Environment](https://developer.apple.com/documentation/applepayontheweb/configuring-your-environment)

### 🔗 Quick Links

* **GitHub Repository:** [apple-pay-poc](https://github.com/annabelle1217/apple-pay-poc)
* **Deployed POC App:** [apple-pay-poc-zeta.vercel.app](https://apple-pay-poc-zeta.vercel.app/)  
  ⚠️ Note: The deployed app only works with Apple accounts added to my tester list. If you are not added, the Apple Pay flow (payment sheet) will not complete. You can still fork the repo and deploy your own version with your own tester accounts.


This repository demonstrates:

* ✅ Merchant validation using `merchant_identity.p12`
* 🔐 Decryption of Apple Pay EC_v1 tokens using `@madskunker/apple-pay-decrypt`
* 💻 Frontend served from `public/`
* ☁️ Serverless endpoints under `api/` (Vercel-ready)

---

## 🪪 1️⃣ Certificates & Domain Setup

You’ll need two certificates and a verified domain before deployment:

| Type                               | Purpose                         |
| ---------------------------------- | ------------------------------- |
| **Merchant Identity Certificate**  | For merchant validation         |
| **Payment Processing Certificate** | For decrypting Apple Pay tokens |

**Generate Certificates on macOS:**

1. Open **Keychain Access → Certificate Assistant → Request From a Certificate Authority…**
2. Enter your email & Common Name, save to disk, use ECC 256-bit for payment processing cert.
3. Upload CSR to Apple Developer portal (Certificates section).
4. Download `.cer`, double-click to import into Keychain.
5. Export each certificate as `.p12` (set password).

**Domain Verification:**

* Add your domain in Apple Developer → Merchant IDs → Edit.
* Download `apple-developer-merchantid-domain-association.txt` and serve it from:

  ```
  https://<your-domain>/.well-known/apple-developer-merchantid-domain-association.txt
  ```
* Verify in Apple Developer portal.

---

## 🍏 2️⃣ Merchant Verification (OpenSSL 3 Fix)

```bash
# Extract cert and key using legacy provider
openssl pkcs12 -in apple_pay.p12 -clcerts -nokeys -out cert.pem -legacy
openssl pkcs12 -in apple_pay.p12 -nocerts -nodes -out key.pem -legacy

# Export new AES-256 .p12
openssl pkcs12 -export -inkey key.pem -in cert.pem \
  -out merchant_identity.p12 -name "merchant identity test" \
  -passout pass:YourPassword123!
```

> Move `legacy.dll` if needed:
> `C:\Program Files\OpenSSL\lib\ossl-modules\legacy.dll`

---

## 🔐 3️⃣ Apple Pay Token Decryption

For POC, use [`@madskunker/apple-pay-decrypt`](https://www.npmjs.com/package/@madskunker/apple-pay-decrypt).

Convert `.p12` → `.pem`:

```bash
openssl x509 -inform DER -outform PEM -in apple_pay.cer -out certPem.pem
openssl pkcs12 -in key.p12 -out privatePem.pem -nocerts -nodes -legacy
```

Upload PEM files to your deployed application.

---

## 🧩 4️⃣ Environment Variables (Vercel)

```bash
node convert-to-base64.js
```

Set these in Vercel:

* `MERCHANT_P12_B64`
* `PAYMENT_KEY_B64`
* `PAYMENT_CERT_B64`
* `MERCHANT_P12_PASSWORD`
* `MERCHANT_IDENTIFIER`
* `DOMAIN_NAME`

> Local `.p12` / `.pem` files are **not required**.

---

## 💻 5️⃣ Local Testing

```bash
npm install
vercel dev
ngrok http 3000
```

> Apple Pay requires HTTPS.
>
> * Unsupported devices show a QR code.
> * Supported devices show Apple Pay sheet, but payments show **“Payment not complete”** because ngrok URLs cannot be domain-verified.

---

## 🧪 6️⃣ Sandbox Testing

1. Create Apple test account on device.
2. Add to Apple Developer tester list & verify via email.
3. Add sandbox test cards: [Apple Sandbox Testing](https://developer.apple.com/apple-pay/sandbox-testing/)
4. Test Pay button on deployed POC: [apple-pay-poc-zeta.vercel.app](https://apple-pay-poc-zeta.vercel.app/)

---

## ⚙️ 7️⃣ Notes

* `.well-known/apple-developer-merchantid-domain-association.txt` must be hosted at verified domain.
* Never commit `.p12` / `.pem`; use Base64 env vars.
* Backend functions (`api/`) can also be moved to a standalone `server.js` outside Vercel if needed.