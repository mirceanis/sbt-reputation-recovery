import { createAgent, ICredentialPlugin, IDataStore, IDIDManager, IKeyManager, IResolver } from '@veramo/core'
import { DIDResolverPlugin } from '@veramo/did-resolver'
import { EthrDIDProvider } from '@veramo/did-provider-ethr'
import {
  DataStore,
  DataStoreORM,
  DIDStore,
  Entities,
  IDataStoreORM,
  KeyStore,
  migrations,
  PrivateKeyStore
} from '@veramo/data-store'
import { DIDManager } from '@veramo/did-manager'
import { KeyManager } from '@veramo/key-manager'
import { KeyManagementSystem, SecretBox } from '@veramo/kms-local'
import { CredentialPlugin } from '@veramo/credential-w3c'
import { CredentialIssuerEIP712 } from '@veramo/credential-eip712'
import { DataSource } from 'typeorm'

import { getResolver as getEthrResolver } from 'ethr-did-resolver'
import { createGanacheProvider } from './ganache-provider.js'

import { EthrDidExtension, IEthrDidExtension } from '@spherity/did-extension-ethr'
import { ContractInterface, providers } from "ethers";

const dbConnection = await new DataSource({
  type: 'sqlite',
  migrations,
  migrationsRun: true,
  entities: Entities,
  database: ':memory:',
  synchronize: false
}).initialize()

const infuraProjectId = '3586660d179141e3801c3895de1c2eba'
const secretBoxKey = 'e46a576aab80d7c817ca3e9b2916aabb67bc41bfd7f54a6af34d4eed2adbf9a3'

export const {
  registry,
  provider,
  tokenAddress,
  tokenABI
}: { tokenAddress: any; registry: any; provider: providers.Web3Provider; tokenABI: ContractInterface } = await createGanacheProvider()

export const defaultKms = 'local'
const ganacheConfig = {
  name: 'ganache',
  chainId: 1337,
  provider,
  registry
}

export const agent = createAgent<IResolver & IKeyManager & IDIDManager & IDataStore & IDataStoreORM & ICredentialPlugin & IEthrDidExtension>({
  plugins: [
    new DIDResolverPlugin({
      ...getEthrResolver({
        infuraProjectId,
        networks: [ganacheConfig]
      })
    }),
    new KeyManager({
      store: new KeyStore(dbConnection),
      kms: {
        [defaultKms]: new KeyManagementSystem(new PrivateKeyStore(dbConnection, new SecretBox(secretBoxKey)))
      }
    }),
    new DIDManager({
      store: new DIDStore(dbConnection),
      defaultProvider: 'did:ethr:ganache',
      providers: {
        'did:ethr:ganache': new EthrDIDProvider({
          defaultKms,
          networks: [ganacheConfig]
        })
      }
    }),
    new DataStore(dbConnection),
    new DataStoreORM(dbConnection),
    new EthrDidExtension({
      store: new DIDStore(dbConnection) as any,
      defaultKms,
      networks: [ganacheConfig]
    }),
    new CredentialPlugin(),
    new CredentialIssuerEIP712()
  ]
})
