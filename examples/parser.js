function parseStream(KVSClient, channelARN, startTimestamp) {
    // get Data endpoint
    KVSClient.getDataEndpoint(
        {APIName: 'GET_MEDIA', StreamARN: channelARN}, 
        function(err, data) {
            if (err) console.log(err, err.stack);  
            else{
                console.log(data);
                getMediaWorker(data, channelARN, {StartSelectorType: "StartTimestamp", StartTimestamp: startTimestamp});
            }     
    });
    
    
    // parse? 
    // save to S3?
}

function getMediaWorker(KVSEndpoint, channelARN, startSelector) {
    const fragments = new Array();
    let responseHeader = null;

    fetch(KVSEndpoint + '/getMedia', {
        StartSelector: { 
            "AfterFragmentNumber": null,            // where to get this fragment number??
            "ContinuationToken": null,
            "StartSelectorType": "StartTimestamp",  
            "StartTimestamp": startTimestamp,       // unsure if this is correct timestamp
        },
        StreamARN: channelARN,
    })
    .then(response => response.json())
    .then(response => console.log(JSON.stringify(response)))
    .then(response => responseHeader = response.header);

    for(let pair of responseHeader.entries()){      // need to read up on this bs
        if(pair[0] == 'Payload'){

        }
    }
}

