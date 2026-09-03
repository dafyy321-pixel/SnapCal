import { parseInput, readJson } from "@/lib/api-validation"
import { AppError, errorResponse, NotFoundError, successResponse } from "@/lib/error-handler"
import { wellnessDb } from "@/lib/wellness-db"
import { idParamSchema, templateCopySchema, workoutTemplateSchema } from "@/lib/wellness-schemas"

export const runtime = "nodejs"
type Context = { params: Promise<{ id: string }> }

async function idFrom(context: Context) {
  return parseInput(idParamSchema, await context.params).id
}

export async function PATCH(request: Request, context: Context) {
  try {
    const id = await idFrom(context)
    const current = wellnessDb.getTemplate(id)
    if (!current) throw new NotFoundError("训练模板不存在")
    if (current.is_builtin) throw new AppError("内置模板不能修改，请先复制", 409, "BUILTIN_TEMPLATE")
    const input = parseInput(workoutTemplateSchema, await readJson(request))
    return successResponse({ template: wellnessDb.updateTemplate(id, input) })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(request: Request, context: Context) {
  try {
    const source = wellnessDb.getTemplate(await idFrom(context))
    if (!source) throw new NotFoundError("训练模板不存在")
    const input = parseInput(templateCopySchema, await readJson(request))
    const template = wellnessDb.createTemplate({
      name: input.name || `${source.name} 副本`,
      workout_type: source.workout_type,
      description: source.description,
      exercises: source.exercises,
    })
    return successResponse({ template }, 201)
  } catch (error) {
    return errorResponse(error)
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const id = await idFrom(context)
    const current = wellnessDb.getTemplate(id)
    if (!current) throw new NotFoundError("训练模板不存在")
    if (current.is_builtin) throw new AppError("内置模板不能删除", 409, "BUILTIN_TEMPLATE")
    wellnessDb.deleteTemplate(id)
    return successResponse({ message: "训练模板已删除" })
  } catch (error) {
    return errorResponse(error)
  }
}
