import { AmplifyRootStackTemplate } from '@aws-amplify/cli-extensibility-helper';

export function override(resources: AmplifyRootStackTemplate) {
    const authRole = resources.authRole;

    const basePolicies = Array.isArray(authRole.policies)
        ? authRole.policies
        : [authRole.policies];

    authRole.policies = [
        ...basePolicies,
        {
        policyName: "video-assessment-user-policy",
        policyDocument: {
            Version: "2012-10-17",
            Statement: [
            //? Route calculator
            {
                Resource: "*",
                Effect: "Allow",
                Action: [
                    "kinesisvideo:GetSignalingChannelEndpoint",
                    "kinesisvideo:ListFragments",
                    "lambda:InvokeFunction",
                    "kinesisvideo:GetIceServerConfig",
                    "kinesisvideo:GetClip",
                    "kinesisvideo:ListStreams",
                    "kinesisvideo:UpdateStream",
                    "kinesisvideo:DeleteStream",
                    "lambda:InvokeAsync",
                    "kinesisvideo:GetMedia",
                    "kinesisvideo:JoinStorageSession",
                    "dynamodb:Query",
                    "kinesisvideo:DeleteSignalingChannel",
                    "kinesisvideo:DescribeSignalingChannel",
                    "kinesisvideo:CreateStream",
                    "kinesisvideo:PutMedia",
                    "kinesisvideo:ConnectAsMaster",
                    "kinesisvideo:CreateSignalingChannel",
                    "kinesisvideo:ListSignalingChannels",
                    "kinesisvideo:DescribeStream"
                ],
            },
            ],
        },
        },
    ];
}
