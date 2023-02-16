let ROLE = null; // Possible values: 'master', 'viewer', null

const CHANNEL_NAME_LENGTH = 5;

const REGION      = "us-west-2";
const TRICKLEICE  = true;
const WIDESCREEN  = true;
const SENDVID     = true;
const SENDAUD     = true;
const DATACHANNEL = false;
const FORCETURN   = false;
const NATDISABLE  = false;

let   startTime = '';

function configureLogging() {
    function log(level, messages) {
        const text = messages
            .map(message => {
                if (typeof message === 'object') {
                    return JSON.stringify(message, null, 2);
                } else {
                    return message;
                }
            })
            .join(' ');
        $('#logs').append($(`<div class="${level.toLowerCase()}">`).text(`[${new Date().toISOString()}] [${level}] ${text}\n`));
        const logsContainer = document.getElementById('logs');
        logsContainer.scrollTo(0, logsContainer.scrollHeight);
    }

    console._error = console.error;
    console.error = function(...rest) {
        log('ERROR', Array.prototype.slice.call(rest));
        console._error.apply(this, rest);
    };

    console._warn = console.warn;
    console.warn = function(...rest) {
        log('WARN', Array.prototype.slice.call(rest));
        console._warn.apply(this, rest);
    };

    console._log = console.log;
    console.log = function(...rest) {
        log('INFO', Array.prototype.slice.call(rest));
        console._log.apply(this, rest);
    };
}

function getRandomClientId() {
    return Math.random()
        .toString(36)
        .substring(2)
        .toUpperCase();
}

function getRandomChannelName() {
    return Math.random()
            .toString(36)
            .substring(2,(2 + CHANNEL_NAME_LENGTH));
}

let channelName = getRandomChannelName();

function getFormValues() {
    return {
        region: REGION, //$('#region').val(),
        channelName: channelName, //$('#channelName').val(),
        clientId: getRandomClientId(),
        sendVideo: SENDVID,
        sendAudio: SENDAUD,
        openDataChannel: DATACHANNEL,
        widescreen: WIDESCREEN,
        fullscreen: !WIDESCREEN,
        useTrickleICE: TRICKLEICE,
        natTraversalDisabled: NATDISABLE,
        forceTURN: FORCETURN,
        accessKeyId: $('#accessKeyId').val(),
        endpoint: null, // $('#endpoint').val() || null,
        secretAccessKey: $('#secretAccessKey').val(),
        sessionToken: null, //$('#sessionToken').val() || null,
    };
}

