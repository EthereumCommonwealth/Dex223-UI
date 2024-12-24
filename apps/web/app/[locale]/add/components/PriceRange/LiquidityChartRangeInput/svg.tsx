/**
 * Generates an SVG path for the east brush handle.
 * Apply `scale(-1, 1)` to generate west brush handle.
 *
 *    |```````\
 *    |  | |  |
 *    |______/
 *    |
 *    |
 *    |
 *    |
 *    |
 *
 * https://medium.com/@dennismphil/one-side-rounded-rectangle-using-svg-fb31cf318d90
 */

export const brushHandlePath = (height: number) =>
  [
    // Handle (rectangles in original SVG)
    `M 0 0`, // move to origin
    `v ${height}`, // vertical line
    "m 1 0", // move 1px to the right
    `V 0`, // second vertical line
    `M 0 1`, // move to origin

    // Head (the rounded shape from the SVG path)
    `h 7`, // Horizontal line across the top
    `q 7 0, 8 8`, // Rounded corner at the top-right
    `v 17`, // Vertical line down the side of the head
    `q 0 7 -8 8`, // Rounded corner at the bottom-right
    `h -7`, // Horizontal line across the bottom
    `z`, // Close the path for the head
  ].join(" ");

export const brushHandleAccentPath = () =>
  [
    "m 5 8", // move to first accent
    "v 18", // vertical line
    "M 0 0", // move to origin
    "m 9 8", // move to second accent
    "v 18", // vertical line
    "z",
  ].join(" ");

export const OffScreenHandle = ({
  color,
  size = 10,
  margin = 10,
}: {
  color: string;
  size?: number;
  margin?: number;
}) => (
  <polygon
    points={`0 0, ${size} ${size}, 0 ${size}`}
    transform={` translate(${size + margin}, ${margin}) rotate(45) `}
    fill={color}
    stroke={color}
    strokeWidth="4"
    strokeLinejoin="round"
  />
);
