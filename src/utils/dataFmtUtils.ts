import { isNaN, isNull, isUndefined } from 'lodash';

export const fmtNumLikeVal2StrEndWithPx = (
  unformatted: string | number | bigint | undefined | null,
): `${number | bigint}px` | null => {
  if (isNull(unformatted) || isUndefined(unformatted) || isNaN(unformatted)) return null;

  if (typeof unformatted === 'number') {
    const numStr = unformatted.toFixed(2);

    return numStr.includes('e') ? null : `${Number(numStr)}px`;
  }

  if (typeof unformatted === 'bigint') return `${unformatted}px`;

  if (typeof unformatted !== 'string') return null;

  try {
    return fmtNumLikeVal2StrEndWithPx(Number(unformatted.replace('px', '')));
  } catch (error) {
    console.error(error);
  }
};

type tokenStruct = (Color | string)[][];

/**
 *
 * @param str 输入 text-shadow 的**值(不带标签本身名字)**
 * @returns 保有颜色和其他 Token 的二维数组,
 *   同列的内容是同一个 Shadow 的
 *
 * @example
 * const ans = textShadowParser(`1px 1px 2px rgba(12, 22,3 , 12),0 0 1em blue,
 * 0 0 0.2em blue;`);
 *
 * expect(ans).toEqual([
 *     ["1px", "1px", "2px", "rgba(12,22,3,12)"],
 *     ["0", "0", "1em", "blue"],
 *     ["0", "0", "0.2em", "blue;"],
 * ]);
 */
export const textShadowParser = (str: string): tokenStruct => {
  const tokens = str
    .replaceAll(',', ', ')
    .split(/[\n\r ]/)
    .filter(Boolean);

  return tokens.reduce(
    ({ ans, colorTmp }, cur): { ans: tokenStruct; colorTmp: string } => {
      if (cur.includes(')') && cur.includes(',')) {
        const color = colorTmp + cur.replaceAll(',', '');
        ans.at(-1).push(color);
        return {
          ans: [...ans, []],
          colorTmp: '',
        };
      }

      if (cur.includes(')')) {
        const color = colorTmp + cur;
        ans.at(-1).push(color);

        return {
          ans,
          colorTmp: '',
        };
      }

      if (colorTmp !== '') {
        return {
          ans,
          colorTmp: colorTmp + cur,
        };
      }

      if (cur.includes('(')) {
        return {
          ans,
          colorTmp: cur,
        };
      }

      if (cur.includes(',')) {
        ans.at(-1).push(cur.replaceAll(',', ''));
        return {
          ans: [...ans, []],
          colorTmp: '',
        };
      }

      ans.at(-1).push(cur);
      return {
        ans,
        colorTmp,
      };
    },
    { ans: [[]], colorTmp: '' } as { ans: tokenStruct; colorTmp: string },
  ).ans;
};
