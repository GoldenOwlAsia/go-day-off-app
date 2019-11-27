import * as requestStatusType  from './requestStatusType';
import { formatColumns } from "../helpers/excelFormatter";

export const letterColors = {
  [requestStatusType.LEAVE_REQUEST_PENDING]: '#ffe43a',
  [requestStatusType.LEAVE_REQUEST_APPROVED]: '#0eba25',
  [requestStatusType.LEAVE_REQUEST_REJECTED]: '#ff0000',
};

export const letterStatusText = {
  [requestStatusType.LEAVE_REQUEST_PENDING]: 'PENDING',
  [requestStatusType.LEAVE_REQUEST_APPROVED]: 'APPROVED',
  [requestStatusType.LEAVE_REQUEST_REJECTED]: 'REJECTED',
};

export const defaultColumns = [ 
  { 
    name: 'ID',
    options: { display: false,} 
  }, 
  'When', 
  'From', 
  'To', 
  {
    name:'Status',
    options: {
      setCellProps: (cellValue, rowIndex, columnIndex) => {
        if (cellValue === 'PENDING') return {
          style: {color: "#ffe43a"}
        }
  
        if (cellValue === 'APPROVED') return {
          style: {color: "#0eba25"}
        }
  
        if (cellValue === 'REJECTED' || cellValue === 'CANCEL') return {
          style: {color: "#ff0000"}
        }
      }
    }
  }
  /*, 'Actions'*/
];

export const AdminColumns = [
  { 
    name: 'ID',
    options: { display: false,} 
  },
  'Name',
  'When', 
  'From', 
  'To', 
  {
    name:'Status',
    options: {
      setCellProps: (cellValue, rowIndex, columnIndex) => {
        if (cellValue === 'PENDING') return {
          style: {color: "#ffe43a"}
        }
  
        if (cellValue === 'APPROVED') return {
          style: {color: "#0eba25"}
        }
  
        if (cellValue === 'REJECTED' || cellValue === 'CANCEL') return {
          style: {color: "#ff0000"}
        }
      }
    }
  }
  /*, 'Actions'*/
]

export const defaultExportColumns = formatColumns([
  { columnName: 'When' },
  { columnName: 'From', },
  { columnName: 'To', },
  { columnName: 'Approver', columnWidth: 200,},
  { columnName: 'Substitute', columnWidth: 200,},
  { columnName: 'Status', columnWidth: 200, },
]);
export const AdminExportColumns = formatColumns([
  { columnName: 'Name', columnWidth: 200,},
  { columnName: 'When' },
  { columnName: 'From', },
  { columnName: 'To', },
  { columnName: 'Approver', columnWidth: 200,},
  { columnName: 'Substitute', columnWidth: 200,},
  { columnName: 'Status', columnWidth: 100, },
]);

export const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];