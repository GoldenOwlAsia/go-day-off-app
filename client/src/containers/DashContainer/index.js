import React from 'react';
import Media from 'react-media';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { withRouter, Link } from 'react-router-dom';
import { withStyles } from '@material-ui/core/styles';

import {
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  Menu,
  MenuItem
} from '@material-ui/core';

import MenuIcon from '@material-ui/icons/Menu';
import SignOutIcon from '@material-ui/icons/Input';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import AccountCircleIcon from '@material-ui/icons/AccountCircle';
import AssignmentIndIcon from '@material-ui/icons/AssignmentInd';

// components
import { PersonnelList, HRList } from './listItems';

// constants
import { userTypes } from '../../constants/permission';

// Helpers
import { getUserEntity } from '../../helpers/authHelpers';
import { getUserTypeFromCookie } from '../../helpers/getUserInfo';


const drawerWidth = 240;

const styles = theme => ({
  root: {
    display: 'flex'
  },
  toolbar: {
    paddingRight: 24,
    backgroundColor: '#ffbe00'
  },
  toolbarIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: '0 8px',
    ...theme.mixins.toolbar
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen
    })
  },
  appBarShift: {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen
    })
  },
  menuButton: {
    marginLeft: 12,
    marginRight: 12
  },
  menuButtonHidden: {
    display: 'none'
  },
  logo: {
    width: 50,
    height: 'auto'
  },
  title: {
    flexGrow: 1,
    color: '#fff',
    fontWeight: '500'
  },
  drawerPaper: {
    position: 'relative',
    whiteSpace: 'nowrap',
    width: drawerWidth,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen
    })
  },
  drawerPaperClose: {
    overflowX: 'hidden',
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen
    }),
    width: theme.spacing.unit * 7,
    [theme.breakpoints.up('sm')]: {
      width: theme.spacing.unit * 9
    }
  },
  appBarSpacer: theme.mixins.toolbar,
  content: {
    flexGrow: 1,
    padding: theme.spacing.unit * 3,
    height: '100vh',
    overflow: 'auto'
  },
  h5: {
    marginBottom: theme.spacing.unit * 2
  },
  appTitle: {
    color: '#000',
    fontWeight: 600
  },
  signOutIcon: {
    transform: 'rotate(180deg)'
  },
  menuItem: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    minWidth: 100
  },
  link: {
    textDecoration: 'none',
    outline: 'none'
  }
});

class Dashboard extends React.Component {
  state = {
    sidebarToggle: true,
    accountMenuAnchorEl: null
  };

  handleToggleDrawer = () => {
    this.setState({ sidebarToggle: !this.state.sidebarToggle });
  };

  handleCloseAccountMenu = () => {
    this.setState({ accountMenuAnchorEl: null });
  };

  handleOpenAccountMenu = event => {
    this.setState({ accountMenuAnchorEl: event.currentTarget });
  };

  render() {
    const { classes, children } = this.props;
    const { sidebarToggle, accountMenuAnchorEl } = this.state;
    const accountMenuOpen = Boolean(accountMenuAnchorEl);
    const userType = getUserTypeFromCookie();
    const { userId } = getUserEntity();

    return (
      <div className={classes.root}>
        <Media query="(min-width: 720px)">
          {match => (
            <React.Fragment>
              <AppBar
                position="absolute"
                className={classNames(
                  classes.appBar,
                  match === sidebarToggle && classes.appBarShift
                )}
              >
                <Toolbar
                  disableGutters={!sidebarToggle}
                  className={classes.toolbar}
                >
                  <IconButton
                    color="inherit"
                    aria-label="Open drawer"
                    onClick={this.handleToggleDrawer}
                    className={classNames(
                      classes.menuButton,
                      match === sidebarToggle && classes.menuButtonHidden
                    )}
                  >
                    <MenuIcon />
                  </IconButton>
                  <Typography
                    component="h1"
                    variant="h6"
                    color="inherit"
                    noWrap
                    className={classes.title}
                  >
                    Golden Owl{' '}
                    <span className={classes.appTitle}>{` - Leaves`}</span>
                  </Typography>
                  <div>
                    <IconButton
                      aria-haspopup="true"
                      aria-owns={accountMenuOpen ? 'menu-appbar' : undefined}
                      onClick={this.handleOpenAccountMenu}
                      color="inherit"
                    >
                      <AccountCircleIcon />
                    </IconButton>
                    <Menu
                      anchorEl={accountMenuAnchorEl}
                      id="menu-appbar"
                      anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'right'
                      }}
                      transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right'
                      }}
                      open={accountMenuOpen}
                      onClose={this.handleCloseAccountMenu}
                    >
                      <Link to={{pathname: `/account/info/${userId}`}} className={classes.link}>
                        <MenuItem
                          className={classes.menuItem}
                        >
                          <AssignmentIndIcon className={classes.leftIcon} />
                          <div>Profile</div>
                        </MenuItem>
                      </Link>
                      <Link to={`/logout`} className={classes.link}>
                        <MenuItem
                          className={classes.menuItem}
                        >
                          <SignOutIcon
                            className={classNames(
                              classes.rightIcon,
                              classes.signOutIcon
                            )}
                          />
                          <div>Log out</div>
                        </MenuItem>
                      </Link>
                    </Menu>
                  </div>
                </Toolbar>
              </AppBar>

              <Drawer
                variant={match ? 'permanent' : 'temporary'}
                classes={{
                  paper: classNames(
                    classes.drawerPaper,
                    match && !sidebarToggle && classes.drawerPaperClose
                  )
                }}
                open={match || !sidebarToggle}
              >
                <div className={classes.toolbarIcon}>
                  <IconButton onClick={this.handleToggleDrawer}>
                    <ChevronLeftIcon />
                  </IconButton>
                </div>
                <Divider />
                {/* Left menu */}
                <List>
                  {Object.keys(userTypes).some(
                    key => userTypes[key] === userType
                  ) && <PersonnelList />}
                  {userType === userTypes.MODE_ADMIN && <HRList />}
                </List>
                {/* End - Left menu */}
              </Drawer>
            </React.Fragment>
          )}
        </Media>

        <main className={classes.content}>
          <div className={classes.appBarSpacer} />
          {children}
        </main>
      </div>
    );
  }
}

Dashboard.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(withRouter(Dashboard));
