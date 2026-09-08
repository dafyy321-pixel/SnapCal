import { AppError } from "./error-handler"

export function assertWriteOrigin(request: Request) {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return
  const origin = request.headers.get("origin")
  const site = request.headers.get("sec-fetch-site")
  if ((origin !== null && origin !== new URL(request.url).origin) || (!origin && site && site !== "same-origin" && site !== "none")) {
    throw new AppError("不允许跨来源修改本地数据", 403, "UNTRUSTED_ORIGIN")
  }
}

export function assertContentType(request: Request, expected: "application/json" | "multipart/form-data") {
  if (request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() !== expected) {
    throw new AppError(`请求必须使用 ${expected}`, 415, "UNSUPPORTED_MEDIA_TYPE")
  }
}
