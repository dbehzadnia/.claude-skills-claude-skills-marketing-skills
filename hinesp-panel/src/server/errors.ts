/** Errors thrown by services. Their messages are shown to users, so they are in Persian. */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "ابتدا وارد شوید.") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "شما اجازه این کار را ندارید.") {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "مورد پیدا نشد.") {
    super(message, 404);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

export class RateLimitError extends AppError {
  constructor(message = "تعداد درخواست‌ها زیاد است. کمی بعد دوباره تلاش کنید.") {
    super(message, 429);
  }
}
