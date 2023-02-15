import { createAgent, IResolver } from '@veramo/core'
import { DIDResolverPlugin } from '@veramo/did-resolver'
import { getResolver as getEthrResolver } from 'ethr-did-resolver'

const infuraProjectId = '3586660d179141e3801c3895de1c2eba'

const agent = createAgent<IResolver>({
  plugins: [
    new DIDResolverPlugin({
      ...getEthrResolver({ infuraProjectId })
    })
  ]
})

const resolved = await agent.resolveDid({ didUrl: 'did:ethr:0x97fd27892cdcD035dAe1fe71235c636044B59348' })

console.log(resolved)
