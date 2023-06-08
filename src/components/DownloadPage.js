import React from 'react';
import AWS from 'aws-sdk';
import { Amplify, Auth } from 'aws-amplify';

import { List, ListItem, ListItemText, Button } from '@mui/material';

const GETSIGNEDURL = process.env.REACT_APP_GETSIGNEDURL;
const VIDEODATA    = process.env.REACT_APP_VIDEODATA;

class DownloadPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
          urls: [],
          keys: [],
          assessmentids: [],
          starttimes: [],
        };
      }

      async componentDidMount() {
        let {urls, keys, assessmentids, starttimes} = await getPresignedUrls();
        this.setState({ urls, keys, assessmentids, starttimes });
      }

      render() {
        let {urls, keys, assessmentids, starttimes} = this.state;
      
        return (
          <div>
            <div>
              <input defaultValue="TEST" placeholder="Assessment ID" id="admin-search"></input>
              <Button onClick={async () => {({urls, keys, assessmentids, starttimes} = await getPresignedUrls()); this.setState({ urls, keys, assessmentids, starttimes });}}>Retrieve Recordings</Button>
              <div>Note: Recordings will only be accessible when logged into a user or assessor account.</div>
              <div>The above search bar is only in use for an assessor level account.</div>
            </div>
            <List>
              {this.state.urls.map((url, index) => (
                <ListItem key={url}>
                  <Button variant="outlined" href={url} target="_blank" rel="noopener noreferrer">
                    <ListItemText primary={"Assessment: " + assessmentids[index] + ",    Date: " + getDate(starttimes[index])} />
                  </Button>
                  <Button variant="contained" onClick={() => {navigator.clipboard.writeText(url)}}>Copy Link</Button>
                </ListItem>
              ))}
            </List>
          </div>
        );
      }
}

function getDate(time) {
  let d = new Date(parseInt(time));
  let ds = d.toString();
  return ds;
}

async function getUserVideos(){ 
    const creds = await Auth.currentCredentials();
    const user = await Auth.currentUserInfo();

    // Create DynamoDB service object.
    var ddb = new AWS.DynamoDB({
        apiVersion: "2012-08-10", 
        region: config.region, 
        credentials: {
            accessKeyId: creds.accessKeyId,
            secretAccessKey: creds.secretAccessKey,
            sessionToken: creds.sessionToken,
        } 
    });

    const params = {
        // Define the expression attribute value, which are substitutes for the values you want to compare.
        ExpressionAttributeValues: {
            ":userid": {S: user.attributes.sub},
        },
        KeyConditionExpression: "userid=:userid",
        ProjectionExpression: "userid, assessmentid, starttime",
        TableName: VIDEODATA
    };

    try {
        const data = await ddb.query(params).promise();
        console.log("Success", data);
        const keys = data.Items.map(element => `${element.userid.S}/${element.assessmentid.S}-${element.starttime.S}.mp4`);
        const assessmentids = data.Items.map(element => `${element.assessmentid.S}`);
        const starttimes = data.Items.map(element => `${element.starttime.S}`);
        // console.log("Keys in getUserVideos are:", keys);
        return {
          keys: keys,
          assessmentids: assessmentids,
          starttimes: starttimes,
        };
      } catch (err) {
        console.log("Error", err);
        throw err;
      }
}

async function getAssessmentVideos(){
    const creds = await Auth.currentCredentials();
    const user = await Auth.currentUserInfo();

    // Create DynamoDB service object.
    var ddb = new AWS.DynamoDB({
        apiVersion: "2012-08-10", 
        region: process.env.REACT_APP_AWS_REGION, 
        credentials: {
            accessKeyId: creds.accessKeyId,
            secretAccessKey: creds.secretAccessKey,
            sessionToken: creds.sessionToken,
        } 
    });

    const params = {
        // Define the expression attribute value, which are substitutes for the values you want to compare.
        ExpressionAttributeValues: {
            ":assessmentid": {S: document.getElementById('admin-search').value},
        },
        KeyConditionExpression: "assessmentid = :assessmentid",
        ProjectionExpression: "userid, assessmentid, starttime",
        IndexName: "assessmentid-starttime-index",	
        TableName: VIDEODATA
    };

    try {
      const data = await ddb.query(params).promise();
      console.log("Success", data);
      const keys = data.Items.map(element => `${element.userid.S}/${element.assessmentid.S}-${element.starttime.S}.mp4`);
      const assessmentids = data.Items.map(element => `${element.assessmentid.S}`);
      const starttimes = data.Items.map(element => `${element.starttime.S}`);
      console.log("Keys in getUserVideos are:", keys);
      return {
        keys: keys,
        assessmentids: assessmentids,
        starttimes: starttimes,
      };
    } catch (err) {
      console.log("Error", err);
      throw err;
    }

}

async function getPresignedUrls() {
    const creds = await Auth.currentCredentials();
    const user = await Auth.currentAuthenticatedUser();
    let keys, assessmentids, starttimes;
    const groups = user.signInUserSession.accessToken.payload["cognito:groups"];

    if(groups.includes('admin')) {
      ({keys, assessmentids, starttimes} = await getAssessmentVideos());
    } else {
      ({keys, assessmentids, starttimes} = await getUserVideos());
    }

    let urls = [];
          
    for (let i = 0; i < keys.length; i++) {
        let string = keys[i];
        let params = {
            FunctionName: GETSIGNEDURL,
            // InvocationType: 'RequestResponse',
            // LogType: 'Tail',
            Payload: JSON.stringify({ key: string }),
        };
        let lambda = new AWS.Lambda({
          accessKeyId: creds.accessKeyId,
          secretAccessKey: creds.secretAccessKey,
          sessionToken: creds.sessionToken,
          region: process.env.REACT_APP_AWS_REGION
        });
        let response = await lambda.invoke(params).promise();
        if (!response) throw new Error('no response');
        let links = JSON.parse(response.Payload);
        let link = links.body;
        urls.push(link);
    }
    return {
      urls: urls,
      keys: keys,
      assessmentids: assessmentids,
      starttimes: starttimes,
    };
} 
export default DownloadPage;