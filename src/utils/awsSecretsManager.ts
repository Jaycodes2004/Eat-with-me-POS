import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

const client = new SecretsManagerClient({ region: "ap-south-1" });

export async function getSecret(secretName: string): Promise<any> {
  const response = await client.send(
    new GetSecretValueCommand({
      SecretId: secretName,
      VersionStage: "AWSCURRENT",
    })
  );
  if (!response.SecretString) throw new Error("SecretString not found");
  return JSON.parse(response.SecretString);
}

// Example usage:
// const creds = await getSecret('rds!db-xxxx');
// creds.username, creds.password, creds.host, creds.port, creds.dbname
