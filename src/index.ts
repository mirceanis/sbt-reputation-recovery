import { createAgent, IResolver } from '@veramo/core'
import { DIDResolverPlugin } from '@veramo/did-resolver'
import { getResolver as getEthrResolver } from 'ethr-did-resolver'
import { createGanacheProvider } from './ganache-provider.js'

const infuraProjectId = '3586660d179141e3801c3895de1c2eba'

const { registry, provider } = await createGanacheProvider()

const agent = createAgent<IResolver>({
  plugins: [
    new DIDResolverPlugin({
      ...getEthrResolver({
        infuraProjectId,
        networks: [
          {
            name: 'ganache',
            chainId: 1337,
            provider: provider as any,
            registry
          }
        ]
      })
    })
  ]
})

const resolved = await agent.resolveDid({ didUrl: 'did:ethr:ganache:0x97fd27892cdcD035dAe1fe71235c636044B59348' })

console.log(resolved)
