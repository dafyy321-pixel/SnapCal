import { ValidationError } from "./error-handler"

/**
 * 文件安全验证工具
 * 用于验证上传文件的安全性，防止恶意文件上传
 */

// 允许的图片MIME类型
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml' // 注意：SVG需要额外检查XSS风险
]

// 危险文件扩展名黑名单
const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
  '.php', '.asp', '.aspx', '.jsp', '.py', '.rb', '.pl', '.sh', '.ps1',
  '.msi', '.deb', '.rpm', '.dmg', '.app', '.pkg', '.deb', '.zip', '.rar',
  '.7z', '.tar', '.gz', '.sql', '.mdb', '.accdb', '.db', '.sqlite'
]

// 图片文件头标识（魔数）
const IMAGE_SIGNATURES = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/jpg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47],
  'image/webp': [0x52, 0x49, 0x46, 0x46],
  'image/gif': [0x47, 0x49, 0x46, 0x38],
  'image/svg+xml': null // SVG是文本格式，需要内容检查
}

export interface FileValidationOptions {
  maxSize?: number // 最大文件大小（字节）
  allowedTypes?: string[] // 允许的MIME类型
  maxFiles?: number // 最大文件数量
  checkFileContent?: boolean // 是否检查文件内容
  sanitizeSVG?: boolean // 是否清理SVG内容
}

export interface FileValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  sanitizedContent?: ArrayBuffer
}

/**
 * 验证单个文件的安全性
 */
