
import React from 'react';
import { Amplify, Auth } from 'aws-amplify';
import {deleteStream} from './configStream';
import {getFormValues} from './StreamPage';

import awsExports from '../aws-exports';

import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

Amplify.configure(awsExports)

async function handleSignOut(){
  let user = await Auth.currentAuthenticatedUser();
  let vals = await getFormValues();
  Auth.signOut();
  await deleteStream(user.attributes.sub, vals);
}

function Login() {
  function handleAuthStateChange(state) {
      window.location.reload();
  }
  return(
    <Authenticator handleAuthStateChange={handleAuthStateChange}>
      {({ signOut, user }) => (
        <main>
          <h1>Logged in as: {user.username}</h1>
          <button onClick={handleSignOut}>Sign out</button>
        </main>
      )}
    </Authenticator>
 )
}

export default Login