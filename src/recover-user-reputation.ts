import { agent, provider, tokenABI, tokenAddress } from './setup.js'
import { getControllerAddress } from "./utils.js";
import { ethers } from "ethers";

// mint an SBT about the user;
// have the user designate a new address (DID)
// have the user request re-issuance of SBT to new address
// check the designation credential
// burn old SBT

const sbtIssuer = await provider.getSigner(0)
const mySBT = new ethers.Contract(tokenAddress, tokenABI).connect(sbtIssuer)

const user = await agent.didManagerCreate({ provider: 'did:ethr:ganache' })
const rootUserAddress = await getControllerAddress(user.did)

let balance = await mySBT.balanceOf(rootUserAddress)
console.log(balance)
const mintResult1 = await (await mySBT.safeMint(rootUserAddress)).wait(0);
const mintResult2 = await (await mySBT.safeMint(rootUserAddress)).wait(0);

// console.log(mintResult)
balance = await mySBT.balanceOf(rootUserAddress)
console.log(balance)
//
//
// const credential = await agent.createVerifiableCredential({
//   credential: {
//     issuer: issuer.did,
//     type: ['SBTConnection'],
//     credentialSubject: {
//       id: user.did,
//       'hasSBT': true,
//     }
//   },
//   proofFormat: 'EthereumEip712Signature2021'
// })
//
// console.log(credential);
//
// const newUserKey = await agent.keyManagerCreate({
//   type: 'Secp256k1',
//   kms: defaultKms
// });
//
// await fundControllerAddress(provider, user.did);
//
// // old did doc
// console.dir((await agent.resolveDid({ didUrl: user.did })).didDocument, { depth: 10 })
//
// const change = await agent.ethrChangeControllerKey({
//   did: user.did,
//   kid: newUserKey.kid,
// })
//
// console.log(change);
// console.dir((await agent.resolveDid({ didUrl: user.did })).didDocument, { depth: 10 })
//
// const verified = await agent.verifyCredential({ credential });
//
// console.log(verified)
