import React from 'react';
import moment from 'moment';
import classNames from 'classnames';
import { connect } from 'react-redux';
import { Formik, Form, Field } from 'formik';
import {
  Paper,
  CssBaseline,
  Typography,
  Button,
  Grid,
  Divider
} from '@material-ui/core';
import { green } from '@material-ui/core/colors';
import { withStyles } from '@material-ui/core/styles';

// icons
import {
  ArrowBackIosOutlined as ArrowBackIcon,
  DoneOutlined as DoneIcon,
  RemoveCircleOutline as RemoveCircleIcon
} from '@material-ui/icons';

//components
import RequestStatusPill from '../../components/RequestStatusPill';
import LetterCancelingDialog from '../../components/Dialogs/LetterCancelingDialog';
import ConfirmButton from './ConfirmButton'

//containers
import DashContainer from '../DashContainer';

// Helper
import { getLeaveType } from '../../helpers/leaveLetterHelper';
import { getUserId } from '../../helpers/authHelpers';

// API
import { getLeaveLetterDetails } from '../../apiCalls/leaveLetterAPI';
import { getProfile } from '../../apiCalls/userAPIs';
import { 
  approveLeaveLetterRequest, 
  rejectLeaveLetterRequest
} from '../../apiCalls/leaveLetterAPI';

// Notification redux
import {
  showNotification,
  hideNotification
} from '../../redux/actions/notificationActions';
import { NOTIF_ERROR, NOTIF_SUCCESS } from '../../constants/notification';


// Constants
import {
  LEAVE_REQUEST_APPROVED,
  LEAVE_REQUEST_PENDING,
} from '../../constants/requestStatusType';
import { DATE_FORMAT_HALF } from '../../constants/dateTimeFormats'

import {
  DaySessionOptions
} from '../../constants/leaveDurationOptions';

import { responseUserPermission } from '../../constants/permission';

//utilities
import { parseUrlLastSegment } from '../../utilities';

class LeaveRequestDetail extends React.Component {
  constructor() {
    super();
    this.state = {
      userInfo: {},
      leaveLetter: {},
      demandUser: null,
      rejectDialogOpen: false,
    };
  }

  handleToggleRejectDialog = async (value = true) => {
    this.__isMounted && this.setState(prevState => ({
      ...prevState,
      rejectDialogOpen: value
    }));
  }

  // Handle approving
  handleApprove = ({setSubmitting, resetForm }) => {
    const { handleShowNotif } = this.props;
    const { leaveLetter: { fUserId, fId } } = this.state;
    //call api
    approveLeaveLetterRequest(
      fId,
      fUserId,
      LEAVE_REQUEST_APPROVED
    )
      .then(res => {
        handleShowNotif(
          NOTIF_SUCCESS,
          `Leave request updated successfully!`
        );
        this.loadData();
        resetForm();
      })
      .catch(err => {
        handleShowNotif(
          NOTIF_ERROR,
          `Action failed (${err.message})!`
        );
        setSubmitting(false);
      });
  }

  //Handle rejecting 
  handleReject = ({setSubmitting, resetForm, errors, values: {rejectReason}}) => {
    if (errors && Object.keys(errors).length === 0) {
      const { handleShowNotif } = this.props;
      const { fId } = this.state.leaveLetter;
      // call update status api
      rejectLeaveLetterRequest(fId, rejectReason)
        .then(res => {
          handleShowNotif(
            NOTIF_SUCCESS,
            `Leave request updated successfully!`
          );
          resetForm();
          this.loadData();
        })
        .catch(err => {
          handleShowNotif(
            NOTIF_ERROR,
            `Action failed! (${err.message})`
          );
          setSubmitting(false);
        });
    }
  }

