import { OnNameLookupHandler, OnRpcRequestHandler } from '@metamask/snaps-sdk';
import { createPublicClient, http, getContract } from 'viem';

// Define the Sonic chain
const sonic = {
  id: 146,
  name: 'Sonic',
  network: 'sonic',
  nativeCurrency: {
    decimals: 18,
    name: 'Sonic',
    symbol: 'S',
  },
  rpcUrls: {
    public: { http: ['https://rpc.soniclabs.com'] },
    default: { http: ['https://rpc.soniclabs.com'] },
  },
};

// SNS Contract Addresses
const SNS_RESOLVER_ADDRESS = '0x90DB11399F3577BeFbF5B8E094BcaD35DA348Fc9';
const SNS_REGISTRAR_ADDRESS = '0xc50DBB6F0BAab19C6D0473B225f7F58e4a2d440b';
const SNS_REGISTRY_ADDRESS = '0x3D9D5ACc7dBACf1662Bc6D1ea8479F88B90b3cfb';

// Simplified Resolver ABI - Only the functions we need
const RESOLVER_ABI = [
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'resolveAddress',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'addr', type: 'address' }],
    name: 'reverseLookup',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'reverseRecords',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  }
];

// Simplified Registry ABI - Only the functions we need
const REGISTRY_ABI = [
  {
    inputs: [{ internalType: 'string', name: '', type: 'string' }],
    name: 'nameToTokenId',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    name: 'tokenIdToName',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  }
];

/**
 * Helper function to add .s TLD if not present
 */
const formatDomainName = (name: string): string => {
  if (!name) return '';
  return name.endsWith('.s') ? name : `${name}.s`;
};

export const onNameLookup: OnNameLookupHandler = async (request: { domain: any; }) => {
  let { domain } = request;

  if (!domain) {
    return null;
  }

  // Validate domain ends with .s
  if (!domain.endsWith('.s')) {
    return null;
  }

  try {
    // Extract the name without the .s extension
    // Your resolver already returns the name without .s
    const name = domain.replace('.s', '');

    // Create a public client
    const client = createPublicClient({
      chain: sonic,
      transport: http(),
    });

    // Create registry contract instance
    const registryContract = getContract({
      address: SNS_REGISTRY_ADDRESS,
      abi: REGISTRY_ABI,
      client,
    });

    // Get tokenId directly from registry using nameToTokenId mapping
    const tokenId = await registryContract.read.nameToTokenId([name]);
    
    // If tokenId is 0, the name doesn't exist
    if (tokenId === 0n) {
      return null;
    }

    // Create resolver contract instance
    const resolverContract = getContract({
      address: SNS_RESOLVER_ADDRESS,
      abi: RESOLVER_ABI,
      client,
    });

    // Call resolveAddress with the tokenId
    const resolvedAddress = await resolverContract.read.resolveAddress([tokenId]);

    if (!resolvedAddress || resolvedAddress === '0x0000000000000000000000000000000000000000') {
      return null;
    }

    // Ensure the domain name always has .s TLD when returning to MetaMask
    return {
      resolvedAddresses: [
        {
          resolvedAddress,
          protocol: 'Sonic Name Service',
          domainName: formatDomainName(domain),
        },
      ],
    };
  } catch (error) {
    console.error('Error resolving SNS name:', error);
    return null;
  }
};

/**
 * Handle RPC requests for additional functionality
 */
export const onRpcRequest: OnRpcRequestHandler = async ({ request }) => {
  switch (request.method) {
    case 'reverseLookup': {
      const { address } = request.params as { address: string };
      
      if (!address || !address.startsWith('0x')) {
        throw new Error('Invalid Ethereum address provided');
      }
      
      try {
        // Create a public client
        const client = createPublicClient({
          chain: sonic, 
          transport: http(),
        });
        
        // Create a contract instance
        const resolverContract = getContract({
          address: SNS_RESOLVER_ADDRESS,
          abi: RESOLVER_ABI,
          client,
        });
        
        // Call the reverseLookup function to get the name
        const name = await resolverContract.read.reverseLookup([address]);
        
        // If no name found, return null
        if (!name) return null;
        
        // Return the name with .s TLD
        return formatDomainName(name);
      } catch (error) {
        console.error('Error performing reverse lookup:', error);
        return null;
      }
    }
    
    case 'getTokenIdForName': {
      const { name } = request.params as { name: string };
      
      if (!name) {
        throw new Error('Name is required');
      }
      
      try {
        // Create a public client
        const client = createPublicClient({
          chain: sonic,
          transport: http(),
        });
        
        // Get tokenId from name via Registry contract
        const registryContract = getContract({
          address: SNS_REGISTRY_ADDRESS,
          abi: REGISTRY_ABI,
          client,
        });
        
        const cleanName = name.replace('.s', '');
        const tokenId = await registryContract.read.nameToTokenId([cleanName]);
        
        // If tokenId is 0, the name doesn't exist
        if (tokenId === 0n) {
          return null;
        }
        
        return { tokenId: tokenId.toString() };
      } catch (error) {
        console.error('Error getting tokenId for name:', error);
        return null;
      }
    }
    
    case 'getNameForTokenId': {
      const { tokenId } = request.params as { tokenId: string };
      
      if (!tokenId) {
        throw new Error('TokenId is required');
      }
      
      try {
        // Create a public client
        const client = createPublicClient({
          chain: sonic,
          transport: http(),
        });
        
        // Get name from tokenId via Registry contract
        const registryContract = getContract({
          address: SNS_REGISTRY_ADDRESS,
          abi: REGISTRY_ABI,
          client,
        });
        
        const name = await registryContract.read.tokenIdToName([BigInt(tokenId)]);
        
        // If name is empty, the tokenId doesn't exist
        if (!name) {
          return null;
        }
        
        return { name: formatDomainName(name) };
      } catch (error) {
        console.error('Error getting name for tokenId:', error);
        return null;
      }
    }
    
    default:
      throw new Error('Method not found');
  }
};