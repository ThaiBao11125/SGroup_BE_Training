class ApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

// 400 Bad Request
export class BadRequestError extends ApiError {
  constructor(message = "Bad Request") {
    super(message, 400);
  }
}

// 401 Unauthorized
export class UnauthorizedError extends ApiError {
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}

// 403 Forbidden
export class ForbiddenError extends ApiError {
  constructor(message = "Forbidden") {
    super(message, 403);
  }
}

// 404 Not Found
export class NotFoundError extends ApiError {
  constructor(message = "Not Found") {
    super(message, 404);
  }
}

//409 Conflict
export class ConflictError extends ApiError {
  constructor(message = "Conflict") {
    super(message, 409);
  }
}

// 500 Internal Server Error
export class InternalServerError extends ApiError {
  constructor(message = "Internal Server Error") {
    super(message, 500);
  }
}

export default ApiError;