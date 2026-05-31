import Retell from "retell-sdk";

if (!process.env.RETELL_API_KEY) {
  throw new Error("Missing RETELL_API_KEY environment variable.");
}

const retellClient = new Retell({
  apiKey: process.env.RETELL_API_KEY,
});

export default retellClient;
