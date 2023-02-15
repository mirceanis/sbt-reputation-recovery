import { agent, defaultKms, provider } from './setup.js'
import { IEthrDidExtension } from "@spherity/did-extension-ethr";
import { TAgent } from "@veramo/core";
import { ethers } from "ethers";
import { getEthereumAddress } from "@veramo/utils";

// issue a credential to the user; have the user rotate their keys, prove that the credential is still valid

const issuer = await agent.didManagerCreate({ provider: 'did:ethr:ganache' })
const user = await agent.didManagerCreate({ provider: 'did:ethr:ganache' })

const userDoc = await agent.resolveDid({ didUrl: user.did })
const vm = await agent.getDIDComponentById({ didUrl: `${user.did}#controller`, didDocument: userDoc.didDocument! })
const userAddress = getEthereumAddress(vm as any)

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

const signer = await provider.getSigner(0)
const fundingAddress = await signer.getAddress();

const tx = {
  from: fundingAddress,
  to: userAddress,
  value: ethers.utils.parseEther("0.1"),
  nonce: provider.getTransactionCount(fundingAddress, "latest"),
  gasLimit: 100000,
};

console.log('funding the controller')
const ttx = await signer.sendTransaction(tx);
await ttx.wait(0)
console.log('done')

console.dir((await agent.resolveDid({ didUrl: user.did })).didDocument, { depth: 10 })

const change = await (agent as any as TAgent<IEthrDidExtension>).ethrChangeControllerKey({
  did: user.did,
  kid: newUserKey.kid,
})

console.log(change)
console.dir((await agent.resolveDid({ didUrl: user.did })).didDocument, { depth: 10 })

const verified = await agent.verifyCredential({credential})

console.log(verified)
