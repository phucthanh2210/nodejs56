import multer from 'multer';
import { mkdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { HttpError } from '../lib/http.js';

const uploadDir = fileURLToPath(new URL('../../uploads/', import.meta.url));
export const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 20 } }).single('File');
export const uploadFile = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 20 } }).single('file');

export async function saveImage(file) {
  if (!file) return null;
  const b = file.buffer;
  let extension;
  if (b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) extension = 'png';
  if (b.length >= 3 && b[0] === 255 && b[1] === 216 && b[2] === 255) extension = 'jpg';
  if (b.length >= 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') extension = 'webp';
  if (!extension) throw new HttpError(400, 'Chỉ chấp nhận ảnh PNG, JPEG hoặc WebP');
  await mkdir(uploadDir, { recursive: true });
  const name = `${randomUUID()}.${extension}`;
  await writeFile(`${uploadDir}/${name}`, b, { flag: 'wx' });
  return `/uploads/${name}`;
}