export async function validateFile(
  file: File,
  options: FileValidationOptions = {}
): Promise<FileValidationResult> {
  const {
    maxSize = 5 * 1024 * 1024, // 默认5MB
    allowedTypes = ALLOWED_IMAGE_TYPES,
    checkFileContent = true,
    sanitizeSVG = true
  } = options

  const errors: string[] = []
  const warnings: string[] = []

  try {
    // 1. 检查文件大小
    if (file.size > maxSize) {
      errors.push(`文件大小超过限制：${Math.round(file.size / 1024 / 1024)}MB > ${Math.round(maxSize / 1024 / 1024)}MB`)
    }

    // 2. 检查MIME类型
    if (!allowedTypes.includes(file.type)) {
      errors.push(`不支持的文件类型：${file.type}，支持的类型：${allowedTypes.join(', ')}`)
    }

    // 3. 检查文件扩展名
    const extension = getFileExtension(file.name).toLowerCase()
    if (DANGEROUS_EXTENSIONS.includes(extension)) {
      errors.push(`危险文件扩展名：${extension}`)
    }

    // 4. 检查文件名安全性
    const filenameValidation = validateFilename(file.name)
    if (!filenameValidation.isValid) {
      errors.push(...filenameValidation.errors)
    }

    let sanitizedContent: ArrayBuffer | undefined

    // 5. 检查文件内容（如果启用）
    if (checkFileContent && file.size > 0) {
      const contentValidation = await validateFileContent(file, options)
      if (!contentValidation.isValid) {
        errors.push(...contentValidation.errors)
      }
      warnings.push(...contentValidation.warnings)

      if (contentValidation.sanitizedContent) {
        sanitizedContent = contentValidation.sanitizedContent
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedContent
    }

  } catch (error) {
    return {
      isValid: false,
      errors: [`文件验证失败：${error instanceof Error ? error.message : '未知错误'}`],
      warnings
    }
  }
}

/**
 * 批量验证文件
 */
export async function validateFiles(
  files: Record<string, File>,
  options: FileValidationOptions = {}
): Promise<{ isValid: boolean; errors: string[]; warnings: string[]; fileResults: Record<string, FileValidationResult> }> {
  const { maxFiles = 10 } = options
  const fileResults: Record<string, FileValidationResult> = {}
  const allErrors: string[] = []
  const allWarnings: string[] = []

  // 检查文件数量
  const fileCount = Object.keys(files).length
  if (fileCount > maxFiles) {
    allErrors.push(`文件数量超过限制：${fileCount} > ${maxFiles}`)
  }

  // 验证每个文件
  for (const [fieldName, file] of Object.entries(files)) {
    const result = await validateFile(file, options)
    fileResults[fieldName] = result
    allErrors.push(...result.errors)
    allWarnings.push(...result.warnings)
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
    fileResults
  }
}

/**
 * 验证文件内容
 */
async function validateFileContent(
  file: File,
  options: FileValidationOptions
): Promise<FileValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []
  let sanitizedContent: ArrayBuffer | undefined

  try {
    const buffer = await file.arrayBuffer()
    const bytes = new Uint8Array(buffer)

    // SVG特殊处理
    if (file.type === 'image/svg+xml') {
      const svgValidation = await validateSVGContent(buffer, options.sanitizeSVG !== false)
      if (!svgValidation.isValid) {
        errors.push(...svgValidation.errors)
      }
      warnings.push(...svgValidation.warnings)

      if (svgValidation.sanitizedContent) {
        sanitizedContent = svgValidation.sanitizedContent
      }
      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        sanitizedContent
      }
    }

    // 检查文件头（魔数）
    const expectedSignature = IMAGE_SIGNATURES[file.type as keyof typeof IMAGE_SIGNATURES]
    if (expectedSignature) {
      if (!checkFileSignature(bytes, expectedSignature)) {
        errors.push(`文件类型与内容不匹配：${file.type}`)
        warnings.push('检测到可能的文件类型伪造攻击')
      }
    }

    // 检查是否包含恶意代码模式
    const maliciousPatterns = [
      // JavaScript
      new RegExp('<script[^>]*>', 'gi'),
      new RegExp('javascript:', 'gi'),
      new RegExp('on\\w+\\s*=', 'gi'), // onclick, onload等
      // PHP
      new RegExp('<\\?php', 'gi'),
      // Shell
      new RegExp('#!/', 'gi'),
      // SQL注入尝试
      new RegExp('(union|select|insert|update|delete)\\s+', 'gi'),
    ]

    const content = new TextDecoder('utf-8', { fatal: false }).decode(bytes.slice(0, Math.min(1024, bytes.length)))

    for (const pattern of maliciousPatterns) {
      if (pattern.test(content)) {
        errors.push('文件包含潜在恶意代码')
        break
      }
    }

    // 对于非文本文件，检查二进制模式
    if (!isTextFile(file.type)) {
      const binaryCheck = checkBinaryPatterns(bytes)
      if (!binaryCheck.isValid) {
        errors.push(...binaryCheck.errors)
      }
    }

  } catch (error) {
    errors.push(`文件内容检查失败：${error instanceof Error ? error.message : '未知错误'}`)
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * 验证SVG内容并清理潜在XSS
 */
async function validateSVGContent(
  buffer: ArrayBuffer,
  sanitize: boolean = true
): Promise<FileValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []
  let sanitizedContent: ArrayBuffer | undefined

  try {
    const svgText = new TextDecoder('utf-8').decode(buffer)

    // 检查危险标签和属性
    const dangerousPatterns = [
      /<script[^>]*>[\s\S]*?<\/script>/gi,
      /<iframe[^>]*>[\s\S]*?<\/iframe>/gi,
      /<object[^>]*>[\s\S]*?<\/object>/gi,
      /<embed[^>]*>/gi,
      /javascript:/gi,
      /data:(?!image\/)/gi,
      /on\w+\s*=/gi, // 事件处理器
      /xlink:href\s*=/gi,
    ]

    for (const pattern of dangerousPatterns) {
      if (pattern.test(svgText)) {
        errors.push('SVG包含潜在XSS攻击代码')
        warnings.push('检测到危险的事件处理器或外部引用')
        break
      }
    }

    // 清理SVG（如果启用）
    if (sanitize && errors.length === 0) {
      let cleanedSvg = svgText

      // 移除危险属性
      cleanedSvg = cleanedSvg.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      cleanedSvg = cleanedSvg.replace(/javascript:/gi, '')
      cleanedSvg = cleanedSvg.replace(/data:(?!image\/)/gi, '')

      // 移除script标签
      cleanedSvg = cleanedSvg.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')

      // 添加安全属性
      if (!cleanedSvg.includes('<svg')) {
        errors.push('无效的SVG文件格式')
      } else {
        cleanedSvg = cleanedSvg.replace(
          /<svg([^>]*)>/,
          '<svg$1 xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">'
        )

        sanitizedContent = new TextEncoder().encode(cleanedSvg).buffer
        warnings.push('SVG已进行安全处理')
      }
    }

  } catch (error) {
    errors.push(`SVG解析失败：${error instanceof Error ? error.message : '未知错误'}`)
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    sanitizedContent
  }
}

