import "server-only"

import { createHash, randomUUID } from "node:crypto"
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { NotFoundError, ValidationError } from "./error-handler"

const imageTypes = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
} as const

const extensionTypes: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
}

function uploadsDirectory(): string {
  return join(process.cwd(), "data", "uploads")
}

export function imageHash(buffer: Uint8Array): string {
  return createHash("sha256").update(buffer).digest("hex")
}

export async function saveImage(buffer: Uint8Array, mimeType: string): Promise<{ name: string; url: string }> {
  const extension = imageTypes[mimeType as keyof typeof imageTypes]
  if (!extension) throw new ValidationError("不支持的图片类型")
  await mkdir(uploadsDirectory(), { recursive: true })
  const name = `${randomUUID()}.${extension}`
  await writeFile(join(uploadsDirectory(), name), buffer, { flag: "wx" })
  return { name, url: `/api/images/${name}` }
}

export async function loadImage(name: string): Promise<{ data: Buffer; contentType: string }> {
  if (!/^[0-9a-f-]{36}\.(jpg|png|webp|gif)$/.test(name)) throw new NotFoundError("图片不存在")
  try {
    return {
      data: await readFile(join(uploadsDirectory(), name)),
      contentType: extensionTypes[name.split(".").pop()!] || "application/octet-stream",
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") throw new NotFoundError("图片不存在")
    throw error
  }
}

export async function deleteImage(name: string): Promise<void> {
  if (!/^[0-9a-f-]{36}\.(jpg|png|webp|gif)$/.test(name)) return
  try {
    await unlink(join(uploadsDirectory(), name))
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error
  }
}

export function imageNameFromUrl(url: string): string | null {
  return url.match(/^\/api\/images\/([0-9a-f-]{36}\.(?:jpg|png|webp|gif))$/)?.[1] || null
}