  loadData = async () => {
    this.demandLetterId = parseUrlLastSegment(this.props.location.pathname);
    
    let response = await getLeaveLetterDetails(this.demandLetterId);
    let {
      status: statusLetter,
      data: { success: successLetter, leaveLetter }
    } = response;
    if (statusLetter !== 200 || successLetter !== true || !leaveLetter) return;

    response = await getProfile(leaveLetter.fUserId);
    let {
      status: statusUser,
      data: { success: successUser, user: userInfo }
    } = response;
    if (statusUser !== 200 || successUser !== true || !userInfo) return;

    response = await getProfile(getUserId());
    let {
      status: statusDemandUser,
      data: { success: successDemandUser, user: demandInfo }
    } = response;
    if(statusDemandUser !== 200 || successDemandUser !== true || !demandInfo) return;

    this.__isMounted && this.setState({ leaveLetter, userInfo, demandUser: demandInfo });
  };

  componentDidMount = () => {
    this.__isMounted = true;
    //First request
    this.loadData();
  };

  componentWillUnmount = () => {
    this.__isMounted = false;
  }

  render() {
    const { history, classes, initialValues } = this.props;
    const { userInfo, leaveLetter, demandUser, rejectDialogOpen } = this.state;

    return (
      <DashContainer>
        <Paper className={classes.paper}>
          <CssBaseline />
          <Formik
            validate={(values) => {
              let errors = {};
              if (rejectDialogOpen) {
                if (values.rejectReason.length < 20  ) 
                  errors.rejectReason = `'Reject reason' can't be less than 20 characters`;
                else if (values.rejectReason.length > 250 )
                  errors.rejectReason = `'Reject reason' can't be more than 250 characters`;
              }
              return errors;
            }}
            validateOnBlur={true}
            initialValues={initialValues}
          >
            {({
              handleReset,
              isSubmitting,
            }) => {
              
              return (
                <Form className={classes.form}>
                  <Grid item container xs={12} className={classes.topInfo}>
                    <Button
                      size="small"
                      color="default"
                      variant="contained"
                      className={classes.button}
                      onClick={() => history.goBack()}
                    >
                      <ArrowBackIcon className={classes.leftIcon} />
                      Back
                    </Button>
                    <RequestStatusPill 
                      statusType={leaveLetter.fStatus} 
                      rejectType={leaveLetter.fRejectType && leaveLetter.fRejectType}
                    />
                  </Grid>
                  {/* Form title */}
                  <Typography component="h1" variant="h5">
                    Request detail
                  </Typography>
                  {/* End - Form title */}
                  {/* Request Id */}
                  {leaveLetter.fId && <div>{`ID: #${leaveLetter.fId}`.toLocaleUpperCase()}</div>}
                  {/* End - Request Id */}
                  <Divider />
                  {/* End - Form title */}
                  {/* Letter content */}
                  <React.Fragment>
                    <Grid container spacing={24} className={classes.leaveInfo}>
                      {/** User info  */}
                      <Grid item container xs={12} spacing={8}>
                        {/** FIRST NAME, LAST NAME */}
                        <Grid item xs={12} className={classes.fieldWrapper}>
                          <div className={classes.fieldTitle}>
                            Creator:
                            <span className={classes.fieldValue}>{ (!userInfo.fFirstName && !userInfo.fLastName) ? null : ` ${
                              userInfo.fFirstName
                            } ${userInfo.fLastName}`}</span>
                          </div>
                        </Grid>
                        {/** CURRENT POSITION */}
                        <Grid
                          item
                          xs={12}
                          sm={6}
                          className={classes.fieldWrapper}
                        >
                          <div className={classes.fieldTitle}>
                            Position:
                            <span className={classes.fieldValue}>{ !userInfo.fPositionName ? null :` ${
                              userInfo.fPositionName
                            }`}</span>
                          </div>
                        </Grid>
                        {/** TEAM */}
                        <Grid
                          item
                          xs={12}
                          sm={6}
                          className={classes.fieldWrapper}
                        >
                          <div className={classes.fieldTitle}>
                            Team:
                            <span className={classes.fieldValue}>{!userInfo.fTeamName ? null :` ${
                              userInfo.fTeamName
                            }`}</span>
                          </div>
                        </Grid>
                        {/** EMAIL */}
                        <Grid
                          item
                          xs={12}
                          sm={6}
                          className={classes.fieldWrapper}
                        >
                          <div className={classes.fieldTitle}>
                            Email:
                            <span className={classNames(classes.fieldValue, classes.email)}>{!userInfo.fEmail ? null :` ${
                              userInfo.fEmail
                            }`}</span>
                          </div>
                        </Grid>
                        {/** PHONE NUM */}
                        <Grid
                          item
                          xs={12}
                          sm={6}
                          className={classes.fieldWrapper}
                        >
                          <div className={classes.fieldTitle}>
                            Phone:
                            <span className={classes.fieldValue}>{!userInfo.fPhone ? null :` ${
                              userInfo.fPhone
                            }`}</span>
                          </div>
                        </Grid>
                      </Grid>
                      {/** End - User info */}
                      {/** Leave-letter info */}
                      <Grid item container spacing={8}>
                        {/** Leave Type */}
                        <Grid item xs={12} className={classes.fieldWrapper}>
                          <div className={classes.fieldTitle}>
                            Leave Type:
                            <span
                              className={classes.fieldValue}
                            >{!leaveLetter.fAbsenceType ? null :` ${getLeaveType(
                              leaveLetter.fAbsenceType
                            )}`}</span>
                          </div>
                        </Grid>
                        {/** FromDT */}
                        <Grid item xs={6} className={classes.fieldWrapper}>
                          <div className={classes.fieldTitle}>
                            From:
                            <span className={classes.fieldValue}>{!leaveLetter.fFromDT ? null :` ${moment(leaveLetter.fFromDT).format(DATE_FORMAT_HALF)} (${DaySessionOptions[leaveLetter.fFromOpt]})`}</span>
                          </div>
                        </Grid>
                        {/** ToDT */}
                        <Grid item xs={6} className={classes.fieldWrapper}>
                          <div className={classes.fieldTitle}>
                            To:
                            <span className={classes.fieldValue}>{!leaveLetter.fToDT ? null :` ${moment(leaveLetter.fToDT).format(DATE_FORMAT_HALF)} (${DaySessionOptions[leaveLetter.fToOpt]})`}</span>
                          </div>
                        </Grid>
                        {/** Reason */}
                        <Grid item xs={12} className={classes.fieldWrapper}>
                          <div className={classes.fieldTitle}>
                            Reason:
                            <span className={classes.fieldValue}>{!leaveLetter.fReason ? null :` ${
                              leaveLetter.fReason
                            }`}</span>
                          </div>
                        </Grid>
                        {/** End - Leave-letter info */}
                      </Grid>
                    </Grid>
                  </React.Fragment>
                  {/* End - Letter content */}
                  {/* Bottom buttons */}
                  {leaveLetter.fStatus === LEAVE_REQUEST_PENDING 
                    ? (
                      <React.Fragment>
                        <Grid
                          item
                          container
                          xs={12}
                          spacing={8}
                          className={classes.buttonGroupBottom}
                        >
                        {demandUser.fTypeId === responseUserPermission.ADMIN ? (
                          <React.Fragment>
                            <Field
                            render={({ field, form }) => (
                              <ConfirmButton
                                onAgree={() => this.handleApprove(form)}
                                className={classNames(
                                  classes.button,
                                  classes.btnApprove
                                )}
                                size="small"
                                variant="contained"
                                color="primary"
                                disabled={isSubmitting}
                              >
                                <DoneIcon />
                                Approve
                              </ConfirmButton>
                            )}
                          />
                          <Field
                            render={({ field, form: {setFieldTouched} }) => (
                              <Button
                                className={classes.button}
                                size="small"
                                color="secondary"
                                variant="contained"
                                disabled={isSubmitting}
                                onClick={() => {
                                  setFieldTouched(field.name, true)
                                  this.handleToggleRejectDialog(true);
                                }}
                              >
                                <RemoveCircleIcon className={classes.leftIcon} />
                                Reject
                              </Button>
                            )}
                          />
                          </React.Fragment>
                        ) : (
                          <Field
                          render={({ field, form: {setFieldTouched} }) => (
                            <Button
                              className={classes.button}
                              size="small"
                              color="secondary"
                              variant="contained"
                              disabled={isSubmitting}
                              onClick={() => {
                                setFieldTouched(field.name, true)
                                this.handleToggleRejectDialog(true)
                              }}
                            >
                              <RemoveCircleIcon className={classes.leftIcon} />
                              Cancel
                            </Button>
                          )}
                          />
                        )}

                        </Grid>
                      </React.Fragment>
                    ) : null
                  }
                  {/* End - Top buttons */}
                  {/** Reject/Cancel Dialog */}
                  <React.Fragment>
                      <Field 
                        name='rejectReason'
                        open={rejectDialogOpen}
                        component={LetterCancelingDialog}
                        title={demandUser && demandUser.fTypeId === responseUserPermission.ADMIN ? 'Reject' : 'Cancel'}
                        onConfirm={async (form) => {
                          this.handleReject(form);
                          this.handleToggleRejectDialog(false);
                          handleReset();
                        }}
                        onClose={() => {
                          this.handleToggleRejectDialog(false);
                          handleReset();
                        }}
                      />
                  </React.Fragment>
                  {/** End - Reject/Cancel Dialog */}
                </Form>
              );
            }}
          </Formik>
        </Paper>
      </DashContainer>
    );
  }
}

