import * as React from 'react';
import { useState, useEffect } from 'react';
import { startMaster, stopMaster, master, joinSession }from '../master';
import { stopViewer } from '../viewer';
import { configureStream, deleteStream} from './configStream.js';
import AWS from 'aws-sdk';
import * as KVSWebRTC from 'amazon-kinesis-video-streams-webrtc';
import { Auth } from 'aws-amplify';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import { Stream } from '@mui/icons-material';

let   ROLE          = null; // Possible values: 'master', 'viewer', null
let   config        = require('./config.json');

const REGION        = config.region;
const GETCLIP_ARN   = config.getclip;
const MP4STTICH_ARN = config.mp4stitch;
const drawerWidth   = 240;

let   startTime     = new Date().toISOString();
let   endTime       = new Date().toISOString();
let   blurSelector  = true;

class StreamPage extends React.Component {
  async componentDidMount() {
    console.log("trying masterclick");
    const formValues = await getFormValues();
    await configureStream(formValues.channelName, formValues);
    console.log("masterclick success");
  }
  async componentWillUnmount() {
    // const user = await Auth.currentAuthenticatedUser();
    // let streamName = user.attributes.sub;
    // const formValues = await getFormValues();
    // console.log("trying deletestream");
    // await deleteStream(streamName, formValues);
    // console.log("deletestream success")
  } // The above implementation is currently buggy, if the user tries to load the page again while the stream is deleting on AWS, there will be an unresolved error that requires manual deletion

  render () {
    return (
      <Box justifyContent='center' sx={{ display: 'flex', position: 'relative'}}>
        <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default' }}>
          <br/>
          <br/>
          <br/>
          <div>
            <form>
              <input type="text" id="assessmentId" placeholder="Assessment ID" style = {{alignItems: 'right'}}></input>
            </form>
            <FormGroup>
              <FormControlLabel control={<Switch onChange={()=>{blurSelector = !blurSelector}} defaultChecked/>} label="Face Blurring"/>
              <div align="left">Note: Blur will be applied after recording.</div>
            </FormGroup>
          </div>
          <br/>
          <div id="master" className="d-none">
              <div className="video-container">
                <video className="local-view" autoPlay playsInline controls muted width="640" height="360"/>
              </div>
          </div>
          <div className="card">
            <div style = {{alignItems: 'flex-right'}}>
              <Button variant="outlined" onClick={masterClick}>Start Recording</Button>
              <Button variant="outlined" onClick={onStop} id="stop-master-button" type="button" className="btn btn-primary">Stop and Save Recording</Button>
            </div>
          </div>  
          <div style={{ position: 'absolute', top: 0, right: 0, padding: '10px' }}>
          Recording is only available to authenticated accounts. Please fill in the Assessment ID for your recording.
          </div>
          <br/>
        </Box>
      </Box>
    )
  }
}

function getRandomClientId() {
  return Math.random()
      .toString(36)
      .substring(2)
      .toUpperCase();
}

export async function getFormValues() {
  const credentials = await Auth.currentCredentials();
  const user = await Auth.currentAuthenticatedUser();
  // console.log(credentials.sessionToken);
  // console.log(credentials);
  
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

async function onStop() {
  const user = await Auth.currentAuthenticatedUser();
  
  saveRecording();

  if (!ROLE) {
      return;
  }

  if (ROLE === 'master') {
      stopMaster();
  } else {
      stopViewer();
  }
  // console.log("trying deletestream");
  // let formValues = await getFormValues();
  // await deleteStream(user.attributes.sub, formValues);
  // console.log("deletestream success");

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

  // const arnResp = await configureStream(formValues.channelName, formValues);
  // console.log("configstream success")

  await new Promise(r => setTimeout(r, 1000)); //sleep 1 second
  
  startMaster(localView, remoteView, formValues, onStatsReport, event => {
      remoteMessage.append(`${event.data}\n`);
  });

  await new Promise(r => setTimeout(r, 3000));

  console.log('Calling join session');
  joinSession(formValues);

  startRecording();
};

async function startRecording(){
  startTime = new Date().toISOString();
  console.log('Start time: ' + startTime);
}

async function saveRecording(){
  const formValues   = await getFormValues();
  const UserID       = formValues.channelName;
  let   AssessmentID = document.getElementById('assessmentId').value;

  endTime = new Date().toISOString();

  const KVSClient = new AWS.KinesisVideo({
    region: 'us-west-2',
    endpoint: null,
    correctClockSkew: true,
    accessKeyId: formValues.accessKeyId,
    secretAccessKey: formValues.secretAccessKey,
    sessionToken: formValues.sessionToken,
  })

  const describeStreamResponse = await KVSClient
    .describeStream({
        StreamName: UserID,
    })
    .promise();
  console.log(describeStreamResponse);
  const streamARN = describeStreamResponse.StreamInfo.StreamARN;

  const lambdaClient = new AWS.Lambda({
    region: REGION,
    accessKeyId: formValues.accessKeyId,
    secretAccessKey: formValues.secretAccessKey,
    sessionToken: formValues.sessionToken,
  });

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
      StartTimeInt: startTimeInt,
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