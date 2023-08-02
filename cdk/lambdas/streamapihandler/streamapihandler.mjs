import { KinesisVideoClient, CreateSignalingChannelCommand, CreateStreamCommand, UpdateMediaStorageConfigurationCommand } from "@aws-sdk/client-kinesis-video";
import { KinesisVideoWebRTCStorageClient, JoinStorageSessionCommand } from "@aws-sdk/client-kinesis-video-webrtc-storage";

const REGION = process.env.AWS_REGION;

const KVSClient = new KinesisVideoClient({region: REGION});
const KVSWEBRTCClient = new KinesisVideoWebRTCStorageClient({region: REGION});

export const handler = async (event) => {
    

    try{        

    }catch(err){

    }
};

async function allocateStreamResources(streamName, channelName){

    try{
        const createStreamCMD = new CreateStreamCommand({
            StreamName: streamName,
            DataRetentionInHours: 24,
            MediaType: "video/h264,audio/aac"
        });
        const createStreamResp = await KVSClient.send(createStreamCMD);
        const streamARN = createStreamResp.data.streamARN;

        const createChannelCMD = new CreateSignalingChannelCommand({
            ChannelName: channelName,
            ChannelType: "SINGLE_MASTER",
            SingleMasterConfiguration: {MessageTtlSeconds: 60}
        });
        const createChannelResp = await KVSClient.send(createChannelCMD);
        const channelARN = createChannelResp.data.channelARN;

        const updateMediaStorageConfigCMD = new UpdateMediaStorageConfigurationCommand({
            ChannelARN: channelARN,
            MediaStorageConfiguration: {
                StreamARN: streamARN,
                Status: "ENABLED"
            },
        })
        const updateMediaStorageConfigResp = await KVSClient.send(updateMediaStorageConfigCMD);

    }catch(err){
        console.error(err);
    }
}

async function deleteStreamResources(){
    
}

async function joinStream(channelARN){
    try{
        const joinStorageSeshCMD = new JoinStorageSessionCommand({
            channelARN: channelARN
        });
        const joinStorageSeshResp = KVSWEBRTCClient.send(joinStorageSeshCMD);
    }catch(err){

    }

}