function toggleDataChannelElements() {
    if (getFormValues().openDataChannel) {
        $('.datachannel').removeClass('d-none');
    } else {
        $('.datachannel').addClass('d-none');
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
        $('#master').addClass('d-none');
    } else {
        stopViewer();
        $('#viewer').addClass('d-none');
    }

    $('#form').removeClass('d-none');
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

configureLogging();

$('#master-button').click(async () => {
    ROLE = 'master';
    $('#form').addClass('d-none');
    $('#master').removeClass('d-none');

    const localView = $('#master .local-view')[0];
    const remoteView = $('#master .remote-view')[0];
    const localMessage = $('#master .local-message')[0];
    const remoteMessage = $('#master .remote-message')[0];
    const formValues = getFormValues();

    $(remoteMessage).empty();
    localMessage.value = '';
    toggleDataChannelElements();

    await new Promise(r => setTimeout(r, 1000)); //sleep 1 second

    startMaster(localView, remoteView, formValues, onStatsReport, event => {
        remoteMessage.append(`${event.data}\n`);
    });
});

$('#stop-master-button').click(onStop);

$('#join-session-button').click(async () => {
    const formValues = getFormValues();
    joinSession(formValues, event => {
        remoteMessage.append(`${event.data}\n`);
    });
});

$('#viewer-button').click(async () => {
    ROLE = 'viewer';
    $('#form').addClass('d-none');
    $('#viewer').removeClass('d-none');

    const localView = $('#viewer .local-view')[0];
    const remoteView = $('#viewer .remote-view')[0];
    const localMessage = $('#viewer .local-message')[0];
    const remoteMessage = $('#viewer .remote-message')[0];
    const formValues = getFormValues();

    $(remoteMessage).empty();
    localMessage.value = '';
    toggleDataChannelElements();

    startViewer(localView, remoteView, formValues, onStatsReport, event => {
        remoteMessage.append(`${event.data}\n`);
    });
});

$('#stop-viewer-button').click(onStop);

$('#create-channel-button').click(async () => {
    const formValues = getFormValues();

    createSignalingChannel(formValues);
});

$('#master .send-message').click(async () => {
    const masterLocalMessage = $('#master .local-message')[0];
    sendMasterMessage(masterLocalMessage.value);
});

$('#viewer .send-message').click(async () => {
    const viewerLocalMessage = $('#viewer .local-message')[0];
    sendViewerMessage(viewerLocalMessage.value);
});

$('#get-media').click(async () => {
    const StreamARN = 'arn:aws:kinesisvideo:us-west-2:444889511257:stream/muhan-ingestion-test/1675293375403';
    const startTime_ = new Date().toISOString();
    const formValues = getFormValues();
    
    const KVSClient = new AWS.KinesisVideo({
        region: 'us-west-2',
        accessKeyId: formValues.accessKeyId,
        secretAccessKey: formValues.secretAccessKey,
        endpoint: null,
        correctClockSkew: true,
    });

    getDataEndpoint(KVSClient, 'GET_MEDIA', StreamARN)
    .then(data => {
        console.log('[SUCCESS] endpoint: ' + data.DataEndpoint);
        
        getMediaWorker(formValues, data.DataEndpoint, StreamARN, {StartSelectorType: 'SERVER_TIMESTAMP', StartTimestamp: startTime_})
        .then(data => {
            console.log(data);
        })
        .catch(err => console.error(err));
    })
    .catch(err => console.error(err));
});

$('#get-timestamp').click(async () => {
    const out = new Date().toISOString();
    startTime = out;
    console.log(out);
});

$('#get-fragment').click(async () => {
    const EndTime = new Date().toISOString();
    const StreamInfo = {
        StreamARN:  'arn:aws:kinesisvideo:us-west-2:444889511257:stream/muhan-ingestion-test/1675293375403',
        StreamName: 'muhan-ingestion-test'
    };
    const TimeInfo = {
        StartTime: startTime,
        EndTime:   EndTime
    };
    const formValues = getFormValues();

    const KVSClient = new AWS.KinesisVideo({
        region: 'us-west-2',
        accessKeyId: formValues.accessKeyId,
        secretAccessKey: formValues.secretAccessKey,
        endpoint: null,
        correctClockSkew: true,
    });

    const KVSArchiveClient = new AWS.KinesisVideoArchivedMedia({
        region: 'us-west-2',
        accessKeyId: formValues.accessKeyId,
        secretAccessKey: formValues.secretAccessKey,
        endpoint: null,
        correctClockSkew: true,
    })

    listFragmentWorker(KVSClient, KVSArchiveClient, TimeInfo, StreamInfo)
    .then(data => {
        const FragmentIDList = processFragmentsData(data.Fragments);

        console.log('calling getmedia fragments');
        getMediaforFragmentListWorker(KVSClient, KVSArchiveClient, FragmentIDList, StreamInfo)
        .then(data => {
            console.log(data);
        })
        .catch(err => console.error(err));
    })
    .catch(err => console.error(err));
});

function getDataEndpoint(KVSClient, APIName, StreamARN) {
    return new Promise((resolve, reject) => {
        KVSClient.getDataEndpoint(
            {APIName: APIName, StreamARN: StreamARN},
            (err, data) =>{
                if (err) return reject(err);
                else resolve(data);    
            }
        )
    });
}

// function getMediaWorker(formValues, APIEndpoint, StreamARN, StartSelector) {
//     const KVSMediaClient = new AWS.KinesisVideoMedia({
//         region: 'us-west-2',
//         accessKeyId: formValues.accessKeyId,
//         secretAccessKey: formValues.secretAccessKey,
//         endpoint: APIEndpoint,
//         correctClockSkew: true,
//     });

//     return new Promise((resolve, reject) => {
//         KVSMediaClient.getMedia(
//             {StartSelector: StartSelector, StreamARN: StreamARN},
//             (err, data) => {
//                 if (err) return reject(err);
//                 else resolve(data);
//             }
//         )
//     });
// } 

function listFragmentWorker(KVSClient, KVSArchiveClient, TimeInfo, StreamInfo){
    return new Promise((resolve, reject) => {
        getDataEndpoint(KVSClient, 'LIST_FRAGMENTS', StreamInfo.StreamARN)
        .then(resp => {
            KVSArchiveClient.endpoint = resp.DataEndpoint;
            KVSArchiveClient.listFragments({
                FragmentSelector: {
                    FragmentSelectorType: 'SERVER_TIMESTAMP',
                    TimestampRange: {StartTimestamp: TimeInfo.StartTime, EndTimestamp: TimeInfo.EndTime}
                },
                StreamName: StreamInfo.StreamName
            },
            (err, data) => {
                if (err) return reject(err);
                else resolve(data);
            });
        })
        .catch(err => {
            console.error(err);
            return reject(err);
        });
    });
}

function getMediaforFragmentListWorker(KVSClient, KVSArchiveClient, Fragments, StreamInfo){
    return new Promise((resolve, reject) => {
        getDataEndpoint(KVSClient, 'GET_MEDIA_FOR_FRAGMENT_LIST', StreamInfo.StreamARN)
        .then(resp => {
            console.log('data endpoint (getmediafragments) ' + resp.DataEndpoint);
            KVSArchiveClient.endpoint = resp.DataEndpoint;
            KVSArchiveClient.getMediaForFragmentList({
                Fragments: Fragments,
                StreamName: StreamInfo.StreamName
            },
            (err, data) => {
                console.log('data received');
                if(err) return reject(err);
                else return resolve(data);
            })
        })
        .catch(err => {
            console.error(err);
            return reject(err);
        })
    });
}

function processFragmentsData(FragmentsInfo){
    return FragmentsInfo.map((fragment) => {
        return fragment.FragmentNumber;
    });
}

// Read/Write all of the fields to/from localStorage so that fields are not lost on refresh.
const urlParams = new URLSearchParams(window.location.search);
const fields = [
    // { field: 'channelName', type: 'text' },
    // { field: 'clientId', type: 'text' },
    // { field: 'region', type: 'text' },
    { field: 'accessKeyId', type: 'text' },
    { field: 'secretAccessKey', type: 'text' },
    // { field: 'sessionToken', type: 'text' },
    // { field: 'endpoint', type: 'text' },
    // { field: 'sendVideo', type: 'checkbox' },
    // { field: 'sendAudio', type: 'checkbox' },
    // { field: 'widescreen', type: 'radio', name: 'resolution' },
    // { field: 'fullscreen', type: 'radio', name: 'resolution' },
    // { field: 'openDataChannel', type: 'checkbox' },
    // { field: 'useTrickleICE', type: 'checkbox' },
    // { field: 'natTraversalEnabled', type: 'radio', name: 'natTraversal' },
    // { field: 'forceTURN', type: 'radio', name: 'natTraversal' },
    // { field: 'natTraversalDisabled', type: 'radio', name: 'natTraversal' },
];
fields.forEach(({ field, type, name }) => {
    const id = '#' + field;

    // Read field from localStorage
    try {
        const localStorageValue = localStorage.getItem(field);
        if (localStorageValue) {
            if (type === 'checkbox' || type === 'radio') {
                $(id).prop('checked', localStorageValue === 'true');
            } else {
                $(id).val(localStorageValue);
            }
            $(id).trigger('change');
        }
    } catch (e) {
        /* Don't use localStorage */
    }

    // Read field from query string
    if (urlParams.has(field)) {
        paramValue = urlParams.get(field);
        if (type === 'checkbox' || type === 'radio') {
            $(id).prop('checked', paramValue === 'true');
        } else {
            $(id).val(paramValue);
        }
    }

    // Write field to localstorage on change event
    $(id).change(function() {
        try {
            if (type === 'checkbox') {
                localStorage.setItem(field, $(id).is(':checked'));
            } else if (type === 'radio') {
                fields
                    .filter(fieldItem => fieldItem.name === name)
                    .forEach(fieldItem => {
                        localStorage.setItem(fieldItem.field, fieldItem.field === field);
                    });
            } else {
                localStorage.setItem(field, $(id).val());
            }
        } catch (e) {
            /* Don't use localStorage */
        }
    });
});

// The page is all setup. Hide the loading spinner and show the page content.
$('.loader').addClass('d-none');
$('#main').removeClass('d-none');
console.log('Page loaded');
