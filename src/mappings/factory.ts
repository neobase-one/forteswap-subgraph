/* eslint-disable prefer-const */
import { log } from '@graphprotocol/graph-ts'
import { PairCreated } from '../types/Factory/Factory'
import { Bundle, Pair, Token, UniswapFactory } from '../types/schema'
import { Pair as PairTemplate } from '../types/templates'
import {
  FACTORY_ADDRESS,
  fetchTokenDecimals,
  fetchTokenName,
  fetchTokenSymbol,
  fetchTokenTotalSupply,
  ZERO_BD,
  ZERO_BI,
} from './helpers'

const PAIR_BLACKLIST: string[] = [
  '0x81a78a70a6fcc545812713157869e5e7a0a157fe', // VolatileV1 AMM - TA/WCANTO (vAMM-TA/WCANTO)
  '0xc2564c5638d1aea3011b467a4cd1d26e6e4e19cd', // VolatileV1 AMM - TCANTO/WCANTO (vAMM-TCANTO/WCANTO)
  '0xf06eedcada1499cde4f76221332bda09717b9b70', // VolatileV1 AMM - GSC/WCANTO (vAMM-GSC/WCANTO)
  '0x9fb16645faabc6e1c42464ada8cf4e1abe307a6e', // VolatileV1 AMM - WCANTO/DB (vAMM-WCANTO/DB)
  '0x6307ddeed04c36376cea0460e3806ecec59305e8', // VolatileV1 AMM - CS/WCANTO (vAMM-CS/WCANTO)
  '0x58881e5ac66116552311ed5e26fcad919191e6df', // StableV1 AMM - WCANTO/Matrix (sAMM-WCANTO/Matrix)
  '0xfc9be5baa9a916103973e4a0ca99b19eaa48d922', // VolatileV1 AMM - ETH/cINU (vAMM-ETH/cINU)
  '0xe5771d64652b50ac280bb65bc5f1477cacde2e2f', // VolatileV1 AMM - CYBER/WCANTO (vAMM-CYBER/WCANTO)
  '0xe91783d9428399a30623614a7871c226064ec736', // VolatileV1 AMM - GLITCH/WCANTO (vAMM-GLITCH/WCANTO)
  '0xbe5be58584e9e4aebda5455daf9694ea01638fa5', // VolatileV1 AMM - NOTE/BRENT (vAMM-NOTE/BRENT)
  '0xdad0a6c3111b727583341465bf6cb227b8f19f46', // VolatileV1 AMM - cINU/USDC (vAMM-cINU/USDC)
  '0xec9313c4fda0c2245a92cde726fd3b818f33477a', // VolatileV1 AMM - NOTE/ALCHI (vAMM-NOTE/ALCHI)
  '0x5389cea84340a9127e00e3aa19d821e8ed4494a2', // VolatileV1 AMM - ENCANTO/USDC (vAMM-ENCANTO/USDC)
  '0x5c9e78078a6fc82c4ea78649c336d9e71c270625', // VolatileV1 AMM - WCANTO/Matrix (vAMM-WCANTO/Matrix)
  '0xf76402deee871e094e012470429bf14170982aa5', // VolatileV1 AMM - USDC/USDT (vAMM-USDC/USDT)
  '0x57e5f226a12989bb72a518c7259c67e44b9b193d', // VolatileV1 AMM - WCANTO/TOPG (vAMM-WCANTO/TOPG)
  '0xcc3f28d5d00c192b90a3eb00f08831f614433889', // VolatileV1 AMM - ETH/USDC (vAMM-ETH/USDC)
  '0x603145e672242596b95299889434bae86eb323d4', // VolatileV1 AMM - USDC/ATOM (vAMM-USDC/ATOM)
]

export function handleNewPair(event: PairCreated): void {
  // ignore if pair in blacklist
  if(PAIR_BLACKLIST.includes(event.params.pair.toHexString())) {
    return
  }

  // load factory (create if first exchange)
  let factory = UniswapFactory.load(FACTORY_ADDRESS)
  if (factory === null) {
    factory = new UniswapFactory(FACTORY_ADDRESS)
    factory.pairCount = 0
    factory.totalVolumeETH = ZERO_BD
    factory.totalLiquidityETH = ZERO_BD
    factory.totalVolumeUSD = ZERO_BD
    factory.untrackedVolumeUSD = ZERO_BD
    factory.totalLiquidityUSD = ZERO_BD
    factory.txCount = ZERO_BI

    // create new bundle
    let bundle = new Bundle('1')
    bundle.ethPrice = ZERO_BD
    bundle.save()
  }
  factory.pairCount = factory.pairCount + 1
  factory.save()

  // create the tokens
  let token0 = Token.load(event.params.token0.toHexString())
  let token1 = Token.load(event.params.token1.toHexString())

  // fetch info if null
  if (token0 === null) {
    token0 = new Token(event.params.token0.toHexString())
    token0.symbol = fetchTokenSymbol(event.params.token0)
    token0.name = fetchTokenName(event.params.token0)
    token0.totalSupply = fetchTokenTotalSupply(event.params.token0)
    let decimals = fetchTokenDecimals(event.params.token0)

    // bail if we couldn't figure out the decimals
    if (decimals === null) {
      log.debug('mybug the decimal on token 0 was null', [])
      return
    }

    token0.decimals = decimals
    token0.derivedETH = ZERO_BD
    token0.tradeVolume = ZERO_BD
    token0.tradeVolumeUSD = ZERO_BD
    token0.untrackedVolumeUSD = ZERO_BD
    token0.totalLiquidity = ZERO_BD
    // token0.allPairs = []
    token0.txCount = ZERO_BI
  }

  // fetch info if null
  if (token1 === null) {
    token1 = new Token(event.params.token1.toHexString())
    token1.symbol = fetchTokenSymbol(event.params.token1)
    token1.name = fetchTokenName(event.params.token1)
    token1.totalSupply = fetchTokenTotalSupply(event.params.token1)
    let decimals = fetchTokenDecimals(event.params.token1)

    // bail if we couldn't figure out the decimals
    if (decimals === null) {
      return
    }
    token1.decimals = decimals
    token1.derivedETH = ZERO_BD
    token1.tradeVolume = ZERO_BD
    token1.tradeVolumeUSD = ZERO_BD
    token1.untrackedVolumeUSD = ZERO_BD
    token1.totalLiquidity = ZERO_BD
    // token1.allPairs = []
    token1.txCount = ZERO_BI
  }

  let pair = new Pair(event.params.pair.toHexString()) as Pair
  pair.token0 = token0.id
  pair.token1 = token1.id
  pair.liquidityProviderCount = ZERO_BI
  pair.createdAtTimestamp = event.block.timestamp
  pair.createdAtBlockNumber = event.block.number
  pair.txCount = ZERO_BI
  pair.reserve0 = ZERO_BD
  pair.reserve1 = ZERO_BD
  pair.trackedReserveETH = ZERO_BD
  pair.reserveETH = ZERO_BD
  pair.reserveUSD = ZERO_BD
  pair.totalSupply = ZERO_BD
  pair.volumeToken0 = ZERO_BD
  pair.volumeToken1 = ZERO_BD
  pair.volumeUSD = ZERO_BD
  pair.untrackedVolumeUSD = ZERO_BD
  pair.token0Price = ZERO_BD
  pair.token1Price = ZERO_BD
  pair.stable = event.params.stable

  // create the tracked contract based on the template
  PairTemplate.create(event.params.pair)

  // save updated values
  token0.save()
  token1.save()
  pair.save()
  factory.save()
}
