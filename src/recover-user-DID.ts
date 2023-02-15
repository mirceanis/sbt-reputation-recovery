import { agent, defaultKms, provider } from './setup.js'
import { fundControllerAddress } from "./utils.js";

// issue a credential to the user; have the user rotate their keys, prove that the credential is still valid

const issuer = await agent.didManagerCreate({ provider: 'did:ethr:ganache' })
const user = await agent.didManagerCreate({ provider: 'did:ethr:ganache' })

const credential = await agent.createVerifiableCredential({
  credential: {
    issuer: issuer.did,
    type: ['SBTConnection'],
    credentialSubject: {
      id: user.did,
      'hasSBT': true,
    }
  },
  proofFormat: 'EthereumEip712Signature2021'
})

console.log(credential);

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

console.log(change);
console.dir((await agent.resolveDid({ didUrl: user.did })).didDocument, { depth: 10 })

const verified = await agent.verifyCredential({ credential });

console.log(verified)
