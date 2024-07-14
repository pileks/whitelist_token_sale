export type Result<T, E> =
  | {
      ok: true;
      value: T;
    }
  | {
      ok: false;
      error: E;
    };

export function resultOk<T>(value: T): Result<T, never> {
  return {
    ok: true,
    value: value,
  };
}

export function resultErr<E>(error: E): Result<never, E> {
  return {
    ok: false,
    error: error,
  };
}
