import React from 'react';
import { connect } from 'react-redux';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { Link } from 'react-router-dom';

//material-ui
import {
  Paper,
  Button,
  Grid,
  CssBaseline,
  TextField,
  Typography,
  Divider
} from '@material-ui/core';

import Icon from '@material-ui/core/Icon';
import { withStyles } from '@material-ui/core/styles';

//components
import SelectCustom from '../../components/CustomSelect';
import DashContainer from '../DashContainer';
import LettersManagement from '../../components/LettersManagement';

import CircularUnderLoad from '../../components/Animation/CircularUnderLoad'

//Icons
import EditIcon from '@material-ui/icons/Edit';

//data mockups
import { mockupGender } from '../../constants/mockups';

//constants
import { userTypes } from '../../constants/permission';

//Helpers
import { getUserEntity } from '../../helpers/authHelpers';
import { getGenderName } from '../../helpers/userHelpers';

//Utilities
import { compareJsonObjectValue, parseUrlLastSegment } from '../../utilities';

//ValidationSchema
import ValidationSchema from './validationSchema';

//API
import Axios, { CancelToken } from 'axios';
import { getAllTeams, getAllPositions } from '../../apiCalls/supportingAPIs';
import { getProfile, updateProfile } from '../../apiCalls/userAPIs';
import { getMyLeaveLetters, getDemandLetterByFilter } from "../../apiCalls/leaveLetterAPI";
import { getDayOff } from '../../apiCalls/userAPIs';
import { getDayOffSetting } from '../../apiCalls/settingAPIs';

//Notif redux
import { NOTIF_ERROR, NOTIF_SUCCESS, USER_LEFT_PAGE } from '../../constants/notification';
import { showNotification } from '../../redux/actions/notificationActions';

const mapDispatchToProps = dispatch => {
  return {
    handleShowNotif: (type, message) =>
      dispatch(showNotification(type, message))
  };
};

const initialValues = {
  fFirstName: '',
  fLastName: '',
  fGender: '',
  fPositionName: '',
  fPhone: '',
  fTeamName: '',
  fEmail: '',
  fTypeId: '',
  fTeamId: '',
  fPosition: ''
}

class EditAccountInfo extends React.Component {
  state = {
    user: Object.assign({}, initialValues),
    editMode: false,
    allTeams: [],
    allPositions: [],
    demandUserId: undefined,
  };

  handleEnableEditMode = enable => {
    this.setState(prevState => ({
      ...prevState,
      editMode: enable
    }));
  };

  loadDemandId = (id) => {
    const { userId, userType } = getUserEntity();
    const queryUserId = id && typeof (id) !== 'undefined' ? id : this.props.match.params.id;

    let demandUserId = userId;

    if (userType === userTypes.MODE_ADMIN && typeof (queryUserId) !== 'undefined') {
      demandUserId = queryUserId;
    }
    if (queryUserId !== this.demandUserId) {
      this.setState(prevState => ({
        ...prevState,
        demandUserId
      }));
    }
  }

  loadUsedDayOffInfo = () => {
    //Load dayOffRemaining
    Axios.all([getDayOff(this.cancelSource.token, this.state.demandUserId), getDayOffSetting(this.cancelSource.token)])
      .then(
        Axios.spread((dayOffRes, settingRes) => {
          let dayOffRemaining = '-', dayOffTotal = '-', dayOffSetting = 0;
          if (dayOffRes.data.success) {
            dayOffRemaining = dayOffRes.data.fYearRemaining;
            dayOffTotal = dayOffRes.data.fYearTotal;
          }

          if (settingRes.data.success) {
            const { settings } = settingRes.data;
            dayOffSetting = settings[0].fValue;
          }
          this.__isMounted && this.setState(prevState => ({
            ...prevState,
            dayOffRemaining,
            dayOffTotal,
            dayOffSetting,
          }));
        })
      )
      .catch(err => {
        if (err.message !== USER_LEFT_PAGE)
          this.props.handleShowNotif && this.props.handleShowNotif(NOTIF_ERROR, `Couldn't load 'Used Day-off'!`);
      });
  }

