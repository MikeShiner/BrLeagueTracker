import { Pipe, PipeTransform } from "@angular/core";
import * as moment from "moment";
@Pipe({
  name: "ordinalDate",
})
export class OrdinalDatePipe implements PipeTransform {
  transform(timestamp: string): string {
    if (!timestamp) {
      return "";
    }
    let value = new Date(timestamp);
    let time = moment(value).format("h:mma");
    console.log(moment);
    let ordinal = this.getOrdinalNum(value.getDate());
    let months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return `${ordinal} ${months[value.getMonth()]} ${time}`;
  }

  nth(d) {
    if (d > 3 && d < 21) return "th";
    switch (d % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  }

  private getOrdinalNum(n: number) {
    return (
      n +
      (n > 0
        ? ["th", "st", "nd", "rd"][(n > 3 && n < 21) || n % 10 > 3 ? 0 : n % 10]
        : "")
    );
  }
}
