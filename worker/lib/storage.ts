import { AwsClient } from 'aws4fetch';
import type { Env } from '../env.ts';

/**
 * Where admin-uploaded images live. Amazon S3 is used when its four secrets are set;
 * otherwise an R2 bucket bound as MEDIA, if there is one. The bucket stays private:
 * the Worker signs every read and serves the file itself at /media/<key>.
 */
export interface MediaStorage {
  put(key: string, body: ArrayBuffer, contentType: string): Promise<void>;
  /** The stored file as a response body plus headers, or null when it doesn't exist. */
  get(key: string): Promise<{ body: ReadableStream; headers: Headers } | null>;
}

/** Folder inside the S3 bucket that holds this site's uploads. */
const S3_FOLDER = 'blessed-hope-media';

function s3Storage(env: Env): MediaStorage | null {
  const { S3_BUCKET: bucket, S3_REGION: region, S3_ACCESS_KEY_ID: accessKeyId, S3_SECRET_ACCESS_KEY: secretAccessKey } = env;
  if (!bucket || !region || !accessKeyId || !secretAccessKey) return null;

  const client = new AwsClient({ accessKeyId, secretAccessKey, region, service: 's3' });
  // Virtual-hosted URLs, except for bucket names containing dots (their TLS certificate won't match).
  const base = bucket.includes('.')
    ? `https://s3.${region}.amazonaws.com/${bucket}`
    : `https://${bucket}.s3.${region}.amazonaws.com`;
  // Site keys look like "uploads/2026/11/<id>.jpg"; in the bucket they live under S3_FOLDER.
  const objectKey = (key: string) => `${S3_FOLDER}/${key.replace(/^uploads\//, '')}`;
  const url = (key: string) => `${base}/${objectKey(key).split('/').map(encodeURIComponent).join('/')}`;

  return {
    async put(key, body, contentType) {
      const res = await client.fetch(url(key), { method: 'PUT', body, headers: { 'Content-Type': contentType } });
      if (!res.ok) throw new Error(`S3 upload failed (${res.status}): ${await res.text()}`);
    },
    async get(key) {
      const res = await client.fetch(url(key));
      // A private bucket answers 403 (not 404) for missing keys unless the role may list it.
      if (res.status === 404 || res.status === 403 || !res.body) return null;
      if (!res.ok) throw new Error(`S3 read failed (${res.status})`);
      const headers = new Headers();
      for (const name of ['content-type', 'content-length', 'etag', 'last-modified']) {
        const value = res.headers.get(name);
        if (value) headers.set(name, value);
      }
      return { body: res.body, headers };
    },
  };
}

function r2Storage(bucket: R2Bucket): MediaStorage {
  return {
    async put(key, body, contentType) {
      await bucket.put(key, body, { httpMetadata: { contentType } });
    },
    async get(key) {
      const obj = await bucket.get(key);
      if (!obj) return null;
      const headers = new Headers();
      obj.writeHttpMetadata(headers);
      headers.set('etag', obj.httpEtag);
      return { body: obj.body, headers };
    },
  };
}

export function mediaStorage(env: Env): MediaStorage | null {
  return s3Storage(env) ?? (env.MEDIA ? r2Storage(env.MEDIA) : null);
}
