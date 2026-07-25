const defaultInitializer = (index: number) => index;

export function createRange<T = number>(
  length: number,
  // oxlint-disable-next-line typescript/no-explicit-any
  initializer: (index: number) => any = defaultInitializer,
): T[] {
  return [...new Array(length)].map((_, index) => initializer(index));
}
