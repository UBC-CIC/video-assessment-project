const AWS = require('aws-sdk');

exports.handler = async (event) => {
    const AccessRole    = 'arn:aws:iam::444889511257:role/service-role/mediaconvert';
    let   UserID        = '';
    let   AssessmentID  = '';
    let   NumOfClips    = 0;
    let   OutputBucket  = 'recording-output';
    let   InputBucket   = 'fragments-raw';
    let   UserMetadata  = {};
    
    if(event.UserID)        UserID         = event.UserID;
    if(event.AssessmentID)  AssessmentID   = event.AssessmentID;
    if(event.NumOfClips)    NumOfClips     = event.NumOfClips;
    if(event.OutputBucket)  OutputBucket   = event.OutputBucket;
    if(event.InputBucket)   InputBucket    = event.InputBucket;
    if(event.UserMetadata)  UserMetadata   = event.UserMetadata;

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
        region: 'us-west-2',
        endpoint: 'https://hvtjrir1c.mediaconvert.us-west-2.amazonaws.com',
        correctClockSkew: null,
    })

    try{
        const inputList = getInputList(InputBucket, NumOfClips, UserID, AssessmentID);
        const convertJobParams = {
            Queue: "arn:aws:mediaconvert:us-west-2:444889511257:queues/Default",
            UserMetadata: UserMetadata,
            Role: AccessRole,
            Settings: {
                TimecodeConfig: {Source: 'ZEROBASED'},
                Inputs: inputList,
                OutputGroups: [{
                    Name: 'File_Group',
                    OutputGroupSettings: {
                        Type: 'FILE_GROUP_SETTINGS',
                        FileGroupSettings: {
                            Destination: `s3://${OutputBucket}/`,
                            // destination settings - security, encryption, etc
                        },
                    },
                    Outputs: [{
                        ContainerSettings: {
                            Container: 'MP4',
                            Mp4Settings: {}
                        },
                        NameModifier: `${UserID}/${AssessmentID}`,
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
            recordingName: `placeholder`,                       //TODO: change this to reflect actual name
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

function getInputList(InputBucket, NumOfClips, UserID, AssessmentID){
    const output = new Array(NumOfClips);

    for(let i=0; i<NumOfClips; i++){
        output[i] = {
            AudioSelectors: {'Audio Selector 1': {DefaultSelection: 'DEFAULT'}},
            TimecodeSource: 'ZEROBASED',
            FileInput: `s3://${InputBucket}/${UserID}/${AssessmentID}-${i}.mp4`,
        }
        console.log(`File ${i}: ${output[i].FileInput}`);
    }
    return output;    
}