  loadData = async (demandId) => {
    //For axios' requests cancellation
    this.cancelSource = CancelToken.source();

    await this.loadDemandId(demandId); //must await this 

    let response = await getProfile(this.state.demandUserId);
    let { status: reqStatusProfile, data: reqDataProfile } = response;

    if (reqStatusProfile === 200) {

      this.__isMounted && this.setState(prevState => ({
        ...prevState,
        user: reqDataProfile.user
      }));

      this.loadUsedDayOffInfo();

      Axios.all([getAllTeams(this.cancelSource.token), getAllPositions(this.cancelSource.token)])
        .then(
          Axios.spread((allTeamResponse, allPositionResponse) => {
            let allTeams = allTeamResponse.data.teams.map(item => ({
              value: item.fId,
              label: item.fTeamName
            }));

            let allPositions = allPositionResponse.data.positions.map(item => ({
              value: item.fId,
              label: item.fPosName
            }));

            this.__isMounted && this.setState(prevState => ({
              ...prevState,
              allTeams,
              allPositions
            }));
          }))
        .catch(err => {
          if (err.message !== USER_LEFT_PAGE)
            this.props.handleShowNotif && this.props.handleShowNotif(NOTIF_ERROR, `Couldn't load Positions and Teams!`);
        });
    } else {
      this.props.handleShowNotif && this.props.handleShowNotif(NOTIF_ERROR, `Counldn't load user profile. Try later!`);
    }
  };

  componentDidMount = () => {
    this.__isMounted = true;
    this.unlistenRouteChange = this.props.history.listen((location, action) => {
      const demandId = parseUrlLastSegment(location.pathname);
      // Renew cancelSource
      this.cancelSource = CancelToken.source();
      this.loadData(demandId);
    });
    this.loadData();
  };

  componentWillUnmount = () => {
    this.__isMounted = false;
    this.cancelSource.cancel(USER_LEFT_PAGE);
    this.unlistenRouteChange();
  }

