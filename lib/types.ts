export interface TokenPayload {
  sub: string;
  email?: string;
  [k: string]: unknown;
}
