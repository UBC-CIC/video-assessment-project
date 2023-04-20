const AWS = require('aws-sdk');

exports.handler = async (event) => {
    const REGION = process.env.AWS_REGION;
    const BUCKET = process.env.NOT_BLURRED;
    let   key;
    
    if(!event.key) throw new Error('[ERROR] missing key parameters');
    key = event.key;
    
    const S3Client = new AWS.S3({
        region: REGION,
        correctClockSkew: true,
    })

    try{
        const deleteObjResponse = await S3Client
            .deleteObject({
                Bucket: BUCKET,
                Key: key,
            })
            .promise();
            
        const listObjsResp = await S3Client
            .listObjects({
                Bucket: BUCKET
            })
            .promise();
            
        for(const object of listObjsResp.Contents){
            if(object.Key == key) throw new Error('[ERROR] Object still exists in S3');
        }
        return {
            statusCode: 200,
            body: JSON.stringify('[SUCCESS]')
        }
    }catch(err){
        return {
            statusCode: 400,
            body: err
        }
    }
};
