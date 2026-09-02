import { errorResponse } from "@/lib/error-handler"
import { loadImage } from "@/lib/local-images"

export const runtime = "nodejs"

export async function GET(_request: Request, context: { params: Promise<{ name: string }> }) {
  try {
    const image = await loadImage((await context.params).name)
    return new Response(Uint8Array.from(image.data).buffer, {
      headers: {
        "Content-Type": image.contentType,
        "Content-Length": String(image.data.byteLength),
        "Cache-Control": "private, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch (error) {
    return errorResponse(error)
  }
}
