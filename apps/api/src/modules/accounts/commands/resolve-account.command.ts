export class ResolveAccountCommand {
  readonly proof: string;
  constructor(proof: string) {
    this.proof = proof;
  }
}
