# SBT reputation recovery

before all, run

```
npm i
```

1. through user key rotation

```bash
npm run rotation
```

In this sample, the user is in control of their own keys and treating their ethereum address as a DID (did:ethr)
They can freely rotate keys and their reputation still holds, attributed to the same original address.

2. through re-issuance

```bash
npm run reissuance
```

In this sample, the issuer is treating the user addresses as DIDs (did:ethr)
For users to rotate to a new address, they create a credential claiming ownership and the platform re-mints equivalent
tokens to the new address, burning the old ones.
