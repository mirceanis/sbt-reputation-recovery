import { agent, provider, tokenABI, tokenAddress } from './setup.js'
import { getAddressFromDID } from "./utils.js";
import { ethers } from "ethers";

// mint SBTs to represent reputation;
// have the user designate a new address (DID) (as a `SBTConnection` credential)
// have the user request re-issuance of SBT to new address; skipped in this demo since it's all inline
// factoryDAO checks the `SBTConnection` credential
// if everything checks out, mint new tokens and burn the old ones

const sbtIssuer = await provider.getSigner(0)
const mySBT = new ethers.Contract(tokenAddress, tokenABI).connect(sbtIssuer)



// create a user
// this can be simply prepending `did:ethr:` to a known user address
const user = await agent.didManagerCreate({ provider: 'did:ethr:ganache' })
const originalUserAddress = getAddressFromDID(user.did)
console.log(`original user=${originalUserAddress}`)

// mint some reputation
const mintResult1 = await (await mySBT.safeMint(originalUserAddress)).wait(0);
const mintResult2 = await (await mySBT.safeMint(originalUserAddress)).wait(0);
console.log(`original user was minted ${await mySBT.balanceOf(originalUserAddress)} reputation tokens`)

// user creates a new address
const newUser = await agent.didManagerCreate({ provider: 'did:ethr:ganache' })
const newUserAddress = getAddressFromDID(newUser.did)
console.log(`user creates a new address=${newUserAddress}`)

// user signs a credential claiming ownership of the new address
const credential = await agent.createVerifiableCredential({
  credential: {
    issuer: user.did,
    type: ['SBTConnection'],
    credentialSubject: {
      id: `did:ethr:ganache:${newUserAddress}`,
    }
  },
  proofFormat: 'EthereumEip712Signature2021'
})

console.log(credential);

// Issuer checks user credential

const { verified } = await agent.verifyCredential({ credential })
const newAddress = getAddressFromDID(credential.credentialSubject.id!)
const oldAddress = getAddressFromDID(credential.issuer as string)
const isCorrectType = (credential?.type as string[]).includes('SBTConnection')

if (verified && isCorrectType) {
  // mints new tokens
  console.log(`verified that the tokens belonging to ${oldAddress} should be re-minted for ${newAddress}`)

  const mintResult3 = await (await mySBT.safeMint(newAddress)).wait(0);
  const mintResult4 = await (await mySBT.safeMint(newAddress)).wait(0);
  // in the factoryDAO case it would be the authority burning the tokens of the original user address
  const burnResult1 = await (await mySBT.burn(0)).wait(0)
  const burnResult2 = await (await mySBT.burn(1)).wait(0)
} else {
  console.error(`can't verify ownership`)
}

// check user balance
console.log(`original user has ${await mySBT.balanceOf(originalUserAddress)} reputation tokens`)
console.log(`new user has ${await mySBT.balanceOf(newUserAddress)} reputation tokens`)