LeaveRequestDetail.defaultProps = {
  initialValues: {
    rejectReason: ''
  }
};

const mapDispatchToProps = dispatch => {
  return {
    handleShowNotif: (type, message) =>
      dispatch(showNotification(type, message)),
    handleHideNotif: () => dispatch(hideNotification())
  };
};

const styles = theme => ({
  layout: {
    width: 'auto',
    marginLeft: theme.spacing.unit * 2,
    marginRight: theme.spacing.unit * 2,
    [theme.breakpoints.up(600 + theme.spacing.unit * 2 * 2)]: {
      minWidth: 800,
      marginLeft: 'auto',
      marginRight: 'auto'
    }
  },
  paper: {
    marginTop: theme.spacing.unit * 3,
    marginBottom: theme.spacing.unit * 3,
    paddingTop: theme.spacing.unit * 2,
    paddingBottom: theme.spacing.unit * 2,
    [theme.breakpoints.up(600 + theme.spacing.unit * 3 * 2)]: {
      marginTop: theme.spacing.unit * 6,
      marginBottom: theme.spacing.unit * 6,
      padding: theme.spacing.unit * 2
    }
  },
  form: {
    width: '100%', // Fix IE 11 issue.
    marginTop: theme.spacing.unit,
    marginBottom: theme.spacing.unit,
    paddingLeft: theme.spacing.unit * 4,
    paddingRight: theme.spacing.unit * 4
  },
  leaveInfo: {
    marginTop: theme.spacing.unit * 3
  },
  submit: {
    marginTop: theme.spacing.unit * 6
  },
  preload: {
    marginTop: theme.spacing.unit * 3
  },
  buttonGroupBottom: {
    display: 'flex',
    justifyContent: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    [theme.breakpoints.down(360)]: {
      justifyContent: 'space-between'
    },
    marginTop: theme.spacing.unit * 6
  },
  button: {
    [theme.breakpoints.up(360)]: {
      marginLeft: theme.spacing.unit
    }
  },
  btnApprove: {
    color: 'white',
    backgroundColor: green[500],
    '&:hover': {
      backgroundColor: green[700]
    }
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
  topInfo: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.unit * 3
  },
  email: {
    wordBreak: 'break-all'
  }
});

export default connect(
  null,
  mapDispatchToProps
)(withStyles(styles)(LeaveRequestDetail));
