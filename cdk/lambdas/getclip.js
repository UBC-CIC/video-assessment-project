const AWS = require('aws-sdk');

exports.handler = async(event) => {
    let   StreamARN    = 'arn:aws:kinesisvideo:us-west-2:444889511257:stream/muhan-ingestion-test/1675293375403';
    let   StreamName   = 'muhan-ingestion-test';
    let   BucketName   = 'fragments-raw';
    let   AssessmentID = Math.random().toString(36).substring(6).toUpperCase();
    let   UserID       = Math.random().toString(36).substring(6).toUpperCase();
    let   startTime    = new Date();
    let   endTime      = new Date();
    
    if(!event.startTime || !event.endTime) throw new Error('[ERROR]: missing time parameters');
    startTime = new Date(event.startTime);
    endTime   = new Date(event.endTime);
    console.log('Received endTime: ' + endTime.toISOString());
    console.log('Received startTime: ' + startTime.toISOString());

    if(isNaN(startTime.getTime())) throw new Error('[ERROR]: invalid start time');
    if(isNaN(endTime.getTime()))   throw new Error('[ERROR]: invalid end time');
    
    if(event.StreamARN)    StreamARN     = event.StreamARN;
    if(event.StreamName)   StreamName    = event.StreamName;
    if(event.BucketName)   BucketName    = event.BucketName;
    if(event.AssessmentID) AssessmentID  = event.AssessmentID;
    if(event.UserID)       UserID        = event.UserID;

    const KVSClient = new AWS.KinesisVideo({
        region: 'us-west-2',
        endpoint: null,
        correctClockSkew: true,
    })

    const KVSArchiveClient = new AWS.KinesisVideoArchivedMedia({
        region: 'us-west-2',
        endpoint: null,
        correctClockSkew: true,
    })
    
    const S3Client = new AWS.S3({
        region: 'us-west-2',
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

            const putObjResponse = await S3Client.putObject({
                Body: clip.Payload,
                Bucket: BucketName,
                Key: `${UserID}/${AssessmentID}-${i}.mp4`
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
