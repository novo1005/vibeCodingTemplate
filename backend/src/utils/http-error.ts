/**
 * Domain-level error class. Throw `AppError` from services/controllers; the
 * global error handler (`plugins/error-handler.ts`) converts it to a unified
 * JSON response with the right HTTP status.
 */
export class AppError extends Error {
  public readonly statusCode: number
  public readonly code: number

  constructor(message: string, statusCode = 400, code?: number) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.code = code ?? statusCode
  }
}

export const NotFoundError = (resource = 'resource') =>
  new AppError(`${resource} not found`, 404, 40400)

export const BadRequestError = (message = 'Bad request') => new AppError(message, 400, 40000)

export const UnauthorizedError = (message = 'Unauthorized') => new AppError(message, 401, 40100)

export const ForbiddenError = (message = 'Forbidden') => new AppError(message, 403, 40300)

export const ConflictError = (message = 'Conflict') => new AppError(message, 409, 40900)

export const BadGatewayError = (message = 'Bad gateway') => new AppError(message, 502, 50200)
