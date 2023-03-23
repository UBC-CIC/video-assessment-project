const AWS = require('aws-sdk');

exports.handler = async (event) => {
    let BucketName = '';
    let ObjectPath = '';

    if(!event.BucketName || !event.ObjectPath) throw new Error('[ERROR]: incomplete parameters')
    BucketName = event.BucketName;
    ObjectPath = event.ObjectPath;

    const S3Client = new AWS.S3({
        region: 'us-west-2',
        correctClockSkew: true
    })

    try{
        const deleteObjResponse = await S3Client.deleteObject({
            Bucket: BucketName, 
            Delete: {
                Objects: [{Key: ObjectPath}], 
                Quiet: false
            }
        }).promise();
        if(!deleteObjResponse) throw new Error('[ERROR]: no reponse from S3');
        console.log(deleteObjResponse);

        return {
            statusCode: 200,
            body: deleteObjResponse
        }
    }catch(err){
        console.error('[ERROR]: ' + err);
        return {
            statusCode: 400, 
            body: err
        };
    }
};
