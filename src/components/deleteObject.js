const AWS = require('aws-sdk');

export async function deleteObject(bucketName, objectKey, formValues){
    const S3Client = new AWS.S3({
        region: 'us-west-2',
        correctClockSkew: true,
        accessKeyID: formValues.accessKeyID,
        secretAccessKey: formValues.secretAccessKey,
    })

    const deleteObjResponse = await S3Client
        .deleteObject({
            Bucket: bucketName,
            Delete: {
                Objects: [{Key: objectKey}],
                Quiet: false
            }
        })
        .promise();
    console.log(deleteObjResponse);
}
