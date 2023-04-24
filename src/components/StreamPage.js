import * as React from 'react';
import { useState } from 'react';
import { startMaster, stopMaster, master }from '../master';
import { stopViewer } from '../viewer';
import AWS from 'aws-sdk';
import * as KVSWebRTC from 'amazon-kinesis-video-streams-webrtc';
import { Auth } from 'aws-amplify';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { Stream } from '@mui/icons-material';
import { createSignalingChannel } from '../createSignalingChannel.js';

let   ROLE          = null; // Possible values: 'master', 'viewer', null

const REGION        = "us-west-2";
const TRICKLEICE    = true;
const WIDESCREEN    = true;
const SENDVID       = true;
const SENDAUD       = true;
const DATACHANNEL   = false;
const FORCETURN     = false;
const NATDISABLE    = false;
const drawerWidth   = 240;

let   startTime     = new Date().toISOString();
let   endTime       = new Date().toISOString();

let   AssessmentID  = Math.random().toString(36).substring(6).toUpperCase();

class StreamPage extends React.Component {
  render () {
    return <Box sx={{ display: 'flex' }}>
        <Box
          component="main"
          sx={{ flexGrow: 1, bgcolor: 'background.default' }}
        >
        <br/>
        <br/>
        <br/>
          <br/>
          <div id="master" className="d-none">
              <div className="row">
                  <div className="col">
                      <div className="video-container">
                        <video className="local-view" autoPlay playsInline controls muted width="640" height="360"/>
                      </div>
                  </div>
              </div>
          </div>
          <div className="card">
          <div style = {{alignItems: 'flex-right'}}>
            <Button variant="outlined" onClick={masterClick} id="master-button" type="button" className="btn btn-primary">Start Stream</Button>
            <Button variant="outlined" onClick={onStop} id="stop-master-button" type="button" className="btn btn-primary">Stop Stream and Recording</Button>
            {/* <Button variant="outlined" >Review Recording</Button> */}
            <Button variant="outlined" onClick={startRecording} id="start-recording" type="button" className="btn btn-primary">Start Recording</Button>
            <Button variant="outlined" onClick={saveRecording} id="save-recording" type="button" className="btn btn=primary">Save Recording</Button>
          </div>
        </div>  
        </Box>
      </Box>
    
  }
}

function getRandomClientId() {
  return Math.random()
      .toString(36)
      .substring(2)
      .toUpperCase();
}

async function getFormValues() {
  const credentials = await Auth.currentCredentials();
  const user = await Auth.currentAuthenticatedUser();
  // console.log(credentials.sessionToken);
  // console.log(credentials);
  
  // AWS.config.credentials = credentials;

  return {
      region: REGION, 
      channelName: user.attributes.sub, 
      clientId: getRandomClientId(),
      sendVideo: SENDVID,
      sendAudio: SENDAUD,
      openDataChannel: DATACHANNEL,
      widescreen: WIDESCREEN,
      fullscreen: !WIDESCREEN,
      useTrickleICE: TRICKLEICE,
      natTraversalDisabled: NATDISABLE,
      forceTURN: FORCETURN,
      accessKeyId: credentials.accessKeyId,
      // endpoint: $('#endpoint').val() || null,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken,
  };
}


// function toggleDataChannelElements() {
//   if (getFormValues().openDataChannel) {
//       '.datachannel'.removeClass('d-none');
//   } else {
//       '.datachannel'.addClass('d-none');
//   }
// }

function onStatsReport(report) {
  // TODO: Publish stats
}

function onStop() {
  if (!ROLE) {
      return;
  }

  if (ROLE === 'master') {
      stopMaster();
  } else {
      stopViewer();
  }

  ROLE = null;
}

window.addEventListener('beforeunload', onStop);

window.addEventListener('error', function(event) {
  console.error(event.message);
  event.preventDefault();
});

window.addEventListener('unhandledrejection', function(event) {
  console.error(event.reason.toString());
  event.preventDefault();
});

async function masterClick() {
  ROLE = 'master';

  const localView = document.getElementsByClassName('local-view')[0]; // '#master .local-view'[0];
  const remoteView = 0;//'#master .remote-view'[0];
  const localMessage = '';//#master .local-message'[0];
  const remoteMessage = '';//#master .remote-message'[0];
  const formValues = await getFormValues();

  console.log(formValues.accessKeyId);
  console.log(formValues.secretAccessKey);

  // remoteMessage = '';
  // localMessage.value = '';
  // toggleDataChannelElements();

  createSignalingChannel(formValues);

  await new Promise(r => setTimeout(r, 1000)); //sleep 1 second
  
  startMaster(localView, remoteView, formValues, onStatsReport, event => {
      remoteMessage.append(`${event.data}\n`);
  });
};

