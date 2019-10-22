import moment from 'moment-timezone';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import React, { Component, Fragment } from 'react';
import MUIDataTable from 'mui-datatables';
import ExcelExporter from './ExcelExporter';
import { Typography, Button, withStyles } from '@material-ui/core';
import { MuiThemeProvider, createMuiTheme } from "@material-ui/core";


import { CancelToken } from 'axios';
/**
 * Constants
 */
import { letterColors, letterStatusText, dayOfWeek, defaultColumns, HRColumns, defaultExportColumns, HRExportColumns } from "../constants/letter";
import { REJECT_TYPE } from '../constants/rejectType'; 
import { userTypes } from '../constants/permission';

// Components
import LetterManagementToolbar from './LetterManagementToolbar';

/**
 * Helpers 
 */
import { getUserId } from '../helpers/authHelpers';
import { formatRow } from "../helpers/excelFormatter";


// Notification redux
import {
  showNotification,
} from '../redux/actions/notificationActions';
import { NOTIF_ERROR, NOTIF_SUCCESS } from '../constants/notification';

// letterFilter redux
import {
  letterFilterChangeAll
} from '../redux/actions/letterFilterActions';

//overrides theme
const materialTheme = createMuiTheme({
  overrides: {
    MUIDataTableToolbar: {
      left: {
        flex: '1',
      },
      actions: {
        flex: '2',
      }
    },
    MuiFormControl: {
      root: {
        width: '135px',
        margin: '0 5px 0 0 !important',
      }
    }
  }
})


const getDate = (rawDate = '') => {
  const date = moment(rawDate).isValid() && moment.tz(rawDate, 'Asia/Bangkok');
  return !date ?
    'Invalid date' :
    dayOfWeek[date.day()] + ', ' + date.format('DD/MM/YYYY');
};

class LetterManagement extends Component {
  constructor(props) {
    super(props);
    this.state = {
      page: 1,
      size: 10,
      count: 0,
      letters: [],
      exports: []
    };
    this.downloadTriggerRef = React.createRef();
  }
  
  componentDidMount = () => {
    this.__isMounted = true;
    this.cancelSource = CancelToken.source();
    this.props.filterValues !== undefined ? this.loadDataWithFilter() : this.loadDataWithoutFilter();
  };

  componentWillUnmount = () => {
    this.__isMounted = false;
    this.cancelSource.cancel('Request cancelled by user!');
  }

  loadDataWithoutFilter = async () => {
    const { demandUserId } = this.props;
    try {
      const {
        data: { success, leaveLetters: letters, count }
      } = await this.props.api(this.cancelSource.token, 1, 10, demandUserId);

      if (success) 
      // Austin is here
        this.__isMounted 
        && this.setState({ letters: [], count }, () => {
          this.props.handleShowNotif(NOTIF_SUCCESS, `Load data complete!`)
        });
    } catch (err) {
      this.props.handleShowNotif(NOTIF_ERROR, `Load data failed! (${err.message})`)
    }
  }

  loadDataWithFilter = async () => {
    this.handleFilterValueChange(this.props.filterValues);
  }

  handleFilterValueChange = async (values, formikActions = undefined) => {
    const { demandUserId, type } = this.props;
    const fromDate = new Date(values.fromDate),
          toDate   = new Date(values.toDate);

    let userId;
    if (type && type === userTypes.MODE_HR) {
      userId = '';
    } else {
      if (demandUserId !== undefined) {
        userId = demandUserId;
      }
      else {
        userId = getUserId();
      }
    }
    // below `try-catch` block maybe have same logic to this.handleChangePageWithFilter
    try {
      const fromMonth = fromDate.getMonth() + 1,
            toMonth   = toDate.getMonth() + 1,
            fromYear  = fromDate.getFullYear(),
            toYear    = toDate.getFullYear();
      const filterData = {
        userId, 
        fromMonth,
        fromYear, 
        toMonth, 
        toYear, 
        status: values.status,
      }
      const { 
        data: { success, leaveLetters, count }
      } = await this.props.filterAPI( this.cancelSource.token, filterData);
      if (success && this.__isMounted) {
        formikActions !== undefined && this.props.handleChangeFilterValue({
          toDate,
          fromDate,
          status: values.status
        });
        // Austin is here
        this.setState(
          {
            count,
            letters: []/* leaveLetters */,
          }, () => {
            this.props.handleShowNotif(NOTIF_SUCCESS, `Load data completed!`)
            formikActions !== undefined && formikActions.setSubmitting(false)
          }
        );
      }
    }
    catch (err) {
      this.props.handleShowNotif(NOTIF_ERROR, `Load data failed! (${err.message})`)
      formikActions !== undefined && formikActions.setSubmitting(false)
    }
  }

  handleExport = async () => {
    try {
      const { data: { success, leaveLetters: exports }
      } = await this.props.api(this.cancelSource.token, 0); // get all
      if (success) 
        this.__isMounted && this.setState({ exports }, () => {
          this.downloadTriggerRef.current.click();
          this.__isMounted 
          && this.setState(
            { exports: [] }, // release memory
            () => this.props.handleShowNotif(NOTIF_SUCCESS, `Data export completed!`));
        });
    }
    catch(err) {
      this.props.handleShowNotif(NOTIF_ERROR, `Data export failed! (${err.message})`)
    }
  };

  handleChangePage = (size = 10, page = 1, demandUserId) => {
    this.props.api(this.cancelSource.token, page, size, demandUserId)
    .then(({ data: { success, leaveLetters: letters, count } }) => 
      this.__isMounted && success 
      && this.setState(
        { letters, 
          count,
          page,
          size 
        }, () => this.props.handleShowNotif(NOTIF_SUCCESS, `Load data completed!`)
      )
    )
    .catch(error => {
      this.props.handleShowNotif(NOTIF_ERROR, `Action failed! (${error.message})`)
    });
  };