  render() {
    const { classes, handleShowNotif } = this.props;
    const { user, editMode, allTeams, allPositions, demandUserId, dayOffRemaining, dayOffTotal, dayOffSetting } = this.state;

    user.fYearTotal = dayOffTotal;

    const { userId, userType } = getUserEntity();
    const isCurrentLoggedInUser = (userId === demandUserId);
    const isHrSession = userTypes.MODE_ADMIN === userType;
    const isShowLetterList = (isHrSession && !isCurrentLoggedInUser && typeof (demandUserId) !== 'undefined');

    return (
      <DashContainer className={classes.layout}>
        <CssBaseline />
        {compareJsonObjectValue(user, initialValues)
          ?
          <Paper className={classes.paper}>
            <div className={classes.preloadWrapper}>
              <Typography
                component="h3"
                variant="h5"
              >
                User not found! (ID: {demandUserId})
                  </Typography>
              <CircularUnderLoad size={20} />
            </div>
            <Divider />
          </Paper>
          :
          <Paper className={classes.paper}>
            {editMode && isHrSession ? (
              <Formik
                initialValues={user}
                validationSchema={ValidationSchema}
                onSubmit={(values, actions) => {
                  //Call api update here
                  updateProfile(this.state.demandUserId, values)
                    .then(res => {
                      handleShowNotif(
                        NOTIF_SUCCESS,
                        `Updated profile successfully!`
                      );
                      this.loadData();
                      this.handleEnableEditMode(false);
                      actions.setSubmitting(false);
                    })
                    .catch(err => {
                      handleShowNotif(
                        NOTIF_ERROR,
                        `Update failed! (${err.message})`
                      );
                      actions.setSubmitting(false);
                    });
                }}
              >
                {({
                  values,
                  isSubmitting,
                  handleReset,
                  handleSubmit,
                  handleBlur,
                  handleChange
                }) => {
                  const isUserInfoChanged = !compareJsonObjectValue(values, user);
                  return (
                    <Form>
                      {/* Top buttons */}
                      <React.Fragment>
                        <Grid
                          item
                          container
                          xs={12}
                          className={classes.buttonGroupTop}
                        >
                          <Button
                            className={classes.button}
                            size="small"
                            color="primary"
                            variant="contained"
                            onClick={handleSubmit}
                            disabled={isSubmitting || !isUserInfoChanged}
                          >
                            <Icon
                              fontSize="small"
                              className={classes.leftIcon}
                            >
                              save
                              </Icon>
                            SAVE
                            </Button>
                          <Button
                            className={classes.button}
                            size="small"
                            color="secondary"
                            variant="outlined"
                            disabled={isSubmitting}
                            onClick={() => {
                              handleReset();
                              this.handleEnableEditMode(false);
                            }}
                          >
                            {!isUserInfoChanged ? (
                              <React.Fragment>
                                <Icon
                                  fontSize="small"
                                  className={classes.leftIcon}
                                >
                                  cancel
                                  </Icon>
                                Cancel
                                </React.Fragment>
                            ) : (
                                <React.Fragment>
                                  <Icon
                                    fontSize="small"
                                    className={classes.leftIcon}
                                  >
                                    delete_sweep
                                  </Icon>
                                  Discard
                                </React.Fragment>
                              )}
                          </Button>
                        </Grid>
                      </React.Fragment>
                      {/* End - Top buttons */}
                      <React.Fragment>
                        <Typography
                          variant="h5"
                          align="center"
                          component="h1"
                          className={classes.formTitle}
                        >
                          Edit {isCurrentLoggedInUser ? ' My ' : ` ${user.fFirstName} `} Profile
                          </Typography>
                      </React.Fragment>
                      <React.Fragment>
                        {/** First name */}
                        <Grid container spacing={16}>
                          <Grid item xs={12} sm={6}>
                            <Field
                              name="fFirstName"
                              render={({ field }) => {
                                return (
                                  <TextField
                                    fullWidth
                                    label="First name"
                                    name={field.name}
                                    value={field.value}
                                    onBlur={handleBlur}
                                    onChange={handleChange}
                                  />
                                );
                              }}
                            />
                            <ErrorMessage name='fFirstName'>
                              {msg => (
                                <div className={classes.errorMessage}>
                                  {msg}
                                </div>
                              )}
                            </ErrorMessage>
                          </Grid>
                          {/** Last name */}
                          <Grid item xs={12} sm={6}>
                            <Field
                              name="fLastName"
                              render={({ field }) => {
                                return (
                                  <TextField
                                    fullWidth
                                    label="Last name"
                                    name={field.name}
                                    value={field.value}
                                    onBlur={handleBlur}
                                    onChange={handleChange}
                                  />
                                );
                              }}
                            />
                            <ErrorMessage name='fLastName'>
                              {msg => (
                                <div className={classes.errorMessage}>
                                  {msg}
                                </div>
                              )}
                            </ErrorMessage>
                          </Grid>
                          {/** Gender name */}
                          <Grid item xs={12} sm={6}>
                            <Field
                              name="fGender"
                              render={({ field, form }) => {
                                return (
                                  <SelectCustom
                                    name={field.name}
                                    label="Gender"
                                    value={field.value}
                                    options={mockupGender}
                                    onChange={handleChange}
                                  />
                                );
                              }}
                            />
                          </Grid>
                          {/** fEmail  */}
                          <Grid item xs={12} sm={6}>
                            <Field
                              name="fEmail"
                              render={({ field, form }) => {
                                return (
                                  <TextField
                                    fullWidth
                                    label="Email"
                                    name={field.name}
                                    value={field.value}
                                    onBlur={handleBlur}
                                    onChange={handleChange}
                                  />
                                );
                              }}
                            />
                            <ErrorMessage name='fEmail'>
                              {msg => (
                                <div className={classes.errorMessage}>
                                  {msg}
                                </div>
                              )}
                            </ErrorMessage>
                          </Grid>
                          {/** fPhone number  */}
                          <Grid item xs={12} sm={6}>
                            <Field
                              name="fPhone"
                              render={({ field, form }) => {
                                return (
                                  <TextField
                                    fullWidth
                                    label="Phone"
                                    value={field.value}
                                    name={field.name}
                                    onBlur={handleBlur}
                                    onChange={handleChange}
                                  />
                                );
                              }}
                            />
                            <ErrorMessage name='fPhone'>
                              {msg => (
                                <div className={classes.errorMessage}>
                                  {msg}
                                </div>
                              )}
                            </ErrorMessage>
                          </Grid>
                          {!isHrSession ? null : (
                            <React.Fragment>
                              {/** fTeamName name */}
                              <Grid item xs={12} sm={6}>
                                <Field
                                  name="fTeamId"
                                  render={({ field }) => {
                                    return (
                                      <SelectCustom
                                        name={field.name}
                                        label="Team"
                                        value={field.value}
                                        options={allTeams}
                                        onChange={handleChange}
                                      />
                                    );
                                  }}
                                />
                              </Grid>
                              {/** fPositionName name */}
                              <Grid item xs={12} sm={6}>
                                <Field
                                  name="fPosition"
                                  render={({ field }) => {
                                    return (
                                      <SelectCustom
                                        name={field.name}
                                        label="Position"
                                        value={field.value}
                                        options={allPositions}
                                        onChange={handleChange}
                                      />
                                    );
                                  }}
                                />
                              </Grid>
                            </React.Fragment>
                          )}
                        </Grid>
                        {/** day-off  */}
                        <Grid item xs={12} sm={6}>
                          <Field
                            name="fYearTotal"
                            render={({ field, form, ...otherProps }) => {
                              return (
                                <TextField
                                  fullWidth
                                  label="Remaining day-off"
                                  type="number"
                                  inputProps={{ min: 0, max: dayOffSetting, step: 0.5 }}
                                  value={field.value}
                                  name={field.name}
                                  onChange={handleChange}
                                />
                              );
                            }}
                          />
                          <ErrorMessage name="dayOff">
                            {msg => (
                              <div style={{
                                color: 'red',
                                fontSize: 12,
                                fontWeight: 500
                              }}>
                                {msg}
                              </div>
                            )}
                          </ErrorMessage>
                        </Grid>
                      </React.Fragment>
                      <React.Fragment>
                        {/* Bottom buttons */}
                        <Grid item xs={12} className={classes.buttonGroupBottom}>
                          <Button
                            size="small"
                            color="primary"
                            variant="contained"
                            onClick={handleSubmit}
                            disabled={isSubmitting || !isUserInfoChanged}
                            className={classes.button}
                          >
                            <Icon fontSize="small" className={classes.leftIcon}>
                              save
                              </Icon>
                            SAVE
                            </Button>
                          <Button
                            size="small"
                            color="secondary"
                            variant="outlined"
                            className={classes.button}
                            disabled={isSubmitting}
                            onClick={() => {
                              handleReset();
                              this.handleEnableEditMode(false);
                            }}
                          >
                            {!isUserInfoChanged ? (
                              <React.Fragment>
                                <Icon
                                  fontSize="small"
                                  className={classes.leftIcon}
                                >
                                  cancel
                                  </Icon>
                                Cancel
                                </React.Fragment>
                            ) : (
                                <React.Fragment>
                                  <Icon
                                    fontSize="small"
                                    className={classes.leftIcon}
                                  >
                                    delete_sweep
                                  </Icon>
                                  Discard
                                </React.Fragment>
                              )}
                          </Button>
                        </Grid>
                      </React.Fragment>
                    </Form>
                  );
                }}
              </Formik>
            ) : (
                <React.Fragment>
                  <div className={classes.topInfo}>
                    {demandUserId && <Link to={`/password/${demandUserId}`}>
                      <Button
                        className={classes.button}
                        size="small"
                        color="default"
                        variant="contained"
                        onClick={() => this.handleEnableEditMode(true)}
                      >
                        <EditIcon className={classes.leftIcon} />
                        Change Password
                      </Button>
                    </Link>
                    }
                    {isHrSession ? (
                      <Button
                        className={classes.button}
                        size="small"
                        color="default"
                        variant="contained"
                        onClick={() => this.handleEnableEditMode(true)}
                      >
                        <EditIcon className={classes.leftIcon} />
                        Edit
                      </Button>
                    ) : null}
                  </div>

                  {/* Title */}
                  <Typography component="h1" variant="h4">
                    {isCurrentLoggedInUser ? 'My Profile' : `${user.fFirstName}'s Profile`}
                  </Typography>
                  {/** End - Title */}
                  {/* User ID */}
                  {demandUserId && <div>{`ID: #${demandUserId}`.toLocaleUpperCase()}</div>}
                  {/** End - User ID */}
                  <Divider />
                  {/* User info fields */}
                  <Grid container spacing={16} className={classes.groupInfo}>
                    {/* First name  */}
                    <Grid item xs={12} sm={6} className={classes.fieldWrapper}>
                      <div className={classes.fieldTitle}>
                        First name:
                        <span className={classes.fieldValue}>{` ${
                          user.fFirstName
                          }`}</span>
                      </div>
                    </Grid>
                    {/* last name  */}
                    <Grid item xs={12} sm={6} className={classes.fieldWrapper}>
                      <div className={classes.fieldTitle}>
                        Last name:
                        <span className={classes.fieldValue}>{` ${
                          user.fLastName
                          }`}</span>
                      </div>
                    </Grid>
                    {/* Gender */}
                    <Grid item xs={12} sm={6} className={classes.fieldWrapper}>
                      <div className={classes.fieldTitle}>
                        Gender:
                        <span className={classes.fieldValue}>{` ${getGenderName(
                          user.fGender
                        )}`}</span>
                      </div>
                    </Grid>
                    {/* Phone */}
                    <Grid item xs={12} sm={6}>
                      <div className={classes.fieldTitle}>
                        Phone:
                        <span className={classes.fieldValue}>{` ${
                          user.fPhone
                          }`}</span>
                      </div>
                    </Grid>
                    {/* Email */}
                    <Grid item xs={12} sm={6}>
                      <div className={classes.fieldTitle}>
                        Email:
                        <span className={classes.fieldValue}>{` ${
                          user.fEmail
                          }`}</span>
                      </div>
                    </Grid>
                  </Grid>
                  <Grid container spacing={16} className={classes.groupInfo}>
                    {/* Position name */}
                    <Grid item xs={12} sm={6}>
                      <div className={classes.fieldTitle}>
                        Position:
                        <span className={classes.fieldValue}>{` ${
                          user.fPositionName
                          }`}</span>
                      </div>
                    </Grid>
                    {/* Team name */}
                    <Grid item xs={12} sm={6}>
                      <div className={classes.fieldTitle}>
                        Team:
                        <span className={classes.fieldValue}>{` ${
                          user.fTeamName
                          }`}</span>
                      </div>
                    </Grid>
                    {/* Remaining day-off */}
                    <Grid item xs={12} sm={6}>
                      <div className={classes.fieldTitle}>
                        Remaining day-off:
                      <span className={classes.fieldValue}>{` ${dayOffRemaining}/${dayOffTotal} (this year)`}</span>
                      </div>
                    </Grid>
                  </Grid>
                </React.Fragment>
              )}
          </Paper>
        }
        {isShowLetterList ?
          (
            <React.Fragment>
              <LettersManagement
                title='Request letters'
                api={getMyLeaveLetters}
                filterAPI={getDemandLetterByFilter}
                demandUserId={demandUserId}
              />
            </React.Fragment>
          ) : null
        }
      </DashContainer>
    );
  }
}


