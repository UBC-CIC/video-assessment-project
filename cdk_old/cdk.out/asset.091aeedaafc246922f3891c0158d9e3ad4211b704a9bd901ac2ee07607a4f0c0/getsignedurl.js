const AWS = require('aws-sdk');

exports.handler = async(event) => {
    const   Bucket    = process.env.BLURRED_BUCKET;
    const   AWSRegion = process.env.AWS_REGION;
    let     Key;

    if(!event.key) throw new Error('[ERROR] missing key parameter');
    Key = event.key;
    
    const S3Client = new AWS.S3({
        region: AWSRegion,
        correctClockSkew: true,
    })

    try{
        const signedURL = S3Client.getSignedURL('getObject', {
            Bucket: Bucket,
            Key: Key,
            Expires: 300
        })
        
        return {
            statusCode: 200, 
            body: {
                signedURL: signedURL
            }
        };
    }catch(err){
        console.error('[FAIL]: ' + err);
        return {
            statusCode: 400, 
            body: err
        };
    }
}
