import { beforeAll, describe, expect, it, jest } from '@jest/globals';
import { installSnap } from '@metamask/snaps-jest';

const SONIC_CHAIN_ID = 'eip155:146';
const SAMPLE_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'; // Sample address

// Mock the contract calls
jest.mock('viem', () => {
  // Define mock functions
  const mockResolveAddress = jest.fn((..._args: any[]) => {
    return Promise.resolve(SAMPLE_ADDRESS);
  });
  
  // Mock contract read functions
  const mockContractRead = {
    nameToTokenId: jest.fn((..._args: any[]) => {
      return Promise.resolve(123456n);
    }),
    tokenIdToName: jest.fn((..._args: any[]) => {
      return Promise.resolve('example');
    }),
    resolveAddress: mockResolveAddress,
    reverseLookup: jest.fn((..._args: any[]) => {
      return Promise.resolve('example');
    }),
  };
  
  return {
    createPublicClient: jest.fn().mockReturnValue({}),
    getContract: jest.fn().mockReturnValue({
      read: mockContractRead,
    }),
    http: jest.fn(),
    normalize: jest.fn((input: any) => input),
  };
});

describe('SNS Resolver', () => {
  let snap: any;

  beforeAll(async () => {
    snap = await installSnap();
  });

  describe('Name Lookup', () => {
    it('resolves a domain name to an address', async () => {
      const response = await snap.request({
        method: 'onNameLookup',
        params: {
          domain: 'example.s',
          chainId: SONIC_CHAIN_ID,
        }
      });

      expect(response).toBeTruthy();
      expect(response.resolvedAddresses).toBeDefined();
      expect(response.resolvedAddresses.length).toBeGreaterThan(0);
      expect(response.resolvedAddresses[0].resolvedAddress).toBe(SAMPLE_ADDRESS);
    });

    it('returns null for an invalid domain', async () => {
      const response = await snap.request({
        method: 'onNameLookup',
        params: {
          domain: 'example.com', // Not a .s domain
          chainId: SONIC_CHAIN_ID,
        }
      });

      expect(response).toBeNull();
    });
  });

  describe('RPC Methods', () => {
    it('performs a reverse lookup', async () => {
      const result = await snap.request({
        method: 'onRpcRequest',
        params: {
          request: {
            method: 'reverseLookup',
            params: {
              address: SAMPLE_ADDRESS
            }
          }
        }
      });
      
      expect(result).toBe('example');
    });

    it('gets a tokenId for a name', async () => {
      const result = await snap.request({
        method: 'onRpcRequest',
        params: {
          request: {
            method: 'getTokenIdForName',
            params: {
              name: 'example'
            }
          }
        }
      });
      
      expect(result).toEqual({ tokenId: '123456' });
    });

    it('gets a name for a tokenId', async () => {
      const result = await snap.request({
        method: 'onRpcRequest',
        params: {
          request: {
            method: 'getNameForTokenId',
            params: {
              tokenId: '123456'
            }
          }
        }
      });
      
      expect(result).toEqual({ name: 'example' });
    });

    it('throws an error for unknown method', async () => {
      await expect(
        snap.request({
          method: 'onRpcRequest',
          params: {
            request: {
              method: 'unknownMethod',
              params: {}
            }
          }
        })
      ).rejects.toThrow();
    });
  });
});