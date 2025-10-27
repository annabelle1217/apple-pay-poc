# 🍎 Apple Pay PoC (Merchant Validation + Decryption)

This repository demonstrates:

* Merchant validation using `merchant_identity.p12` (PFX)
* Decryption of Apple Pay EC_v1 tokens using `@madskunker/apple-pay-decrypt`
* Frontend served from `public/`
* Serverless endpoints under `api/` (Vercel-ready)

---

## 🛠 Setup (Local)

1. **Place certificates in `certs/` folder:**

```
certs/
  merchant_identity.p12
  payment_key.pem
  payment_cert.pem
```

2. **Set environment variables (Windows PowerShell / macOS / Linux):**

```bash
# macOS/Linux
export MERCHANT_P12_PASSWORD="your_password"
export MERCHANT_IDENTIFIER="merchant.com.example"
export DOMAIN_NAME="localhost or ngrok URL"

# Windows PowerShell
$env:MERCHANT_P12_PASSWORD="your_password"
$env:MERCHANT_IDENTIFIER="merchant.com.example"
$env:DOMAIN_NAME="localhost or ngrok URL"
```

3. **Install dependencies:**

```bash
npm install
```

4. **Run locally with Vercel CLI:**

```bash
vercel dev
```

5. **Expose HTTPS for iPhone testing using ngrok:**

```bash
ngrok http 3000
```

6. **Open your frontend** at `http://localhost:3000` or the ngrok URL on your iPhone.

---

## 📄 Convert Certificates to Base64 for Vercel

> Windows users: use Node.js or PowerShell (no `base64` command needed).

### 1️⃣ Using Node.js script

1. Run the script:

```bash
node convert-to-base64.js
```

2. The following `.b64` files will be generated:

```
certs/merchant_identity.p12.b64
certs/payment_key.pem.b64
certs/payment_cert.pem.b64
```

3. Copy the contents of each `.b64` file into **Vercel environment variables**:

* `MERCHANT_P12_B64`
* `PAYMENT_KEY_B64`
* `PAYMENT_CERT_B64`

Also set:

* `MERCHANT_P12_PASSWORD`
* `MERCHANT_IDENTIFIER`
* `DOMAIN_NAME` (your Vercel domain)

---

## 🔄 Local vs Vercel

| Environment | Certificates                                                        |
| ----------- | ------------------------------------------------------------------- |
| Local       | Use actual `.p12` / `.pem` files in `certs/`                        |
| Vercel      | Use Base64 env vars; serverless functions automatically decode them |

---

## ⚠️ Notes

* Apple Pay **requires HTTPS**. Use ngrok or a trusted SSL certificate for local testing.
* The `.well-known/apple-developer-merchantid-domain-association.txt` file must be served at:

```
https://<your-domain>/.well-known/apple-developer-merchantid-domain-association.txt
```

* Ensure `MERCHANT_IDENTIFIER` matches your Apple Developer account.
* Do **not commit sensitive certificates** to GitHub; use env vars for Vercel.