// Algorithm extrapolated from http://stackoverflow.com/questions/17919263/what-is-the-excel-percentrank-algorithm-in-c --X.L.Ant

function sortNumber(a, b) {
    'use strict';
    return a - b;
}

function percentrank(arr, value) {
    'use strict';
    var sorted_array = arr.concat().sort(sortNumber),
        x1,
        x2,
        y1,
        y2,
        i;

    if (sorted_array.indexOf(value) !== -1) {
        // Checks if the value is contained in the array (should be contained)
        return (sorted_array.indexOf(value)) / (sorted_array.length - 1);
    } else {
        for (i = 0; i < sorted_array.length - 1; i = i + 1) {
            if (sorted_array[i] < value && value < sorted_array[i + 1]) {

                x1 = sorted_array[i];
                x2 = sorted_array[i + 1];
                y1 = percentrank(sorted_array, x1);
                y2 = percentrank(sorted_array, x2);


                return (((x2 - value) * y1 + (value - x1) * y2)) / (x2 - x1);
            }
        }
    }
    return "#N/A";

}

function percentrankbreaks(arr, percent) {
    'use strict';
    var sorted_array = arr.concat().sort(sortNumber),
        x1,
        x2,
        y1,
        y2,
        i;

    for (i = 0; i < sorted_array.length - 1; i = i + 1) {
      if ((i / (sorted_array.length - 1)) === percent) {
        return sorted_array[i];
      }
      if (((sorted_array[i]) / (sorted_array.length - 1)) > percent) {
        x1 = sorted_array[i];
        x2 = sorted_array[i + 1];
        y1 = (sorted_array.indexOf(x1)) / (sorted_array.length - 1);
        y2 = (sorted_array.indexOf(x2)) / (sorted_array.length - 1);

        return ((percent * (x2 - x1)) - (y1 * x2) + (y2 * x1)) / (y2 - y1);
      }
    }
    return "#N/A";

}


// Used for the following Calculations
/* Quantiles
    =PERCENTRANK(IF(K2:K17803>0,IF(K2:K17803<>"",K2:K17803,0)),K2)*100K
*/
/* Percentiles
    =PERCENTRANK(INDIRECT("k"&$I2&":k"&$J2),K2)*100
    =PERCENTRANK(IF(INDIRECT("k"&$I2&":k"&$J2)>0,IF(INDIRECT("k"&$I2&":k"&$J2)<>"",INDIRECT("k"&$I2&":k"&$J2),0)),K2)*100
*/