  handleChangPageWithFilter = async (size=10, page=1, demandUserId) => {
    const { fromDate, toDate, status } = this.props.filterValues;
    try {
      const fromMonth = fromDate.getMonth() + 1,
            toMonth   = toDate.getMonth() + 1,
            fromYear  = fromDate.getFullYear(),
            toYear    = toDate.getFullYear();
      const filterData = {
        userId: demandUserId, 
        fromMonth,
        fromYear, 
        toMonth, 
        toYear, 
        status,
        page,
        size,
      }
      const { 
        data: { success, leaveLetters, count }
      } = await this.props.filterAPI( this.cancelSource.token, filterData);
      if (success && this.__isMounted) {
        this.setState(
          {
            count,
            letters: leaveLetters,
            page,
            size,
          }, () => {
            this.props.handleShowNotif(NOTIF_SUCCESS, `Load data completed!`)
          }
        );
      }
    }
    catch (err) {
      this.props.handleShowNotif(NOTIF_ERROR, `Action failed! (${err.message})`)
    }
  }

  render() {
    const { letters, exports } = this.state;
    const { classes, title, type, demandUserId } = this.props;
    const handleChangePageFunc = this.props.filterValues !== undefined ? this.handleChangPageWithFilter : this.handleChangePage;

    const tableInfo = {
      columns: type === userTypes.MODE_HR ? HRColumns : defaultColumns,
      title: <Typography component='p' variant='h5' className={classes.title}> {title} </Typography>,
      data: Array.isArray(letters)
        ? letters.map(({ fUserFullName, fFromDT, fToDT, fStatus, fId, fRdt, fRejectType }) => {
          const dataSet = [
            getDate(fRdt),
            getDate(fFromDT),
            getDate(fToDT),
            <span style={{ color: letterColors[fStatus] }} >
                  { fRejectType && fRejectType === REJECT_TYPE.BY_SELF? `CANCELED` : letterStatusText[fStatus]  }
                </span>,
            <Link
              to={`/leave-request/${fId}`}
              className={classes.btnLink}
            >
              <Button variant='contained' color='primary'>
                Details
              </Button>
            </Link>
          ];
          if (type === userTypes.MODE_HR) dataSet.unshift(fUserFullName || 'Unknown');
          return dataSet;
        }) : [],
      options: {
        print: false,
        filter: false,
        search: false,
        download: false,
        serverSide: true,
        viewColumns: false,
        responsive: 'scroll',
        selectableRows: false,
        count: this.state.count,
        rowsPerPage: this.state.size,
        rowsPerPageOptions: [5, 10, 15, 20],
        onChangeRowsPerPage: size => handleChangePageFunc(size, 1, demandUserId),
        onTableChange: (action, tableState) => {
					console.log(`TCL: render -> action`, action)
					console.log(`TCL: render -> tableState`, tableState)
          action === 'changePage' && handleChangePageFunc(tableState.rowsPerPage, tableState.page + 1, demandUserId)
        },
        customToolbar: () => {
          return (
            <LetterManagementToolbar
              filterValues={this.props.filterValues}
              onExport={this.handleExport}
              onFilterValueChange={this.handleFilterValueChange}
            />
          )
        },
      }
    };

    const sheets =  [
      {
        dataSet: [{
          columns:
            type === userTypes.MODE_HR
              ? HRExportColumns
              : defaultExportColumns,
          data: exports.map(({ fUserFullName, fApproverFullName,
            fSubstituteFullName, fFromDT, fToDT, fFromOpt, fToOpt, fStatus, fRdt, fRejectType }) => {
            const row = [
              { value: getDate(fRdt) },
              { value: `${getDate(fFromDT)} (${fFromOpt})` },
              { value: `${getDate(fToDT)} (${fToOpt})` },
              { value: fApproverFullName },
              { value: fSubstituteFullName },
              { value: fRejectType && fRejectType === REJECT_TYPE.BY_SELF? `CANCELED` : letterStatusText[fStatus] },
            ];
            if(type === userTypes.MODE_HR) row.unshift({ value: fUserFullName });
            return formatRow(row);
          })
        }],
      }
    ];

    return (
      <Fragment>
        <MuiThemeProvider theme={materialTheme}>
          <MUIDataTable
            data={tableInfo.data}
            title={tableInfo.title}
            className={classes.paper}
            columns={tableInfo.columns}
            options={tableInfo.options}
          />
        </MuiThemeProvider>
        <ExcelExporter sheets={sheets} downloadTriggerRef={this.downloadTriggerRef}/>
      </Fragment>
    );
  }
}

const styles = theme => ({
  btnLink: {
    textDecoration: 'none',
  },
  paper: {
    padding: theme.spacing.unit * 5
  },
  title: {
    textAlign: 'left',
    marginTop: theme.spacing.unit * 3,
    marginBottom: theme.spacing.unit * 3
  },
});

const mapStateToProps = state => {
  const {status, fromDate, toDate} = state.letterFilterReducers;
  return {
    filterValues: {
      status,
      fromDate,
      toDate
    }
  }
}

const mapDispatchToProps = dispatch => {
  return {
    handleShowNotif: (type, message) => dispatch(showNotification(type, message)),
    handleChangeFilterValue: (values) => dispatch(letterFilterChangeAll(values)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(
  withStyles(styles)(LetterManagement)
);
