import { agent, defaultKms, provider } from './setup.js'
import { fundControllerAddress, getDIDAddress } from "./utils.js";

// issue a credential to the user; have the user rotate their keys, prove that their reputation (credential) is still
// valid

const issuer = await agent.didManagerCreate({ provider: 'did:ethr:ganache' })
const user = await agent.didManagerCreate({ provider: 'did:ethr:ganache' })
const userAddress = getDIDAddress(user.did)
console.log(`user address=${userAddress}`)

const credential = await agent.createVerifiableCredential({
  credential: {
    issuer: issuer.did,
    type: ['SomeReputationInTheFormOfACredential'],
    credentialSubject: {
      id: `did:ethr:ganache:${userAddress}`,
      isNice: true
    }
  },
  proofFormat: 'EthereumEip712Signature2021'
})

console.log('user was issued a credential:')
console.log(credential);

console.log(`user wants to migrate to a new key, but keep their address`)
const newUserKey = await agent.keyManagerCreate({
  type: 'Secp256k1',
  kms: defaultKms
});

await fundControllerAddress(provider, user.did);

// old did doc
console.dir((await agent.resolveDid({ didUrl: user.did })).didDocument, { depth: 10 })

const change = await agent.ethrChangeControllerKey({
  did: user.did,
  kid: newUserKey.kid,
})

// new DID document
console.dir((await agent.resolveDid({ didUrl: user.did })).didDocument, { depth: 10 })

const verified = await agent.verifyCredential({ credential });

// reputation is still valid
console.log(verified)
