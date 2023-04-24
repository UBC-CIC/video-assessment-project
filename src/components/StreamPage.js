import * as React from 'react';
import { useState } from 'react';
import { startMaster, stopMaster, master, joinSession }from './master';
import { stopViewer } from './viewer';
import { configureStream, deleteStream} from './configStream.js';
import AWS from 'aws-sdk';
import * as KVSWebRTC from 'amazon-kinesis-video-streams-webrtc';
import { Auth } from 'aws-amplify';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { Stream } from '@mui/icons-material';
import { createSignalingChannel } from '../createSignalingChannel.js';

let   ROLE          = null; // Possible values: 'master', 'viewer', null
let   config        = require('./config.json');

const REGION        = config.region;
const GETCLIP_ARN   = config.getclip;
const MP4STTICH_ARN = config.mp4stitch;
const drawerWidth   = 240;

let   startTime     = new Date().toISOString();
let   endTime       = new Date().toISOString();
let   streamARN;
let   channelARN;

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
      sendVideo: true,
      sendAudio: true,
      openDataChannel: false,
      widescreen: true,
      fullscreen: false,
      useTrickleICE: true,
      natTraversalDisabled: false,
      forceTURN: false,
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

  // createSignalingChannel(formValues);
  const arnResp = await configureStream(`${formValues.channelName}-stream`, formValues);
  streamARN = arnResp.StreamARN;
  channelARN = arnResp.ChannelARN;

  await new Promise(r => setTimeout(r, 1000)); //sleep 1 second
  
  startMaster(localView, remoteView, formValues, onStatsReport, event => {
      remoteMessage.append(`${event.data}\n`);
  });

  await new Promise(r => setTimeout(r, 3000));

  console.log('Calling join session');
  joinSession(formValues);
};

async function startRecording(){
  startTime = new Date().toISOString();
  console.log('Start time: ' + startTime);
}

async function saveRecording(){
  const formValues   = await getFormValues();
  const UserID       = await Auth.currentUserInfo().attributes.sub;
  let   AssessmentID = Math.random().toString(36).substring(6).toUpperCase();

  endTime = new Date().toISOString();

  const lambdaClient = new AWS.Lambda({
    region: REGION,
    accessKeyId: formValues.accessKeyId,
    secretAccessKey: formValues.secretAccessKey
  });
  const blurSelector = true; // CHANGE THIS TO BE TOGGLED BY ELEMENT ON SCREEN

  try{
    const getClipPayload = {
      StreamARN: streamARN,
      // BucketName: 'fragments-raw',
      startTime: startTime,
      endTime: endTime,
      UserID: UserID,
      AssessmentID: AssessmentID
    }
    console.log(getClipPayload);
    const clipResponse = await lambdaClient.invoke({
      FunctionName: GETCLIP_ARN, //'arn:aws:lambda:us-west-2:444889511257:function:getclip-sdkv2',
      InvocationType: 'RequestResponse',
      LogType: 'Tail',
      Payload: JSON.stringify(getClipPayload)
    }).promise();
    if(!clipResponse) throw new Error('no response from getclip');
    console.log('get clip response: ');
    let clipResponseInfo = JSON.parse(clipResponse.Payload).body;
    console.log(clipResponseInfo);

    let startTimeInt = new Date(startTime).getTime();
    const mp4StitchPayload = {
      UserID: UserID,
      AssessmentID: AssessmentID,
      NumOfClips: clipResponseInfo.fragmentcount,
      UserMetadata: {UserID: UserID, AssessmentID: AssessmentID},
      RecordingName: `${UserID}/${AssessmentID}-${startTimeInt}.mp4`,
      Blur: blurSelector
    }
    const recordingResponse = await lambdaClient.invoke({
      FunctionName: MP4STTICH_ARN, //'arn:aws:lambda:us-west-2:444889511257:function:mp3stitch-mediaconvert',
      InvocationType: 'RequestResponse',
      LogType: 'Tail',
      Payload: JSON.stringify(mp4StitchPayload)
    }).promise();
    if(!recordingResponse) throw new Error('no response from mp4stitch');
    console.log('mp4stitch response');
    let recordingResponseInfo = JSON.parse(JSON.parse(recordingResponse.Payload).body);
    console.log(recordingResponseInfo);
    
  }catch(err){
    console.log('ERROR');
    console.error(err);
  }
}

export default StreamPage;