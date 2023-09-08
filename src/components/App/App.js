import React, { useState } from 'react';
import './App.css';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import Dashboard from '../Dashboard/Dashboard';
import Login from '../Login/Login';
import Preferences from '../Preferences/Preferences';
import useToken from './useToken';
import Homepage from '../Homepage/Homepage';
import Navbar from '../Navbar/Navbar';
import Footer from '../Footer/Footer';
import gtmensbasketballbanner from '../Homepage/gtmensbasketballbanner.png';
import { createTheme, ThemeProvider } from '@mui/material';

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#003057',
        },
        secondary: {
            main: '#B3A369',
        },
        error: {
            main: '#E04F39',
        },
        warning: {
            main: '#FF640F',
        },
        info: {
            main: '#EAAA00',
        },
        success: {
            main: '#00EC9C',
        },
    },
});

function App() {
    const { token, setToken } = useToken();

    // if(!token) {
    //   return <Login setToken={setToken} />
    // }
    return (
        <ThemeProvider theme={theme}>
            <div className="App">
                <BrowserRouter>
                    <Navbar />
                    <Switch>
                        <Route path="/" exact component={Homepage} />
                        <Route path="/login" exact component={Login} />
                        <Route path="/dashboard" exact component={Dashboard} />
                        {/* <Route path="/about" exact component={About} />
          <Route path="/contact" exact component={Contact} /> */}
                    </Switch>
                    <Footer />
                </BrowserRouter>
            </div>
        </ThemeProvider>
    );
}

export default App;
