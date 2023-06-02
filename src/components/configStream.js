import AWS from 'aws-sdk';
let   config       = require('./config.json');

export async function configureStream(streamName, formValues){
    const KVSClient = new AWS.KinesisVideo({
        region: config.region,
        endpoint: null,
        correctClockSkew: true,
        accessKeyId: formValues.accessKeyId,
        secretAccessKey: formValues.secretAccessKey,
        sessionToken: formValues.sessionToken,
    })

    // const describeStreamResponse = await KVSClient
    //     .describeStream({
    //         StreamName: streamName,
    //     })
    //     .promise();
    // console.log(describeStreamResponse);
    // const streamARN = describeStreamResponse.StreamInfo.StreamARN;

    // console.log("testing describechannel");
    // const describeChannelResponse = await KVSClient
    //     .describeSignalingChannel({
    //         ChannelName: formValues.channelName,
    //     }).promise();
    // console.log(describeChannelResponse);
    // const channelARN = describeChannelResponse.ChannelInfo.ChannelARN;


    // const configureStorageResponse = await KVSClient
    //     .updateMediaStorageConfiguration({
    //         ChannelARN: channelARN,
    //         MediaStorageConfiguration: { 
    //             Status: 'DISABLED',
    //             StreamARN: streamARN
    //         }
    //     }).promise();
    // console.log(configureStorageResponse);

    console.log("testing createsignalingchannel");
    const createChannelResponse = await KVSClient
        .createSignalingChannel({
            ChannelName: formValues.channelName,
            ChannelType: 'SINGLE_MASTER',
            SingleMasterConfiguration: {MessageTtlSeconds: 60}
        })
        .promise();
    console.log(createChannelResponse);

    console.log("testing createStream");
    const createStreamResponse = await KVSClient
        .createStream({
            StreamName: streamName,
            DataRetentionInHours: 24,
            MediaType: "video/h264,audio/aac"
        }).promise();
    console.log(createStreamResponse);

    const describeStreamResponse = await KVSClient
        .describeStream({
            StreamName: streamName,
        })
        .promise();
    console.log(describeStreamResponse);
    const streamARN = describeStreamResponse.StreamInfo.StreamARN;

    console.log("testing describechannel");
    const describeChannelResponse = await KVSClient
        .describeSignalingChannel({
            ChannelName: formValues.channelName,
        }).promise();
    console.log(describeChannelResponse);
    const channelARN = describeChannelResponse.ChannelInfo.ChannelARN;

    const configureStorageResponse = await KVSClient
        .updateMediaStorageConfiguration({
            ChannelARN: channelARN,
            MediaStorageConfiguration: { 
                Status: 'ENABLED',
                StreamARN: streamARN
            }
        }).promise();
    console.log(configureStorageResponse);

    return {StreamARN: streamARN, ChannelARN: channelARN};
}

export async function deleteStream(streamName, formValues){
    const KVSClient2 = new AWS.KinesisVideo({
        region: config.region,
        endpoint: null,
        correctClockSkew: true,
        accessKeyId: formValues.accessKeyId,
        secretAccessKey: formValues.secretAccessKey,
        sessionToken: formValues.sessionToken,
    })

    console.log("trying describestream in deletestream");
    const describeStreamResponse = await KVSClient2
        .describeStream({
            StreamName: streamName,
        })
        .promise();
    console.log(describeStreamResponse);
    const streamARN = describeStreamResponse.StreamInfo.StreamARN;

    console.log("trying describechannel in delete");
    const describeChannelResponse = await KVSClient2
        .describeSignalingChannel({
            ChannelName: formValues.channelName,
        }).promise();
    console.log(describeChannelResponse);
    const channelARN = describeChannelResponse.ChannelInfo.ChannelARN;
    
    console.log("trying configuration in deletestream");
    const configureStorageResponse = await KVSClient2
        .updateMediaStorageConfiguration({
            ChannelARN: channelARN,
            MediaStorageConfiguration: { 
                Status: 'DISABLED',
                StreamARN: streamARN 
            }
        })
        .promise();
    console.log(configureStorageResponse);

    console.log("testing deletestream");
    const deleteStreamResponse = await KVSClient2
        .deleteStream({
            StreamARN: streamARN
        })
        .promise();
    console.log(deleteStreamResponse);

    console.log("testing deletesignalingchannel");
    const deleteChannelResponse = await KVSClient2
        .deleteSignalingChannel({
            ChannelARN: channelARN
        })
        .promise();
    console.log(deleteChannelResponse);
}