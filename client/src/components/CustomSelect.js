import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@material-ui/core';

import shortid from 'shortid';

const styles = theme => ({
  formControl: {
    display: 'flex',
  },
});

const SelectCustom = ({
  name,
  label,
  value,
  options,
  classes,
  onChange,
  ...props
}) => {
  const selectBoxId = `select-box-${shortid.generate()}`
  return (
    <FormControl className={classes.formControl}>
    {
      (label && label.length > 0) ?
      (
        <InputLabel htmlFor={selectBoxId}>{label}</InputLabel>
      )
      : null
    }
    <Select
      name={name}
      value={value}
      onChange={onChange}
      inputProps={{id: selectBoxId}}
      {...props}
    >
      { options.map(item => (
        <MenuItem
          key={shortid.generate()}
          value={item.value}
        >{item.label}</MenuItem>
      ))}
    </Select>
  </FormControl>
  );
};

SelectCustom.propTypes = {
  classes: PropTypes.object.isRequired,
  options: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
}

export default withStyles(styles)(SelectCustom);