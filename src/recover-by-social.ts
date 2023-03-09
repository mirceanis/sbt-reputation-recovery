import { agent, provider, tokenABI, tokenAddress } from './setup.js'
import { getAddressFromDID } from "./utils.js";
import { ethers } from "ethers";

const sbtIssuer = await provider.getSigner(0)
const mySBT = new ethers.Contract(tokenAddress, tokenABI).connect(sbtIssuer)

////////////////////////////////////////////////////////////////////////////////////////
// mint SBTs to represent reputation;
// have the user delegate recovery capability to others
// delegates  can recover the user's reputation by signing credentials
// DAO checks the recovery credentials from the delegates along with the delegations
// if everything checks out, mint new tokens and burn the old ones
////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////
// create a user
// We use DIDs to represent users.
// This can be done with ethereum addresses directly by prepending `did:ethr:` to the address.
////////////////////////////////////////////////////////////////////////////////////////
const user = await agent.didManagerCreate({ provider: 'did:ethr:ganache' })
const originalUserAddress = getAddressFromDID(user.did)
console.log(`original user address=${originalUserAddress}`)

// mint some reputation
const mintResult1 = await (await mySBT.safeMint(originalUserAddress)).wait(0);
const mintResult2 = await (await mySBT.safeMint(originalUserAddress)).wait(0);
console.log(`original user was minted ${await mySBT.balanceOf(originalUserAddress)} reputation tokens`)

// create some delegates
const delegate1 = await agent.didManagerCreate({ provider: 'did:ethr:ganache' })
const delegate2 = await agent.didManagerCreate({ provider: 'did:ethr:ganache' })
const delegate3 = await agent.didManagerCreate({ provider: 'did:ethr:ganache' })

////////////////////////////////////////////////////////////////////////////////////////
// User decides to safeguard their reputation.
// User delegates recovery capabilities to some delegates
////////////////////////////////////////////////////////////////////////////////////////
console.log(`user delegates recovery capabilities to ${delegate1.did}, ${delegate2.did}, and ${delegate3.did}`)

const delegateCred1 = await agent.createVerifiableCredential({
  credential: {
    issuer: user.did,
    type: ['SBTRecoveryDelegate'],
    credentialSubject: {
      id: delegate1.did,
      requireOthers: 1 // require 1 other delegate to recover
    }
  },
  proofFormat: 'EthereumEip712Signature2021'
})
const delegateCred2 = await agent.createVerifiableCredential({
  credential: {
    issuer: user.did,
    type: ['SBTRecoveryDelegate'],
    credentialSubject: {
      id: delegate2.did,
      requireOthers: 1 // require 1 other delegate to recover
    }
  },
  proofFormat: 'EthereumEip712Signature2021'
})
const delegateCred3 = await agent.createVerifiableCredential({
  credential: {
    issuer: user.did,
    type: ['SBTRecoveryDelegate'],
    credentialSubject: {
      id: delegate3.did,
      requireOthers: 0 // this delegate is able to recover on their own
    }
  },
  proofFormat: 'EthereumEip712Signature2021'
})

////////////////////////////////////////////////////////////////////////////////////////
// User has lost access to their account, or simply wants to transition to a new address.
// Start of the recovery process.
////////////////////////////////////////////////////////////////////////////////////////
console.log('start recovery process')

// user creates a new address
const newUser = await agent.didManagerCreate({ provider: 'did:ethr:ganache' })
const newUserAddress = getAddressFromDID(newUser.did)
console.log(`user creates a new address=${newUserAddress}`)

////////////////////////////////////////////////////////////////////////////////////////
// User asks the delegates to recover their reputation to a new address.
// This can be done through credentials or a simple message out-of-band.
////////////////////////////////////////////////////////////////////////////////////////
console.log('user asks delegates to recover their reputation')

////////////////////////////////////////////////////////////////////////////////////////
// delegates create credentials attesting to the user's request to recover
// in this example, delegates 1 & 2 attest to the recovery, but delegate 3 does not
////////////////////////////////////////////////////////////////////////////////////////
console.log('delegates 1 & 2 create credentials attesting to the user\'s request to recover')

