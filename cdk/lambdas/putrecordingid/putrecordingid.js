const AWS = require('aws-sdk');

exports.handler = async (event) => {
    const REGION       = process.env.AWS_REGION;
    const TABLENAME    = process.env.TABLENAME;

    let   keyinfo      = event.Records[0].s3.object.key.split(/[^a-zA-Z0-9]/);
    
    let   userid       = keyinfo[0];
    let   assessmentid = keyinfo[1];
    let   starttime    = keyinfo[2];

    const DynamoDBClient = new AWS.DynamoDB({
        region: REGION,
    })

    try{
        const putItemResponse = await DynamoDBClient.putItem({
            Item: {
                "userid": {S: userid},
                "assessmentid": {S: assessmentid},
                "starttime": {S: starttime}
            },
            ReturnConsumedCapacity: 'TOTAL',
            TableName: TABLENAME
        }).promise();
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

