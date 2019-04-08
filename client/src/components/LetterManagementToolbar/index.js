import React from 'react';
import { Formik, Field, Form } from 'formik';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import {
  Button,
  Grid,
} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';

//import icons
import CloudDownLoadIcon from '@material-ui/icons/CloudDownload';
import SearchIcon from '@material-ui/icons/Search';

// constants
import { 
  LEAVE_REQUEST_PENDING, 
  LEAVE_REQUEST_APPROVED, 
  LEAVE_REQUEST_REJECTED
} from '../../constants/requestStatusType';

// components
import FilterSelect from './FilterSelect';
import FilterDatePicker from '../DatePickers/FilterDatePicker';

/**
 * child component(s): 2 select-boxs for `byWhen` and `byStatus`
 * `select-box` onChange: re-call api with query params
 * 
 */

const generateInitialValue = () => {
  const currentDate = new Date();
   return {
    status: 0,
    fromDate: new Date(currentDate.getFullYear(), 0, 1), //first date of first month
    toDate: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59), //last day of current month
  }
}

class LetterManagementToolbar extends React.Component {

  handleExport = () => {
    const { onExport } = this.props;
    if(onExport) onExport(); 
  }

  render() {
    const { classes, onFilterValueChange } = this.props;
    return (
      <Formik 
        initialValues={generateInitialValue()}
        onSubmit={(values) => {
          onFilterValueChange(values)
        }}
        render={({
          values,
          handleBlur,
          handleSubmit,
          isSubmitting,
          setFieldValue,
        }) => {
          return (
            <Form className={classes.toolbar}>
            {/* Select filter From-date */}
              <Field
                name='fromDate'
                render={({ field }) => (
                  <FilterDatePicker
                    label='From'
                    variant='standard'
                    value={field.value}
                    views={['year', 'month']}
                    onChange={(value) => setFieldValue(field.name, value)}
                  />
                )}
              />
            {/* Select filter To-date */}
              <Field
                name='toDate'
                render={({ field, form }) => (
                  <FilterDatePicker
                    label='To'
                    variant='standard'
                    value={field.value}
                    views={['year', 'month']}
                    onChange={(value) => setFieldValue(field.name, value)}
                  />
                )}
              />
            {/* Select filter by Status */ }
              <Field 
                name='status'
                render={({ field, form }) => (
                  <FilterSelect 
                    label='Status'
                    variant='standard'
                    value={field.value}
                    options={[
                      { label: 'All', value: 0 },
                      { label: 'PENDING', value: LEAVE_REQUEST_PENDING },
                      { label: 'APPROVED', value: LEAVE_REQUEST_APPROVED},
                      { label: 'REJECTED', value: LEAVE_REQUEST_REJECTED },
                    ]}
                    onChange={({target: { value }}) => {
                      setFieldValue(field.name, value);
                    }}
                  />
                )}
              />
              <Button 
                size="small" 
                color='primary'
                variant="contained"
                className={classes.button}
                onClick={handleSubmit}
              >
                <SearchIcon className={classNames(classes.leftIcon, classes.iconSmall)} />
                Search
              </Button>
            {/* Button export */}
              <Button 
                size='small'
                title='Export data'
                variant='contained'
                disabled={isSubmitting}
                className={classes.button}
                onClick={this.handleExport}
              >
                <CloudDownLoadIcon className={classNames(classes.iconSmall, classes.leftIcon)} >save</CloudDownLoadIcon>
                Export
              </Button> 
            </Form>
          )
        }
        }
      />
    )
  }
}

LetterManagementToolbar.propTypes = {
  classes: PropTypes.object.isRequired
}

//styles
const styles = theme => ({
  toolbar: {
    display: 'flex',
    flexFlow: 'row wrap',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  iconSmall: {
    fontSize: 20,
  },
  leftIcon: {
    marginRight: theme.spacing.unit,
  },
  button: {
    marginRight: theme.spacing.unit,
    [theme.breakpoints.down('md')]: {
      marginTop: '5px'
    }
  }
});

export default withStyles(styles)(LetterManagementToolbar);