# sns-resolution-snap

This repo includes the npm package to install as a snap on MetaMask to resolve SNS - Sonic Name Service.

## Overview

The Sonic Name Service (SNS) is a naming system for the Sonic chain (ID: 146) that allows users to register human-readable names (e.g., `name.s`) that resolve to Ethereum addresses. SNS is implemented as an ERC721 NFT, with each name represented by a unique tokenId.

This MetaMask Snap enables name resolution for SNS names directly within MetaMask, allowing users to:

- Type `.s` domains directly into MetaMask's address field
- Have the addresses automatically resolved to the correct Ethereum address
- Use SNS names for sending transactions and interacting with dApps

## Features

- Resolves `.s` domain names to Ethereum addresses
- Performs reverse lookup to get SNS names from addresses
- Works on the Sonic chain (ID: 146)
- Seamlessly integrates with MetaMask's interface
- Provides additional RPC methods for dApps to interact with

## RPC Methods

The snap exposes the following RPC methods for dApps to use:

1. **reverseLookup** - Get the SNS name for a given address
   ```javascript
   const name = await ethereum.request({
     method: 'wallet_invokeSnap',
     params: {
       snapId: 'npm:sonic_resolver',
       request: {
         method: 'reverseLookup',
         params: {
           address: '0x123...'
         }
       }
     }
   });
   ```

2. **getTokenIdForName** - Get the tokenId for a given SNS name
   ```javascript
   const result = await ethereum.request({
     method: 'wallet_invokeSnap',
     params: {
       snapId: 'npm:sonic_resolver',
       request: {
         method: 'getTokenIdForName',
         params: {
           name: 'example.s'
         }
       }
     }
   });
   console.log(result.tokenId);
   ```

3. **getNameForTokenId** - Get the SNS name for a given tokenId
   ```javascript
   const result = await ethereum.request({
     method: 'wallet_invokeSnap',
     params: {
       snapId: 'npm:sonic_resolver',
       request: {
         method: 'getNameForTokenId',
         params: {
           tokenId: '123456'
         }
       }
     }
   });
   console.log(result.name);
   ```

## Contract Addresses

- Resolver: `0x90DB11399F3577BeFbF5B8E094BcaD35DA348Fc9`
- Registrar: `0xc50DBB6F0BAab19C6D0473B225f7F58e4a2d440b`
- Registry: `0x3D9D5ACc7dBACf1662Bc6D1ea8479F88B90b3cfb`

## Installation

Once published, you can install the Snap from:

```
https://snaps.metamask.io/snap/npm/sonic-resolver/
```

## Development

```bash
yarn install
```

## Build

```bash
yarn build
```

## Serve

To run the Snap locally for testing:

```bash
yarn serve
```