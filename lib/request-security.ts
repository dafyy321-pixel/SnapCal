import { AppError } from "./error-handler"

export function assertWriteOrigin(request: Request) {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return
  const origin = request.headers.get("origin")
  const site = request.headers.get("sec-fetch-site")
  // Next can normalize a loopback URL to localhost; Host retains the browser's actual authority.
  const url = new URL(request.url)
  const trustedOrigin = `${url.protocol}//${request.headers.get("host") || url.host}`
  if ((origin !== null && origin !== trustedOrigin) || (!origin && site && site !== "same-origin" && site !== "none")) {
    throw new AppError("不允许跨来源修改本地数据", 403, "UNTRUSTED_ORIGIN")
  }
}

export function assertContentType(request: Request, expected: "application/json" | "multipart/form-data") {
  if (request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() !== expected) {
    throw new AppError(`请求必须使用 ${expected}`, 415, "UNSUPPORTED_MEDIA_TYPE")
  }
}
