const AWS = require('aws-sdk');

exports.handler = async (event) => {
    const AccessRole    = process.env.MEDIACONVERT_ACCESSROLE;
    const OutputBucket  = process.env.NOTBLURRED_BUCKET;
    const InputBucket   = process.env.CLIPS_BUCKET;
    const AWSRegion     = process.env.AWS_REGION;
    const QueueARN      = process.env.MEDIACONVERT_QUEUE;
    let   UserID        = 'NOT_SET';
    let   AssessmentID  = 'NOT_SET';
    let   NumOfClips    = 0;
    let   UserMetadata  = {};
    let   RecordingName = '';
    
    if(event.UserID)        UserID        = event.UserID;
    if(event.AssessmentID)  AssessmentID  = event.AssessmentID;
    if(event.NumOfClips)    NumOfClips    = event.NumOfClips;
    if(event.UserMetadata)  UserMetadata  = event.UserMetadata;
    if(event.RecordingName) RecordingName = event.RecordingName;

    const Outputs_VideoDescription = {
        CodecSettings: {
            Codec: 'H_264',
            H264Settings: {
                ParNumerator: 1,
                ParDenominator: 1,
                ParControl: 'SPECIFIED',
                FramerateControl: 'SPECIFIED',
                FramerateNumerator: 24,
                FramerateDenominator: 1,
                MaxBitrate: 5000000,
                RateControlMode: 'QVBR',
                SceneChangeDetect: 'TRANSITION_DETECTION',
            },
        }
    };

    const Outputs_AudioDescription = {
        CodecSettings: {
            Codec: 'AAC',
            AacSettings:{
                Bitrate: 96000,
                CodingMode: 'CODING_MODE_2_0',
                SampleRate: 48000
            }
        }
    };

    const MediaConvertClient = new AWS.MediaConvert({
        region: AWSRegion,
        correctClockSkew: null,
    })

    try{
        const mediaconvertEndpoint = await MediaConvertClient.describeEndpoints({
            MaxResults: 1,
        }).promise();
        console.log(mediaconvertEndpoint);
        MediaConvertClient.endpoint = mediaconvertEndpoint.Endpoints.Url;

        const inputList = getInputList(InputBucket, NumOfClips, UserID, AssessmentID, RecordingName);
        const convertJobParams = {
            Queue: QueueARN,
            UserMetadata: UserMetadata,
            Role: AccessRole,
            Settings: {
                TimecodeConfig: {Source: 'ZEROBASED'},
                Inputs: inputList,
                OutputGroups: [{
                    Name: 'File_Group',
                    OutputGroupSettings: {
                        Type: 'FILE_GROUP_SETTINGS',
                        FileGroupSettings: {Destination: `s3://${OutputBucket}/${UserID}/`,},
                    },
                    Outputs: [{
                        ContainerSettings: {
                            Container: 'MP4',
                            Mp4Settings: {}
                        },
                        VideoDescription: Outputs_VideoDescription,
                        AudioDescriptions: [Outputs_AudioDescription],
                        Extension: 'mp4',
                    }]
                }]
            },
            AccelerationSettings: {Mode: 'DISABLED'},
            StatusUpdateInterval: 'SECONDS_60',
            Priority: 0,
        }

        const createJobResponse = await MediaConvertClient.createJob(convertJobParams).promise();
        if(!createJobResponse) throw new Error('[ERROR]: No response from mediaconvert');
        console.log('[SUCCESS]: Response from mediaconvert: ');
        console.log(createJobResponse);

        return {statusCode: 200, body: JSON.stringify({
            message: '[SUCCESS]: Recording uploaded to S3',
            recordingName: RecordingName,                      
            mediaConvertResponse: createJobResponse
        })};
    }catch(err){
        console.error('[FAIL]: runtime error' + err);
        return {statusCode: 400, body: JSON.stringify({
            message: '[ERROR]: Runtime error',
            error: err,
            stack: err.stack
        })};
    }
};

function getInputList(InputBucket, NumOfClips, UserID, AssessmentID, RecordingName){
    const output = new Array(NumOfClips);

    for(let i=0; i<NumOfClips; i++){
        let clipName = (i==0) ? `s3://${InputBucket}/${RecordingName}` : `s3://${InputBucket}/${UserID}/${AssessmentID}-${i}.mp4`
        output[i] = {
            AudioSelectors: {'Audio Selector 1': {DefaultSelection: 'DEFAULT'}},
            TimecodeSource: 'ZEROBASED',
            FileInput: clipName,
        }
        console.log(`File ${i}: ${output[i].FileInput}`);
    }
    return output;    
}