/**
 * 检查文件头（魔数）
 */
function checkFileSignature(bytes: Uint8Array, expectedSignature: number[]): boolean {
  if (bytes.length < expectedSignature.length) {
    return false
  }

  for (let i = 0; i < expectedSignature.length; i++) {
    if (bytes[i] !== expectedSignature[i]) {
      return false
    }
  }

  return true
}

/**
 * 验证文件名安全性
 */
function validateFilename(filename: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // 检查文件名长度
  if (filename.length > 255) {
    errors.push('文件名过长')
  }

  // 检查危险字符
  const dangerousChars = /[<>:"/\\|?*\x00-\x1f]/
  if (dangerousChars.test(filename)) {
    errors.push('文件名包含危险字符')
  }

  // 检查保留名称（Windows）
  const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i
  if (reservedNames.test(filename)) {
    errors.push('文件名使用系统保留名称')
  }

  // 检查路径遍历尝试
  if (filename.includes('../') || filename.includes('..\\')) {
    errors.push('检测到路径遍历攻击尝试')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * 检查二进制文件中的危险模式
 */
function checkBinaryPatterns(bytes: Uint8Array): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // 检查可执行文件头
  const executableHeaders = [
    [0x4D, 0x5A], // PE (Windows EXE)
    [0x7F, 0x45, 0x4C, 0x46], // ELF (Linux)
    [0xFE, 0xED, 0xFA, 0xCE], // Mach-O (macOS)
    [0xCA, 0xFE, 0xBA, 0xBE], // Java class
  ]

  for (const header of executableHeaders) {
    if (checkFileSignature(bytes, header)) {
      errors.push('检测到可执行文件头')
      break
    }
  }

  // 检查脚本特征
  const scriptPatterns = [
    '<?php', // PHP
    '<%', // ASP
    '#!/bin/', // Shell script
    'import os', // Python
  ]

  try {
    const content = new TextDecoder('utf-8', { fatal: false }).decode(bytes.slice(0, Math.min(512, bytes.length)))

    for (const pattern of scriptPatterns) {
      if (content.includes(pattern)) {
        errors.push(`检测到脚本文件特征：${pattern}`)
      }
    }
  } catch {
    // 忽略解码错误，可能是二进制文件
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * 获取文件扩展名
 */
function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.')
  return lastDot > 0 ? filename.substring(lastDot) : ''
}

/**
 * 判断是否为文本文件
 */
function isTextFile(mimeType: string): boolean {
  return mimeType.startsWith('text/') ||
         mimeType === 'image/svg+xml' ||
         mimeType === 'application/json' ||
         mimeType === 'application/xml'
}

/**
 * 生成安全的文件名
 */
export function generateSafeFilename(originalName: string, prefix?: string): string {
  const extension = getFileExtension(originalName)
  const baseName = originalName.replace(/\.[^/.]+$/, '') // 移除扩展名

  // 清理文件名：移除危险字符，只保留字母、数字、连字符、下划线和点
  const cleanBaseName = baseName
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50) // 限制长度

  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)

  const safeName = `${prefix || 'file'}_${cleanBaseName}_${timestamp}_${random}${extension}`

  return safeName.toLowerCase()
}

/**
 * 默认的图片文件验证选项
 */
export const DEFAULT_IMAGE_VALIDATION: FileValidationOptions = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  checkFileContent: true,
  sanitizeSVG: true
}