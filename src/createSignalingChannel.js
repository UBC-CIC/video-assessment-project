/**
 * Took this from the example app
 * To my understanding: the signaling channel allows communication between the master and all the viewer clients
 *                      in the case of video-assessment project, the only viewer is the client, and the master is in the backend
 *                      the master is connected to Kinesis Video Stream, which then stores the stream in S3
 */

async function createSignalingChannel(formValues) {
    // Create KVS client
    const kinesisVideoClient = new AWS.KinesisVideo({
        region: formValues.region,
        accessKeyId: formValues.accessKeyId,
        secretAccessKey: formValues.secretAccessKey,
        sessionToken: formValues.sessionToken,
        endpoint: formValues.endpoint,
    });

    // Get signaling channel ARN
    await kinesisVideoClient
        .createSignalingChannel({
            ChannelName: formValues.channelName,
        })
        .promise();

    // Get signaling channel ARN
    const describeSignalingChannelResponse = await kinesisVideoClient
        .describeSignalingChannel({
            ChannelName: formValues.channelName,
        })
        .promise();
    const channelARN = describeSignalingChannelResponse.ChannelInfo.ChannelARN;
    console.log('[CREATE_SIGNALING_CHANNEL] Channel ARN: ', channelARN);
}