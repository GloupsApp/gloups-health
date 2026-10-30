export interface CurrentAccount {
  readonly account: { readonly id: string };
  readonly user: {
    readonly email: string;
    readonly emailVerified: true;
    readonly name: string;
  };
}
