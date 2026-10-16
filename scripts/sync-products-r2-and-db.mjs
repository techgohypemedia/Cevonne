import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const accountId = "4f83739f0b38836dc5b7867b75383668";
const accessKeyId = "3039766ee4306e9482dfba54666da765";
const secretAccessKey = "917448c7571521c028203c5e8e9d092f7153081cc0b4e01fb3600b4ea8d5ac6f";
const bucket = "cevonne";
const host = `${accountId}.r2.cloudflarestorage.com`;
const region = "auto";
const service = "s3";
const publicBaseUrl = "https://cdn.cevonne.com";

const neonSqlUrl = "https://ep-floral-thunder-a1ta9x5y-pooler.ap-southeast-1.aws.neon.tech/sql";
const neonConn = "postgresql://neondb_owner:npg_NRtTV30MyjGv@ep-floral-thunder-a1ta9x5y-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

function hmac(key, string, encoding) {
  return crypto.createHmac("sha256", key).update(string).digest(encoding);
}

function sha256(data, encoding = "hex") {
  return crypto.createHash("sha256").update(data).digest(encoding);
}

function getSigningKey(secretKey, dateStamp, regionName, serviceName) {
  const kDate = hmac("AWS4" + secretKey, dateStamp);
  const kRegion = hmac(kDate, regionName);
  const kService = hmac(kRegion, serviceName);
  return hmac(kService, "aws4_request");
}

