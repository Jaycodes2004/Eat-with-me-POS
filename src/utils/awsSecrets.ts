
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
const ssm = new SSMClient({ region: "ap-south-1" });
const secretsManager = new SecretsManagerClient({ region: "ap-south-1" });

export async function getParameter(name: string) {
  const cmd = new GetParameterCommand({ Name: name, WithDecryption: true });
  const res = await ssm.send(cmd);
  if (!res.Parameter || res.Parameter.Value === undefined) {
    throw new Error(`Parameter '${name}' not found or has no value.`);
  }
  return res.Parameter.Value;
}

export async function getSecret(secretId: string) {
  const cmd = new GetSecretValueCommand({ SecretId: secretId });
  const res = await secretsManager.send(cmd);
  if (!res.SecretString) {
    throw new Error(`Secret '${secretId}' not found or has no value.`);
  }
  return JSON.parse(res.SecretString);
}

// OPTIONAL: preload multiple secrets for efficiency
export async function preloadSecrets(names: string[]) {
  const result: Record<string, string> = {};
  for (const name of names) {
    result[name] = await getParameter(name);
  }
  return result;
}
