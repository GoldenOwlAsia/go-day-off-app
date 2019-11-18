import React from 'react';
import { withStyles } from '@material-ui/core/styles';

import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Divider from '@material-ui/core/Divider';

import DashboardIcon from '@material-ui/icons/Dashboard';
import PersonIcon from '@material-ui/icons/Person';
import EmailIcon from '@material-ui/icons/Email';
import PersonAddIcon from '@material-ui/icons/PersonAdd';
import SendIcon from '@material-ui/icons/Send';
import HistoryIcon from '@material-ui/icons/History';
import SettingIcon from '@material-ui/icons/Settings'

import { Link, withRouter } from 'react-router-dom';

const styles = theme => ({
  undecoratedLink: {
    textDecoration: 'none'
  },
  selectedLink: {
    backgroundColor: 'rgba(0, 0, 0, 0.08)'
  }
});

const isSelectedLink = (history, pathname, classes) =>
  pathname === history.location.pathname ? classes.selectedLink : '';

const PersonnelListItems = props => {
  const { classes, history } = props;
  return (
    <React.Fragment>
      <br />
      <Link to="/" className={classes.undecoratedLink}>
        <ListItem button className={isSelectedLink(history, '/', classes)}>
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItem>
      </Link>
      <Link to="/leave-request/create" className={classes.undecoratedLink}>
        <ListItem
          button
          className={isSelectedLink(history, '/leave-request/create', classes)}
        >
          <ListItemIcon>
            <SendIcon />
          </ListItemIcon>
          <ListItemText primary="Create leave letter" />
        </ListItem>
      </Link>
      <Link to="/my-letters" className={classes.undecoratedLink}>
        <ListItem
          button
          className={isSelectedLink(history, '/my-letters', classes)}
        >
          <ListItemIcon>
            <HistoryIcon />
          </ListItemIcon>
          <ListItemText primary="My letters" />
        </ListItem>
      </Link>
      <br />
      {/*Comment for now*/}
      {/* <Divider />
      <br />
      <Link to="/booking-meeting" className={classes.undecoratedLink}>
        <ListItem
          button
          className={isSelectedLink(history, '/booking', classes)}
        >
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary="Meeting Bookings" />
        </ListItem>
      </Link>
      <Link to="/booking-meeting-request/create" className={classes.undecoratedLink}>
        <ListItem
          button
          className={isSelectedLink(history, '/booking-meeting-request/create', classes)}
        >
          <ListItemIcon>
            <SendIcon />
          </ListItemIcon>
          <ListItemText primary="Create Booking" />
        </ListItem>
      </Link>
      <br /> */} 
    </React.Fragment>
  );
};

const HRListItems = props => {
  const { classes, history } = props;
  return (
    <React.Fragment>
      <Divider />
      <br />
      <Link to="/leave-requests" className={classes.undecoratedLink}>
        <ListItem
          button
          className={isSelectedLink(history, '/leave-requests', classes)}
        >
          <ListItemIcon>
            <EmailIcon />
          </ListItemIcon>
          <ListItemText primary="List all letters" />
        </ListItem>
      </Link>
      <br />
      <Divider />
      <br />
      <Link to="/create-user" className={classes.undecoratedLink}>
        <ListItem
          button
          className={isSelectedLink(history, '/create-user', classes)}
        >
          <ListItemIcon>
            <PersonAddIcon />
          </ListItemIcon>
          <ListItemText primary="Create user" />
        </ListItem>
      </Link>
      <Link to="/users-management" className={classes.undecoratedLink}>
        <ListItem
          button
          className={isSelectedLink(history, '/users-management', classes)}
        >
          <ListItemIcon>
            <PersonIcon />
          </ListItemIcon>
          <ListItemText primary="List all users" />
        </ListItem>
      </Link>
      <br />
      <Divider />
      <br />
      <Link to="/setting" className={classes.undecoratedLink}>
        <ListItem
          button
          className={isSelectedLink(history, '/setting', classes)}
        >
          <ListItemIcon>
            <SettingIcon />
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </ListItem>
      </Link>
    </React.Fragment>
  );
};

export const PersonnelList = withStyles(styles)(withRouter(PersonnelListItems));
export const HRList = withStyles(styles)(withRouter(HRListItems));
