declare module 'snarkjs';
declare module 'circomlib';
declare module 'circomlib/src/poseidon.js';
declare module '@zk-kit/incremental-merkle-tree' {
  export class IncrementalMerkleTree {
    constructor(
      hasher: (inputs: bigint[]) => bigint,
      depth: number,
      zeroValue: bigint,
      arity: number
    );
    root: bigint;
    depth: number;
    arity: number;
    zeroValue: bigint;
    leaves: bigint[];
    nodes: Map<number, bigint[]>;
    indexOf(leaf: bigint): number;
    insert(leaf: bigint): void;
    update(index: number, newLeaf: bigint): void;
    createProof(index: number): MerkleProof;
  }

  export interface MerkleProof {
    root: bigint;
    leaf: bigint;
    siblings: bigint[];
    pathIndices: number[];
  }
}

declare module '@zk-kit/identity' {
  export enum Strategy {
    RANDOM,
    MESSAGE
  }

  export class ZkIdentity {
    constructor(strategy: Strategy, payload?: string);
    getSecret(): bigint;
    getNullifier(): bigint;
    getTrapdoor(): bigint;
    genIdentityCommitment(): bigint;
    serialize(): string;
  }
}