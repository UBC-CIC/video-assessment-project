import * as React from 'react';
import { stopMaster, startMaster } from './master';
import { stopViewer } from './viewer';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

let ROLE = null; // Possible values: 'master', 'viewer', null

const REGION      = "us-west-2";
const TRICKLEICE  = true;
const WIDESCREEN  = true;
const SENDVID     = true;
const SENDAUD     = true;
const DATACHANNEL = false;
const FORCETURN   = false;
const NATDISABLE  = false;
const drawerWidth = 240;

let startTime = new Date();
let endTime   = new Date();

export default function StreamPage() {
  return (
    <Box sx={{ display: 'flex' }}>
      <Box
        component="main"
        sx={{ flexGrow: 1, bgcolor: 'background.default', p: 3 }}
      >
      <br/>
      <br/>
      <br/>

        <div className="form-group">
            <label>Access Key ID </label>
            <input type="text" className="form-control" id="accessKeyId" placeholder="Access key ID"></input>
            <label>   Secret Access Key </label>
            <input type="password" className="form-control" id="secretAccessKey" placeholder="Secret access key"></input>
        </div>
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
          <Button variant="outlined" onClick={onStop} id="stop-master-button" type="button" className="btn btn-primary">Stop Recording</Button>
          <Button variant="outlined" >Review Recording</Button>
          <Button variant="outlined" onClick={startRecording} id="start-recording" type="button" className="btn btn-primary">Start Recording</Button>
          <Button variant="outlined" onClick={saveRecording} id="save-recording" type="button" className="btn btn=primary">Save Recording</Button>
        </div>
      </div>
      </Box>
    </Box>
);
}




function getRandomClientId() {
  return Math.random()
      .toString(36)
      .substring(2)
      .toUpperCase();
}

let channelName = 'michael-test';

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
      accessKeyId: KEYID, // 'accessKeyId'.val(),
      // endpoint: $('#endpoint').val() || null,
      secretAccessKey: SECRETKEY, //'secretAccessKey'.val(),
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
};

async function startRecording(){

}

async function saveRecording(){
  const formValues = getFormValues();
  const lambdaClient = new AWS.Lambda({
    region: 'us-west-2',
    accessKeyId: formValues.accessKeyId,
    secretAccessKey: formValues.secretAccessKey // changed for cognito
  });
  const sessionID = Math.random().toString(36).substring(6).toUpperCase();
  endTime = new Date().toISOString();

  try{
    const getClipPayload = {
      StreamARN: 'arn:aws:kinesisvideo:us-west-2:444889511257:stream/muhan-ingestion-test/1675293375403',
      BucketName: 'fragments-raw',
      startTime: startTime,
      endTime: endTime,
      SessionID: sessionID
    }
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
      SessionID: sessionID,
      NumOfClips: clipResponseBody.fragmentcount,
      OutputBucket: 'recording-output',
      InputBucket: clipResponseBody.destination,
      RecordingName: `${sessionID}-${clipResponseBody.fragmentcount}`,
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