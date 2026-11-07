import * as common from "oci-common";
import * as os from "oci-objectstorage";

async function uploadFile(
  objectName: string,
  buffer: Buffer,
  contentType = "application/octet-stream"
) {
  const provider = new common.ConfigFileAuthenticationDetailsProvider();
  const client = new os.ObjectStorageClient({
    authenticationDetailsProvider: provider,
  });

  const namespace = (await client.getNamespace({})).value;

  const putObjectRequest: os.requests.PutObjectRequest = {
    namespaceName: namespace,
    bucketName : process.env.BUCKETNAME || "",
    objectName,
    putObjectBody: buffer,
    contentLength: buffer.length,
    contentType,
  };
    
  const fileUrl = await client.putObject(putObjectRequest).then(() => `https://objectstorage.${process.env.REGION}.oraclecloud.com/n/${namespace}/b/${process.env.BUCKETNAME}/o/${encodeURIComponent(objectName)}`)

  return fileUrl

}

export { uploadFile }