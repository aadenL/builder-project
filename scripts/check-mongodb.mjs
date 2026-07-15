import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import dns from "node:dns/promises";
import { MongoClient } from "mongodb";

const envPath = path.join(process.cwd(), ".env.local");

if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, "utf8");

  for (const line of envFile.split(/\r?\n/)) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const equalsIndex = trimmedLine.indexOf("=");

    if (equalsIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, equalsIndex);
    const value = trimmedLine.slice(equalsIndex + 1).replace(/^["']|["']$/g, "");

    process.env[key] ??= value;
  }
}

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("Missing MONGODB_URI in .env.local");
}

if (uri.startsWith("mongodb+srv://")) {
  const host = new URL(uri).hostname;

  console.log(`Checking DNS SRV for: _mongodb._tcp.${host}`);

  const records = await dns.resolveSrv(`_mongodb._tcp.${host}`);
  console.log(`DNS SRV records found: ${records.length}`);
} else {
  console.log("Standard MongoDB URI detected; skipping SRV DNS lookup.");
}

const client = new MongoClient(uri, {
  serverSelectionTimeoutMS: 8000,
});

try {
  await client.db("admin").command({ ping: 1 });
  console.log("MongoDB ping: ok");
} finally {
  await client.close();
}
