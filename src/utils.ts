import { ethers, providers } from "ethers";
import { agent } from "./setup.js";
import { getEthereumAddress } from "@veramo/utils";
import { computeAddress } from "ethers/lib/utils.js";

export async function getControllerAddress(did: string) {
  const userDoc = await agent.resolveDid({ didUrl: did })
  const vm = await agent.getDIDComponentById({ didUrl: `${did}#controller`, didDocument: userDoc.didDocument! })
  const userAddress = getEthereumAddress(vm as any)
  return userAddress;
}

export function getAddressFromDID(did: string) {
  const publicKey = did.split(':').pop()!
  if (publicKey.length > 44) {
    return computeAddress(publicKey)
  } else {
    return publicKey
  }
}

export async function fundControllerAddress(provider: providers.Web3Provider, did: string) {
  const signer = await provider.getSigner(0)
  const fundingAddress = await signer.getAddress();

  const userAddress = await getControllerAddress(did)

  const tx = {
    from: fundingAddress,
    to: userAddress,
    value: ethers.utils.parseEther("0.1"),
    nonce: provider.getTransactionCount(fundingAddress, "latest"),
    gasLimit: 100000,
  };

  console.log(`funding the controller address (${userAddress}) for the DID=${did}`)
  const ttx = await signer.sendTransaction(tx);
  await ttx.wait(0)
  console.log('done')
}
