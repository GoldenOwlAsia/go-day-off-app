import React from 'react';
import moment from 'moment';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { CancelToken } from 'axios';
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import $ from 'jquery';

import './fullCalendar.scss'
import './Calendar.css';

// api
import { getAllLetterByFilter } from '../../apiCalls/leaveLetterAPI'

// Notification redux
import {
  showNotification,
} from '../../redux/actions/notificationActions';

const mapDispatchToProps = (dispatch) => {
  return {
    handleShowNotif: (type, message) => dispatch(showNotification(type, message))
  }
}

const letterStatus = ['Pending', 'Approved', 'Cancelled'];

class Calendar extends React.Component {
  state = {
    selectedDate: moment(),
    events: [],
  };

  componentWillMount = async () => {
    this.cancelSource = CancelToken.source();

    this.setEvents();
  }

  componentDidMount = () => {
    this.__isMounted__ = true;

    $(document).ready(() => {
      $(".fc-next-button").click(() => {
        this.setState({ selectedDate: this.state.selectedDate.add(1, 'month') });

        this.setEvents();
      })

      $(".fc-prev-button").click(() => {
        this.setState({ selectedDate: this.state.selectedDate.subtract(1, 'month')  });

        this.setEvents();
      })
    })
  }

  componentWillUnmount = () => {
    this.__isMounted__ = false;
    this.cancelSource.cancel();
  }

  onEventClick = (info) => {
    const { history } = this.props;
    history.push(`/leave-request/${info.event.id}`);
  }

  setEvents = async () => {
    const { selectedDate } = this.state;
    const selectedMonth = selectedDate.month() + 1;
    const selectedYear = selectedDate.year();

    const filterData = {
      fromDay: 1,
      fromMonth: selectedMonth,
      fromYear: selectedYear,
      toDay: selectedDate.endOf('months'),
      toMonth: selectedMonth,
      toYear: selectedYear,
    }

    const res = await getAllLetterByFilter(this.cancelSource.token, filterData);
    const letters = res.data.leaveLetters;

    const events = letters.map(letter => {
      return {
        id: letter.fId,
        title: `${letter.fUserFullName} - ${letterStatus[letter.fStatus - 1]}`,
        start: letter.fFromDT.toString().substring(0, 10),
        end: moment(letter.fToDT.toString()).add(1, 'day').toISOString().substring(0, 10),
      }
    })

    this.setState({ events });
  }

  render() {
    return (
      <div style={{ borderTop: '4px solid #fac863', borderBottom: '4px solid #fac863', paddingTop: '20px' }}>
        <FullCalendar 
          themeSystem='lux' 
          defaultView="dayGridMonth" 
          plugins={[dayGridPlugin]} 
          events={this.state.events}
          eventColor={'#fac863'}
          eventTextColor={'black'}
          eventClick={this.onEventClick}
          datesRender={this.viewRender}
        />
      </div>
    );
  }
}

export default withRouter(connect(null, mapDispatchToProps)(Calendar));


/**
 * @todo `query database`
 * 1. Query all letter of parsed `userId` has fFromDT || fToDT in current month with specified status value
 * 2.
 * 2.1 Remember to compare the year
 * 2.2 For case `fFromDT`:
 * if `fToDT`.month is not same to the queried month
 *  + set `fToDT`.month to queried month
 *  + set `fToDT`.date to the last Date of queried month
 * 2.3 For case `fToDT` :
 *  if (`fFromDT`.month is not same to the queried month)
 *  + set `fFromDT`.date to the first Date of queried month
 *  + set `fToDT`.month to queried month
 */
