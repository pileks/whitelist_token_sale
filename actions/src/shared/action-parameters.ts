import { Result, resultErr, resultOk } from "@/shared/result";
import { ActionParameter } from "@solana/actions";

export type GetActionParametersError = {
  paramName: string;
};

export type ActionParameters<T> = {
  [param in keyof T]: string;
};

export type ActionParametersDefinition<T> = {
  [param in keyof T]: { label: string; required?: boolean };
};

export function getActionParametersFromRequest<
  T extends ActionParametersDefinition<T>
>(
  req: Request,
  definition: T
): Result<ActionParameters<T>, GetActionParametersError> {
  const { searchParams } = new URL(req.url);

  let result: Partial<ActionParameters<T>> = {};

  for (let key in definition) {
    const value = searchParams.get(key);

    if (value == null && definition[key].required) {
      return resultErr({ paramName: key });
    }

    result[key] = value ?? "";
  }

  return resultOk(result as ActionParameters<T>);
}

export function getActionParametersFromDefinition<T>(
  definition: ActionParametersDefinition<T>
): ActionParameter[] {
  const actionParams: ActionParameter[] = [];

  for (let key in definition) {
    actionParams.push({
      name: key,
      label: definition[key].label,
      required: definition[key].required,
    });
  }

  return actionParams;
}
