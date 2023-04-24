
import React from 'react';
import { Amplify } from 'aws-amplify';

import awsExports from '../aws-exports';

import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

Amplify.configure(awsExports)

function Dashboard() {
 return(
    <Authenticator>
      {({ signOut, user }) => (
        <main>
          <h1>Logged in as: {user.username}</h1>
          <button onClick={signOut}>Sign out</button>
        </main>
      )}
    </Authenticator>
 )
}

export default Dashboard
