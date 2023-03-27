import AWS from 'aws-sdk';

export async function configureStream(streamName, formValues){
    const KVSClient = new AWS.KinesisVideo({
        region: 'us-west-2',
        endpoint: null,
        correctClockSkew: true,
        accessKeyId: formValues.accessKeyId,
        secretAccessKey: formValues.secretAccessKey,
    })

    const createChannelResponse = await KVSClient
        .createSignalingChannel({
            ChannelName: formValues.channelName,
            ChannelType: 'SINGLE_MASTER',
            SingleMasterConfiguration: {MessageTtlSeconds: 60}
        })
        .promise();
    console.log(createChannelResponse);

    const describeChannelResponse = await KVSClient
        .describeSignalingChannel({
            ChannelName: formValues.channelName,
        }).promise();
    console.log(describeChannelResponse);
    const channelARN = describeChannelResponse.ChannelInfo.ChannelARN;

    const createStreamResponse = await KVSClient
        .createStream({
            StreamName: streamName,
            DataRetentionInHours: 24,
            MediaType: "video/h264,audio/aac"
        }).promise();
    console.log(createStreamResponse);

    const describeStreamResponse = await KVSClient
        .describeStream({
            streamName: streamName,
        })
        .promise();
    console.log(describeStreamResponse);
    const streamARN = describeStreamResponse.StreamInfo.StreamARN;

    const configureStorageResponse = await KVSClient
        .updateMediaStorageConfiguration({
            ChannelARN: channelARN,
            MediaStorageConfiguration: { 
                Status: 'ENABLE',
                StreamARN: streamARN
            }
        }).promise();
    console.log(configureStorageResponse);

    return {StreamARN: streamARN, ChannelARN: channelARN};
}

export async function deleteStream(streamARN, channelARN, formValues){
    const KVSClient = new AWS.KinesisVideo({
        region: 'us-west-2',
        endpoint: null,
        correctClockSkew: true,
        accessKeyId: formValues.accessKeyId,
        secretAccessKey: formValues.secretAccessKey,
    })

    const configureStorageResponse = await KVSClient
        .updateMediaStorageConfiguration({
            ChannelARN: channelARN,
            MediaStorageConfiguration: { 
                Status: 'DISABLE',
                StreamARN: streamARN 
            }
        })
        .promise();
    console.log(configureStorageResponse);

    const deleteStreamResponse = await KVSClient
        .deleteStream({
            StreamARN: streamARN
        })
        .promise();
    console.log(deleteStreamResponse);

    const deleteChannelResponse = await KVSClient
        .deleteSignalingChannel({
            ChannelARN: channelARN
        })
        .promise();
    console.log(deleteChannelResponse);
}