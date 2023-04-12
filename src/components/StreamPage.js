import * as React from 'react';
import { useState } from 'react';
import { startMaster, stopMaster, master, joinSession }from './master';
import { stopViewer } from './viewer';
import { configureStream, deleteStream} from './configStream.js';
import AWS from 'aws-sdk';
import * as KVSWebRTC from 'amazon-kinesis-video-streams-webrtc';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { Stream } from '@mui/icons-material';

let   ROLE          = null; // Possible values: 'master', 'viewer', null
let   config        = require('./config.json');

const GETCLIP_ARN   = config.getclip;
const MP4STTICH_ARN = config.mp4stitch;
const KEYID         = '';
const SECRETKEY     = '';
const REGION        = config.region;
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

let   UserID        = '';
let   AssessmentID  = '';


// let   channelName   = `${UserID}_Channel`;  // planned implementation of channel name
let   channelName = 'michael-test';

class StreamPage extends React.Component {
  render () {
    return <Box sx={{ display: 'flex' }}>
        <Box
          component="main"
          sx={{ flexGrow: 1, bgcolor: 'background.default', p: 3 }}
        >
        <br/>
        <br/>
        <br/>

          <form>
              <input type="text" name="accessKeyId" className="form-control" id="accessKeyId" placeholder="Access Key ID" onChange={this.handleAccessKeyChange}></input>
              <input type="password" name="secretAccessKey" className="form-control" id="secretAccessKey" placeholder="Secret Access Key" onChange={this.handleSecretAccessKeyChange}></input>
          </form>
          <br/>
          <div id="master" className="d-none">
              <div className="row">
                  <div className="col">
                      <div className="video-container"><video className="local-view" autoPlay playsInline controls muted /></div>
                  </div>
              </div>
              {/* <div className="row datachannel">
                  <div className="col">
                      <div className="form-group">
                        <textarea type="text" className="form-control local-message" placeholder="DataChannel Message"> </textarea>
                      </div>
                  </div>
                  <div className="col">
                      <div className="card bg-light mb-3">
                          <pre className="remote-message card-body text-monospace preserve-whitespace"></pre>
                      </div>
                  </div>
              </div> */}
          </div>
          <div className="card">
          <div style = {{alignItems: 'flex-right'}}>
            <Button variant="outlined" onClick={masterClick} id="master-button" type="button" className="btn btn-primary">Start Stream</Button>
            <Button variant="outlined" onClick={onStop} id="stop-master-button" type="button" className="btn btn-primary">Stop Stream and Recording</Button>
            <Button variant="outlined" >Review Recording</Button>
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

function getFormValues() {
  return {
      region: REGION, 
      channelName: channelName, 
      clientId: getRandomClientId(),
      sendVideo: SENDVID,
      sendAudio: SENDAUD,
      openDataChannel: DATACHANNEL,
      widescreen: WIDESCREEN,
      fullscreen: !WIDESCREEN,
      useTrickleICE: TRICKLEICE,
      natTraversalDisabled: NATDISABLE,
      forceTURN: FORCETURN,
      accessKeyId:  document.getElementById('accessKeyId').value,// 'accessKeyId'.val(),
      // endpoint: $('#endpoint').val() || null,
      secretAccessKey:  document.getElementById('secretAccessKey').value, //'secretAccessKey'.val(),
      // sessionToken: $('#sessionToken').val() || null,
  };
}

function toggleDataChannelElements() {
  if (getFormValues().openDataChannel) {
      '.datachannel'.removeClass('d-none');
  } else {
      '.datachannel'.addClass('d-none');
  }
}

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
  const formValues = getFormValues();

  // remoteMessage = '';
  // localMessage.value = '';
  // toggleDataChannelElements();

  // createSignalingChannel(formValues);

  await new Promise(r => setTimeout(r, 1000)); //sleep 1 second

  startMaster(localView, remoteView, formValues, onStatsReport, event => {
      remoteMessage.append(`${event.data}\n`);
  });

  await new Promise(r => setTimeout(r, 3000));

  console.log('calling join session');
  joinSession(formValues);
};

async function startRecording(){
  startTime = new Date().toISOString();
  console.log('Start time: ' + startTime);
}

async function saveRecording(){
  const formValues = getFormValues();
  const lambdaClient = new AWS.Lambda({
    region: REGION,
    accessKeyId: formValues.accessKeyId,
    secretAccessKey: formValues.secretAccessKey // TODO: replace with IAM role permissions
  });

  endTime = new Date().toISOString();
  UserID = Math.random().toString(36).substring(6).toUpperCase();
  AssessmentID = Math.random().toString(36).substring(6).toUpperCase();

  try{
    const getClipPayload = {
      StreamARN: 'arn:aws:kinesisvideo:us-west-2:444889511257:stream/michael-testing/1677783281493',
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
      // OutputBucket: 'recording-output',
      // InputBucket: clipResponseInfo.destination,
      UserMetadata: {UserID: UserID, AssessmentID: AssessmentID},
      RecordingName: `${UserID}/${AssessmentID}-${startTimeInt}.mp4`
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