import crypto from "node:crypto";
import fs from "node:fs/promises";
import { ensureDir, pathExists, readJsonFile, writeJsonFile } from "./fs-utils.js";
import { getAppPaths } from "./paths.js";

interface PlainSecret {
  profileId: string;
  providerId: string;
  envKeyName: string;
  secretType: "api_key";
  value: string;
}

interface PlainSecretsFile {
  schemaVersion: 1;
  secrets: PlainSecret[];
}

interface EncryptedSecretsFile {
  schemaVersion: 1;
  algorithm: "aes-256-gcm";
  createdAt: string;
  payload: {
    iv: string;
    authTag: string;
    ciphertext: string;
  };
}

const EMPTY_SECRETS: PlainSecretsFile = {
  schemaVersion: 1,
  secrets: []
};

async function getMasterKey(): Promise<Buffer> {
  const appPaths = getAppPaths();
  await ensureDir(appPaths.appDataDir);

  if (await pathExists(appPaths.masterKeyFile)) {
    const encoded = await fs.readFile(appPaths.masterKeyFile, "utf8");
    return Buffer.from(encoded.trim(), "base64");
  }

  const key = crypto.randomBytes(32);
  await fs.writeFile(appPaths.masterKeyFile, `${key.toString("base64")}\n`, { mode: 0o600 });
  return key;
}

async function loadSecrets(): Promise<PlainSecretsFile> {
  const appPaths = getAppPaths();
  if (!(await pathExists(appPaths.secretsFile))) {
    return EMPTY_SECRETS;
  }

  const encrypted = await readJsonFile<EncryptedSecretsFile | null>(appPaths.secretsFile, null);
  if (!encrypted) {
    return EMPTY_SECRETS;
  }

  const key = await getMasterKey();
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(encrypted.payload.iv, "base64")
  );
  decipher.setAuthTag(Buffer.from(encrypted.payload.authTag, "base64"));

  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(encrypted.payload.ciphertext, "base64")),
    decipher.final()
  ]).toString("utf8");

  return JSON.parse(plaintext) as PlainSecretsFile;
}

async function saveSecrets(secrets: PlainSecretsFile): Promise<void> {
  const appPaths = getAppPaths();
  const key = await getMasterKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(secrets), "utf8"),
    cipher.final()
  ]);
  const encrypted: EncryptedSecretsFile = {
    schemaVersion: 1,
    algorithm: "aes-256-gcm",
    createdAt: new Date().toISOString(),
    payload: {
      iv: iv.toString("base64"),
      authTag: cipher.getAuthTag().toString("base64"),
      ciphertext: ciphertext.toString("base64")
    }
  };

  await writeJsonFile(appPaths.secretsFile, encrypted);
}

export async function upsertApiKey(secret: PlainSecret): Promise<void> {
  const secrets = await loadSecrets();
  const nextSecrets = secrets.secrets.filter(
    (item) => !(item.profileId === secret.profileId && item.providerId === secret.providerId)
  );
  nextSecrets.push(secret);
  await saveSecrets({ schemaVersion: 1, secrets: nextSecrets });
}

export async function getApiKey(profileId: string, providerId: string): Promise<string | null> {
  const secrets = await loadSecrets();
  return secrets.secrets.find((item) => item.profileId === profileId && item.providerId === providerId)?.value ?? null;
}

export async function deleteProfileSecrets(profileId: string): Promise<void> {
  const secrets = await loadSecrets();
  await saveSecrets({
    schemaVersion: 1,
    secrets: secrets.secrets.filter((item) => item.profileId !== profileId)
  });
}
