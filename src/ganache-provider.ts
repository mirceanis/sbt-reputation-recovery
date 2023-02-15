import { Contract, ContractFactory, ContractInterface, providers } from 'ethers'
import { EthereumDIDRegistry } from 'ethr-did-resolver'
import ganache from 'ganache'
import myToken from './MyToken.json' assert { type: 'json' }

/**
 * Creates a Web3Provider that connects to a local ganache instance with a bunch of known keys and an ERC1056 contract.
 *
 * This provider can only be used in a single test suite, because of some concurrency issues with ganache.
 */
export async function createGanacheProvider(): Promise<{ tokenAddress: any | string; registry: any | string; provider: providers.Web3Provider; tokenABI: ContractInterface }> {
  const provider = new providers.Web3Provider(
    ganache.provider({
      logging: { quiet: true },
      deterministic: true,
      db_path: './ganachedb',
      accounts: [
        {
          secretKey: '0x278a5de700e29faae8e40e366ec5012b5ec63d36ec77e8a2417154cc1d25383f',
          //  address: '0xf3beac30c498d9e26865f34fcaa57dbb935b0d74',
          //  publicKey: '03fdd57adec3d438ea237fe46b33ee1e016eda6b585c3e27ea66686c2ea5358479'
          balance: '0x1000000000000000000000',
        },
        {
          secretKey: '0x0000000000000000000000000000000000000000000000000000000000000001',
          //  address: '0x7e5f4552091a69125d5dfcb7b8c2659029395bdf',
          //  publicKey: '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798'
          balance: '0x1000000000000000000000',
        },
        {
          secretKey: '0x0000000000000000000000000000000000000000000000000000000000000002',
          //  address: '0x2b5ad5c4795c026514f8317c7a215e218dccd6cf',
          //  publicKey: '02c6047f9441ed7d6d3045406e95c07cd85c778e4b8cef3ca7abac09b95c709ee5'
          balance: '0x1000000000000000000000',
        },
        {
          secretKey: '0x0000000000000000000000000000000000000000000000000000000000000003',
          //  address: '0x6813eb9362372eef6200f3b1dbc3f819671cba69',
          //  publicKey: '02f9308a019258c31049344f85f89d5229b531c845836f99b08601f113bce036f9'
          balance: '0x1000000000000000000000',
        },
        {
          secretKey: '0x0000000000000000000000000000000000000000000000000000000000000004',
          //  address: '0x1eff47bc3a10a45d4b230b5d10e37751fe6aa718',
          //  publicKey: '02e493dbf1c10d80f3581e4904930b1404cc6c13900ee0758474fa94abe8c4cd13'
          balance: '0x1000000000000000000000',
        },
        {
          secretKey: '0x0000000000000000000000000000000000000000000000000000000000000005',
          //  address: '0xe1ab8145f7e55dc933d51a18c793f901a3a0b276'
          //  publicKey: '022f8bde4d1a07209355b4a7250a5c5128e88b84bddc619ab7cba8d569b240efe4'
          balance: '0x1000000000000000000000',
        },
        {
          secretKey: '0x0000000000000000000000000000000000000000000000000000000000000006',
          balance: `0x1000000000000000000000`,
        },
      ],
    }) as any
  )
  await provider.ready
  const factory = ContractFactory.fromSolidity(EthereumDIDRegistry).connect(provider.getSigner(0))
  let registryContract: Contract = await factory.deploy()
  registryContract = await registryContract.deployed()
  await registryContract.deployTransaction.wait()
  const registry = registryContract.address

  // const sbtFactory = ContractFactory.fromSolidity(myToken).connect(provider.getSigner(0))
  const sbtFactory = new ContractFactory(myToken.abi, myToken.data.bytecode.object, await provider.getSigner(0))
  let sbtContract: Contract = await (await sbtFactory.deploy()).deployed()
  await sbtContract.deployTransaction.wait()
  const tokenAddress = sbtContract.address
  const tokenABI = myToken.abi as ContractInterface
  await (await sbtContract.setAuthority(await provider.getSigner(0).getAddress())).wait(0)

  return { provider, registry, tokenAddress, tokenABI }
}
