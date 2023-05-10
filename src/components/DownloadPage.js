import React, { useState, useEffect } from 'react';
import AWS from 'aws-sdk';
import { Amplify, Storage, Auth } from 'aws-amplify';

import Box from '@mui/material/Box';
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
        const urls = await getPresignedUrls();
        console.log("first url is " + urls[0]);
        this.setState({ urls });
      }

      render() {
        const {urls} = this.state;
        return (
          <List>
            {urls.map((url) => (
              <ListItem key={url}>
                <Button href={url} target="_blank" rel="noopener noreferrer">
                  <ListItemText primary={url} />
                </Button>
              </ListItem>
            ))}
          </List>

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
            ":assessmentid": {S: "example 2"},
        },
        KeyConditionExpression: "assessmentid = :assessmentid",
        ProjectionExpression: "userid, assessmentid, starttime",
        IndexName: "assessmentid-userid-index",	
        TableName: "VideoAssessmentData"
    };

    const keys = [];

    ddb.query(params, function (err, data) {
        if (err) {
            console.log("Error", err);
        } else {
            console.log("Success", data);
            data.Items.forEach(function (element, index, array) {
            keys.push(element.userid.S + "/" + element.assessmentid.S + "-" + element.starttime.S + ".mp4");
            });
        }
    });

}

async function getPresignedUrls() {
    const creds = await Auth.currentCredentials();
    let keys = await getUserVideos();
    console.log("keys in geturl are " + keys);

    let urls = [];
    const lambda = new AWS.Lambda({
        accessKeyId: creds.accessKeyId,
        secretAccessKey: creds.secretAccessKey,
        sessionToken: creds.sessionToken,
        region: 'us-west-2'
    });
          
    for (let i = 0; i < keys.length; i++) {
        let string = keys[i];
        console.log("string is " + keys[i]);
        let params = {
            FunctionName: GETSIGNEDURL,
            // InvocationType: 'RequestResponse',
            // LogType: 'Tail',
            Payload: JSON.stringify({ key: string }),
        };
        let response = await lambda.invoke(params).promise();
        if (!response) throw new Error('no response');
        let links = JSON.parse(response.Payload);
        let link = links.body;
        console.log("link is " + link);
        urls.push(link);
    }
    console.log("urls are " + urls);
    return urls;
} 
export default DownloadPage;