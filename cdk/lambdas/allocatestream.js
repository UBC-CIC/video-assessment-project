const AWS = require('aws-sdk');

exports.handler = async (event) => {
    let streamName  = '';
    let channelName = '';

    if(!event.streamName | !event.channelName) throw new Error('[ERROR]: incomplete parameters');
    streamName  = event.streamName;
    channelName = event.channelName;

    const KVSClient = new AWS.KinesisVideo({
        region: 'us-west-2',
        endpoint: null,
        correctClockSkew: true
    })

    try{
        const aggregatedResponse = {createChannel: {}, createStream: {}, configureStorage: {}};

        const createChannelResponse = await KVSClient.createSignalingChannel({
            ChannelName: channelName,
            ChannelType: 'SINGLE_MASTER',
            SingleMasterConfiguration: {MessageTtlSeconds: 60},
        }).promise();
        if(!createChannelResponse) throw new Error('[ERROR]: no response from creating channel');
        aggregatedResponse.createChannel = createChannelResponse.Payload;

        const createStreamResponse = await KVSClient.createStream({
            StreamName: streamName,
            DataRetentionInHours: 24,
            MediaType: "video/h264,audio/aac"
        }).promise();
        if(!createStreamResponse) throw new Error('[ERROR] no response from creating stream');
        aggregatedResponse.createStream = createStreamResponse.Payload;

        const configureStorageResponse = await KVSClient.updateMediaStorageConfiguration({
            ChannelARN: 'PLACEHOLDER',
            MediaStorageConfiguration: { 
                Status: 'ENABLE',
                StreamARN: 'PLACEHOLDER' //TODO: change placeholder to reflect information
            }
        }).promise();
        if(!configureStorageResponse) throw new Error('[ERROR] no reponse from configuring storage');
        aggregatedResponse.configureStorage = configureStorageResponse.Payload;

        return {
            statusCode: 200,
            body: aggregatedResponse
        }
    }catch(err){
        console.error('[ERROR]: ' + err);
        return {
            statusCode: 400, 
            body: err
        };
    }
};