async function putR2Object(key, buffer, contentType = "application/octet-stream") {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);

  const payloadHash = sha256(buffer);
  const objPath = `/${bucket}/${key}`;

  const canonicalHeaders = [
    `content-type:${contentType}`,
    `host:${host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${amzDate}`,
  ].sort().join("\n") + "\n";

  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";

  const canonicalRequest = [
    "PUT",
    encodeURI(objPath),
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256(canonicalRequest),
  ].join("\n");

  const signingKey = getSigningKey(secretAccessKey, dateStamp, region, service);
  const signature = hmac(signingKey, stringToSign, "hex");

  const authHeader = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const url = `https://${host}${encodeURI(objPath)}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Host: host,
      "Content-Type": contentType,
      "x-amz-date": amzDate,
      "x-amz-content-sha256": payloadHash,
      Authorization: authHeader,
    },
    body: buffer,
  });

  return res;
}

function getMimeType(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  switch (ext) {
    case ".png": return "image/png";
    case ".jpg":
    case ".jpeg": return "image/jpeg";
    case ".avif": return "image/avif";
    case ".webp": return "image/webp";
    case ".svg": return "image/svg+xml";
    default: return "application/octet-stream";
  }
}

async function queryNeon(sql) {
  const r = await fetch(neonSqlUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Neon-Connection-String": neonConn,
    },
    body: JSON.stringify({ query: sql }),
  });
  return r.json();
}

async function uploadLocalImagesToR2() {
  const imagesDir = path.resolve("public/assets/images");
  const files = await fs.readdir(imagesDir);

  console.log(`Found ${files.length} files in public/assets/images. Starting upload to Cloudflare R2...`);

  for (const file of files) {
    const filePath = path.join(imagesDir, file);
    const buffer = await fs.readFile(filePath);
    const mime = getMimeType(file);

    // 1. Upload to products/<filename>
    const productKey = `products/${file}`;
    const res1 = await putR2Object(productKey, buffer, mime);
    if (!res1.ok) {
      console.error(`Failed to upload ${productKey}:`, res1.status, await res1.text());
    } else {
      console.log(`Uploaded R2: ${publicBaseUrl}/${productKey}`);
    }

    // 2. Upload to assets/images/<filename> (for backward compatibility)
    const assetKey = `assets/images/${file}`;
    const res2 = await putR2Object(assetKey, buffer, mime);
    if (!res2.ok) {
      console.error(`Failed to upload ${assetKey}:`, res2.status);
    }
  }

  console.log("All local product images uploaded to Cloudflare R2!");
}

function mapLegacyUrlToCdn(url) {
  if (!url) return url;
  if (url.startsWith("https://cdn.cevonne.com/")) return url;

  // Handle bare product images like product1.png, product12.png
  const productMatch = url.match(/product\d*\.(png|avif)/i);
  if (productMatch) {
    return `${publicBaseUrl}/products/${productMatch[0]}`;
  }

  // Handle matte / lip-care
  if (/matte\d*\.avif/i.test(url)) {
    const m = url.match(/matte\d*\.avif/i);
    return `${publicBaseUrl}/products/${m[0]}`;
  }

  // Handle specific product legacy placeholders
  if (url.includes("gulnaar_01") || url.includes("air-couture-gulnaar-hero")) {
    return "https://cdn.cevonne.com/collection-image-12f59d11-be13-496b-9cbc-b11a1ad3f071.png";
  }
  if (url.includes("spiced_ember_01") || url.includes("velvet-power-spiced-ember-hero")) {
    return `${publicBaseUrl}/products/product12.png`;
  }

  return url;
}

async function updateDatabaseImages() {
  console.log("Starting Neon DB updates...");

  // 1. Update ProductImage table
  const imagesResult = await queryNeon('SELECT id, url, "productId" FROM "ProductImage";');
  const images = imagesResult.rows || [];
  console.log(`Found ${images.length} ProductImage rows to check.`);

  let updatedImagesCount = 0;
  for (const img of images) {
    const currentUrl = img.url;
    const newUrl = mapLegacyUrlToCdn(currentUrl);

    if (newUrl !== currentUrl) {
      const escapedNew = newUrl.replace(/'/g, "''");
      await queryNeon(`UPDATE "ProductImage" SET url = '${escapedNew}' WHERE id = '${img.id}';`);
      console.log(`Updated ProductImage ${img.id}: "${currentUrl}" -> "${newUrl}"`);
      updatedImagesCount++;
    }
  }
  console.log(`Updated ${updatedImagesCount} ProductImage records.`);

  // 2. Update Product table media & experience JSON
  const productsResult = await queryNeon('SELECT id, name, media, experience FROM "Product";');
  const products = productsResult.rows || [];
  console.log(`Found ${products.length} Products to check.`);

  let updatedProductsCount = 0;
  for (const prod of products) {
    let changed = false;
    let media = prod.media;
    let exp = prod.experience;

    // Update media JSON
    if (media && typeof media === "object") {
      let mediaStr = JSON.stringify(media);
      const replacedStr = mediaStr.replace(/product(\d*)\.(png|avif)/g, `${publicBaseUrl}/products/product$1.$2`)
        .replace(/gulnaar_01/g, "https://cdn.cevonne.com/collection-image-12f59d11-be13-496b-9cbc-b11a1ad3f071.png")
        .replace(/air-couture-gulnaar-hero/g, "https://cdn.cevonne.com/collection-image-12f59d11-be13-496b-9cbc-b11a1ad3f071.png")
        .replace(/spiced_ember_01/g, `${publicBaseUrl}/products/product12.png`)
        .replace(/velvet-power-spiced-ember-hero/g, `${publicBaseUrl}/products/product12.png`);

      if (replacedStr !== mediaStr) {
        media = JSON.parse(replacedStr);
        changed = true;
      }
    }

    // Update experience JSON
    if (exp && typeof exp === "object") {
      let expStr = JSON.stringify(exp);
      const replacedStr = expStr.replace(/product(\d*)\.(png|avif)/g, `${publicBaseUrl}/products/product$1.$2`)
        .replace(/gulnaar_01/g, "https://cdn.cevonne.com/collection-image-12f59d11-be13-496b-9cbc-b11a1ad3f071.png")
        .replace(/air-couture-gulnaar-hero/g, "https://cdn.cevonne.com/collection-image-12f59d11-be13-496b-9cbc-b11a1ad3f071.png")
        .replace(/spiced_ember_01/g, `${publicBaseUrl}/products/product12.png`)
        .replace(/velvet-power-spiced-ember-hero/g, `${publicBaseUrl}/products/product12.png`);

      if (replacedStr !== expStr) {
        exp = JSON.parse(replacedStr);
        changed = true;
      }
    }

    if (changed) {
      const escapedMedia = JSON.stringify(media).replace(/'/g, "''");
      const escapedExp = JSON.stringify(exp).replace(/'/g, "''");
      await queryNeon(`UPDATE "Product" SET media = '${escapedMedia}'::jsonb, experience = '${escapedExp}'::jsonb WHERE id = '${prod.id}';`);
      console.log(`Updated Product JSON for "${prod.name}" (${prod.id})`);
      updatedProductsCount++;
    }
  }

  console.log(`Updated ${updatedProductsCount} Product JSON records.`);
}

async function main() {
  await uploadLocalImagesToR2();
  await updateDatabaseImages();
  console.log("\n>>> Migration completely finished! <<<");
}

main().catch(console.error);
