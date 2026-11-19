export function displayedRangeLimits(
  inverted: boolean,
  lowerAtLimit: boolean,
  upperAtLimit: boolean,
): { lowIsZero: boolean; highIsInfinity: boolean } {
  return {
    lowIsZero: inverted ? upperAtLimit : lowerAtLimit,
    highIsInfinity: inverted ? lowerAtLimit : upperAtLimit,
  };
}
