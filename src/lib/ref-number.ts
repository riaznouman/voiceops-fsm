// Sequential reference number generator with collision-safe retry.
// The naive `count + 1` pattern races under concurrent creates; this wraps
// the create in a retry loop that bumps the suffix on Prisma P2002 errors.

export async function createWithRef<T>(
  prefix: string,
  countFn: () => Promise<number>,
  createFn: (referenceNumber: string) => Promise<T>,
  maxAttempts = 5
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < maxAttempts; i++) {
    const count = await countFn();
    const ref = `${prefix}-${String(count + 1 + i).padStart(5, "0")}`;
    try {
      return await createFn(ref);
    } catch (e) {
      const code = (e as { code?: string })?.code;
      if (code === "P2002") {
        lastErr = e;
        continue;
      }
      throw e;
    }
  }
  throw lastErr instanceof Error
    ? lastErr
    : new Error("Failed to allocate unique reference number");
}
