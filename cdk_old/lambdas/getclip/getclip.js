const AWS = require('aws-sdk');

exports.handler = async(event) => {
    const   BucketName   = process.env.CLIPS_BUCKET;
    const   AWSRegion    = process.env.AWS_REGION;
    let     AssessmentID = Math.random().toString(36).substring(6).toUpperCase();
    let     UserID       = Math.random().toString(36).substring(6).toUpperCase();
    let     StreamARN;
    let     startTime;
    let     endTime;
    
    if(!event.startTime || !event.endTime) throw new Error('[ERROR]: missing time parameters');
    startTime = new Date(event.startTime);
    endTime   = new Date(event.endTime);
    if(isNaN(startTime.getTime())) throw new Error('[ERROR]: invalid start time');
    if(isNaN(endTime.getTime()))   throw new Error('[ERROR]: invalid end time');
    console.log('Received endTime: ' + endTime.toISOString());
    console.log('Received startTime: ' + startTime.toISOString());
    
    if(!event.StreamARN) throw new Error('[ERROR]: no StreamARN in input parameters');
    StreamARN = event.StreamARN;

    if(event.AssessmentID) AssessmentID  = event.AssessmentID;
    if(event.UserID)       UserID        = event.UserID;

    const KVSClient = new AWS.KinesisVideo({
        region: AWSRegion,
        endpoint: null,
        correctClockSkew: true,
    })

    const KVSArchiveClient = new AWS.KinesisVideoArchivedMedia({
        region: AWSRegion,
        endpoint: null,
        correctClockSkew: true,
    })
    
    const S3Client = new AWS.S3({
        region: AWSRegion,
        correctClockSkew: true,
    })

    try{
        const getClipEndpoint = await KVSClient.getDataEndpoint({
            APIName: 'GET_CLIP', StreamARN: StreamARN
        }).promise();
        if(!getClipEndpoint) throw new Error('[ERROR]: failed to get endpoint');
        console.log('[SUCCESS] Endpoint: ' + getClipEndpoint.DataEndpoint);
        KVSArchiveClient.endpoint = getClipEndpoint.DataEndpoint;

        const minutesDifference = Math.ceil(Math.abs(endTime - startTime)/1000/60);
        console.log('Minutes diff: ' + minutesDifference);
        let currTime = startTime;
        let nextTime = new Date(currTime.getTime() + 60*1000);
        
        for(let i=0; i<minutesDifference; i++){
            if(nextTime > endTime) nextTime = endTime;

            const clip = await KVSArchiveClient.getClip({
                ClipFragmentSelector: {
                    FragmentSelectorType: 'SERVER_TIMESTAMP',
                    TimestampRange: {EndTimestamp: nextTime, StartTimestamp: currTime}},
                StreamARN: StreamARN
            }).promise();
            if(!clip) throw new Error('[ERROR]: failed to get clip');
            console.log('[SUCCESS]: ');
            console.log(clip.Payload);
            
            let startTimeInt = new Date(startTime).getTime();
            let clipName = (i==0) ? `${UserID}/${AssessmentID}-${startTimeInt}.mp4` : `${UserID}/${AssessmentID}-${startTimeInt}-${i}.mp4`;

            const putObjResponse = await S3Client.putObject({
                Body: clip.Payload,
                Bucket: BucketName,
                Key: clipName
            }).promise();
            if(!putObjResponse) throw new Error('[ERROR]: no response');
            console.log(`[SUCCESS] Loop ${i} Response from S3: `); 
            console.log(putObjResponse);
            
            currTime = nextTime;
            nextTime = new Date(currTime.getTime() + 60*1000);
        }
        
        return {
            statusCode: 200, 
            body: {
                message:       '[SUCCESS]: Fragments uploaded to S3',
                fragmentcount: minutesDifference,
                destination:   BucketName
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
