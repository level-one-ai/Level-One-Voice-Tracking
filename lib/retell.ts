import Retell from "retell-sdk";

let _client: Retell | null = null;

export function getRetellClient(): Retell {
  if (_client) return _client;
  if (!process.env.RETELL_API_KEY) {
    throw new Error("Missing RETELL_API_KEY environment variable.");
  }
  _client = new Retell({ apiKey: process.env.RETELL_API_KEY });
  return _client;
}
