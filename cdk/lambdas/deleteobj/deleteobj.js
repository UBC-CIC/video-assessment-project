const AWS = require('aws-sdk');

exports.handler = async (event) => {
    const REGION            = process.env.AWS_REGION;
    const NOTBLURRED_BUCKET = process.env.AWAITBLUR_BUCKET;
    const CLIPS_BUCKET      = process.env.CLIPS_BUCKET;
    let   key;
    
    if(!event.key) throw new Error('[ERROR] missing key parameters');
    key = event.key;
    let userid       = key.split(/[^a-zA-Z0-9]/)[0];
    let assessmentid = key.split(/[^a-zA-Z0-9]/)[1];
    
    const S3Client = new AWS.S3({
        region: REGION,
        correctClockSkew: true,
    })

    try{
        const deleteObjResp = await S3Client
            .deleteObject({
                Bucket: NOTBLURRED_BUCKET,
                Key: key,
            })
            .promise();

        const listClips = await S3Client
        .listObjects({
            Bucket: CLIPS_BUCKET
        })
        .promise();
            
        const clipsToDelete = listClips.Contents.filter(clip => clip.Key.includes(`${userid}/${assessmentid}`));
        for(const clip of clipsToDelete){
            const deleteClipResp = await S3Client
                .deleteObject({
                    Bucket: CLIPS_BUCKET,
                    Key: clip.Key
                })
                .promise();
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