const recoveryCred1 = await agent.createVerifiableCredential({
  credential: {
    issuer: delegate1.did,
    type: ['SBTRecovery'],
    credentialSubject: {
      id: newUser.did,
      // embedding the delegation credential in the recovery credential
      oldIDProof: JSON.stringify(delegateCred1),
    }
  },
  proofFormat: 'EthereumEip712Signature2021'
})

const recoveryCred2 = await agent.createVerifiableCredential({
  credential: {
    issuer: delegate2.did,
    type: ['SBTRecovery'],
    credentialSubject: {
      id: newUser.did,
      oldIDProof: JSON.stringify(delegateCred2),
    }
  },
  proofFormat: 'EthereumEip712Signature2021'
})

////////////////////////////////////////////////////////////////////////////////////////
// Verification step.
// DAO checks all credentials and verifies that:
// * the recovery credentials and the delegation credentials have valid signatures
// * they have the expected types (SBTRecovery, SBTRecoveryDelegate)
// * they refer to the same user addresses
// * the delegation chains are valid
// * the total number of recovery delegates matches the minimums specified in the delegation credentials
////////////////////////////////////////////////////////////////////////////////////////

const result1 = await agent.verifyCredential({ credential: recoveryCred1 })
// extract the delegation credential from the recovery credential
const delegation1 = JSON.parse(recoveryCred1.credentialSubject.oldIDProof)
const delegateResult1 = await agent.verifyCredential({ credential: delegation1 })

const result2 = await agent.verifyCredential({ credential: recoveryCred2 })
const delegation2 = JSON.parse(recoveryCred2.credentialSubject.oldIDProof)
const delegateResult2 = await agent.verifyCredential({ credential: delegation2 })

const allCredentialsAreValid = result1.verified && result2.verified && delegateResult1.verified && delegateResult2.verified

const delegationChain1Valid = delegation1.credentialSubject.id === recoveryCred1.issuer
const delegationChain2Valid = delegation2.credentialSubject.id === recoveryCred2.issuer
const delegationChainsValid = delegationChain1Valid && delegationChain2Valid

const isCorrectTypeR1 = (recoveryCred1?.type as string[]).includes('SBTRecovery')
const isCorrectTypeR2 = (recoveryCred2?.type as string[]).includes('SBTRecovery')
const isCorrectTypeD1 = (delegation1?.type as string[]).includes('SBTRecoveryDelegate')
const isCorrectTypeD2 = (delegation2?.type as string[]).includes('SBTRecoveryDelegate')
const allTypesAreCorrect = isCorrectTypeR1 && isCorrectTypeR2 && isCorrectTypeD1 && isCorrectTypeD2

const newAddress1 = getAddressFromDID(recoveryCred1.credentialSubject.id!!)
const newAddress2 = getAddressFromDID(recoveryCred2.credentialSubject.id!!)
const newAddressesMatch = newAddress1 === newAddress2

const oldAddress1 = getAddressFromDID(delegation1.issuer)
const oldAddress2 = getAddressFromDID(delegation1.issuer)
const oldAddressesMatch = oldAddress1 === oldAddress2

// check that the requirements for number of delegates are met.
// This could be done in a more sophisticated way to account for different numbers of delegates required
const requirementsMet = (delegation1.credentialSubject.requireOthers - delegation2.credentialSubject.requireOthers === 0)

////////////////////////////////////////////////////////////////////////////////////////
// Re-issuance step.
// If all checks have passed, the DAO can re-issue the tokens to the new address
////////////////////////////////////////////////////////////////////////////////////////

if (allTypesAreCorrect && allCredentialsAreValid && delegationChainsValid && newAddressesMatch && oldAddressesMatch && requirementsMet) {
  // mints new tokens
  console.log(`verified that the tokens belonging to ${oldAddress1} should be re-minted for ${newAddress1}`)

  const mintResult3 = await (await mySBT.safeMint(newAddress1)).wait(0);
  const mintResult4 = await (await mySBT.safeMint(newAddress1)).wait(0);
  // in the factoryDAO case it would be the authority burning the tokens of the original user address
  const burnResult1 = await (await mySBT.burn(0)).wait(0)
  const burnResult2 = await (await mySBT.burn(1)).wait(0)
} else {
  console.error(`can't verify recovery request`)
}

// check user balance
console.log(`original user has ${await mySBT.balanceOf(originalUserAddress)} reputation tokens`)
console.log(`new user has ${await mySBT.balanceOf(newUserAddress)} reputation tokens`)
