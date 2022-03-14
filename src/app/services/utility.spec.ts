import { Utility } from "./utility";

type Source = { boolean?: boolean, number: number, object: { object?: {} } }

describe('Utility', () => {
  it('should copy conditionally at depth of zero with copyIf', () => {
    const target = { boolean: undefined, number: 0, object: { } };
    const result = Utility.copyIf(target, 0, { number: 0, object: { } }, { boolean: true }) as Source;
    expect(result).not.toBe(target);
    expect(result.boolean).toBe(true);
    expect(result.number).toBe(0);
    expect(result.object).toBe(target.object);
  });

  it('should copy recursively with copyIf', () => {
    const target = { boolean: false, number: 0, object: { } };
    const result = Utility.copyIf(target, 1, { number: 0, object: { object: target } }, { boolean: true }) as Source;
    expect(result.object.object).toBe(target);
  });

  it('should format tokenized strings with percentage syntax', () => {
    expect(Utility.format('%0 %1', 1, 2)).toBe('1 2');
  });
});
