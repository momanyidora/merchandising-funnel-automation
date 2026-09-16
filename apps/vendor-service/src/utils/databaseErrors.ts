export function isDuplicateError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const cause = (
    error as Error & {
      cause?: {
        code?: string;
      };
    }
  ).cause;

  return cause?.code === "23505";
}
