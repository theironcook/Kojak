/* jshint -W069 */

Kojak.Formatter = {

    makeTabs: function(num){
        var tabs = '';
        for (var level = 0; level < num; level++) {
            tabs += '\t';
        }
        return tabs;
    },

    appendPadding: function(val, paddingLength){
        if(!val){
            val = '';
        }

        while(val.length < paddingLength){
            val += ' ';
        }

        return val;
    },

    number: function(num){
        var numAsString, decimals, integers, integerCount, integersWithCommas = '';
        numAsString = num.toFixed(2);
        decimals =  numAsString.substring(numAsString.indexOf('.'));
        integers = numAsString.replace(decimals, '');
        integers = integers.split('').reverse();

        for(integerCount = 0; integerCount < integers.length; integerCount++){
            integersWithCommas = integers[integerCount] + integersWithCommas;

            if((integerCount+1) < integers.length && (integerCount+1) % 3 === 0){
                integersWithCommas = ',' + integersWithCommas;
            }
        }

        if(decimals === '.00'){
            decimals = '';
        }

        return integersWithCommas + decimals;
    },

    formatReport: function(report){
        Kojak.Core.assert(Kojak.Core.isArray(report), 'Reports should be 2d string arrays');

        if(console['table']){
            Kojak.Formatter._formatReportUsingTable(report);
        }
        else {
            Kojak.Formatter._formatReportJustText(report);
        }
    },

    _formatReportJustText: function(report){
        var rowCount, row, rowString, fieldCount, fieldVal, fieldWidths = [];

        // First calculate the field widths, format numbers
        for(rowCount = 0; rowCount < report.length; rowCount++){
            row = report[rowCount];

            for(fieldCount = 0; fieldCount < row.length; fieldCount++){
                fieldVal = row[fieldCount];

                if(Kojak.Core.isNumber(fieldVal)){
                    row[fieldCount] = fieldVal = Kojak.Formatter.number(fieldVal);
                }

                fieldVal += '  ';

                if(!fieldWidths[fieldCount]){
                    fieldWidths[fieldCount] = fieldVal.length;
                }
                else if(fieldVal.length > fieldWidths[fieldCount]){
                    fieldWidths[fieldCount] = fieldVal.length;
                }
            }
        }

        // Now actually render the values with proper padding
        for(rowCount = 0; rowCount < report.length; rowCount++){
            row = report[rowCount];
            rowString = '';

            for(fieldCount = 0; fieldCount < row.length; fieldCount++){
                rowString +=  Kojak.Formatter.appendPadding(row[fieldCount], fieldWidths[fieldCount]);
            }

            console.log(rowString);
        }
    },

    _formatReportUsingTable: function(report){
        var headerRow, rowCount, row, tableReport = [], tableRow, fieldCount;

        // convert old format (I'm not re-writing that code) into a format that console.table likes / works well with
        if(report.length > 1){
            headerRow = report[0];

            for(rowCount = 1; rowCount < report.length; rowCount++){
                row = report[rowCount];
                tableRow = [];

                for(fieldCount = 0; fieldCount < row.length; fieldCount++){
                    tableRow[headerRow[fieldCount]] = row[fieldCount];
                }
                tableReport.push(tableRow);
            }

            console.table(tableReport);
            window.tr = tableReport;
        }
        else {
            // Ummmm, not sure what happened
            Kojak.Formatter._formatReportJustText(report);
        }
    }
};