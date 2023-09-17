import * as React from 'react';
import {FC, useEffect, useId, useState} from 'react';
import './App.css';
import {Auth} from 'aws-amplify';

import {BrowserRouter as Router, Link, Route, Routes} from "react-router-dom";

import {Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText} from '@mui/material/';

import HomeIcon from '@mui/icons-material/Home';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import VideoCameraFrontIcon from '@mui/icons-material/VideoCameraFront';
import Typography from '@mui/material/Typography';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import CssBaseline from '@mui/material/CssBaseline';


import StreamPage from './components/StreamPage';
import Login from './components/Login.js';
import DownloadPage from './components/DownloadPage';


function App() {
  const [count, setCount] = useState(0)
  const id = useId();


  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setInterval(() => checkUserLogin(), 1000);
    async function checkUserLogin() {
      try {
        const user = await Auth.currentUserInfo();
        if (user) {
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error('Error checking user login:', error);
      }
    }}, []);

  const RequireAuth: FC<{ children: React.ReactElement }> = ({ children }) => {
    if (!isLoggedIn) {
      return <Login />;
    }
    return children;
  };

  return (
    <div className="App">
        <div style={{ display: 'flex' }}>
          <CssBaseline />
          <AppBar position="fixed">
            <Toolbar>
              <Typography variant="h6" noWrap align='center'>
                Video Upload Centre
              </Typography>
            </Toolbar>
          </AppBar>
          <Router>
          <Drawer
            style={{ width: '500px', marginTop:100 }}
            variant="permanent"
            anchor="left"
            open={true}
            // width='inherit'
          >
            {isLoggedIn &&
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
            }
          </Drawer>
          <main
            style={{marginTop: 100, alignContent:'centre'}}
          >
            <Routes>
              <Route path="/" element={<Login/>}/>
              <Route path="/record" element={<RequireAuth><StreamPage /></RequireAuth>}/>
              <Route path="/recordings" element={<RequireAuth><DownloadPage /></RequireAuth>}/>
            </Routes>
          </main>
          </Router>
        </div>
    </div>
  );
}



export default App;