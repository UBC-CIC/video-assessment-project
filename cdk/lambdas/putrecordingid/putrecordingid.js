const AWS = require('aws-sdk');

exports.handler = async (event) => {
    const REGION       = process.env.AWS_REGION;
    const TABLENAME    = process.env.TABLE;
    let   userid;
    let   assessmentid;
    let   starttime;

    // if(!event.userid || !event.assessmentid || !event.starttime) throw new Error('[ERROR] missing input parameters');
    // userid       = event.userid;
    // assessmentid = event.assessmentid;
    // starttime    = event.starttime;

    console.log(event);

    const DynamoDBClient = new AWS.DynamoDB({
        region: REGION,
    })

    try{
        const putItemResponse = DynamoDBClient.putItem({
            Item: {
                "userid": {S: userid},
                "assessmentid": {S: assessmentid},
                "starttime": {S: starttime}
            },
            ReturnConsumedCapacity: 'TOTAL',
            TableName: TABLENAME
        })
        console.log(putItemResponse);

        return {
            statusCode: 200, 
            body: JSON.stringify({
                message: '[SUCCESS]: Information stored in database',
                putItemResponse: putItemResponse
            }
        )};
    }catch(err){
        console.error('[FAIL]: runtime error' + err);
        return {
            statusCode: 400, 
            body: JSON.stringify({
                message: '[ERROR]: Runtime error',
                error: err,
                stack: err.stack
            }
        )};
    }
}