const styles = theme => ({
  layout: {
    width: 'auto',
    marginLeft: theme.spacing.unit * 2,
    marginRight: theme.spacing.unit * 2,
    [theme.breakpoints.up(600 + theme.spacing.unit * 2 * 2)]: {
      minWidth: 600,
      marginLeft: 'auto',
      marginRight: 'auto'
    }
  },
  paper: {
    marginTop: theme.spacing.unit * 3,
    marginBottom: theme.spacing.unit * 3,
    padding: theme.spacing.unit * 3,
    [theme.breakpoints.up(600 + theme.spacing.unit * 3 * 2)]: {
      marginTop: theme.spacing.unit * 6,
      marginBottom: theme.spacing.unit * 6,
      padding: theme.spacing.unit * 3,
      paddingBottom: theme.spacing.unit * 6
    }
  },
  buttonGroupTop: {
    justifyContent: 'flex-start',
    marginBottom: theme.spacing.unit * 3,
    [theme.breakpoints.down('xs')]: {
      display: 'none'
    },
    [theme.breakpoints.up('sm')]: {
      display: 'flex'
    }
  },
  buttonGroupBottom: {
    justifyContent: 'flex-end',
    marginTop: theme.spacing.unit * 6,
    [theme.breakpoints.up('sm')]: {
      display: 'none'
    },
    [theme.breakpoints.down('xs')]: {
      display: 'flex'
    }
  },
  button: {
    marginLeft: theme.spacing.unit,
    // width: 100
  },
  leftIcon: {
    marginRight: theme.spacing.unit
  },
  rightIcon: {
    marginLeft: theme.spacing.unit
  },
  smallIcon: {
    fontSize: 20
  },
  formTitle: {
    marginBottom: theme.spacing.unit * 2
  },
  fieldTitle: {
    color: 'black',
    fontWeight: 600,
    minWidth: 50,
    [theme.breakpoints.down('xs')]: {
      overflow: 'scroll'
    }
  },
  fieldValue: {
    color: 'black',
    fontWeight: 500
  },
  fieldWrapper: {
    paddingTop: 0,
    paddingBottom: 0,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alighItems: 'center'
  },
  groupInfo: {
    marginTop: theme.spacing.unit
  },
  topInfo: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alighItems: 'center',
    marginBottom: theme.spacing.unit
  },
  preloadWrapper: {
    display: "flex",
    alignItems: "center",
    flexDirection: "column",
    justifyContent: "center",
    marginBottom: theme.spacing.unit,
  },
  errorMessage: {
    color: 'red',
    fontSize: 12,
    fontWeight: 500
  },
});

export default withStyles(styles)(
  connect(null, mapDispatchToProps)(EditAccountInfo)
);
