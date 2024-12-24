import { Token } from "@/sdk_hybrid/entities/token";

export const sepoliaDefaultList = {
  version: {
    major: 1,
    minor: 0,
    patch: 8,
  },
  logoURI: "/images/token-list-placeholder.svg",
  name: "DEX223 Sepolia Default",
  tokens: [
    new Token(
      11155111,
      "0x51a3F4b5fFA9125Da78b55ed201eFD92401604fa",
      "0x4939A61f6276Ff98f350fEd487FC8ffFE5Fce403",
      18,
      "TOT1",
      "Total Test 1",
      "/images/tokens/placeholder.svg",
    ),
    new Token(
      11155111,
      "0x30C7A2261Ad72ad12393B075163Bf9a72a2dA4f8",
      "0xA2370D7046993056ba53Cf89beca123330e8B494",
      6,
      "TOT2",
      "Total Test 2",
      "/images/tokens/placeholder.svg",
    ),
    new Token(
      11155111,
      "0x18B32000CEaAe9BE1cec1cb6845EF7bba1c9DC02",
      "0x882A5B2806D05001AD8eFC69CF68bAdB18640e6B",
      10,
      "TOT3",
      "Total Test 3",
      "/images/tokens/placeholder.svg",
    ),
    new Token(
      11155111,
      "0xa083e42B1525c67A90Cb1628acBC99895dC0447B",
      "0xbeAF0d7e6edF62d84B2d01c949F6f5797Be4258D",
      0,
      "TOT4Z",
      "Total Test 4Z",
      "/images/tokens/placeholder.svg",
    ),
  ],
};
