/**
 * A static collection of utility functions
 */
export class Utility {
  /** Copy the values of enumerable own properties if they do not exist, recursively to the specified depth. */
  static copyIf(target: Record<string, unknown>, depth: number, ...sources: Record<string, unknown>[]) {
    target = Object.assign({}, target);
    sources.filter(source => source).forEach(source => Object.entries(source).forEach(([key, value]) => {
      if (depth !== 0 && this.isObject(target[key]) && this.isObject(value)) {
        target[key] = this.copyIf(target[key] as Record<string, unknown>, (depth - 1), value as Record<string, unknown>);
      } else if (target[key] === undefined) {
        target[key] = value;
      }
    }));

    return target;
  }

  /** Format a tokenized string using a percent syntax. */
  static format(target: string, ...values: Array<string | number | null>) {
      values.forEach((value, index) => target = target.replace(new RegExp(`%${index}`), value as string));
      return target;
  }

  private static isObject(value?: any) { return value && (typeof value === 'object') && !Array.isArray(value); }
}