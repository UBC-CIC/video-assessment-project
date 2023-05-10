import React, { useState, useEffect } from 'react';
import AWS from 'aws-sdk';
import { Amplify, Storage, Auth } from 'aws-amplify';

// import Button from '@mui/material/Button';
import { Table } from '@mui/material';
import { List, ListItem, ListItemText, Button } from '@mui/material';

let   config       = require('./config.json');
const GETSIGNEDURL = config.getsignedurl;
const VIDEODATA    = config.videodata;

class DownloadPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
          urls: [],
        };
      }
    
      async componentDidMount() {
        let urls = await getPresignedUrls();
        this.setState({ urls });
      }

      render() {
        const {urls} = this.state;
      
        return (
          <div>
            <List>
              {urls.map((urls, index) => (
                <ListItem key={urls}>
                  <Button href={urls} target="_blank" rel="noopener noreferrer">
                    <ListItemText primary={"Download Recording " + index} />
                  </Button>
                </ListItem>
              ))}
            </List>
          </div>
        );
      }
}

async function getUserVideos(){ 
    const creds = await Auth.currentCredentials();
    const user = await Auth.currentUserInfo();

    // console.log(creds);

    // Create DynamoDB service object.
    var ddb = new AWS.DynamoDB({
        apiVersion: "2012-08-10", 
        region: "us-west-2", 
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
        console.log("Keys in getUserVideos are:", keys);
        return keys;
      } catch (err) {
        console.log("Error", err);
        throw err;
      }
}

async function getAssessmentVideos(){
    const creds = await Auth.currentCredentials();
    const user = await Auth.currentUserInfo();

    // console.log(creds);

    // Create DynamoDB service object.
    var ddb = new AWS.DynamoDB({
        apiVersion: "2012-08-10", 
        region: "us-west-2", 
        credentials: {
            accessKeyId: creds.accessKeyId,
            secretAccessKey: creds.secretAccessKey,
            sessionToken: creds.sessionToken,
        } 
    });

    const params = {
        // Define the expression attribute value, which are substitutes for the values you want to compare.
        ExpressionAttributeValues: {
            ":assessmentid": {S: "abcdef"},
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
      console.log("Keys in getUserVideos are:", keys);
      return keys;
    } catch (err) {
      console.log("Error", err);
      throw err;
    }

}

async function getPresignedUrls() {
    const creds = await Auth.currentCredentials();
    let keys = await getUserVideos();
    // let keys = await getAssessmentVideos();
    // console.log("keys in geturl are " + keys);

    let urls = [];
          
    for (let i = 0; i < keys.length; i++) {
        let string = keys[i];
        // console.log("string is " + keys[i]);
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
          region: 'us-west-2'
      });
        let response = await lambda.invoke(params).promise();
        if (!response) throw new Error('no response');
        let links = JSON.parse(response.Payload);
        let link = links.body;
        // console.log("link is " + link);
        urls.push(link);
    }
    // console.log("urls are " + urls);
    return urls;
} 
export default DownloadPage;