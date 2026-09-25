import Ajv from "ajv";
import addFormats from "ajv-formats";
import { Address, encodeAbiParameters, encodePacked, getAddress, keccak256 } from "viem";

import { Token } from "@/sdk_bi/entities/token";

import { bytecodes } from "./converter";
import schemaJson from "./tokenlist.schema.json";

const ajv = new Ajv({ allErrors: true, verbose: true });
import { CONVERTER_ADDRESS } from "@/sdk_bi/addresses";
import { DexChainId } from "@/sdk_bi/chains";
const { bytecode20, bytecode223 } = bytecodes;

type uniToken = {
  chainId: number;
  address: Address;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  tags?: string[];
  extensions?: object;
};

type UniData = {
  name: string;
  version: {
    major: number;
    minor: number;
    patch: number;
  };
  tokens: uniToken[];
  logoURI?: string;
};

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
  version: {
    major: number;
    minor: number;
    patch: number;
  };
  tokens: Token[];
  logoURI?: string;
};

addFormats(ajv);
const validator = ajv.compile(schemaJson);
const tokenValidator = ajv.compile({ $ref: `${schemaJson.$id}#/definitions/TokenInfo` });

async function validate(data: any) {
  const valid = validator(data);

  if (valid) {
    return valid;
  }

  // Handle validation errors
  if (validator.errors) {
    throw validator.errors.map((error) => {
      delete error.data; // clean up data property if exists
      return error;
    });
  }
}

/**
 * Calculates wrapped token address. Off-chain version of "predictWrapperAddress" function in TokenConverter contract.
 * @param tokenAddress Source token address
 * @param isERC20 Is source token type = ERC20.
 * @param converterAddress converter should be passed so function works for different chains.
 * @returns Wrapped token address.
 */
export function predictWrapperAddress(
  tokenAddress: Address,
  isERC20: boolean = true,
  converterAddress: Address,
): string {
  const _bytecode = isERC20 ? bytecode223 : bytecode20;
  const hash = keccak256(
    encodePacked(
      ["bytes1", "address", "bytes32", "bytes32"],
      [
        "0xff",
        converterAddress,
        keccak256(
          encodeAbiParameters([{ name: "x", type: "address" }], [tokenAddress as `0x${string}`]),
        ),
        keccak256(_bytecode as `0x${string}`),
      ],
    ),
  );

  return getAddress(`0x${hash.slice(-40)}`);
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

async function getList(url: string, chainId: DexChainId): Promise<UniData | undefined> {
  try {
    const response = await fetch(url);
    const data = await response.json();

    // Public lists are multi-chain and often carry a few entries that fail the schema (for example
    // non-EVM addresses in the Uniswap default list). Keep the valid tokens for this chain instead of
    // rejecting the whole list.
    const tokens: uniToken[] = Array.isArray(data?.tokens)
      ? data.tokens.filter((token: uniToken) => token?.chainId === chainId && tokenValidator(token))
      : [];
    const list = { ...data, tokens };

    await validate(list);
    return list;
  } catch (e) {
    console.log(e);
    return undefined;
  }
}

/**
 * Downloads token list in Uniswap format and converts it into Dex223 token list format.
 * @param url URL of token list
 * @returns Promise with formatted Dex223 token list.
 */
export async function convertList(url: string, chainId: DexChainId): Promise<DexData | undefined> {
  const data = await getList(url, chainId);

  if (!data) {
    return undefined;
  }

  const list = data.tokens.filter((t) => t.chainId === chainId);

  if (list.length === 0) {
    return undefined;
  }

  const convertedList: DexData = {
    name: data.name,
    tokens: [],
    logoURI: data.logoURI,
    version: data.version,
  };

  // console.time('parseList');
  for (let token of list) {
    const erc223address = predictWrapperAddress(token.address, true, CONVERTER_ADDRESS[chainId]);
    if (erc223address) {
      const newItem = formatItem(token, erc223address);
      convertedList.tokens.push(newItem);
    }
  }
  // console.timeEnd('parseList');

  return convertedList;
}
