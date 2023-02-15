import { agent, provider, tokenABI, tokenAddress } from './setup.js'
import { getDIDAddress } from "./utils.js";
import { ethers } from "ethers";

// mint an SBT about the user;
// have the user designate a new address (DID)
// have the user request re-issuance of SBT to new address
// check the designation credential
// burn old SBT

const sbtIssuer = await provider.getSigner(0)
const mySBT = new ethers.Contract(tokenAddress, tokenABI).connect(sbtIssuer)

const user = await agent.didManagerCreate({ provider: 'did:ethr:ganache' })
const rootUserAddress = await getDIDAddress(user.did)
console.log(`original user=${rootUserAddress}`)

// mint some reputation
const mintResult1 = await (await mySBT.safeMint(rootUserAddress)).wait(0);
const mintResult2 = await (await mySBT.safeMint(rootUserAddress)).wait(0);
console.log(`original user has ${await mySBT.balanceOf(rootUserAddress)} reputation tokens`)

// user creates a new address
const newUser = await agent.didManagerCreate({ provider: 'did:ethr:ganache' })
const newUserAddress = getDIDAddress(newUser.did)
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

if (verified) {
  // mints new tokens
  const newAddress = getDIDAddress(credential.credentialSubject.id!)
  console.log(`verified that the tokens belonging to ${getDIDAddress(credential.issuer as string)} should be re-minted for ${newAddress}`)

  const mintResult3 = await (await mySBT.safeMint(newAddress)).wait(0);
  const mintResult4 = await (await mySBT.safeMint(newAddress)).wait(0);
  // in the factoryDAO case it would be the authority burning the old tokens
  const burnResult1 = await (await mySBT.burn(0)).wait(0)
  const burnResult2 = await (await mySBT.burn(1)).wait(0)
} else {
  console.error(`can't verify ownership`)
}

// check user balance
console.log(`original user has ${await mySBT.balanceOf(rootUserAddress)} reputation tokens`)
console.log(`new user has ${await mySBT.balanceOf(newUserAddress)} reputation tokens`)
