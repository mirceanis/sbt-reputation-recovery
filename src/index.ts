import { createAgent, IDataStore, IDIDManager, IKeyManager, IResolver } from '@veramo/core'
import { DIDResolverPlugin } from '@veramo/did-resolver'
import { EthrDIDProvider } from '@veramo/did-provider-ethr'
import {
  DataStoreORM,
  DataStore,
  Entities,
  migrations,
  KeyStore,
  PrivateKeyStore,
  DIDStore, IDataStoreORM
} from '@veramo/data-store'
import { DIDManager } from '@veramo/did-manager'
import { KeyManager } from '@veramo/key-manager'
import { KeyManagementSystem, SecretBox } from '@veramo/kms-local'
import { DataSource } from 'typeorm'

import { getResolver as getEthrResolver } from 'ethr-did-resolver'
import { createGanacheProvider } from './ganache-provider.js'

import { EthrDidExtension, IEthrDidExtension } from '@spherity/did-extension-ethr'

const dbConnection = await new DataSource({
  type: 'sqlite',
  migrations,
  migrationsRun: true,
  entities: Entities,
  database: 'localdb.sqlite',
  synchronize: false
}).initialize()

const infuraProjectId = '3586660d179141e3801c3895de1c2eba'
const secretBoxKey = 'e46a576aab80d7c817ca3e9b2916aabb67bc41bfd7f54a6af34d4eed2adbf9a3'

const { registry, provider } = await createGanacheProvider()

const defaultKms = 'local'
const ganacheConfig = {
  name: 'ganache',
  chainId: 1337,
  provider,
  registry
}

const agent = createAgent<IResolver & IKeyManager & IDIDManager & IDataStore & IDataStoreORM & IEthrDidExtension>({
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
    })
  ]
})

const myDID = await agent.didManagerGetOrCreate({alias: 'gigi'})

const resolved = await agent.resolveDid({ didUrl: myDID.did })

console.log(resolved)
