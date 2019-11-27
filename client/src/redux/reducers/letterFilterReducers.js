import { 
  LETTER_FILTER_CHANGE_ALL,
  LETTER_FILTER_CHANGE_FROMDATE,
  LETTER_FILTER_CHANGE_TODATE,
  LETTER_FILTER_CHANGE_STATUS,
} from '../contants/letterFilterContants';


const generateInitialValue = () => {
  const currentDate = new Date();
   return {
    status: 0,
    fromDate: new Date(currentDate.getFullYear(), 0, 1), //first date of first month
    toDate: new Date(currentDate.getFullYear(), 12, 0, 23, 59, 59), //last day of 12
  }
}

const letterFilterReducer = (state = generateInitialValue(), action) => {
  switch (action.type) {
    case LETTER_FILTER_CHANGE_ALL: {
      return {
        ...state,
        status: action.payload.status,
        fromDate: action.payload.fromDate,
        toDate: action.payload.toDate
      }
    }
    case LETTER_FILTER_CHANGE_FROMDATE: {
      return {
        ...state,
        fromDate: action.payload.fromDate
      }
    }
    case LETTER_FILTER_CHANGE_TODATE: {
      return {
        ...state,
        toDate: action.payload.toDate
      }
    }
    case LETTER_FILTER_CHANGE_STATUS: {
      return {
        ...state,
        status: action.payload.status
      }
    }
    default: 
      return {
        ...state
      }
  }
}

export default letterFilterReducer; 