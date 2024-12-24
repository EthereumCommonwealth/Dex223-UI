import Ajv from "ajv";
import addFormats from "ajv-formats";
import { Address, encodeAbiParameters, getAddress, keccak256 } from "viem";

import { Token } from "@/sdk_hybrid/entities/token";

import { bytecodes } from "./converter";
import schemaJson from "./tokenlist.schema.json";
const ajv = new Ajv({ allErrors: true, verbose: true });

const { bytecode20, bytecode223 } = bytecodes;

type uniToken = {
  chainId: number;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  tags?: string[];
  extensions?: object;
};

type UniData = {
  name: string;
  version?: {
    major: number;
    minor: number;
    patch: number;
  };
  tokens: uniToken[];
  logoURI?: string;
};

const CONVERTER_ADDRESS = "0x044845FB22B4258d83a6c24b2fB061AFEba7e5b9";

type dexToken = {
  chainId: number;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  isNative: boolean;
  isToken: boolean;
  address0: string;
  address1: string;
};

type DexData = {
  name: string;
  version?: {
    major: number;
    minor: number;
    patch: number;
  };
  tokens: Token[];
  logoURI?: string;
};

async function validate(data: any) {
  addFormats(ajv);
  const validator = ajv.compile(schemaJson);

  const valid = validator(data);

  if (valid) {
    return valid;
  }
  if (validator.errors) {
    throw validator.errors.map((error) => {
      delete error.data;
      return error;
    });
  }
}

/**
 * Calculates wrapped token address. Off-chain version of "predictWrapperAddress" function in TokenConverter contract.
 * @param tokenAddress Source token address
 * @param isERC20 Is source token type = ERC20.
 * @returns Wrapped token address.
 */
export function predictWrapperAddress(tokenAddress: string, isERC20: boolean = true): string {
  const _bytecode = isERC20 ? bytecode223 : bytecode20;
  const create2Inputs = [
    "0xff",
    CONVERTER_ADDRESS,
    keccak256(
      encodeAbiParameters([{ name: "x", type: "address" }], [tokenAddress as `0x${string}`]),
    ),
    keccak256(_bytecode as `0x${string}`),
  ];
  const sanitizedInputs = `0x${create2Inputs.map((i) => i.slice(2)).join("")}`;
  return getAddress(`0x${keccak256(sanitizedInputs as `0x${string}`).slice(-40)}`);
}

function formatItem(token: uniToken, address223: string): Token {
  return new Token(
    token.chainId,
    token.address as Address,
    address223 as Address,
    token.decimals,
    token.symbol,
    token.name,
    token.logoURI,
  );
}

async function getList(url: string): Promise<UniData> {
  try {
    const response = await fetch(url);
    console.log(response);
    const data = await response.json();
    console.log(data);
    await validate(data);
    return data;
  } catch (e) {
    return <UniData>{};
  }
}

/**
 * Downloads token list in Uniswap format and converts it into Dex223 token list format.
 * @param url URL of token list
 * @returns Promise with formatted Dex223 token list.
 */
export async function convertList(url: string): Promise<any> {
  const data = await getList(url);
  console.log(data);
  const list = data.tokens;

  console.log(list);
  if (list.length === 0) {
    console.error("No data found");
    return <DexData>{};
  }

  const convertedList: DexData = {
    name: data.name,
    tokens: [],
    logoURI: data.logoURI,
    version: data.version,
  };

  // console.time('parseList');
  for (let token of list) {
    const erc223address = predictWrapperAddress(token.address, true);
    const newItem = formatItem(token, erc223address);
    convertedList.tokens.push(newItem);
  }
  // console.timeEnd('parseList');

  return convertedList;
}