async function startRecording(){
  const formValues = await getFormValues();
  let getSignalingChannelEndpointResponse;
  try {
    // Get signaling channel endpoints for WEBRTC
    getSignalingChannelEndpointResponse = await master.kinesisVideoClient
      .getSignalingChannelEndpoint({
          ChannelARN: master.channelARN,
          SingleMasterChannelEndpointConfiguration: {
              Protocols: ['WEBRTC'],
              Role: KVSWebRTC.Role.MASTER,
          },
      })
      .promise();
  } catch (e) {
    console.error('[MASTER] Storage Session is not configured for this channel');
    return;
  }

  // Fetch webrtc endpoint
  const endpointsByProtocol = getSignalingChannelEndpointResponse.ResourceEndpointList.reduce((endpoints, endpoint) => {
    endpoints[endpoint.Protocol] = endpoint.ResourceEndpoint;
    return endpoints;
  }, {});

  console.log('[MASTER] Received webrtc endpoint: ' + endpointsByProtocol.WEBRTC);

  // TODO: Remove sigv4 signing logic once changes are added to the KinesisVideoClient
  const endpoint = new AWS.Endpoint(endpointsByProtocol.WEBRTC);
  const request = new AWS.HttpRequest(endpoint, formValues.region);

  request.method = 'POST';
  request.path = '/joinStorageSession';
  request.body = JSON.stringify({
    "channelArn": master.channelARN
  });
  request.headers['Host'] = endpoint.host;

  const signer = new AWS.Signers.V4(request, 'kinesisvideo', true);
  signer.addAuthorization({
    accessKeyId: formValues.accessKeyId,
    secretAccessKey: formValues.secretAccessKey,
    sessionToken: null,
  }, new Date());

  startTime = new Date().toISOString();

  const response = await fetch(endpointsByProtocol.WEBRTC + request.path, {
    method: request.method,
    headers: {
        'Content-Type': 'application/json',
        ...request.headers
    },
    body: request.body})
  .then((response) => {
    return new Promise((resolve) => response.json()
        .then((json) => resolve({
            status: response.status,
            ok: response.ok,
            json,
        })));
  })
  .then(({ status, json, ok }) => {
      if (!ok) {
          console.log('[MASTER] Error occured while calling join session: ', json);
      } else {
          console.log('[MASTER] Successfully called join session.');
          startTime = new Date().toISOString();
          console.log(startTime);
      }
  })
  .catch((error) => {
      console.error('[MASTER] Error occured while calling join session:', error);
  });
  console.log(response);
}

async function saveRecording(){
  const formValues = await getFormValues();
  const UserID = await Auth.currentUserInfo().attributes.sub;

  const lambdaClient = new AWS.Lambda({
    region: 'us-west-2',
    accessKeyId: formValues.accessKeyId,
    secretAccessKey: formValues.secretAccessKey // TODO: replace with IAM role permissions
  });
  endTime = new Date().toISOString();
  console.log('endTime = ' + endTime);

  try{
    const getClipPayload = {
      StreamARN: 'arn:aws:kinesisvideo:us-west-2:444889511257:stream/michael-testing/1677783281493',
      BucketName: 'fragments-raw',
      startTime: startTime,
      endTime: endTime,
      UserID: UserID,
      AssessmentID: AssessmentID
    }
    console.log(getClipPayload);
    const clipResponse = await lambdaClient.invoke({
      FunctionName: 'arn:aws:lambda:us-west-2:444889511257:function:getclip-sdkv2',
      InvocationType: 'RequestResponse',
      LogType: 'Tail',
      Payload: JSON.stringify(getClipPayload)
    }).promise();
    if(!clipResponse) throw new Error('no response from getclip');
    let clipResponseBody = JSON.parse(clipResponse.Payload).body;
    console.log(clipResponseBody);

    const mp4StitchPayload = {
      UserID: UserID,
      AssessmentID: AssessmentID,
      NumOfClips: clipResponseBody.fragmentcount,
      OutputBucket: 'recording-output',
      InputBucket: clipResponseBody.destination,
    }
    const recordingResponse = await lambdaClient.invoke({
      FunctionName: 'arn:aws:lambda:us-west-2:444889511257:function:mp3stitch-mediaconvert',
      InvocationType: 'RequestResponse',
      LogType: 'Tail',
      Payload: JSON.stringify(mp4StitchPayload)
    }).promise();
    if(!recordingResponse) throw new Error('no response from mp4stitch');
    let recordingResponseBody = JSON.parse(recordingResponse.Payload).body;
    const temp = JSON.parse(recordingResponseBody);
    console.log(temp);
    console.log(temp.stack);
    
  }catch(err){
    console.log('ERROR');
    console.error(err);
  }
}

export default StreamPage;