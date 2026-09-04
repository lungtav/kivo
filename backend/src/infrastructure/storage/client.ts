import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../../config/env.js";
import { randomUUID } from "node:crypto";

// B2 endpoints are sometimes configured without a scheme; the SDK needs one
const endpoint = env.B2_ENDPOINT.startsWith("http")
  ? env.B2_ENDPOINT
  : `https://${env.B2_ENDPOINT}`;

const b2 = new S3Client({
  region: env.B2_REGION,
  endpoint,
  forcePathStyle: true,
  credentials: {
    accessKeyId: env.B2_KEY_ID,
    secretAccessKey: env.B2_APPLICATION_KEY,
  },
});

export const getUploadUrl = async (userId: string, mimeType: string) => {
  const key = `upload/${userId}/${randomUUID()}`;

  const command = new PutObjectCommand({
    Bucket: env.B2_BUCKET,
    Key: key,
    ContentType: mimeType,
  });

  const url = await getSignedUrl(b2, command, { expiresIn: 300 });
  return { uploadUrl: url, storageKey: key };
};

export const getReadUrl = async (storageKey: string) => {
  const command = new GetObjectCommand({
    Bucket: env.B2_BUCKET,
    Key: storageKey,
  });
  return getSignedUrl(b2, command, { expiresIn: 3600 });
};
