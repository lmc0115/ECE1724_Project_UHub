import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import { env } from "../config/env.js";

export const s3Client = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY
  }
});

const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png":  ".png",
  "image/webp": ".webp",
  "image/gif":  ".gif"
};

export const isAllowedImageType = (contentType: string): boolean =>
  contentType in ALLOWED_IMAGE_TYPES;

/**
 * Generates a short-lived presigned PUT URL so the client can upload an image
 * directly to S3 without routing the binary through this server.
 *
 * @param folder  S3 key prefix, e.g. "avatars" or "events/covers"
 * @param ownerId Used as a sub-folder to keep objects organised per user/entity
 * @param contentType  Must be one of the ALLOWED_IMAGE_TYPES
 * @returns uploadUrl – PUT to this URL (expires in 5 min)
 *          publicUrl – permanent HTTPS URL to store in the database
 *          key       – raw S3 object key (useful for later deletion)
 */
export const generatePresignedUploadUrl = async (
  folder: string,
  ownerId: string,
  contentType: string
): Promise<{ uploadUrl: string; publicUrl: string; key: string }> => {
  const ext = ALLOWED_IMAGE_TYPES[contentType];
  const key = `${folder}/${ownerId}/${randomUUID()}${ext}`;

  const command = new PutObjectCommand({
    Bucket:      env.AWS_S3_BUCKET,
    Key:         key,
    ContentType: contentType
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
  const publicUrl = `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;

  return { uploadUrl, publicUrl, key };
};

/**
 * Deletes an object from S3 by its key.
 * Call this when replacing or removing an existing image.
 */
export const deleteS3Object = async (key: string): Promise<void> => {
  await s3Client.send(
    new DeleteObjectCommand({ Bucket: env.AWS_S3_BUCKET, Key: key })
  );
};

/**
 * Extracts the S3 object key from a full public URL.
 * Returns null if the URL does not belong to this bucket.
 */
export const keyFromPublicUrl = (url: string): string | null => {
  const prefix = `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/`;
  return url.startsWith(prefix) ? url.slice(prefix.length) : null;
};
