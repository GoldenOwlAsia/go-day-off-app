import React from 'react';
import { 
  Button,
  TextField,
  Dialog, 
  DialogContent,
  DialogActions,
  DialogContentText,
  DialogTitle,
  withStyles
 } from '@material-ui/core';
import PropTypes from 'prop-types';
import { ErrorMessage } from 'formik';

const styles = theme => ({
  errorMessage: {
    color: 'red',
    fontSize: 12,
    fontWeight: 500
  },
})

const LetterCancelingDialogWithFormik = (props) => {
  const { classes, title, open, contentText, onClose, onConfirm, value, field, form} = props;
  console.log(field);
  console.log(form.touched);
  console.log(form.values);
  console.log(form.errors);
  return (
    <Dialog
      fullWidth
      open={open}
      onClose={() => console.log(`closed`)}
      aria-labelledby="letter-canceling-title"
    >
      <DialogTitle id="letter-canceling-title">{title ?  `Provide ${title} reason` : 'Provide cancel reason'}</DialogTitle>
      {contentText && contentText !== '' ? (<DialogContentText>{contentText}</DialogContentText>) : null}
      <DialogContent>
        <TextField 
          type="text"
          margin="dense"
          label="Type your reason"
          value={value}
          name={field.name}
          onBlur={field.onBlur}
          onChange={field.onChange}
          fullWidth
          multiline
        />
        <ErrorMessage name={field.name}>
        {msg => (
          <div className={classes.errorMessage}>
            {msg}
          </div>
        )}
      </ErrorMessage>
      </DialogContent>
      <DialogActions>
        <Button 
          color="secondary" 
          variant="outlined"
          className={classes.button}
          onClick={() => onClose && onClose()} 
        >  
          Cancel
        </Button>
        <Button 
          color="primary"
          variant="contained"
          className={classes.button}
          onClick={() => onConfirm && onConfirm(form)}
        >
          Send
        </Button>
      </DialogActions>
    </Dialog>
  );
}

LetterCancelingDialogWithFormik.propTypes = {
  title: PropTypes.string.isRequired,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired
}


export default withStyles(styles)(LetterCancelingDialogWithFormik);