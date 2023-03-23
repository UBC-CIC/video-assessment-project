const AWS = require('aws-sdk');

exports.handler = async (event) => {
    let streamARN  = '';
    let channelARN = '';

    if(!event.streamName | !event.channelName) throw new Error('[ERROR]: incomplete parameters');
    streamName  = event.streamName;
    channelName = event.channelName;

    const KVSClient = new AWS.KinesisVideo({
        region: 'us-west-2',
        endpoint: null,
        correctClockSkew: true
    })

    try{
        const aggregatedResponse = {deleteChannel: {}, deleteStream: {}, configureStorage: {}};

        const configureStorageResponse = await KVSClient.updateMediaStorageConfiguration({
            ChannelARN: channelARN,
            MediaStorageConfiguration: { 
                Status: 'DISABLE',
                StreamARN: streamARN 
            }
        }).promise();
        if(!configureStorageResponse) throw new Error('[ERROR] no reponse from configuring storage');
        aggregatedResponse.configureStorage = configureStorageResponse.Payload;

        const deleteStreamResponse = await KVSClient.deleteStream({
            StreamARN: streamARN
        }).promise();
        if(!deleteStreamResponse) throw new Error('[ERROR] no response from delete stream');
        aggregatedResponse.deleteStream = deleteStreamResponse.Payload;

        const deleteChannelResponse = await KVSClient.deleteSignalingChannel({
            ChannelARN: channelARN
        }).promise();
        if(!deleteChannelResponse) throw new Error('[ERROR] no response from delete channel');
        aggregatedResponse.deleteChannel = deleteChannelResponse.Payload;

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
