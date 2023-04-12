const AWS = require('aws-sdk');

exports.handler = async (event) => {

    try{
        

        return {
            statusCode: 200, 
            body: JSON.stringify({
                message: '[SUCCESS]: Recording uploaded to S3',
                recordingName: RecordingName,                      
                mediaConvertResponse: createJobResponse
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
