import { useId, useState } from 'react';
import AWS from 'aws-sdk';
import './App.css';
import * as React from 'react';
import { Amplify } from 'aws-amplify';
import { Auth } from 'aws-amplify';

import {
  BrowserRouter as Router,
  Routes, Route, Link
} from "react-router-dom";

import { 
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Container 
} from '@mui/material/';

import HomeIcon from '@mui/icons-material/Home';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import VideoCameraFrontIcon from '@mui/icons-material/VideoCameraFront';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import CssBaseline from '@mui/material/CssBaseline';


import StreamPage from "./components/StreamPage";
import { createSignalingChannel } from './createSignalingChannel';


function App() {
  const [count, setCount] = useState(0)
  const id = useId();

  return (
    <div className="App">
      <Router>
        <div style={{ display: 'flex' }}>
          <CssBaseline />
          <AppBar position="fixed">
            <Toolbar>
              <Typography variant="h6" noWrap component="div">
                Video Upload Centre
              </Typography>
            </Toolbar>
          </AppBar>
          <Drawer
            style={{ width: '500px' }}
            variant="permanent"
            anchor="left"
            open={true}
            width='inherit'
          >
            
            <List>
              <Link to="/" className='link'>
                <ListItem>
                  <ListItemButton>
                    <ListItemIcon>
                      <HomeIcon/>
                    </ListItemIcon>
                    <ListItemText primary={"Home"}/>
                  </ListItemButton>
                </ListItem>
              </Link>

              <Link to="/record" className='link'>
                <ListItem>
                  <ListItemButton>
                    <ListItemIcon>
                      <VideoCameraFrontIcon/>
                    </ListItemIcon>
                    <ListItemText primary={"Record a Video"}/>
                  </ListItemButton>
                </ListItem>
              </Link>

              <Link to="/recordings" className='link'>
                <ListItem>
                  <ListItemButton>
                    <ListItemIcon>
                      <OndemandVideoIcon/>
                    </ListItemIcon>
                    <ListItemText primary={"Recordings"}/>
                  </ListItemButton>
                </ListItem>
              </Link>

            </List>
          </Drawer>

          <Routes>
            <Route path="/"></Route>
            <Route path="/record" element={<StreamPage></StreamPage>}></Route>
            <Route path="/recordings" element={<Container>Recordings</Container>}></Route>
          </Routes>
        </div>
      </Router>
      {/* <StreamPage /> */}
    </div>
  );
}



export default App;
