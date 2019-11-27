import React from 'react';
import MomentUtils from '@date-io/moment';
import { MuiPickersUtilsProvider } from 'material-ui-pickers';
import { DatePicker } from 'material-ui-pickers';

//Localization
import moment from 'moment';
import 'moment/locale/vi';

//Contants
import { DATETIME_FORMAT_1, DATETIME_LOCALE_EN } from '../../constants/form';

moment.locale(DATETIME_LOCALE_EN);

class DatePickerField extends React.Component {

  disableWeekend = (date) => {
    return date.day() === 0 || date.day() === 6;
  }

  render() {
    const {
      field,
      form,
      label,
      keyboard,
      enablePast,
      minDate,
      classes,
      showHelperText,
      ...otherProps
    } = this.props;
    const currentError = showHelperText && form.errors[field.name];
    return (
      <MuiPickersUtilsProvider utils={MomentUtils} moment={moment}>
        <DatePicker
          keyboard={keyboard && keyboard}
          disablePast={!enablePast}
          label={label}
          name={field.name}
          value={field.value}
          helperText={currentError}
          format={DATETIME_FORMAT_1}
          error={Boolean(currentError)}
          minDate={minDate && minDate}
          shouldDisableDate={this.disableWeekend}
          onChange={date => form.setFieldValue(field.name, date, true)}
          onError={(_, error) => form.setFieldError(field.name, error)}
          {...otherProps}
        />
      </MuiPickersUtilsProvider>
    );
  }
}
export default DatePickerField;
